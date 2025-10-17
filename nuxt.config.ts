// https://nuxt.com/docs/guide/going-further/layers
export default defineNuxtConfig({
  compatibilityDate: '2025-01-17',

  // Pre-configure shared modules that all projects will use
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/image',
    '@habityzer/nuxt-kinde-auth',
    '@pinia/nuxt'
  ],

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

  // Default Kinde configuration (projects MUST override with their credentials)
  kindeAuth: {
    authDomain: '', // Project must provide
    clientId: '', // Project must provide
    clientSecret: '', // Project must provide
    redirectURL: '', // Project must provide
    logoutRedirectURL: '', // Project must provide
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
  pinia: {},

  // ESLint configuration
  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  devtools: { enabled: true }
})
