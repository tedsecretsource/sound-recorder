import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import { openDB } from 'idb'
import { FREESOUND_CONFIG } from '../config/freesound'
import { FreesoundUser, FreesoundTokenResponse } from '../types/Freesound'
import { SoundRecorderDB } from '../SoundRecorderTypes'
import freesoundApi from '../services/freesoundApi'

const STORAGE_KEY = 'freesound-auth'

interface StoredAuth {
  accessToken: string
  refreshToken: string
  expiresAt: number
  user: FreesoundUser | null
}

interface FreesoundAuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  user: FreesoundUser | null
  error: string | null
  login: () => void
  logout: () => void
  handleCallback: (code: string) => Promise<void>
}

const FreesoundAuthContext = createContext<FreesoundAuthContextValue | null>(null)

interface FreesoundAuthProviderProps {
  children: ReactNode
}

function loadStoredAuth(): StoredAuth | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load Freesound auth from localStorage:', error)
  }
  return null
}

function saveAuth(auth: StoredAuth): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
  } catch (error) {
    console.error('Failed to save Freesound auth to localStorage:', error)
  }
}

function clearAuth(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear Freesound auth from localStorage:', error)
  }
}

async function saveAuthTokenToIndexedDB(tokens: { accessToken: string; refreshToken: string; expiresAt: number }): Promise<void> {
  try {
    const db = await openDB<SoundRecorderDB>('sound-recorder', 2)
    await db.put('auth-tokens', tokens, 'current')
    db.close()
  } catch (error) {
    console.error('Failed to save auth token to IndexedDB:', error)
  }
}

async function clearAuthTokenFromIndexedDB(): Promise<void> {
  try {
    const db = await openDB<SoundRecorderDB>('sound-recorder', 2)
    await db.delete('auth-tokens', 'current')
    db.close()
  } catch (error) {
    console.error('Failed to clear auth token from IndexedDB:', error)
  }
}

export const FreesoundAuthProvider = ({ children }: FreesoundAuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<FreesoundUser | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)

  const handleTokens = useCallback((tokens: FreesoundTokenResponse, existingUser?: FreesoundUser | null) => {
    const expiresAt = Date.now() + tokens.expires_in * 1000

    freesoundApi.setAccessToken(tokens.access_token)
    setRefreshToken(tokens.refresh_token)
    setIsAuthenticated(true)

    saveAuth({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
      user: existingUser || null,
    })

    // Save to IndexedDB for service worker access
    saveAuthTokenToIndexedDB({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
    })
  }, [])

  const refreshAccessToken = useCallback(async (token: string): Promise<boolean> => {
    try {
      const tokens = await freesoundApi.refreshAccessToken(token)
      handleTokens(tokens, user)
      return true
    } catch (err) {
      console.error('Token refresh failed:', err)
      return false
    }
  }, [handleTokens, user])

  // Initialize auth state from localStorage and handle OAuth callback
  useEffect(() => {
    const initAuth = async () => {
      // Check for OAuth callback code in URL
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')

      if (code) {
        // Clear the code from URL to prevent re-processing
        const newUrl = window.location.origin + window.location.pathname + window.location.hash
        window.history.replaceState({}, '', newUrl)

        // Exchange code for tokens
        await handleCallback(code)
        return
      }

      const stored = loadStoredAuth()

      if (!stored) {
        setIsLoading(false)
        return
      }

      // Check if token is expired or will expire soon (within 5 minutes)
      const isExpired = Date.now() > stored.expiresAt - 5 * 60 * 1000

      if (isExpired) {
        // Try to refresh the token
        const success = await refreshAccessToken(stored.refreshToken)
        if (!success) {
          clearAuth()
          setIsLoading(false)
          return
        }
      } else {
        freesoundApi.setAccessToken(stored.accessToken)
        setRefreshToken(stored.refreshToken)
        setIsAuthenticated(true)
      }

      // Fetch user info if we don't have it
      if (!stored.user) {
        try {
          const userInfo = await freesoundApi.getMe()
          freesoundApi.setUsername(userInfo.username)
          setUser(userInfo)
          saveAuth({ ...stored, user: userInfo })
        } catch (err) {
          console.error('Failed to fetch user info:', err)
        }
      } else {
        freesoundApi.setUsername(stored.user.username)
        setUser(stored.user)
      }

      setIsLoading(false)
    }

    initAuth()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Set up token refresh callback
  useEffect(() => {
    freesoundApi.setTokenRefreshCallback((tokens) => {
      handleTokens(tokens, user)
    })
  }, [handleTokens, user])

  const login = useCallback(() => {
    window.location.href = FREESOUND_CONFIG.AUTHORIZE_URL
  }, [])

  const logout = useCallback(() => {
    freesoundApi.setAccessToken(null)
    freesoundApi.setUsername(null)
    setIsAuthenticated(false)
    setUser(null)
    setRefreshToken(null)
    setError(null)
    clearAuth()
    clearAuthTokenFromIndexedDB()
  }, [])

  const handleCallback = useCallback(async (code: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const tokens = await freesoundApi.exchangeCodeForTokens(code)
      handleTokens(tokens)

      // Fetch user info
      const userInfo = await freesoundApi.getMe()
      freesoundApi.setUsername(userInfo.username)
      setUser(userInfo)

      // Update stored auth with user info
      const stored = loadStoredAuth()
      if (stored) {
        saveAuth({ ...stored, user: userInfo })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed'
      setError(message)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }, [handleTokens])

  const value: FreesoundAuthContextValue = {
    isAuthenticated,
    isLoading,
    user,
    error,
    login,
    logout,
    handleCallback,
  }

  return (
    <FreesoundAuthContext.Provider value={value}>
      {children}
    </FreesoundAuthContext.Provider>
  )
}

export const useFreesoundAuth = (): FreesoundAuthContextValue => {
  const context = useContext(FreesoundAuthContext)
  if (!context) {
    throw new Error('useFreesoundAuth must be used within a FreesoundAuthProvider')
  }
  return context
}

export default FreesoundAuthContext
