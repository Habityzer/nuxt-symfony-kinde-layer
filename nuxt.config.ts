// https://nuxt.com/docs/guide/going-further/layers
const AUTH_COOKIE_PREFIX = process.env.NUXT_PUBLIC_AUTH_COOKIE_PREFIX
const AUTH_LOGIN_PATH = process.env.NUXT_PUBLIC_AUTH_LOGIN_PATH
const AUTH_CLOCK_SKEW_SECONDS = process.env.NUXT_PUBLIC_AUTH_CLOCK_SKEW_SECONDS
  ? Number(process.env.NUXT_PUBLIC_AUTH_CLOCK_SKEW_SECONDS)
  : undefined
const AUTH_APP_TOKEN_PREFIX = process.env.NUXT_PUBLIC_AUTH_APP_TOKEN_PREFIX
const AUTH_E2E_TOKEN_COOKIE_NAME = process.env.NUXT_PUBLIC_AUTH_E2E_TOKEN_COOKIE_NAME
const AUTH_ID_TOKEN_NAME = process.env.NUXT_PUBLIC_AUTH_ID_TOKEN_NAME
const AUTH_ACCESS_TOKEN_NAME = process.env.NUXT_PUBLIC_AUTH_ACCESS_TOKEN_NAME
const AUTH_REFRESH_TOKEN_NAME = process.env.NUXT_PUBLIC_AUTH_REFRESH_TOKEN_NAME

export default defineNuxtConfig({

  // Pre-configure shared modules that all projects will use
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/image',
    '@habityzer/nuxt-kinde-auth',
    '@pinia/nuxt'
  ],

  devtools: { enabled: true },

  // Default runtime config (projects can override)
  runtimeConfig: {
    // Server-only (private) runtime config
    apiBaseUrl: '',

    public: {
      // Public runtime config (exposed to client-side)
      apiBaseUrl: '',
      apiPrefix: '/api/symfony', // API endpoint prefix for useOpenApi

      // Expose kindeAuth config for middleware (will be merged with project config)
      kindeAuth: {
        cookie: {
          prefix: AUTH_COOKIE_PREFIX,
          idTokenName: AUTH_ID_TOKEN_NAME,
          accessTokenName: AUTH_ACCESS_TOKEN_NAME,
          refreshTokenName: AUTH_REFRESH_TOKEN_NAME
        },
        middleware: {
          publicRoutes: [], // Default, projects override this
          loginPath: AUTH_LOGIN_PATH,
          clockSkewSeconds: AUTH_CLOCK_SKEW_SECONDS,
          appTokenPrefix: AUTH_APP_TOKEN_PREFIX,
          e2eTokenCookieName: AUTH_E2E_TOKEN_COOKIE_NAME
        }
      } as Record<string, unknown>
    }
  },
  compatibilityDate: '2025-01-17',

  // ESLint configuration
  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  // Default Kinde configuration (projects MUST override with their credentials)
  kindeAuth: {
    authDomain: process.env.KINDE_AUTH_DOMAIN,
    clientId: process.env.KINDE_CLIENT_ID,
    clientSecret: process.env.KINDE_CLIENT_SECRET,
    redirectURL: process.env.KINDE_REDIRECT_URL,
    logoutRedirectURL: process.env.KINDE_LOGOUT_REDIRECT_URL,
    postLoginRedirectURL: '/dashboard', // Default, can be overridden
    cookie: {
      prefix: AUTH_COOKIE_PREFIX,
      httpOnly: false, // Allow client-side deletion for logout
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    },
    middleware: {
      enabled: false, // Disabled - using custom middleware from layer
      global: false,
      publicRoutes: [] // Projects can override
    },
    debug: {
      enabled: process.env.NODE_ENV !== 'production'
    }
  },
  hooks: {
    ready(nuxt) {
      const publicConfig = nuxt.options.runtimeConfig.public as Record<string, unknown>
      const runtimeKindeAuth = (publicConfig.kindeAuth || {}) as Record<string, unknown>
      const runtimeCookie = (runtimeKindeAuth.cookie || {}) as Record<string, unknown>
      const runtimeMiddleware = (runtimeKindeAuth.middleware || {}) as Record<string, unknown>
      const kindeModuleConfig = (nuxt.options.kindeAuth || {}) as Record<string, unknown>
      const kindeModuleCookie = (kindeModuleConfig.cookie || {}) as Record<string, unknown>
      const kindeModuleMiddleware = (kindeModuleConfig.middleware || {}) as Record<string, unknown>

      // Keep layer reusable: if app defines values only in kindeAuth module config,
      // mirror them into runtime config used by guards/composables.
      if (!isNonEmptyString(runtimeCookie.prefix) && isNonEmptyString(kindeModuleCookie.prefix)) {
        runtimeCookie.prefix = kindeModuleCookie.prefix
      }
      if (!Array.isArray(runtimeMiddleware.publicRoutes) && Array.isArray(kindeModuleMiddleware.publicRoutes)) {
        runtimeMiddleware.publicRoutes = kindeModuleMiddleware.publicRoutes
      }

      runtimeKindeAuth.cookie = runtimeCookie
      runtimeKindeAuth.middleware = runtimeMiddleware
      publicConfig.kindeAuth = runtimeKindeAuth

      assertRequiredString(runtimeCookie.prefix, 'runtimeConfig.public.kindeAuth.cookie.prefix')
      assertRequiredString(runtimeCookie.idTokenName, 'runtimeConfig.public.kindeAuth.cookie.idTokenName')
      assertRequiredString(runtimeCookie.accessTokenName, 'runtimeConfig.public.kindeAuth.cookie.accessTokenName')
      assertRequiredString(runtimeCookie.refreshTokenName, 'runtimeConfig.public.kindeAuth.cookie.refreshTokenName')
      assertRequiredString(runtimeMiddleware.loginPath, 'runtimeConfig.public.kindeAuth.middleware.loginPath')
      assertRequiredString(runtimeMiddleware.appTokenPrefix, 'runtimeConfig.public.kindeAuth.middleware.appTokenPrefix')
      assertRequiredString(runtimeMiddleware.e2eTokenCookieName, 'runtimeConfig.public.kindeAuth.middleware.e2eTokenCookieName')
      assertRequiredNumber(runtimeMiddleware.clockSkewSeconds, 'runtimeConfig.public.kindeAuth.middleware.clockSkewSeconds')
      assertRequiredString(kindeModuleCookie.prefix, 'kindeAuth.cookie.prefix')
      assertRequiredString(kindeModuleConfig.authDomain, 'kindeAuth.authDomain')
      assertRequiredString(kindeModuleConfig.clientId, 'kindeAuth.clientId')
      assertRequiredString(kindeModuleConfig.clientSecret, 'kindeAuth.clientSecret')
      assertRequiredString(kindeModuleConfig.redirectURL, 'kindeAuth.redirectURL')
      assertRequiredString(kindeModuleConfig.logoutRedirectURL, 'kindeAuth.logoutRedirectURL')
    }
  },

  // Pinia configuration
  pinia: {}
})

function assertRequiredString(value: unknown, key: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`[nuxt-symfony-kinde-layer] Missing required config: ${key}`)
  }
}

function assertRequiredNumber(value: unknown, key: string) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`[nuxt-symfony-kinde-layer] Missing or invalid required numeric config: ${key}`)
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
