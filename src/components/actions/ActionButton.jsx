/**
 * Action execution trigger component for Ask Dreeso Memory.
 * Triggers simulated updates in enterprise systems. Shows target system icon,
 * action label, loading state during execution, and confirmation/error state
 * after completion.
 *
 * @module ActionButton
 * @see SCRUM-7896
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { executeAction, ACTION_TYPES } from '../../services/ActionExecutor';
import { useUIState, TRANSITION_EVENTS } from '../../context/UIStateContext';
import { logEvent, AUDIT_EVENT_TYPES } from '../../services/AuditLogger';
import { SYSTEMS } from '../../constants';
import AnimatedTransition from '../ui/AnimatedTransition';

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
 * Resolves the icon emoji for a given action type.
 *
 * @param {string} actionType - The action type identifier
 * @returns {string} An emoji representing the action type
 */
function getActionIcon(actionType) {
  switch (actionType) {
    case ACTION_TYPES.NAVIGATE:
      return '🔗';
    case ACTION_TYPES.GENERATE_REPORT:
      return '📊';
    case ACTION_TYPES.SCHEDULE:
      return '📅';
    case ACTION_TYPES.ESCALATE:
      return '📢';
    case ACTION_TYPES.UPDATE:
      return '🔄';
    case ACTION_TYPES.WORKFLOW:
      return '⚙️';
    case ACTION_TYPES.RECOMMENDATION:
      return '💡';
    case ACTION_TYPES.SHARE:
      return '📤';
    case ACTION_TYPES.CREATE:
      return '➕';
    case ACTION_TYPES.EXPORT_CSV:
      return '📥';
    default:
      return '⚡';
  }
}

/**
 * Resolves variant-specific Tailwind classes for the button.
 *
 * @param {string} variant - The button variant ('primary', 'secondary', 'outline', 'ghost')
 * @param {boolean} disabled - Whether the button is disabled
 * @returns {string} Tailwind classes for the variant
 */
function getVariantClasses(variant, disabled) {
  if (disabled) {
    return 'bg-glass-light border-glass-border text-primary-300 cursor-not-allowed opacity-60';
  }

  switch (variant) {
    case 'primary':
      return 'bg-accent-blue text-white border-accent-blue hover:bg-opacity-90 active:bg-opacity-80 shadow-accent-glow';
    case 'secondary':
      return 'bg-glass-light text-primary-50 border-glass-border hover:bg-glass-medium hover:border-primary-300';
    case 'outline':
      return 'bg-transparent text-primary-200 border-glass-border hover:bg-glass-light hover:text-primary-50 hover:border-primary-300';
    case 'ghost':
      return 'bg-transparent text-primary-200 border-transparent hover:bg-glass-light hover:text-primary-50';
    default:
      return 'bg-glass-light text-primary-50 border-glass-border hover:bg-glass-medium hover:border-primary-300';
  }
}

/**
 * Resolves size-specific Tailwind classes for the button.
 *
 * @param {string} size - The button size ('sm', 'md', 'lg')
 * @returns {{ button: string, text: string, icon: string }} Size classes
 */
function getSizeClasses(size) {
  switch (size) {
    case 'sm':
      return {
        button: 'px-3 py-1.5',
        text: 'text-xs',
        icon: 'text-sm',
      };
    case 'lg':
      return {
        button: 'px-6 py-3',
        text: 'text-base',
        icon: 'text-lg',
      };
    case 'md':
    default:
      return {
        button: 'px-4 py-2.5',
        text: 'text-sm',
        icon: 'text-base',
      };
  }
}

/**
 * Duration in milliseconds to show the confirmation/error state before resetting.
 * @type {number}
 */
const RESULT_DISPLAY_DURATION_MS = 3000;

/**
 * ActionButton component.
 * Renders an action execution button that triggers simulated updates in
 * enterprise systems. Displays the target system icon, action label,
 * loading state during execution, and confirmation/error state after completion.
 *
 * Supports multiple visual variants, sizes, and optional system targeting.
 * Integrates with ActionExecutor for simulated execution, UIStateContext
 * for state transitions, and AuditLogger for audit trail persistence.
 *
 * @param {Object} props
 * @param {string} props.actionType - The type of action to execute (e.g., 'generate-report', 'schedule')
 * @param {string} [props.label='Execute Action'] - Display label for the button
 * @param {string} [props.targetSystem] - Target system identifier (e.g., 'sap', 'procore')
 * @param {Object} [props.payload={}] - Action-specific payload data
 * @param {string} [props.actionId] - Associated mock action ID for result matching
 * @param {string} [props.variant='secondary'] - Visual variant ('primary', 'secondary', 'outline', 'ghost')
 * @param {string} [props.size='md'] - Button size ('sm', 'md', 'lg')
 * @param {boolean} [props.showSystemBadge=true] - Whether to show the target system badge
 * @param {boolean} [props.showIcon=true] - Whether to show the action type icon
 * @param {boolean} [props.disabled=false] - Whether the button is disabled
 * @param {boolean} [props.fullWidth=false] - Whether the button should take full width
 * @param {function} [props.onExecute] - Callback fired when execution starts
 * @param {function} [props.onSuccess] - Callback fired on successful execution
 * @param {function} [props.onError] - Callback fired on execution error
 * @param {string} [props.className=''] - Additional CSS classes to apply
 * @returns {React.ReactElement} The action button component
 */
function ActionButton({
  actionType,
  label,
  targetSystem,
  payload,
  actionId,
  variant,
  size,
  showSystemBadge,
  showIcon,
  disabled,
  fullWidth,
  onExecute,
  onSuccess,
  onError,
  className,
}) {
  const [executionState, setExecutionState] = useState('idle');
  const [resultMessage, setResultMessage] = useState(null);
  const [resultDetails, setResultDetails] = useState(null);
  const resultTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  const { addActionTaken } = useUIState();

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (resultTimeoutRef.current !== null) {
        clearTimeout(resultTimeoutRef.current);
        resultTimeoutRef.current = null;
      }
    };
  }, []);

  /**
   * Clears any pending result display timeout
   */
  const clearResultTimeout = useCallback(() => {
    if (resultTimeoutRef.current !== null) {
      clearTimeout(resultTimeoutRef.current);
      resultTimeoutRef.current = null;
    }
  }, []);

  /**
   * Handles the action execution flow
   */
  const handleExecute = useCallback(async () => {
    if (executionState === 'loading' || disabled) {
      return;
    }

    // Validate action type
    if (typeof actionType !== 'string' || actionType.trim().length === 0) {
      setExecutionState('error');
      setResultMessage('Invalid action type.');
      clearResultTimeout();
      resultTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setExecutionState('idle');
          setResultMessage(null);
          setResultDetails(null);
        }
      }, RESULT_DISPLAY_DURATION_MS);
      return;
    }

    // Set loading state
    setExecutionState('loading');
    setResultMessage(null);
    setResultDetails(null);

    // Fire onExecute callback
    if (typeof onExecute === 'function') {
      onExecute({
        actionType: actionType.trim(),
        targetSystem: targetSystem || null,
        payload: payload || {},
        actionId: actionId || null,
      });
    }

    // Log execution attempt
    logEvent(AUDIT_EVENT_TYPES.ACTION_EXECUTE, {
      actionType: actionType.trim(),
      targetSystem: targetSystem || null,
      actionId: actionId || null,
      label: label || 'Execute Action',
    });

    try {
      // Build the execution payload
      const executionPayload = {
        ...(payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {}),
      };

      if (typeof actionId === 'string' && actionId.length > 0) {
        executionPayload.actionId = actionId;
      }

      // Execute the action
      const result = await executeAction(
        actionType.trim(),
        executionPayload,
        targetSystem || undefined
      );

      if (!mountedRef.current) {
        return;
      }

      if (result.success) {
        setExecutionState('success');
        setResultMessage(result.message || 'Action completed successfully.');
        setResultDetails(result.details || null);

        // Record action taken in UI state
        addActionTaken({
          id: result.id,
          actionType: actionType.trim(),
          targetSystem: targetSystem || null,
          label: label || 'Execute Action',
          status: result.status,
          message: result.message,
          timestamp: result.timestamp,
        });

        // Fire onSuccess callback
        if (typeof onSuccess === 'function') {
          onSuccess(result);
        }
      } else {
        setExecutionState('error');
        setResultMessage(result.message || 'Action failed.');
        setResultDetails(null);

        // Fire onError callback
        if (typeof onError === 'function') {
          onError(result);
        }
      }

      // Reset to idle after display duration
      clearResultTimeout();
      resultTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setExecutionState('idle');
          setResultMessage(null);
          setResultDetails(null);
        }
      }, RESULT_DISPLAY_DURATION_MS);
    } catch {
      if (!mountedRef.current) {
        return;
      }

      const errorMessage = 'An unexpected error occurred during action execution.';
      setExecutionState('error');
      setResultMessage(errorMessage);
      setResultDetails(null);

      logEvent(AUDIT_EVENT_TYPES.ACTION_ERROR, {
        actionType: actionType.trim(),
        targetSystem: targetSystem || null,
        actionId: actionId || null,
        errorCode: 'EXECUTION_ERROR',
        message: errorMessage,
      });

      // Fire onError callback
      if (typeof onError === 'function') {
        onError({
          success: false,
          message: errorMessage,
          status: 'error',
          details: null,
          id: null,
        });
      }

      // Reset to idle after display duration
      clearResultTimeout();
      resultTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setExecutionState('idle');
          setResultMessage(null);
          setResultDetails(null);
        }
      }, RESULT_DISPLAY_DURATION_MS);
    }
  }, [
    executionState,
    disabled,
    actionType,
    targetSystem,
    payload,
    actionId,
    label,
    onExecute,
    onSuccess,
    onError,
    addActionTaken,
    clearResultTimeout,
  ]);

  /**
   * Handles keyboard events on the button
   * @param {React.KeyboardEvent} event - The keyboard event
   */
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleExecute();
    }
  }, [handleExecute]);

  const isLoading = executionState === 'loading';
  const isSuccess = executionState === 'success';
  const isError = executionState === 'error';
  const isIdle = executionState === 'idle';
  const isDisabled = disabled || isLoading;

  const sizeClasses = getSizeClasses(size);
  const variantClasses = isSuccess
    ? 'bg-green-400 bg-opacity-15 text-green-400 border-green-400 border-opacity-30'
    : isError
      ? 'bg-red-400 bg-opacity-15 text-red-400 border-red-400 border-opacity-30'
      : getVariantClasses(variant, isDisabled);

  const systemLabel = targetSystem ? getSystemLabel(targetSystem) : null;
  const systemColor = targetSystem ? getSystemColor(targetSystem) : null;
  const actionIcon = getActionIcon(actionType);

  const buttonClassName = [
    'flex items-center gap-2 rounded-glass-sm border',
    'font-medium transition-all duration-300 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
    sizeClasses.button,
    sizeClasses.text,
    variantClasses,
    fullWidth ? 'w-full justify-center' : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <div className="inline-flex flex-col items-start gap-1.5">
      <button
        type="button"
        className={buttonClassName}
        onClick={handleExecute}
        onKeyDown={handleKeyDown}
        disabled={isDisabled}
        aria-label={
          isLoading
            ? `Executing: ${label || 'Action'}...`
            : isSuccess
              ? `Completed: ${label || 'Action'}`
              : isError
                ? `Failed: ${label || 'Action'}`
                : label || 'Execute Action'
        }
        aria-busy={isLoading}
        aria-disabled={isDisabled}
      >
        {/* Loading Spinner */}
        {isLoading ? (
          <svg
            className="w-4 h-4 animate-spin flex-shrink-0"
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
        ) : isSuccess ? (
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
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : isError ? (
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : showIcon ? (
          <span className={['flex-shrink-0', sizeClasses.icon].join(' ')} aria-hidden="true">
            {actionIcon}
          </span>
        ) : null}

        {/* System Badge */}
        {showSystemBadge && systemLabel && isIdle ? (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs flex-shrink-0"
            style={{
              backgroundColor: systemColor ? `${systemColor}20` : 'rgba(59, 130, 246, 0.12)',
              color: systemColor || '#3B82F6',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: systemColor || '#3B82F6' }}
              aria-hidden="true"
            />
            {systemLabel}
          </span>
        ) : null}

        {/* Label */}
        <span className="truncate">
          {isLoading
            ? 'Executing...'
            : isSuccess
              ? 'Completed'
              : isError
                ? 'Failed'
                : label || 'Execute Action'}
        </span>
      </button>

      {/* Result Message */}
      <AnimatedTransition
        show={Boolean(resultMessage) && (isSuccess || isError)}
        type="slide-up"
        duration="fast"
        unmountOnExit
      >
        <div
          className={[
            'flex items-start gap-2 px-3 py-2 rounded-glass-sm text-xs max-w-xs',
            isSuccess
              ? 'bg-green-400 bg-opacity-10 text-green-400 border border-green-400 border-opacity-20'
              : 'bg-red-400 bg-opacity-10 text-red-400 border border-red-400 border-opacity-20',
          ]
            .filter(Boolean)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim()}
          role="status"
          aria-live="polite"
        >
          {isSuccess ? (
            <svg
              className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
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
          ) : (
            <svg
              className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
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
          )}
          <p className="leading-relaxed">{resultMessage}</p>
        </div>
      </AnimatedTransition>
    </div>
  );
}

ActionButton.propTypes = {
  actionType: PropTypes.string.isRequired,
  label: PropTypes.string,
  targetSystem: PropTypes.string,
  payload: PropTypes.object,
  actionId: PropTypes.string,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'ghost']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showSystemBadge: PropTypes.bool,
  showIcon: PropTypes.bool,
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  onExecute: PropTypes.func,
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
  className: PropTypes.string,
};

ActionButton.defaultProps = {
  label: 'Execute Action',
  targetSystem: undefined,
  payload: {},
  actionId: undefined,
  variant: 'secondary',
  size: 'md',
  showSystemBadge: true,
  showIcon: true,
  disabled: false,
  fullWidth: false,
  onExecute: undefined,
  onSuccess: undefined,
  onError: undefined,
  className: '',
};

export default ActionButton;