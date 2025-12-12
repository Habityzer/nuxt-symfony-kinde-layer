/**
 * Symfony API Proxy - Forwards requests to Symfony backend with authentication
 *
 * Usage: /api/symfony/* -> proxies to Symfony backend
 *
 * Features:
 * - Forwards Kinde authentication tokens
 * - Supports E2E testing with app tokens
 * - Properly forwards Accept and Content-Type headers for API negotiation
 * - Handles query parameters
 *
 * @see .cursorrules for proxy best practices
 */

// Auth constants (defined inline to avoid import issues during Nitro bundling)
const E2E_TOKEN_COOKIE_NAME = 'kinde_token'
const APP_TOKEN_PREFIX = 'app_'
const KINDE_ID_TOKEN_COOKIE_NAME = 'id_token'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Get the path (remove /api/symfony prefix)
  let path = event.context.params?.path || event.path.replace('/api/symfony', '')

  // Ensure path starts with / (for catch-all routes it might not)
  if (!path.startsWith('/')) {
    path = `/${path}`
  }

  // Check if this is a public API route (no auth required)
  const publicApiRoutes = config.public.kindeAuth?.middleware?.publicApiRoutes || []
  const isPublicRoute = publicApiRoutes.some((route: string) => {
    if (route.endsWith('/**')) {
      const prefix = route.slice(0, -3)
      return path.startsWith(prefix)
    }
    return path === route
  })

  let token: string | undefined

  // Skip authentication for public routes
  if (isPublicRoute) {
    console.log('🔓 [SYMFONY PROXY] Public route, skipping auth:', path)
    // Set token to empty to skip auth headers
    token = ''
  } else {
    // Check for E2E test token first (from cookie)
    // Only use E2E token if it's a valid app token (starts with APP_TOKEN_PREFIX)
    const e2eToken = getCookie(event, E2E_TOKEN_COOKIE_NAME)
    if (e2eToken && e2eToken.startsWith(APP_TOKEN_PREFIX)) {
      token = e2eToken
    } else {
    // Use Kinde authentication from the module
    const kinde = event.context.kinde

    if (!kinde?.client || !kinde?.sessionManager) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Kinde authentication not initialized. Module may not be loaded correctly.'
      })
    }

    const { client, sessionManager } = kinde

    try {
      // Try to get access token first
      let accessToken: string | null = null
      try {
        accessToken = await client.getToken(sessionManager)
      } catch {
        // Silent - will try id_token fallback
      }

      // If access token is not available, try id_token as fallback
      if (!accessToken || accessToken.trim() === '') {
        const idToken = await sessionManager.getSessionItem(KINDE_ID_TOKEN_COOKIE_NAME) as string | undefined

        if (idToken) {
          token = idToken
        }
      } else {
        token = accessToken
      }

      if (!token || token.trim() === '') {
        throw createError({
          statusCode: 401,
          statusMessage: 'Unauthorized - Please log in'
        })
      }
    } catch (error) {
      console.error('❌ [SYMFONY PROXY] Auth error:', error)
      throw createError({
        statusCode: 401,
        statusMessage: error instanceof Error ? error.message : 'Authentication failed'
      })
    }
  }

  if (!token && !isPublicRoute) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No authentication token available'
    })
  }

  try {
    // Get request method and body
    const method = event.method
    const body = method !== 'GET' && method !== 'HEAD' ? await readBody(event) : undefined

    // Get query parameters from original request
    const query = getQuery(event)

    // Prepare headers for Symfony
    // IMPORTANT: Forward Content-Type and Accept headers for proper API negotiation
    const headers: Record<string, string> = {}
    
    // Only add Authorization header if we have a token (not public route)
    if (token && token !== '') {
      headers.Authorization = `Bearer kinde_${token}`
    }

    // Forward Content-Type header
    const contentType = getHeader(event, 'content-type')
    if (contentType) {
      headers['Content-Type'] = contentType
    }

    // Forward Accept header (CRITICAL for content negotiation)
    // Without this, backend returns default format instead of requested format (e.g., JSON vs Hydra)
    const accept = getHeader(event, 'accept')
    if (accept) {
      headers['Accept'] = accept
    }

    // Log the request to backend
    const backendUrl = `${config.apiBaseUrl}${path}`
    console.log('🔵 [SYMFONY PROXY] Request to backend:', {
      url: backendUrl,
      method,
      headers: {
        ...headers,
        Authorization: `Bearer kinde_${token.substring(0, 10)}...` // Only log first 10 chars of token
      },
      query,
      hasBody: !!body
    })

    // Forward request to Symfony with Kinde token
    const response = await $fetch(path, {
      baseURL: config.apiBaseUrl as string,
      method,
      headers,
      body,
      query
    })

    console.log('✅ [SYMFONY PROXY] Backend response received:', {
      url: backendUrl,
      method,
      status: 'success'
    })

    return response
  } catch (error) {
    console.error('❌ [SYMFONY PROXY] Symfony API error:', {
      path,
      statusCode: error && typeof error === 'object' && 'statusCode' in error ? error.statusCode : 'unknown',
      message: error instanceof Error ? error.message : 'unknown'
    })
    // Handle Symfony API errors
    const statusCode = error && typeof error === 'object' && 'statusCode' in error ? (error.statusCode as number) : 500
    const statusMessage = error && typeof error === 'object' && 'statusMessage' in error
      ? (error.statusMessage as string)
      : error instanceof Error
        ? error.message
        : 'Symfony API error'
    const data = error && typeof error === 'object' && 'data' in error ? error.data : undefined

    throw createError({
      statusCode,
      statusMessage,
      data
    })
  }
})
