export interface FreesoundUser {
  username: string
  about: string
  home_page: string
  avatar: {
    small: string
    medium: string
    large: string
  }
  date_joined: string
  num_sounds: number
  sounds: string // API URL
  num_packs: number
  packs: string // API URL
  num_posts: number
  num_comments: number
  bookmark_categories: string // API URL
}

export interface FreesoundSound {
  id: number
  name: string
  tags: string[]
  description: string
  created: string
  license: string
  type: string
  channels: number
  filesize: number
  bitrate: number
  bitdepth: number
  duration: number
  samplerate: number
  username: string
  download: string
  previews: {
    'preview-hq-mp3': string
    'preview-hq-ogg': string
    'preview-lq-mp3': string
    'preview-lq-ogg': string
  }
}

export interface FreesoundSoundsResponse {
  count: number
  next: string | null
  previous: string | null
  results: FreesoundSound[]
}

export interface FreesoundTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
}

export interface FreesoundAuthState {
  isAuthenticated: boolean
  user: FreesoundUser | null
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null
}

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error' | 'conflict'

export interface FreesoundUploadParams {
  audioFile: File
  name: string
  tags: string[]
  description: string
  license: 'Attribution' | 'Attribution Noncommercial' | 'Creative Commons 0'
}
