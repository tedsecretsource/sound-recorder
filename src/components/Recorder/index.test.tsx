import setupMockedMediaDevices from '../../__nativeBrowserObjectMocks__/nativeBrowserObjects'
import {act, render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Recorder from './index'

jest.mock('../Visualizer', () => () => 'Visualizer')
const user = userEvent.setup()

setupMockedMediaDevices()
var mr = new global.MediaRecorder(new MediaStream(), { mimeType: 'audio/mp4' })

describe('With an empty list of recordings', () => {
  beforeEach( () => {
    jest.spyOn(mr, 'start').mockImplementation(() => {
      mr.state = 'recording'
    })
    jest.spyOn(mr, 'stop').mockImplementation(() => {
      mr.state = 'inactive'
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
    let recordings = screen.getAllByTitle(/click to edit name/i)
    expect(recordings).toHaveLength(1)
    await user.click(button)
    expect(button).toHaveTextContent(/stop/i)
    await user.click(button)
    expect(button).toHaveTextContent(/record/i)
    recordings = screen.getAllByTitle(/click to edit name/i)
    expect(recordings).toHaveLength(2)
  })
})

describe('With a list of recordings', () => {
  const originalPrompt = global.prompt
  const originalConfirm = global.confirm
  const mockPrompt = jest.fn()
  const mockConfirm = jest.fn()

  beforeAll(() => {
    global.prompt = mockPrompt
    global.confirm = mockConfirm
  })

  beforeEach( async () => {
    mockPrompt.mockReturnValue("new recording name")
    mockConfirm.mockReturnValue(true)

    jest.spyOn(mr, 'start').mockImplementation(() => {
      mr.state = 'recording'
    })
    jest.spyOn(mr, 'stop').mockImplementation(() => {
      mr.state = 'inactive'
    })
    act(() => {
      render(<Recorder mediaRecorder={mr} />);
    })
  })

  afterAll(() => {
    global.prompt = originalPrompt
    global.confirm = originalConfirm
  })

  it('renders all of the recordings on screen', async () => {
    const recButton = screen.getByRole("button", { name: 'Record' })
    await user.click(recButton)
    await user.click(recButton)
    await user.click(recButton)
    await user.click(recButton)
    await user.click(recButton)
    await user.click(recButton)
    const recordings = screen.getAllByRole("button", { name: /click to edit name/i })
    expect(recordings).toHaveLength(3)
  })

  it('a new recording can be created', async () => {
    const recButton = screen.getByRole("button", { name: 'Record' })
    await user.click(recButton)
    await user.click(recButton)
    await user.click(recButton)
    await user.click(recButton)
    await user.click(recButton)
    await user.click(recButton)
    const recordings = screen.getAllByRole("button", { name: /click to edit name/i })
    expect(recordings).toHaveLength(3)

    const button = screen.getByRole("button", { name: /record/i })
    await user.click(button)
    expect(button).toHaveTextContent(/stop/i)
    await user.click(button)
    expect(button).toHaveTextContent(/record/i)

    const newRecordings = screen.getAllByTitle(/click to edit name/i)
    expect(newRecordings).toHaveLength(recordings.length + 1)
  })

  it('a recording can be renamed', async () => {
    const recButton = screen.getByRole("button", { name: 'Record' })
    await user.click(recButton)
    await user.click(recButton)
    const recordings = screen.getAllByRole("button", { name: /click to edit name/i })
    const firstEditButton = recordings[0];

    await user.click(firstEditButton);
    expect(mockPrompt).toHaveBeenCalledTimes(1)

    const updatedRecording = await screen.findByText(/new recording name/i);
    expect(updatedRecording).toBeInTheDocument()
  })

  it('a recording can be deleted', async () => {
    const recButton = screen.getByRole("button", { name: 'Record' })
    await user.click(recButton)
    await user.click(recButton)
    const recordings = screen.getAllByRole("button", { name: /delete/i })
    expect(recordings).toHaveLength(1)
    await user.click(recordings[0]);

    const updatedRecordingsWrapper = screen.queryAllByRole("article")
    expect(mockConfirm).toHaveBeenCalledTimes(1)
    expect(mockConfirm).toHaveBeenCalledWith("Are you sure you want to delete this recording?")
    expect(mockConfirm).toHaveReturned()
    expect(updatedRecordingsWrapper[0]).toHaveClass('vanish')
  })
})
