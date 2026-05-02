/**
 * Source transparency service for Ask Dreeso Memory.
 * Determines which enterprise systems contributed to a query result
 * and their contribution levels for the source indicator panel.
 *
 * @module SourceTransparencyEngine
 * @see SCRUM-7890
 */

import { SYSTEMS } from '../constants';
import { getAllSystems } from './MockDataProvider';

/**
 * @typedef {Object} SourceIndicator
 * @property {string} system - System identifier
 * @property {string} label - Display label for the system
 * @property {string} color - Brand / accent color for the system
 * @property {string} status - Connection status ('connected', 'degraded', 'disconnected', 'unknown')
 * @property {string} contributionLevel - Contribution level ('high', 'medium', 'low', 'none')
 * @property {boolean} active - Whether this system contributed data
 * @property {number} resultCount - Number of results from this system
 * @property {number} confidence - Average confidence score from this system's sources (0-1)
 * @property {string|null} lastSynced - ISO timestamp of last sync, or null
 * @property {string|null} dataType - Type of data contributed, or null if none
 */

/**
 * Contribution level thresholds based on result count relative to total
 * @type {Object.<string, number>}
 */
const CONTRIBUTION_THRESHOLDS = Object.freeze({
  HIGH: 0.4,
  MEDIUM: 0.15,
});

/**
 * Extracts all source entries from a query result or array of results.
 *
 * @param {Object|Object[]} queryResult - The query result or array of results
 * @returns {Object[]} Flat array of source objects
 */
function extractAllSources(queryResult) {
  if (!queryResult) {
    return [];
  }

  const sources = [];

  const collectFromResult = (result) => {
    if (result && Array.isArray(result.sources)) {
      for (const source of result.sources) {
        if (source && typeof source.systemId === 'string') {
          sources.push(source);
        }
      }
    }
  };

  // Handle array of results
  if (Array.isArray(queryResult)) {
    for (const result of queryResult) {
      collectFromResult(result);
    }
    return sources;
  }

  // Handle orchestration result with aggregatedResults
  if (queryResult.aggregatedResults) {
    if (Array.isArray(queryResult.aggregatedResults.results)) {
      for (const result of queryResult.aggregatedResults.results) {
        collectFromResult(result);
      }
    }
    return sources;
  }

  // Handle single result object
  collectFromResult(queryResult);

  return sources;
}

/**
 * Groups source entries by system ID.
 *
 * @param {Object[]} sources - Flat array of source objects
 * @returns {Object.<string, Object[]>} Sources grouped by system ID
 */
function groupSourcesBySystem(sources) {
  if (!Array.isArray(sources)) {
    return {};
  }

  const grouped = {};

  for (const source of sources) {
    if (source && typeof source.systemId === 'string') {
      if (!grouped[source.systemId]) {
        grouped[source.systemId] = [];
      }
      grouped[source.systemId].push(source);
    }
  }

  return grouped;
}

/**
 * Calculates the average confidence for a group of sources.
 *
 * @param {Object[]} sources - Array of source objects for a single system
 * @returns {number} Average confidence score between 0 and 1
 */
function calculateGroupConfidence(sources) {
  if (!Array.isArray(sources) || sources.length === 0) {
    return 0;
  }

  let total = 0;
  let count = 0;

  for (const source of sources) {
    if (source && typeof source.confidence === 'number') {
      total += source.confidence;
      count += 1;
    }
  }

  if (count === 0) {
    return 0;
  }

  return Math.round((total / count) * 100) / 100;
}

/**
 * Finds the latest sync timestamp from a group of sources.
 *
 * @param {Object[]} sources - Array of source objects for a single system
 * @returns {string|null} ISO timestamp of the latest sync, or null
 */
function findLatestSync(sources) {
  if (!Array.isArray(sources) || sources.length === 0) {
    return null;
  }

  let latest = null;

  for (const source of sources) {
    if (source && typeof source.lastSynced === 'string') {
      if (!latest || source.lastSynced > latest) {
        latest = source.lastSynced;
      }
    }
  }

  return latest;
}

/**
 * Determines the primary data type from a group of sources.
 *
 * @param {Object[]} sources - Array of source objects for a single system
 * @returns {string|null} The most common data type, or null if none
 */
function determinePrimaryDataType(sources) {
  if (!Array.isArray(sources) || sources.length === 0) {
    return null;
  }

  const typeCounts = {};

  for (const source of sources) {
    if (source && typeof source.dataType === 'string') {
      typeCounts[source.dataType] = (typeCounts[source.dataType] || 0) + 1;
    }
  }

  const entries = Object.entries(typeCounts);
  if (entries.length === 0) {
    return null;
  }

  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

/**
 * Determines the contribution level based on the ratio of a system's
 * source count to the total source count.
 *
 * @param {number} systemSourceCount - Number of sources from this system
 * @param {number} totalSourceCount - Total number of sources across all systems
 * @returns {string} Contribution level ('high', 'medium', 'low', 'none')
 */
function determineContributionLevel(systemSourceCount, totalSourceCount) {
  if (systemSourceCount === 0 || totalSourceCount === 0) {
    return 'none';
  }

  const ratio = systemSourceCount / totalSourceCount;

  if (ratio >= CONTRIBUTION_THRESHOLDS.HIGH) {
    return 'high';
  }

  if (ratio >= CONTRIBUTION_THRESHOLDS.MEDIUM) {
    return 'medium';
  }

  return 'low';
}

/**
 * Counts the number of unique results that include a specific system in their sources.
 *
 * @param {Object|Object[]} queryResult - The query result or array of results
 * @param {string} systemId - The system ID to count results for
 * @returns {number} Number of results from the system
 */
function countResultsForSystem(queryResult, systemId) {
  if (!queryResult || typeof systemId !== 'string') {
    return 0;
  }

  let count = 0;

  const checkResult = (result) => {
    if (result && Array.isArray(result.sources)) {
      const hasSystem = result.sources.some(
        (source) => source && source.systemId === systemId
      );
      if (hasSystem) {
        count += 1;
      }
    }
  };

  if (Array.isArray(queryResult)) {
    for (const result of queryResult) {
      checkResult(result);
    }
    return count;
  }

  if (queryResult.aggregatedResults && Array.isArray(queryResult.aggregatedResults.results)) {
    for (const result of queryResult.aggregatedResults.results) {
      checkResult(result);
    }
    return count;
  }

  checkResult(queryResult);

  return count;
}

/**
 * Extracts system contribution data from an orchestration result's systems array.
 *
 * @param {Object} queryResult - The orchestration result object
 * @returns {Object.<string, Object>|null} Map of system ID to contribution data, or null
 */
function extractOrchestrationSystems(queryResult) {
  if (!queryResult || !Array.isArray(queryResult.systems)) {
    return null;
  }

  const systemMap = {};

  for (const sys of queryResult.systems) {
    if (sys && typeof sys.systemId === 'string') {
      systemMap[sys.systemId] = sys;
    }
  }

  return Object.keys(systemMap).length > 0 ? systemMap : null;
}

/**
 * Returns the system metadata (label, color) for a given system ID.
 *
 * @param {string} systemId - The system identifier
 * @returns {{ label: string, color: string }} System metadata
 */
function getSystemMeta(systemId) {
  const systemValues = Object.values(SYSTEMS);
  const match = systemValues.find((s) => s.id === systemId);

  if (match) {
    return { label: match.label, color: match.color };
  }

  return { label: systemId, color: '#6B7280' };
}

/**
 * Determines which enterprise systems contributed to a query result
 * and their contribution levels for the source indicator panel.
 *
 * Returns an array of SourceIndicator objects for all known systems,
 * indicating whether each system contributed data, its contribution level,
 * confidence score, and connection status.
 *
 * @param {Object|Object[]} queryResult - The query result object, array of results, or orchestration result
 * @returns {SourceIndicator[]} Array of source indicator objects for all systems
 */
export function getSourceTransparency(queryResult) {
  // Get all known systems with their status
  const allSystems = getAllSystems();

  // If no query result provided, return all systems as inactive
  if (!queryResult) {
    return allSystems.map((system) => ({
      system: system.id,
      label: system.label,
      color: system.color,
      status: system.status || 'unknown',
      contributionLevel: 'none',
      active: false,
      resultCount: 0,
      confidence: 0,
      lastSynced: system.lastSync || null,
      dataType: null,
    }));
  }

  // Check if this is an orchestration result with pre-computed system data
  const orchestrationSystems = extractOrchestrationSystems(queryResult);

  // Extract all sources from the query result
  const allSources = extractAllSources(queryResult);
  const groupedSources = groupSourcesBySystem(allSources);
  const totalSourceCount = allSources.length;

  return allSystems.map((system) => {
    const systemId = system.id;
    const meta = getSystemMeta(systemId);
    const systemSources = groupedSources[systemId] || [];
    const isActive = systemSources.length > 0;

    // Use orchestration data if available, otherwise compute
    let resultCount = 0;
    let confidence = 0;
    let lastSynced = system.lastSync || null;
    let status = system.status || 'unknown';

    if (orchestrationSystems && orchestrationSystems[systemId]) {
      const orchData = orchestrationSystems[systemId];
      resultCount = orchData.resultCount || 0;
      confidence = orchData.confidence || 0;
      lastSynced = orchData.lastSynced || lastSynced;
      status = orchData.status || status;
    } else {
      resultCount = countResultsForSystem(queryResult, systemId);
      confidence = calculateGroupConfidence(systemSources);
      const sourceSyncTime = findLatestSync(systemSources);
      if (sourceSyncTime) {
        lastSynced = sourceSyncTime;
      }
    }

    const contributionLevel = determineContributionLevel(systemSources.length, totalSourceCount);
    const dataType = determinePrimaryDataType(systemSources);

    return {
      system: systemId,
      label: meta.label,
      color: meta.color,
      status,
      contributionLevel,
      active: isActive,
      resultCount,
      confidence,
      lastSynced,
      dataType,
    };
  });
}

/**
 * Returns only the active (contributing) systems from a query result.
 *
 * @param {Object|Object[]} queryResult - The query result object or array of results
 * @returns {SourceIndicator[]} Array of source indicators for active systems only
 */
export function getActiveSourceSystems(queryResult) {
  const allIndicators = getSourceTransparency(queryResult);
  return allIndicators.filter((indicator) => indicator.active);
}

/**
 * Returns only the inactive (non-contributing) systems from a query result.
 *
 * @param {Object|Object[]} queryResult - The query result object or array of results
 * @returns {SourceIndicator[]} Array of source indicators for inactive systems only
 */
export function getInactiveSourceSystems(queryResult) {
  const allIndicators = getSourceTransparency(queryResult);
  return allIndicators.filter((indicator) => !indicator.active);
}

/**
 * Returns the total number of unique source systems that contributed to a query result.
 *
 * @param {Object|Object[]} queryResult - The query result object or array of results
 * @returns {number} Count of active source systems
 */
export function getActiveSourceCount(queryResult) {
  const allSources = extractAllSources(queryResult);
  const systemIds = new Set();

  for (const source of allSources) {
    if (source && typeof source.systemId === 'string') {
      systemIds.add(source.systemId);
    }
  }

  return systemIds.size;
}

/**
 * Returns the overall average confidence across all contributing systems.
 *
 * @param {Object|Object[]} queryResult - The query result object or array of results
 * @returns {number} Average confidence score between 0 and 1
 */
export function getOverallConfidence(queryResult) {
  const allSources = extractAllSources(queryResult);
  return calculateGroupConfidence(allSources);
}

/**
 * Returns a summary of source transparency for display purposes.
 *
 * @param {Object|Object[]} queryResult - The query result object or array of results
 * @returns {{ totalSystems: number, activeSystems: number, overallConfidence: number, indicators: SourceIndicator[] }} Source transparency summary
 */
export function getSourceTransparencySummary(queryResult) {
  const indicators = getSourceTransparency(queryResult);
  const activeSystems = indicators.filter((i) => i.active).length;
  const overallConfidence = getOverallConfidence(queryResult);

  return {
    totalSystems: indicators.length,
    activeSystems,
    overallConfidence,
    indicators,
  };
}