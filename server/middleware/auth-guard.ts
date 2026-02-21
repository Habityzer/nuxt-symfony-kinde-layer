export default defineEventHandler((event) => {
  if (!isHtmlNavigationRequest(event)) {
    return
  }

  const path = getRequestURL(event).pathname
  if (!path || path.startsWith('/api') || path.startsWith('/_nuxt') || path.startsWith('/__nuxt') || path.startsWith('/_ipx')) {
    return
  }

  const config = useRuntimeConfig(event)
  const kindeConfig = config.public.kindeAuth || {}
  const middlewareConfig = kindeConfig.middleware || {}
  const cookieConfig = kindeConfig.cookie || {}
  const mode = middlewareConfig.mode || 'privateByDefault'
  const publicRoutes: string[] = middlewareConfig.publicRoutes || ['/']
  const protectedRoutes: string[] = middlewareConfig.protectedRoutes || []
  const loginPath = requireString(middlewareConfig.loginPath, 'kindeAuth.middleware.loginPath')
  const appTokenPrefix = requireString(middlewareConfig.appTokenPrefix, 'kindeAuth.middleware.appTokenPrefix')
  const e2eTokenCookieName = requireString(middlewareConfig.e2eTokenCookieName, 'kindeAuth.middleware.e2eTokenCookieName')
  const clockSkewSeconds = requireNonNegativeNumber(middlewareConfig.clockSkewSeconds, 'kindeAuth.middleware.clockSkewSeconds')
  const idTokenBaseName = requireString(cookieConfig.idTokenName, 'kindeAuth.cookie.idTokenName')
  const accessTokenBaseName = requireString(cookieConfig.accessTokenName, 'kindeAuth.cookie.accessTokenName')
  const requiresAuth = mode === 'publicByDefault'
    ? protectedRoutes.some(route => path === route || path.startsWith(`${route}/`))
    : !publicRoutes.some(route => path === route || path.startsWith(`${route}/`))

  logServer('route-check', { path, mode, requiresAuth })
  if (!requiresAuth) {
    return
  }

  const cookiePrefix = requireString(cookieConfig.prefix, 'kindeAuth.cookie.prefix')
  const idTokenName = `${cookiePrefix}${idTokenBaseName}`
  const accessTokenName = `${cookiePrefix}${accessTokenBaseName}`
  const e2eTokenName = `${cookiePrefix}${e2eTokenCookieName}`

  const idToken = getCookie(event, idTokenName)
  const accessToken = getCookie(event, accessTokenName)
  const e2eToken = getCookie(event, e2eTokenName)

  const hasIdToken = !!idToken
  const hasAccessToken = !!accessToken
  logServer('cookie-state', {
    path,
    cookiePrefix,
    hasIdToken,
    hasAccessToken,
    hasScopedE2eToken: !!e2eToken
  })

  if (e2eToken && e2eToken.startsWith(appTokenPrefix)) {
    logServer('allow-e2e-app-token', { path })
    return
  }

  if (!hasIdToken && !hasAccessToken) {
    logServer('redirect-missing-auth-cookies', { path })
    return sendRedirect(event, loginPath, 302)
  }

  const idTokenUsable = hasIdToken ? isUsableToken(idToken as string, appTokenPrefix, clockSkewSeconds) : false
  const accessTokenUsable = hasAccessToken ? isUsableToken(accessToken as string, appTokenPrefix, clockSkewSeconds) : false
  const isUnauthorized = !idTokenUsable && !accessTokenUsable

  logServer('token-evaluation', {
    path,
    idTokenUsable,
    accessTokenUsable
  })

  if (isUnauthorized) {
    setCookie(event, idTokenName, '', { path: '/', maxAge: 0 })
    setCookie(event, accessTokenName, '', { path: '/', maxAge: 0 })
    logServer('redirect-all-auth-tokens-invalid-or-expired', { path })
    return sendRedirect(event, loginPath, 302)
  }

  logServer('allow-protected-route', { path })
})

function isHtmlNavigationRequest(event: Parameters<typeof defineEventHandler>[0]): boolean {
  if (event.method !== 'GET' && event.method !== 'HEAD') {
    return false
  }

  const accept = getHeader(event, 'accept') || ''
  return accept.includes('text/html') || accept.includes('*/*')
}

function isUsableToken(token: string, appTokenPrefix: string, clockSkewSeconds: number): boolean {
  if (token.startsWith(appTokenPrefix)) {
    return true
  }

  const payload = decodeJwtPayload(token)
  if (!payload || typeof payload.exp !== 'number') {
    return false
  }

  const nowSeconds = Math.floor(Date.now() / 1000)
  return payload.exp > nowSeconds + clockSkewSeconds
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length !== 3) {
    return null
  }

  const payloadPart = parts[1]
  if (!payloadPart) {
    return null
  }

  try {
    const padded = payloadPart.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payloadPart.length / 4) * 4, '=')
    const decoded = Buffer.from(padded, 'base64').toString('utf8')
    const parsed = JSON.parse(decoded)
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null
  } catch {
    return null
  }
}

function logServer(event: string, details: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'production') {
    return
  }

  console.warn(`[AUTH GUARD SERVER] ${event}`, details)
}

function requireString(value: unknown, key: string): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value
  }

  throw new Error(`[AUTH GUARD SERVER] Missing required config: ${key}`)
}

function requireNonNegativeNumber(value: unknown, key: string): number {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value
  }

  throw new Error(`[AUTH GUARD SERVER] Invalid required numeric config: ${key}`)
}
