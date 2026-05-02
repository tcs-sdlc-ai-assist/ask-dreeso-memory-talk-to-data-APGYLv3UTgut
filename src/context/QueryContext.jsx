/**
 * Query execution state management context and provider for Ask Dreeso Memory.
 * Manages query state, results, loading, error, CTA bubbles, and source transparency.
 * Integrates with QueryOrchestrationFacade and UIStateContext.
 *
 * @module QueryContext
 * @see SCRUM-7892
 * @see SCRUM-7893
 * @see SCRUM-7897
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  orchestrateQuery,
  interpretQuery,
  getCTABubbles,
  getSourceTransparency,
  getSourceSummary,
  getActiveSources,
  getConfidence,
  isValidQuery,
} from '../services/QueryOrchestrationFacade';
import { useUIState, TRANSITION_EVENTS } from './UIStateContext';
import { logEvent, AUDIT_EVENT_TYPES } from '../services/AuditLogger';
import { getSession } from '../services/SessionManager';

/**
 * @typedef {Object} QueryContextValue
 * @property {function(string, Object=): Promise<Object>} executeQuery - Executes a query with optional options
 * @property {function(): Object|null} getQueryResult - Returns the current query result
 * @property {boolean} isLoading - Whether a query is currently in progress
 * @property {Object|null} error - Current error object or null
 * @property {Object|null} results - Current orchestration results or null
 * @property {Object[]} ctaBubbles - Current CTA bubble suggestions
 * @property {Object[]} sourceSystems - Current source transparency indicators
 * @property {string|null} queryText - Current query text or null
 * @property {Object|null} interpretation - Current query interpretation or null
 * @property {number} confidence - Overall confidence score for current results
 * @property {function(): void} clearResults - Clears the current query results and state
 * @property {function(): void} clearError - Clears the current error state
 * @property {function(string): Object} validateQuery - Validates a query text
 */

const QueryContext = createContext(null);

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
 * Query Provider component.
 * Wraps children with the QueryContext and manages all query execution state.
 * Must be used within a UIStateProvider.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactElement} The provider component
 */
export function QueryProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [ctaBubbles, setCtaBubbles] = useState([]);
  const [sourceSystems, setSourceSystems] = useState([]);
  const [queryText, setQueryText] = useState(null);
  const [interpretation, setInterpretation] = useState(null);
  const [confidence, setConfidence] = useState(0);

  const { transitionState, setQueryResult, setQueryText: setUIQueryText, setLoading: setUILoading, setError: setUIError, clearError: clearUIError, clearQueryResult } = useUIState();

  /**
   * Executes a natural language query through the orchestration engine.
   * Updates local state, UIStateContext, and generates CTA bubbles and source transparency.
   *
   * @param {string} text - The natural language query text
   * @param {Object} [options={}] - Optional parameters
   * @param {string} [options.personaId] - Persona ID for filtering
   * @param {string} [options.clusterId] - Cluster ID for domain filtering
   * @returns {Promise<Object>} Promise resolving to the orchestration result
   */
  const executeQueryHandler = useCallback(async (text, options = {}) => {
    if (typeof text !== 'string' || text.trim().length === 0) {
      const errorObj = {
        errorCode: 'INVALID_QUERY',
        message: 'Query text is required.',
      };
      setError(errorObj);
      setUIError(errorObj);

      logEvent(AUDIT_EVENT_TYPES.QUERY_ERROR, {
        queryText: '',
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
          error: errorObj,
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

    // Validate query
    const validation = isValidQuery(text);
    if (!validation.valid) {
      const errorObj = {
        errorCode: 'INVALID_QUERY',
        message: validation.message,
      };
      setError(errorObj);
      setUIError(errorObj);

      logEvent(AUDIT_EVENT_TYPES.QUERY_ERROR, {
        queryText: text.trim(),
        errorCode: 'INVALID_QUERY',
        message: validation.message,
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
          error: errorObj,
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

    const trimmedText = text.trim();

    // Set loading state
    setIsLoading(true);
    setError(null);
    setQueryText(trimmedText);
    setUIQueryText(trimmedText);

    // Transition UI state to LOADING
    transitionState(TRANSITION_EVENTS.QUERY_SUBMIT, {
      queryText: trimmedText,
    });

    // Resolve persona
    const persona = typeof options.personaId === 'string' && options.personaId.length > 0
      ? options.personaId
      : getCurrentPersona();

    try {
      // Interpret the query
      const queryInterpretation = interpretQuery(trimmedText);
      setInterpretation(queryInterpretation);

      // Orchestrate the query
      const orchestrationOptions = {
        personaId: persona || undefined,
        clusterId: typeof options.clusterId === 'string' && options.clusterId.length > 0
          ? options.clusterId
          : undefined,
      };

      const orchestrationResult = await orchestrateQuery(trimmedText, orchestrationOptions);

      // Check for orchestration errors
      if (
        orchestrationResult &&
        orchestrationResult.aggregatedResults &&
        orchestrationResult.aggregatedResults.error
      ) {
        const orchError = orchestrationResult.aggregatedResults.error;
        const errorObj = {
          errorCode: orchError.errorCode || 'ORCHESTRATION_ERROR',
          message: orchError.message || 'An error occurred during query execution.',
        };

        setError(errorObj);
        setResults(null);
        setCtaBubbles([]);
        setSourceSystems([]);
        setConfidence(0);
        setIsLoading(false);

        // Transition UI state to error
        transitionState(TRANSITION_EVENTS.QUERY_ERROR, {
          error: errorObj,
        });

        return orchestrationResult;
      }

      // Update results
      setResults(orchestrationResult);

      // Generate CTA bubbles
      const bubbles = getCTABubbles(orchestrationResult, persona);
      setCtaBubbles(bubbles);

      // Generate source transparency
      const sources = getSourceTransparency(orchestrationResult);
      setSourceSystems(sources);

      // Calculate confidence
      const overallConfidence = getConfidence(orchestrationResult);
      setConfidence(overallConfidence);

      // Update UI state context
      setQueryResult(orchestrationResult);

      // Transition UI state to RESULT
      transitionState(TRANSITION_EVENTS.QUERY_SUCCESS, {
        result: orchestrationResult,
      });

      setIsLoading(false);

      return orchestrationResult;
    } catch {
      const errorObj = {
        errorCode: 'QUERY_EXECUTION_ERROR',
        message: 'An unexpected error occurred during query execution.',
      };

      setError(errorObj);
      setResults(null);
      setCtaBubbles([]);
      setSourceSystems([]);
      setConfidence(0);
      setIsLoading(false);

      // Transition UI state to error
      transitionState(TRANSITION_EVENTS.QUERY_ERROR, {
        error: errorObj,
      });

      logEvent(AUDIT_EVENT_TYPES.QUERY_ERROR, {
        queryText: trimmedText,
        errorCode: 'QUERY_EXECUTION_ERROR',
        message: 'An unexpected error occurred during query execution.',
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
          error: errorObj,
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
  }, [transitionState, setQueryResult, setUIQueryText, setUIError]);

  /**
   * Returns the current query result.
   *
   * @returns {Object|null} The current orchestration result or null
   */
  const getQueryResultHandler = useCallback(() => {
    return results;
  }, [results]);

  /**
   * Clears the current query results and resets state.
   */
  const clearResults = useCallback(() => {
    setResults(null);
    setCtaBubbles([]);
    setSourceSystems([]);
    setQueryText(null);
    setInterpretation(null);
    setConfidence(0);
    setError(null);
    setIsLoading(false);
    clearQueryResult();
    clearUIError();
  }, [clearQueryResult, clearUIError]);

  /**
   * Clears the current error state.
   */
  const clearError = useCallback(() => {
    setError(null);
    clearUIError();
  }, [clearUIError]);

  /**
   * Validates a query text for suitability.
   *
   * @param {string} text - The query text to validate
   * @returns {{ valid: boolean, message: string }} Validation result
   */
  const validateQueryHandler = useCallback((text) => {
    return isValidQuery(text);
  }, []);

  const contextValue = useMemo(() => ({
    executeQuery: executeQueryHandler,
    getQueryResult: getQueryResultHandler,
    isLoading,
    error,
    results,
    ctaBubbles,
    sourceSystems,
    queryText,
    interpretation,
    confidence,
    clearResults,
    clearError,
    validateQuery: validateQueryHandler,
  }), [
    executeQueryHandler,
    getQueryResultHandler,
    isLoading,
    error,
    results,
    ctaBubbles,
    sourceSystems,
    queryText,
    interpretation,
    confidence,
    clearResults,
    clearError,
    validateQueryHandler,
  ]);

  return (
    <QueryContext.Provider value={contextValue}>
      {children}
    </QueryContext.Provider>
  );
}

QueryProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Custom hook to access the query context.
 * Must be used within a QueryProvider.
 *
 * @returns {QueryContextValue} The query context value
 * @throws {Error} If used outside of QueryProvider
 */
export function useQuery() {
  const context = useContext(QueryContext);

  if (context === null) {
    throw new Error('useQuery must be used within a QueryProvider.');
  }

  return context;
}

export default QueryContext;