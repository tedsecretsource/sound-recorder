// All sensitive values loaded from environment variables
// See .env.example for required variables

const CLIENT_ID = process.env.REACT_APP_FREESOUND_CLIENT_ID
const OAUTH_PROXY_URL = process.env.REACT_APP_FREESOUND_OAUTH_PROXY_URL

if (!CLIENT_ID) {
  console.error('REACT_APP_FREESOUND_CLIENT_ID is not set in environment')
}

if (!OAUTH_PROXY_URL) {
  console.error('REACT_APP_FREESOUND_OAUTH_PROXY_URL is not set in environment')
}

export const FREESOUND_CONFIG = {
  API_BASE: 'https://freesound.org/apiv2',
  OAUTH_PROXY_URL: OAUTH_PROXY_URL || '',
  CLIENT_ID: CLIENT_ID || '',
  get REDIRECT_URI() {
    // Must match the redirect URI registered in Freesound app settings
    return window.location.origin + process.env.PUBLIC_URL + '/auth/callback'
  },
  TAG: 'sound-recorder-sync',
  get AUTHORIZE_URL() {
    const params = new URLSearchParams({
      client_id: this.CLIENT_ID,
      response_type: 'code',
      redirect_uri: this.REDIRECT_URI,
    })
    return `${this.API_BASE}/oauth2/logout_and_authorize/?${params.toString()}`
  },
}
