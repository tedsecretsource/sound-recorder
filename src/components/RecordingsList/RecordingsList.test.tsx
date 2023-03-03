import setupMockedMediaDevices from '../../__nativeBrowserObjectMocks__/nativeBrowserObjects'
import {act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RecordingsList from './RecordingsList'
// import useIndexedDB from '../../hooks/useIndexedDB'

// this is necessary because getUserMedia is called in the file being tested (via a custom hook)
jest.mock('../../hooks/useGetMediaRecorder', () => () => {
  const originalModule = jest.requireActual('../../hooks/useGetMediaRecorder');
  return {
    __esModule: true,
    ...originalModule,
    mediaRecorder: {
      start: jest.fn(),
      stop: jest.fn(),
      state: 'inactive',
      ondataavailable: jest.fn(),
      onstop: jest.fn(),
      onstart: jest.fn(),
      onerror: jest.fn(),
      onpause: jest.fn(),
      onresume: jest.fn(),
    }
  }
})

const mockThreeRecordings = [
  {
    id: 1,
    name: 'test',
    data: new Blob(['test'], { type: 'audio/mp4' }),
    length: 0,
    audioURL: 'test'
  },
  {
    id: 2,
    name: 'test2',
    data: new Blob(['test2'], { type: 'audio/mp4' }),
    length: 0,
    audioURL: 'test2'
  },
  {
    id: 3,
    name: 'test3',
    data: new Blob(['test3'], { type: 'audio/mp4' }),
    length: 0,
    audioURL: 'test3'
  }
]

// this is necessary because we call functions returned by this hook in this file
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
        getAllRecordingsFromDB: jest.fn(() => Promise.resolve(mockThreeRecordings)),
        addRecording: jest.fn(() => Promise.resolve(Math.floor(Math.random() * 100000))),
        putRecording: jest.fn(() => Promise.resolve(true)),
        deleteRecordingFromDB: jest.fn(() => Promise.resolve(true)),
    }
})
  
  const user = userEvent
  
  setupMockedMediaDevices()

  describe('With a list of recordings', () => {
    const originalPrompt = global.prompt
    const originalConfirm = global.confirm
    const mockPrompt = jest.fn(() => {
      mockThreeRecordings[0].name = "new recording name"
      return "new recording name"
    })
    const mockConfirm = jest.fn()
  
    beforeAll(() => {
      global.prompt = mockPrompt
      global.confirm = mockConfirm
    })
  
    beforeEach( async () => {
      mockPrompt.mockReturnValue("new recording name")
      mockConfirm.mockReturnValue(true)
    })
  
    afterEach(() => {
      jest.resetAllMocks()
    })
    
    afterAll(() => {
      global.prompt = originalPrompt
      global.confirm = originalConfirm
    })

    // this does not currently test the renaming in the database
    it('a recording can be renamed', async () => {
      render(<RecordingsList />)
      await screen.findAllByRole("button", { name: /click to edit name/i }) 
      const recordings = screen.getAllByRole("button", { name: /click to edit name/i })
      const firstEditButton = recordings[0];
      
      act( () => {
        user.click(firstEditButton);
      })
      expect(mockPrompt).toHaveBeenCalledTimes(1)

      return screen.findByText(/new recording name/i)
      .then((el) => {
        expect(el).toBeInTheDocument()
      })
    })

    it('a recording can be deleted', async () => {
      render(<RecordingsList />)
      await screen.findAllByRole("button", { name: /delete/i }) 
      const recordings = screen.getAllByRole("button", { name: /delete/i })
      expect(recordings).toHaveLength(3)

      // eslint-disable-next-line testing-library/no-unnecessary-act
      await act(async () => {
        user.click(recordings[0]);
      })
      const updatedRecordingsWrapper = screen.queryAllByRole("article")
      expect(mockConfirm).toHaveBeenCalledTimes(1)
      expect(mockConfirm).toHaveBeenCalledWith("Are you sure you want to delete this recording?")
      expect(mockConfirm).toHaveReturned()
      expect(updatedRecordingsWrapper[0]).toHaveClass('vanish')
    })
})
  