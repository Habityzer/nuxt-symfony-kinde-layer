/**
 * Type augmentation for @habityzer/nuxt-kinde-auth module
 * Adds custom configuration options we use in the layer
 */
declare module '@habityzer/nuxt-kinde-auth' {
  interface ModuleOptions {
    cookie?: {
      prefix?: string
      idTokenName?: string
      accessTokenName?: string
      refreshTokenName?: string
    }
    middleware?: {
      enabled?: boolean
      global?: boolean
      publicRoutes?: string[]
      publicApiRoutes?: string[]
      e2eTokenCookieName?: string
      appTokenPrefix?: string
      clockSkewSeconds?: number
      loginPath?: string
    }
    debug?: {
      enabled?: boolean
    }
  }
}

/** Runtime config shape for kindeAuth (used for type-safe access in layer code) */
export interface KindeAuthRuntimeConfig {
  cookie?: {
    prefix?: string
    idTokenName?: string
    accessTokenName?: string
    refreshTokenName?: string
  }
  middleware?: {
    enabled?: boolean
    global?: boolean
    publicRoutes?: string[]
    publicApiRoutes?: string[]
    e2eTokenCookieName?: string
    appTokenPrefix?: string
    clockSkewSeconds?: number
    loginPath?: string
  }
  debug?: {
    enabled?: boolean
  }
}
