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

// Mock useRecordings context
jest.mock('../../contexts/RecordingsContext', () => ({
  useRecordings: jest.fn(() => ({
    recordings: [],
    isLoading: false,
    connectionIsOpen: true,
    addRecording: jest.fn(),
    updateRecording: jest.fn(),
    deleteRecording: jest.fn(),
    refreshRecordings: jest.fn()
  }))
}))

import { useRecordingSession } from '../../contexts/RecordingSessionContext'
import { useRecordings } from '../../contexts/RecordingsContext'

const mockedUseRecordingSession = useRecordingSession as jest.Mock
const mockedUseRecordings = useRecordings as jest.Mock

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

// Helper to create MediaRecorderState structure
const createMockMediaRecorderState = (mediaRecorder: any, options?: { isInitializing?: boolean, error?: string | null }) => ({
  mediaRecorder,
  isInitializing: options?.isInitializing ?? false,
  error: options?.error ?? null
})

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
    mockedUseRecordings.mockReturnValue({
      recordings: [],
      isLoading: false,
      connectionIsOpen: true,
      addRecording: jest.fn(),
      updateRecording: jest.fn(),
      deleteRecording: jest.fn(),
      refreshRecordings: jest.fn()
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
        addRecording: jest.fn(),
        updateRecording: jest.fn(),
        deleteRecording: jest.fn(),
        refreshRecordings: jest.fn()
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
})
