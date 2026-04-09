import { render, screen, waitFor, act } from '@testing-library/react'

// Mock dependencies - use inline vi.fn() for hoisting
vi.mock('../services/syncService', () => ({
  syncService: {
    performSync: vi.fn(),
    setCallbacks: vi.fn(),
    queueUpload: vi.fn(),
    isQueueEmpty: vi.fn(() => true),
    getQueueLength: vi.fn(() => 0),
    isCurrentlySyncing: vi.fn(() => false),
    isRateLimited: false,
  },
  default: {
    performSync: vi.fn(),
    setCallbacks: vi.fn(),
    queueUpload: vi.fn(),
    isQueueEmpty: vi.fn(() => true),
    getQueueLength: vi.fn(() => 0),
    isCurrentlySyncing: vi.fn(() => false),
    isRateLimited: false,
  },
  __esModule: true,
}))

vi.mock('./FreesoundAuthContext', () => ({
  useFreesoundAuth: vi.fn(() => ({
    isAuthenticated: true,
  })),
}))

vi.mock('./RecordingsContext', () => ({
  useRecordings: vi.fn(() => ({
    recordings: [],
    updateRecording: vi.fn(),
    addRecording: vi.fn(),
    deleteRecording: vi.fn(),
  })),
}))

vi.mock('../constants/config', () => ({
  SYNC: {
    DEBOUNCE_MS: 10,
    MIN_INTERVAL_MS: 10,
    RATE_LIMIT_BACKOFF_MS: 100,
  },
  INITIAL_SYNC_DELAY_MS: 10,
}))

vi.mock('../utils/logger', () => {
  const mockLogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
  return { default: mockLogger, logger: mockLogger }
})

// Import after mocks
import { SyncProvider, useSync } from './SyncContext'
import { useFreesoundAuth } from './FreesoundAuthContext'
import { useRecordings } from './RecordingsContext'
import syncService from '../services/syncService'

// Get typed references to mocks
const mockPerformSync = syncService.performSync as vi.Mock
const mockSetCallbacks = syncService.setCallbacks as vi.Mock
const mockQueueUpload = syncService.queueUpload as vi.Mock
const mockIsQueueEmpty = syncService.isQueueEmpty as vi.Mock
const mockGetQueueLength = syncService.getQueueLength as vi.Mock

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
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockPerformSync.mockResolvedValue({ uploaded: 0, downloaded: 0, errors: [] })
    mockIsQueueEmpty.mockReturnValue(true)
    mockGetQueueLength.mockReturnValue(0)

    // Reset mocked hooks
    ;(useFreesoundAuth as vi.Mock).mockReturnValue({ isAuthenticated: true })
    ;(useRecordings as vi.Mock).mockReturnValue({
      recordings: [],
      updateRecording: vi.fn(),
      addRecording: vi.fn(),
      deleteRecording: vi.fn(),
    })

    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
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
        vi.advanceTimersByTime(100)
      })

      await act(async () => {
        screen.getByTestId('triggerSyncBtn').click()
      })

      await waitFor(() => {
        expect(mockPerformSync).toHaveBeenCalled()
      })
    })

    it('does not sync when not authenticated', async () => {
      (useFreesoundAuth as vi.Mock).mockReturnValue({ isAuthenticated: false })

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
        vi.advanceTimersByTime(100)
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
      const mockUpdateRecording = vi.fn()
      ;(useRecordings as vi.Mock).mockReturnValue({
        recordings: [{ id: 1, name: 'Test', freesoundId: 123, moderationStatus: 'moderation_failed' }],
        updateRecording: mockUpdateRecording,
        addRecording: vi.fn(),
        deleteRecording: vi.fn(),
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
      const mockUpdateRecording = vi.fn()
      ;(useRecordings as vi.Mock).mockReturnValue({
        recordings: [],
        updateRecording: mockUpdateRecording,
        addRecording: vi.fn(),
        deleteRecording: vi.fn(),
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
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<TestConsumer />)).toThrow(
      'useSync must be used within its Provider'
    )

    consoleError.mockRestore()
  })
})
