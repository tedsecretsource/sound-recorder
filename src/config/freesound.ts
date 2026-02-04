export const FREESOUND_CONFIG = {
  API_BASE: 'https://freesound.org/apiv2',
  OAUTH_PROXY_URL: 'https://freesound-oauth-proxy.sound-recorder.workers.dev',
  CLIENT_ID: 'HgSoiwqTRtFnJue0CdPh',
  get REDIRECT_URI() {
    // Must match the redirect URI registered in Freesound app settings
    return window.location.origin + '/auth/callback'
  },
  TAG: 'sound-recorder-app',
  get AUTHORIZE_URL() {
    const params = new URLSearchParams({
      client_id: this.CLIENT_ID,
      response_type: 'code',
      redirect_uri: this.REDIRECT_URI,
    })
    return `${this.API_BASE}/oauth2/authorize/?${params.toString()}`
  },
}
