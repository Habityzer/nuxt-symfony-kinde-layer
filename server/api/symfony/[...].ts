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

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const kindeConfig = config.public.kindeAuth || {}
  const middlewareConfig = kindeConfig.middleware || {}
  const cookieConfig = kindeConfig.cookie || {}
  const appTokenPrefix = requireString(middlewareConfig.appTokenPrefix, 'kindeAuth.middleware.appTokenPrefix')
  const e2eTokenCookieName = requireString(middlewareConfig.e2eTokenCookieName, 'kindeAuth.middleware.e2eTokenCookieName')
  const idTokenBaseName = requireString(cookieConfig.idTokenName, 'kindeAuth.cookie.idTokenName')

  // Get the path (remove /api/symfony prefix)
  let path
    = event.context.params?.path || event.path.replace('/api/symfony', '')

  // Ensure path starts with / (for catch-all routes it might not)
  if (!path.startsWith('/')) {
    path = `/${path}`
  }

  // Check if this is a public API route (no auth required)
  const publicApiRoutes
    = config.public.kindeAuth?.middleware?.publicApiRoutes || []
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
    // Prefer scoped cookie name to avoid collisions between projects on localhost.
    const cookiePrefix = requireString(cookieConfig.prefix, 'kindeAuth.cookie.prefix')
    const scopedE2eCookieName = `${cookiePrefix}${e2eTokenCookieName}`
    const e2eToken = getCookie(event, scopedE2eCookieName)
    if (e2eToken && e2eToken.startsWith(appTokenPrefix)) {
      token = e2eToken
    } else {
      // Use Kinde authentication from the module
      const kinde = event.context.kinde

      if (!kinde?.client || !kinde?.sessionManager) {
        throw createError({
          statusCode: 500,
          statusMessage:
            'Kinde authentication not initialized. Module may not be loaded correctly.'
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
          const idToken = (await sessionManager.getSessionItem(
            idTokenBaseName
          )) as string | undefined

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
          statusMessage:
            error instanceof Error ? error.message : 'Authentication failed'
        })
      }
    }
  }

  if (!token && !isPublicRoute) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No authentication token available'
    })
  }

  try {
    // Get request method
    const method = event.method

    // Get Content-Type to determine how to handle body
    const contentType = getHeader(event, 'content-type') || ''

    let body: string | undefined

    // Handle multipart/form-data specially (preserve binary data and MIME types)
    if (contentType.includes('multipart/form-data')) {
      // For multipart/form-data, read the raw body without parsing
      // This preserves the boundary and binary data including MIME types
      body = await readRawBody(event, false)
    } else if (method !== 'GET' && method !== 'HEAD') {
      // For other content types (JSON, etc.), read and parse the body
      body = await readBody(event)
    }

    // Get query parameters from original request
    const query = getQuery(event)

    // Prepare headers for Symfony
    // IMPORTANT: Forward Content-Type and Accept headers for proper API negotiation
    const headers: Record<string, string> = {}

    // Only add Authorization header if we have a token (not public route)
    if (token && token !== '') {
      headers.Authorization = `Bearer kinde_${token}`
    }

    // Forward Content-Type header (CRITICAL for multipart/form-data with boundary)
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
        Authorization: token && token !== '' ? `Bearer kinde_${token.substring(0, 10)}...` : 'none'
      },
      query,
      hasBody: !!body,
      isMultipart: contentType.includes('multipart/form-data')
    })

    // Forward request to Symfony with Kinde token
    const response = await $fetch(path, {
      baseURL: config.apiBaseUrl as string,
      method,
      headers,
      body,
      query,
      retry: false, // Disable automatic retries
      timeout: 30000 // 30 second timeout
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
      statusCode:
        error && typeof error === 'object' && 'statusCode' in error
          ? error.statusCode
          : 'unknown',
      message: error instanceof Error ? error.message : 'unknown'
    })
    // Handle Symfony API errors
    const statusCode
      = error && typeof error === 'object' && 'statusCode' in error
        ? (error.statusCode as number)
        : 500
    const statusMessage
      = error && typeof error === 'object' && 'statusMessage' in error
        ? (error.statusMessage as string)
        : error instanceof Error
          ? error.message
          : 'Symfony API error'
    const data
      = error && typeof error === 'object' && 'data' in error
        ? error.data
        : undefined

    throw createError({
      statusCode,
      statusMessage,
      data
    })
  }
})

function requireString(value: unknown, key: string): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value
  }

  throw new Error(`[SYMFONY PROXY] Missing required config: ${key}`)
}
