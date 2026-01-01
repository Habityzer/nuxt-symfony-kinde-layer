// https://nuxt.com/docs/guide/going-further/layers
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
        // @ts-expect-error - cookie property exists in runtime but not in Kinde module types
        cookie: {
          prefix: 'app_' // Default, projects override this
        },
        middleware: {
          publicRoutes: [] // Default, projects override this
        }
      }
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
    authDomain: process.env.KINDE_AUTH_DOMAIN || 'https://dummy.kinde.com', // Project must provide, dummy for build
    clientId: process.env.KINDE_CLIENT_ID || 'dummy-client-id', // Project must provide, dummy for build
    clientSecret: process.env.KINDE_CLIENT_SECRET || 'dummy-secret', // Project must provide, dummy for build
    redirectURL: process.env.KINDE_REDIRECT_URL || 'http://localhost:3000/api/auth/kinde_callback', // Project must provide, dummy for build
    logoutRedirectURL: process.env.KINDE_LOGOUT_REDIRECT_URL || 'http://localhost:3000', // Project must provide, dummy for build
    postLoginRedirectURL: '/dashboard', // Default, can be overridden
    cookie: {
      prefix: 'app_', // Projects MUST override this
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

  // Pinia configuration
  pinia: {}
})
