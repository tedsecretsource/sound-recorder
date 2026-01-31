import '../../__nativeBrowserObjectMocks__/nativeBrowserObjects'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RecordingsList from './index'

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

const mockUpdateRecording = jest.fn(() => Promise.resolve())
const mockDeleteRecording = jest.fn(() => Promise.resolve())

// Variables prefixed with 'mock' are allowed in jest.mock
let mockRecordingsData = [...mockThreeRecordings]
let mockMediaRecorderData: any = {
  start: jest.fn(),
  stop: jest.fn(),
  state: 'inactive',
  mimeType: 'audio/webm',
  ondataavailable: jest.fn(),
  onstop: jest.fn(),
  onstart: jest.fn(),
}

jest.mock('../../App', () => ({
  useMediaRecorder: () => mockMediaRecorderData
}))

jest.mock('../../contexts/RecordingsContext', () => ({
  useRecordings: () => ({
    recordings: mockRecordingsData,
    isLoading: false,
    connectionIsOpen: true,
    addRecording: jest.fn(() => Promise.resolve(1)),
    updateRecording: mockUpdateRecording,
    deleteRecording: mockDeleteRecording,
    refreshRecordings: jest.fn(() => Promise.resolve()),
  })
}))

const user = userEvent

describe('RecordingsList', () => {
  const originalPrompt = global.prompt
  const originalConfirm = global.confirm
  const mockPrompt = jest.fn()
  const mockConfirm = jest.fn()

  beforeAll(() => {
    global.prompt = mockPrompt
    global.confirm = mockConfirm
  })

  beforeEach(() => {
    mockRecordingsData = [...mockThreeRecordings]
    mockPrompt.mockReturnValue('new recording name')
    mockConfirm.mockReturnValue(true)
    mockMediaRecorderData = {
      start: jest.fn(),
      stop: jest.fn(),
      state: 'inactive',
      mimeType: 'audio/webm',
      ondataavailable: jest.fn(),
      onstop: jest.fn(),
      onstart: jest.fn(),
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    global.prompt = originalPrompt
    global.confirm = originalConfirm
  })

  describe('With a list of recordings', () => {
    it('a recording can be renamed', async () => {
      render(<RecordingsList />)
      await screen.findAllByRole('button', { name: /click to edit name/i })
      const recordings = screen.getAllByRole('button', { name: /click to edit name/i })
      const firstEditButton = recordings[0]

      // eslint-disable-next-line testing-library/no-unnecessary-act
      await act(async () => {
        await user.click(firstEditButton)
      })
      expect(mockPrompt).toHaveBeenCalledTimes(1)
      expect(mockUpdateRecording).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'new recording name' })
      )
    })

    it('a recording can be deleted', async () => {
      render(<RecordingsList />)
      await screen.findAllByRole('button', { name: /delete/i })
      const recordings = screen.getAllByRole('button', { name: /delete/i })
      expect(recordings).toHaveLength(3)

      // eslint-disable-next-line testing-library/no-unnecessary-act
      await act(async () => {
        user.click(recordings[0])
      })
      const updatedRecordingsWrapper = screen.queryAllByRole('article')
      expect(mockConfirm).toHaveBeenCalledTimes(1)
      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this recording?')
      expect(mockConfirm).toHaveReturned()
      expect(updatedRecordingsWrapper[0]).toHaveClass('vanish')
    })

    it('user cancels rename (prompt returns null)', async () => {
      mockPrompt.mockReturnValue(null)
      render(<RecordingsList />)
      const editButtons = screen.getAllByRole('button', { name: /click to edit name/i })

      // eslint-disable-next-line testing-library/no-unnecessary-act
      await act(async () => {
        await user.click(editButtons[0])
      })

      expect(mockPrompt).toHaveBeenCalled()
      // updateRecording should still be called with original name (fallback behavior)
      // Note: recordings are displayed in reverse order, so first button is for test3
      expect(mockUpdateRecording).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'test3' })
      )
    })

    it('user enters invalid name (blank)', async () => {
      mockPrompt.mockReturnValue('   ')
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation(() => {})

      render(<RecordingsList />)
      const editButtons = screen.getAllByRole('button', { name: /click to edit name/i })

      // eslint-disable-next-line testing-library/no-unnecessary-act
      await act(async () => {
        await user.click(editButtons[0])
      })

      expect(consoleSpy).toHaveBeenCalledWith('The name must not be blank and less than 500 characters.')
      expect(mockUpdateRecording).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('user enters invalid name (>500 chars)', async () => {
      mockPrompt.mockReturnValue('a'.repeat(501))
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation(() => {})

      render(<RecordingsList />)
      const editButtons = screen.getAllByRole('button', { name: /click to edit name/i })

      // eslint-disable-next-line testing-library/no-unnecessary-act
      await act(async () => {
        await user.click(editButtons[0])
      })

      expect(consoleSpy).toHaveBeenCalledWith('The name must not be blank and less than 500 characters.')
      expect(mockUpdateRecording).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('user cancels delete confirmation', async () => {
      mockConfirm.mockReturnValue(false)
      render(<RecordingsList />)
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })

      // eslint-disable-next-line testing-library/no-unnecessary-act
      await act(async () => {
        await user.click(deleteButtons[0])
      })

      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this recording?')
      expect(mockDeleteRecording).not.toHaveBeenCalled()
    })

    it('recordings are displayed in reverse order', () => {
      render(<RecordingsList />)
      const names = screen.getAllByRole('presentation')

      // Recordings should be displayed with most recent (highest id) first
      expect(names[0]).toHaveTextContent('test3')
      expect(names[1]).toHaveTextContent('test2')
      expect(names[2]).toHaveTextContent('test')
    })
  })

  describe('Loading state', () => {
    it('shows loading message when mediaRecorder is null', () => {
      mockMediaRecorderData = null
      render(<RecordingsList />)
      expect(screen.getByText(/loading recordings/i)).toBeInTheDocument()
    })
  })

  describe('Empty recordings list', () => {
    it('renders nothing when recordings list is empty', () => {
      mockRecordingsData = []
      render(<RecordingsList />)
      expect(screen.queryAllByRole('article')).toHaveLength(0)
    })
  })
})
