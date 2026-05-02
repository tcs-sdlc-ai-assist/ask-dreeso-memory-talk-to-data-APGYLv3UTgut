/**
 * Contextual CTA bubble component for Ask Dreeso Memory.
 * Renders 3-4 rounded follow-up query suggestions as clickable bubbles.
 * Each bubble triggers a new query or sub-view navigation.
 * Styled per design system with hover animations.
 *
 * @module CTABubbles
 * @see SCRUM-7889
 */

import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '../../context/QueryContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { getCTABubbles, getCTABubblesForCluster, getCTABubblesForPersona } from '../../services/CTABubbleEngine';
import AnimatedTransition from '../ui/AnimatedTransition';
import { SCREEN_IDS } from '../../constants';

/**
 * Resolves the accent color for a CTA bubble based on its priority.
 *
 * @param {string} priority - The priority level ('high', 'medium', 'low')
 * @returns {string} Tailwind border/text color classes
 */
function getPriorityClasses(priority) {
  switch (priority) {
    case 'high':
      return 'border-accent-blue text-accent-blue hover:bg-accent-blue hover:bg-opacity-10';
    case 'medium':
      return 'border-accent-purple text-accent-purple hover:bg-accent-purple hover:bg-opacity-10';
    case 'low':
      return 'border-accent-teal text-accent-teal hover:bg-accent-teal hover:bg-opacity-10';
    default:
      return 'border-glass-border text-primary-200 hover:bg-glass-light hover:text-primary-50';
  }
}

/**
 * Resolves the background glow color for a CTA bubble based on its type.
 *
 * @param {string} type - The CTA type ('query', 'action', 'navigate', 'report')
 * @returns {string} Tailwind focus ring color class
 */
function getFocusRingClass(type) {
  switch (type) {
    case 'action':
      return 'focus:ring-accent-purple';
    case 'navigate':
      return 'focus:ring-accent-teal';
    case 'report':
      return 'focus:ring-accent-gold';
    case 'query':
    default:
      return 'focus:ring-accent-blue';
  }
}

/**
 * SingleBubble sub-component.
 * Renders a single CTA bubble with icon, label, and click handler.
 *
 * @param {Object} props
 * @param {Object} props.bubble - The CTA bubble object
 * @param {function} props.onClick - Click handler for the bubble
 * @param {boolean} props.disabled - Whether the bubble is disabled
 * @param {number} props.index - Index for staggered animation delay
 * @returns {React.ReactElement} The CTA bubble element
 */
function SingleBubble({ bubble, onClick, disabled, index }) {
  if (!bubble || typeof bubble !== 'object') {
    return null;
  }

  const label = typeof bubble.label === 'string' ? bubble.label : 'Action';
  const icon = typeof bubble.icon === 'string' ? bubble.icon : '💡';
  const priority = typeof bubble.priority === 'string' ? bubble.priority : 'medium';
  const type = typeof bubble.type === 'string' ? bubble.type : 'query';

  const priorityClasses = getPriorityClasses(priority);
  const focusRingClass = getFocusRingClass(type);

  const handleClick = useCallback(() => {
    if (!disabled && typeof onClick === 'function') {
      onClick(bubble);
    }
  }, [bubble, disabled, onClick]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  return (
    <AnimatedTransition
      show
      type="scale"
      duration="fast"
      delay={index * 80}
    >
      <button
        type="button"
        className={[
          'inline-flex items-center gap-2 px-4 py-2.5 rounded-full',
          'border text-sm font-medium',
          'transition-all duration-300 ease-in-out',
          'focus:outline-none focus:ring-2 focus:ring-opacity-50',
          'transform hover:scale-105 active:scale-95',
          priorityClasses,
          focusRingClass,
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        ]
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label={`Follow-up: ${label}`}
      >
        <span className="text-base flex-shrink-0" aria-hidden="true">
          {icon}
        </span>
        <span className="truncate max-w-[200px] sm:max-w-[280px]">
          {label}
        </span>
        {type === 'action' ? (
          <svg
            className="w-3.5 h-3.5 flex-shrink-0 opacity-60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        ) : type === 'navigate' ? (
          <svg
            className="w-3.5 h-3.5 flex-shrink-0 opacity-60"
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
        ) : type === 'report' ? (
          <svg
            className="w-3.5 h-3.5 flex-shrink-0 opacity-60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        ) : null}
      </button>
    </AnimatedTransition>
  );
}

SingleBubble.propTypes = {
  bubble: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  index: PropTypes.number,
};

SingleBubble.defaultProps = {
  disabled: false,
  index: 0,
};

/**
 * CTABubbles component.
 * Renders contextual follow-up action bubbles based on query results,
 * cluster context, or persona context. Each bubble is clickable and
 * triggers a new query execution or navigation action.
 *
 * Supports three modes:
 * 1. Result-based: generates CTAs from a query result object
 * 2. Cluster-based: generates CTAs for a specific intelligence cluster
 * 3. Persona-based: generates CTAs for the current persona
 *
 * @param {Object} props
 * @param {Object|null} [props.queryResult=null] - The query result to generate CTAs from
 * @param {string|null} [props.clusterId=null] - Optional cluster ID for cluster-based CTAs
 * @param {Object[]} [props.bubbles] - Optional pre-computed bubbles to render directly
 * @param {function} [props.onBubbleClick] - Optional callback fired when a bubble is clicked
 * @param {boolean} [props.showHeader=true] - Whether to show the section header
 * @param {string} [props.className=''] - Additional CSS classes to apply to the wrapper
 * @returns {React.ReactElement|null} The CTA bubbles component, or null if no bubbles
 */
function CTABubbles({ queryResult, clusterId, bubbles: externalBubbles, onBubbleClick, showHeader, className }) {
  const { executeQuery, isLoading } = useQuery();
  const { persona } = useAuth();
  const { navigateTo } = useNavigation();

  /**
   * Resolves the CTA bubbles to display based on available context.
   * Priority: external bubbles > result-based > cluster-based > persona-based
   */
  const resolvedBubbles = useMemo(() => {
    // Use externally provided bubbles if available
    if (Array.isArray(externalBubbles) && externalBubbles.length > 0) {
      return externalBubbles;
    }

    // Generate from query result
    if (queryResult && typeof queryResult === 'object') {
      return getCTABubbles(queryResult, persona);
    }

    // Generate from cluster context
    if (typeof clusterId === 'string' && clusterId.trim().length > 0) {
      return getCTABubblesForCluster(clusterId, persona);
    }

    // Generate from persona context
    if (typeof persona === 'string' && persona.trim().length > 0) {
      return getCTABubblesForPersona(persona);
    }

    return [];
  }, [externalBubbles, queryResult, clusterId, persona]);

  /**
   * Handles a bubble click event.
   * Executes the bubble's query, triggers navigation, or fires the callback.
   *
   * @param {Object} bubble - The clicked CTA bubble object
   */
  const handleBubbleClick = useCallback(async (bubble) => {
    if (!bubble || isLoading) {
      return;
    }

    // Fire external callback if provided
    if (typeof onBubbleClick === 'function') {
      onBubbleClick(bubble);
    }

    const bubbleType = typeof bubble.type === 'string' ? bubble.type : 'query';
    const bubbleQuery = typeof bubble.query === 'string' ? bubble.query : '';

    switch (bubbleType) {
      case 'query':
      case 'report': {
        if (bubbleQuery.trim().length > 0) {
          try {
            await executeQuery(bubbleQuery);
          } catch {
            // Error is handled by QueryContext
          }
        }
        break;
      }

      case 'navigate': {
        // Navigate to the query input screen with the suggestion pre-filled
        if (bubbleQuery.trim().length > 0) {
          try {
            await executeQuery(bubbleQuery);
          } catch {
            // Error is handled by QueryContext
          }
        } else {
          navigateTo(SCREEN_IDS.DASHBOARD);
        }
        break;
      }

      case 'action': {
        // For action-type CTAs, execute the query which will show the action in results
        if (bubbleQuery.trim().length > 0) {
          try {
            await executeQuery(bubbleQuery);
          } catch {
            // Error is handled by QueryContext
          }
        }
        break;
      }

      default: {
        if (bubbleQuery.trim().length > 0) {
          try {
            await executeQuery(bubbleQuery);
          } catch {
            // Error is handled by QueryContext
          }
        }
        break;
      }
    }
  }, [isLoading, onBubbleClick, executeQuery, navigateTo]);

  // Do not render if there are no bubbles
  if (!Array.isArray(resolvedBubbles) || resolvedBubbles.length === 0) {
    return null;
  }

  const wrapperClassName = [
    'w-full',
    className || '',
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <AnimatedTransition
      show
      type="slide-up"
      duration="normal"
    >
      <div className={wrapperClassName}>
        {showHeader ? (
          <div className="flex items-center gap-2 mb-3">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs bg-accent-blue bg-opacity-20"
              aria-hidden="true"
            >
              💡
            </span>
            <p className="text-xs text-primary-300 font-semibold uppercase tracking-wider">
              Suggested Follow-ups
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2.5" role="group" aria-label="Follow-up suggestions">
          {resolvedBubbles.map((bubble, index) => (
            <SingleBubble
              key={bubble.id || `cta-bubble-${index}`}
              bubble={bubble}
              onClick={handleBubbleClick}
              disabled={isLoading}
              index={index}
            />
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 mt-3">
            <svg
              className="w-3.5 h-3.5 animate-spin text-primary-300"
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
            <p className="text-xs text-primary-300">
              Processing follow-up query...
            </p>
          </div>
        ) : null}
      </div>
    </AnimatedTransition>
  );
}

CTABubbles.propTypes = {
  queryResult: PropTypes.object,
  clusterId: PropTypes.string,
  bubbles: PropTypes.arrayOf(PropTypes.object),
  onBubbleClick: PropTypes.func,
  showHeader: PropTypes.bool,
  className: PropTypes.string,
};

CTABubbles.defaultProps = {
  queryResult: null,
  clusterId: null,
  bubbles: undefined,
  onBubbleClick: undefined,
  showHeader: true,
  className: '',
};

export default CTABubbles;