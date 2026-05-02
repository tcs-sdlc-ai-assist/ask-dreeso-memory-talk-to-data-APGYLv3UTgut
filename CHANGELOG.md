# Changelog

All notable changes to Ask Dreeso Memory will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-11-15

### Added

#### Authentication Module
- User signup with full name, email, password (with strength validation), and role selection
- User login with email/password credential validation
- Persona quick login for 4 predefined personas (Lukas, Elena, Sophie, James)
- Session management with localStorage persistence, expiry detection, and automatic cleanup
- Protected route guard (`ProtectedRoute`) redirecting unauthenticated users to login
- Persona switcher in the top-right persona bar with dropdown menu
- Demo credentials for all 4 personas with one-click login buttons
- Password hashing simulation for secure credential storage
- Role-to-persona mapping for automatic persona assignment on signup

#### Intelligence Engine
- **QueryInterpreter**: Natural language query parser mapping user input to business domains, query types, keywords, confidence scores, target systems, and persona hints using keyword matching against 6 intelligence clusters
- **OrchestrationEngine**: Multi-system query orchestration simulating parallel queries to SAP, Procore, Salesforce, and Primavera with result aggregation, deduplication, and system contribution tracking
- **CTABubbleEngine**: Contextual follow-up suggestion generator producing 3–4 CTA bubbles based on query results, cluster context, and persona context with priority sorting and deduplication
- **SourceTransparencyEngine**: Source indicator service determining which enterprise systems contributed to each query result with contribution levels (high/medium/low/none), confidence scores, and connection status
- **ActionExecutor**: Simulated action execution service supporting 10 action types (navigate, generate-report, schedule, escalate, update, workflow, recommendation, share, create, export-csv) with localStorage-persisted action log
- **MockDataProvider**: Structured mock data access layer with filtering by domain, query text, system, and persona
- **QueryOrchestrationFacade**: Unified API facade composing all sub-services into a single API surface for UI consumption

#### Query & Result System
- Natural language query input with validation, character count, auto-focus, and placeholder suggestions
- Query execution with loading state, error handling, and result display
- Dynamic result rendering supporting tables, risk signals, forecast models, KPI grids, and generic data
- Responsive result layouts: full tables on desktop, stacked cards on tablet, carousel on mobile
- Source indicator panel showing green dot indicators for each contributing enterprise system
- CTA bubble component rendering 3–4 rounded follow-up query suggestions as clickable bubbles

#### Mock Data
- Project portfolio data with 5 projects, milestones, budgets, and risk levels
- Sales pipeline data with 5 top opportunities, quarterly trends, and lead conversion analysis
- Commercial procurement data with 47 contracts, pending renewals, and vendor performance issues
- Finance cash flow data with monthly forecasts, at-risk receivables, and budget variance analysis
- Workforce planning data with resource allocation across 5 projects and skill distribution
- Knowledge/IP data with 5 lessons learned entries and document assets
- 3 forecast models (revenue, workforce, procurement) with quarterly projections
- 5 cross-functional risk signals spanning multiple intelligence clusters
- 5 action execution result templates with detailed confirmation data
- Dashboard summary with 6 KPIs, 5 recent activity items, and 4 system status entries

#### UI Architecture — 21 Screens (0–20)
- **Screen 0**: Splash / Login page with email/password form and persona quick login buttons
- **Screen 1**: Persona Select / Onboarding page with platform introduction and cluster access overview
- **Screen 2**: Dashboard / Home page with KPI metrics, quick actions, cluster grid, risk alerts, recent activity, and system status
- **Screen 3**: Query Input page with full query interaction, result display, CTA bubbles, source panel, and action buttons
- **Screen 4**: Query Loading page (managed via view state within Query page)
- **Screen 5**: Query Result page (managed via view state within Query page)
- **Screen 6**: CTA Overview page (managed via view state within Query page)
- **Screen 7**: Action Detail page (managed via view state within Query page)
- **Screen 8**: Confirmation page (managed via view state within Query page)
- **Screen 9**: Project & Portfolio Cluster (Lukas flow) with portfolio overview, milestones, resources, risks, and query tabs
- **Screen 10**: Sales & Business Dev Cluster (James flow) with pipeline, lead analysis, forecasts, risks, and query tabs
- **Screen 11**: Commercial & Procurement Cluster (Elena flow) with contracts, spend analysis, vendors, risks, and query tabs
- **Screen 12**: Finance & Cash Flow Cluster (Sophie flow) with cash flow, budget variance, forecasts, risks, and query tabs
- **Screen 13**: Workforce Planning Cluster (Lukas flow, shared with Screen 9)
- **Screen 14**: Knowledge/IP Cluster (shared, accessible via Query page)
- **Screen 15**: SAP System page (Sophie flow, shared with Screen 12)
- **Screen 16**: Procore System page (Lukas flow, shared with Screen 9)
- **Screen 17**: Salesforce System page (James flow, shared with Screen 10)
- **Screen 18**: Primavera System page (Lukas flow, shared with Screen 9)
- **Screen 19**: Settings page (shared with Final Summary)
- **Screen 20**: Audit Log / Final Summary page with session metrics, persona summaries, action log, audit trail, risk signals, and platform capabilities

#### State Engine
- `UIStateContext` managing currentScreen, currentView, persona, loading, error, queryResult, actionResult, actionsTaken, and queryText
- 6 view states: INPUT, LOADING, RESULT, CTA, ACTION, CONFIRMATION
- 10 transition events: QUERY_SUBMIT, QUERY_SUCCESS, QUERY_ERROR, CTA_CLICK, ACTION_EXECUTE, ACTION_SUCCESS, ACTION_ERROR, NAVIGATE, BACK, RESET
- State reducer with transition resolution for deterministic state machine behavior
- localStorage synchronization via SessionManager for screen and view persistence

#### Navigation Engine
- `NavigationContext` with `navigateTo`, `goBack`, `navigateToPersonaHome`, `navigateToPath`, and `getCurrentRoute`
- In-memory navigation history stack with max 50 entries for back navigation support
- Persona-aware navigation with automatic redirect to persona select when persona is required
- Screen configuration mapping for all 21 screens with paths, persona associations, subviews, and flow groups
- 8 flow groups: AUTH, ONBOARDING, LUKAS, ELENA, SOPHIE, JAMES, FINAL, DEMO

#### Responsive Layouts
- `MainLayout` with collapsible sidebar, persona bar, and responsive content area
- `AuthLayout` with centered card layout and gradient background for login/signup screens
- `Sidebar` with intelligence cluster links, system navigation, and persona-specific menu items
- `PersonaBar` with avatar, name, role, dropdown menu for persona switching and logout
- Mobile: sidebar hidden by default, toggled via hamburger menu
- Tablet: sidebar visible but collapsible
- Desktop: sidebar always visible with full navigation

#### Design System
- Glassmorphism card component (`GlassCard`) with 6 variants (default, sm, lg, subtle, solid, outline) and 5 padding sizes
- Gradient background component (`GradientBackground`) with 4 variants (primary, subtle, intense, radial) and 4 overlay patterns (none, dots, grid, noise)
- Animated transition component (`AnimatedTransition`) with 8 animation types (fade, slide-up, slide-down, slide-left, slide-right, scale, scale-up, none) and 3 durations
- Loading spinner component with 5 sizes, optional message, and skeleton loader variant
- Skeleton loader component with 6 variants (card, text, table, list, detail, profile) and 3 sizes
- Data table component with zebra striping, sortable columns, and responsive behavior (table/cards/carousel)
- Forecast chart component with CSS-based bar indicators, trend arrows, confidence bars, and percentage displays
- Risk signal card component with severity color coding, expandable details, affected systems/clusters, and recommended actions
- Intelligence cluster card component with access level badges, sample queries, and navigation
- Cluster grid component with responsive 3/2/1 column layout and staggered entrance animations
- Action button component with loading/success/error states and system badges
- Action confirmation component with undo window, execution details, and proceed/new query options
- Dark theme with gradient backgrounds (#0A1A2F → #142238 → #1E2A44)
- Urbanist font family with system-ui fallback
- Custom Tailwind configuration with glass colors, accent palette, custom spacing, animations, and border radius tokens
- Custom scrollbar styling with glass-themed track and thumb

#### Audit & Logging
- `AuditLogger` service persisting all user actions to localStorage with 15 event types
- Audit trail retrieval, filtering by type/persona/time range, count, and JSON export
- Automatic pruning at 1000 entries maximum
- `ActionExecutor` action log with filtering by type/system/status/persona and JSON export
- Automatic pruning at 500 entries maximum
- Final Summary page with audit trail viewer, action log viewer, and export buttons

#### Persona System
- 4 persona profiles with full metadata: Lukas Müller (Project Director), Elena Rossi (Commercial Manager), Sophie Dubois (Finance Lead), James Carter (Business Development Manager)
- Per-persona cluster access definitions with full/read/none access levels and primary cluster flags
- Per-persona connected systems, screen flows, expertise tags, and demo credentials
- Per-persona query suggestions (8 per persona)
- Per-persona accent colors: Lukas (#3B82F6), Elena (#8B5CF6), Sophie (#EC4899), James (#F59E0B)

#### Testing
- Unit tests for `AuditLogger` covering logEvent, getAuditTrail, clearAuditTrail, filtering, pruning, and corrupted localStorage
- Unit tests for `ActionExecutor` covering executeAction, getActionLog, clearActionLog, filtering, pruning, and concurrent execution
- Unit tests for `AuthService` covering signup, login, logout, credential validation, persona mapping, and corrupted localStorage
- Unit tests for `SessionManager` covering setSession, getSession, clearSession, isSessionValid, updateCurrentScreen, updateCurrentView, and expiry edge cases
- Unit tests for `QueryInterpreter` covering domain mapping, query type classification, keyword extraction, confidence scoring, target system identification, persona hint detection, parameter extraction, and validation
- Unit tests for `OrchestrationEngine` covering orchestrateQuery, orchestrateRawQuery, getClusterSystemMap, getSystemStatus, multi-domain queries, persona filtering, and error handling
- Unit tests for `QueryOrchestrationFacade` covering end-to-end query flow, CTA generation, action execution, source transparency, and concurrent operations
- Vitest configuration with jsdom environment, localStorage mock, matchMedia mock, ResizeObserver mock, and IntersectionObserver mock

#### Infrastructure
- Vite build configuration with React plugin and path aliases
- Tailwind CSS configuration with custom theme extensions
- PostCSS configuration with Tailwind and Autoprefixer
- Vercel deployment configuration with SPA rewrites
- Environment variable template (`.env.example`) with app title, version, mock delay, and audit log toggle
- ESLint configuration for React with hooks and refresh plugins

[1.0.0]: https://github.com/AskDreeso/ask-dreeso-memory/releases/tag/v1.0.0