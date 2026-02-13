export default defineNuxtPlugin(() => {
  const router = useRouter()
  const config = useRuntimeConfig()
  const kindeConfig = config.public.kindeAuth || {}
  const middlewareConfig = kindeConfig.middleware || {}
  const cookieConfig = kindeConfig.cookie || {}
  // @ts-expect-error - cookie property exists in runtime config but not in module types
  const cookiePrefix = requireString(cookieConfig.prefix, 'kindeAuth.cookie.prefix')
  const idTokenBaseName = requireString(cookieConfig.idTokenName, 'kindeAuth.cookie.idTokenName')
  const accessTokenBaseName = requireString(cookieConfig.accessTokenName, 'kindeAuth.cookie.accessTokenName')
  const e2eTokenCookieName = requireString(middlewareConfig.e2eTokenCookieName, 'kindeAuth.middleware.e2eTokenCookieName')
  const appTokenPrefix = requireString(middlewareConfig.appTokenPrefix, 'kindeAuth.middleware.appTokenPrefix')
  const clockSkewSeconds = requireNonNegativeNumber(middlewareConfig.clockSkewSeconds, 'kindeAuth.middleware.clockSkewSeconds')
  const idToken = useCookie<string | null>(`${cookiePrefix}${idTokenBaseName}`)
  const accessToken = useCookie<string | null>(`${cookiePrefix}${accessTokenBaseName}`)
  const e2eToken = useCookie<string | null>(`${cookiePrefix}${e2eTokenCookieName}`)
  const publicRoutes: string[] = middlewareConfig.publicRoutes || ['/']
  const loginPath = requireString(middlewareConfig.loginPath, 'kindeAuth.middleware.loginPath')

  router.beforeEach((to) => {
    if (to.path.startsWith('/api') || to.path.startsWith('/_nuxt')) {
      return true
    }

    const isPublicRoute = publicRoutes.some(route => to.path === route || to.path.startsWith(`${route}/`))
    logClient('route-check', { path: to.path, isPublicRoute })
    if (isPublicRoute) {
      return true
    }

    const hasIdToken = !!idToken.value
    const hasAccessToken = !!accessToken.value
    const e2eTokenValue = e2eToken.value

    logClient('cookie-state', {
      path: to.path,
      cookiePrefix,
      hasIdToken,
      hasAccessToken,
      hasScopedE2eToken: !!e2eTokenValue
    })

    if (e2eTokenValue && e2eTokenValue.startsWith(appTokenPrefix)) {
      logClient('allow-e2e-app-token', { path: to.path })
      return true
    }

    if (!hasIdToken && !hasAccessToken) {
      logClient('redirect-missing-auth-cookies', { path: to.path })
      window.location.href = loginPath
      return false
    }

    const idTokenUsable = hasIdToken ? isUsableToken(idToken.value as string, appTokenPrefix, clockSkewSeconds) : false
    const accessTokenUsable = hasAccessToken ? isUsableToken(accessToken.value as string, appTokenPrefix, clockSkewSeconds) : false
    const isUnauthorized = !idTokenUsable && !accessTokenUsable

    logClient('token-evaluation', {
      path: to.path,
      idTokenUsable,
      accessTokenUsable
    })

    if (isUnauthorized) {
      idToken.value = null
      accessToken.value = null
      logClient('redirect-all-auth-tokens-invalid-or-expired', { path: to.path })
      window.location.href = loginPath
      return false
    }

    logClient('allow-protected-route', { path: to.path })
    return true
  })
})

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
    const decoded = atob(padded)
    const parsed = JSON.parse(decoded)
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null
  } catch {
    return null
  }
}

function logClient(event: string, details: Record<string, unknown>) {
  if (!import.meta.dev) {
    return
  }

  console.warn(`[AUTH GUARD CLIENT] ${event}`, details)
}

function requireString(value: unknown, key: string): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value
  }

  throw new Error(`[AUTH GUARD CLIENT] Missing required config: ${key}`)
}

function requireNonNegativeNumber(value: unknown, key: string): number {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value
  }

  throw new Error(`[AUTH GUARD CLIENT] Invalid required numeric config: ${key}`)
}
