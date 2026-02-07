import { render, screen } from '@testing-library/react'

// Mock the context hooks
const mockUseFreesoundAuth = jest.fn()
const mockUseSync = jest.fn()

jest.mock('../../contexts/FreesoundAuthContext', () => ({
  useFreesoundAuth: () => mockUseFreesoundAuth(),
}))

jest.mock('../../contexts/SyncContext', () => ({
  useSync: () => mockUseSync(),
}))

// Import after mocks
import SyncIndicator from './index'

describe('SyncIndicator component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default to authenticated and online
    mockUseFreesoundAuth.mockReturnValue({ isAuthenticated: true })
    mockUseSync.mockReturnValue({
      isSyncing: false,
      isOnline: true,
      pendingCount: 0,
    })
  })

  it('renders nothing when not authenticated', () => {
    mockUseFreesoundAuth.mockReturnValue({ isAuthenticated: false })

    const { container } = render(<SyncIndicator />)

    expect(container.firstChild).toBeNull()
  })

  describe('when authenticated', () => {
    it('shows offline indicator when offline', () => {
      mockUseSync.mockReturnValue({
        isSyncing: false,
        isOnline: false,
        pendingCount: 0,
      })

      render(<SyncIndicator />)

      const indicator = screen.getByText('○')
      expect(indicator).toBeInTheDocument()
      expect(indicator).toHaveClass('sync-offline')
      expect(indicator).toHaveAttribute(
        'title',
        'Offline - changes will sync when online'
      )
    })

    it('shows syncing indicator when syncing', () => {
      mockUseSync.mockReturnValue({
        isSyncing: true,
        isOnline: true,
        pendingCount: 0,
      })

      render(<SyncIndicator />)

      const indicator = screen.getByText('◐')
      expect(indicator).toBeInTheDocument()
      expect(indicator).toHaveClass('sync-active')
      expect(indicator).toHaveAttribute('title', 'Syncing...')
    })

    it('shows pending indicator when items are pending', () => {
      mockUseSync.mockReturnValue({
        isSyncing: false,
        isOnline: true,
        pendingCount: 3,
      })

      render(<SyncIndicator />)

      const indicator = screen.getByText('◔')
      expect(indicator).toBeInTheDocument()
      expect(indicator).toHaveClass('sync-pending')
      expect(indicator).toHaveAttribute('title', '3 recording(s) waiting to sync')
    })

    it('shows single pending recording message', () => {
      mockUseSync.mockReturnValue({
        isSyncing: false,
        isOnline: true,
        pendingCount: 1,
      })

      render(<SyncIndicator />)

      const indicator = screen.getByText('◔')
      expect(indicator).toHaveAttribute('title', '1 recording(s) waiting to sync')
    })

    it('shows synced indicator when all synced', () => {
      mockUseSync.mockReturnValue({
        isSyncing: false,
        isOnline: true,
        pendingCount: 0,
      })

      render(<SyncIndicator />)

      const indicator = screen.getByText('●')
      expect(indicator).toBeInTheDocument()
      expect(indicator).toHaveClass('sync-ok')
      expect(indicator).toHaveAttribute('title', 'Synced with Freesound')
    })

    it('has sync-indicator class on all states', () => {
      // Test offline state
      mockUseSync.mockReturnValue({ isSyncing: false, isOnline: false, pendingCount: 0 })
      const { rerender } = render(<SyncIndicator />)
      expect(screen.getByText('○')).toHaveClass('sync-indicator')

      // Test syncing state
      mockUseSync.mockReturnValue({ isSyncing: true, isOnline: true, pendingCount: 0 })
      rerender(<SyncIndicator />)
      expect(screen.getByText('◐')).toHaveClass('sync-indicator')

      // Test pending state
      mockUseSync.mockReturnValue({ isSyncing: false, isOnline: true, pendingCount: 1 })
      rerender(<SyncIndicator />)
      expect(screen.getByText('◔')).toHaveClass('sync-indicator')

      // Test synced state
      mockUseSync.mockReturnValue({ isSyncing: false, isOnline: true, pendingCount: 0 })
      rerender(<SyncIndicator />)
      expect(screen.getByText('●')).toHaveClass('sync-indicator')
    })
  })

  describe('priority of states', () => {
    it('offline takes priority over syncing', () => {
      mockUseSync.mockReturnValue({
        isSyncing: true,
        isOnline: false,
        pendingCount: 5,
      })

      render(<SyncIndicator />)

      expect(screen.getByText('○')).toBeInTheDocument()
    })

    it('syncing takes priority over pending', () => {
      mockUseSync.mockReturnValue({
        isSyncing: true,
        isOnline: true,
        pendingCount: 5,
      })

      render(<SyncIndicator />)

      expect(screen.getByText('◐')).toBeInTheDocument()
    })

    it('pending takes priority over synced', () => {
      mockUseSync.mockReturnValue({
        isSyncing: false,
        isOnline: true,
        pendingCount: 1,
      })

      render(<SyncIndicator />)

      expect(screen.getByText('◔')).toBeInTheDocument()
    })
  })
})
