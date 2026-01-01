# Setting Up Automated NPM Publishing

This project uses GitHub Actions with semantic-release to automatically publish to npm when you push to the `master` branch.

## Setup Instructions

### 1. Create NPM Access Token

> **Important**: As of December 9, 2025, npm classic tokens have been permanently revoked. You must use **granular access tokens** for CI/CD workflows.

**Option A: Using npm CLI (recommended):**
```bash
npm token create --type automation --scope @habityzer
```

**Option B: Using the web interface:**
1. Go to [npmjs.com/settings/~/tokens](https://www.npmjs.com/settings/~/tokens) and log in
2. Click **Generate New Token** → **Granular Access Token**
3. Configure your token:
   - **Token name**: `github-actions-publish` (or any descriptive name)
   - **Expiration**: Up to 90 days (maximum for publish tokens)
   - **Packages and scopes**: Select your package or `@habityzer` scope
   - **Permissions**: Select **Read and write**
   - ✅ **Enable "Bypass 2FA"** for automated workflows
4. Click **Generate Token**
5. Copy the token (starts with `npm_...`)

> **Note**: Granular tokens for publishing expire after a maximum of 90 days. Set a reminder to regenerate the token before expiration, or consider using [OIDC trusted publishing](https://docs.npmjs.com/generating-provenance-statements) for a more secure, token-free approach.

### 2. Add NPM Token to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NPM_TOKEN`
5. Value: Paste your npm token from step 1
6. Click **Add secret**

### 3. Configure GitHub Actions in NPM

When setting up your package on npmjs.com for automated publishing:

1. Go to your package page on npmjs.com
2. Navigate to **Settings** → **Publishing Access**
3. Under **GitHub Actions**, you'll be asked for:
   - **Workflow filename**: Enter `publish.yml`
   - This tells npm which workflow file in `.github/workflows/` will publish your package

### 4. How It Works

The workflow (`.github/workflows/publish.yml`) will:

1. **Trigger**: Automatically runs when you push to the `master` branch
2. **Analyze**: Semantic-release reads your commit messages (following conventional commits)
3. **Version**: Automatically bumps the version based on your commits:
   - `feat:` → minor version (1.0.0 → 1.1.0)
   - `fix:` → patch version (1.0.0 → 1.0.1)
   - `BREAKING CHANGE:` → major version (1.0.0 → 2.0.0)
4. **Changelog**: Updates `CHANGELOG.md`
5. **Git Tag**: Creates a git tag for the new version
6. **Publish**: Publishes to npm
7. **Commit**: Commits the changelog and version bump back to your repo

### 5. Commit Message Format

Use conventional commits for automatic versioning:

```bash
# Patch release (1.0.0 → 1.0.1)
git commit -m "fix: resolve authentication bug"

# Minor release (1.0.0 → 1.1.0)
git commit -m "feat: add new login method"

# Major release (1.0.0 → 2.0.0)
git commit -m "feat: redesign API

BREAKING CHANGE: API structure has changed"

# No release (documentation, etc.)
git commit -m "docs: update README"
git commit -m "chore: update dependencies"
```

### 6. Manual Release (Optional)

If you prefer to release manually:

```bash
pnpm release
```

This runs semantic-release locally. Make sure you have:
- `NPM_TOKEN` environment variable set
- Committed all your changes
- Pushed to the master branch

## Troubleshooting

### "No NPM_TOKEN found"
- Make sure you've added `NPM_TOKEN` as a GitHub secret
- Check that the secret name is exactly `NPM_TOKEN` (case-sensitive)

### "No release published"
- Check your commit messages follow conventional commits format
- Semantic-release only publishes if there are releasable commits
- View the GitHub Actions logs for details

### "Permission denied" or "Invalid npm token"
- Ensure you're using a **granular access token** (not classic token)
- Check that the token has **Read and write** permissions
- Ensure **"Bypass 2FA"** is enabled for CI/CD workflows
- Check that your npm account has publish access to the `@habityzer` scope
- Verify the token hasn't expired (granular tokens expire after max 90 days)

### "Package already published"
- Semantic-release automatically handles versions
- If you manually published the same version, semantic-release will skip it

## Current Configuration

- **Branch**: `master` (configured in `.releaserc.json`)
- **Package**: `@habityzer/nuxt-symfony-kinde-layer`
- **Workflow**: `.github/workflows/publish.yml`
- **NPM Publish**: Enabled (set in `.releaserc.json`)

## Additional Resources

- [npm Granular Access Tokens Documentation](https://docs.npmjs.com/about-access-tokens#granular-access-tokens)
- [GitHub Blog: npm Classic Tokens Revoked (Dec 2025)](https://github.blog/changelog/2025-12-09-npm-classic-tokens-revoked-session-based-auth-and-cli-token-management-now-available/)
- [Semantic Release Documentation](https://semantic-release.gitbook.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [OIDC Trusted Publishing for npm](https://docs.npmjs.com/generating-provenance-statements)

