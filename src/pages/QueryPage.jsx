/**
 * Full query interaction screen for Ask Dreeso Memory.
 * Screen 4: Dedicated query screen with full query input, result display area,
 * CTA bubbles, source indicator panel, and action buttons. Manages all view
 * states (INPUT, LOADING, RESULT, CTA, ACTION, CONFIRMATION) with animated
 * transitions.
 *
 * @module QueryPage
 * @see SCRUM-7892
 * @see SCRUM-7893
 * @see SCRUM-7889
 * @see SCRUM-7890
 * @see SCRUM-7896
 * @see SCRUM-7895
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { useQuery } from '../context/QueryContext';
import { useUIState, TRANSITION_EVENTS } from '../context/UIStateContext';
import GlassCard from '../components/ui/GlassCard';
import AnimatedTransition from '../components/ui/AnimatedTransition';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import QueryInput from '../components/query/QueryInput';
import ResultRenderer from '../components/query/ResultRenderer';
import CTABubbles from '../components/query/CTABubbles';
import SourceIndicatorPanel from '../components/query/SourceIndicatorPanel';
import ActionButton from '../components/actions/ActionButton';
import ActionConfirmation from '../components/actions/ActionConfirmation';
import { SCREEN_IDS, VIEW_STATES } from '../constants';
import { logEvent, AUDIT_EVENT_TYPES } from '../services/AuditLogger';
import { executeAction } from '../services/ActionExecutor';

/**
 * Animation stagger delay in milliseconds between each section.
 * @type {number}
 */
const STAGGER_DELAY_MS = 100;

/**
 * QueryPage component.
 * Renders the full query interaction screen with query input, result display,
 * CTA bubbles, source indicator panel, action buttons, and action confirmation.
 * Manages all view states (INPUT, LOADING, RESULT, CTA, ACTION, CONFIRMATION)
 * with animated transitions.
 *
 * @returns {React.ReactElement|null} The query page component, or null if not authenticated
 */
function QueryPage() {
  const { user, isAuthenticated, persona } = useAuth();
  const { navigateTo } = useNavigation();
  const {
    executeQuery,
    isLoading,
    error,
    results,
    ctaBubbles,
    sourceSystems,
    queryText,
    confidence,
    clearResults,
    clearError,
  } = useQuery();
  const { state, transitionState, addActionTaken } = useUIState();

  const [actionResult, setActionResult] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [actionLabel, setActionLabel] = useState(null);
  const [actionTargetSystem, setActionTargetSystem] = useState(null);
  const [actionExecuting, setActionExecuting] = useState(false);

  /**
   * Determines the current view state from UIStateContext
   */
  const currentView = state.currentView;

  /**
   * Log screen view on mount
   */
  useEffect(() => {
    logEvent(AUDIT_EVENT_TYPES.SCREEN_VIEW, {
      screenId: SCREEN_IDS.QUERY_INPUT,
      screenName: 'Query Page',
      persona,
    });
  }, [persona]);

  /**
   * Handles query submission from QueryInput
   *
   * @param {string} submittedQuery - The submitted query text
   */
  const handleQuerySubmit = useCallback((submittedQuery) => {
    logEvent(AUDIT_EVENT_TYPES.QUERY_SUBMIT, {
      action: 'QUERY_PAGE_SUBMIT',
      queryText: submittedQuery,
      persona,
    });

    // Reset action state when a new query is submitted
    setActionResult(null);
    setActionType(null);
    setActionLabel(null);
    setActionTargetSystem(null);
  }, [persona]);

  /**
   * Handles action button click from ResultRenderer
   *
   * @param {Object} action - The action object that was clicked
   */
  const handleActionClick = useCallback(async (action) => {
    if (!action || typeof action !== 'object' || actionExecuting) {
      return;
    }

    const type = typeof action.type === 'string' ? action.type : 'workflow';
    const label = typeof action.label === 'string' ? action.label : 'Execute Action';
    const target = typeof action.target === 'string' ? action.target : null;
    const actionId = typeof action.id === 'string' ? action.id : null;
    const priority = typeof action.priority === 'string' ? action.priority : 'medium';

    setActionType(type);
    setActionLabel(label);
    setActionTargetSystem(target);
    setActionExecuting(true);

    logEvent(AUDIT_EVENT_TYPES.ACTION_EXECUTE, {
      action: 'QUERY_PAGE_ACTION_CLICK',
      actionType: type,
      actionLabel: label,
      actionId,
      persona,
    });

    // Transition to ACTION view state
    transitionState(TRANSITION_EVENTS.ACTION_EXECUTE, {
      actionType: type,
      actionLabel: label,
    });

    try {
      const payload = {
        target: target || undefined,
        actionId: actionId || undefined,
      };

      const result = await executeAction(type, payload);

      if (result) {
        setActionResult(result);

        // Record action taken in UI state
        addActionTaken({
          id: result.id,
          actionType: type,
          targetSystem: target,
          label,
          status: result.status,
          message: result.message,
          timestamp: result.timestamp,
        });

        // Transition to CONFIRMATION view state
        transitionState(TRANSITION_EVENTS.ACTION_SUCCESS, {
          result,
        });
      }
    } catch {
      const errorResult = {
        success: false,
        message: 'An unexpected error occurred during action execution.',
        status: 'error',
        details: null,
        id: null,
        timestamp: new Date().toISOString(),
      };

      setActionResult(errorResult);

      transitionState(TRANSITION_EVENTS.ACTION_ERROR, {
        error: { message: errorResult.message },
      });
    } finally {
      setActionExecuting(false);
    }
  }, [actionExecuting, persona, transitionState, addActionTaken]);

  /**
   * Handles starting a new query by resetting state
   */
  const handleNewQuery = useCallback(() => {
    logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {
      action: 'QUERY_PAGE_NEW_QUERY',
      persona,
    });

    clearResults();
    setActionResult(null);
    setActionType(null);
    setActionLabel(null);
    setActionTargetSystem(null);

    transitionState(TRANSITION_EVENTS.RESET, {});
  }, [persona, clearResults, transitionState]);

  /**
   * Handles CTA bubble click
   *
   * @param {Object} bubble - The clicked CTA bubble object
   */
  const handleBubbleClick = useCallback((bubble) => {
    logEvent(AUDIT_EVENT_TYPES.CTA_CLICK, {
      action: 'QUERY_PAGE_CTA_CLICK',
      bubbleLabel: bubble ? bubble.label : null,
      bubbleType: bubble ? bubble.type : null,
      persona,
    });

    // Reset action state when following up
    setActionResult(null);
    setActionType(null);
    setActionLabel(null);
    setActionTargetSystem(null);
  }, [persona]);

  /**
   * Handles undo from ActionConfirmation
   *
   * @param {Object} result - The action result to undo
   */
  const handleUndo = useCallback((result) => {
    logEvent(AUDIT_EVENT_TYPES.ACTION_EXECUTE, {
      action: 'QUERY_PAGE_UNDO',
      executionId: result ? result.id : null,
      persona,
    });
  }, [persona]);

  /**
   * Handles proceed from ActionConfirmation
   *
   * @param {Object} result - The action result
   */
  const handleProceed = useCallback((result) => {
    logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {
      action: 'QUERY_PAGE_PROCEED',
      executionId: result ? result.id : null,
      persona,
    });

    navigateTo(SCREEN_IDS.DASHBOARD);
  }, [persona, navigateTo]);

  /**
   * Handles dismiss from ActionConfirmation
   */
  const handleDismissConfirmation = useCallback(() => {
    setActionResult(null);
    setActionType(null);
    setActionLabel(null);
    setActionTargetSystem(null);

    // Return to result view if we have results, otherwise input
    if (results) {
      transitionState(TRANSITION_EVENTS.NAVIGATE, {
        screenId: SCREEN_IDS.QUERY_INPUT,
        viewState: VIEW_STATES.RESULT,
      });
    } else {
      transitionState(TRANSITION_EVENTS.RESET, {});
    }
  }, [results, transitionState]);

  /**
   * Handles action execution callback from ActionButton component
   *
   * @param {Object} executionInfo - The execution info
   */
  const handleActionExecute = useCallback((executionInfo) => {
    logEvent(AUDIT_EVENT_TYPES.ACTION_EXECUTE, {
      action: 'QUERY_PAGE_ACTION_BUTTON_EXECUTE',
      ...executionInfo,
      persona,
    });
  }, [persona]);

  /**
   * Handles action success callback from ActionButton component
   *
   * @param {Object} result - The action result
   */
  const handleActionSuccess = useCallback((result) => {
    logEvent(AUDIT_EVENT_TYPES.ACTION_SUCCESS, {
      action: 'QUERY_PAGE_ACTION_BUTTON_SUCCESS',
      executionId: result ? result.id : null,
      persona,
    });
  }, [persona]);

  /**
   * Handles action error callback from ActionButton component
   *
   * @param {Object} result - The error result
   */
  const handleActionError = useCallback((result) => {
    logEvent(AUDIT_EVENT_TYPES.ACTION_ERROR, {
      action: 'QUERY_PAGE_ACTION_BUTTON_ERROR',
      message: result ? result.message : null,
      persona,
    });
  }, [persona]);

  /**
   * Determines whether to show the input section
   */
  const showInput = currentView === VIEW_STATES.INPUT ||
    currentView === VIEW_STATES.RESULT ||
    currentView === VIEW_STATES.CTA;

  /**
   * Determines whether to show the loading section
   */
  const showLoading = currentView === VIEW_STATES.LOADING || isLoading;

  /**
   * Determines whether to show the results section
   */
  const showResults = (currentView === VIEW_STATES.RESULT ||
    currentView === VIEW_STATES.CTA) &&
    !isLoading &&
    results !== null;

  /**
   * Determines whether to show the CTA bubbles
   */
  const showCTABubbles = (currentView === VIEW_STATES.RESULT ||
    currentView === VIEW_STATES.CTA) &&
    !isLoading &&
    results !== null;

  /**
   * Determines whether to show the source indicator panel
   */
  const showSourcePanel = (currentView === VIEW_STATES.RESULT ||
    currentView === VIEW_STATES.CTA) &&
    !isLoading &&
    results !== null;

  /**
   * Determines whether to show the action confirmation
   */
  const showConfirmation = (currentView === VIEW_STATES.CONFIRMATION ||
    currentView === VIEW_STATES.ACTION) &&
    actionResult !== null;

  /**
   * Determines whether to show the action executing state
   */
  const showActionExecuting = currentView === VIEW_STATES.ACTION &&
    actionExecuting &&
    actionResult === null;

  /**
   * Extracts suggested actions from the results for the action buttons section
   */
  const suggestedActions = useMemo(() => {
    if (!results || typeof results !== 'object') {
      return [];
    }

    const actions = [];

    if (results.aggregatedResults && Array.isArray(results.aggregatedResults.results)) {
      for (const result of results.aggregatedResults.results) {
        if (result && Array.isArray(result.actions)) {
          for (const action of result.actions) {
            if (action && typeof action.id === 'string') {
              // Avoid duplicates
              if (!actions.some((a) => a.id === action.id)) {
                actions.push(action);
              }
            }
          }
        }
      }
    }

    return actions;
  }, [results]);

  // Do not render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      {/* Page Header */}
      <AnimatedTransition show type="fade" duration="normal">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 bg-accent-blue bg-opacity-20"
              aria-hidden="true"
            >
              🔍
            </span>
            <div className="flex flex-col">
              <h1 className="text-xl font-semibold text-primary-50 leading-tight">
                Ask Dreeso
              </h1>
              <p className="text-sm text-primary-200 leading-tight">
                Ask a question in natural language to query your enterprise systems
              </p>
            </div>
          </div>

          {/* Back to Dashboard */}
          <button
            type="button"
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-glass-sm',
              'text-xs font-medium text-primary-200 border border-glass-border',
              'hover:bg-glass-light hover:text-primary-50 hover:border-primary-300',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
              'flex-shrink-0',
            ]
              .filter(Boolean)
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim()}
            onClick={() => navigateTo(SCREEN_IDS.DASHBOARD)}
            aria-label="Back to dashboard"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Dashboard</span>
          </button>
        </div>
      </AnimatedTransition>

      {/* Query Input Section */}
      <AnimatedTransition
        show={showInput}
        type="fade"
        duration="normal"
        delay={STAGGER_DELAY_MS}
      >
        <QueryInput
          placeholder="Ask Dreeso anything about your projects, finances, workforce, or pipeline..."
          autoFocus={currentView === VIEW_STATES.INPUT}
          onQuerySubmit={handleQuerySubmit}
        />
      </AnimatedTransition>

      {/* Loading State */}
      <AnimatedTransition
        show={showLoading}
        type="fade"
        duration="fast"
        unmountOnExit
      >
        <GlassCard variant="default" padding="lg" animated>
          <LoadingSpinner
            size="lg"
            message="Querying intelligence systems across your enterprise..."
            className="py-12"
          />
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full bg-green-400 animate-pulse"
                aria-hidden="true"
              />
              <span className="text-xs text-primary-300">
                Connecting to systems
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full bg-accent-blue animate-pulse"
                style={{ animationDelay: '150ms' }}
                aria-hidden="true"
              />
              <span className="text-xs text-primary-300">
                Aggregating results
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full bg-accent-purple animate-pulse"
                style={{ animationDelay: '300ms' }}
                aria-hidden="true"
              />
              <span className="text-xs text-primary-300">
                Analyzing data
              </span>
            </div>
          </div>
        </GlassCard>
      </AnimatedTransition>

      {/* Error State */}
      <AnimatedTransition
        show={Boolean(error) && !isLoading && !showConfirmation}
        type="slide-up"
        duration="fast"
        unmountOnExit
      >
        <GlassCard variant="default" padding="lg" animated>
          <div className="flex flex-col items-center text-center py-8">
            <span className="text-3xl mb-4" aria-hidden="true">⚠️</span>
            <h3 className="text-lg font-semibold text-primary-50 mb-2">
              Query Error
            </h3>
            <p className="text-sm text-primary-200 mb-6 max-w-md">
              {error && error.message
                ? error.message
                : 'An unexpected error occurred while processing your query.'}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className={[
                  'flex items-center gap-2 px-5 py-2.5 rounded-glass-sm',
                  'bg-accent-blue text-sm font-semibold text-white',
                  'hover:bg-opacity-90 transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
                ]
                  .filter(Boolean)
                  .join(' ')
                  .replace(/\s+/g, ' ')
                  .trim()}
                onClick={handleNewQuery}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Try Again</span>
              </button>
            </div>
          </div>
        </GlassCard>
      </AnimatedTransition>

      {/* Results Section */}
      <AnimatedTransition
        show={showResults}
        type="slide-up"
        duration="normal"
        delay={STAGGER_DELAY_MS}
      >
        <ResultRenderer
          results={results}
          isLoading={false}
          error={null}
          queryText={queryText || ''}
          confidence={confidence}
          onActionClick={handleActionClick}
          onNewQuery={handleNewQuery}
        />
      </AnimatedTransition>

      {/* Source Indicator Panel + CTA Bubbles Row */}
      {showResults ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CTA Bubbles */}
          <div className="lg:col-span-2">
            <AnimatedTransition
              show={showCTABubbles}
              type="slide-up"
              duration="normal"
              delay={STAGGER_DELAY_MS * 2}
            >
              <CTABubbles
                queryResult={results}
                bubbles={ctaBubbles.length > 0 ? ctaBubbles : undefined}
                onBubbleClick={handleBubbleClick}
                showHeader
              />
            </AnimatedTransition>

            {/* Suggested Actions */}
            {suggestedActions.length > 0 ? (
              <AnimatedTransition
                show
                type="slide-up"
                duration="normal"
                delay={STAGGER_DELAY_MS * 3}
              >
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs bg-accent-purple bg-opacity-20"
                      aria-hidden="true"
                    >
                      ⚡
                    </span>
                    <p className="text-xs text-primary-300 font-semibold uppercase tracking-wider">
                      Available Actions
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestedActions.map((action, index) => (
                      <ActionButton
                        key={action.id || `action-btn-${index}`}
                        actionType={typeof action.type === 'string' ? action.type : 'workflow'}
                        label={typeof action.label === 'string' ? action.label : 'Action'}
                        actionId={typeof action.id === 'string' ? action.id : undefined}
                        targetSystem={typeof action.target === 'string' ? action.target : undefined}
                        variant={action.priority === 'high' ? 'primary' : 'secondary'}
                        size="sm"
                        showSystemBadge
                        showIcon
                        disabled={actionExecuting}
                        onExecute={handleActionExecute}
                        onSuccess={handleActionSuccess}
                        onError={handleActionError}
                      />
                    ))}
                  </div>
                </div>
              </AnimatedTransition>
            ) : null}
          </div>

          {/* Source Indicator Panel */}
          <div className="lg:col-span-1">
            <AnimatedTransition
              show={showSourcePanel}
              type="slide-up"
              duration="normal"
              delay={STAGGER_DELAY_MS * 2}
            >
              <SourceIndicatorPanel
                queryResult={results}
                compact={false}
                showHeader
                showSummary
                showInactive
              />
            </AnimatedTransition>
          </div>
        </div>
      ) : null}

      {/* Action Executing State */}
      <AnimatedTransition
        show={showActionExecuting}
        type="fade"
        duration="fast"
        unmountOnExit
      >
        <GlassCard variant="default" padding="lg" animated>
          <LoadingSpinner
            size="lg"
            message={`Executing: ${actionLabel || 'Action'}...`}
            className="py-12"
          />
        </GlassCard>
      </AnimatedTransition>

      {/* Action Confirmation */}
      <AnimatedTransition
        show={showConfirmation}
        type="scale"
        duration="normal"
        unmountOnExit
      >
        <ActionConfirmation
          result={actionResult}
          actionType={actionType}
          actionLabel={actionLabel}
          targetSystem={actionTargetSystem}
          showUndo
          showProceed
          showDetails
          onUndo={handleUndo}
          onProceed={handleProceed}
          onNewQuery={handleNewQuery}
          onDismiss={handleDismissConfirmation}
        />
      </AnimatedTransition>

      {/* Empty State - No query submitted yet */}
      {currentView === VIEW_STATES.INPUT && !isLoading && !results && !error && !showConfirmation ? (
        <AnimatedTransition
          show
          type="fade"
          duration="normal"
          delay={STAGGER_DELAY_MS * 2}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tips Card */}
            <GlassCard variant="default" padding="md" animated>
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-blue bg-opacity-20"
                  aria-hidden="true"
                >
                  💡
                </span>
                <h2 className="text-sm font-semibold text-primary-50 leading-tight">
                  Tips for Better Results
                </h2>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-2.5 px-3 py-2 rounded-glass-sm bg-glass-light">
                  <span className="text-sm flex-shrink-0 mt-0.5" aria-hidden="true">🎯</span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-primary-100">Be Specific</span>
                    <span className="text-xs text-primary-300">
                      Include project names, time periods, or metrics for more targeted results.
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 px-3 py-2 rounded-glass-sm bg-glass-light">
                  <span className="text-sm flex-shrink-0 mt-0.5" aria-hidden="true">📊</span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-primary-100">Ask About Trends</span>
                    <span className="text-xs text-primary-300">
                      Use words like &ldquo;trend&rdquo;, &ldquo;forecast&rdquo;, or &ldquo;compare&rdquo; for analytical insights.
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 px-3 py-2 rounded-glass-sm bg-glass-light">
                  <span className="text-sm flex-shrink-0 mt-0.5" aria-hidden="true">⚡</span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-primary-100">Request Actions</span>
                    <span className="text-xs text-primary-300">
                      Ask to &ldquo;generate&rdquo;, &ldquo;schedule&rdquo;, or &ldquo;escalate&rdquo; to trigger enterprise actions.
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Persona CTA Bubbles */}
            <GlassCard variant="default" padding="md" animated>
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-teal bg-opacity-20"
                  aria-hidden="true"
                >
                  🚀
                </span>
                <h2 className="text-sm font-semibold text-primary-50 leading-tight">
                  Quick Start
                </h2>
              </div>
              <CTABubbles
                onBubbleClick={handleBubbleClick}
                showHeader={false}
              />
            </GlassCard>
          </div>
        </AnimatedTransition>
      ) : null}

      {/* Footer */}
      <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 4}>
        <div className="flex items-center justify-center py-4">
          <p className="text-xs text-primary-300">
            {import.meta.env.VITE_APP_TITLE || 'Ask Dreeso Memory'}{' '}
            v{import.meta.env.VITE_APP_VERSION || '1.0.0'} · Powered by multi-system intelligence
          </p>
        </div>
      </AnimatedTransition>
    </div>
  );
}

export default QueryPage;