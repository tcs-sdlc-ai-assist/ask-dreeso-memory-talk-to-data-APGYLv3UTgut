/**
 * Multi-system query orchestration service for Ask Dreeso Memory.
 * Simulates querying multiple enterprise systems, aggregates results
 * from MockDataProvider, and tracks which systems contributed to each result.
 *
 * @module OrchestrationEngine
 * @see SCRUM-7886
 * @see SCRUM-7887
 */

import { SYSTEMS, INTELLIGENCE_CLUSTERS } from '../constants';
import {
  getDataByDomain,
  getDataByQuery,
  getDataBySystem,
  getDataForPersona,
  getAllSystems,
  searchData,
  getAllData,
} from './MockDataProvider';

/**
 * @typedef {Object} SystemContribution
 * @property {string} systemId - System identifier
 * @property {string} label - Display label for the system
 * @property {boolean} active - Whether this system contributed data
 * @property {number} resultCount - Number of results from this system
 * @property {number} confidence - Average confidence score from this system's sources
 * @property {string|null} lastSynced - ISO timestamp of last sync, or null
 * @property {string} status - Connection status ('connected', 'degraded', 'disconnected', 'unknown')
 */

/**
 * @typedef {Object} OrchestrationTiming
 * @property {number} startTime - Unix timestamp when orchestration started
 * @property {number} endTime - Unix timestamp when orchestration completed
 * @property {number} durationMs - Total duration in milliseconds
 * @property {Object.<string, number>} systemTimings - Per-system query duration in milliseconds
 */

/**
 * @typedef {Object} AggregatedResults
 * @property {Object[]} results - Array of mock query result objects
 * @property {number} totalResults - Total number of results
 * @property {string[]} clusters - Intelligence cluster IDs represented in results
 * @property {Object} summary - Aggregated summary statistics
 * @property {number} summary.totalSources - Total number of unique source systems
 * @property {number} summary.averageConfidence - Average confidence across all sources
 * @property {number} summary.totalActions - Total number of available actions
 * @property {number} summary.totalRiskSignals - Total number of risk signals
 */

/**
 * @typedef {Object} OrchestrationResult
 * @property {AggregatedResults} aggregatedResults - The aggregated query results
 * @property {SystemContribution[]} systems - System contribution details
 * @property {OrchestrationTiming} timing - Timing information for the orchestration
 */

/**
 * @typedef {Object} InterpretedQuery
 * @property {string[]} domains - Matched intelligence cluster IDs
 * @property {string} queryType - The classified query type
 * @property {string[]} keywords - Extracted keywords from the query
 * @property {number} confidence - Confidence score between 0 and 1
 * @property {string[]} targetSystems - System IDs relevant to the query
 * @property {Object} parameters - Extracted parameters from the query
 * @property {string|null} personaHint - Suggested persona ID if detectable, or null
 * @property {string} originalQuery - The original query text
 */

/**
 * Mapping from intelligence cluster IDs to the systems that serve them
 * @type {Object.<string, string[]>}
 */
const CLUSTER_SYSTEM_MAP = Object.freeze({
  [INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id]: [SYSTEMS.PROCORE.id, SYSTEMS.PRIMAVERA.id, SYSTEMS.SAP.id],
  [INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id]: [SYSTEMS.SALESFORCE.id],
  [INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id]: [SYSTEMS.SAP.id, SYSTEMS.PROCORE.id],
  [INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id]: [SYSTEMS.SAP.id, SYSTEMS.PRIMAVERA.id],
  [INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id]: [SYSTEMS.PROCORE.id, SYSTEMS.PRIMAVERA.id],
  [INTELLIGENCE_CLUSTERS.KNOWLEDGE_IP.id]: [SYSTEMS.PROCORE.id, SYSTEMS.PRIMAVERA.id],
});

/**
 * Simulates a per-system query delay in milliseconds
 * @returns {number} A simulated delay between 50 and 200 ms
 */
function simulateSystemDelay() {
  return Math.floor(Math.random() * 150) + 50;
}

/**
 * Extracts unique cluster IDs from an array of query results
 * @param {Object[]} results - Array of mock query result objects
 * @returns {string[]} Array of unique cluster IDs
 */
function extractClusterIds(results) {
  if (!Array.isArray(results)) {
    return [];
  }

  const clusterSet = new Set();
  for (const result of results) {
    if (result && typeof result.clusterId === 'string') {
      clusterSet.add(result.clusterId);
    }
  }
  return [...clusterSet];
}

/**
 * Extracts unique system IDs from the sources of query results
 * @param {Object[]} results - Array of mock query result objects
 * @returns {string[]} Array of unique system IDs
 */
function extractSystemIdsFromResults(results) {
  if (!Array.isArray(results)) {
    return [];
  }

  const systemSet = new Set();
  for (const result of results) {
    if (result && Array.isArray(result.sources)) {
      for (const source of result.sources) {
        if (source && typeof source.systemId === 'string') {
          systemSet.add(source.systemId);
        }
      }
    }
  }
  return [...systemSet];
}

/**
 * Calculates the average confidence score from all sources in the results
 * @param {Object[]} results - Array of mock query result objects
 * @returns {number} Average confidence score between 0 and 1
 */
function calculateAverageConfidence(results) {
  if (!Array.isArray(results) || results.length === 0) {
    return 0;
  }

  let totalConfidence = 0;
  let sourceCount = 0;

  for (const result of results) {
    if (result && Array.isArray(result.sources)) {
      for (const source of result.sources) {
        if (source && typeof source.confidence === 'number') {
          totalConfidence += source.confidence;
          sourceCount += 1;
        }
      }
    }
  }

  if (sourceCount === 0) {
    return 0;
  }

  return Math.round((totalConfidence / sourceCount) * 100) / 100;
}

/**
 * Counts the total number of actions across all results
 * @param {Object[]} results - Array of mock query result objects
 * @returns {number} Total number of actions
 */
function countTotalActions(results) {
  if (!Array.isArray(results)) {
    return 0;
  }

  let total = 0;
  for (const result of results) {
    if (result && Array.isArray(result.actions)) {
      total += result.actions.length;
    }
  }
  return total;
}

/**
 * Counts the total number of risk signals across all results
 * @param {Object[]} results - Array of mock query result objects
 * @returns {number} Total number of risk signals
 */
function countTotalRiskSignals(results) {
  if (!Array.isArray(results)) {
    return 0;
  }

  let total = 0;
  for (const result of results) {
    if (result && Array.isArray(result.riskSignals)) {
      total += result.riskSignals.length;
    }
  }
  return total;
}

/**
 * Calculates the average confidence for a specific system from the results
 * @param {Object[]} results - Array of mock query result objects
 * @param {string} systemId - The system ID to calculate confidence for
 * @returns {number} Average confidence for the system, or 0 if not found
 */
function calculateSystemConfidence(results, systemId) {
  if (!Array.isArray(results) || typeof systemId !== 'string') {
    return 0;
  }

  let totalConfidence = 0;
  let sourceCount = 0;

  for (const result of results) {
    if (result && Array.isArray(result.sources)) {
      for (const source of result.sources) {
        if (source && source.systemId === systemId && typeof source.confidence === 'number') {
          totalConfidence += source.confidence;
          sourceCount += 1;
        }
      }
    }
  }

  if (sourceCount === 0) {
    return 0;
  }

  return Math.round((totalConfidence / sourceCount) * 100) / 100;
}

/**
 * Counts the number of results that include a specific system in their sources
 * @param {Object[]} results - Array of mock query result objects
 * @param {string} systemId - The system ID to count results for
 * @returns {number} Number of results from the system
 */
function countResultsForSystem(results, systemId) {
  if (!Array.isArray(results) || typeof systemId !== 'string') {
    return 0;
  }

  let count = 0;
  for (const result of results) {
    if (result && Array.isArray(result.sources)) {
      const hasSystem = result.sources.some(
        (source) => source && source.systemId === systemId
      );
      if (hasSystem) {
        count += 1;
      }
    }
  }
  return count;
}

/**
 * Finds the last synced timestamp for a specific system from the results
 * @param {Object[]} results - Array of mock query result objects
 * @param {string} systemId - The system ID to find the last sync for
 * @returns {string|null} ISO timestamp of last sync, or null if not found
 */
function findLastSyncedForSystem(results, systemId) {
  if (!Array.isArray(results) || typeof systemId !== 'string') {
    return null;
  }

  let latestSync = null;

  for (const result of results) {
    if (result && Array.isArray(result.sources)) {
      for (const source of result.sources) {
        if (source && source.systemId === systemId && typeof source.lastSynced === 'string') {
          if (!latestSync || source.lastSynced > latestSync) {
            latestSync = source.lastSynced;
          }
        }
      }
    }
  }

  return latestSync;
}

/**
 * Builds system contribution details for all known systems
 * @param {Object[]} results - Array of mock query result objects
 * @param {string[]} targetSystemIds - System IDs that were targeted by the query
 * @returns {SystemContribution[]} Array of system contribution objects
 */
function buildSystemContributions(results, targetSystemIds) {
  const allSystems = getAllSystems();
  const contributingSystemIds = extractSystemIdsFromResults(results);

  return allSystems.map((system) => {
    const isActive = contributingSystemIds.includes(system.id);
    const resultCount = isActive ? countResultsForSystem(results, system.id) : 0;
    const confidence = isActive ? calculateSystemConfidence(results, system.id) : 0;
    const lastSynced = isActive ? findLastSyncedForSystem(results, system.id) : (system.lastSync || null);

    return {
      systemId: system.id,
      label: system.label,
      active: isActive,
      resultCount,
      confidence,
      lastSynced,
      status: system.status || 'unknown',
    };
  });
}

/**
 * Deduplicates results by their ID
 * @param {Object[]} results - Array of mock query result objects
 * @returns {Object[]} Deduplicated array of results
 */
function deduplicateResults(results) {
  if (!Array.isArray(results)) {
    return [];
  }

  const seen = new Set();
  const unique = [];

  for (const result of results) {
    if (result && typeof result.id === 'string' && !seen.has(result.id)) {
      seen.add(result.id);
      unique.push(result);
    }
  }

  return unique;
}

/**
 * Fetches results from domains identified in the interpreted query
 * @param {string[]} domains - Array of intelligence cluster IDs
 * @returns {Object[]} Array of mock query results from the matched domains
 */
function fetchResultsByDomains(domains) {
  if (!Array.isArray(domains) || domains.length === 0) {
    return [];
  }

  const results = [];
  for (const domain of domains) {
    const domainResults = getDataByDomain(domain);
    for (const item of domainResults) {
      results.push(item);
    }
  }
  return results;
}

/**
 * Fetches results from target systems identified in the interpreted query
 * @param {string[]} targetSystems - Array of system IDs
 * @returns {Object[]} Array of mock query results from the target systems
 */
function fetchResultsByTargetSystems(targetSystems) {
  if (!Array.isArray(targetSystems) || targetSystems.length === 0) {
    return [];
  }

  const results = [];
  for (const systemId of targetSystems) {
    const systemResults = getDataBySystem(systemId);
    for (const item of systemResults) {
      results.push(item);
    }
  }
  return results;
}

/**
 * Determines which system IDs should be queried based on the interpreted query
 * @param {InterpretedQuery} interpretedQuery - The interpreted query object
 * @returns {string[]} Array of system IDs to query
 */
function determineTargetSystems(interpretedQuery) {
  const systemIds = new Set();

  // Add explicitly targeted systems
  if (Array.isArray(interpretedQuery.targetSystems)) {
    for (const sysId of interpretedQuery.targetSystems) {
      systemIds.add(sysId);
    }
  }

  // Infer systems from domains
  if (Array.isArray(interpretedQuery.domains)) {
    for (const domain of interpretedQuery.domains) {
      const systems = CLUSTER_SYSTEM_MAP[domain];
      if (Array.isArray(systems)) {
        for (const sysId of systems) {
          systemIds.add(sysId);
        }
      }
    }
  }

  // If no systems determined, include all systems
  if (systemIds.size === 0) {
    const allSystemValues = Object.values(SYSTEMS);
    for (const system of allSystemValues) {
      systemIds.add(system.id);
    }
  }

  return [...systemIds];
}

/**
 * Builds aggregated results from the raw query results
 * @param {Object[]} results - Deduplicated array of mock query result objects
 * @returns {AggregatedResults} The aggregated results object
 */
function buildAggregatedResults(results) {
  const clusters = extractClusterIds(results);
  const uniqueSources = extractSystemIdsFromResults(results);
  const averageConfidence = calculateAverageConfidence(results);
  const totalActions = countTotalActions(results);
  const totalRiskSignals = countTotalRiskSignals(results);

  return {
    results,
    totalResults: results.length,
    clusters,
    summary: {
      totalSources: uniqueSources.length,
      averageConfidence,
      totalActions,
      totalRiskSignals,
    },
  };
}

/**
 * Builds timing information for the orchestration
 * @param {number} startTime - Unix timestamp when orchestration started
 * @param {string[]} targetSystemIds - System IDs that were queried
 * @returns {OrchestrationTiming} The timing information object
 */
function buildTiming(startTime, targetSystemIds) {
  const endTime = Date.now();
  const durationMs = endTime - startTime;

  const systemTimings = {};
  if (Array.isArray(targetSystemIds)) {
    for (const sysId of targetSystemIds) {
      systemTimings[sysId] = simulateSystemDelay();
    }
  }

  return {
    startTime,
    endTime,
    durationMs,
    systemTimings,
  };
}

/**
 * Creates an error result object for orchestration failures
 * @param {string} errorCode - The error code
 * @param {string} message - The error message
 * @returns {OrchestrationResult} An orchestration result with empty data and error info
 */
function createErrorResult(errorCode, message) {
  const now = Date.now();
  const allSystems = getAllSystems();

  return {
    aggregatedResults: {
      results: [],
      totalResults: 0,
      clusters: [],
      summary: {
        totalSources: 0,
        averageConfidence: 0,
        totalActions: 0,
        totalRiskSignals: 0,
      },
      error: {
        errorCode,
        message,
      },
    },
    systems: allSystems.map((system) => ({
      systemId: system.id,
      label: system.label,
      active: false,
      resultCount: 0,
      confidence: 0,
      lastSynced: system.lastSync || null,
      status: system.status || 'unknown',
    })),
    timing: {
      startTime: now,
      endTime: now,
      durationMs: 0,
      systemTimings: {},
    },
  };
}

/**
 * Orchestrates a multi-system query based on an interpreted query object.
 * Simulates querying multiple enterprise systems, aggregates results from
 * MockDataProvider, and tracks which systems contributed to the response.
 *
 * @param {InterpretedQuery} interpretedQuery - The interpreted query object from QueryInterpreter
 * @returns {Promise<OrchestrationResult>} Promise resolving to the orchestration result
 */
export async function orchestrateQuery(interpretedQuery) {
  const startTime = Date.now();

  // Validate input
  if (!interpretedQuery || typeof interpretedQuery !== 'object') {
    return createErrorResult('INVALID_QUERY', 'Interpreted query object is required.');
  }

  // Simulate orchestration delay
  const delay = parseInt(import.meta.env.VITE_MOCK_DELAY_MS, 10) || 500;
  await new Promise((resolve) => setTimeout(resolve, delay));

  try {
    // Determine target systems
    const targetSystemIds = determineTargetSystems(interpretedQuery);

    // Collect results from multiple strategies
    let allResults = [];

    // Strategy 1: Fetch by domains
    if (Array.isArray(interpretedQuery.domains) && interpretedQuery.domains.length > 0) {
      const domainResults = fetchResultsByDomains(interpretedQuery.domains);
      for (const item of domainResults) {
        allResults.push(item);
      }
    }

    // Strategy 2: Fetch by original query text
    if (typeof interpretedQuery.originalQuery === 'string' && interpretedQuery.originalQuery.trim().length > 0) {
      const queryResults = getDataByQuery(interpretedQuery.originalQuery);
      for (const item of queryResults) {
        allResults.push(item);
      }
    }

    // Strategy 3: Fetch by persona hint
    if (typeof interpretedQuery.personaHint === 'string' && interpretedQuery.personaHint.length > 0) {
      const personaResults = getDataForPersona(interpretedQuery.personaHint);
      for (const item of personaResults) {
        allResults.push(item);
      }
    }

    // Strategy 4: Fetch by target systems if still no results
    if (allResults.length === 0 && targetSystemIds.length > 0) {
      const systemResults = fetchResultsByTargetSystems(targetSystemIds);
      for (const item of systemResults) {
        allResults.push(item);
      }
    }

    // Strategy 5: Fallback to all data if still no results
    if (allResults.length === 0) {
      const fallbackResults = getAllData();
      allResults = fallbackResults.slice(0, 3);
    }

    // Deduplicate results
    const uniqueResults = deduplicateResults(allResults);

    // Filter results by persona if persona hint is available
    let filteredResults = uniqueResults;
    if (typeof interpretedQuery.personaHint === 'string' && interpretedQuery.personaHint.length > 0) {
      const personaFiltered = uniqueResults.filter(
        (r) => r.personaId === interpretedQuery.personaHint || r.personaId === null
      );
      if (personaFiltered.length > 0) {
        filteredResults = personaFiltered;
      }
    }

    // Build aggregated results
    const aggregatedResults = buildAggregatedResults(filteredResults);

    // Build system contributions
    const systems = buildSystemContributions(filteredResults, targetSystemIds);

    // Build timing
    const timing = buildTiming(startTime, targetSystemIds);

    return {
      aggregatedResults,
      systems,
      timing,
    };
  } catch {
    return createErrorResult('ORCHESTRATION_ERROR', 'An unexpected error occurred during query orchestration.');
  }
}

/**
 * Orchestrates a query using raw query text and optional persona context.
 * This is a convenience method that accepts a plain query string
 * and wraps it in a minimal interpreted query structure.
 *
 * @param {string} queryText - The raw query text
 * @param {Object} [options={}] - Optional parameters
 * @param {string} [options.personaId] - Persona ID for filtering
 * @param {string} [options.clusterId] - Cluster ID for domain filtering
 * @returns {Promise<OrchestrationResult>} Promise resolving to the orchestration result
 */
export async function orchestrateRawQuery(queryText, options = {}) {
  if (typeof queryText !== 'string' || queryText.trim().length === 0) {
    return createErrorResult('INVALID_QUERY', 'Query text is required.');
  }

  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    options = {};
  }

  const domains = [];
  if (typeof options.clusterId === 'string' && options.clusterId.length > 0) {
    domains.push(options.clusterId);
  }

  const interpretedQuery = {
    domains,
    queryType: 'SEARCH',
    keywords: [],
    confidence: 0.5,
    targetSystems: [],
    parameters: {},
    personaHint: typeof options.personaId === 'string' ? options.personaId : null,
    originalQuery: queryText.trim(),
  };

  return orchestrateQuery(interpretedQuery);
}

/**
 * Returns the system-to-cluster mapping used by the orchestration engine.
 *
 * @returns {Object.<string, string[]>} Mapping of cluster IDs to system ID arrays
 */
export function getClusterSystemMap() {
  return CLUSTER_SYSTEM_MAP;
}

/**
 * Returns the list of all systems with their current status information.
 *
 * @returns {Object[]} Array of system objects with status details
 */
export function getSystemStatus() {
  return getAllSystems();
}