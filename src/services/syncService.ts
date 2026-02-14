import { Recording, isReadyForSync } from '../SoundRecorderTypes'
import { FreesoundSound, ModerationStatus } from '../types/Freesound'
import { FREESOUND_CONFIG } from '../config/freesound'
import freesoundApi from './freesoundApi'
import { convertToWav } from '../utils/audioConverter'
import { SYNC } from '../constants/config'
import logger from '../utils/logger'

export interface SyncResult {
  uploaded: number
  downloaded: number
  errors: string[]
}

export interface SyncCallbacks {
  onRecordingUpdate: (id: number, updates: Partial<Recording>) => Promise<void>
  onRecordingAdd: (recording: Omit<Recording, 'id'>) => Promise<number>
  onRecordingDelete: (id: number) => Promise<void>
  getRecordings: () => Promise<Recording[]>
}

interface UploadContext {
  callbacks: SyncCallbacks
  result: SyncResult
}

class SyncService {
  private isRunning = false
  private queue: number[] = [] // Recording IDs to upload
  private callbacks: SyncCallbacks | null = null
  private rateLimitedUntil = 0

  get isRateLimited(): boolean {
    return Date.now() < this.rateLimitedUntil
  }

  get rateLimitWaitSeconds(): number {
    return Math.ceil((this.rateLimitedUntil - Date.now()) / 1000)
  }

  setCallbacks(callbacks: SyncCallbacks) {
    this.callbacks = callbacks
  }

  queueUpload(recordingId: number) {
    if (!this.queue.includes(recordingId)) {
      this.queue.push(recordingId)
    }
  }

  isQueueEmpty(): boolean {
    return this.queue.length === 0
  }

  getQueueLength(): number {
    return this.queue.length
  }

  isCurrentlySyncing(): boolean {
    return this.isRunning
  }

  /**
   * Handles rate limit errors by setting the backoff timer and updating recording status.
   * Returns true if the error was a rate limit, false otherwise.
   */
  private async handleRateLimit(
    error: Error,
    recordingId: number,
    callbacks: SyncCallbacks,
    result: SyncResult
  ): Promise<boolean> {
    const message = error.message
    if (!message.includes('429') && !message.includes('Too Many Requests')) {
      return false
    }

    this.rateLimitedUntil = Date.now() + SYNC.RATE_LIMIT_BACKOFF_MS
    result.errors.push('Rate limited by Freesound. Will retry in 60 seconds.')

    await callbacks.onRecordingUpdate(recordingId, {
      syncStatus: 'pending',
      syncError: 'Rate limited, will retry'
    })

    return true
  }

  /**
   * Uploads a single recording to Freesound.
   * Returns true if successful, false otherwise.
   */
  private async uploadRecording(
    recording: Recording,
    recordingId: number,
    context: UploadContext
  ): Promise<boolean> {
    const { callbacks, result } = context

    try {
      await callbacks.onRecordingUpdate(recordingId, { syncStatus: 'syncing' })

      // Convert to WAV format for Freesound compatibility
      const wavBlob = await convertToWav(recording.data!)
      const file = new File([wavBlob], `${recording.name}.wav`, {
        type: 'audio/wav'
      })

      const uploadResult = await freesoundApi.uploadSound({
        audioFile: file,
        name: recording.name,
        tags: [FREESOUND_CONFIG.TAG, 'field-recording', 'sound-recorder'],
        description: recording.description!,
        license: 'Creative Commons 0',
        bst_category: recording.bstCategory || 'fx-other'
      }, recordingId)

      await callbacks.onRecordingUpdate(recordingId, {
        freesoundId: uploadResult.id,
        syncStatus: 'synced',
        lastSyncedAt: new Date().toISOString(),
        syncError: undefined,
        moderationStatus: 'processing'
      })

      result.uploaded++
      return true
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Upload failed')

      // Check if rate limited
      const wasRateLimited = await this.handleRateLimit(error, recordingId, callbacks, result)
      if (wasRateLimited) {
        return false // Signal to stop processing
      }

      // Regular error
      result.errors.push(`Failed to upload "${recording.name}": ${error.message}`)
      await callbacks.onRecordingUpdate(recordingId, {
        syncStatus: 'error',
        syncError: error.message
      })
      return true // Continue processing other recordings
    }
  }

  /**
   * Uploads local recordings that haven't been uploaded yet.
   */
  private async uploadLocalRecordings(
    recordings: Recording[],
    context: UploadContext
  ): Promise<void> {
    for (const recording of recordings) {
      if (recording.syncStatus === 'synced') continue
      if (recording.moderationStatus === 'moderation_failed') continue
      if (!recording.data || !recording.id) continue
      if (!isReadyForSync(recording)) continue

      const shouldContinue = await this.uploadRecording(recording, recording.id, context)

      // Remove from queue if it was there
      this.queue = this.queue.filter(id => id !== recording.id)

      if (!shouldContinue) break // Rate limited
    }
  }

  /**
   * Processes the upload queue for modified recordings.
   */
  private async processUploadQueue(
    localRecordings: Recording[],
    context: UploadContext
  ): Promise<void> {
    while (this.queue.length > 0 && !this.isRateLimited) {
      const recordingId = this.queue.shift()!
      const recording = localRecordings.find(r => r.id === recordingId)

      if (!recording || !recording.data) continue
      if (recording.freesoundId) continue // Already uploaded
      if (recording.moderationStatus === 'moderation_failed') continue
      if (!isReadyForSync(recording)) continue

      const shouldContinue = await this.uploadRecording(recording, recordingId, context)
      if (!shouldContinue) break // Rate limited
    }
  }

  /**
   * Updates moderation status for all synced recordings.
   */
  private async updateModerationStatuses(
    localByFreesoundId: Map<number, Recording>,
    remoteIds: Set<number>,
    pendingProcessingIds: Set<number>,
    pendingModerationIds: Set<number>,
    pendingUploadsFetched: boolean,
    callbacks: SyncCallbacks
  ): Promise<void> {
    for (const [freesoundId, localRec] of localByFreesoundId) {
      if (localRec.id === undefined) continue
      if (localRec.moderationStatus === 'moderation_failed') continue

      let newStatus: ModerationStatus | undefined
      if (remoteIds.has(freesoundId)) {
        newStatus = 'approved'
      } else if (pendingProcessingIds.has(freesoundId)) {
        newStatus = 'processing'
      } else if (pendingModerationIds.has(freesoundId)) {
        newStatus = 'in_moderation'
      } else if (pendingUploadsFetched) {
        if (localRec.moderationStatus === 'approved') {
          // Was previously approved — deleted on Freesound
          newStatus = undefined // Will be handled in deletion phase
        } else {
          // Was never approved — moderation rejected
          newStatus = 'moderation_failed'
        }
      }

      if (newStatus !== undefined && newStatus !== localRec.moderationStatus) {
        await callbacks.onRecordingUpdate(localRec.id, { moderationStatus: newStatus })
      }
    }
  }

  /**
   * Pushes local name/description edits to Freesound for approved recordings.
   */
  private async updateRemoteRecordings(
    recordings: Recording[],
    context: UploadContext
  ): Promise<void> {
    const { callbacks, result } = context

    for (const recording of recordings) {
      if (!recording.pendingEdit) continue
      if (!recording.freesoundId || recording.id === undefined) continue
      if (recording.moderationStatus !== 'approved') continue

      try {
        await freesoundApi.editSound(recording.freesoundId, {
          name: recording.name,
          description: recording.description,
        })

        await callbacks.onRecordingUpdate(recording.id, {
          pendingEdit: undefined,
          lastSyncedAt: new Date().toISOString(),
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Edit failed'
        result.errors.push(`Failed to update "${recording.name}": ${message}`)
      }
    }
  }

  /**
   * Downloads remote sounds that don't exist locally.
   */
  private async downloadRemoteSounds(
    remoteSounds: FreesoundSound[],
    localByFreesoundId: Map<number, Recording>,
    context: UploadContext
  ): Promise<void> {
    const { callbacks, result } = context

    for (const remoteSound of remoteSounds) {
      if (localByFreesoundId.has(remoteSound.id)) continue

      try {
        const blob = await freesoundApi.downloadSound(remoteSound)
        const audioURL = URL.createObjectURL(blob)

        await callbacks.onRecordingAdd({
          name: remoteSound.name,
          description: remoteSound.description,
          length: remoteSound.duration,
          audioURL,
          data: blob,
          freesoundId: remoteSound.id,
          syncStatus: 'synced',
          lastSyncedAt: new Date().toISOString(),
          moderationStatus: 'approved'
        })

        result.downloaded++
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Download failed'
        result.errors.push(`Failed to download "${remoteSound.name}": ${message}`)
      }
    }
  }

  /**
   * Handles deletions: removes local recordings that were deleted remotely.
   */
  private async handleDeletedSounds(
    localByFreesoundId: Map<number, Recording>,
    remoteIds: Set<number>,
    pendingProcessingIds: Set<number>,
    pendingModerationIds: Set<number>,
    pendingUploadsFetched: boolean,
    callbacks: SyncCallbacks
  ): Promise<void> {
    for (const [freesoundId, localRec] of localByFreesoundId) {
      if (localRec.id === undefined) continue
      if (remoteIds.has(freesoundId)) continue
      if (localRec.moderationStatus === 'moderation_failed') continue

      // Sound is in pending processing or moderation — skip
      if (pendingProcessingIds.has(freesoundId) || pendingModerationIds.has(freesoundId)) continue

      // Only delete if we successfully fetched pending uploads and the sound
      // was previously approved (meaning it was public but has since been removed)
      if (pendingUploadsFetched && localRec.moderationStatus === 'approved') {
        await callbacks.onRecordingDelete(localRec.id)
      }
    }
  }

  async performSync(): Promise<SyncResult> {
    if (this.isRunning || !this.callbacks) {
      return { uploaded: 0, downloaded: 0, errors: [] }
    }

    // Check if we're rate limited
    if (this.isRateLimited) {
      logger.info(`Rate limited, waiting ${this.rateLimitWaitSeconds}s before next sync`)
      return { uploaded: 0, downloaded: 0, errors: [`Rate limited, retry in ${this.rateLimitWaitSeconds}s`] }
    }

    this.isRunning = true
    const result: SyncResult = { uploaded: 0, downloaded: 0, errors: [] }
    const context: UploadContext = { callbacks: this.callbacks, result }

    try {
      // Get local recordings
      const localRecordings = await this.callbacks.getRecordings()

      // Get remote sounds with our tag
      let remoteSounds: FreesoundSound[] = []
      try {
        const response = await freesoundApi.getSoundsByTag(FREESOUND_CONFIG.TAG)
        remoteSounds = response.results
      } catch (err) {
        logger.warn('Could not fetch remote sounds:', err)
      }

      // Build lookup maps
      const localByFreesoundId = new Map<number, Recording>()
      const localWithoutFreesoundId: Recording[] = []

      for (const rec of localRecordings) {
        if (rec.freesoundId) {
          localByFreesoundId.set(rec.freesoundId, rec)
        } else if (rec.id !== undefined) {
          localWithoutFreesoundId.push(rec)
        }
      }

      const remoteIds = new Set(remoteSounds.map(s => s.id))

      // 1. Upload local recordings that don't have a freesoundId
      await this.uploadLocalRecordings(localWithoutFreesoundId, context)

      // 2. Process explicit upload queue (recordings that were modified)
      await this.processUploadQueue(localRecordings, context)

      // 3. Push local edits to Freesound for approved recordings
      await this.updateRemoteRecordings(localRecordings, context)

      // 4. Fetch pending uploads for moderation status check
      let pendingProcessingIds = new Set<number>()
      let pendingModerationIds = new Set<number>()
      let pendingUploadsFetched = false

      try {
        const pendingUploads = await freesoundApi.getPendingUploads()
        pendingProcessingIds = new Set(pendingUploads.pending_processing.map(s => s.id))
        pendingModerationIds = new Set(pendingUploads.pending_moderation.map(s => s.id))
        pendingUploadsFetched = true
      } catch (err) {
        logger.warn('Could not fetch pending uploads:', err)
      }

      // 5. Update moderation statuses
      await this.updateModerationStatuses(
        localByFreesoundId,
        remoteIds,
        pendingProcessingIds,
        pendingModerationIds,
        pendingUploadsFetched,
        this.callbacks
      )

      // 6. Download remote sounds we don't have locally
      await this.downloadRemoteSounds(remoteSounds, localByFreesoundId, context)

      // 7. Handle deletions: remote deleted → delete local
      await this.handleDeletedSounds(
        localByFreesoundId,
        remoteIds,
        pendingProcessingIds,
        pendingModerationIds,
        pendingUploadsFetched,
        this.callbacks
      )

    } finally {
      this.isRunning = false
    }

    return result
  }
}

export const syncService = new SyncService()
export default syncService
