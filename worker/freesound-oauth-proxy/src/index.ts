interface Env {
  FREESOUND_API_BASE: string
  FREESOUND_CLIENT_ID: string
  FREESOUND_CLIENT_SECRET: string
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

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  })
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status)
}

async function handleTokenExchange(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { code?: string; redirect_uri?: string }

  if (!body.code) {
    return errorResponse('Missing authorization code')
  }

  if (!body.redirect_uri) {
    return errorResponse('Missing redirect_uri')
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
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  })

  const data = await response.json() as TokenResponse | ErrorResponse

  if (!response.ok) {
    return jsonResponse(data, response.status)
  }

  return jsonResponse(data)
}

async function handleTokenRefresh(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { refresh_token?: string }

  if (!body.refresh_token) {
    return errorResponse('Missing refresh_token')
  }

  const tokenUrl = `${env.FREESOUND_API_BASE}/oauth2/access_token/`

  const formData = new URLSearchParams({
    client_id: env.FREESOUND_CLIENT_ID,
    client_secret: env.FREESOUND_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: body.refresh_token,
  })

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  })

  const data = await response.json() as TokenResponse | ErrorResponse

  if (!response.ok) {
    return jsonResponse(data, response.status)
  }

  return jsonResponse(data)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS })
    }

    const url = new URL(request.url)
    const path = url.pathname

    if (request.method !== 'POST') {
      return errorResponse('Method not allowed', 405)
    }

    try {
      switch (path) {
        case '/token':
          return await handleTokenExchange(request, env)
        case '/refresh':
          return await handleTokenRefresh(request, env)
        default:
          return errorResponse('Not found', 404)
      }
    } catch (error) {
      console.error('Worker error:', error)
      return errorResponse('Internal server error', 500)
    }
  },
}
