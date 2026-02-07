// Sync timing configuration
export const SYNC = {
  DEBOUNCE_MS: 5000,          // Wait 5 seconds after last change before syncing
  MIN_INTERVAL_MS: 60000,     // Minimum 60 seconds between syncs
  RATE_LIMIT_BACKOFF_MS: 60000, // Back off for 60 seconds when rate limited
}

// API retry configuration
export const API = {
  MAX_RETRIES: 3,
  INITIAL_BACKOFF_SECONDS: 5,
}

// UI animation timing
export const ANIMATION = {
  DELETE_DURATION_MS: 900,
}

// Initial sync delay
export const INITIAL_SYNC_DELAY_MS = 1000
