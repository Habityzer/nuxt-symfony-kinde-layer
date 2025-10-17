/**
 * Type augmentation for @habityzer/nuxt-kinde-auth module
 * Adds custom configuration options we use in the layer
 */
declare module '@habityzer/nuxt-kinde-auth' {
  interface ModuleOptions {
    cookie?: {
      prefix?: string
    }
    middleware?: {
      enabled?: boolean
      global?: boolean
      publicRoutes?: string[]
    }
    debug?: {
      enabled?: boolean
    }
  }
}

export {}

