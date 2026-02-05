import { FREESOUND_CONFIG } from '../config/freesound'
import {
  FreesoundUser,
  FreesoundSound,
  FreesoundSoundsResponse,
  FreesoundTokenResponse,
  FreesoundUploadParams,
  FreesoundPendingUploadsResponse,
} from '../types/Freesound'

export class RateLimitError extends Error {
  constructor(message = 'Rate limited by Freesound API') {
    super(message)
    this.name = 'RateLimitError'
  }
}

class FreesoundApiService {
  private accessToken: string | null = null
  private cachedUsername: string | null = null
  private onTokenRefresh: ((tokens: FreesoundTokenResponse) => void) | null = null

  setAccessToken(token: string | null) {
    this.accessToken = token
    if (!token) {
      this.cachedUsername = null
    }
  }

  setUsername(username: string | null) {
    this.cachedUsername = username
  }

  setTokenRefreshCallback(callback: (tokens: FreesoundTokenResponse) => void) {
    this.onTokenRefresh = callback
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    if (!this.accessToken) {
      throw new Error('Not authenticated')
    }

    const url = endpoint.startsWith('http')
      ? endpoint
      : `${FREESOUND_CONFIG.API_BASE}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        ...options.headers,
      },
    })

    if (response.status === 429) {
      if (retryCount < 3) {
        const retryAfter = response.headers.get('Retry-After')
        const delaySeconds = retryAfter ? parseInt(retryAfter, 10) : 5 * Math.pow(2, retryCount)
        await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000))
        return this.request<T>(endpoint, options, retryCount + 1)
      }
      throw new RateLimitError()
    }

    if (response.status === 401) {
      throw new Error('Token expired')
    }

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Freesound API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  async exchangeCodeForTokens(code: string): Promise<FreesoundTokenResponse> {
    const response = await fetch(`${FREESOUND_CONFIG.OAUTH_PROXY_URL}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        redirect_uri: FREESOUND_CONFIG.REDIRECT_URI,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error_description || error.error || 'Token exchange failed')
    }

    return response.json()
  }

  async refreshAccessToken(refreshToken: string): Promise<FreesoundTokenResponse> {
    const response = await fetch(`${FREESOUND_CONFIG.OAUTH_PROXY_URL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error_description || error.error || 'Token refresh failed')
    }

    const tokens = await response.json()

    if (this.onTokenRefresh) {
      this.onTokenRefresh(tokens)
    }

    return tokens
  }

  async getMe(): Promise<FreesoundUser> {
    return this.request<FreesoundUser>('/me/')
  }

  async getMySounds(page = 1): Promise<FreesoundSoundsResponse> {
    const username = this.cachedUsername || (await this.getMe()).username
    return this.request<FreesoundSoundsResponse>(
      `/users/${username}/sounds/?page=${page}&page_size=150`
    )
  }

  async getSoundsByTag(tag: string, page = 1): Promise<FreesoundSoundsResponse> {
    const username = this.cachedUsername || (await this.getMe()).username
    return this.request<FreesoundSoundsResponse>(
      `/search/text/?query=&filter=username:${username} tag:${tag}&page=${page}&page_size=150`
    )
  }

  async getSound(id: number): Promise<FreesoundSound> {
    return this.request<FreesoundSound>(`/sounds/${id}/`)
  }

  async getPendingUploads(): Promise<FreesoundPendingUploadsResponse> {
    return this.request<FreesoundPendingUploadsResponse>('/sounds/pending_uploads/')
  }

  async downloadSound(sound: FreesoundSound): Promise<Blob> {
    if (!this.accessToken) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(sound.download, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to download sound: ${response.status}`)
    }

    return response.blob()
  }

  async uploadSound(params: FreesoundUploadParams): Promise<{ id: number }> {
    if (!this.accessToken) {
      throw new Error('Not authenticated')
    }

    console.log('Uploading to Freesound:', {
      name: params.name,
      tags: params.tags,
      fileSize: params.audioFile.size,
      fileType: params.audioFile.type,
    })

    const formData = new FormData()
    formData.append('audiofile', params.audioFile)
    formData.append('name', params.name)
    formData.append('tags', params.tags.join(' '))
    formData.append('description', params.description)
    formData.append('license', params.license)
    formData.append('bst_category', params.bst_category)

    const response = await fetch(`${FREESOUND_CONFIG.API_BASE}/sounds/upload/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Freesound upload error:', response.status, error)
      throw new Error(`Upload failed: ${response.status} - ${error}`)
    }

    const result = await response.json()
    console.log('Freesound upload success:', result)
    return result
  }

  async describeSound(
    uploadFilename: string,
    params: Omit<FreesoundUploadParams, 'audioFile'>
  ): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Not authenticated')
    }

    const formData = new FormData()
    formData.append('upload_filename', uploadFilename)
    formData.append('name', params.name)
    formData.append('tags', params.tags.join(' '))
    formData.append('description', params.description)
    formData.append('license', params.license)

    const response = await fetch(`${FREESOUND_CONFIG.API_BASE}/sounds/describe/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Describe failed: ${response.status} - ${error}`)
    }
  }
}

export const freesoundApi = new FreesoundApiService()
export default freesoundApi
