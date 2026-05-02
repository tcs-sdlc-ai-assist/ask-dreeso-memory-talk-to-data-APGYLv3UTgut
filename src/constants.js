/**
 * Application-wide constants and configuration values
 * for Ask Dreeso Memory
 */

/**
 * @typedef {Object} Persona
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} role - Job title / role
 * @property {string} avatar - Avatar initial(s)
 * @property {string} color - Accent color for the persona
 * @property {string} department - Department the persona belongs to
 */

/** @type {Object.<string, Persona>} */
export const PERSONAS = Object.freeze({
  LUKAS: {
    id: 'lukas',
    name: 'Lukas',
    role: 'Project Director',
    avatar: 'L',
    color: '#3B82F6',
    department: 'Project Management',
  },
  ELENA: {
    id: 'elena',
    name: 'Elena',
    role: 'Commercial Manager',
    avatar: 'E',
    color: '#8B5CF6',
    department: 'Commercial',
  },
  SOPHIE: {
    id: 'sophie',
    name: 'Sophie',
    role: 'Finance Lead',
    avatar: 'S',
    color: '#EC4899',
    department: 'Finance',
  },
  JAMES: {
    id: 'james',
    name: 'James',
    role: 'Business Development Manager',
    avatar: 'J',
    color: '#F59E0B',
    department: 'Sales',
  },
});

/**
 * Screen identifiers (0–20) used for navigation and state tracking
 * @type {Object.<string, number>}
 */
export const SCREEN_IDS = Object.freeze({
  SPLASH: 0,
  PERSONA_SELECT: 1,
  DASHBOARD: 2,
  QUERY_INPUT: 3,
  QUERY_LOADING: 4,
  QUERY_RESULT: 5,
  CTA_OVERVIEW: 6,
  ACTION_DETAIL: 7,
  CONFIRMATION: 8,
  CLUSTER_PROJECT: 9,
  CLUSTER_SALES: 10,
  CLUSTER_COMMERCIAL: 11,
  CLUSTER_FINANCE: 12,
  CLUSTER_WORKFORCE: 13,
  CLUSTER_KNOWLEDGE: 14,
  SYSTEM_SAP: 15,
  SYSTEM_PROCORE: 16,
  SYSTEM_SALESFORCE: 17,
  SYSTEM_PRIMAVERA: 18,
  SETTINGS: 19,
  AUDIT_LOG: 20,
});

/**
 * View state identifiers for screen flow management
 * @type {Object.<string, string>}
 */
export const VIEW_STATES = Object.freeze({
  INPUT: 'INPUT',
  LOADING: 'LOADING',
  RESULT: 'RESULT',
  CTA: 'CTA',
  ACTION: 'ACTION',
  CONFIRMATION: 'CONFIRMATION',
});

/**
 * @typedef {Object} IntelligenceCluster
 * @property {string} id - Unique identifier
 * @property {string} label - Display label
 * @property {string} description - Short description
 * @property {string} icon - Emoji or icon identifier
 * @property {string} color - Accent color
 */

/** @type {Object.<string, IntelligenceCluster>} */
export const INTELLIGENCE_CLUSTERS = Object.freeze({
  PROJECT_PORTFOLIO: {
    id: 'project-portfolio',
    label: 'Project & Portfolio',
    description: 'Project timelines, milestones, and portfolio health',
    icon: '📊',
    color: '#3B82F6',
  },
  SALES_BUSINESS_DEV: {
    id: 'sales-business-dev',
    label: 'Sales & Business Development',
    description: 'Pipeline, leads, and opportunity tracking',
    icon: '📈',
    color: '#F59E0B',
  },
  COMMERCIAL_PROCUREMENT: {
    id: 'commercial-procurement',
    label: 'Commercial & Procurement',
    description: 'Contracts, procurement, and vendor management',
    icon: '📋',
    color: '#8B5CF6',
  },
  FINANCE_CASH_FLOW: {
    id: 'finance-cash-flow',
    label: 'Finance & Cash Flow',
    description: 'Budgets, forecasts, and cash flow analysis',
    icon: '💰',
    color: '#10B981',
  },
  WORKFORCE_PLANNING: {
    id: 'workforce-planning',
    label: 'Workforce Planning',
    description: 'Resource allocation, capacity, and team planning',
    icon: '👥',
    color: '#EC4899',
  },
  KNOWLEDGE_IP: {
    id: 'knowledge-ip',
    label: 'Knowledge/IP',
    description: 'Institutional knowledge, lessons learned, and IP assets',
    icon: '🧠',
    color: '#06B6D4',
  },
});

/**
 * @typedef {Object} System
 * @property {string} id - Unique identifier
 * @property {string} label - Display label
 * @property {string} description - Short description
 * @property {string} color - Brand / accent color
 */

/** @type {Object.<string, System>} */
export const SYSTEMS = Object.freeze({
  SAP: {
    id: 'sap',
    label: 'SAP',
    description: 'Enterprise resource planning and financials',
    color: '#0FAAFF',
  },
  PROCORE: {
    id: 'procore',
    label: 'Procore',
    description: 'Construction project management platform',
    color: '#F47E20',
  },
  SALESFORCE: {
    id: 'salesforce',
    label: 'Salesforce',
    description: 'CRM and sales pipeline management',
    color: '#00A1E0',
  },
  PRIMAVERA: {
    id: 'primavera',
    label: 'Primavera',
    description: 'Project scheduling and portfolio management',
    color: '#E21F26',
  },
});

/**
 * Color palette aligned with the application theme
 * @type {Object.<string, string>}
 */
export const COLOR_PALETTE = Object.freeze({
  BACKGROUND_FROM: '#0A1A2F',
  BACKGROUND_VIA: '#142238',
  BACKGROUND_TO: '#1E2A44',
  ACCENT_BLUE: '#3B82F6',
  ACCENT_CYAN: '#06B6D4',
  ACCENT_PURPLE: '#8B5CF6',
  ACCENT_PINK: '#EC4899',
  ACCENT_TEAL: '#14B8A6',
  ACCENT_GOLD: '#F59E0B',
  TEXT_PRIMARY: '#E8EDF5',
  TEXT_SECONDARY: '#A3B7D7',
  TEXT_MUTED: '#7593C3',
  GLASS_LIGHT: 'rgba(255, 255, 255, 0.08)',
  GLASS_MEDIUM: 'rgba(255, 255, 255, 0.12)',
  GLASS_HEAVY: 'rgba(255, 255, 255, 0.18)',
  GLASS_BORDER: 'rgba(255, 255, 255, 0.1)',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6',
});

/**
 * Animation duration values in milliseconds
 * @type {Object.<string, number>}
 */
export const ANIMATION_DURATIONS = Object.freeze({
  INSTANT: 100,
  FAST: 200,
  NORMAL: 300,
  MODERATE: 400,
  SLOW: 600,
  VERY_SLOW: 1000,
  SHIMMER: 2000,
});

/**
 * Keys used for localStorage persistence
 * @type {Object.<string, string>}
 */
export const LOCAL_STORAGE_KEYS = Object.freeze({
  SELECTED_PERSONA: 'ask-dreeso-selected-persona',
  QUERY_HISTORY: 'ask-dreeso-query-history',
  AUDIT_LOG: 'ask-dreeso-audit-log',
  USER_PREFERENCES: 'ask-dreeso-user-preferences',
  LAST_SCREEN: 'ask-dreeso-last-screen',
  THEME: 'ask-dreeso-theme',
});