interface Env {
  FREESOUND_API_BASE: string
  FREESOUND_CLIENT_ID: string
  FREESOUND_CLIENT_SECRET: string
  ALLOWED_ORIGINS?: string // Comma-separated list of allowed origins
}

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
}

interface ErrorResponse {
  error: string
  error_description?: string
}

// Parse allowed origins from env (comma-separated) or use defaults
function getAllowedOrigins(env: Env): string[] {
  if (env.ALLOWED_ORIGINS) {
    return env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  }
  return [
    'http://localhost:3000',
    'https://tedsecretsource.github.io',
  ]
}

// Parse cookies from request header
function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {}
  return Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [key, ...val] = c.trim().split('=')
      return [key, val.join('=')]
    })
  )
}

// Set HttpOnly auth cookies
function setAuthCookies(headers: Headers, accessToken: string, refreshToken: string, expiresIn: number): void {
  const accessExpiry = new Date(Date.now() + expiresIn * 1000)
  const refreshExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  headers.append(
    'Set-Cookie',
    `fs_access=${accessToken}; HttpOnly; Secure; SameSite=None; Path=/; Expires=${accessExpiry.toUTCString()}`
  )
  headers.append(
    'Set-Cookie',
    `fs_refresh=${refreshToken}; HttpOnly; Secure; SameSite=None; Path=/; Expires=${refreshExpiry.toUTCString()}`
  )
}

// Clear auth cookies
function clearAuthCookies(headers: Headers): void {
  headers.append('Set-Cookie', 'fs_access=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0')
  headers.append('Set-Cookie', 'fs_refresh=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0')
}

// Get CORS headers for a specific origin
function getCorsHeaders(origin: string | null, allowedOrigins: string[]): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Recording-Id',
    'Access-Control-Allow-Credentials': 'true',
  }
  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  return headers
}

// Try to refresh the access token using refresh token
async function tryRefreshToken(
  refreshToken: string | undefined,
  env: Env
): Promise<TokenResponse | null> {
  if (!refreshToken) return null

  try {
    const tokenUrl = `${env.FREESOUND_API_BASE}/oauth2/access_token/`
    const formData = new URLSearchParams({
      client_id: env.FREESOUND_CLIENT_ID,
      client_secret: env.FREESOUND_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    })

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })

    if (!response.ok) return null
    return await response.json() as TokenResponse
  } catch {
    return null
  }
}

// Make authenticated request to Freesound API with auto-refresh
async function makeAuthenticatedRequest(
  freesoundUrl: string,
  options: RequestInit,
  cookies: Record<string, string>,
  env: Env,
  responseHeaders: Headers
): Promise<Response> {
  let accessToken = cookies['fs_access']

  // First attempt
  const response = await fetch(freesoundUrl, {
    ...options,
    headers: {
      ...options.headers as Record<string, string>,
      'Authorization': `Bearer ${accessToken}`,
    },
  })

  // If 401, try to refresh token
  if (response.status === 401) {
    const refreshed = await tryRefreshToken(cookies['fs_refresh'], env)
    if (refreshed) {
      // Set new cookies
      setAuthCookies(responseHeaders, refreshed.access_token, refreshed.refresh_token, refreshed.expires_in)

      // Retry request with new token
      const retryResponse = await fetch(freesoundUrl, {
        ...options,
        headers: {
          ...options.headers as Record<string, string>,
          'Authorization': `Bearer ${refreshed.access_token}`,
        },
      })
      return retryResponse
    }
    // Refresh failed, clear cookies
    clearAuthCookies(responseHeaders)
  }

  return response
}

function jsonResponse(data: unknown, headers: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
}

function errorResponse(message: string, headers: Record<string, string>, status = 400): Response {
  return jsonResponse({ error: message }, headers, status)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin')
    const allowedOrigins = getAllowedOrigins(env)
    const corsHeaders = getCorsHeaders(origin, allowedOrigins)

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    const path = url.pathname
    const cookies = parseCookies(request.headers.get('Cookie'))

    try {
      // POST /token - Exchange code for tokens, set HttpOnly cookies
      if (path === '/token' && request.method === 'POST') {
        const body = await request.json() as { code?: string; redirect_uri?: string }

        if (!body.code || !body.redirect_uri) {
          return errorResponse('Missing code or redirect_uri', corsHeaders)
        }

        const tokenUrl = `${env.FREESOUND_API_BASE}/oauth2/access_token/`
        const formData = new URLSearchParams({
          client_id: env.FREESOUND_CLIENT_ID,
          client_secret: env.FREESOUND_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code: body.code,
          redirect_uri: body.redirect_uri,
        })

        const response = await fetch(tokenUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString(),
        })

        if (!response.ok) {
          const error = await response.json() as ErrorResponse
          return jsonResponse(error, corsHeaders, response.status)
        }

        const tokens = await response.json() as TokenResponse
        const responseHeaders = new Headers(corsHeaders)
        setAuthCookies(responseHeaders, tokens.access_token, tokens.refresh_token, tokens.expires_in)
        responseHeaders.set('Content-Type', 'application/json')

        // Return success without exposing tokens
        return new Response(JSON.stringify({
          success: true,
          expires_in: tokens.expires_in,
        }), { headers: responseHeaders })
      }

      // POST /refresh - Legacy endpoint for backward compatibility during migration
      if (path === '/refresh' && request.method === 'POST') {
        const body = await request.json() as { refresh_token?: string }

        if (!body.refresh_token) {
          return errorResponse('Missing refresh_token', corsHeaders)
        }

        const tokens = await tryRefreshToken(body.refresh_token, env)
        if (!tokens) {
          return errorResponse('Token refresh failed', corsHeaders, 401)
        }

        const responseHeaders = new Headers(corsHeaders)
        setAuthCookies(responseHeaders, tokens.access_token, tokens.refresh_token, tokens.expires_in)
        responseHeaders.set('Content-Type', 'application/json')

        return new Response(JSON.stringify({
          success: true,
          expires_in: tokens.expires_in,
        }), { headers: responseHeaders })
      }

      // POST /api/logout - Clear cookies
      if (path === '/api/logout' && request.method === 'POST') {
        const responseHeaders = new Headers(corsHeaders)
        clearAuthCookies(responseHeaders)
        responseHeaders.set('Content-Type', 'application/json')
        return new Response(JSON.stringify({ success: true }), { headers: responseHeaders })
      }

      // GET /api/auth/status - Check if authenticated
      if (path === '/api/auth/status' && request.method === 'GET') {
        const isAuthenticated = Boolean(cookies['fs_access'])
        return jsonResponse({ authenticated: isAuthenticated }, corsHeaders)
      }

      // API Proxy: /api/* -> Freesound /apiv2/*
      if (path.startsWith('/api/')) {
        const accessToken = cookies['fs_access']

        if (!accessToken) {
          return errorResponse('Not authenticated', corsHeaders, 401)
        }

        const freesoundPath = path.replace('/api', '/apiv2')
        const freesoundUrl = `https://freesound.org${freesoundPath}${url.search}`

        const responseHeaders = new Headers(corsHeaders)

        // Handle different request types
        let fetchOptions: RequestInit = {
          method: request.method,
        }

        if (!['GET', 'HEAD'].includes(request.method)) {
          // For POST/PUT/DELETE, forward the body
          const contentType = request.headers.get('Content-Type')

          if (contentType?.includes('multipart/form-data')) {
            // For file uploads, pass through the body stream
            fetchOptions.body = request.body
            // Don't set Content-Type - let fetch set it with boundary
          } else if (contentType) {
            fetchOptions.body = await request.text()
            fetchOptions.headers = { 'Content-Type': contentType }
          }
        }

        const response = await makeAuthenticatedRequest(
          freesoundUrl,
          fetchOptions,
          cookies,
          env,
          responseHeaders
        )

        // If still 401 after refresh attempt, return auth error
        if (response.status === 401) {
          return errorResponse('Session expired', responseHeaders, 401)
        }

        const responseContentType = response.headers.get('Content-Type')
        responseHeaders.set('Content-Type', responseContentType || 'application/json')

        return new Response(response.body, {
          status: response.status,
          headers: responseHeaders,
        })
      }

      return errorResponse('Not found', corsHeaders, 404)
    } catch (error) {
      console.error('Worker error:', error)
      return errorResponse('Internal server error', corsHeaders, 500)
    }
  },
}
