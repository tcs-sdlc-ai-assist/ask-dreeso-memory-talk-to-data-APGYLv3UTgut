/**
 * Unified API facade for the intelligence and orchestration engine.
 * Composes all sub-services (QueryInterpreter, OrchestrationEngine,
 * CTABubbleEngine, ActionExecutor, SourceTransparencyEngine) into a
 * single API surface for UI consumption.
 *
 * @module QueryOrchestrationFacade
 * @see SCRUM-7888
 * @see SCRUM-7886
 * @see SCRUM-7887
 * @see SCRUM-7889
 * @see SCRUM-7890
 * @see SCRUM-7891
 */

import { interpretQuery as interpret, validateQuery } from './QueryInterpreter';
import { orchestrateQuery as orchestrate, orchestrateRawQuery } from './OrchestrationEngine';
import { getCTABubbles as generateCTABubbles } from './CTABubbleEngine';
import {
  executeAction as executeActionService,
  getActionLog as getActionLogEntries,
  clearActionLog,
  getActionLogCount,
  getActionLogByType,
  getActionLogBySystem,
  getActionLogByStatus,
  getActionLogByPersona,
  exportActionLog,
} from './ActionExecutor';
import {
  getSourceTransparency as getSourceTransparencyData,
  getActiveSourceSystems,
  getInactiveSourceSystems,
  getActiveSourceCount,
  getOverallConfidence,
  getSourceTransparencySummary,
} from './SourceTransparencyEngine';
import { logEvent, AUDIT_EVENT_TYPES } from './AuditLogger';
import { getSession } from './SessionManager';

/**
 * Retrieves the current persona from the active session
 * @returns {string|null} The persona ID, or null if not available
 */
function getCurrentPersona() {
  try {
    const session = getSession();
    return session ? session.persona : null;
  } catch {
    return null;
  }
}

/**
 * Interprets a natural language query text and returns a structured query intent.
 * Logs the query submission to the audit trail.
 *
 * @param {string} queryText - The natural language query text from the user
 * @returns {Object} The interpreted query intent object
 */
export function interpretQuery(queryText) {
  // Validate query
  const validation = validateQuery(queryText);
  if (!validation.valid) {
    logEvent(AUDIT_EVENT_TYPES.QUERY_ERROR, {
      queryText: typeof queryText === 'string' ? queryText : '',
      errorCode: 'INVALID_QUERY',
      message: validation.message,
    });

    return {
      domains: [],
      queryType: 'UNKNOWN',
      keywords: [],
      confidence: 0,
      targetSystems: [],
      parameters: {},
      personaHint: null,
      originalQuery: typeof queryText === 'string' ? queryText : '',
      error: {
        errorCode: 'INVALID_QUERY',
        message: validation.message,
      },
    };
  }

  // Log query submission
  logEvent(AUDIT_EVENT_TYPES.QUERY_SUBMIT, {
    queryText: queryText.trim(),
    persona: getCurrentPersona(),
  });

  // Interpret the query
  const intent = interpret(queryText);

  return intent;
}

/**
 * Orchestrates a multi-system query from natural language text.
 * Interprets the query, orchestrates across systems, and returns aggregated results.
 * Logs query submission and result events to the audit trail.
 *
 * @param {string} queryText - The natural language query text from the user
 * @param {Object} [options={}] - Optional parameters
 * @param {string} [options.personaId] - Persona ID for filtering
 * @param {string} [options.clusterId] - Cluster ID for domain filtering
 * @returns {Promise<Object>} Promise resolving to the orchestration result
 */
export async function orchestrateQuery(queryText, options = {}) {
  if (typeof queryText !== 'string' || queryText.trim().length === 0) {
    logEvent(AUDIT_EVENT_TYPES.QUERY_ERROR, {
      queryText: typeof queryText === 'string' ? queryText : '',
      errorCode: 'INVALID_QUERY',
      message: 'Query text is required.',
    });

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
          errorCode: 'INVALID_QUERY',
          message: 'Query text is required.',
        },
      },
      systems: [],
      timing: {
        startTime: Date.now(),
        endTime: Date.now(),
        durationMs: 0,
        systemTimings: {},
      },
    };
  }

  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    options = {};
  }

  // Log query submission
  logEvent(AUDIT_EVENT_TYPES.QUERY_SUBMIT, {
    queryText: queryText.trim(),
    persona: options.personaId || getCurrentPersona(),
    clusterId: options.clusterId || null,
  });

  try {
    // Interpret the query first
    const intent = interpret(queryText);

    // Merge persona hint from options if not detected
    if (!intent.personaHint && typeof options.personaId === 'string' && options.personaId.length > 0) {
      intent.personaHint = options.personaId;
    }

    // Merge domain from options if not detected
    if (typeof options.clusterId === 'string' && options.clusterId.length > 0) {
      if (!intent.domains.includes(options.clusterId)) {
        intent.domains.push(options.clusterId);
      }
    }

    // Orchestrate the query
    const result = await orchestrate(intent);

    // Log query result
    logEvent(AUDIT_EVENT_TYPES.QUERY_RESULT, {
      queryText: queryText.trim(),
      persona: options.personaId || getCurrentPersona(),
      totalResults: result.aggregatedResults ? result.aggregatedResults.totalResults : 0,
      clusters: result.aggregatedResults ? result.aggregatedResults.clusters : [],
      durationMs: result.timing ? result.timing.durationMs : 0,
    });

    return result;
  } catch {
    logEvent(AUDIT_EVENT_TYPES.QUERY_ERROR, {
      queryText: queryText.trim(),
      errorCode: 'ORCHESTRATION_ERROR',
      message: 'An unexpected error occurred during query orchestration.',
    });

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
          errorCode: 'ORCHESTRATION_ERROR',
          message: 'An unexpected error occurred during query orchestration.',
        },
      },
      systems: [],
      timing: {
        startTime: Date.now(),
        endTime: Date.now(),
        durationMs: 0,
        systemTimings: {},
      },
    };
  }
}

/**
 * Generates contextual CTA bubbles based on a query result and persona context.
 * Returns an array of 3-4 follow-up query suggestions.
 *
 * @param {Object|Object[]} queryResult - The query result object or array of results
 * @param {string} [persona] - The persona key, ID, or name (optional)
 * @returns {Object[]} Array of 3-4 CTA bubble objects
 */
export function getCTABubbles(queryResult, persona) {
  const resolvedPersona = typeof persona === 'string' && persona.trim().length > 0
    ? persona
    : getCurrentPersona();

  const bubbles = generateCTABubbles(queryResult, resolvedPersona);

  logEvent(AUDIT_EVENT_TYPES.CTA_CLICK, {
    action: 'CTA_GENERATED',
    bubbleCount: bubbles.length,
    persona: resolvedPersona,
  });

  return bubbles;
}

/**
 * Executes a simulated action in an enterprise system.
 * Validates inputs, simulates execution, persists the action to the log,
 * and logs an audit event.
 *
 * @param {string} actionType - The type of action to execute (e.g., 'generate-report', 'schedule')
 * @param {Object} [payload={}] - Action-specific payload data
 * @param {string} [targetSystem] - Target system identifier (e.g., 'sap', 'procore')
 * @returns {Promise<Object>} Promise resolving to the execution result
 */
export async function executeAction(actionType, payload = {}, targetSystem) {
  return executeActionService(actionType, payload, targetSystem);
}

/**
 * Determines which enterprise systems contributed to a query result
 * and their contribution levels for the source indicator panel.
 *
 * @param {Object|Object[]} queryResult - The query result object, array of results, or orchestration result
 * @returns {Object[]} Array of source indicator objects for all systems
 */
export function getSourceTransparency(queryResult) {
  return getSourceTransparencyData(queryResult);
}

/**
 * Retrieves the complete action log from localStorage.
 * Returns entries sorted by timestamp in ascending order.
 *
 * @returns {Object[]} Array of all action log entries
 */
export function getActionLog() {
  return getActionLogEntries();
}

/**
 * Orchestrates a raw query using text and optional persona/cluster context.
 * Convenience method that wraps orchestrateRawQuery from OrchestrationEngine.
 *
 * @param {string} queryText - The raw query text
 * @param {Object} [options={}] - Optional parameters
 * @param {string} [options.personaId] - Persona ID for filtering
 * @param {string} [options.clusterId] - Cluster ID for domain filtering
 * @returns {Promise<Object>} Promise resolving to the orchestration result
 */
export async function orchestrateRaw(queryText, options = {}) {
  if (typeof queryText !== 'string' || queryText.trim().length === 0) {
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
          errorCode: 'INVALID_QUERY',
          message: 'Query text is required.',
        },
      },
      systems: [],
      timing: {
        startTime: Date.now(),
        endTime: Date.now(),
        durationMs: 0,
        systemTimings: {},
      },
    };
  }

  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    options = {};
  }

  logEvent(AUDIT_EVENT_TYPES.QUERY_SUBMIT, {
    queryText: queryText.trim(),
    persona: options.personaId || getCurrentPersona(),
    clusterId: options.clusterId || null,
    method: 'orchestrateRaw',
  });

  try {
    const result = await orchestrateRawQuery(queryText, options);

    logEvent(AUDIT_EVENT_TYPES.QUERY_RESULT, {
      queryText: queryText.trim(),
      persona: options.personaId || getCurrentPersona(),
      totalResults: result.aggregatedResults ? result.aggregatedResults.totalResults : 0,
      durationMs: result.timing ? result.timing.durationMs : 0,
      method: 'orchestrateRaw',
    });

    return result;
  } catch {
    logEvent(AUDIT_EVENT_TYPES.QUERY_ERROR, {
      queryText: queryText.trim(),
      errorCode: 'ORCHESTRATION_ERROR',
      message: 'An unexpected error occurred during raw query orchestration.',
      method: 'orchestrateRaw',
    });

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
          errorCode: 'ORCHESTRATION_ERROR',
          message: 'An unexpected error occurred during raw query orchestration.',
        },
      },
      systems: [],
      timing: {
        startTime: Date.now(),
        endTime: Date.now(),
        durationMs: 0,
        systemTimings: {},
      },
    };
  }
}

/**
 * Returns the source transparency summary for a query result.
 *
 * @param {Object|Object[]} queryResult - The query result object or array of results
 * @returns {Object} Source transparency summary
 */
export function getSourceSummary(queryResult) {
  return getSourceTransparencySummary(queryResult);
}

/**
 * Returns only the active (contributing) systems from a query result.
 *
 * @param {Object|Object[]} queryResult - The query result object or array of results
 * @returns {Object[]} Array of source indicators for active systems only
 */
export function getActiveSources(queryResult) {
  return getActiveSourceSystems(queryResult);
}

/**
 * Returns only the inactive (non-contributing) systems from a query result.
 *
 * @param {Object|Object[]} queryResult - The query result object or array of results
 * @returns {Object[]} Array of source indicators for inactive systems only
 */
export function getInactiveSources(queryResult) {
  return getInactiveSourceSystems(queryResult);
}

/**
 * Returns the total number of unique source systems that contributed to a query result.
 *
 * @param {Object|Object[]} queryResult - The query result object or array of results
 * @returns {number} Count of active source systems
 */
export function getSourceCount(queryResult) {
  return getActiveSourceCount(queryResult);
}

/**
 * Returns the overall average confidence across all contributing systems.
 *
 * @param {Object|Object[]} queryResult - The query result object or array of results
 * @returns {number} Average confidence score between 0 and 1
 */
export function getConfidence(queryResult) {
  return getOverallConfidence(queryResult);
}

/**
 * Clears the entire action log from localStorage.
 *
 * @returns {boolean} True if the action log was cleared successfully
 */
export function clearActions() {
  return clearActionLog();
}

/**
 * Returns the total number of action log entries currently stored.
 *
 * @returns {number} The count of action log entries
 */
export function getActionCount() {
  return getActionLogCount();
}

/**
 * Retrieves action log entries filtered by action type.
 *
 * @param {string} actionType - The action type to filter by
 * @returns {Object[]} Array of matching action log entries
 */
export function getActionsByType(actionType) {
  return getActionLogByType(actionType);
}

/**
 * Retrieves action log entries filtered by target system.
 *
 * @param {string} systemId - The system identifier to filter by
 * @returns {Object[]} Array of matching action log entries
 */
export function getActionsBySystem(systemId) {
  return getActionLogBySystem(systemId);
}

/**
 * Retrieves action log entries filtered by status.
 *
 * @param {string} status - The status to filter by ('success', 'error', 'pending')
 * @returns {Object[]} Array of matching action log entries
 */
export function getActionsByStatus(status) {
  return getActionLogByStatus(status);
}

/**
 * Retrieves action log entries filtered by persona ID.
 *
 * @param {string} personaId - The persona identifier to filter by
 * @returns {Object[]} Array of matching action log entries
 */
export function getActionsByPersona(personaId) {
  return getActionLogByPersona(personaId);
}

/**
 * Exports the action log as a JSON string for download or sharing.
 *
 * @returns {string} JSON string representation of the action log
 */
export function exportActions() {
  return exportActionLog();
}

/**
 * Validates whether a query text is suitable for interpretation.
 *
 * @param {string} queryText - The query text to validate
 * @returns {{ valid: boolean, message: string }} Validation result
 */
export function isValidQuery(queryText) {
  return validateQuery(queryText);
}