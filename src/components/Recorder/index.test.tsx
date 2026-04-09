import '../../__nativeBrowserObjectMocks__/nativeBrowserObjects'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RecorderControls from './index'
import { RenderRouteWithOutletContext } from '../RenderRouteWithOutletContext'

const mockStartRecording = vi.fn(() => Promise.resolve())
const mockStopRecording = vi.fn(() => Promise.resolve())

// Mock useRecordingSession context
vi.mock('../../contexts/RecordingSessionContext', () => ({
  default: {},
  useRecordingSession: vi.fn(() => ({
    state: {
      isRecording: false,
      currentRecordingId: null,
      elapsedTime: 0
    },
    startRecording: mockStartRecording,
    stopRecording: mockStopRecording
  }))
}))

// Mock useRecordings context
vi.mock('../../contexts/RecordingsContext', () => ({
  default: {},
  useRecordings: vi.fn(() => ({
    recordings: [],
    isLoading: false,
    connectionIsOpen: true,
    addRecording: vi.fn(),
    updateRecording: vi.fn(),
    deleteRecording: vi.fn(),
    refreshRecordings: vi.fn()
  }))
}))

import { useRecordingSession } from '../../contexts/RecordingSessionContext'
import { useRecordings } from '../../contexts/RecordingsContext'

const mockedUseRecordingSession = useRecordingSession as vi.Mock
const mockedUseRecordings = useRecordings as vi.Mock

const createMockMediaRecorder = (initialState = 'inactive'): any => {
  const mr: any = {
    stream: new MediaStream(),
    mimeType: 'audio/webm',
    state: initialState,
    ondataavailable: null,
    onstop: null,
    onstart: null,
    onerror: vi.fn(),
    onpause: vi.fn(),
    onresume: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }
  return mr
}

// Helper to create MediaRecorderState structure
const createMockMediaRecorderState = (mediaRecorder: any, options?: { isInitializing?: boolean, error?: string | null }) => ({
  mediaRecorder,
  isInitializing: options?.isInitializing ?? false,
  error: options?.error ?? null
})

describe('RecorderControls component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseRecordingSession.mockReturnValue({
      state: {
        isRecording: false,
        currentRecordingId: null,
        elapsedTime: 0
      },
      startRecording: mockStartRecording,
      stopRecording: mockStopRecording
    })
    mockedUseRecordings.mockReturnValue({
      recordings: [],
      isLoading: false,
      connectionIsOpen: true,
      addRecording: vi.fn(),
      updateRecording: vi.fn(),
      deleteRecording: vi.fn(),
      refreshRecordings: vi.fn()
    })
  })

  describe('with mediaRecorder available', () => {
    it('renders without crashing', async () => {
      const mockMediaRecorder = createMockMediaRecorder()
      render(
        <RenderRouteWithOutletContext context={createMockMediaRecorderState(mockMediaRecorder)}>
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
        <RenderRouteWithOutletContext context={createMockMediaRecorderState(mockMediaRecorder)}>
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
        <RenderRouteWithOutletContext context={createMockMediaRecorderState(mockMediaRecorder)}>
          <RecorderControls />
        </RenderRouteWithOutletContext>
      )

      const button = screen.getByRole('button', { name: 'Stop' })
      await userEvent.click(button)

      expect(mockStopRecording).toHaveBeenCalled()
    })
  })

  describe('Loading state', () => {
    it('shows initializing button when isInitializing is true', () => {
      render(
        <RenderRouteWithOutletContext context={createMockMediaRecorderState(null, { isInitializing: true })}>
          <RecorderControls />
        </RenderRouteWithOutletContext>
      )

      const button = screen.getByRole('button', { name: /initializing/i })
      expect(button).toBeInTheDocument()
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('title', 'Initializing microphone access...')
    })

    it('shows preparing button when connectionIsOpen is false', () => {
      mockedUseRecordings.mockReturnValue({
        recordings: [],
        isLoading: false,
        connectionIsOpen: false,
        addRecording: vi.fn(),
        updateRecording: vi.fn(),
        deleteRecording: vi.fn(),
        refreshRecordings: vi.fn()
      })

      const mockMediaRecorder = createMockMediaRecorder()
      render(
        <RenderRouteWithOutletContext context={createMockMediaRecorderState(mockMediaRecorder)}>
          <RecorderControls />
        </RenderRouteWithOutletContext>
      )

      const button = screen.getByRole('button', { name: /preparing/i })
      expect(button).toBeInTheDocument()
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('title', 'Preparing storage...')
    })

    it('shows error button when there is an error', () => {
      render(
        <RenderRouteWithOutletContext context={createMockMediaRecorderState(null, { error: 'Permission denied' })}>
          <RecorderControls />
        </RenderRouteWithOutletContext>
      )

      const button = screen.getByRole('button', { name: /microphone error/i })
      expect(button).toBeInTheDocument()
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('title', 'Permission denied')
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
        <RenderRouteWithOutletContext context={createMockMediaRecorderState(mockMediaRecorder)}>
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
        <RenderRouteWithOutletContext context={createMockMediaRecorderState(mockMediaRecorder)}>
          <RecorderControls />
        </RenderRouteWithOutletContext>
      )

      const button = screen.getByRole('button', { name: 'Record' })
      expect(button).toBeInTheDocument()
      expect(button).not.toHaveClass('recording-audio')
    })
  })

  describe('Time counter', () => {
    it('displays 00:00:00 when not recording', () => {
      const mockMediaRecorder = createMockMediaRecorder()
      render(
        <RenderRouteWithOutletContext context={createMockMediaRecorderState(mockMediaRecorder)}>
          <RecorderControls />
        </RenderRouteWithOutletContext>
      )

      expect(screen.getByText('00:00:00')).toBeInTheDocument()
    })

    it('displays formatted elapsed time when recording', () => {
      mockedUseRecordingSession.mockReturnValue({
        state: {
          isRecording: true,
          currentRecordingId: 1,
          elapsedTime: 125
        },
        startRecording: mockStartRecording,
        stopRecording: mockStopRecording
      })

      const mockMediaRecorder = createMockMediaRecorder()
      render(
        <RenderRouteWithOutletContext context={createMockMediaRecorderState(mockMediaRecorder)}>
          <RecorderControls />
        </RenderRouteWithOutletContext>
      )

      expect(screen.getByText('00:02:05')).toBeInTheDocument()
    })

    it('displays time with hours when elapsed time exceeds an hour', () => {
      mockedUseRecordingSession.mockReturnValue({
        state: {
          isRecording: true,
          currentRecordingId: 1,
          elapsedTime: 3661
        },
        startRecording: mockStartRecording,
        stopRecording: mockStopRecording
      })

      const mockMediaRecorder = createMockMediaRecorder()
      render(
        <RenderRouteWithOutletContext context={createMockMediaRecorderState(mockMediaRecorder)}>
          <RecorderControls />
        </RenderRouteWithOutletContext>
      )

      expect(screen.getByText('01:01:01')).toBeInTheDocument()
    })
  })
})
