import { FREESOUND_CONFIG } from '../config/freesound'
import {
  FreesoundUser,
  FreesoundSound,
  FreesoundSoundsResponse,
  FreesoundUploadParams,
  FreesoundPendingUploadsResponse,
} from '../types/Freesound'
import { API } from '../constants/config'
import logger from '../utils/logger'

export class RateLimitError extends Error {
  constructor(message = 'Rate limited by Freesound API') {
    super(message)
    this.name = 'RateLimitError'
  }
}

class FreesoundApiService {
  private cachedUsername: string | null = null

  setUsername(username: string | null) {
    this.cachedUsername = username
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${FREESOUND_CONFIG.API_BASE}${endpoint}`

    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        ...options.headers,
      },
    })

    if (response.status === 429) {
      if (retryCount < API.MAX_RETRIES) {
        const retryAfter = response.headers.get('Retry-After')
        const delaySeconds = retryAfter ? parseInt(retryAfter, 10) : API.INITIAL_BACKOFF_SECONDS * Math.pow(2, retryCount)
        await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000))
        return this.request<T>(endpoint, options, retryCount + 1)
      }
      throw new RateLimitError()
    }

    if (response.status === 401) {
      throw new Error('Not authenticated')
    }

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Freesound API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  async exchangeCodeForTokens(code: string): Promise<{ success: boolean; expires_in: number }> {
    const response = await fetch(`${FREESOUND_CONFIG.OAUTH_PROXY_URL}/token`, {
      method: 'POST',
      credentials: 'include',
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

  async logout(): Promise<void> {
    await fetch(`${FREESOUND_CONFIG.OAUTH_PROXY_URL}/api/logout`, {
      method: 'POST',
      credentials: 'include',
    })
    this.cachedUsername = null
  }

  async checkAuthStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${FREESOUND_CONFIG.OAUTH_PROXY_URL}/api/auth/status`, {
        credentials: 'include',
      })
      const data = await response.json()
      return data.authenticated
    } catch {
      return false
    }
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
    // Rewrite Freesound download URL to go through our proxy
    // sound.download is like: https://freesound.org/apiv2/sounds/123/download/
    const downloadPath = sound.download.replace('https://freesound.org/apiv2', '')
    const proxyUrl = `${FREESOUND_CONFIG.API_BASE}${downloadPath}`

    const response = await fetch(proxyUrl, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`Failed to download sound: ${response.status}`)
    }

    return response.blob()
  }

  async uploadSound(params: FreesoundUploadParams, recordingId?: number): Promise<{ id: number }> {
    logger.debug('Uploading to Freesound:', {
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

    const headers: Record<string, string> = {}
    if (recordingId !== undefined) {
      headers['X-Recording-Id'] = recordingId.toString()
    }

    const response = await fetch(`${FREESOUND_CONFIG.API_BASE}/sounds/upload/`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: formData,
    })

    if (!response.ok) {
      const error = await response.text()
      logger.error('Freesound upload error:', response.status, error)
      throw new Error(`Upload failed: ${response.status} - ${error}`)
    }

    const result = await response.json()
    logger.debug('Freesound upload success:', result)
    return result
  }

  async describeSound(
    uploadFilename: string,
    params: Omit<FreesoundUploadParams, 'audioFile'>
  ): Promise<void> {
    const formData = new FormData()
    formData.append('upload_filename', uploadFilename)
    formData.append('name', params.name)
    formData.append('tags', params.tags.join(' '))
    formData.append('description', params.description)
    formData.append('license', params.license)

    const response = await fetch(`${FREESOUND_CONFIG.API_BASE}/sounds/describe/`, {
      method: 'POST',
      credentials: 'include',
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
