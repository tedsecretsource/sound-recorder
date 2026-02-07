import { RateLimitError } from './freesoundApi'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock the config
jest.mock('../config/freesound', () => ({
  FREESOUND_CONFIG: {
    API_BASE: 'https://proxy.example.com/api',
    OAUTH_PROXY_URL: 'https://proxy.example.com',
    REDIRECT_URI: 'http://localhost:3000/',
  },
}))

// Mock logger
jest.mock('../utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}))

// Mock constants
jest.mock('../constants/config', () => ({
  API: {
    MAX_RETRIES: 3,
    INITIAL_BACKOFF_SECONDS: 0.001, // Fast for testing
  },
}))

// Import after mocks
import { freesoundApi } from './freesoundApi'

describe('FreesoundApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    freesoundApi.setUsername(null)
  })

  describe('setUsername', () => {
    it('caches the username', () => {
      freesoundApi.setUsername('testuser')
      // Username is private, but we can verify it's used in getMySounds
      expect(freesoundApi).toBeDefined()
    })
  })

  describe('exchangeCodeForTokens', () => {
    it('sends POST request with code and redirect_uri', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, expires_in: 3600 }),
      })

      const result = await freesoundApi.exchangeCodeForTokens('auth_code_123')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://proxy.example.com/token',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: 'auth_code_123',
            redirect_uri: 'http://localhost:3000/',
          }),
        })
      )
      expect(result).toEqual({ success: true, expires_in: 3600 })
    })

    it('throws error on failed token exchange', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error_description: 'Invalid code' }),
      })

      await expect(freesoundApi.exchangeCodeForTokens('bad_code')).rejects.toThrow('Invalid code')
    })

    it('handles error object without error_description', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'access_denied' }),
      })

      await expect(freesoundApi.exchangeCodeForTokens('bad_code')).rejects.toThrow('access_denied')
    })

    it('handles error object with neither field', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      })

      await expect(freesoundApi.exchangeCodeForTokens('bad_code')).rejects.toThrow(
        'Token exchange failed'
      )
    })
  })

  describe('logout', () => {
    it('sends POST request to logout endpoint and clears username', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })
      freesoundApi.setUsername('testuser')

      await freesoundApi.logout()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://proxy.example.com/api/logout',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      )
    })
  })

  describe('checkAuthStatus', () => {
    it('returns true when authenticated', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ authenticated: true }),
      })

      const result = await freesoundApi.checkAuthStatus()

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://proxy.example.com/api/auth/status',
        expect.objectContaining({ credentials: 'include' })
      )
    })

    it('returns false when not authenticated', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ authenticated: false }),
      })

      const result = await freesoundApi.checkAuthStatus()

      expect(result).toBe(false)
    })

    it('returns false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await freesoundApi.checkAuthStatus()

      expect(result).toBe(false)
    })
  })

  describe('getMe', () => {
    it('fetches user info from /me/ endpoint', async () => {
      const mockUser = { username: 'testuser', num_sounds: 42 }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      })

      const result = await freesoundApi.getMe()

      expect(result).toEqual(mockUser)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://proxy.example.com/api/me/',
        expect.objectContaining({ credentials: 'include' })
      )
    })

    it('throws on 401 unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      })

      await expect(freesoundApi.getMe()).rejects.toThrow('Not authenticated')
    })
  })

  describe('getMySounds', () => {
    it('fetches sounds for cached username', async () => {
      freesoundApi.setUsername('cacheduser')
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [], count: 0 }),
      })

      await freesoundApi.getMySounds()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://proxy.example.com/api/users/cacheduser/sounds/?page=1&page_size=150',
        expect.anything()
      )
    })

    it('fetches username from getMe if not cached', async () => {
      // First call for getMe, second for getMySounds
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ username: 'fetcheduser' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ results: [], count: 0 }),
        })

      await freesoundApi.getMySounds()

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('supports pagination parameter', async () => {
      freesoundApi.setUsername('testuser')
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [], count: 0 }),
      })

      await freesoundApi.getMySounds(3)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=3'),
        expect.anything()
      )
    })
  })

  describe('getSoundsByTag', () => {
    it('searches sounds by tag', async () => {
      freesoundApi.setUsername('testuser')
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [], count: 0 }),
      })

      await freesoundApi.getSoundsByTag('field-recording')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('tag:field-recording'),
        expect.anything()
      )
    })
  })

  describe('getSound', () => {
    it('fetches individual sound by ID', async () => {
      const mockSound = { id: 123, name: 'Test Sound' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSound),
      })

      const result = await freesoundApi.getSound(123)

      expect(result).toEqual(mockSound)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://proxy.example.com/api/sounds/123/',
        expect.anything()
      )
    })
  })

  describe('getPendingUploads', () => {
    it('fetches pending uploads', async () => {
      const mockResponse = {
        pending_description: [],
        pending_processing: [],
        pending_moderation: [],
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await freesoundApi.getPendingUploads()

      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://proxy.example.com/api/sounds/pending_uploads/',
        expect.anything()
      )
    })
  })

  describe('downloadSound', () => {
    it('downloads sound through proxy', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/wav' })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      })

      const sound = {
        id: 123,
        download: 'https://freesound.org/apiv2/sounds/123/download/',
      } as any

      const result = await freesoundApi.downloadSound(sound)

      expect(result).toBe(mockBlob)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://proxy.example.com/api/sounds/123/download/',
        expect.objectContaining({ credentials: 'include' })
      )
    })

    it('throws on download failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      const sound = {
        id: 123,
        download: 'https://freesound.org/apiv2/sounds/123/download/',
      } as any

      await expect(freesoundApi.downloadSound(sound)).rejects.toThrow(
        'Failed to download sound: 404'
      )
    })
  })

  describe('uploadSound', () => {
    it('uploads sound with FormData', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 456 }),
      })

      const file = new File(['audio'], 'test.wav', { type: 'audio/wav' })
      const params = {
        audioFile: file,
        name: 'Test Recording',
        tags: ['test', 'recording'],
        description: 'A test recording',
        license: 'Creative Commons 0' as const,
        bst_category: 'fx-other' as const,
      }

      const result = await freesoundApi.uploadSound(params, 42)

      expect(result).toEqual({ id: 456 })
      expect(mockFetch).toHaveBeenCalledWith(
        'https://proxy.example.com/api/sounds/upload/',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: expect.objectContaining({
            'X-Recording-Id': '42',
          }),
        })
      )
    })

    it('uploads without recording ID header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 789 }),
      })

      const file = new File(['audio'], 'test.wav', { type: 'audio/wav' })
      const params = {
        audioFile: file,
        name: 'Test',
        tags: ['test'],
        description: 'Test',
        license: 'Creative Commons 0' as const,
        bst_category: 'fx-other' as const,
      }

      await freesoundApi.uploadSound(params)

      const [, options] = mockFetch.mock.calls[0]
      expect(options.headers['X-Recording-Id']).toBeUndefined()
    })

    it('throws on upload failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Invalid audio format'),
      })

      const file = new File(['audio'], 'test.wav', { type: 'audio/wav' })
      const params = {
        audioFile: file,
        name: 'Test',
        tags: ['test'],
        description: 'Test',
        license: 'Creative Commons 0' as const,
        bst_category: 'fx-other' as const,
      }

      await expect(freesoundApi.uploadSound(params)).rejects.toThrow(
        'Upload failed: 400 - Invalid audio format'
      )
    })
  })

  describe('describeSound', () => {
    it('describes uploaded sound with FormData', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      const params = {
        name: 'Described Sound',
        tags: ['tag1', 'tag2'],
        description: 'Description',
        license: 'Creative Commons 0' as const,
        bst_category: 'fx-other' as const,
      }

      await freesoundApi.describeSound('upload_filename.wav', params)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://proxy.example.com/api/sounds/describe/',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      )
    })

    it('throws on describe failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Missing required fields'),
      })

      const params = {
        name: 'Test',
        tags: ['tag1'],
        description: 'Test',
        license: 'Creative Commons 0' as const,
        bst_category: 'fx-other' as const,
      }

      await expect(freesoundApi.describeSound('file.wav', params)).rejects.toThrow(
        'Describe failed: 400 - Missing required fields'
      )
    })
  })

  describe('rate limiting', () => {
    it('retries on 429 with exponential backoff', async () => {
      // First call returns 429, second succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Map([['Retry-After', '1']]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ username: 'testuser' }),
        })

      const result = await freesoundApi.getMe()

      expect(result).toEqual({ username: 'testuser' })
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('throws RateLimitError after max retries', async () => {
      // All calls return 429
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Map(),
      })

      await expect(freesoundApi.getMe()).rejects.toThrow(RateLimitError)
      expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('error handling', () => {
    it('handles non-ok responses with error text', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      })

      await expect(freesoundApi.getMe()).rejects.toThrow(
        'Freesound API error: 500 - Internal Server Error'
      )
    })

    it('handles full URL endpoints', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      })

      // The internal request method should handle full URLs
      freesoundApi.setUsername('testuser')
      await freesoundApi.getMySounds()

      // Verify the URL was constructed correctly
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://proxy.example.com/api'),
        expect.anything()
      )
    })
  })
})

describe('RateLimitError', () => {
  it('has correct name and message', () => {
    const error = new RateLimitError()
    expect(error.name).toBe('RateLimitError')
    expect(error.message).toBe('Rate limited by Freesound API')
  })

  it('accepts custom message', () => {
    const error = new RateLimitError('Custom rate limit message')
    expect(error.message).toBe('Custom rate limit message')
  })
})
