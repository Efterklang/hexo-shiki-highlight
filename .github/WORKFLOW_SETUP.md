# GitHub Workflow Setup for NPM Publishing

This repository now includes GitHub workflows for automatic NPM publishing.

## Setup Instructions

### 1. Create NPM Token
1. Go to [npmjs.com](https://www.npmjs.com) and log in
2. Click on your profile picture → "Access Tokens"
3. Click "Generate New Token" → "Granular Access Token"
4. Set the token name (e.g., "github-actions-hexo-shiki-highlight")
5. Set expiration as needed
6. Select packages: `hexo-shiki-highlight`
7. Set permissions: "Read and write"
8. Click "Generate token" and copy it

### 2. Add Token to GitHub Secrets
1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `NPM_TOKEN`
5. Value: Paste the token from step 1
6. Click "Add secret"

## How the Workflows Work

### CI/CD Pipeline (`ci-cd.yml`)
- Runs on every push to `main` or `develop` branches and PRs to `main`
- Tests the package on Node.js versions 16, 18, and 20
- Automatically publishes to NPM when version in package.json changes

### NPM Publish (`npm-publish.yml`)
- Triggered on GitHub releases or version tags (v*)
- Publishes the package to NPM registry

## Publishing a New Version

### Method 1: Using npm version command
```bash
npm version patch  # for bug fixes (1.1.4 → 1.1.5)
npm version minor  # for new features (1.1.4 → 1.2.0)
npm version major  # for breaking changes (1.1.4 → 2.0.0)
```

### Method 2: Manual version update + GitHub Release
1. Update version in `package.json`
2. Commit and push changes
3. Create a new release on GitHub with tag `v{version}`

The workflow will automatically publish to NPM when it detects a version change or a new release.
