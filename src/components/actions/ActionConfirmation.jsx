/**
 * Action confirmation display component for Ask Dreeso Memory.
 * Shows execution result, target system, timestamp, and success/failure status.
 * Includes option to undo or proceed with next actions.
 *
 * @module ActionConfirmation
 * @see SCRUM-7896
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import GlassCard from '../ui/GlassCard';
import AnimatedTransition from '../ui/AnimatedTransition';
import { useUIState, TRANSITION_EVENTS } from '../../context/UIStateContext';
import { useNavigation } from '../../context/NavigationContext';
import { logEvent, AUDIT_EVENT_TYPES } from '../../services/AuditLogger';
import { SYSTEMS, SCREEN_IDS } from '../../constants';

/**
 * Duration in milliseconds before the undo option expires.
 * @type {number}
 */
const UNDO_WINDOW_MS = 10000;

/**
 * Resolves a system ID to its display label.
 *
 * @param {string|null} systemId - The system identifier
 * @returns {string} The display label for the system
 */
function getSystemLabel(systemId) {
  if (typeof systemId !== 'string' || systemId.trim().length === 0) {
    return 'System';
  }

  const systemValues = Object.values(SYSTEMS);
  const match = systemValues.find((s) => s.id === systemId);
  return match ? match.label : systemId;
}

/**
 * Resolves a system ID to its brand color.
 *
 * @param {string|null} systemId - The system identifier
 * @returns {string} The brand color hex string
 */
function getSystemColor(systemId) {
  if (typeof systemId !== 'string' || systemId.trim().length === 0) {
    return '#3B82F6';
  }

  const systemValues = Object.values(SYSTEMS);
  const match = systemValues.find((s) => s.id === systemId);
  return match ? match.color : '#3B82F6';
}

/**
 * Formats an ISO timestamp to a human-readable string.
 *
 * @param {string|null} isoTimestamp - ISO 8601 timestamp string
 * @returns {string} Formatted date/time string
 */
function formatTimestamp(isoTimestamp) {
  if (typeof isoTimestamp !== 'string' || isoTimestamp.length === 0) {
    return 'Just now';
  }

  try {
    const date = new Date(isoTimestamp);
    if (isNaN(date.getTime())) {
      return 'Just now';
    }
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Just now';
  }
}

/**
 * Resolves the status icon for a given execution status.
 *
 * @param {string} status - The execution status ('success', 'error', 'pending')
 * @returns {string} An emoji representing the status
 */
function getStatusIcon(status) {
  switch (status) {
    case 'success':
      return '✅';
    case 'error':
      return '❌';
    case 'pending':
      return '⏳';
    default:
      return '⚡';
  }
}

/**
 * Resolves the status color classes for a given execution status.
 *
 * @param {string} status - The execution status ('success', 'error', 'pending')
 * @returns {{ bg: string, text: string, border: string }} Tailwind classes for the status
 */
function getStatusClasses(status) {
  switch (status) {
    case 'success':
      return {
        bg: 'bg-green-400 bg-opacity-10',
        text: 'text-green-400',
        border: 'border-green-400 border-opacity-20',
      };
    case 'error':
      return {
        bg: 'bg-red-400 bg-opacity-10',
        text: 'text-red-400',
        border: 'border-red-400 border-opacity-20',
      };
    case 'pending':
      return {
        bg: 'bg-amber-400 bg-opacity-10',
        text: 'text-amber-400',
        border: 'border-amber-400 border-opacity-20',
      };
    default:
      return {
        bg: 'bg-glass-light',
        text: 'text-primary-200',
        border: 'border-glass-border',
      };
  }
}

/**
 * Resolves a human-readable status label.
 *
 * @param {string} status - The execution status
 * @returns {string} Human-readable status label
 */
function getStatusLabel(status) {
  switch (status) {
    case 'success':
      return 'Completed Successfully';
    case 'error':
      return 'Execution Failed';
    case 'pending':
      return 'Awaiting Approval';
    default:
      return 'Unknown Status';
  }
}

/**
 * DetailRow sub-component.
 * Renders a single key-value detail row.
 *
 * @param {Object} props
 * @param {string} props.label - The detail label
 * @param {React.ReactNode} props.value - The detail value
 * @returns {React.ReactElement} The detail row element
 */
function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2 rounded-glass-sm bg-glass-light">
      <span className="text-xs text-primary-300 flex-shrink-0 min-w-[100px]">
        {label}
      </span>
      <span className="text-sm text-primary-100 text-right break-words min-w-0">
        {value}
      </span>
    </div>
  );
}

DetailRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
};

/**
 * ActionConfirmation component.
 * Displays the result of an action execution including status, target system,
 * timestamp, message, and optional details. Provides undo and proceed options.
 *
 * @param {Object} props
 * @param {Object|null} [props.result=null] - The action execution result object
 * @param {string} [props.result.id] - Unique execution identifier
 * @param {boolean} [props.result.success] - Whether the action succeeded
 * @param {string} [props.result.message] - Result message
 * @param {string} [props.result.timestamp] - ISO timestamp of execution
 * @param {string} [props.result.status] - Execution status ('success', 'error', 'pending')
 * @param {Object|null} [props.result.details] - Additional result details
 * @param {string|null} [props.actionType=null] - The type of action that was executed
 * @param {string|null} [props.actionLabel=null] - Display label for the action
 * @param {string|null} [props.targetSystem=null] - Target system identifier
 * @param {boolean} [props.showUndo=true] - Whether to show the undo option
 * @param {boolean} [props.showProceed=true] - Whether to show the proceed option
 * @param {boolean} [props.showDetails=true] - Whether to show the details section
 * @param {function} [props.onUndo] - Callback fired when undo is clicked
 * @param {function} [props.onProceed] - Callback fired when proceed is clicked
 * @param {function} [props.onNewQuery] - Callback fired when new query is clicked
 * @param {function} [props.onDismiss] - Callback fired when dismiss is clicked
 * @param {string} [props.className=''] - Additional CSS classes to apply
 * @returns {React.ReactElement} The action confirmation component
 */
function ActionConfirmation({
  result,
  actionType,
  actionLabel,
  targetSystem,
  showUndo,
  showProceed,
  showDetails,
  onUndo,
  onProceed,
  onNewQuery,
  onDismiss,
  className,
}) {
  const [undoExpired, setUndoExpired] = useState(false);
  const [undoTriggered, setUndoTriggered] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const undoTimerRef = useRef(null);
  const mountedRef = useRef(true);

  const { transitionState } = useUIState();
  const { navigateTo } = useNavigation();

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (undoTimerRef.current !== null) {
        clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }
    };
  }, []);

  /**
   * Start undo expiry timer when result is available and status is success
   */
  useEffect(() => {
    if (
      result &&
      result.status === 'success' &&
      showUndo &&
      !undoExpired &&
      !undoTriggered
    ) {
      if (undoTimerRef.current !== null) {
        clearTimeout(undoTimerRef.current);
      }

      undoTimerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setUndoExpired(true);
        }
      }, UNDO_WINDOW_MS);
    }

    return () => {
      if (undoTimerRef.current !== null) {
        clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }
    };
  }, [result, showUndo, undoExpired, undoTriggered]);

  /**
   * Handles the undo action
   */
  const handleUndo = useCallback(() => {
    if (undoExpired || undoTriggered) {
      return;
    }

    setUndoTriggered(true);

    if (undoTimerRef.current !== null) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }

    logEvent(AUDIT_EVENT_TYPES.ACTION_EXECUTE, {
      action: 'UNDO',
      executionId: result ? result.id : null,
      actionType: actionType || null,
      targetSystem: targetSystem || null,
    });

    if (typeof onUndo === 'function') {
      onUndo(result);
    }
  }, [undoExpired, undoTriggered, result, actionType, targetSystem, onUndo]);

  /**
   * Handles the proceed action
   */
  const handleProceed = useCallback(() => {
    logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {
      action: 'PROCEED_FROM_CONFIRMATION',
      executionId: result ? result.id : null,
      actionType: actionType || null,
    });

    if (typeof onProceed === 'function') {
      onProceed(result);
    } else {
      navigateTo(SCREEN_IDS.DASHBOARD);
    }
  }, [result, actionType, onProceed, navigateTo]);

  /**
   * Handles the new query action
   */
  const handleNewQuery = useCallback(() => {
    logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {
      action: 'NEW_QUERY_FROM_CONFIRMATION',
      executionId: result ? result.id : null,
    });

    if (typeof onNewQuery === 'function') {
      onNewQuery();
    } else {
      transitionState(TRANSITION_EVENTS.RESET, {});
      navigateTo(SCREEN_IDS.QUERY_INPUT);
    }
  }, [result, onNewQuery, transitionState, navigateTo]);

  /**
   * Handles the dismiss action
   */
  const handleDismiss = useCallback(() => {
    if (typeof onDismiss === 'function') {
      onDismiss();
    }
  }, [onDismiss]);

  /**
   * Toggles the details section
   */
  const toggleDetails = useCallback(() => {
    setDetailsExpanded((prev) => !prev);
  }, []);

  // Resolve result properties with safe defaults
  const isSuccess = result ? result.success === true : false;
  const status = result && typeof result.status === 'string' ? result.status : (isSuccess ? 'success' : 'error');
  const message = result && typeof result.message === 'string' ? result.message : (isSuccess ? 'Action completed successfully.' : 'Action execution failed.');
  const timestamp = result && typeof result.timestamp === 'string' ? result.timestamp : null;
  const executionId = result && typeof result.id === 'string' ? result.id : null;
  const details = result && result.details && typeof result.details === 'object' && !Array.isArray(result.details) ? result.details : null;

  const statusClasses = getStatusClasses(status);
  const statusLabel = getStatusLabel(status);
  const statusIcon = getStatusIcon(status);
  const systemLabel = targetSystem ? getSystemLabel(targetSystem) : null;
  const systemColor = targetSystem ? getSystemColor(targetSystem) : null;

  const canUndo = showUndo && status === 'success' && !undoExpired && !undoTriggered;

  // Build detail entries from the details object
  const detailEntries = [];
  if (details) {
    const entries = Object.entries(details);
    for (const [key, value] of entries) {
      if (value === null || value === undefined) {
        continue;
      }

      if (Array.isArray(value)) {
        if (value.length > 0) {
          const displayValue = value
            .map((item) => {
              if (typeof item === 'string') {
                return item;
              }
              if (item && typeof item === 'object') {
                if (typeof item.name === 'string') {
                  return item.name;
                }
                if (typeof item.recipient === 'string') {
                  return item.recipient;
                }
                if (typeof item.approver === 'string') {
                  return `${item.approver} (${item.status || 'pending'})`;
                }
                return JSON.stringify(item);
              }
              return String(item);
            })
            .join(', ');

          detailEntries.push({
            key,
            label: key.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').trim(),
            value: displayValue,
          });
        }
      } else if (typeof value === 'object') {
        // Skip nested objects
        continue;
      } else {
        detailEntries.push({
          key,
          label: key.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').trim(),
          value: String(value),
        });
      }
    }
  }

  const wrapperClassName = [
    'w-full',
    className || '',
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Empty state: no result provided
  if (!result) {
    return (
      <div className={wrapperClassName}>
        <GlassCard variant="default" padding="lg" animated>
          <div className="flex flex-col items-center text-center py-8">
            <span className="text-3xl mb-4" aria-hidden="true">⚡</span>
            <h3 className="text-lg font-semibold text-primary-50 mb-2">
              No Action Result
            </h3>
            <p className="text-sm text-primary-200 mb-6 max-w-md">
              No action has been executed yet. Execute an action to see the confirmation here.
            </p>
            {typeof onNewQuery === 'function' || typeof onProceed === 'function' ? (
              <button
                type="button"
                className="flex items-center gap-2 px-5 py-2.5 rounded-glass-sm bg-accent-blue text-sm font-semibold text-white hover:bg-opacity-90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50"
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span>New Query</span>
              </button>
            ) : null}
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <AnimatedTransition show type="scale" duration="normal">
      <div className={wrapperClassName}>
        <GlassCard variant="default" padding="lg" animated>
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <span
                className={[
                  'w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0',
                  statusClasses.bg,
                ].join(' ')}
                aria-hidden="true"
              >
                {statusIcon}
              </span>
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold text-primary-50 leading-tight">
                  Action Confirmation
                </h2>
                <p className={['text-sm font-medium leading-tight mt-0.5', statusClasses.text].join(' ')}>
                  {statusLabel}
                </p>
              </div>
            </div>

            {/* Dismiss button */}
            {typeof onDismiss === 'function' ? (
              <button
                type="button"
                className="flex items-center justify-center w-8 h-8 rounded-glass-sm text-primary-300 hover:bg-glass-light hover:text-primary-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50 flex-shrink-0"
                onClick={handleDismiss}
                aria-label="Dismiss confirmation"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            ) : null}
          </div>

          {/* Status Banner */}
          <div
            className={[
              'flex items-start gap-3 px-4 py-3 rounded-glass-sm border mb-6',
              statusClasses.bg,
              statusClasses.border,
            ].join(' ')}
            role="status"
            aria-live="polite"
          >
            {status === 'success' ? (
              <svg
                className={['w-5 h-5 flex-shrink-0 mt-0.5', statusClasses.text].join(' ')}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : status === 'error' ? (
              <svg
                className={['w-5 h-5 flex-shrink-0 mt-0.5', statusClasses.text].join(' ')}
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className={['w-5 h-5 flex-shrink-0 mt-0.5 animate-spin', statusClasses.text].join(' ')}
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            <p className={['text-sm leading-relaxed', statusClasses.text].join(' ')}>
              {message}
            </p>
          </div>

          {/* Action Info */}
          <div className="flex flex-col gap-2 mb-6">
            {/* Action Label */}
            {actionLabel ? (
              <DetailRow
                label="Action"
                value={actionLabel}
              />
            ) : null}

            {/* Action Type */}
            {actionType ? (
              <DetailRow
                label="Type"
                value={
                  <span className="capitalize">
                    {actionType.replace(/[-_]/g, ' ')}
                  </span>
                }
              />
            ) : null}

            {/* Target System */}
            {systemLabel ? (
              <DetailRow
                label="Target System"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: systemColor || '#3B82F6' }}
                      aria-hidden="true"
                    />
                    {systemLabel}
                  </span>
                }
              />
            ) : null}

            {/* Timestamp */}
            {timestamp ? (
              <DetailRow
                label="Executed At"
                value={formatTimestamp(timestamp)}
              />
            ) : null}

            {/* Execution ID */}
            {executionId ? (
              <DetailRow
                label="Execution ID"
                value={
                  <span className="text-xs font-mono text-primary-300">
                    {executionId}
                  </span>
                }
              />
            ) : null}

            {/* Status */}
            <DetailRow
              label="Status"
              value={
                <span
                  className={[
                    'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                    statusClasses.bg,
                    statusClasses.text,
                  ].join(' ')}
                >
                  {status}
                </span>
              }
            />
          </div>

          {/* Details Section */}
          {showDetails && detailEntries.length > 0 ? (
            <div className="mb-6">
              <button
                type="button"
                className="flex items-center gap-2 w-full text-left px-1 py-1 text-xs text-primary-300 font-semibold uppercase tracking-wider hover:text-primary-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50 rounded-glass-sm"
                onClick={toggleDetails}
                aria-expanded={detailsExpanded}
              >
                <svg
                  className={[
                    'w-3.5 h-3.5 transition-transform duration-200',
                    detailsExpanded ? 'rotate-90' : 'rotate-0',
                  ].join(' ')}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <span>
                  Execution Details ({detailEntries.length})
                </span>
              </button>

              <AnimatedTransition
                show={detailsExpanded}
                type="slide-up"
                duration="fast"
                unmountOnExit
              >
                <div className="flex flex-col gap-1.5 mt-2">
                  {detailEntries.map((entry) => (
                    <DetailRow
                      key={entry.key}
                      label={entry.label}
                      value={entry.value}
                    />
                  ))}
                </div>
              </AnimatedTransition>
            </div>
          ) : null}

          {/* Undo Notice */}
          <AnimatedTransition
            show={canUndo}
            type="fade"
            duration="fast"
            unmountOnExit
          >
            <div className="flex items-center gap-2 px-3 py-2 rounded-glass-sm bg-amber-400 bg-opacity-10 border border-amber-400 border-opacity-20 mb-6">
              <svg
                className="w-4 h-4 text-amber-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-xs text-amber-400">
                You can undo this action within a few seconds.
              </p>
            </div>
          </AnimatedTransition>

          {/* Undo Triggered Notice */}
          <AnimatedTransition
            show={undoTriggered}
            type="slide-up"
            duration="fast"
            unmountOnExit
          >
            <div className="flex items-center gap-2 px-3 py-2 rounded-glass-sm bg-accent-blue bg-opacity-10 border border-accent-blue border-opacity-20 mb-6">
              <svg
                className="w-4 h-4 text-accent-blue flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
              <p className="text-xs text-accent-blue">
                Undo request submitted. The action is being reversed.
              </p>
            </div>
          </AnimatedTransition>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-glass-border">
            {/* Undo Button */}
            {showUndo && status === 'success' ? (
              <button
                type="button"
                className={[
                  'flex items-center gap-2 px-4 py-2.5 rounded-glass-sm border text-sm font-medium',
                  'transition-all duration-300 ease-in-out',
                  'focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
                  canUndo
                    ? 'border-amber-400 border-opacity-40 text-amber-400 hover:bg-amber-400 hover:bg-opacity-10'
                    : 'border-glass-border text-primary-300 opacity-50 cursor-not-allowed',
                ]
                  .filter(Boolean)
                  .join(' ')
                  .replace(/\s+/g, ' ')
                  .trim()}
                onClick={handleUndo}
                disabled={!canUndo}
                aria-label={canUndo ? 'Undo this action' : 'Undo window expired'}
              >
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                  />
                </svg>
                <span>{undoTriggered ? 'Undoing...' : undoExpired ? 'Undo Expired' : 'Undo'}</span>
              </button>
            ) : null}

            {/* Spacer */}
            <div className="flex-1" />

            {/* New Query Button */}
            <button
              type="button"
              className={[
                'flex items-center gap-2 px-4 py-2.5 rounded-glass-sm border text-sm font-medium',
                'border-glass-border text-primary-200',
                'transition-all duration-300 ease-in-out',
                'hover:bg-glass-light hover:text-primary-50 hover:border-primary-300',
                'focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
              ]
                .filter(Boolean)
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim()}
              onClick={handleNewQuery}
            >
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span>New Query</span>
            </button>

            {/* Proceed Button */}
            {showProceed ? (
              <button
                type="button"
                className={[
                  'flex items-center gap-2 px-5 py-2.5 rounded-glass-sm text-sm font-semibold text-white',
                  'bg-accent-blue hover:bg-opacity-90 active:bg-opacity-80 shadow-accent-glow',
                  'transition-all duration-300 ease-in-out',
                  'focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
                ]
                  .filter(Boolean)
                  .join(' ')
                  .replace(/\s+/g, ' ')
                  .trim()}
                onClick={handleProceed}
              >
                <span>Proceed</span>
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>
            ) : null}
          </div>
        </GlassCard>
      </div>
    </AnimatedTransition>
  );
}

ActionConfirmation.propTypes = {
  result: PropTypes.shape({
    id: PropTypes.string,
    success: PropTypes.bool,
    message: PropTypes.string,
    timestamp: PropTypes.string,
    status: PropTypes.string,
    details: PropTypes.object,
  }),
  actionType: PropTypes.string,
  actionLabel: PropTypes.string,
  targetSystem: PropTypes.string,
  showUndo: PropTypes.bool,
  showProceed: PropTypes.bool,
  showDetails: PropTypes.bool,
  onUndo: PropTypes.func,
  onProceed: PropTypes.func,
  onNewQuery: PropTypes.func,
  onDismiss: PropTypes.func,
  className: PropTypes.string,
};

ActionConfirmation.defaultProps = {
  result: null,
  actionType: null,
  actionLabel: null,
  targetSystem: null,
  showUndo: true,
  showProceed: true,
  showDetails: true,
  onUndo: undefined,
  onProceed: undefined,
  onNewQuery: undefined,
  onDismiss: undefined,
  className: '',
};

export default ActionConfirmation;