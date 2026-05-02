/**
 * Mock data access and filtering service for Ask Dreeso Memory.
 * Wraps mockData.js to provide structured access to mock data
 * with filtering, search, and domain-based lookup capabilities.
 *
 * @module MockDataProvider
 * @see SCRUM-7888
 * @see SCRUM-7886
 * @see SCRUM-7887
 */

import {
  PROJECT_PORTFOLIO_DATA,
  SALES_PIPELINE_DATA,
  PROCUREMENT_DATA,
  FINANCE_CASH_FLOW_DATA,
  WORKFORCE_DATA,
  KNOWLEDGE_IP_DATA,
  MOCK_DATA_BY_CLUSTER,
  MOCK_DATA_BY_PERSONA,
  DASHBOARD_SUMMARY,
  FORECAST_MODELS,
  RISK_SIGNALS,
  ACTION_RESULTS,
  QUERY_SUGGESTIONS,
  findByQueryPattern,
  findByCluster,
  findByPersona,
  getActionResult,
  getRiskSignals,
  getQuerySuggestions,
  getForecastByType,
  getAllMockResults,
} from '../data/mockData';

import { INTELLIGENCE_CLUSTERS, SYSTEMS, PERSONAS } from '../constants';

/**
 * Domain identifiers mapping to intelligence cluster data sets
 * @type {Object.<string, string>}
 */
const DOMAIN_MAP = Object.freeze({
  'project-portfolio': INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id,
  'project': INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id,
  'portfolio': INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id,
  'sales-business-dev': INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id,
  'sales': INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id,
  'business-dev': INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id,
  'pipeline': INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id,
  'commercial-procurement': INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id,
  'commercial': INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id,
  'procurement': INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id,
  'contracts': INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id,
  'finance-cash-flow': INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id,
  'finance': INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id,
  'cash-flow': INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id,
  'budget': INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id,
  'workforce-planning': INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id,
  'workforce': INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id,
  'resources': INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id,
  'staffing': INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id,
  'knowledge-ip': INTELLIGENCE_CLUSTERS.KNOWLEDGE_IP.id,
  'knowledge': INTELLIGENCE_CLUSTERS.KNOWLEDGE_IP.id,
  'lessons': INTELLIGENCE_CLUSTERS.KNOWLEDGE_IP.id,
});

/**
 * System name mapping to system identifiers
 * @type {Object.<string, string>}
 */
const SYSTEM_NAME_MAP = Object.freeze({
  'sap': SYSTEMS.SAP.id,
  'procore': SYSTEMS.PROCORE.id,
  'salesforce': SYSTEMS.SALESFORCE.id,
  'primavera': SYSTEMS.PRIMAVERA.id,
});

/**
 * Keyword-to-cluster mapping for query text matching
 * @type {Array<{ keywords: string[], clusterId: string }>}
 */
const QUERY_KEYWORD_MAP = Object.freeze([
  {
    keywords: ['project', 'portfolio', 'milestone', 'schedule', 'timeline', 'completion', 'progress'],
    clusterId: INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id,
  },
  {
    keywords: ['sales', 'pipeline', 'opportunity', 'deal', 'lead', 'conversion', 'win rate', 'prospect'],
    clusterId: INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id,
  },
  {
    keywords: ['contract', 'procurement', 'vendor', 'supplier', 'commercial', 'renewal'],
    clusterId: INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id,
  },
  {
    keywords: ['finance', 'cash flow', 'budget', 'revenue', 'cost', 'spend', 'receivable', 'payable', 'variance', 'forecast'],
    clusterId: INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id,
  },
  {
    keywords: ['workforce', 'resource', 'staffing', 'allocation', 'capacity', 'team', 'headcount', 'hiring'],
    clusterId: INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id,
  },
  {
    keywords: ['knowledge', 'lesson', 'learned', 'document', 'ip', 'best practice'],
    clusterId: INTELLIGENCE_CLUSTERS.KNOWLEDGE_IP.id,
  },
]);

/**
 * Normalizes a string for comparison by trimming and lowercasing
 * @param {string} value - The string to normalize
 * @returns {string} The normalized string, or empty string if invalid
 */
function normalize(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().toLowerCase();
}

/**
 * Resolves a domain string to a cluster ID
 * @param {string} domain - The domain identifier or cluster ID
 * @returns {string|null} The resolved cluster ID, or null if not found
 */
function resolveDomainToClusterId(domain) {
  const normalized = normalize(domain);
  if (normalized.length === 0) {
    return null;
  }

  // Direct match in domain map
  if (DOMAIN_MAP[normalized]) {
    return DOMAIN_MAP[normalized];
  }

  // Check if it's already a valid cluster ID
  const clusterIds = Object.values(INTELLIGENCE_CLUSTERS).map((c) => c.id);
  if (clusterIds.includes(normalized)) {
    return normalized;
  }

  // Partial match in domain map keys
  const partialMatch = Object.keys(DOMAIN_MAP).find(
    (key) => key.includes(normalized) || normalized.includes(key)
  );
  if (partialMatch) {
    return DOMAIN_MAP[partialMatch];
  }

  return null;
}

/**
 * Resolves a system name to a system ID
 * @param {string} systemName - The system name or ID
 * @returns {string|null} The resolved system ID, or null if not found
 */
function resolveSystemId(systemName) {
  const normalized = normalize(systemName);
  if (normalized.length === 0) {
    return null;
  }

  // Direct match in system name map
  if (SYSTEM_NAME_MAP[normalized]) {
    return SYSTEM_NAME_MAP[normalized];
  }

  // Check if it's already a valid system ID
  const systemIds = Object.values(SYSTEMS).map((s) => s.id);
  if (systemIds.includes(normalized)) {
    return normalized;
  }

  // Partial match
  const partialMatch = Object.keys(SYSTEM_NAME_MAP).find(
    (key) => key.includes(normalized) || normalized.includes(key)
  );
  if (partialMatch) {
    return SYSTEM_NAME_MAP[partialMatch];
  }

  return null;
}

/**
 * Resolves a persona key to a persona ID
 * @param {string} persona - The persona key, ID, or name
 * @returns {string|null} The resolved persona ID, or null if not found
 */
function resolvePersonaId(persona) {
  const normalized = normalize(persona);
  if (normalized.length === 0) {
    return null;
  }

  // Check direct persona IDs
  const personaValues = Object.values(PERSONAS);
  const directMatch = personaValues.find((p) => p.id === normalized);
  if (directMatch) {
    return directMatch.id;
  }

  // Check persona constant keys (e.g., 'LUKAS')
  const upperKey = persona.trim().toUpperCase();
  if (PERSONAS[upperKey] && PERSONAS[upperKey].id) {
    return PERSONAS[upperKey].id;
  }

  // Check persona names (e.g., 'Lukas')
  const nameMatch = personaValues.find(
    (p) => p.name.toLowerCase() === normalized
  );
  if (nameMatch) {
    return nameMatch.id;
  }

  return null;
}

/**
 * Identifies relevant cluster IDs from a query text using keyword matching
 * @param {string} queryText - The query text to analyze
 * @returns {string[]} Array of matching cluster IDs
 */
function identifyClustersFromQuery(queryText) {
  const normalized = normalize(queryText);
  if (normalized.length === 0) {
    return [];
  }

  const matchedClusters = [];

  for (const mapping of QUERY_KEYWORD_MAP) {
    const hasMatch = mapping.keywords.some((keyword) => normalized.includes(keyword));
    if (hasMatch && !matchedClusters.includes(mapping.clusterId)) {
      matchedClusters.push(mapping.clusterId);
    }
  }

  return matchedClusters;
}

/**
 * Filters mock query results by system ID based on their source attributions
 * @param {Object[]} results - Array of mock query results
 * @param {string} systemId - The system ID to filter by
 * @returns {Object[]} Filtered results that include the specified system in their sources
 */
function filterResultsBySystem(results, systemId) {
  if (!Array.isArray(results) || typeof systemId !== 'string') {
    return [];
  }

  return results.filter((result) => {
    if (!Array.isArray(result.sources)) {
      return false;
    }
    return result.sources.some((source) => source.systemId === systemId);
  });
}

/**
 * Retrieves mock data filtered by domain (intelligence cluster).
 * Accepts domain names, cluster IDs, or common aliases.
 *
 * @param {string} domain - The domain identifier (e.g., 'finance', 'project-portfolio', 'sales')
 * @returns {Object[]} Array of mock query results for the domain, or empty array if not found
 */
export function getDataByDomain(domain) {
  if (typeof domain !== 'string' || domain.trim().length === 0) {
    return [];
  }

  const clusterId = resolveDomainToClusterId(domain);

  if (!clusterId) {
    return [];
  }

  return findByCluster(clusterId);
}

/**
 * Retrieves mock data matching a query text.
 * Uses both pattern matching from mockData and keyword-based cluster identification.
 * Returns results sorted by relevance.
 *
 * @param {string} queryText - The natural language query text
 * @returns {Object[]} Array of matching mock query results
 */
export function getDataByQuery(queryText) {
  if (typeof queryText !== 'string' || queryText.trim().length === 0) {
    return [];
  }

  const trimmedQuery = queryText.trim();

  // First, try direct pattern matching
  const patternResults = findByQueryPattern(trimmedQuery);

  if (patternResults.length > 0) {
    return patternResults;
  }

  // Fall back to keyword-based cluster identification
  const matchedClusterIds = identifyClustersFromQuery(trimmedQuery);

  if (matchedClusterIds.length > 0) {
    const clusterResults = [];
    for (const clusterId of matchedClusterIds) {
      const data = findByCluster(clusterId);
      for (const item of data) {
        if (!clusterResults.some((r) => r.id === item.id)) {
          clusterResults.push(item);
        }
      }
    }
    return clusterResults;
  }

  // Final fallback: return a sample of all results
  return getAllMockResults().slice(0, 3);
}

/**
 * Retrieves mock data filtered by system name.
 * Returns all query results that include the specified system in their source attributions.
 *
 * @param {string} systemName - The system name or ID (e.g., 'SAP', 'procore', 'salesforce')
 * @returns {Object[]} Array of mock query results sourced from the specified system
 */
export function getDataBySystem(systemName) {
  if (typeof systemName !== 'string' || systemName.trim().length === 0) {
    return [];
  }

  const systemId = resolveSystemId(systemName);

  if (!systemId) {
    return [];
  }

  const allResults = getAllMockResults();
  return filterResultsBySystem(allResults, systemId);
}

/**
 * Returns all available systems with their metadata and connection status.
 *
 * @returns {Object[]} Array of system objects with id, label, description, color, and status
 */
export function getAllSystems() {
  const systemStatus = DASHBOARD_SUMMARY.systemStatus || [];

  return Object.values(SYSTEMS).map((system) => {
    const status = systemStatus.find((s) => s.systemId === system.id);

    return {
      id: system.id,
      label: system.label,
      description: system.description,
      color: system.color,
      status: status ? status.status : 'unknown',
      health: status ? status.health : 'unknown',
      lastSync: status ? status.lastSync : null,
    };
  });
}

/**
 * Retrieves mock data filtered by persona.
 * Accepts persona IDs, constant keys, or persona names.
 *
 * @param {string} persona - The persona identifier (e.g., 'lukas', 'LUKAS', 'Lukas')
 * @returns {Object[]} Array of mock query results for the persona, or empty array if not found
 */
export function getDataForPersona(persona) {
  if (typeof persona !== 'string' || persona.trim().length === 0) {
    return [];
  }

  const personaId = resolvePersonaId(persona);

  if (!personaId) {
    return [];
  }

  return findByPersona(personaId);
}

/**
 * Returns all available intelligence clusters with their metadata.
 *
 * @returns {Object[]} Array of cluster objects with id, label, description, icon, and color
 */
export function getAllClusters() {
  return Object.values(INTELLIGENCE_CLUSTERS).map((cluster) => ({
    id: cluster.id,
    label: cluster.label,
    description: cluster.description,
    icon: cluster.icon,
    color: cluster.color,
  }));
}

/**
 * Returns the dashboard summary data.
 *
 * @returns {Object} The dashboard summary object
 */
export function getDashboardSummary() {
  return DASHBOARD_SUMMARY;
}

/**
 * Returns all risk signals, optionally filtered by severity.
 *
 * @param {string} [severity] - Optional severity filter ('critical', 'high', 'medium', 'low')
 * @returns {Object[]} Array of risk signal objects
 */
export function getRiskSignalData(severity) {
  return getRiskSignals(severity);
}

/**
 * Returns query suggestions for a given persona.
 *
 * @param {string} persona - The persona identifier
 * @returns {string[]} Array of suggested query strings
 */
export function getSuggestionsForPersona(persona) {
  if (typeof persona !== 'string' || persona.trim().length === 0) {
    return [];
  }

  const personaId = resolvePersonaId(persona);

  if (!personaId) {
    return [];
  }

  return getQuerySuggestions(personaId);
}

/**
 * Returns forecast model data by type.
 *
 * @param {string} type - Forecast type ('revenue', 'workforce', 'procurement')
 * @returns {Object|undefined} The forecast model or undefined
 */
export function getForecastData(type) {
  if (typeof type !== 'string' || type.trim().length === 0) {
    return undefined;
  }

  return getForecastByType(type.trim().toLowerCase());
}

/**
 * Returns an action result by action ID.
 *
 * @param {string} actionId - The action ID
 * @returns {Object|undefined} The action result or undefined
 */
export function getActionResultData(actionId) {
  if (typeof actionId !== 'string' || actionId.trim().length === 0) {
    return undefined;
  }

  return getActionResult(actionId);
}

/**
 * Returns all action results.
 *
 * @returns {Object[]} Array of all action result objects
 */
export function getAllActionResults() {
  return ACTION_RESULTS;
}

/**
 * Returns all forecast models.
 *
 * @returns {Object[]} Array of all forecast model objects
 */
export function getAllForecasts() {
  return FORECAST_MODELS;
}

/**
 * Returns all mock query results as a flat array.
 *
 * @returns {Object[]} Array of all mock query results
 */
export function getAllData() {
  return getAllMockResults();
}

/**
 * Searches across all mock data using a text query and optional filters.
 *
 * @param {string} queryText - The search text
 * @param {Object} [filters={}] - Optional filters
 * @param {string} [filters.persona] - Filter by persona
 * @param {string} [filters.domain] - Filter by domain/cluster
 * @param {string} [filters.system] - Filter by system
 * @returns {Object[]} Array of matching mock query results
 */
export function searchData(queryText, filters = {}) {
  if (typeof queryText !== 'string' || queryText.trim().length === 0) {
    return [];
  }

  if (filters === null || typeof filters !== 'object' || Array.isArray(filters)) {
    filters = {};
  }

  let results = getDataByQuery(queryText);

  // Apply persona filter
  if (typeof filters.persona === 'string' && filters.persona.trim().length > 0) {
    const personaId = resolvePersonaId(filters.persona);
    if (personaId) {
      results = results.filter(
        (r) => r.personaId === personaId || r.personaId === null
      );
    }
  }

  // Apply domain filter
  if (typeof filters.domain === 'string' && filters.domain.trim().length > 0) {
    const clusterId = resolveDomainToClusterId(filters.domain);
    if (clusterId) {
      results = results.filter((r) => r.clusterId === clusterId);
    }
  }

  // Apply system filter
  if (typeof filters.system === 'string' && filters.system.trim().length > 0) {
    const systemId = resolveSystemId(filters.system);
    if (systemId) {
      results = filterResultsBySystem(results, systemId);
    }
  }

  return results;
}