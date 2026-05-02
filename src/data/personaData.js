/**
 * Persona profile and demo credential data for Ask Dreeso Memory
 * Contains full persona definitions including profiles, default queries,
 * cluster access, screen flows, and demo credentials for quick login.
 *
 * @module personaData
 * @see SCRUM-7900
 * @see SCRUM-7898
 * @see SCRUM-7899
 */

import { PERSONAS, SCREEN_IDS, INTELLIGENCE_CLUSTERS, SYSTEMS } from '../constants';
import { FLOW_GROUPS, PERSONA_FLOWS } from '../config/screenConfig';
import { QUERY_SUGGESTIONS } from './mockData';

/**
 * @typedef {Object} DemoCredential
 * @property {string} username - Demo login username
 * @property {string} password - Demo login password
 * @property {string} displayLabel - Label shown on quick-login button
 */

/**
 * @typedef {Object} ClusterAccess
 * @property {string} clusterId - Intelligence cluster identifier
 * @property {string} label - Display label for the cluster
 * @property {string} accessLevel - Access level ('full', 'read', 'none')
 * @property {boolean} isPrimary - Whether this is a primary cluster for the persona
 */

/**
 * @typedef {Object} PersonaProfile
 * @property {string} id - Unique persona identifier
 * @property {string} name - Full display name
 * @property {string} role - Job title / role
 * @property {string} department - Department the persona belongs to
 * @property {string} avatar - Avatar initial(s)
 * @property {string} color - Accent color for the persona
 * @property {string} bio - Short biography / description
 * @property {string} email - Demo email address
 * @property {string} location - Office location
 * @property {string[]} expertise - Areas of expertise
 * @property {string[]} defaultQueries - Default query suggestions
 * @property {ClusterAccess[]} clusterAccess - Intelligence cluster access definitions
 * @property {number[]} screenFlow - Ordered screen IDs for the persona's flow
 * @property {string[]} connectedSystems - System IDs the persona has access to
 * @property {DemoCredential} demoCredential - Demo login credentials
 * @property {string} flowGroup - Flow group identifier
 */

/**
 * Full persona profile for Lukas Müller - Project Director
 * @type {PersonaProfile}
 */
export const LUKAS_PROFILE = Object.freeze({
  id: PERSONAS.LUKAS.id,
  name: 'Lukas Müller',
  role: PERSONAS.LUKAS.role,
  department: PERSONAS.LUKAS.department,
  avatar: PERSONAS.LUKAS.avatar,
  color: PERSONAS.LUKAS.color,
  bio: 'Experienced Project Director overseeing a portfolio of large-scale infrastructure and commercial construction projects across Germany. Focused on schedule adherence, resource optimization, and cross-project risk management.',
  email: 'lukas.mueller@dreeso.demo',
  location: 'Munich, Germany',
  expertise: [
    'Portfolio Management',
    'Schedule Optimization',
    'Resource Allocation',
    'Risk Mitigation',
    'Stakeholder Communication',
    'Infrastructure Projects',
  ],
  defaultQueries: QUERY_SUGGESTIONS[PERSONAS.LUKAS.id] || [],
  clusterAccess: [
    {
      clusterId: INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id,
      label: INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.label,
      accessLevel: 'full',
      isPrimary: true,
    },
    {
      clusterId: INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id,
      label: INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.label,
      accessLevel: 'full',
      isPrimary: true,
    },
    {
      clusterId: INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id,
      label: INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.label,
      accessLevel: 'read',
      isPrimary: false,
    },
    {
      clusterId: INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id,
      label: INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.label,
      accessLevel: 'read',
      isPrimary: false,
    },
    {
      clusterId: INTELLIGENCE_CLUSTERS.KNOWLEDGE_IP.id,
      label: INTELLIGENCE_CLUSTERS.KNOWLEDGE_IP.label,
      accessLevel: 'full',
      isPrimary: false,
    },
    {
      clusterId: INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id,
      label: INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.label,
      accessLevel: 'none',
      isPrimary: false,
    },
  ],
  screenFlow: [
    SCREEN_IDS.PERSONA_SELECT,
    SCREEN_IDS.DASHBOARD,
    ...PERSONA_FLOWS[FLOW_GROUPS.LUKAS],
    SCREEN_IDS.QUERY_INPUT,
    SCREEN_IDS.QUERY_LOADING,
    SCREEN_IDS.QUERY_RESULT,
    SCREEN_IDS.CTA_OVERVIEW,
    SCREEN_IDS.ACTION_DETAIL,
    SCREEN_IDS.CONFIRMATION,
    SCREEN_IDS.CLUSTER_KNOWLEDGE,
    SCREEN_IDS.SETTINGS,
  ],
  connectedSystems: [
    SYSTEMS.PROCORE.id,
    SYSTEMS.PRIMAVERA.id,
    SYSTEMS.SAP.id,
  ],
  demoCredential: {
    username: 'lukas.mueller',
    password: 'demo2024',
    displayLabel: 'Login as Lukas',
  },
  flowGroup: FLOW_GROUPS.LUKAS,
});

/**
 * Full persona profile for Elena Rossi - Senior QS / Commercial Manager
 * @type {PersonaProfile}
 */
export const ELENA_PROFILE = Object.freeze({
  id: PERSONAS.ELENA.id,
  name: 'Elena Rossi',
  role: PERSONAS.ELENA.role,
  department: PERSONAS.ELENA.department,
  avatar: PERSONAS.ELENA.avatar,
  color: PERSONAS.ELENA.color,
  bio: 'Senior Commercial Manager specializing in contract administration, procurement strategy, and vendor performance management. Ensures commercial compliance and cost efficiency across all active projects.',
  email: 'elena.rossi@dreeso.demo',
  location: 'Berlin, Germany',
  expertise: [
    'Contract Management',
    'Procurement Strategy',
    'Vendor Relations',
    'Cost Control',
    'Commercial Compliance',
    'Risk Assessment',
  ],
  defaultQueries: QUERY_SUGGESTIONS[PERSONAS.ELENA.id] || [],
  clusterAccess: [
    {
      clusterId: INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id,
      label: INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.label,
      accessLevel: 'full',
      isPrimary: true,
    },
    {
      clusterId: INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id,
      label: INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.label,
      accessLevel: 'read',
      isPrimary: false,
    },
    {
      clusterId: INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id,
      label: INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.label,
      accessLevel: 'read',
      isPrimary: false,
    },
    {
      clusterId: INTELLIGENCE_CLUSTERS.KNOWLEDGE_IP.id,
      label: INTELLIGENCE_CLUSTERS.KNOWLEDGE_IP.label,
      accessLevel: 'full',
      isPrimary: false,
    },
    {
      clusterId: INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id,
      label: INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.label,
      accessLevel: 'none',
      isPrimary: false,
    },
    {
      clusterId: INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id,
      label: INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.label,
      accessLevel: 'none',
      isPrimary: false,
    },
  ],
  screenFlow: [
    SCREEN_IDS.PERSONA_SELECT,
    SCREEN_IDS.DASHBOARD,
    ...PERSONA_FLOWS[FLOW_GROUPS.ELENA],
    SCREEN_IDS.QUERY_INPUT,
    SCREEN_IDS.QUERY_LOADING,
    SCREEN_IDS.QUERY_RESULT,
    SCREEN_IDS.CTA_OVERVIEW,
    SCREEN_IDS.ACTION_DETAIL,
    SCREEN_IDS.CONFIRMATION,
    SCREEN_IDS.CLUSTER_KNOWLEDGE,
    SCREEN_IDS.SETTINGS,
  ],
  connectedSystems: [
    SYSTEMS.SAP.id,
    SYSTEMS.PROCORE.id,
  ],
  demoCredential: {
    username: 'elena.rossi',
    password: 'demo2024',
    displayLabel: 'Login as Elena',
  },
  flowGroup: FLOW_GROUPS.ELENA,
});

/**
 * Full persona profile for Sophie Dubois - Finance Lead / Project Manager
 * @type {PersonaProfile}
 */
export const SOPHIE_PROFILE = Object.freeze({
  id: PERSONAS.SOPHIE.id,
  name: 'Sophie Dubois',
  role: PERSONAS.SOPHIE.role,
  department: PERSONAS.SOPHIE.department,
  avatar: PERSONAS.SOPHIE.avatar,
  color: PERSONAS.SOPHIE.color,
  bio: 'Finance Lead responsible for budgeting, cash flow forecasting, and financial reporting across the project portfolio. Drives financial transparency and ensures alignment between project spend and organizational targets.',
  email: 'sophie.dubois@dreeso.demo',
  location: 'Frankfurt, Germany',
  expertise: [
    'Financial Planning',
    'Cash Flow Management',
    'Budget Analysis',
    'Revenue Forecasting',
    'Cost Reporting',
    'Financial Risk Management',
  ],
  defaultQueries: QUERY_SUGGESTIONS[PERSONAS.SOPHIE.id] || [],
  clusterAccess: [
    {
      clusterId: INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id,
      label: INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.label,
      accessLevel: 'full',
      isPrimary: true,
    },
    {
      clusterId: INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id,
      label: INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.label,
      accessLevel: 'read',
      isPrimary: false,
    },
    {
      clusterId: INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id,
      label: INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.label,
      accessLevel: 'read',
      isPrimary: false,
    },
    {
      clusterId: INTELLIGENCE_CLUSTERS.KNOWLEDGE_IP.id,
      label: INTELLIGENCE_CLUSTERS.KNOWLEDGE_IP.label,
      accessLevel: 'read',
      isPrimary: false,
    },
    {
      clusterId: INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id,
      label: INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.label,
      accessLevel: 'none',
      isPrimary: false,
    },
    {
      clusterId: INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id,
      label: INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.label,
      accessLevel: 'read',
      isPrimary: false,
    },
  ],
  screenFlow: [
    SCREEN_IDS.PERSONA_SELECT,
    SCREEN_IDS.DASHBOARD,
    ...PERSONA_FLOWS[FLOW_GROUPS.SOPHIE],
    SCREEN_IDS.QUERY_INPUT,
    SCREEN_IDS.QUERY_LOADING,
    SCREEN_IDS.QUERY_RESULT,
    SCREEN_IDS.CTA_OVERVIEW,
    SCREEN_IDS.ACTION_DETAIL,
    SCREEN_IDS.CONFIRMATION,
    SCREEN_IDS.CLUSTER_KNOWLEDGE,
    SCREEN_IDS.SETTINGS,
  ],
  connectedSystems: [
    SYSTEMS.SAP.id,
    SYSTEMS.SALESFORCE.id,
  ],
  demoCredential: {
    username: 'sophie.dubois',
    password: 'demo2024',
    displayLabel: 'Login as Sophie',
  },
  flowGroup: FLOW_GROUPS.SOPHIE,
});

/**
 * Full persona profile for James Carter - Business Development Manager / Sales Director
 * @type {PersonaProfile}
 */
export const JAMES_PROFILE = Object.freeze({
  id: PERSONAS.JAMES.id,
  name: 'James Carter',
  role: PERSONAS.JAMES.role,
  department: PERSONAS.JAMES.department,
  avatar: PERSONAS.JAMES.avatar,
  color: PERSONAS.JAMES.color,
  bio: 'Business Development Manager driving sales pipeline growth and client relationship management. Focuses on identifying new opportunities, competitive positioning, and converting leads into long-term partnerships.',
  email: 'james.carter@dreeso.demo',
  location: 'Hamburg, Germany',
  expertise: [
    'Business Development',
    'Pipeline Management',
    'Client Relations',
    'Competitive Analysis',
    'Lead Generation',
    'Strategic Partnerships',
  ],
  defaultQueries: QUERY_SUGGESTIONS[PERSONAS.JAMES.id] || [],
  clusterAccess: [
    {
      clusterId: INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id,
      label: INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.label,
      accessLevel: 'full',
      isPrimary: true,
    },
    {
      clusterId: INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id,
      label: INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.label,
      accessLevel: 'read',
      isPrimary: false,
    },
    {
      clusterId: INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id,
      label: INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.label,
      accessLevel: 'read',
      isPrimary: false,
    },
    {
      clusterId: INTELLIGENCE_CLUSTERS.KNOWLEDGE_IP.id,
      label: INTELLIGENCE_CLUSTERS.KNOWLEDGE_IP.label,
      accessLevel: 'read',
      isPrimary: false,
    },
    {
      clusterId: INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id,
      label: INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.label,
      accessLevel: 'none',
      isPrimary: false,
    },
    {
      clusterId: INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id,
      label: INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.label,
      accessLevel: 'none',
      isPrimary: false,
    },
  ],
  screenFlow: [
    SCREEN_IDS.PERSONA_SELECT,
    SCREEN_IDS.DASHBOARD,
    ...PERSONA_FLOWS[FLOW_GROUPS.JAMES],
    SCREEN_IDS.QUERY_INPUT,
    SCREEN_IDS.QUERY_LOADING,
    SCREEN_IDS.QUERY_RESULT,
    SCREEN_IDS.CTA_OVERVIEW,
    SCREEN_IDS.ACTION_DETAIL,
    SCREEN_IDS.CONFIRMATION,
    SCREEN_IDS.CLUSTER_KNOWLEDGE,
    SCREEN_IDS.SETTINGS,
  ],
  connectedSystems: [
    SYSTEMS.SALESFORCE.id,
  ],
  demoCredential: {
    username: 'james.carter',
    password: 'demo2024',
    displayLabel: 'Login as James',
  },
  flowGroup: FLOW_GROUPS.JAMES,
});

/**
 * All persona profiles indexed by persona ID
 * @type {Object.<string, PersonaProfile>}
 */
export const PERSONA_PROFILES = Object.freeze({
  [PERSONAS.LUKAS.id]: LUKAS_PROFILE,
  [PERSONAS.ELENA.id]: ELENA_PROFILE,
  [PERSONAS.SOPHIE.id]: SOPHIE_PROFILE,
  [PERSONAS.JAMES.id]: JAMES_PROFILE,
});

/**
 * All demo credentials for quick login
 * @type {DemoCredential[]}
 */
export const DEMO_CREDENTIALS = Object.freeze([
  LUKAS_PROFILE.demoCredential,
  ELENA_PROFILE.demoCredential,
  SOPHIE_PROFILE.demoCredential,
  JAMES_PROFILE.demoCredential,
]);

/**
 * Returns the full persona profile for a given persona ID
 * @param {string} personaId - The persona identifier (e.g., 'lukas')
 * @returns {PersonaProfile|undefined} The persona profile or undefined if not found
 */
export function getPersonaProfile(personaId) {
  return PERSONA_PROFILES[personaId];
}

/**
 * Returns all persona profiles as an array
 * @returns {PersonaProfile[]} Array of all persona profiles
 */
export function getAllPersonaProfiles() {
  return Object.values(PERSONA_PROFILES);
}

/**
 * Returns the demo credential for a given persona ID
 * @param {string} personaId - The persona identifier
 * @returns {DemoCredential|undefined} The demo credential or undefined if not found
 */
export function getDemoCredential(personaId) {
  const profile = PERSONA_PROFILES[personaId];
  return profile ? profile.demoCredential : undefined;
}

/**
 * Returns the cluster access list for a given persona ID
 * @param {string} personaId - The persona identifier
 * @returns {ClusterAccess[]} Array of cluster access definitions
 */
export function getClusterAccess(personaId) {
  const profile = PERSONA_PROFILES[personaId];
  return profile ? profile.clusterAccess : [];
}

/**
 * Returns the primary clusters for a given persona ID
 * @param {string} personaId - The persona identifier
 * @returns {ClusterAccess[]} Array of primary cluster access definitions
 */
export function getPrimaryClusters(personaId) {
  return getClusterAccess(personaId).filter((cluster) => cluster.isPrimary);
}

/**
 * Returns the accessible clusters (full or read access) for a given persona ID
 * @param {string} personaId - The persona identifier
 * @returns {ClusterAccess[]} Array of accessible cluster definitions
 */
export function getAccessibleClusters(personaId) {
  return getClusterAccess(personaId).filter(
    (cluster) => cluster.accessLevel === 'full' || cluster.accessLevel === 'read'
  );
}

/**
 * Returns the screen flow for a given persona ID
 * @param {string} personaId - The persona identifier
 * @returns {number[]} Ordered array of screen IDs for the persona's flow
 */
export function getPersonaScreenFlow(personaId) {
  const profile = PERSONA_PROFILES[personaId];
  return profile ? profile.screenFlow : [];
}

/**
 * Returns the connected system IDs for a given persona ID
 * @param {string} personaId - The persona identifier
 * @returns {string[]} Array of connected system IDs
 */
export function getConnectedSystems(personaId) {
  const profile = PERSONA_PROFILES[personaId];
  return profile ? profile.connectedSystems : [];
}

/**
 * Returns the default queries for a given persona ID
 * @param {string} personaId - The persona identifier
 * @returns {string[]} Array of default query strings
 */
export function getDefaultQueries(personaId) {
  const profile = PERSONA_PROFILES[personaId];
  return profile ? profile.defaultQueries : [];
}

/**
 * Checks whether a persona has access to a specific cluster
 * @param {string} personaId - The persona identifier
 * @param {string} clusterId - The intelligence cluster identifier
 * @returns {boolean} True if the persona has full or read access
 */
export function hasClusterAccess(personaId, clusterId) {
  const access = getClusterAccess(personaId).find(
    (cluster) => cluster.clusterId === clusterId
  );
  return access ? access.accessLevel !== 'none' : false;
}

/**
 * Checks whether a persona has full access to a specific cluster
 * @param {string} personaId - The persona identifier
 * @param {string} clusterId - The intelligence cluster identifier
 * @returns {boolean} True if the persona has full access
 */
export function hasFullClusterAccess(personaId, clusterId) {
  const access = getClusterAccess(personaId).find(
    (cluster) => cluster.clusterId === clusterId
  );
  return access ? access.accessLevel === 'full' : false;
}

/**
 * Validates demo credentials against stored credentials
 * @param {string} username - The username to validate
 * @param {string} password - The password to validate
 * @returns {PersonaProfile|null} The matching persona profile or null if invalid
 */
export function validateDemoCredentials(username, password) {
  const profiles = getAllPersonaProfiles();
  const match = profiles.find(
    (profile) =>
      profile.demoCredential.username === username &&
      profile.demoCredential.password === password
  );
  return match || null;
}

/**
 * Returns the persona profile matching a demo username
 * @param {string} username - The demo username
 * @returns {PersonaProfile|null} The matching persona profile or null if not found
 */
export function getPersonaByUsername(username) {
  const profiles = getAllPersonaProfiles();
  const match = profiles.find(
    (profile) => profile.demoCredential.username === username
  );
  return match || null;
}