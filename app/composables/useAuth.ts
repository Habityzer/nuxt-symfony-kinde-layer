import { computed, ref, readonly } from 'vue'
import { E2E_TOKEN_COOKIE_NAME } from '../constants/auth'

interface SymfonyUser {
  id: number
  email: string
  name: string
  picture?: string | null
  subscription_tier?: 'free' | 'pro' | 'teams' | 'enterprise'
  tier?: 'free' | 'pro' | 'teams' | 'enterprise' // Handle potential API variation
  is_premium: boolean
  roles?: string[]
  kinde_id: string
  google_id?: string | null
  created_at: string
  updated_at: string
}

// Singleton state - shared across all useAuth() calls
const userProfile = ref<SymfonyUser | null>(null)
const isLoading = ref(false)

export const useAuth = () => {
  // Use the base Kinde auth composable from the module
  const kindeAuth = useKindeAuth()

  // Primary user data (from Symfony API)
  const currentUser = computed(() => userProfile.value)

  // Get user display name
  const userDisplayName = computed(() => {
    if (userProfile.value?.name) return userProfile.value.name
    if (userProfile.value?.email) return userProfile.value.email
    return 'User'
  })

  // Get user email
  const userEmail = computed(() => {
    return userProfile.value?.email || null
  })

  // Get user picture URL
  const userPicture = computed(() => {
    return userProfile.value?.picture || null
  })

  // Get user tier/subscription info
  const userTier = computed(() => {
    return userProfile.value?.subscription_tier || userProfile.value?.tier || 'free'
  })

  const isPremium = computed(() => {
    return userProfile.value?.is_premium || false
  })

  // Use login from Kinde module
  const login = kindeAuth.login

  // Fetch user profile from Symfony API via Nuxt proxy
  const fetchUserProfile = async (): Promise<SymfonyUser | null> => {
    // Prevent multiple simultaneous calls
    if (isLoading.value) {
      return userProfile.value
    }

    // If we already have a valid profile, return it
    if (userProfile.value) {
      return userProfile.value
    }

    try {
      isLoading.value = true

      // Call Symfony API via Nuxt proxy (include /api/ prefix for Symfony routes)
      const response = await $fetch<SymfonyUser>('/api/symfony/api/authentication', {
        method: 'GET',
        // Add retry and error handling options
        retry: 0, // Don't retry on failure
        onResponseError({ response }) {
          // Don't throw on 401 - just log it
          if (response.status === 401) {
            console.warn('User not authenticated in Symfony')
          }
        }
      })

      userProfile.value = response
      return response
    } catch (error) {
      // Silently handle auth errors on public pages
      if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 401) {
        console.debug('Auth check failed - user not logged in')
      } else {
        console.error('Failed to fetch user profile:', error)
      }
      userProfile.value = null
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Logout - clear Symfony profile and use Kinde logout
  const logout = () => {
    // Clear local Symfony state
    userProfile.value = null

    // Clear E2E test token if exists
    if (import.meta.client) {
      localStorage.removeItem('e2e_app_token')
      document.cookie = `${E2E_TOKEN_COOKIE_NAME}=; path=/; max-age=0`
    }

    // Use Kinde module logout
    kindeAuth.logout()
  }

  return {
    // Core auth state (from Kinde module)
    isAuthenticated: kindeAuth.isAuthenticated,
    isLoading: readonly(isLoading),

    // Symfony user data
    currentUser: readonly(currentUser),
    userProfile: readonly(userProfile),

    // User info
    userDisplayName: readonly(userDisplayName),
    userEmail: readonly(userEmail),
    userPicture: readonly(userPicture),
    userTier: readonly(userTier),
    isPremium: readonly(isPremium),

    // Authentication methods
    login,
    logout,
    fetchUserProfile
  }
}
