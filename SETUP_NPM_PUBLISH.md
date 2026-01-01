# Setting Up Automated NPM Publishing

This project uses GitHub Actions with semantic-release to automatically publish to npm when you push to the `master` branch.

## Setup Instructions

### 1. Create NPM Access Token

1. Go to [npmjs.com](https://www.npmjs.com/) and log in
2. Click on your profile picture → **Access Tokens**
3. Click **Generate New Token** → **Classic Token**
4. Select **Automation** type (recommended for CI/CD)
5. Copy the token (it starts with `npm_...`)

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

### "Permission denied"
- Ensure your NPM token has **Automation** or **Publish** permissions
- Check that your npm account has publish access to the `@habityzer` scope

### "Package already published"
- Semantic-release automatically handles versions
- If you manually published the same version, semantic-release will skip it

## Current Configuration

- **Branch**: `master` (configured in `.releaserc.json`)
- **Package**: `@habityzer/nuxt-symfony-kinde-layer`
- **Workflow**: `.github/workflows/publish.yml`
- **NPM Publish**: Enabled (set in `.releaserc.json`)

## Additional Resources

- [Semantic Release Documentation](https://semantic-release.gitbook.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [NPM Token Types](https://docs.npmjs.com/about-access-tokens)

