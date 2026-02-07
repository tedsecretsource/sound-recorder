import {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import { FREESOUND_CONFIG } from '../config/freesound'
import { FreesoundUser } from '../types/Freesound'
import freesoundApi from '../services/freesoundApi'
import logger from '../utils/logger'
import { createContextHook } from '../utils/createContextHook'

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

export const FreesoundAuthProvider = ({ children }: FreesoundAuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<FreesoundUser | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCallback = useCallback(async (code: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Exchange code for tokens (sets HttpOnly cookies)
      await freesoundApi.exchangeCodeForTokens(code)

      // Fetch user info
      const userInfo = await freesoundApi.getMe()
      freesoundApi.setUsername(userInfo.username)
      setUser(userInfo)
      setIsAuthenticated(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed'
      setError(message)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initialize auth state and handle OAuth callback
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

      // Check if we have a valid session (via HttpOnly cookie)
      const authenticated = await freesoundApi.checkAuthStatus()

      if (authenticated) {
        try {
          const userInfo = await freesoundApi.getMe()
          freesoundApi.setUsername(userInfo.username)
          setUser(userInfo)
          setIsAuthenticated(true)
        } catch (err) {
          logger.error('Failed to fetch user info:', err)
          setIsAuthenticated(false)
        }
      }

      setIsLoading(false)
    }

    initAuth()
  }, [handleCallback])

  const login = useCallback(() => {
    window.location.href = FREESOUND_CONFIG.AUTHORIZE_URL
  }, [])

  const logout = useCallback(async () => {
    try {
      await freesoundApi.logout()
    } catch (err) {
      logger.error('Logout request failed:', err)
    }
    freesoundApi.setUsername(null)
    setIsAuthenticated(false)
    setUser(null)
    setError(null)
  }, [])

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

export const useFreesoundAuth = createContextHook(FreesoundAuthContext, 'useFreesoundAuth')

export default FreesoundAuthContext
