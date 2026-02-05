import { Recording, isReadyForSync } from '../SoundRecorderTypes'
import { FreesoundSound } from '../types/Freesound'
import { FREESOUND_CONFIG } from '../config/freesound'
import freesoundApi from './freesoundApi'
import { convertToWav } from '../utils/audioConverter'

export interface SyncResult {
  uploaded: number
  downloaded: number
  errors: string[]
}

// Track rate limit backoff
let rateLimitedUntil: number = 0

export interface SyncCallbacks {
  onRecordingUpdate: (id: number, updates: Partial<Recording>) => Promise<void>
  onRecordingAdd: (recording: Omit<Recording, 'id'>) => Promise<number>
  onRecordingDelete: (id: number) => Promise<void>
  getRecordings: () => Promise<Recording[]>
}

class SyncService {
  private isRunning = false
  private queue: number[] = [] // Recording IDs to upload
  private callbacks: SyncCallbacks | null = null

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

  async performSync(): Promise<SyncResult> {
    if (this.isRunning || !this.callbacks) {
      return { uploaded: 0, downloaded: 0, errors: [] }
    }

    // Check if we're rate limited
    if (Date.now() < rateLimitedUntil) {
      const waitSeconds = Math.ceil((rateLimitedUntil - Date.now()) / 1000)
      console.log(`Rate limited, waiting ${waitSeconds}s before next sync`)
      return { uploaded: 0, downloaded: 0, errors: [`Rate limited, retry in ${waitSeconds}s`] }
    }

    this.isRunning = true
    const result: SyncResult = { uploaded: 0, downloaded: 0, errors: [] }

    try {
      // Get local recordings
      const localRecordings = await this.callbacks.getRecordings()

      // Get remote sounds with our tag
      let remoteSounds: FreesoundSound[] = []
      try {
        const response = await freesoundApi.getSoundsByTag(FREESOUND_CONFIG.TAG)
        remoteSounds = response.results
      } catch (err) {
        // If we can't fetch remote sounds, just process uploads
        console.warn('Could not fetch remote sounds:', err)
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
      for (const recording of localWithoutFreesoundId) {
        if (recording.syncStatus === 'synced') continue
        if (!recording.data || !recording.id) continue
        if (!isReadyForSync(recording)) continue // Skip if missing name or description

        try {
          await this.callbacks.onRecordingUpdate(recording.id, { syncStatus: 'syncing' })

          // Convert to WAV format for Freesound compatibility
          const wavBlob = await convertToWav(recording.data)
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
          })

          await this.callbacks.onRecordingUpdate(recording.id, {
            freesoundId: uploadResult.id,
            syncStatus: 'synced',
            lastSyncedAt: new Date().toISOString(),
            syncError: undefined
          })

          result.uploaded++
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Upload failed'

          // Handle rate limiting
          if (message.includes('429') || message.includes('Too Many Requests')) {
            rateLimitedUntil = Date.now() + 60000 // Back off for 60 seconds
            result.errors.push('Rate limited by Freesound. Will retry in 60 seconds.')

            if (recording.id) {
              await this.callbacks.onRecordingUpdate(recording.id, {
                syncStatus: 'pending',
                syncError: 'Rate limited, will retry'
              })
            }
            break // Stop trying to upload more
          }

          result.errors.push(`Failed to upload "${recording.name}": ${message}`)

          if (recording.id) {
            await this.callbacks.onRecordingUpdate(recording.id, {
              syncStatus: 'error',
              syncError: message
            })
          }
        }

        // Remove from queue if it was there
        this.queue = this.queue.filter(id => id !== recording.id)
      }

      // 2. Process explicit upload queue (recordings that were modified)
      while (this.queue.length > 0 && Date.now() >= rateLimitedUntil) {
        const recordingId = this.queue.shift()!
        const recording = localRecordings.find(r => r.id === recordingId)

        if (!recording || !recording.data) continue
        if (recording.freesoundId) continue // Already uploaded
        if (!isReadyForSync(recording)) continue // Skip if missing name or description

        try {
          await this.callbacks.onRecordingUpdate(recordingId, { syncStatus: 'syncing' })

          // Convert to WAV format for Freesound compatibility
          const wavBlob = await convertToWav(recording.data)
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
          })

          await this.callbacks.onRecordingUpdate(recordingId, {
            freesoundId: uploadResult.id,
            syncStatus: 'synced',
            lastSyncedAt: new Date().toISOString(),
            syncError: undefined
          })

          result.uploaded++
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Upload failed'

          // Handle rate limiting
          if (message.includes('429') || message.includes('Too Many Requests')) {
            rateLimitedUntil = Date.now() + 60000
            result.errors.push('Rate limited by Freesound. Will retry in 60 seconds.')
            await this.callbacks.onRecordingUpdate(recordingId, {
              syncStatus: 'pending',
              syncError: 'Rate limited, will retry'
            })
            break
          }

          result.errors.push(`Failed to upload "${recording.name}": ${message}`)

          await this.callbacks.onRecordingUpdate(recordingId, {
            syncStatus: 'error',
            syncError: message
          })
        }
      }

      // 3. Download remote sounds we don't have locally
      for (const remoteSound of remoteSounds) {
        if (localByFreesoundId.has(remoteSound.id)) continue

        try {
          const blob = await freesoundApi.downloadSound(remoteSound)
          const audioURL = URL.createObjectURL(blob)

          await this.callbacks.onRecordingAdd({
            name: remoteSound.name,
            length: remoteSound.duration,
            audioURL,
            data: blob,
            freesoundId: remoteSound.id,
            syncStatus: 'synced',
            lastSyncedAt: new Date().toISOString()
          })

          result.downloaded++
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Download failed'
          result.errors.push(`Failed to download "${remoteSound.name}": ${message}`)
        }
      }

      // 4. Handle deletions: remote deleted → delete local
      // Only delete if we can confirm the sound was actually removed from Freesound
      // (not just pending moderation or missing from search)
      for (const [freesoundId, localRec] of localByFreesoundId) {
        if (!remoteIds.has(freesoundId) && localRec.id !== undefined) {
          try {
            await freesoundApi.getSound(freesoundId)
            // Sound still exists (possibly in moderation) — keep local copy
          } catch (err) {
            const message = err instanceof Error ? err.message : ''
            if (message.includes('404')) {
              // Sound truly deleted on Freesound — delete local copy
              await this.callbacks.onRecordingDelete(localRec.id)
            }
            // Any other error (network, auth, etc.) — keep local copy to be safe
          }
        }
      }

    } finally {
      this.isRunning = false
    }

    return result
  }

  isCurrentlySyncing(): boolean {
    return this.isRunning
  }
}

export const syncService = new SyncService()
export default syncService
