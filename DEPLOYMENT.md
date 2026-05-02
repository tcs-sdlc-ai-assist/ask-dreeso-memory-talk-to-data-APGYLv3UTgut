# Deployment Guide

Deployment documentation for Ask Dreeso Memory covering Vercel deployment steps, environment variables, build configuration, SPA routing setup, and CI/CD notes for GitHub integration.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Build Configuration](#build-configuration)
- [Vercel Deployment](#vercel-deployment)
  - [One-Click Deploy](#one-click-deploy)
  - [CLI Deployment](#cli-deployment)
  - [GitHub Integration](#github-integration)
- [SPA Routing Setup](#spa-routing-setup)
- [CI/CD Pipeline](#cicd-pipeline)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js**: v18.x or later
- **npm**: v9.x or later (ships with Node.js 18+)
- **Git**: Repository cloned and up to date
- **Vercel Account**: Free or paid tier at [vercel.com](https://vercel.com)
- **Vercel CLI** (optional): Install globally with `npm i -g vercel`

Verify your local environment:

```bash
node --version    # v18.x+
npm --version     # v9.x+
git --version     # any recent version
```

---

## Environment Variables

The application uses Vite environment variables prefixed with `VITE_`. Copy the template and configure values before deploying:

```bash
cp .env.example .env
```

### Required Variables

| Variable                 | Description                                      | Default Value        | Required |
|--------------------------|--------------------------------------------------|----------------------|----------|
| `VITE_APP_TITLE`         | Application title displayed in the UI            | `Ask Dreeso Memory`  | No       |
| `VITE_APP_VERSION`       | Application version string                       | `1.0.0`              | No       |
| `VITE_MOCK_DELAY_MS`     | Simulated query latency in milliseconds          | `500`                | No       |
| `VITE_ENABLE_AUDIT_LOG`  | Enable or disable audit logging (`true`/`false`) | `false`              | No       |

### Setting Variables in Vercel

1. Navigate to your project in the Vercel dashboard
2. Go to **Settings** → **Environment Variables**
3. Add each variable with the appropriate value
4. Select the environments where each variable applies:
   - **Production**: Live deployment
   - **Preview**: Branch and PR deployments
   - **Development**: Local development via `vercel dev`

> **Note**: Vite embeds environment variables at build time. Changes to environment variables require a redeployment to take effect.

### Recommended Production Values

```
VITE_APP_TITLE=Ask Dreeso Memory
VITE_APP_VERSION=1.0.0
VITE_MOCK_DELAY_MS=500
VITE_ENABLE_AUDIT_LOG=false
```

### Recommended Preview/Staging Values

```
VITE_APP_TITLE=Ask Dreeso Memory (Preview)
VITE_APP_VERSION=1.0.0
VITE_MOCK_DELAY_MS=300
VITE_ENABLE_AUDIT_LOG=true
```

---

## Build Configuration

### Local Build

Run the production build locally to verify before deploying:

```bash
# Install dependencies
npm install

# Run the production build
npm run build

# Preview the production build locally
npm run preview
```

The build output is generated in the `dist/` directory.

### Build Details

- **Build Tool**: Vite 5.x with `@vitejs/plugin-react`
- **Output Directory**: `dist`
- **Entry Point**: `index.html`
- **CSS**: Tailwind CSS 3.x with PostCSS and Autoprefixer
- **Font**: Urbanist (loaded from Google Fonts CDN)
- **Path Aliases**: `@` maps to `src/` (configured in `vite.config.js`)

### Vite Configuration

The `vite.config.js` file includes:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
```

### PostCSS Configuration

The `postcss.config.js` file includes Tailwind CSS and Autoprefixer:

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

---

## Vercel Deployment

### One-Click Deploy

The simplest way to deploy is to import the repository directly from the Vercel dashboard:

1. Go to [vercel.com/new](https://vercel.com/new)
2. Select **Import Git Repository**
3. Choose the `ask-dreeso-memory` repository
4. Vercel auto-detects the Vite framework and configures:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Add environment variables (see [Environment Variables](#environment-variables))
6. Click **Deploy**

### CLI Deployment

Deploy from the command line using the Vercel CLI:

```bash
# Install Vercel CLI globally (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview (creates a unique preview URL)
vercel

# Deploy to production
vercel --prod
```

On first run, the CLI will prompt you to link the project. Accept the defaults or configure:

- **Project Name**: `ask-dreeso-memory`
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### GitHub Integration

Vercel integrates directly with GitHub for automatic deployments:

1. **Connect Repository**: Link your GitHub repository in the Vercel dashboard under **Settings** → **Git**
2. **Production Branch**: Set `main` (or your default branch) as the production branch
3. **Automatic Deployments**:
   - Every push to `main` triggers a **production deployment**
   - Every push to any other branch triggers a **preview deployment**
   - Every pull request gets a unique **preview URL** with a deployment comment
4. **Branch Protection**: Optionally require successful Vercel deployment checks before merging PRs

#### Deployment Triggers

| Event                        | Deployment Type | URL                              |
|------------------------------|-----------------|----------------------------------|
| Push to `main`               | Production      | `your-project.vercel.app`        |
| Push to feature branch       | Preview         | `your-project-<hash>.vercel.app` |
| Pull request opened/updated  | Preview         | Unique URL posted as PR comment  |

---

## SPA Routing Setup

Ask Dreeso Memory is a single-page application (SPA) using React Router with `createBrowserRouter`. All client-side routes must be rewritten to `index.html` so that React Router can handle them.

### Vercel Rewrites

The `vercel.json` file at the project root configures SPA routing:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This ensures that all paths (e.g., `/dashboard`, `/query`, `/cluster/project`, `/persona-select`) are served by `index.html`, allowing React Router to resolve the correct page component.

### Application Routes

The following routes are defined in `src/router.jsx`:

| Path                   | Screen                              | Auth Required |
|------------------------|-------------------------------------|---------------|
| `/`                    | Login (Splash)                      | No            |
| `/signup`              | Signup                              | No            |
| `/persona-select`      | Onboarding / Persona Select         | Yes           |
| `/dashboard`           | Dashboard / Home                    | Yes           |
| `/query`               | Query Input                         | Yes           |
| `/query/loading`       | Query Loading                       | Yes           |
| `/query/result`        | Query Result                        | Yes           |
| `/cta`                 | CTA Overview                        | Yes           |
| `/action`              | Action Detail                       | Yes           |
| `/confirmation`        | Confirmation                        | Yes           |
| `/cluster/project`     | Project & Portfolio (Lukas)         | Yes           |
| `/cluster/workforce`   | Workforce Planning (Lukas)          | Yes           |
| `/cluster/commercial`  | Commercial & Procurement (Elena)    | Yes           |
| `/cluster/finance`     | Finance & Cash Flow (Sophie)        | Yes           |
| `/cluster/sales`       | Sales & Business Dev (James)        | Yes           |
| `/cluster/knowledge`   | Knowledge/IP                        | Yes           |
| `/system/sap`          | SAP System (Sophie)                 | Yes           |
| `/system/procore`      | Procore System (Lukas)              | Yes           |
| `/system/salesforce`   | Salesforce System (James)           | Yes           |
| `/system/primavera`    | Primavera System (Lukas)            | Yes           |
| `/settings`            | Settings                            | Yes           |
| `/audit-log`           | Audit Log / Final Summary           | Yes           |
| `*`                    | 404 Not Found                       | No            |

### Protected Routes

Routes requiring authentication are wrapped with the `ProtectedRoute` component. Unauthenticated users are automatically redirected to the login page (`/`). Session state is managed via `localStorage` through the `SessionManager` service.

---

## CI/CD Pipeline

### Recommended GitHub Actions Workflow

Create `.github/workflows/ci.yml` for automated testing and linting on every push and pull request:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18, 20]

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm run test -- --run
        env:
          VITE_APP_TITLE: Ask Dreeso Memory
          VITE_APP_VERSION: 1.0.0
          VITE_MOCK_DELAY_MS: 0
          VITE_ENABLE_AUDIT_LOG: true

      - name: Build
        run: npm run build
        env:
          VITE_APP_TITLE: Ask Dreeso Memory
          VITE_APP_VERSION: 1.0.0
          VITE_MOCK_DELAY_MS: 500
          VITE_ENABLE_AUDIT_LOG: false
```

### Pipeline Stages

1. **Checkout**: Clone the repository
2. **Setup**: Install Node.js and cache `node_modules`
3. **Install**: Run `npm ci` for deterministic installs
4. **Lint**: Run `npm run lint` to check code quality with ESLint
5. **Test**: Run `npm run test -- --run` to execute all Vitest tests in CI mode
6. **Build**: Run `npm run build` to verify the production build succeeds

### Vercel + GitHub Integration Notes

- Vercel runs its own build pipeline on every push, separate from GitHub Actions
- GitHub Actions is used for linting and testing; Vercel handles deployment
- Both pipelines run in parallel — a failing GitHub Actions check does not block Vercel deployment unless branch protection rules are configured
- To enforce quality gates, enable **Required status checks** in GitHub branch protection settings and add the CI workflow as a required check

### Test Configuration for CI

Tests use Vitest with the following configuration from `vitest.config.js`:

- **Environment**: `jsdom` (simulates browser APIs)
- **Setup File**: `src/setupTests.js` (configures `localStorage` mock, `matchMedia`, `ResizeObserver`, `IntersectionObserver`)
- **Mock Delay**: Set `VITE_MOCK_DELAY_MS=0` in CI to eliminate artificial delays and speed up test execution
- **Audit Logging**: Set `VITE_ENABLE_AUDIT_LOG=true` in CI to test audit trail functionality

---

## Troubleshooting

### Common Issues

#### Build fails with "Cannot find module" errors

Ensure all dependencies are installed:

```bash
rm -rf node_modules
npm install
```

#### Routes return 404 on Vercel

Verify that `vercel.json` exists at the project root with the SPA rewrite rule:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### Environment variables not available at runtime

Vite embeds environment variables at build time. After changing variables in the Vercel dashboard, trigger a new deployment:

```bash
vercel --prod
```

Or push a new commit to trigger an automatic redeployment.

#### Tailwind styles missing in production

Ensure the `content` array in `tailwind.config.js` includes all source files:

```js
content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
],
```

#### Tests fail in CI but pass locally

- Verify `VITE_MOCK_DELAY_MS` is set to `0` in CI to avoid timeout issues
- Ensure `VITE_ENABLE_AUDIT_LOG` is set to `true` for audit-related tests
- Check that the Node.js version in CI matches your local version (18.x or 20.x)

#### Fonts not loading

The Urbanist font is loaded from Google Fonts CDN via `index.html`. Ensure the deployment has internet access and the `<link>` tags are present in the HTML head:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Urbanist:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" />
```

### Support

For deployment issues specific to Vercel, consult the [Vercel Documentation](https://vercel.com/docs).

For Vite build issues, consult the [Vite Documentation](https://vitejs.dev/guide/).

For React Router issues, consult the [React Router Documentation](https://reactrouter.com/en/main).