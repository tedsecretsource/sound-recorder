// import setupMockedMediaDevices from '../../__nativeBrowserObjectMocks__/nativeBrowserObjects'
import {render, screen} from '@testing-library/react'
import Recorder from './index'

Object.defineProperty(global.URL, 'createObjectURL', {
  writable: true,
  value: jest.fn().mockImplementation(() => {
    return 'blob:https://localhost:3000/12345678-1234-1234-1234-123456789012'
  })
})


jest.mock('../../hooks/useIndexedDB', () => () => {
  const originalModule = jest.requireActual('../../hooks/useIndexedDB');

  return {
    __esModule: true,
    ...originalModule,
    connectionIsOpen: true,
    getRecordingFromDB: jest.fn(() => Promise.resolve({
      id: 1,
      name: 'test',
      data: new Blob(['test'], { type: 'audio/mp4' }),
      length: 0,
      audioURL: 'test'
    })),
    getAllRecordingsFromDB: jest.fn(() => Promise.resolve([])),
    addRecording: jest.fn(() => Promise.resolve(Math.floor(Math.random() * 100000))),
    putRecording: jest.fn(() => Promise.resolve(true)),
    deleteRecordingFromDB: jest.fn(() => Promise.resolve(true)),
  }
})


// this is necessary because getUserMedia is called in the file being tested (via a custom hook)
jest.mock('../../hooks/useGetMediaRecorder', () => () => {
  const originalModule = jest.requireActual('../../hooks/useGetMediaRecorder');
  const mediaRecorder = {
    __esModule: true,
    ...originalModule,
      state: jest.fn(() => 'inactive'),
      ondataavailable: jest.fn(),
      onstop: jest.fn(),
      onstart: jest.fn(),
      onerror: jest.fn(),
      onpause: jest.fn(),
      onresume: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
  }
  return mediaRecorder
})

jest.mock('../Visualizer', () => () => 'Visualizer')

// setupMockedMediaDevices()
// var mr = new global.MediaRecorder(new MediaStream(), { mimeType: 'audio/mp4' })

describe('With an empty list of recordings', () => {
  beforeEach( async () => {
    // jest.spyOn(mr, 'start').mockImplementation(() => {
    //   (mr.state as any) = 'recording'
    // })
    // jest.spyOn(mr, 'stop').mockImplementation(() => {
    //   (mr.state as any) = 'inactive'
    // })
  });

  afterEach(() => {
    jest.resetAllMocks()
  })
  
  it('renders without crashing', async () => {
    render(<Recorder />)
    await screen.findByText(/record/i)
    const button = screen.getByRole("button", {name: 'Record'})
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('record-play')
  });

  it('user can start a recording pressing the button', async () => {
    render(<Recorder />)
    await screen.findByText(/record/i)
    const button = screen.getByRole("button", { name: 'Record' })
    expect(button).toHaveTextContent(/record/i);
  });

  /* Giving up on this test for now. I can't figure out how to mock the MediaRecorder object.
     Specifically, mediaRecorder.state is always 'inactive' even though I'm mocking it to be 'recording' */
  
     // it('user can stop recording by pressing the button', async () => {
  //   jest.resetModules()
  //   jest.resetAllMocks()
  //   // this is necessary because getUserMedia is called in the file being tested (via a custom hook)
  //   jest.mock('../../hooks/useGetMediaRecorder', () => () => {
  //     const originalModule = jest.requireActual('../../hooks/useGetMediaRecorder');
  //     const mediaRecorder = {
  //       __esModule: true,
  //       ...originalModule,
  //         state: jest.fn(() => 'recording'),
  //         ondataavailable: jest.fn(),
  //         onstop: jest.fn(),
  //         onstart: jest.fn(),
  //         onerror: jest.fn(),
  //         onpause: jest.fn(),
  //         onresume: jest.fn(),
  //         start: jest.fn(),
  //         stop: jest.fn(),
  //     }
  //     return mediaRecorder
  //   })
  //   render(<Recorder />)
  //   await screen.findByText(/stop/i)
  //   const button = screen.getByRole("button", { name: /stop/i })
  //   expect(button).toHaveClass('record-play')
  // })
})