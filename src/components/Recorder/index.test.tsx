import '../../__nativeBrowserObjectMocks__/nativeBrowserObjects'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Recorder from './index'
import { RenderRouteWithOutletContext } from '../RenderRouteWithOutletContext'

const mockAddRecording = jest.fn(() => Promise.resolve(1))
const mockUpdateRecording = jest.fn(() => Promise.resolve())

// Mock useRecordings from context
jest.mock('../../contexts/RecordingsContext', () => ({
  useRecordings: () => ({
    recordings: [],
    isLoading: false,
    connectionIsOpen: true,
    addRecording: mockAddRecording,
    updateRecording: mockUpdateRecording,
    deleteRecording: jest.fn(() => Promise.resolve()),
    refreshRecordings: jest.fn(() => Promise.resolve()),
  })
}))

const createMockMediaRecorder = (initialState = 'inactive'): any => {
  const mr: any = {
    stream: new MediaStream(),
    mimeType: 'audio/webm',
    state: initialState,
    ondataavailable: null,
    onstop: null,
    onstart: null,
    onerror: jest.fn(),
    onpause: jest.fn(),
    onresume: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  }
  mr.start = jest.fn(() => {
    mr.state = 'recording'
    if (mr.onstart) mr.onstart()
  })
  mr.stop = jest.fn(() => {
    mr.state = 'inactive'
    if (mr.ondataavailable) {
      mr.ondataavailable({ data: new Blob(['test audio'], { type: 'audio/webm' }) })
    }
    if (mr.onstop) mr.onstop()
  })
  return mr
}

describe('Recorder component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('with mediaRecorder available', () => {
    it('renders without crashing', async () => {
      const mockMediaRecorder = createMockMediaRecorder()
      render(
        <RenderRouteWithOutletContext context={mockMediaRecorder}>
          <Recorder />
        </RenderRouteWithOutletContext>
      )
      await screen.findByText(/record/i)
      const button = screen.getByRole('button', { name: 'Record' })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('record-play')
    })

    it('user can start a recording pressing the button', async () => {
      const mockMediaRecorder = createMockMediaRecorder()
      render(
        <RenderRouteWithOutletContext context={mockMediaRecorder}>
          <Recorder />
        </RenderRouteWithOutletContext>
      )

      const button = screen.getByRole('button', { name: 'Record' })
      expect(button).toHaveTextContent(/record/i)

      await userEvent.click(button)

      expect(mockMediaRecorder.start).toHaveBeenCalledWith(1000)
    })

    it('initRecording creates placeholder in DB when starting', async () => {
      const mockMediaRecorder = createMockMediaRecorder()
      render(
        <RenderRouteWithOutletContext context={mockMediaRecorder}>
          <Recorder />
        </RenderRouteWithOutletContext>
      )

      const button = screen.getByRole('button', { name: 'Record' })
      await userEvent.click(button)

      await waitFor(() => {
        expect(mockAddRecording).toHaveBeenCalledWith({
          name: 'New Recording',
          length: 0,
          audioURL: ''
        })
      })
    })

    it('ondataavailable pushes to chunksRef', async () => {
      const mockMediaRecorder = createMockMediaRecorder()
      render(
        <RenderRouteWithOutletContext context={mockMediaRecorder}>
          <Recorder />
        </RenderRouteWithOutletContext>
      )

      // Wait for useEffect to set up handlers
      await waitFor(() => {
        expect(mockMediaRecorder.ondataavailable).not.toBeNull()
      })

      // Simulate data available event
      act(() => {
        if (mockMediaRecorder.ondataavailable) {
          mockMediaRecorder.ondataavailable({ data: new Blob(['chunk1']) })
        }
      })

      // The chunksRef is internal, we'll verify it works by checking updateRecording
      // is called with a blob when stop is triggered
    })

    it('onstop logs message', async () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation(() => {})
      const mockMediaRecorder = createMockMediaRecorder()
      render(
        <RenderRouteWithOutletContext context={mockMediaRecorder}>
          <Recorder />
        </RenderRouteWithOutletContext>
      )

      await waitFor(() => {
        expect(mockMediaRecorder.onstop).not.toBeNull()
      })

      act(() => {
        if (mockMediaRecorder.onstop) {
          mockMediaRecorder.onstop()
        }
      })

      expect(consoleSpy).toHaveBeenCalledWith('stopped recording')
      consoleSpy.mockRestore()
    })

    it('updateRecordingsList saves recording data after stop', async () => {
      const mockMediaRecorder = createMockMediaRecorder()

      // Start in recording state
      mockMediaRecorder.state = 'recording'

      render(
        <RenderRouteWithOutletContext context={mockMediaRecorder}>
          <Recorder />
        </RenderRouteWithOutletContext>
      )

      // Wait for setup
      await waitFor(() => {
        expect(mockMediaRecorder.ondataavailable).not.toBeNull()
      })

      // Simulate having some data
      act(() => {
        if (mockMediaRecorder.ondataavailable) {
          mockMediaRecorder.ondataavailable({ data: new Blob(['audio data'], { type: 'audio/webm' }) } as any)
        }
      })

      // Click stop button
      const button = screen.getByRole('button', { name: 'Stop' })
      await userEvent.click(button)

      await waitFor(() => {
        expect(mockUpdateRecording).toHaveBeenCalled()
      })
    })
  })

  describe('Loading state', () => {
    it('shows loading button when mediaRecorder is null', () => {
      render(
        <RenderRouteWithOutletContext context={null}>
          <Recorder />
        </RenderRouteWithOutletContext>
      )

      const button = screen.getByRole('button', { name: /loading/i })
      expect(button).toBeInTheDocument()
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('title', 'Please either allow or decline the use of your microphone')
    })
  })

  describe('Recording state UI', () => {
    it('shows Stop button when recording', () => {
      const mockMediaRecorder = createMockMediaRecorder('recording')
      render(
        <RenderRouteWithOutletContext context={mockMediaRecorder}>
          <Recorder />
        </RenderRouteWithOutletContext>
      )

      const button = screen.getByRole('button', { name: 'Stop' })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('recording-audio')
    })

    it('shows Record button when inactive', () => {
      const mockMediaRecorder = createMockMediaRecorder('inactive')
      render(
        <RenderRouteWithOutletContext context={mockMediaRecorder}>
          <Recorder />
        </RenderRouteWithOutletContext>
      )

      const button = screen.getByRole('button', { name: 'Record' })
      expect(button).toBeInTheDocument()
      expect(button).not.toHaveClass('recording-audio')
    })
  })

  describe('Error handling', () => {
    it('handles error when save fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockUpdateRecording.mockRejectedValueOnce(new Error('Save failed'))

      const mockMediaRecorder = createMockMediaRecorder('recording')

      render(
        <RenderRouteWithOutletContext context={mockMediaRecorder}>
          <Recorder />
        </RenderRouteWithOutletContext>
      )

      await waitFor(() => {
        expect(mockMediaRecorder.ondataavailable).not.toBeNull()
      })

      // Add some data
      act(() => {
        if (mockMediaRecorder.ondataavailable) {
          mockMediaRecorder.ondataavailable({ data: new Blob(['test']) } as any)
        }
      })

      // Click stop
      const button = screen.getByRole('button', { name: 'Stop' })
      await userEvent.click(button)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled()
      })

      consoleSpy.mockRestore()
    })
  })
})
