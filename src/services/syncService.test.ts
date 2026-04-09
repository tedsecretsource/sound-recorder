import { Recording } from '../SoundRecorderTypes'

// Create shared mock object for both named and default exports
vi.mock('./freesoundApi', () => {
  const mockApi = {
    uploadSound: vi.fn(),
    getSoundsByTag: vi.fn(),
    getPendingUploads: vi.fn(),
    downloadSound: vi.fn(),
    editSound: vi.fn(),
  }
  return {
    __esModule: true,
    freesoundApi: mockApi,
    default: mockApi,
  }
})

vi.mock('../utils/audioConverter', () => ({
  convertToWav: vi.fn(() => Promise.resolve(new Blob(['wav data'], { type: 'audio/wav' }))),
}))

vi.mock('../config/freesound', () => ({
  FREESOUND_CONFIG: {
    TAG: 'sound-recorder-sync',
  },
}))

vi.mock('../constants/config', () => ({
  SYNC: {
    RATE_LIMIT_BACKOFF_MS: 100, // Short for testing
  },
}))

vi.mock('../utils/logger', () => {
  const mockLogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
  return { default: mockLogger, logger: mockLogger }
})

// Import types only - actual modules will be re-imported fresh in each test
import type { SyncCallbacks } from './syncService'

describe('SyncService', () => {
  let callbacks: SyncCallbacks
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let syncService: any
  // Mock references that get refreshed with each test
  let mockUploadSound: vi.Mock
  let mockGetSoundsByTag: vi.Mock
  let mockGetPendingUploads: vi.Mock
  let mockDownloadSound: vi.Mock
  let mockEditSound: vi.Mock

  const createMockRecording = (overrides: Partial<Recording> = {}): Recording => ({
    id: 1,
    name: 'Custom Recording Name',
    description: 'A description for the recording',
    length: 10,
    audioURL: 'blob://test',
    data: new Blob(['audio data'], { type: 'audio/webm' }),
    ...overrides,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset modules to get fresh syncService instance (clears rate limit state)
    vi.resetModules()
    // Re-import syncService fresh
    syncService = require('./syncService').syncService
    // Re-import freesoundApi mock and get fresh references
    const freesoundApi = require('./freesoundApi').default
    mockUploadSound = freesoundApi.uploadSound as vi.Mock
    mockGetSoundsByTag = freesoundApi.getSoundsByTag as vi.Mock
    mockGetPendingUploads = freesoundApi.getPendingUploads as vi.Mock
    mockDownloadSound = freesoundApi.downloadSound as vi.Mock
    mockEditSound = freesoundApi.editSound as vi.Mock

    callbacks = {
      onRecordingUpdate: vi.fn(() => Promise.resolve()),
      onRecordingAdd: vi.fn(() => Promise.resolve(100)),
      onRecordingDelete: vi.fn(() => Promise.resolve()),
      getRecordings: vi.fn(() => Promise.resolve([])),
    }

    syncService.setCallbacks(callbacks)

    // Default mocks
    mockGetSoundsByTag.mockResolvedValue({ results: [] })
    mockGetPendingUploads.mockResolvedValue({
      pending_description: [],
      pending_processing: [],
      pending_moderation: [],
    })
  })

  describe('queue management', () => {
    it('queues recording for upload', () => {
      expect(syncService.isQueueEmpty()).toBe(true)
      expect(syncService.getQueueLength()).toBe(0)

      syncService.queueUpload(1)

      expect(syncService.isQueueEmpty()).toBe(false)
      expect(syncService.getQueueLength()).toBe(1)
    })

    it('does not add duplicates to queue', () => {
      syncService.queueUpload(1)
      syncService.queueUpload(1)
      syncService.queueUpload(1)

      expect(syncService.getQueueLength()).toBe(1)
    })

    it('allows multiple different IDs in queue', () => {
      syncService.queueUpload(1)
      syncService.queueUpload(2)
      syncService.queueUpload(3)

      expect(syncService.getQueueLength()).toBe(3)
    })
  })

  describe('sync state', () => {
    it('reports syncing state correctly', async () => {
      expect(syncService.isCurrentlySyncing()).toBe(false)

      const syncPromise = syncService.performSync()

      await syncPromise

      expect(syncService.isCurrentlySyncing()).toBe(false)
    })

    it('returns result with expected structure', async () => {
      const result = await syncService.performSync()
      expect(result).toEqual(expect.objectContaining({
        uploaded: expect.any(Number),
        downloaded: expect.any(Number),
        errors: expect.any(Array),
      }))
    })
  })

  describe('performSync - uploads', () => {
    it('uploads recordings without freesoundId', async () => {
      const recording = createMockRecording({
        id: 1,
        syncStatus: 'pending',
      })

      ;(callbacks.getRecordings as vi.Mock).mockResolvedValue([recording])
      mockUploadSound.mockResolvedValue({ id: 12345 })

      const result = await syncService.performSync()

      expect(result.uploaded).toBe(1)
      expect(mockUploadSound).toHaveBeenCalled()
      expect(callbacks.onRecordingUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          freesoundId: 12345,
          syncStatus: 'synced',
        })
      )
    })

    it('skips recordings that are already synced', async () => {
      const recording = createMockRecording({
        id: 1,
        syncStatus: 'synced',
        freesoundId: 12345,
      })

      ;(callbacks.getRecordings as vi.Mock).mockResolvedValue([recording])

      const result = await syncService.performSync()

      expect(result.uploaded).toBe(0)
      expect(mockUploadSound).not.toHaveBeenCalled()
    })

    it('skips recordings with moderation_failed status', async () => {
      const recording = createMockRecording({
        id: 1,
        moderationStatus: 'moderation_failed',
      })

      ;(callbacks.getRecordings as vi.Mock).mockResolvedValue([recording])

      const result = await syncService.performSync()

      expect(result.uploaded).toBe(0)
      expect(mockUploadSound).not.toHaveBeenCalled()
    })

    it('skips recordings without data', async () => {
      const recording = createMockRecording({
        id: 1,
        data: undefined,
      })

      ;(callbacks.getRecordings as vi.Mock).mockResolvedValue([recording])

      const result = await syncService.performSync()

      expect(result.uploaded).toBe(0)
    })

    it('skips recordings not ready for sync (default name)', async () => {
      const recording = createMockRecording({
        id: 1,
        name: '2024-01-15 14:30:45', // Default datetime format
        description: 'Has description',
      })

      ;(callbacks.getRecordings as vi.Mock).mockResolvedValue([recording])

      const result = await syncService.performSync()

      expect(result.uploaded).toBe(0)
    })

    it('skips recordings not ready for sync (no description)', async () => {
      const recording = createMockRecording({
        id: 1,
        name: 'Custom Name',
        description: undefined,
      })

      ;(callbacks.getRecordings as vi.Mock).mockResolvedValue([recording])

      const result = await syncService.performSync()

      expect(result.uploaded).toBe(0)
    })

    it('handles upload errors gracefully', async () => {
      const recording = createMockRecording({ id: 1 })

      ;(callbacks.getRecordings as vi.Mock).mockResolvedValue([recording])
      mockUploadSound.mockRejectedValue(new Error('Upload failed'))

      const result = await syncService.performSync()

      expect(result.uploaded).toBe(0)
      expect(result.errors).toContainEqual(
        expect.stringContaining('Failed to upload')
      )
      expect(callbacks.onRecordingUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          syncStatus: 'error',
          syncError: 'Upload failed',
        })
      )
    })

    it('handles rate limiting during upload', async () => {
      const recording = createMockRecording({ id: 1 })

      ;(callbacks.getRecordings as vi.Mock).mockResolvedValue([recording])
      mockUploadSound.mockRejectedValue(new Error('429 Too Many Requests'))

      const result = await syncService.performSync()

      expect(result.uploaded).toBe(0)
      expect(result.errors).toContainEqual(
        expect.stringContaining('Rate limited')
      )
      expect(callbacks.onRecordingUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          syncStatus: 'pending',
          syncError: 'Rate limited, will retry',
        })
      )
    })
  })

  describe('performSync - downloads', () => {
    it('downloads remote sounds not in local recordings', async () => {
      const remoteSound = {
        id: 99999,
        name: 'Remote Sound',
        description: 'A remote sound description',
        duration: 5.5,
      }

      ;(callbacks.getRecordings as vi.Mock).mockResolvedValue([])
      mockGetSoundsByTag.mockResolvedValue({ results: [remoteSound] })
      mockDownloadSound.mockResolvedValue(new Blob(['audio'], { type: 'audio/wav' }))

      const result = await syncService.performSync()

      expect(result.downloaded).toBe(1)
      expect(mockDownloadSound).toHaveBeenCalledWith(remoteSound)
      expect(callbacks.onRecordingAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Remote Sound',
          description: 'A remote sound description',
          freesoundId: 99999,
          syncStatus: 'synced',
        })
      )
    })

    it('skips download for sounds already in local recordings', async () => {
      const localRecording = createMockRecording({
        id: 1,
        freesoundId: 12345,
      })
      const remoteSound = { id: 12345, name: 'Test', duration: 5 }

      ;(callbacks.getRecordings as vi.Mock).mockResolvedValue([localRecording])
      mockGetSoundsByTag.mockResolvedValue({ results: [remoteSound] })

      const result = await syncService.performSync()

      expect(result.downloaded).toBe(0)
      expect(mockDownloadSound).not.toHaveBeenCalled()
    })

    it('handles download errors gracefully', async () => {
      const remoteSound = { id: 99999, name: 'Remote Sound', duration: 5 }

      ;(callbacks.getRecordings as vi.Mock).mockResolvedValue([])
      mockGetSoundsByTag.mockResolvedValue({ results: [remoteSound] })
      mockDownloadSound.mockRejectedValue(new Error('Network error'))

      const result = await syncService.performSync()

      expect(result.downloaded).toBe(0)
      expect(result.errors).toContainEqual(
        expect.stringContaining('Failed to download')
      )
    })
  })

  describe('performSync - moderation status updates', () => {
    it('updates status to approved when sound appears in remote', async () => {
      const localRecording = createMockRecording({
        id: 1,
        freesoundId: 12345,
        moderationStatus: 'processing',
      })
      const remoteSound = { id: 12345, name: 'Test', duration: 5 }

      ;(callbacks.getRecordings as vi.Mock).mockResolvedValue([localRecording])
      mockGetSoundsByTag.mockResolvedValue({ results: [remoteSound] })

      await syncService.performSync()

      expect(callbacks.onRecordingUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ moderationStatus: 'approved' })
      )
    })

    it('updates status to processing when in pending_processing', async () => {
      const localRecording = createMockRecording({
        id: 1,
        freesoundId: 12345,
        moderationStatus: undefined,
      })

      ;(callbacks.getRecordings as vi.Mock).mockResolvedValue([localRecording])
      mockGetSoundsByTag.mockResolvedValue({ results: [] })
      mockGetPendingUploads.mockResolvedValue({
        pending_description: [],
        pending_processing: [{ id: 12345, name: 'Test' }],
        pending_moderation: [],
      })

      await syncService.performSync()

      expect(callbacks.onRecordingUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ moderationStatus: 'processing' })
      )
    })

    it('updates status to in_moderation when in pending_moderation', async () => {
      const localRecording = createMockRecording({
        id: 1,
        freesoundId: 12345,
        moderationStatus: 'processing',
      })

      ;(callbacks.getRecordings as vi.Mock).mockResolvedValue([localRecording])
      mockGetSoundsByTag.mockResolvedValue({ results: [] })
      mockGetPendingUploads.mockResolvedValue({
        pending_description: [],
        pending_processing: [],
        pending_moderation: [{ id: 12345, name: 'Test' }],
      })

      await syncService.performSync()

      expect(callbacks.onRecordingUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ moderationStatus: 'in_moderation' })
      )
    })

    it('updates status to moderation_failed when not found anywhere', async () => {
      const localRecording = createMockRecording({
        id: 1,
        freesoundId: 12345,
        moderationStatus: 'in_moderation', // Was in moderation, now gone
      })

      ;(callbacks.getRecordings as vi.Mock).mockResolvedValue([localRecording])
      mockGetSoundsByTag.mockResolvedValue({ results: [] })
      mockGetPendingUploads.mockResolvedValue({
        pending_description: [],
        pending_processing: [],
        pending_moderation: [],
      })

      await syncService.performSync()

      expect(callbacks.onRecordingUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ moderationStatus: 'moderation_failed' })
      )
    })
  })

  describe('performSync - deletions', () => {
    it('deletes local recording when removed from remote (was approved)', async () => {
      const localRecording = createMockRecording({
        id: 1,
        freesoundId: 12345,
        moderationStatus: 'approved',
      })

      ;(callbacks.getRecordings as vi.Mock).mockResolvedValue([localRecording])
      mockGetSoundsByTag.mockResolvedValue({ results: [] })
      mockGetPendingUploads.mockResolvedValue({
        pending_description: [],
        pending_processing: [],
        pending_moderation: [],
      })

      await syncService.performSync()

      expect(callbacks.onRecordingDelete).toHaveBeenCalledWith(1)
    })

    it('does not delete if still in pending_processing', async () => {
      const localRecording = createMockRecording({
        id: 1,
        freesoundId: 12345,
        moderationStatus: 'approved',
      })

      ;(callbacks.getRecordings as vi.Mock).mockResolvedValue([localRecording])
      mockGetSoundsByTag.mockResolvedValue({ results: [] })
      mockGetPendingUploads.mockResolvedValue({
        pending_description: [],
        pending_processing: [{ id: 12345, name: 'Test' }],
        pending_moderation: [],
      })

      await syncService.performSync()

      expect(callbacks.onRecordingDelete).not.toHaveBeenCalled()
    })

    it('does not delete if moderation_failed', async () => {
      const localRecording = createMockRecording({
        id: 1,
        freesoundId: 12345,
        moderationStatus: 'moderation_failed',
      })

      ;(callbacks.getRecordings as vi.Mock).mockResolvedValue([localRecording])
      mockGetSoundsByTag.mockResolvedValue({ results: [] })

      await syncService.performSync()

      expect(callbacks.onRecordingDelete).not.toHaveBeenCalled()
    })
  })

  describe('performSync - queue processing', () => {
    it('processes queued recordings', async () => {
      const recording = createMockRecording({ id: 42 })

      ;(callbacks.getRecordings as vi.Mock).mockResolvedValue([recording])
      mockUploadSound.mockResolvedValue({ id: 99999 })

      syncService.queueUpload(42)

      const result = await syncService.performSync()

      expect(result.uploaded).toBe(1)
    })

    it('removes processed recordings from queue', async () => {
      const recording = createMockRecording({ id: 42 })

      ;(callbacks.getRecordings as vi.Mock).mockResolvedValue([recording])
      mockUploadSound.mockResolvedValue({ id: 99999 })

      syncService.queueUpload(42)
      expect(syncService.getQueueLength()).toBe(1)

      await syncService.performSync()

      expect(syncService.getQueueLength()).toBe(0)
    })
  })

  describe('performSync - remote edits', () => {
    it('pushes edits to Freesound for approved recordings with pendingEdit', async () => {
      const recording = createMockRecording({
        id: 1,
        freesoundId: 12345,
        syncStatus: 'synced',
        moderationStatus: 'approved',
        pendingEdit: true,
        name: 'Updated Name',
        description: 'Updated Description',
      })

      ;(callbacks.getRecordings as vi.Mock).mockResolvedValue([recording])
      mockGetSoundsByTag.mockResolvedValue({ results: [{ id: 12345, name: 'Old Name', duration: 5 }] })
      mockEditSound.mockResolvedValue(undefined)

      await syncService.performSync()

      expect(mockEditSound).toHaveBeenCalledWith(12345, {
        name: 'Updated Name',
        description: 'Updated Description',
      })
      expect(callbacks.onRecordingUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          pendingEdit: undefined,
          lastSyncedAt: expect.any(String),
        })
      )
    })

    it('skips recordings without pendingEdit flag', async () => {
      const recording = createMockRecording({
        id: 1,
        freesoundId: 12345,
        syncStatus: 'synced',
        moderationStatus: 'approved',
      })

      ;(callbacks.getRecordings as vi.Mock).mockResolvedValue([recording])
      mockGetSoundsByTag.mockResolvedValue({ results: [{ id: 12345, name: 'Test', duration: 5 }] })

      await syncService.performSync()

      expect(mockEditSound).not.toHaveBeenCalled()
    })

    it('skips recordings not yet approved', async () => {
      const recording = createMockRecording({
        id: 1,
        freesoundId: 12345,
        syncStatus: 'synced',
        moderationStatus: 'processing',
        pendingEdit: true,
      })

      ;(callbacks.getRecordings as vi.Mock).mockResolvedValue([recording])
      mockGetSoundsByTag.mockResolvedValue({ results: [] })

      await syncService.performSync()

      expect(mockEditSound).not.toHaveBeenCalled()
    })

    it('handles edit errors gracefully', async () => {
      const recording = createMockRecording({
        id: 1,
        freesoundId: 12345,
        syncStatus: 'synced',
        moderationStatus: 'approved',
        pendingEdit: true,
      })

      ;(callbacks.getRecordings as vi.Mock).mockResolvedValue([recording])
      mockGetSoundsByTag.mockResolvedValue({ results: [{ id: 12345, name: 'Test', duration: 5 }] })
      mockEditSound.mockRejectedValue(new Error('Edit failed: 400 - Bad Request'))

      const result = await syncService.performSync()

      expect(result.errors).toContainEqual(
        expect.stringContaining('Failed to update')
      )
    })
  })

  describe('rate limiting state', () => {
    it('tracks rate limit state', async () => {
      const recording = createMockRecording({ id: 1 })

      ;(callbacks.getRecordings as vi.Mock).mockResolvedValue([recording])
      mockUploadSound.mockRejectedValue(new Error('429 Too Many Requests'))

      await syncService.performSync()

      expect(syncService.isRateLimited).toBe(true)
      expect(syncService.rateLimitWaitSeconds).toBeGreaterThan(0)
    })

    it('returns early when rate limited', async () => {
      const recording = createMockRecording({ id: 1 })

      ;(callbacks.getRecordings as vi.Mock).mockResolvedValue([recording])
      mockUploadSound.mockRejectedValue(new Error('429'))

      // First sync triggers rate limit
      await syncService.performSync()

      // Reset mock to track second call
      mockUploadSound.mockClear()
      ;(callbacks.getRecordings as vi.Mock).mockClear()

      // Second sync should return early
      const result = await syncService.performSync()

      expect(result.errors).toContainEqual(expect.stringContaining('Rate limited'))
      expect(callbacks.getRecordings).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('handles getSoundsByTag failure gracefully', async () => {
      ;(callbacks.getRecordings as vi.Mock).mockResolvedValue([])
      mockGetSoundsByTag.mockRejectedValue(new Error('Network error'))

      const result = await syncService.performSync()

      // Should complete without throwing
      expect(result).toEqual(expect.objectContaining({
        uploaded: 0,
        downloaded: 0,
      }))
    })

    it('handles getPendingUploads failure gracefully', async () => {
      ;(callbacks.getRecordings as vi.Mock).mockResolvedValue([])
      mockGetPendingUploads.mockRejectedValue(new Error('Network error'))

      const result = await syncService.performSync()

      // Should complete without throwing
      expect(result).toBeDefined()
    })

    it('clears isRunning flag on error', async () => {
      ;(callbacks.getRecordings as vi.Mock).mockRejectedValue(new Error('DB Error'))

      try {
        await syncService.performSync()
      } catch {
        // Expected to throw
      }

      expect(syncService.isCurrentlySyncing()).toBe(false)
    })
  })
})
