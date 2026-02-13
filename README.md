# @habityzer/nuxt-symfony-kinde-layer

Shared Nuxt layer for Symfony + Kinde authentication integration. This layer provides common authentication logic, API proxying, and pre-configured modules for Nuxt projects using Symfony backends with Kinde authentication.

## Features

- ✅ **Symfony API Proxy** - Automatically forwards requests with Kinde auth tokens
- ✅ **Accept Header Fix** - Properly forwards Accept header for content negotiation (JSON vs Hydra)
- ✅ **Auth Composable** - Unified authentication state management
- ✅ **Global Auth Middleware** - Configurable route protection
- ✅ **E2E Testing Support** - Built-in support for automated testing
- ✅ **Pre-configured Modules** - Includes @nuxt/ui, @nuxt/image, Pinia, ESLint, and more
- ✅ **Type-safe** - Full TypeScript support with OpenAPI integration

## Installation

### Using pnpm workspace (recommended for monorepos)

```bash
# In your project root
pnpm add @habityzer/nuxt-symfony-kinde-layer
```

### Or link locally

```bash
cd /path/to/@habityzer/nuxt-symfony-kinde-layer
pnpm install
pnpm link --global

cd /path/to/your-project
pnpm link --global @habityzer/nuxt-symfony-kinde-layer
```

## Usage

### 1. Extend the layer in your `nuxt.config.ts`

```typescript
export default defineNuxtConfig({
  extends: ['@habityzer/nuxt-symfony-kinde-layer'],

  // Runtime config - expose auth settings for middleware
  runtimeConfig: {
    apiBaseUrl: process.env.API_BASE_URL,
    
    public: {
      apiBaseUrl: process.env.API_BASE_URL,
      
      // IMPORTANT: Expose auth config for middleware (must match kindeAuth below)
      kindeAuth: {
        cookie: {
          prefix: 'myapp_' // Must match prefix in kindeAuth
        },
        middleware: {
          publicRoutes: ['/', '/blog', '/help']
        }
      }
    }
  },

  // Configure Kinde authentication module
  kindeAuth: {
    authDomain: process.env.NUXT_KINDE_AUTH_DOMAIN,
    clientId: process.env.NUXT_KINDE_CLIENT_ID,
    clientSecret: process.env.NUXT_KINDE_CLIENT_SECRET,
    redirectURL: process.env.NUXT_KINDE_REDIRECT_URL,
    logoutRedirectURL: process.env.NUXT_KINDE_LOGOUT_REDIRECT_URL,
    postLoginRedirectURL: '/dashboard',
    cookie: {
      prefix: 'myapp_' // IMPORTANT: Must be unique per project to avoid cookie conflicts
    },
    middleware: {
      publicRoutes: ['/', '/blog', '/help'] // Must match publicRoutes in runtimeConfig.public
    }
  }
})
```

### 2. Environment Variables

Create a `.env` file:

```bash
# Symfony Backend
API_BASE_URL=http://localhost:8000

# Kinde Authentication
NUXT_KINDE_AUTH_DOMAIN=https://your-domain.kinde.com
NUXT_KINDE_CLIENT_ID=your-client-id
NUXT_KINDE_CLIENT_SECRET=your-client-secret
NUXT_KINDE_REDIRECT_URL=http://localhost:3000/api/kinde/callback
NUXT_KINDE_LOGOUT_REDIRECT_URL=http://localhost:3000
NUXT_KINDE_POST_LOGIN_REDIRECT_URL=/dashboard
```

### 3. Use the Auth Composable

```vue
<script setup lang="ts">
const {
  isAuthenticated,
  currentUser,
  userDisplayName,
  userEmail,
  isPremium,
  login,
  logout,
  fetchUserProfile
} = useAuth()

// Fetch user profile on mount
onMounted(async () => {
  if (isAuthenticated.value) {
    await fetchUserProfile()
  }
})
</script>

<template>
  <div>
    <template v-if="isAuthenticated">
      <p>Welcome, {{ userDisplayName }}!</p>
      <p v-if="isPremium">Premium user</p>
      <button @click="logout">Logout</button>
    </template>
    <template v-else>
      <button @click="login">Login</button>
    </template>
  </div>
</template>
```

### 4. Call Symfony APIs

The layer automatically proxies requests to `/api/symfony/*`:

```typescript
// This calls your Symfony backend at /api/users
const users = await $fetch('/api/symfony/api/users')

// With generated OpenAPI composables
const { getUsersApi } = useUsersApi()
const response = await getUsersApi()
```

## What's Included

### Modules

- `@nuxt/ui` - UI component library
- `@nuxt/image` - Image optimization
- `@nuxt/eslint` - Linting
- `@pinia/nuxt` - State management
- `@habityzer/nuxt-kinde-auth` - Kinde authentication
- `@vueuse/core` - Vue composition utilities

### Files

- `server/api/symfony/[...].ts` - Symfony API proxy with auth
- `app/composables/useAuth.ts` - Authentication composable
- `app/constants/auth.ts` - Auth constants
- `app/middleware/auth.global.ts` - Global route protection

## Configuration Options

### Cookie Prefix

**CRITICAL:** Always set a unique cookie prefix per project to avoid cookie conflicts when running multiple projects locally:

```typescript
// MUST be set in BOTH places:
runtimeConfig: {
  public: {
    kindeAuth: {
      cookie: {
        prefix: 'myproject_' // For middleware to read
      }
    }
  }
},

kindeAuth: {
  cookie: {
    prefix: 'myproject_' // For Kinde module (must match above)
  }
}
```

**Why both?**
- `kindeAuth.cookie.prefix` - Used by the Kinde auth module to set/read cookies
- `runtimeConfig.public.kindeAuth.cookie.prefix` - Used by the layer's middleware to check authentication

**Without unique prefixes:** If you run `ew-nuxt` and `habityzer-nuxt` locally at the same time, they'll share cookies and cause auth conflicts!

### Public Routes

Configure which routes don't require authentication:

```typescript
kindeAuth: {
  middleware: {
    publicRoutes: [
      '/',
      '/blog',
      '/about',
      '/legal'
    ]
  }
}
```

## E2E Testing

The layer supports E2E testing with app tokens:

1. Generate an app token in Symfony:
   ```bash
   php bin/console app:token:manage create
   ```

2. Set the token in your E2E tests:
   ```typescript
   // Set cookie
   await page.context().addCookies([{
     name: 'kinde_token',
     value: 'app_your_token_here',
     domain: 'localhost',
     path: '/'
   }])
   ```

## API Schema Generation

The layer includes OpenAPI tools for generating typed API composables:

```bash
# Generate TypeScript types from OpenAPI schema
pnpm generate:types

# Generate API composables
pnpm generate:api

# Or do both
pnpm sync:api
```

Add these scripts to your project's `package.json`:

```json
{
  "scripts": {
    "generate:types": "openapi-typescript ./schema/api.json -o ./app/types/api.ts --default-non-nullable false && eslint ./app/types/api.ts --fix",
    "generate:api": "pnpm generate:types && nuxt-openapi-composables generate -s ./schema/api.json -o ./app/composables/api --types-import '~/types/api'",
    "sync:api": "pnpm update:schema && pnpm generate:api"
  }
}
```

## Development

### Local Development Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **The project uses Husky for git hooks:**
   - Pre-commit: Automatically runs `pnpm lint` before each commit
   - Commit-msg: Validates commit message format (conventional commits)

3. **Run linter manually:**
   ```bash
   pnpm lint        # Check for issues
   pnpm lint:fix    # Auto-fix issues
   ```

4. **First time setup:**
   The pre-commit hook will automatically run `nuxt prepare` if needed (with placeholder environment variables).

### Commit Message Format

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Your commits must follow this format:

```
type(scope): subject

body (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat: add authentication middleware"
git commit -m "fix: resolve cookie prefix conflict"
git commit -m "docs: update README with CI setup"
```

## CI/CD Setup

### Required Environment Variables for GitHub Actions

When building or publishing this layer in CI/CD (e.g., GitHub Actions), you need to provide placeholder environment variables for the `nuxt prepare` step. The layer's `nuxt.config.ts` validates these at build time.

Add these to your workflow:

```yaml
- name: Prepare Nuxt
  env:
    KINDE_AUTH_DOMAIN: https://placeholder.kinde.com
    KINDE_CLIENT_ID: placeholder_client_id
    KINDE_CLIENT_SECRET: placeholder_client_secret
    KINDE_REDIRECT_URL: http://localhost:3000/api/auth/callback
    KINDE_LOGOUT_REDIRECT_URL: http://localhost:3000
    NUXT_PUBLIC_AUTH_COOKIE_PREFIX: auth_
    NUXT_PUBLIC_AUTH_LOGIN_PATH: /login
    NUXT_PUBLIC_AUTH_CLOCK_SKEW_SECONDS: 300
    NUXT_PUBLIC_AUTH_APP_TOKEN_PREFIX: Bearer
    NUXT_PUBLIC_AUTH_E2E_TOKEN_COOKIE_NAME: e2e_token
    NUXT_PUBLIC_AUTH_ID_TOKEN_NAME: id_token
    NUXT_PUBLIC_AUTH_ACCESS_TOKEN_NAME: access_token
    NUXT_PUBLIC_AUTH_REFRESH_TOKEN_NAME: refresh_token
  run: pnpm nuxt prepare
```

**Note**: These are placeholder values only used for type generation and validation. Projects consuming this layer will provide their own real credentials at runtime.

## Troubleshooting

### Cookie Name Conflicts

If you see authentication issues, ensure each project has a unique cookie prefix:

```typescript
// Project A
kindeAuth: { cookie: { prefix: 'projecta_' } }

// Project B  
kindeAuth: { cookie: { prefix: 'projectb_' } }
```

### TypeScript Errors with API Responses

If you get type mismatches between expected Hydra collections and plain arrays, the proxy is correctly forwarding the Accept header. Make sure your OpenAPI schema matches what the API actually returns.

## Architecture & Design Decisions

### Why Constants Are Defined Inline in Server Code

You'll notice that auth constants (`E2E_TOKEN_COOKIE_NAME`, `APP_TOKEN_PREFIX`, `KINDE_ID_TOKEN_COOKIE_NAME`) are defined directly in the server files (`server/api/symfony/[...].ts`) rather than imported from a shared constants file.

**Reason**: Nitro's bundling process for server-side code doesn't support:
- App aliases like `~` or `@` (these resolve to the consuming project's app directory, not the layer's)
- Relative imports from external layers during the rollup bundling phase
- The `#build` alias for accessing layer exports

**Solution**: We define these constants inline in server files while maintaining the shared `app/constants/auth.ts` for client-side code. This is a deliberate architectural choice to ensure reliable builds across all consuming projects.

### Cookie Prefix Configuration

The layer uses a project-specific cookie prefix (e.g., `ew-`, `habityzer_`) to prevent cookie conflicts when running multiple projects locally.

**Implementation**:
1. Base cookie names are defined without prefixes (`id_token`, `access_token`)
2. Projects configure their prefix in `nuxt.config.ts`
3. The prefix is applied dynamically at runtime by middleware and composables
4. Projects should NOT redefine the cookie constant names - they inherit from the layer

### TypeScript Type Suppressions

You may see `@ts-expect-error` comments for the `cookie` property in configuration files. This is expected and safe.

**Reason**: The `@habityzer/nuxt-kinde-auth` module's TypeScript definitions don't include our custom `cookie.prefix` configuration property, but it works correctly at runtime.

**Solution**: We use `@ts-expect-error` comments to suppress TypeScript errors without compromising type safety elsewhere in the codebase.

### Cache Clearing

If you encounter auto-import issues after updating the layer (especially for composables), clear your Nuxt cache:

```bash
rm -rf .nuxt node_modules/.cache
pnpm build
```

This forces Nuxt to regenerate its auto-import registry and pick up changes from the layer.

## License

MIT

## Contributing

This is a private layer for Habityzer projects. For issues or improvements, contact the team.

