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

// Broad Sound Taxonomy categories
// See: https://freesound.org/help/faq/
export const BST_CATEGORIES = {
  // Music
  'm-sp': 'Music: Solo percussion',
  'm-si': 'Music: Solo instrument',
  'm-m': 'Music: Multiple instruments',
  'm-other': 'Music: Other',
  // Instrument Samples
  'is-p': 'Instrument Samples: Percussion',
  'is-s': 'Instrument Samples: String',
  'is-w': 'Instrument Samples: Wind',
  'is-k': 'Instrument Samples: Piano/Keyboard',
  'is-e': 'Instrument Samples: Synths/Electronic',
  'is-other': 'Instrument Samples: Other',
  // Speech
  'sp-s': 'Speech: Solo speech',
  'sp-c': 'Speech: Conversation/Crowd',
  'sp-p': 'Speech: Processed/Synthetic',
  'sp-other': 'Speech: Other',
  // Sound Effects
  'fx-o': 'Sound Effects: Objects/House appliances',
  'fx-v': 'Sound Effects: Vehicles',
  'fx-m': 'Sound Effects: Mechanisms/Engines/Machines',
  'fx-h': 'Sound Effects: Human sounds and actions',
  'fx-a': 'Sound Effects: Animals',
  'fx-n': 'Sound Effects: Natural elements/Explosions',
  'fx-el': 'Sound Effects: Electronic/Design',
  'fx-ex': 'Sound Effects: Experimental',
  'fx-other': 'Sound Effects: Other',
  // Soundscapes
  'ss-n': 'Soundscapes: Nature',
  'ss-i': 'Soundscapes: Indoors',
  'ss-u': 'Soundscapes: Urban',
  'ss-s': 'Soundscapes: Synthetic/Artificial',
  'ss-other': 'Soundscapes: Other',
} as const

export type BstCategory = keyof typeof BST_CATEGORIES

export type ModerationStatus = 'processing' | 'in_moderation' | 'approved' | 'moderation_failed'

export interface FreesoundPendingSound {
  id: number
  name: string
  processing_state?: string
}

export interface FreesoundPendingUploadsResponse {
  pending_description: { name: string }[]
  pending_processing: FreesoundPendingSound[]
  pending_moderation: FreesoundPendingSound[]
}

export interface FreesoundUploadParams {
  audioFile: File
  name: string
  tags: string[]
  description: string
  license: 'Attribution' | 'Attribution NonCommercial' | 'Creative Commons 0'
  bst_category: BstCategory
}
