import '../../__nativeBrowserObjectMocks__/nativeBrowserObjects'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RecorderControls from './index'
import { RenderRouteWithOutletContext } from '../RenderRouteWithOutletContext'

const mockStartRecording = jest.fn(() => Promise.resolve())
const mockStopRecording = jest.fn(() => Promise.resolve())

// Mock useRecordingSession context
jest.mock('../../contexts/RecordingSessionContext', () => ({
  useRecordingSession: jest.fn(() => ({
    state: {
      isRecording: false,
      currentRecordingId: null,
      elapsedTime: 0
    },
    startRecording: mockStartRecording,
    stopRecording: mockStopRecording
  }))
}))

import { useRecordingSession } from '../../contexts/RecordingSessionContext'

const mockedUseRecordingSession = useRecordingSession as jest.Mock

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
  return mr
}

describe('RecorderControls component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseRecordingSession.mockReturnValue({
      state: {
        isRecording: false,
        currentRecordingId: null,
        elapsedTime: 0
      },
      startRecording: mockStartRecording,
      stopRecording: mockStopRecording
    })
  })

  describe('with mediaRecorder available', () => {
    it('renders without crashing', async () => {
      const mockMediaRecorder = createMockMediaRecorder()
      render(
        <RenderRouteWithOutletContext context={mockMediaRecorder}>
          <RecorderControls />
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
          <RecorderControls />
        </RenderRouteWithOutletContext>
      )

      const button = screen.getByRole('button', { name: 'Record' })
      expect(button).toHaveTextContent(/record/i)

      await userEvent.click(button)

      expect(mockStartRecording).toHaveBeenCalled()
    })

    it('calls stopRecording when Stop button is clicked', async () => {
      mockedUseRecordingSession.mockReturnValue({
        state: {
          isRecording: true,
          currentRecordingId: 1,
          elapsedTime: 5
        },
        startRecording: mockStartRecording,
        stopRecording: mockStopRecording
      })

      const mockMediaRecorder = createMockMediaRecorder()
      render(
        <RenderRouteWithOutletContext context={mockMediaRecorder}>
          <RecorderControls />
        </RenderRouteWithOutletContext>
      )

      const button = screen.getByRole('button', { name: 'Stop' })
      await userEvent.click(button)

      expect(mockStopRecording).toHaveBeenCalled()
    })
  })

  describe('Loading state', () => {
    it('shows loading button when mediaRecorder is null', () => {
      render(
        <RenderRouteWithOutletContext context={null}>
          <RecorderControls />
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
      mockedUseRecordingSession.mockReturnValue({
        state: {
          isRecording: true,
          currentRecordingId: 1,
          elapsedTime: 0
        },
        startRecording: mockStartRecording,
        stopRecording: mockStopRecording
      })

      const mockMediaRecorder = createMockMediaRecorder()
      render(
        <RenderRouteWithOutletContext context={mockMediaRecorder}>
          <RecorderControls />
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
          <RecorderControls />
        </RenderRouteWithOutletContext>
      )

      const button = screen.getByRole('button', { name: 'Record' })
      expect(button).toBeInTheDocument()
      expect(button).not.toHaveClass('recording-audio')
    })
  })
})
