import { useSync } from '../../contexts/SyncContext'
import { useFreesoundAuth } from '../../contexts/FreesoundAuthContext'
import './style.css'

const SyncIndicator = () => {
  const { isAuthenticated } = useFreesoundAuth()
  const { isSyncing, isOnline, pendingCount } = useSync()

  // Don't show anything if not authenticated
  if (!isAuthenticated) {
    return null
  }

  // Show offline indicator
  if (!isOnline) {
    return (
      <span className="sync-indicator sync-offline" title="Offline - changes will sync when online">
        ○
      </span>
    )
  }

  // Show syncing indicator
  if (isSyncing) {
    return (
      <span className="sync-indicator sync-active" title="Syncing...">
        ◐
      </span>
    )
  }

  // Show pending indicator
  if (pendingCount > 0) {
    return (
      <span className="sync-indicator sync-pending" title={`${pendingCount} recording(s) waiting to sync`}>
        ◔
      </span>
    )
  }

  // All synced - show subtle cloud icon
  return (
    <span className="sync-indicator sync-ok" title="Synced with Freesound">
      ●
    </span>
  )
}

export default SyncIndicator
