import { E2E_TOKEN_COOKIE_NAME, KINDE_ID_TOKEN_COOKIE_NAME, KINDE_ACCESS_TOKEN_COOKIE_NAME } from '../constants/auth'

/**
 * Global auth middleware - checks authentication on route navigation
 * Redirects to login if accessing protected routes without authentication
 *
 * Note: This middleware works alongside the nuxt-kinde-auth module.
 * It handles E2E testing tokens and uses the module's login endpoints.
 * 
 * Projects should configure publicRoutes in their nuxt.config.ts:
 * kindeAuth: {
 *   middleware: {
 *     publicRoutes: ['/', '/blog', '/help']
 *   }
 * }
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // Get public routes from runtime config (configured per-project)
  const config = useRuntimeConfig()
  const kindeConfig = config.public.kindeAuth || {}
  const publicRoutes: string[] = kindeConfig.middleware?.publicRoutes || ['/']

  // Check if the route is public or a child of public routes
  const isPublicRoute = publicRoutes.some(route =>
    to.path === route || to.path.startsWith(`${route}/`)
  )

  // If it's a public route, allow access
  if (isPublicRoute) {
    return
  }

  // For protected routes, check authentication
  if (import.meta.server) {
    // Server-side: Check for auth cookies using Nuxt's useCookie
    // Note: Cookie names include the project-specific prefix
    const config = useRuntimeConfig()
    // @ts-expect-error - cookie property exists in runtime config but not in Kinde module types
    const cookiePrefix = config.public.kindeAuth?.cookie?.prefix || 'app_'
    
    const idTokenName = `${cookiePrefix}${KINDE_ID_TOKEN_COOKIE_NAME}`
    const accessTokenName = `${cookiePrefix}${KINDE_ACCESS_TOKEN_COOKIE_NAME}`
    
    const idToken = useCookie(idTokenName)
    const accessToken = useCookie(accessTokenName)
    const e2eToken = useCookie(E2E_TOKEN_COOKIE_NAME) // E2E test token

    // Allow access if any valid auth token exists
    if (!idToken.value && !accessToken.value && !e2eToken.value) {
      // Redirect to module's login endpoint
      return navigateTo('/api/kinde/login', { external: true })
    }
  } else {
    // Client-side: Check for E2E token first (for tests)
    const e2eToken = useCookie(E2E_TOKEN_COOKIE_NAME)

    // If E2E token exists, allow access (for automated tests)
    if (e2eToken.value) {
      return
    }

    // Check for auth cookies directly (more reliable than reactive state)
    const config = useRuntimeConfig()
    // @ts-expect-error - cookie property exists in runtime config but not in Kinde module types
    const cookiePrefix = config.public.kindeAuth?.cookie?.prefix || 'app_'
    
    const idTokenName = `${cookiePrefix}${KINDE_ID_TOKEN_COOKIE_NAME}`
    const accessTokenName = `${cookiePrefix}${KINDE_ACCESS_TOKEN_COOKIE_NAME}`
    
    const idToken = useCookie(idTokenName)
    const accessToken = useCookie(accessTokenName)

    // Allow access if any valid auth token cookie exists
    if (!idToken.value && !accessToken.value) {
      // Redirect to module's login endpoint
      if (import.meta.client) {
        window.location.href = '/api/kinde/login'
      }
      return
    }
  }
})

