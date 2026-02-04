import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react'
import { useFreesoundAuth } from './FreesoundAuthContext'
import { useRecordings } from './RecordingsContext'
import { Recording, isReadyForSync } from '../SoundRecorderTypes'
import syncService, { SyncResult } from '../services/syncService'

interface SyncContextValue {
  isSyncing: boolean
  isOnline: boolean
  lastSyncTime: Date | null
  lastSyncResult: SyncResult | null
  pendingCount: number
  triggerSync: () => Promise<void>
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
  const hasInitialSyncedRef = useRef(false)

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
    if (!isAuthenticated || !isOnline || isSyncing) {
      return
    }

    setIsSyncing(true)
    setPendingCount(syncService.getQueueLength())

    try {
      const result = await syncService.performSync()
      setLastSyncResult(result)
      setLastSyncTime(new Date())

      if (result.errors.length > 0) {
        console.warn('Sync completed with errors:', result.errors)
      }
    } catch (err) {
      console.error('Sync failed:', err)
    } finally {
      setIsSyncing(false)
      setPendingCount(syncService.getQueueLength())
    }
  }, [isAuthenticated, isOnline, isSyncing])

  // Debounced sync trigger
  const debouncedSync = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }

    syncTimeoutRef.current = setTimeout(() => {
      triggerSync()
    }, 2000) // Wait 2 seconds after last change before syncing
  }, [triggerSync])

  // Initial sync when authenticated
  useEffect(() => {
    if (isAuthenticated && isOnline && !hasInitialSyncedRef.current) {
      hasInitialSyncedRef.current = true
      // Delay initial sync slightly to let the app settle
      const timeout = setTimeout(() => {
        triggerSync()
      }, 1000)
      return () => clearTimeout(timeout)
    }
  }, [isAuthenticated, isOnline, triggerSync])

  // Sync when coming back online
  useEffect(() => {
    if (isOnline && isAuthenticated && hasInitialSyncedRef.current) {
      debouncedSync()
    }
  }, [isOnline, isAuthenticated, debouncedSync])

  // Queue new recordings for upload and trigger sync
  useEffect(() => {
    if (!isAuthenticated) return

    for (const recording of recordings) {
      if (
        recording.id !== undefined &&
        !recording.freesoundId &&
        recording.syncStatus !== 'syncing' &&
        recording.syncStatus !== 'error' &&
        isReadyForSync(recording) // Only queue if has custom name and description
      ) {
        syncService.queueUpload(recording.id)
      }
    }

    setPendingCount(syncService.getQueueLength())

    if (!syncService.isQueueEmpty()) {
      debouncedSync()
    }
  }, [recordings, isAuthenticated, debouncedSync])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [])

  const value: SyncContextValue = {
    isSyncing,
    isOnline,
    lastSyncTime,
    lastSyncResult,
    pendingCount,
    triggerSync,
  }

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  )
}

export const useSync = (): SyncContextValue => {
  const context = useContext(SyncContext)
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider')
  }
  return context
}

export default SyncContext
