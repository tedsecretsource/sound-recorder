import React, {useState} from 'react';
import {fireEvent, render, screen} from '@testing-library/react'
import Recorder from './index'
import useMediaRecorder from "../../hooks/useMediaRecorder"
import useInitMediaRecorder from "../../hooks/useInitMediaRecorder"
import useConfigureMediaRecorder from "../../hooks/useConfigureMediaRecroder"

jest.mock('../../hooks/useMediaRecorder')
jest.mock('../Visualizer', () => () => 'Visualizer')
jest.mock('../../hooks/useInitMediaRecorder', () => {
  return ({
    ondataavailable: jest.fn(),
    audioBitrateMode: "variable",
    audioBitsPerSecond: 0,
    onstop: jest.fn(),
    onstart: jest.fn(),
    onerror: jest.fn(),
    onpause: jest.fn(),
    onresume: jest.fn(),
    state: 'recording',
    mimeType: 'audio/webm',
    stream: MediaStream
  })
})

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

/**
 * We create a mocked version of our hook that will interact with the component in the same exact way
 * and will expose the same API too.
 *
 * This mock is typically placed in the same directory of the original hook within a folder called `__mocks__`
 * keeping the same file name as the original and jest will override the hook functionality automatically.
 * But in this case we would loose the option to pass it a default list of recordings or would be more difficult to do so.
 *
 * @param {{ stream: string, name: string, id: string }[]} defaultRecordings
 * An optional list of default recordings to that we don't need to interact with the component to create a previous list of recordings
 * having also control over the data of each one to be able to assert on the list data.
 *
 * @returns {{
 *  recorder: { stop: Function, start: Function },
 *  isRecording: boolean,
 *  recordings: any[],
 *  setRecordings: Function
 * }}
 */
const mockUseMediaRecorder = (defaultRecordings = []) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [isRecording, setIsRecording] = useState(false)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [recordings, setRecordings] = useState(defaultRecordings)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [stream, setStream] = useState<MediaStream | null>(null)

  const recorder = {
    start: () => setIsRecording(true),
    stop: () => {
      setRecordings(currentList => [...currentList, createMockRecording({ idNumber: currentList.length })])
      setIsRecording(false)
    },
  };

  return {recorder, recordings, setRecordings, isRecording, stream}
};

describe('With an empty list of recordings', () => {
  beforeEach(() => {
    window.MediaStream = jest.fn().mockImplementation(() => ({
      addTrack: jest.fn()
    }))
    useMediaRecorder.mockImplementation(() => mockUseMediaRecorder());
    render(<Recorder />);
  });

  it('renders without crashing', () => {
    const button = screen.getByRole("button", {name: 'Record'});
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('record-play')
  });

  it('user can start a recording pressing the button', () => {
    const button = screen.getByRole("button", { name: 'Record' })
    expect(button).toHaveClass('record-play')
    fireEvent.click(button)
    expect(button).toHaveTextContent(/stop/i);
  });

  it('record button turns red while recording', () => {
    const button = screen.getByRole("button", { name: /record/i });
    expect(button).toHaveClass('record-play')
    fireEvent.click(button)
    expect(button).toHaveClass('record-play', 'recording-audio')
  })

  it('adds a new recording to the list when the user clicks stop', () => {
    const button = screen.getByRole("button", { name: 'Record' })
    fireEvent.click(button)
    expect(button).toHaveTextContent(/stop/i)
    fireEvent.click(button)
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

  beforeEach(() => {
    useMediaRecorder.mockImplementation(() => mockUseMediaRecorder(recordingsList))
    mockPrompt.mockReturnValue("new recording name")
    mockConfirm.mockReturnValue(true)

    render(<Recorder />)
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
    fireEvent.click(button)
    expect(button).toHaveTextContent(/stop/i)
    fireEvent.click(button)
    expect(button).toHaveTextContent(/record/i)

    const newRecordings = screen.getAllByTitle(/click to edit name/i)
    expect(newRecordings).toHaveLength(recordings.length + 1)
  })

  it('a recording can be renamed', async () => {
    const recordings = screen.getAllByRole("button", { name: /click to edit name/i })
    const firstEditButton = recordings[0];

    fireEvent.click(firstEditButton);
    expect(mockPrompt).toHaveBeenCalledTimes(1)

    const updatedRecording = await screen.findByText(/new recording name/i);
    expect(updatedRecording).toBeInTheDocument()
  })

  it('a recording can be deleted', () => {
    const recordings = screen.getAllByRole("button", { name: /delete/i })
    expect(recordings).toHaveLength(recordingsList.length)
    fireEvent.click(recordings[0]);

    const updatedRecordingsWrapper = screen.queryAllByRole("article")
    expect(mockConfirm).toHaveBeenCalledTimes(1)
    expect(mockConfirm).toHaveBeenCalledWith("Are you sure you want to delete this recording?")
    expect(mockConfirm).toHaveReturned()
    expect(updatedRecordingsWrapper[0]).toHaveClass('vanish')
  })
})
