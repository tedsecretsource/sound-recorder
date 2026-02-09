import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react'
import { useFreesoundAuth } from './FreesoundAuthContext'
import { useRecordings } from './RecordingsContext'
import { Recording } from '../SoundRecorderTypes'
import syncService, { SyncResult } from '../services/syncService'
import { SYNC } from '../constants/config'
import logger from '../utils/logger'
import { createContextHook } from '../utils/createContextHook'

interface SyncContextValue {
  isSyncing: boolean
  isOnline: boolean
  lastSyncTime: Date | null
  lastSyncResult: SyncResult | null
  pendingCount: number
  triggerSync: () => Promise<void>
  retryModeration: (recordingId: number) => Promise<void>
}

const SyncContext = createContext<SyncContextValue | null>(null)

interface SyncProviderProps {
  children: ReactNode
}

export const SyncProvider = ({ children }: SyncProviderProps) => {
  const { isAuthenticated } = useFreesoundAuth()
  const { recordings, updateRecording, addRecording, deleteRecording } = useRecordings()

  const [isSyncing, setIsSyncing] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null)
  const [pendingCount, setPendingCount] = useState(0)

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSyncAtRef = useRef<number>(0)

  // Wire up sync service callbacks
  useEffect(() => {
    syncService.setCallbacks({
      onRecordingUpdate: async (id, updates) => {
        const recording = recordings.find(r => r.id === id)
        if (recording) {
          await updateRecording({ ...recording, ...updates })
        }
      },
      onRecordingAdd: async (recording) => {
        return await addRecording(recording as Recording)
      },
      onRecordingDelete: async (id) => {
        await deleteRecording(id)
      },
      getRecordings: async () => {
        return recordings
      },
    })
  }, [recordings, updateRecording, addRecording, deleteRecording])

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const triggerSync = useCallback(async () => {
    if (!isAuthenticated || isSyncing) {
      return
    }

    // When offline, still attempt uploads - service worker will queue them
    // But skip if there's nothing to upload
    if (!isOnline && syncService.isQueueEmpty()) {
      return
    }

    setIsSyncing(true)
    setPendingCount(syncService.getQueueLength())

    try {
      const result = await syncService.performSync()
      setLastSyncResult(result)
      setLastSyncTime(new Date())
      lastSyncAtRef.current = Date.now()

      if (result.errors.length > 0) {
        logger.warn('Sync completed with errors:', result.errors)
      }
    } catch (err) {
      // Network errors are expected when offline - service worker handles queuing
      if (isOnline) {
        logger.error('Sync failed:', err)
      }
    } finally {
      setIsSyncing(false)
      setPendingCount(syncService.getQueueLength())
    }
  }, [isAuthenticated, isOnline, isSyncing])

  // Debounced sync trigger with minimum interval
  const debouncedSync = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }

    const timeSinceLastSync = Date.now() - lastSyncAtRef.current
    const delay = Math.max(SYNC.DEBOUNCE_MS, SYNC.MIN_INTERVAL_MS - timeSinceLastSync)

    syncTimeoutRef.current = setTimeout(() => {
      triggerSync()
    }, delay)
  }, [triggerSync])

  // Retry a moderation-failed recording by clearing its Freesound state
  const retryModeration = useCallback(async (recordingId: number) => {
    const recording = recordings.find(r => r.id === recordingId)
    if (!recording) return

    await updateRecording({
      ...recording,
      freesoundId: undefined,
      moderationStatus: undefined,
      syncStatus: 'pending',
      syncError: undefined,
      lastSyncedAt: undefined,
    })

    syncService.queueUpload(recordingId)
    debouncedSync()
  }, [recordings, updateRecording, debouncedSync])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [])

  // Listen for service worker upload completion messages
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'UPLOAD_COMPLETE') {
        const { recordingId, freesoundId } = event.data
        const recording = recordings.find(r => r.id === recordingId)
        if (recording) {
          await updateRecording({
            ...recording,
            freesoundId,
            syncStatus: 'synced',
            lastSyncedAt: new Date().toISOString(),
            moderationStatus: 'processing'
          })
          logger.info(`Background upload completed for recording ${recordingId}`)
        }
      }
    }

    navigator.serviceWorker?.addEventListener('message', handleMessage)
    return () => navigator.serviceWorker?.removeEventListener('message', handleMessage)
  }, [recordings, updateRecording])

  const value: SyncContextValue = {
    isSyncing,
    isOnline,
    lastSyncTime,
    lastSyncResult,
    pendingCount,
    triggerSync,
    retryModeration,
  }

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  )
}

export const useSync = createContextHook(SyncContext, 'useSync')

export default SyncContext
