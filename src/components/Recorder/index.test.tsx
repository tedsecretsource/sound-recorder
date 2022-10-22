import setupMockedMediaDevices from '../../__nativeBrowserObjectMocks__/nativeBrowserObjects'
import {act, render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Recorder from './index'

jest.mock('../Visualizer', () => () => 'Visualizer')
// jest.mock('./index', () => {
//   const originaRecorder = jest.requireActual('./index')
//   return {
//     __esModule: true,
//     ...originaRecorder,
//     renderAudio: jest.fn().mockImplementation(() => {
//       return <div>Recorder</div>
//     }),
//   }
// })

/**
 * Following the Object mother pattern we have this small fn that generates a valid object
 * that matches the structure of a recording
 *
 * @param {{ idNumber?: number, name?: string }} options
 * @returns {{ stream: string, name: string, id: string }}
 */
function createMockRecording({
  idNumber = Math.floor(Math.random() * 100),
  name = new Date().toISOString().split('.')[0].split('T').join(' ')
}) {
  return {
    stream: "audioUrl",
    name,
    id: `id${window.performance.now().toString()}`
  }
}

/**
 * Applying the same pattern above we wrap the previous recording generator
 * to create a random list of recordings
 *
 * @param {number} length
 * @returns {{ stream: string, name: string, id: string }[]}
 */
function createMockRecordingList(length = 10) {
  const emptyList = new Array(length).fill(null);
  return emptyList.map(() => createMockRecording({}))
}

const user = userEvent.setup()


setupMockedMediaDevices()
var mr = new global.MediaRecorder(new MediaStream(), { mimeType: 'audio/mp4' })

describe('With an empty list of recordings', () => {
  beforeEach( () => {
    // jest.spyOn(mr, 'start').mockImplementation(() => {mr.state = 'recording'})
    // jest.spyOn(mr, 'stop').mockImplementation(() => {
    //   mr.state = 'inactive'
    // })
    const startEvent = new Event('start')
    const stopEvent = new Event('stop')
    const originalStart = mr.start
    const originalStop = mr.stop
    mr.addEventListener('start', mr.onstart)
    jest.spyOn(mr, 'start').mockImplementation(() => {
      // mr.state = 'recording'
      mr.dispatchEvent(startEvent)
      // originalStart()
    })
    act(() => {
      render(<Recorder mediaRecorder={mr} />);
    })
  });
  
  it('renders without crashing', () => {
    const button = screen.getByRole("button", {name: 'Record'});
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('record-play')
  });
  
  it('user can start a recording pressing the button', async () => {
    const button = screen.getByRole("button", { name: 'Record' })
    expect(button).toHaveClass('record-play')
    await user.click(button)
    expect(button).toHaveTextContent(/stop/i);
    await user.click(button)
  });

  it('record button turns red while recording', async () => {
    const button = screen.getByRole("button", { name: /record/i });
    expect(button).toHaveClass('record-play')
    await user.click(button)
    expect(button).toHaveClass('record-play', 'recording-audio')
    await user.click(button)
  })

  it('adds a new recording to the list when the user clicks stop', async () => {
    const button = screen.getByRole("button", { name: 'Record' })
    await user.click(button)
    expect(button).toHaveTextContent(/stop/i)
    await user.click(button)
    expect(button).toHaveTextContent(/record/i)
    const recordings = screen.getAllByTitle(/click to edit name/i)
    expect(recordings).toHaveLength(1)
  })
})

describe('With a list of recordings', () => {
  const recordingsList = createMockRecordingList()

  const originalPrompt = global.prompt
  const originalConfirm = global.confirm
  const mockPrompt = jest.fn()
  const mockConfirm = jest.fn()

  beforeAll(() => {
    global.prompt = mockPrompt
    global.confirm = mockConfirm
  })

  beforeEach( async () => {
    setupMockedMediaDevices()
    mockPrompt.mockReturnValue("new recording name")
    mockConfirm.mockReturnValue(true)

    let mr = new MediaRecorder(new MediaStream(), { mimeType: 'audio/mp4' })
    act(() => {
      render(<Recorder mediaRecorder={mr} />);
    })
  })

  afterAll(() => {
    global.prompt = originalPrompt
    global.confirm = originalConfirm
  })

  it('renders all of the recordings on screen', () => {
    const recordings = screen.getAllByRole("button", { name: /click to edit name/i })
    expect(recordings).toHaveLength(recordingsList.length)
  })

  it('a new recording can be created', () => {
    const recordings = screen.getAllByRole("button", { name: /click to edit name/i })
    expect(recordings).toHaveLength(recordingsList.length)

    const button = screen.getByRole("button", { name: /record/i })
    user.click(button)
    expect(button).toHaveTextContent(/stop/i)
    user.click(button)
    expect(button).toHaveTextContent(/record/i)

    const newRecordings = screen.getAllByTitle(/click to edit name/i)
    expect(newRecordings).toHaveLength(recordings.length + 1)
  })

  it('a recording can be renamed', async () => {
    const recordings = screen.getAllByRole("button", { name: /click to edit name/i })
    const firstEditButton = recordings[0];

    user.click(firstEditButton);
    expect(mockPrompt).toHaveBeenCalledTimes(1)

    const updatedRecording = await screen.findByText(/new recording name/i);
    expect(updatedRecording).toBeInTheDocument()
  })

  it('a recording can be deleted', () => {
    const recordings = screen.getAllByRole("button", { name: /delete/i })
    expect(recordings).toHaveLength(recordingsList.length)
    user.click(recordings[0]);

    const updatedRecordingsWrapper = screen.queryAllByRole("article")
    expect(mockConfirm).toHaveBeenCalledTimes(1)
    expect(mockConfirm).toHaveBeenCalledWith("Are you sure you want to delete this recording?")
    expect(mockConfirm).toHaveReturned()
    expect(updatedRecordingsWrapper[0]).toHaveClass('vanish')
  })
})
