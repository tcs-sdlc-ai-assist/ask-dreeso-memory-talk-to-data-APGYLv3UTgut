/**
 * Screen configuration mapping for Ask Dreeso Memory
 * Defines all 21 screens (0-20) with their IDs, names, persona associations,
 * available subviews, default view states, and persona flow groupings.
 *
 * @module screenConfig
 * @see SCRUM-7894
 * @see SCRUM-7895
 */

import { SCREEN_IDS, VIEW_STATES, PERSONAS } from '../constants';

/**
 * @typedef {Object} ScreenDefinition
 * @property {number} id - Numeric screen identifier (0-20)
 * @property {string} name - Human-readable screen name
 * @property {string} path - Route path for navigation
 * @property {string|null} persona - Associated persona ID, or null if shared
 * @property {string[]} subviews - Available subview identifiers
 * @property {string} defaultViewState - Default VIEW_STATE when entering the screen
 * @property {string} flowGroup - Flow group this screen belongs to
 * @property {boolean} requiresPersona - Whether a persona must be selected to access
 */

/**
 * Flow group identifiers for organizing screens into logical sequences
 * @type {Object.<string, string>}
 */
export const FLOW_GROUPS = Object.freeze({
  AUTH: 'AUTH',
  ONBOARDING: 'ONBOARDING',
  LUKAS: 'LUKAS',
  ELENA: 'ELENA',
  SOPHIE: 'SOPHIE',
  JAMES: 'JAMES',
  FINAL: 'FINAL',
  DEMO: 'DEMO',
});

/**
 * Complete screen configuration map keyed by screen ID
 * @type {Object.<number, ScreenDefinition>}
 */
export const SCREEN_CONFIG = Object.freeze({
  [SCREEN_IDS.SPLASH]: {
    id: SCREEN_IDS.SPLASH,
    name: 'Splash',
    path: '/',
    persona: null,
    subviews: [],
    defaultViewState: VIEW_STATES.INPUT,
    flowGroup: FLOW_GROUPS.AUTH,
    requiresPersona: false,
  },
  [SCREEN_IDS.PERSONA_SELECT]: {
    id: SCREEN_IDS.PERSONA_SELECT,
    name: 'Persona Select',
    path: '/persona-select',
    persona: null,
    subviews: [],
    defaultViewState: VIEW_STATES.INPUT,
    flowGroup: FLOW_GROUPS.ONBOARDING,
    requiresPersona: false,
  },
  [SCREEN_IDS.DASHBOARD]: {
    id: SCREEN_IDS.DASHBOARD,
    name: 'Dashboard',
    path: '/dashboard',
    persona: null,
    subviews: ['overview', 'clusters', 'systems'],
    defaultViewState: VIEW_STATES.INPUT,
    flowGroup: FLOW_GROUPS.ONBOARDING,
    requiresPersona: true,
  },
  [SCREEN_IDS.QUERY_INPUT]: {
    id: SCREEN_IDS.QUERY_INPUT,
    name: 'Query Input',
    path: '/query',
    persona: null,
    subviews: ['text', 'voice', 'suggestions'],
    defaultViewState: VIEW_STATES.INPUT,
    flowGroup: FLOW_GROUPS.DEMO,
    requiresPersona: true,
  },
  [SCREEN_IDS.QUERY_LOADING]: {
    id: SCREEN_IDS.QUERY_LOADING,
    name: 'Query Loading',
    path: '/query/loading',
    persona: null,
    subviews: ['progress', 'sources'],
    defaultViewState: VIEW_STATES.LOADING,
    flowGroup: FLOW_GROUPS.DEMO,
    requiresPersona: true,
  },
  [SCREEN_IDS.QUERY_RESULT]: {
    id: SCREEN_IDS.QUERY_RESULT,
    name: 'Query Result',
    path: '/query/result',
    persona: null,
    subviews: ['summary', 'details', 'sources', 'actions'],
    defaultViewState: VIEW_STATES.RESULT,
    flowGroup: FLOW_GROUPS.DEMO,
    requiresPersona: true,
  },
  [SCREEN_IDS.CTA_OVERVIEW]: {
    id: SCREEN_IDS.CTA_OVERVIEW,
    name: 'CTA Overview',
    path: '/cta',
    persona: null,
    subviews: ['list', 'priority'],
    defaultViewState: VIEW_STATES.CTA,
    flowGroup: FLOW_GROUPS.DEMO,
    requiresPersona: true,
  },
  [SCREEN_IDS.ACTION_DETAIL]: {
    id: SCREEN_IDS.ACTION_DETAIL,
    name: 'Action Detail',
    path: '/action',
    persona: null,
    subviews: ['detail', 'history', 'related'],
    defaultViewState: VIEW_STATES.ACTION,
    flowGroup: FLOW_GROUPS.DEMO,
    requiresPersona: true,
  },
  [SCREEN_IDS.CONFIRMATION]: {
    id: SCREEN_IDS.CONFIRMATION,
    name: 'Confirmation',
    path: '/confirmation',
    persona: null,
    subviews: ['success', 'next-steps'],
    defaultViewState: VIEW_STATES.CONFIRMATION,
    flowGroup: FLOW_GROUPS.DEMO,
    requiresPersona: true,
  },
  [SCREEN_IDS.CLUSTER_PROJECT]: {
    id: SCREEN_IDS.CLUSTER_PROJECT,
    name: 'Project & Portfolio Cluster',
    path: '/cluster/project',
    persona: PERSONAS.LUKAS.id,
    subviews: ['overview', 'timeline', 'milestones'],
    defaultViewState: VIEW_STATES.INPUT,
    flowGroup: FLOW_GROUPS.LUKAS,
    requiresPersona: true,
  },
  [SCREEN_IDS.CLUSTER_SALES]: {
    id: SCREEN_IDS.CLUSTER_SALES,
    name: 'Sales & Business Dev Cluster',
    path: '/cluster/sales',
    persona: PERSONAS.JAMES.id,
    subviews: ['pipeline', 'leads', 'opportunities'],
    defaultViewState: VIEW_STATES.INPUT,
    flowGroup: FLOW_GROUPS.JAMES,
    requiresPersona: true,
  },
  [SCREEN_IDS.CLUSTER_COMMERCIAL]: {
    id: SCREEN_IDS.CLUSTER_COMMERCIAL,
    name: 'Commercial & Procurement Cluster',
    path: '/cluster/commercial',
    persona: PERSONAS.ELENA.id,
    subviews: ['contracts', 'procurement', 'vendors'],
    defaultViewState: VIEW_STATES.INPUT,
    flowGroup: FLOW_GROUPS.ELENA,
    requiresPersona: true,
  },
  [SCREEN_IDS.CLUSTER_FINANCE]: {
    id: SCREEN_IDS.CLUSTER_FINANCE,
    name: 'Finance & Cash Flow Cluster',
    path: '/cluster/finance',
    persona: PERSONAS.SOPHIE.id,
    subviews: ['budgets', 'forecasts', 'cashflow'],
    defaultViewState: VIEW_STATES.INPUT,
    flowGroup: FLOW_GROUPS.SOPHIE,
    requiresPersona: true,
  },
  [SCREEN_IDS.CLUSTER_WORKFORCE]: {
    id: SCREEN_IDS.CLUSTER_WORKFORCE,
    name: 'Workforce Planning Cluster',
    path: '/cluster/workforce',
    persona: PERSONAS.LUKAS.id,
    subviews: ['allocation', 'capacity', 'teams'],
    defaultViewState: VIEW_STATES.INPUT,
    flowGroup: FLOW_GROUPS.LUKAS,
    requiresPersona: true,
  },
  [SCREEN_IDS.CLUSTER_KNOWLEDGE]: {
    id: SCREEN_IDS.CLUSTER_KNOWLEDGE,
    name: 'Knowledge/IP Cluster',
    path: '/cluster/knowledge',
    persona: null,
    subviews: ['lessons', 'documents', 'assets'],
    defaultViewState: VIEW_STATES.INPUT,
    flowGroup: FLOW_GROUPS.DEMO,
    requiresPersona: true,
  },
  [SCREEN_IDS.SYSTEM_SAP]: {
    id: SCREEN_IDS.SYSTEM_SAP,
    name: 'SAP System',
    path: '/system/sap',
    persona: PERSONAS.SOPHIE.id,
    subviews: ['overview', 'data', 'status'],
    defaultViewState: VIEW_STATES.INPUT,
    flowGroup: FLOW_GROUPS.SOPHIE,
    requiresPersona: true,
  },
  [SCREEN_IDS.SYSTEM_PROCORE]: {
    id: SCREEN_IDS.SYSTEM_PROCORE,
    name: 'Procore System',
    path: '/system/procore',
    persona: PERSONAS.LUKAS.id,
    subviews: ['overview', 'data', 'status'],
    defaultViewState: VIEW_STATES.INPUT,
    flowGroup: FLOW_GROUPS.LUKAS,
    requiresPersona: true,
  },
  [SCREEN_IDS.SYSTEM_SALESFORCE]: {
    id: SCREEN_IDS.SYSTEM_SALESFORCE,
    name: 'Salesforce System',
    path: '/system/salesforce',
    persona: PERSONAS.JAMES.id,
    subviews: ['overview', 'data', 'status'],
    defaultViewState: VIEW_STATES.INPUT,
    flowGroup: FLOW_GROUPS.JAMES,
    requiresPersona: true,
  },
  [SCREEN_IDS.SYSTEM_PRIMAVERA]: {
    id: SCREEN_IDS.SYSTEM_PRIMAVERA,
    name: 'Primavera System',
    path: '/system/primavera',
    persona: PERSONAS.LUKAS.id,
    subviews: ['overview', 'data', 'status'],
    defaultViewState: VIEW_STATES.INPUT,
    flowGroup: FLOW_GROUPS.LUKAS,
    requiresPersona: true,
  },
  [SCREEN_IDS.SETTINGS]: {
    id: SCREEN_IDS.SETTINGS,
    name: 'Settings',
    path: '/settings',
    persona: null,
    subviews: ['general', 'preferences', 'integrations'],
    defaultViewState: VIEW_STATES.INPUT,
    flowGroup: FLOW_GROUPS.FINAL,
    requiresPersona: false,
  },
  [SCREEN_IDS.AUDIT_LOG]: {
    id: SCREEN_IDS.AUDIT_LOG,
    name: 'Audit Log',
    path: '/audit-log',
    persona: null,
    subviews: ['list', 'detail', 'export'],
    defaultViewState: VIEW_STATES.INPUT,
    flowGroup: FLOW_GROUPS.FINAL,
    requiresPersona: false,
  },
});

/**
 * Persona flow definitions mapping each flow group to its ordered screen sequence
 * @type {Object.<string, number[]>}
 */
export const PERSONA_FLOWS = Object.freeze({
  [FLOW_GROUPS.AUTH]: [
    SCREEN_IDS.SPLASH,
  ],
  [FLOW_GROUPS.ONBOARDING]: [
    SCREEN_IDS.PERSONA_SELECT,
    SCREEN_IDS.DASHBOARD,
  ],
  [FLOW_GROUPS.LUKAS]: [
    SCREEN_IDS.CLUSTER_PROJECT,
    SCREEN_IDS.CLUSTER_WORKFORCE,
    SCREEN_IDS.SYSTEM_PROCORE,
    SCREEN_IDS.SYSTEM_PRIMAVERA,
  ],
  [FLOW_GROUPS.ELENA]: [
    SCREEN_IDS.CLUSTER_COMMERCIAL,
  ],
  [FLOW_GROUPS.SOPHIE]: [
    SCREEN_IDS.CLUSTER_FINANCE,
    SCREEN_IDS.SYSTEM_SAP,
  ],
  [FLOW_GROUPS.JAMES]: [
    SCREEN_IDS.CLUSTER_SALES,
    SCREEN_IDS.SYSTEM_SALESFORCE,
  ],
  [FLOW_GROUPS.FINAL]: [
    SCREEN_IDS.SETTINGS,
    SCREEN_IDS.AUDIT_LOG,
  ],
  [FLOW_GROUPS.DEMO]: [
    SCREEN_IDS.QUERY_INPUT,
    SCREEN_IDS.QUERY_LOADING,
    SCREEN_IDS.QUERY_RESULT,
    SCREEN_IDS.CTA_OVERVIEW,
    SCREEN_IDS.ACTION_DETAIL,
    SCREEN_IDS.CONFIRMATION,
    SCREEN_IDS.CLUSTER_KNOWLEDGE,
  ],
});

/**
 * Returns the screen configuration for a given screen ID
 * @param {number} screenId - The numeric screen identifier
 * @returns {ScreenDefinition|undefined} The screen configuration or undefined if not found
 */
export function getScreenConfig(screenId) {
  return SCREEN_CONFIG[screenId];
}

/**
 * Returns all screens associated with a given persona ID
 * @param {string} personaId - The persona identifier (e.g., 'lukas')
 * @returns {ScreenDefinition[]} Array of screen configurations for the persona
 */
export function getScreensByPersona(personaId) {
  return Object.values(SCREEN_CONFIG).filter(
    (screen) => screen.persona === personaId
  );
}

/**
 * Returns all screens belonging to a given flow group
 * @param {string} flowGroup - The flow group identifier
 * @returns {ScreenDefinition[]} Array of screen configurations in the flow group
 */
export function getScreensByFlowGroup(flowGroup) {
  const screenIds = PERSONA_FLOWS[flowGroup];
  if (!screenIds) {
    return [];
  }
  return screenIds.map((id) => SCREEN_CONFIG[id]).filter(Boolean);
}

/**
 * Returns the ordered screen IDs for a given persona's flow
 * @param {string} personaId - The persona identifier (e.g., 'lukas')
 * @returns {number[]} Ordered array of screen IDs for the persona's flow
 */
export function getFlowForPersona(personaId) {
  const personaToFlow = {
    [PERSONAS.LUKAS.id]: FLOW_GROUPS.LUKAS,
    [PERSONAS.ELENA.id]: FLOW_GROUPS.ELENA,
    [PERSONAS.SOPHIE.id]: FLOW_GROUPS.SOPHIE,
    [PERSONAS.JAMES.id]: FLOW_GROUPS.JAMES,
  };

  const flowGroup = personaToFlow[personaId];
  if (!flowGroup) {
    return [];
  }
  return PERSONA_FLOWS[flowGroup] || [];
}

/**
 * Checks whether a screen requires a persona to be selected
 * @param {number} screenId - The numeric screen identifier
 * @returns {boolean} True if the screen requires a persona
 */
export function screenRequiresPersona(screenId) {
  const config = SCREEN_CONFIG[screenId];
  return config ? config.requiresPersona : false;
}

/**
 * Returns the default view state for a given screen
 * @param {number} screenId - The numeric screen identifier
 * @returns {string} The default view state, or VIEW_STATES.INPUT as fallback
 */
export function getDefaultViewState(screenId) {
  const config = SCREEN_CONFIG[screenId];
  return config ? config.defaultViewState : VIEW_STATES.INPUT;
}

/**
 * Returns the route path for a given screen ID
 * @param {number} screenId - The numeric screen identifier
 * @returns {string} The route path, or '/' as fallback
 */
export function getScreenPath(screenId) {
  const config = SCREEN_CONFIG[screenId];
  return config ? config.path : '/';
}

/**
 * Returns the screen ID for a given route path
 * @param {string} path - The route path
 * @returns {number|null} The screen ID, or null if not found
 */
export function getScreenIdByPath(path) {
  const entry = Object.values(SCREEN_CONFIG).find(
    (screen) => screen.path === path
  );
  return entry ? entry.id : null;
}