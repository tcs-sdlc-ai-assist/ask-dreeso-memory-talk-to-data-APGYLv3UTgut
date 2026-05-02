# Ask Dreeso Memory

AI-Powered Enterprise Intelligence Platform — a React-based demo application that connects to simulated enterprise systems (SAP, Procore, Salesforce, Primavera) and provides instant, contextual insights through natural language queries across 6 intelligence clusters and 4 persona flows.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Development](#development)
  - [Build](#build)
  - [Preview](#preview)
  - [Testing](#testing)
  - [Linting](#linting)
- [Environment Variables](#environment-variables)
- [Folder Structure](#folder-structure)
- [Screen Architecture](#screen-architecture)
- [Persona Flows](#persona-flows)
- [Intelligence Clusters](#intelligence-clusters)
- [Design System](#design-system)
- [State Management](#state-management)
- [Services](#services)
- [Deployment](#deployment)
- [License](#license)

---

## Overview

Ask Dreeso Memory is a front-end demo application showcasing multi-system intelligence orchestration, persona-based workflows, and actionable enterprise insights — all powered by natural language queries. The application simulates querying multiple enterprise systems in parallel, aggregating results, and presenting them through a glassmorphism-styled dark UI with responsive layouts.

Key capabilities:

- **Natural Language Queries**: Ask questions in plain English and receive structured results from simulated enterprise systems
- **4 Persona Flows**: Role-based experiences for Project Director (Lukas), Commercial Manager (Elena), Finance Lead (Sophie), and Business Development Manager (James)
- **6 Intelligence Clusters**: Project & Portfolio, Sales & Business Development, Commercial & Procurement, Finance & Cash Flow, Workforce Planning, and Knowledge/IP
- **4 Connected Systems**: SAP, Procore, Salesforce, and Primavera (simulated)
- **Actionable Insights**: Execute simulated actions directly from query results with confirmation flows
- **Source Transparency**: See which enterprise systems contributed to each result with confidence scores
- **CTA Bubbles**: Contextual follow-up suggestions generated from query results
- **Audit Trail**: Full audit logging of all user actions with export capability
- **21 Screens**: Complete UI flow from login through persona-specific dashboards to final summary

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| [React](https://react.dev/) | 18.3.x | UI framework |
| [Vite](https://vitejs.dev/) | 5.4.x | Build tool and dev server |
| [React Router](https://reactrouter.com/) | 6.26.x | Client-side routing (createBrowserRouter) |
| [Tailwind CSS](https://tailwindcss.com/) | 3.4.x | Utility-first CSS framework |
| [PostCSS](https://postcss.org/) | 8.4.x | CSS processing with Autoprefixer |
| [Vitest](https://vitest.dev/) | 2.1.x | Unit testing framework |
| [Testing Library](https://testing-library.com/) | 16.x | React component testing utilities |
| [PropTypes](https://www.npmjs.com/package/prop-types) | 15.8.x | Runtime prop type validation |
| [ESLint](https://eslint.org/) | 8.57.x | Code linting |

**Font**: [Urbanist](https://fonts.google.com/specimen/Urbanist) (loaded from Google Fonts CDN)

**No external charting libraries** — all visualizations use CSS-based bar indicators, trend arrows, confidence bars, and percentage displays.

---

## Prerequisites

- **Node.js**: v18.x or later
- **npm**: v9.x or later (ships with Node.js 18+)

Verify your environment:

```bash
node --version    # v18.x+
npm --version     # v9.x+
```

---

## Getting Started

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/AskDreeso/ask-dreeso-memory.git
cd ask-dreeso-memory
npm install
```

Copy the environment variables template:

```bash
cp .env.example .env
```

### Development

Start the development server with hot module replacement:

```bash
npm run dev
```

The application opens at [http://localhost:5173](http://localhost:5173).

### Build

Create a production build:

```bash
npm run build
```

Output is generated in the `dist/` directory.

### Preview

Preview the production build locally:

```bash
npm run preview
```

### Testing

Run the test suite:

```bash
# Watch mode (default)
npm run test

# Single run (CI mode)
npm run test -- --run
```

Tests use Vitest with jsdom environment. The setup file (`src/setupTests.js`) configures localStorage mock, matchMedia, ResizeObserver, and IntersectionObserver mocks.

Test files are co-located with their source files using the `.test.js` suffix:

- `src/services/AuditLogger.test.js`
- `src/services/ActionExecutor.test.js`
- `src/services/AuthService.test.js`
- `src/services/SessionManager.test.js`
- `src/services/QueryInterpreter.test.js`
- `src/services/OrchestrationEngine.test.js`
- `src/services/QueryOrchestrationFacade.test.js`

### Linting

Run ESLint to check code quality:

```bash
npm run lint
```

---

## Environment Variables

All environment variables are prefixed with `VITE_` and accessed via `import.meta.env`. They are embedded at build time.

| Variable | Description | Default |
|---|---|---|
| `VITE_APP_TITLE` | Application title displayed in the UI | `Ask Dreeso Memory` |
| `VITE_APP_VERSION` | Application version string | `1.0.0` |
| `VITE_MOCK_DELAY_MS` | Simulated query/action latency in milliseconds | `500` |
| `VITE_ENABLE_AUDIT_LOG` | Enable or disable audit logging (`true` / `false`) | `false` |

Set `VITE_MOCK_DELAY_MS=0` in CI to eliminate artificial delays and speed up test execution.

---

## Folder Structure

```
ask-dreeso-memory/
├── index.html                          # HTML entry point
├── package.json                        # Dependencies and scripts
├── vite.config.js                      # Vite build configuration
├── vitest.config.js                    # Vitest test configuration
├── tailwind.config.js                  # Tailwind CSS theme extensions
├── postcss.config.js                   # PostCSS plugins
├── vercel.json                         # Vercel SPA rewrite rules
├── .env.example                        # Environment variables template
├── src/
│   ├── main.jsx                        # React DOM entry point
│   ├── App.jsx                         # Root component with providers
│   ├── router.jsx                      # Route definitions (createBrowserRouter)
│   ├── index.css                       # Global styles + Tailwind directives
│   ├── constants.js                    # Application-wide constants
│   ├── config/
│   │   └── screenConfig.js             # Screen definitions (21 screens, 0-20)
│   ├── context/
│   │   ├── AuthContext.jsx             # Authentication state provider
│   │   ├── UIStateContext.jsx          # UI state machine provider
│   │   ├── NavigationContext.jsx       # Navigation state provider
│   │   └── QueryContext.jsx            # Query execution state provider
│   ├── services/
│   │   ├── AuditLogger.js             # Audit trail persistence
│   │   ├── ActionExecutor.js           # Simulated action execution
│   │   ├── AuthService.js             # Authentication (signup/login/logout)
│   │   ├── SessionManager.js          # localStorage session management
│   │   ├── PersonaQuickLogin.js       # One-click persona login
│   │   ├── QueryInterpreter.js        # Natural language query parser
│   │   ├── OrchestrationEngine.js     # Multi-system query orchestration
│   │   ├── CTABubbleEngine.js         # Contextual CTA bubble generator
│   │   ├── SourceTransparencyEngine.js # Source system contribution tracker
│   │   ├── MockDataProvider.js        # Mock data access layer
│   │   ├── QueryOrchestrationFacade.js # Unified API facade
│   │   ├── AuditLogger.test.js        # AuditLogger unit tests
│   │   ├── ActionExecutor.test.js     # ActionExecutor unit tests
│   │   ├── AuthService.test.js        # AuthService unit tests
│   │   ├── SessionManager.test.js     # SessionManager unit tests
│   │   ├── QueryInterpreter.test.js   # QueryInterpreter unit tests
│   │   ├── OrchestrationEngine.test.js # OrchestrationEngine unit tests
│   │   └── QueryOrchestrationFacade.test.js # Facade unit tests
│   ├── data/
│   │   ├── mockData.js                # All mock query/action data
│   │   └── personaData.js             # Persona profiles and credentials
│   ├── components/
│   │   ├── ui/                         # Design system components
│   │   │   ├── GlassCard.jsx          # Glassmorphism card
│   │   │   ├── GradientBackground.jsx # Gradient background wrapper
│   │   │   ├── AnimatedTransition.jsx # Enter/exit animations
│   │   │   ├── LoadingSpinner.jsx     # Spinner + skeleton loader
│   │   │   ├── SkeletonLoader.jsx     # Skeleton placeholder
│   │   │   ├── DataTable.jsx          # Responsive data table
│   │   │   ├── ForecastChart.jsx      # CSS-based forecast visualization
│   │   │   └── RiskSignalCard.jsx     # Risk signal display
│   │   ├── layout/                     # Layout components
│   │   │   ├── MainLayout.jsx         # Authenticated layout (sidebar + persona bar)
│   │   │   ├── AuthLayout.jsx         # Authentication layout (centered card)
│   │   │   ├── Sidebar.jsx            # Navigation sidebar
│   │   │   └── PersonaBar.jsx         # Persona indicator + switcher
│   │   ├── auth/
│   │   │   └── ProtectedRoute.jsx     # Authentication route guard
│   │   ├── query/                      # Query interaction components
│   │   │   ├── QueryInput.jsx         # Natural language input
│   │   │   ├── ResultRenderer.jsx     # Dynamic result display
│   │   │   ├── CTABubbles.jsx         # Follow-up suggestion bubbles
│   │   │   └── SourceIndicatorPanel.jsx # Source transparency panel
│   │   ├── actions/                    # Action components
│   │   │   ├── ActionButton.jsx       # Action execution trigger
│   │   │   └── ActionConfirmation.jsx # Action result display
│   │   └── clusters/                   # Cluster components
│   │       ├── ClusterGrid.jsx        # Responsive cluster grid
│   │       └── IntelligenceClusterCard.jsx # Single cluster card
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx          # Screen 0: Login
│   │   │   └── SignupPage.jsx         # Screen 0: Signup
│   │   ├── OnboardingPage.jsx         # Screen 1: Persona Select / Onboarding
│   │   ├── HomePage.jsx               # Screen 2: Dashboard
│   │   ├── QueryPage.jsx              # Screens 3-8: Query interaction
│   │   ├── FinalSummaryPage.jsx       # Screen 20: Audit Log / Summary
│   │   ├── NotFoundPage.jsx           # 404 page
│   │   └── personas/
│   │       ├── LukasFlowPage.jsx      # Screens 9, 13, 16, 18: Lukas flow
│   │       ├── ElenaFlowPage.jsx      # Screen 11: Elena flow
│   │       ├── SophieFlowPage.jsx     # Screens 12, 15: Sophie flow
│   │       └── JamesFlowPage.jsx      # Screens 10, 17: James flow
│   ├── test/
│   │   └── setup.js                   # Test environment setup
│   └── setupTests.js                  # Vitest setup file (alias)
```

---

## Screen Architecture

The application implements 21 screens (IDs 0–20) organized into flow groups:

### Authentication Flow (AUTH)

| Screen | ID | Path | Description |
|---|---|---|---|
| Splash / Login | 0 | `/` | Email/password login + persona quick login |
| Signup | — | `/signup` | User registration form |

### Onboarding Flow (ONBOARDING)

| Screen | ID | Path | Description |
|---|---|---|---|
| Persona Select | 1 | `/persona-select` | Platform introduction + cluster access overview |
| Dashboard | 2 | `/dashboard` | KPI metrics, cluster grid, risk alerts, activity feed |

### Demo Flow (DEMO)

| Screen | ID | Path | Description |
|---|---|---|---|
| Query Input | 3 | `/query` | Natural language query input |
| Query Loading | 4 | `/query/loading` | Loading state (managed via view state) |
| Query Result | 5 | `/query/result` | Result display (managed via view state) |
| CTA Overview | 6 | `/cta` | CTA bubbles (managed via view state) |
| Action Detail | 7 | `/action` | Action execution (managed via view state) |
| Confirmation | 8 | `/confirmation` | Action confirmation (managed via view state) |
| Knowledge/IP | 14 | `/cluster/knowledge` | Knowledge cluster (shared) |

### Lukas Flow (LUKAS)

| Screen | ID | Path | Description |
|---|---|---|---|
| Project & Portfolio | 9 | `/cluster/project` | Portfolio overview, milestones, resources, risks |
| Workforce Planning | 13 | `/cluster/workforce` | Resource allocation, capacity forecast |
| Procore System | 16 | `/system/procore` | Procore system view |
| Primavera System | 18 | `/system/primavera` | Primavera system view |

### Elena Flow (ELENA)

| Screen | ID | Path | Description |
|---|---|---|---|
| Commercial & Procurement | 11 | `/cluster/commercial` | Contracts, spend analysis, vendors, risks |

### Sophie Flow (SOPHIE)

| Screen | ID | Path | Description |
|---|---|---|---|
| Finance & Cash Flow | 12 | `/cluster/finance` | Cash flow, budget variance, forecasts, risks |
| SAP System | 15 | `/system/sap` | SAP system view |

### James Flow (JAMES)

| Screen | ID | Path | Description |
|---|---|---|---|
| Sales & Business Dev | 10 | `/cluster/sales` | Pipeline, lead analysis, forecasts, risks |
| Salesforce System | 17 | `/system/salesforce` | Salesforce system view |

### Final Flow (FINAL)

| Screen | ID | Path | Description |
|---|---|---|---|
| Settings | 19 | `/settings` | Settings / Final Summary |
| Audit Log | 20 | `/audit-log` | Session metrics, audit trail, action log, export |

### View States

Each screen supports 6 view states managed by the UI state machine:

- `INPUT` — Query input / default view
- `LOADING` — Query processing
- `RESULT` — Result display
- `CTA` — CTA bubble suggestions
- `ACTION` — Action execution
- `CONFIRMATION` — Action confirmation

### Transition Events

10 transition events drive the state machine:

- `QUERY_SUBMIT` → INPUT → LOADING
- `QUERY_SUCCESS` → LOADING → RESULT
- `QUERY_ERROR` → LOADING → INPUT
- `CTA_CLICK` → RESULT → CTA
- `ACTION_EXECUTE` → any → ACTION
- `ACTION_SUCCESS` → ACTION → CONFIRMATION
- `ACTION_ERROR` → ACTION → ACTION
- `NAVIGATE` → any → target screen
- `BACK` → any → INPUT
- `RESET` → any → INPUT

---

## Persona Flows

### Lukas Müller — Project Director

- **Accent Color**: `#3B82F6` (Blue)
- **Primary Clusters**: Project & Portfolio, Workforce Planning
- **Connected Systems**: Procore, Primavera, SAP
- **Demo Credentials**: `lukas.mueller` / `demo2024`

### Elena Rossi — Commercial Manager

- **Accent Color**: `#8B5CF6` (Purple)
- **Primary Clusters**: Commercial & Procurement
- **Connected Systems**: SAP, Procore
- **Demo Credentials**: `elena.rossi` / `demo2024`

### Sophie Dubois — Finance Lead

- **Accent Color**: `#EC4899` (Pink)
- **Primary Clusters**: Finance & Cash Flow
- **Connected Systems**: SAP, Salesforce
- **Demo Credentials**: `sophie.dubois` / `demo2024`

### James Carter — Business Development Manager

- **Accent Color**: `#F59E0B` (Gold)
- **Primary Clusters**: Sales & Business Development
- **Connected Systems**: Salesforce
- **Demo Credentials**: `james.carter` / `demo2024`

Each persona has:
- Per-persona cluster access definitions (full / read / none)
- Per-persona connected systems
- Per-persona screen flows
- Per-persona query suggestions (8 per persona)
- Per-persona accent colors for UI theming

---

## Intelligence Clusters

| Cluster | ID | Icon | Color | Description |
|---|---|---|---|---|
| Project & Portfolio | `project-portfolio` | 📊 | `#3B82F6` | Project timelines, milestones, and portfolio health |
| Sales & Business Dev | `sales-business-dev` | 📈 | `#F59E0B` | Pipeline, leads, and opportunity tracking |
| Commercial & Procurement | `commercial-procurement` | 📋 | `#8B5CF6` | Contracts, procurement, and vendor management |
| Finance & Cash Flow | `finance-cash-flow` | 💰 | `#10B981` | Budgets, forecasts, and cash flow analysis |
| Workforce Planning | `workforce-planning` | 👥 | `#EC4899` | Resource allocation, capacity, and team planning |
| Knowledge/IP | `knowledge-ip` | 🧠 | `#06B6D4` | Institutional knowledge, lessons learned, and IP assets |

---

## Design System

### Theme

- **Background**: Dark gradient `#0A1A2F → #142238 → #1E2A44`
- **Font**: Urbanist (Google Fonts) with system-ui fallback
- **Color Palette**: Blue, Cyan, Purple, Pink, Teal, Gold accents

### Glassmorphism

Three glass variants with backdrop blur, semi-transparent backgrounds, and border effects:

- `.glass` — Default (16px border radius, 12px blur)
- `.glass-sm` — Small (12px border radius, 12px blur)
- `.glass-lg` — Large (24px border radius, 20px blur)

Additional variants: `subtle`, `solid`, `outline`

### Components

| Component | Description |
|---|---|
| `GlassCard` | Glassmorphism card with 6 variants and 5 padding sizes |
| `GradientBackground` | Gradient wrapper with 4 variants and 4 overlay patterns |
| `AnimatedTransition` | Enter/exit animations with 8 types and 3 durations |
| `LoadingSpinner` | Spinner with 5 sizes + skeleton loader variant |
| `SkeletonLoader` | Placeholder with 6 variants and 3 sizes |
| `DataTable` | Responsive table (desktop table / tablet cards / mobile carousel) |
| `ForecastChart` | CSS-based bar indicators, trend arrows, confidence bars |
| `RiskSignalCard` | Severity-coded risk display with expandable details |
| `IntelligenceClusterCard` | Cluster card with access badges and sample queries |
| `ClusterGrid` | Responsive 3/2/1 column grid with staggered animations |
| `ActionButton` | Action trigger with loading/success/error states |
| `ActionConfirmation` | Execution result with undo window and proceed options |

### Responsive Breakpoints

- **Mobile** (`<768px`): Sidebar hidden, carousel layouts, single column
- **Tablet** (`768px–1024px`): Sidebar collapsible, card stack layouts, 2 columns
- **Desktop** (`>1024px`): Sidebar always visible, full table layouts, 3 columns

### Animations

- `fade` — Opacity transition
- `slide-up` / `slide-down` / `slide-left` / `slide-right` — Directional slides
- `scale` / `scale-up` — Scale transitions
- `none` — No animation

Durations: `fast` (200ms), `normal` (300ms), `slow` (400ms)

---

## State Management

### Context Providers

The application uses 4 React context providers in the following hierarchy:

```
AuthProvider          → Authentication state (user, persona, role)
  UIStateProvider     → UI state machine (screen, view, loading, error, results)
    RouterProvider    → React Router (createBrowserRouter)
      NavigationProvider → Route-based navigation with history stack
        QueryProvider    → Query execution state (results, CTA, sources)
```

`NavigationProvider` and `QueryProvider` require React Router context and are instantiated within the route tree via layout components.

### UIStateContext

Manages a deterministic state machine with:

- `currentScreen` (number, 0–20)
- `currentView` (string, 6 view states)
- `persona` (string or null)
- `loading` (boolean)
- `error` (object or null)
- `queryResult` (object or null)
- `actionResult` (object or null)
- `actionsTaken` (array)
- `queryText` (string or null)

State transitions are resolved via `resolveTransition()` for deterministic behavior.

### Session Persistence

Session state is persisted to localStorage via `SessionManager`:

- `ask-dreeso-session` — Full session object (userId, persona, role, token, expiresAt)
- `ask-dreeso-selected-persona` — Active persona ID
- `ask-dreeso-last-screen` — Last visited screen ID
- `ask-dreeso-audit-log` — Audit trail entries (max 1000)
- `ask-dreeso-action-log` — Action execution log (max 500)

---

## Services

### Intelligence Engine

| Service | Description |
|---|---|
| `QueryInterpreter` | Maps natural language to domains, query types, keywords, confidence scores, target systems, and persona hints using keyword matching against 6 intelligence clusters |
| `OrchestrationEngine` | Simulates parallel queries to SAP, Procore, Salesforce, and Primavera with result aggregation, deduplication, and system contribution tracking |
| `CTABubbleEngine` | Generates 3–4 contextual follow-up suggestions based on query results, cluster context, and persona context |
| `SourceTransparencyEngine` | Determines which systems contributed to each result with contribution levels (high/medium/low/none) and confidence scores |
| `ActionExecutor` | Simulates 10 action types (navigate, generate-report, schedule, escalate, update, workflow, recommendation, share, create, export-csv) with localStorage-persisted action log |
| `MockDataProvider` | Structured mock data access with filtering by domain, query text, system, and persona |
| `QueryOrchestrationFacade` | Unified API facade composing all sub-services into a single surface for UI consumption |

### Authentication

| Service | Description |
|---|---|
| `AuthService` | Signup, login, logout with simulated password hashing and role-to-persona mapping |
| `PersonaQuickLogin` | One-click login as predefined personas (Lukas, Elena, Sophie, James) |
| `SessionManager` | localStorage session CRUD with expiry detection and automatic cleanup |

### Audit & Logging

| Service | Description |
|---|---|
| `AuditLogger` | Persists all user actions to localStorage with 15 event types, filtering, and JSON export. Auto-prunes at 1000 entries. |
| `ActionExecutor` | Action log with filtering by type/system/status/persona and JSON export. Auto-prunes at 500 entries. |

---

## Deployment

The application is configured for deployment on [Vercel](https://vercel.com) with SPA routing support.

### Quick Deploy

1. Import the repository in the [Vercel dashboard](https://vercel.com/new)
2. Vercel auto-detects Vite and configures build settings
3. Add environment variables in Settings → Environment Variables
4. Deploy

### SPA Routing

The `vercel.json` file rewrites all paths to `index.html` for React Router:

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

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## License

Private