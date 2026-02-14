import { render, screen, waitFor, act } from '@testing-library/react'

// Mock dependencies - use inline jest.fn() for hoisting
jest.mock('../services/syncService', () => ({
  syncService: {
    performSync: jest.fn(),
    setCallbacks: jest.fn(),
    queueUpload: jest.fn(),
    isQueueEmpty: jest.fn(() => true),
    getQueueLength: jest.fn(() => 0),
    isCurrentlySyncing: jest.fn(() => false),
    isRateLimited: false,
  },
  default: {
    performSync: jest.fn(),
    setCallbacks: jest.fn(),
    queueUpload: jest.fn(),
    isQueueEmpty: jest.fn(() => true),
    getQueueLength: jest.fn(() => 0),
    isCurrentlySyncing: jest.fn(() => false),
    isRateLimited: false,
  },
  __esModule: true,
}))

jest.mock('./FreesoundAuthContext', () => ({
  useFreesoundAuth: jest.fn(() => ({
    isAuthenticated: true,
  })),
}))

jest.mock('./RecordingsContext', () => ({
  useRecordings: jest.fn(() => ({
    recordings: [],
    updateRecording: jest.fn(),
    addRecording: jest.fn(),
    deleteRecording: jest.fn(),
  })),
}))

jest.mock('../constants/config', () => ({
  SYNC: {
    DEBOUNCE_MS: 10,
    MIN_INTERVAL_MS: 10,
    RATE_LIMIT_BACKOFF_MS: 100,
  },
  INITIAL_SYNC_DELAY_MS: 10,
}))

jest.mock('../utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}))

// Import after mocks
import { SyncProvider, useSync } from './SyncContext'
import { useFreesoundAuth } from './FreesoundAuthContext'
import { useRecordings } from './RecordingsContext'
import syncService from '../services/syncService'

// Get typed references to mocks
const mockPerformSync = syncService.performSync as jest.Mock
const mockSetCallbacks = syncService.setCallbacks as jest.Mock
const mockQueueUpload = syncService.queueUpload as jest.Mock
const mockIsQueueEmpty = syncService.isQueueEmpty as jest.Mock
const mockGetQueueLength = syncService.getQueueLength as jest.Mock

// Test component to access context
const TestConsumer = () => {
  const sync = useSync()
  return (
    <div>
      <span data-testid="isSyncing">{sync.isSyncing.toString()}</span>
      <span data-testid="isOnline">{sync.isOnline.toString()}</span>
      <span data-testid="pendingCount">{sync.pendingCount}</span>
      <span data-testid="lastSyncTime">{sync.lastSyncTime?.toISOString() || 'null'}</span>
      <button data-testid="triggerSyncBtn" onClick={() => sync.triggerSync()}>
        Trigger Sync
      </button>
      <button data-testid="retryModerationBtn" onClick={() => sync.retryModeration(1)}>
        Retry Moderation
      </button>
    </div>
  )
}

describe('SyncProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockPerformSync.mockResolvedValue({ uploaded: 0, downloaded: 0, errors: [] })
    mockIsQueueEmpty.mockReturnValue(true)
    mockGetQueueLength.mockReturnValue(0)

    // Reset mocked hooks
    ;(useFreesoundAuth as jest.Mock).mockReturnValue({ isAuthenticated: true })
    ;(useRecordings as jest.Mock).mockReturnValue({
      recordings: [],
      updateRecording: jest.fn(),
      addRecording: jest.fn(),
      deleteRecording: jest.fn(),
    })

    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders children', async () => {
    render(
      <SyncProvider>
        <div data-testid="child">Child Content</div>
      </SyncProvider>
    )

    expect(screen.getByTestId('child')).toHaveTextContent('Child Content')
  })

  it('provides initial context values', async () => {
    render(
      <SyncProvider>
        <TestConsumer />
      </SyncProvider>
    )

    expect(screen.getByTestId('isSyncing')).toHaveTextContent('false')
    expect(screen.getByTestId('isOnline')).toHaveTextContent('true')
    expect(screen.getByTestId('pendingCount')).toHaveTextContent('0')
    expect(screen.getByTestId('lastSyncTime')).toHaveTextContent('null')
  })

  it('sets up sync service callbacks synchronously during render', async () => {
    render(
      <SyncProvider>
        <TestConsumer />
      </SyncProvider>
    )

    // Callbacks are set synchronously during render (not in useEffect)
    // so they're available before child effects like triggerSync fire
    expect(mockSetCallbacks).toHaveBeenCalledWith(
      expect.objectContaining({
        onRecordingUpdate: expect.any(Function),
        onRecordingAdd: expect.any(Function),
        onRecordingDelete: expect.any(Function),
        getRecordings: expect.any(Function),
      })
    )
  })

  describe('triggerSync', () => {
    it('triggers sync when authenticated and online', async () => {
      render(
        <SyncProvider>
          <TestConsumer />
        </SyncProvider>
      )

      // Wait for initial sync delay
      await act(async () => {
        jest.advanceTimersByTime(100)
      })

      await act(async () => {
        screen.getByTestId('triggerSyncBtn').click()
      })

      await waitFor(() => {
        expect(mockPerformSync).toHaveBeenCalled()
      })
    })

    it('does not sync when not authenticated', async () => {
      (useFreesoundAuth as jest.Mock).mockReturnValue({ isAuthenticated: false })

      render(
        <SyncProvider>
          <TestConsumer />
        </SyncProvider>
      )

      await act(async () => {
        screen.getByTestId('triggerSyncBtn').click()
      })

      expect(mockPerformSync).not.toHaveBeenCalled()
    })

    it('does not sync when offline and queue is empty', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false })

      render(
        <SyncProvider>
          <TestConsumer />
        </SyncProvider>
      )

      // Simulate offline event
      await act(async () => {
        window.dispatchEvent(new Event('offline'))
      })

      await act(async () => {
        screen.getByTestId('triggerSyncBtn').click()
      })

      expect(mockPerformSync).not.toHaveBeenCalled()
    })

    it('updates lastSyncTime after successful sync', async () => {
      mockPerformSync.mockResolvedValue({ uploaded: 1, downloaded: 0, errors: [] })

      render(
        <SyncProvider>
          <TestConsumer />
        </SyncProvider>
      )

      await act(async () => {
        jest.advanceTimersByTime(100)
      })

      await act(async () => {
        screen.getByTestId('triggerSyncBtn').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('lastSyncTime')).not.toHaveTextContent('null')
      })
    })
  })

  describe('online/offline handling', () => {
    it('tracks online status', async () => {
      render(
        <SyncProvider>
          <TestConsumer />
        </SyncProvider>
      )

      expect(screen.getByTestId('isOnline')).toHaveTextContent('true')

      await act(async () => {
        Object.defineProperty(navigator, 'onLine', { value: false })
        window.dispatchEvent(new Event('offline'))
      })

      expect(screen.getByTestId('isOnline')).toHaveTextContent('false')

      await act(async () => {
        Object.defineProperty(navigator, 'onLine', { value: true })
        window.dispatchEvent(new Event('online'))
      })

      expect(screen.getByTestId('isOnline')).toHaveTextContent('true')
    })
  })

  describe('retryModeration', () => {
    it('clears freesound state and queues for re-upload', async () => {
      const mockUpdateRecording = jest.fn()
      ;(useRecordings as jest.Mock).mockReturnValue({
        recordings: [{ id: 1, name: 'Test', freesoundId: 123, moderationStatus: 'moderation_failed' }],
        updateRecording: mockUpdateRecording,
        addRecording: jest.fn(),
        deleteRecording: jest.fn(),
      })

      render(
        <SyncProvider>
          <TestConsumer />
        </SyncProvider>
      )

      await act(async () => {
        screen.getByTestId('retryModerationBtn').click()
      })

      await waitFor(() => {
        expect(mockUpdateRecording).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 1,
            freesoundId: undefined,
            moderationStatus: undefined,
            syncStatus: 'pending',
          })
        )
      })

      expect(mockQueueUpload).toHaveBeenCalledWith(1)
    })

    it('does nothing if recording not found', async () => {
      const mockUpdateRecording = jest.fn()
      ;(useRecordings as jest.Mock).mockReturnValue({
        recordings: [],
        updateRecording: mockUpdateRecording,
        addRecording: jest.fn(),
        deleteRecording: jest.fn(),
      })

      render(
        <SyncProvider>
          <TestConsumer />
        </SyncProvider>
      )

      await act(async () => {
        screen.getByTestId('retryModerationBtn').click()
      })

      expect(mockUpdateRecording).not.toHaveBeenCalled()
    })
  })

})

describe('useSync', () => {
  it('throws error when used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<TestConsumer />)).toThrow(
      'useSync must be used within its Provider'
    )

    consoleError.mockRestore()
  })
})
