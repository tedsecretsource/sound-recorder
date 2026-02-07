import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock dependencies - use shared object for named and default exports
jest.mock('../services/freesoundApi', () => {
  const mockApi = {
    exchangeCodeForTokens: jest.fn(),
    logout: jest.fn(),
    checkAuthStatus: jest.fn(),
    getMe: jest.fn(),
    setUsername: jest.fn(),
  }
  return {
    __esModule: true,
    freesoundApi: mockApi,
    default: mockApi,
  }
})

jest.mock('../config/freesound', () => ({
  FREESOUND_CONFIG: {
    AUTHORIZE_URL: 'https://freesound.org/authorize',
  },
}))

jest.mock('../utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}))

// Import after mocks
import { FreesoundAuthProvider, useFreesoundAuth } from './FreesoundAuthContext'
import freesoundApi from '../services/freesoundApi'

// Get typed references to mocks
const mockExchangeCodeForTokens = freesoundApi.exchangeCodeForTokens as jest.Mock
const mockLogout = freesoundApi.logout as jest.Mock
const mockCheckAuthStatus = freesoundApi.checkAuthStatus as jest.Mock
const mockGetMe = freesoundApi.getMe as jest.Mock
const mockSetUsername = freesoundApi.setUsername as jest.Mock

// Test component to access context
const TestConsumer = () => {
  const auth = useFreesoundAuth()
  return (
    <div>
      <span data-testid="isAuthenticated">{auth.isAuthenticated.toString()}</span>
      <span data-testid="isLoading">{auth.isLoading.toString()}</span>
      <span data-testid="username">{auth.user?.username || 'none'}</span>
      <span data-testid="error">{auth.error || 'none'}</span>
      <button data-testid="loginBtn" onClick={auth.login}>Login</button>
      <button data-testid="logoutBtn" onClick={auth.logout}>Logout</button>
      <button data-testid="callbackBtn" onClick={() => auth.handleCallback('test_code')}>
        Callback
      </button>
    </div>
  )
}

describe('FreesoundAuthProvider', () => {
  const originalLocation = window.location

  beforeEach(() => {
    jest.clearAllMocks()
    mockCheckAuthStatus.mockResolvedValue(false)
    mockGetMe.mockResolvedValue({ username: 'testuser' })

    // Mock window.location
    delete (window as any).location
    window.location = {
      ...originalLocation,
      href: 'http://localhost:3000/',
      search: '',
      origin: 'http://localhost:3000',
      pathname: '/',
      hash: '',
    } as any
    window.history.replaceState = jest.fn()
  })

  afterEach(() => {
    window.location = originalLocation
  })

  it('renders children', async () => {
    render(
      <FreesoundAuthProvider>
        <div data-testid="child">Child Content</div>
      </FreesoundAuthProvider>
    )

    expect(screen.getByTestId('child')).toHaveTextContent('Child Content')
  })

  it('provides initial context values', async () => {
    render(
      <FreesoundAuthProvider>
        <TestConsumer />
      </FreesoundAuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
    })

    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false')
    expect(screen.getByTestId('username')).toHaveTextContent('none')
    expect(screen.getByTestId('error')).toHaveTextContent('none')
  })

  it('checks auth status on mount', async () => {
    render(
      <FreesoundAuthProvider>
        <TestConsumer />
      </FreesoundAuthProvider>
    )

    await waitFor(() => {
      expect(mockCheckAuthStatus).toHaveBeenCalled()
    })
  })

  it('loads user when already authenticated', async () => {
    mockCheckAuthStatus.mockResolvedValue(true)
    mockGetMe.mockResolvedValue({ username: 'existinguser' })

    render(
      <FreesoundAuthProvider>
        <TestConsumer />
      </FreesoundAuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true')
    })

    expect(screen.getByTestId('username')).toHaveTextContent('existinguser')
    expect(mockSetUsername).toHaveBeenCalledWith('existinguser')
  })

  it('handles failed user fetch when authenticated', async () => {
    mockCheckAuthStatus.mockResolvedValue(true)
    mockGetMe.mockRejectedValue(new Error('Network error'))

    render(
      <FreesoundAuthProvider>
        <TestConsumer />
      </FreesoundAuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
    })

    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false')
  })

  describe('OAuth callback handling', () => {
    it('processes OAuth code from URL', async () => {
      window.location.search = '?code=oauth_code_123'
      mockExchangeCodeForTokens.mockResolvedValue({ success: true, expires_in: 3600 })
      mockGetMe.mockResolvedValue({ username: 'newuser' })

      render(
        <FreesoundAuthProvider>
          <TestConsumer />
        </FreesoundAuthProvider>
      )

      await waitFor(() => {
        expect(mockExchangeCodeForTokens).toHaveBeenCalledWith('oauth_code_123')
      })

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true')
      })

      expect(screen.getByTestId('username')).toHaveTextContent('newuser')
      expect(window.history.replaceState).toHaveBeenCalled()
    })

    it('handles OAuth callback errors', async () => {
      window.location.search = '?code=bad_code'
      mockExchangeCodeForTokens.mockRejectedValue(new Error('Invalid code'))

      render(
        <FreesoundAuthProvider>
          <TestConsumer />
        </FreesoundAuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid code')
      })

      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false')
    })

    it('handles non-Error exceptions in callback', async () => {
      window.location.search = '?code=bad_code'
      mockExchangeCodeForTokens.mockRejectedValue('String error')

      render(
        <FreesoundAuthProvider>
          <TestConsumer />
        </FreesoundAuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Authentication failed')
      })
    })
  })

  describe('login', () => {
    it('redirects to Freesound authorize URL', async () => {
      render(
        <FreesoundAuthProvider>
          <TestConsumer />
        </FreesoundAuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
      })

      userEvent.click(screen.getByTestId('loginBtn'))

      expect(window.location.href).toBe('https://freesound.org/authorize')
    })
  })

  describe('logout', () => {
    it('clears auth state and calls API logout', async () => {
      mockCheckAuthStatus.mockResolvedValue(true)
      mockGetMe.mockResolvedValue({ username: 'testuser' })

      render(
        <FreesoundAuthProvider>
          <TestConsumer />
        </FreesoundAuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true')
      })

      userEvent.click(screen.getByTestId('logoutBtn'))

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false')
      })

      expect(mockLogout).toHaveBeenCalled()
      expect(mockSetUsername).toHaveBeenCalledWith(null)
      expect(screen.getByTestId('username')).toHaveTextContent('none')
    })

    it('clears state even if API logout fails', async () => {
      mockCheckAuthStatus.mockResolvedValue(true)
      mockGetMe.mockResolvedValue({ username: 'testuser' })
      mockLogout.mockRejectedValue(new Error('Network error'))

      render(
        <FreesoundAuthProvider>
          <TestConsumer />
        </FreesoundAuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true')
      })

      userEvent.click(screen.getByTestId('logoutBtn'))

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false')
      })
    })
  })

  describe('handleCallback', () => {
    it('can be called manually', async () => {
      mockExchangeCodeForTokens.mockResolvedValue({ success: true, expires_in: 3600 })
      mockGetMe.mockResolvedValue({ username: 'callbackuser' })

      render(
        <FreesoundAuthProvider>
          <TestConsumer />
        </FreesoundAuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
      })

      userEvent.click(screen.getByTestId('callbackBtn'))

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true')
      })

      expect(screen.getByTestId('username')).toHaveTextContent('callbackuser')
    })
  })
})

describe('useFreesoundAuth', () => {
  it('throws error when used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<TestConsumer />)).toThrow(
      'useFreesoundAuth must be used within its Provider'
    )

    consoleError.mockRestore()
  })
})
