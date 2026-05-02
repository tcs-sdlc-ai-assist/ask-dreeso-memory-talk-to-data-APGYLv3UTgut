/**
 * Risk signal visualization component for Ask Dreeso Memory.
 * Displays risk level (high/medium/low/critical), description, affected systems,
 * and recommended actions. Uses color coding per severity.
 *
 * @module RiskSignalCard
 * @see SCRUM-7892
 */

import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import GlassCard from './GlassCard';
import AnimatedTransition from './AnimatedTransition';
import { SYSTEMS, INTELLIGENCE_CLUSTERS } from '../../constants';

/**
 * Resolves severity to a color class for text.
 *
 * @param {string} severity - The severity level ('critical', 'high', 'medium', 'low')
 * @returns {string} Tailwind text color class
 */
function getSeverityTextColor(severity) {
  switch (severity) {
    case 'critical':
      return 'text-red-400';
    case 'high':
      return 'text-orange-400';
    case 'medium':
      return 'text-amber-400';
    case 'low':
      return 'text-green-400';
    default:
      return 'text-primary-200';
  }
}

/**
 * Resolves severity to a background color class.
 *
 * @param {string} severity - The severity level
 * @returns {string} Tailwind background color class
 */
function getSeverityBgColor(severity) {
  switch (severity) {
    case 'critical':
      return 'bg-red-400 bg-opacity-15';
    case 'high':
      return 'bg-orange-400 bg-opacity-15';
    case 'medium':
      return 'bg-amber-400 bg-opacity-15';
    case 'low':
      return 'bg-green-400 bg-opacity-15';
    default:
      return 'bg-glass-light';
  }
}

/**
 * Resolves severity to a border color class.
 *
 * @param {string} severity - The severity level
 * @returns {string} Tailwind border color class
 */
function getSeverityBorderColor(severity) {
  switch (severity) {
    case 'critical':
      return 'border-red-400 border-opacity-30';
    case 'high':
      return 'border-orange-400 border-opacity-30';
    case 'medium':
      return 'border-amber-400 border-opacity-30';
    case 'low':
      return 'border-green-400 border-opacity-30';
    default:
      return 'border-glass-border';
  }
}

/**
 * Resolves severity to an emoji icon.
 *
 * @param {string} severity - The severity level
 * @returns {string} Emoji representing the severity
 */
function getSeverityIcon(severity) {
  switch (severity) {
    case 'critical':
      return '🔴';
    case 'high':
      return '🟠';
    case 'medium':
      return '🟡';
    case 'low':
      return '🟢';
    default:
      return '⚪';
  }
}

/**
 * Resolves severity to a human-readable label.
 *
 * @param {string} severity - The severity level
 * @returns {string} Human-readable severity label
 */
function getSeverityLabel(severity) {
  switch (severity) {
    case 'critical':
      return 'Critical';
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
    default:
      return 'Unknown';
  }
}

/**
 * Resolves a system ID to its display label.
 *
 * @param {string} systemId - The system identifier
 * @returns {string} The display label for the system
 */
function getSystemLabel(systemId) {
  if (typeof systemId !== 'string' || systemId.trim().length === 0) {
    return systemId || 'Unknown';
  }

  const systemValues = Object.values(SYSTEMS);
  const match = systemValues.find((s) => s.id === systemId);
  return match ? match.label : systemId;
}

/**
 * Resolves a system ID to its brand color.
 *
 * @param {string} systemId - The system identifier
 * @returns {string} The brand color hex string
 */
function getSystemColor(systemId) {
  if (typeof systemId !== 'string' || systemId.trim().length === 0) {
    return '#6B7280';
  }

  const systemValues = Object.values(SYSTEMS);
  const match = systemValues.find((s) => s.id === systemId);
  return match ? match.color : '#6B7280';
}

/**
 * Resolves a cluster ID to its display label.
 *
 * @param {string} clusterId - The intelligence cluster identifier
 * @returns {string} The display label for the cluster
 */
function getClusterLabel(clusterId) {
  if (typeof clusterId !== 'string' || clusterId.trim().length === 0) {
    return clusterId || 'Unknown';
  }

  const clusterValues = Object.values(INTELLIGENCE_CLUSTERS);
  const match = clusterValues.find((c) => c.id === clusterId);
  return match ? match.label : clusterId;
}

/**
 * Resolves a cluster ID to its icon.
 *
 * @param {string} clusterId - The intelligence cluster identifier
 * @returns {string} The icon emoji for the cluster
 */
function getClusterIcon(clusterId) {
  if (typeof clusterId !== 'string' || clusterId.trim().length === 0) {
    return '📁';
  }

  const clusterValues = Object.values(INTELLIGENCE_CLUSTERS);
  const match = clusterValues.find((c) => c.id === clusterId);
  return match ? match.icon : '📁';
}

/**
 * Formats an ISO timestamp to a human-readable string.
 *
 * @param {string|null} isoTimestamp - ISO 8601 timestamp string
 * @returns {string} Formatted date/time string
 */
function formatTimestamp(isoTimestamp) {
  if (typeof isoTimestamp !== 'string' || isoTimestamp.length === 0) {
    return 'Recently';
  }

  try {
    const date = new Date(isoTimestamp);
    if (isNaN(date.getTime())) {
      return 'Recently';
    }
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Recently';
  }
}

/**
 * SystemBadge sub-component.
 * Renders a small badge for an affected system.
 *
 * @param {Object} props
 * @param {string} props.systemId - The system identifier
 * @returns {React.ReactElement} The system badge element
 */
function SystemBadge({ systemId }) {
  const label = getSystemLabel(systemId);
  const color = getSystemColor(systemId);

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: color ? `${color}20` : 'rgba(107, 114, 128, 0.12)',
        color: color || '#6B7280',
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: color || '#6B7280' }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

SystemBadge.propTypes = {
  systemId: PropTypes.string.isRequired,
};

/**
 * ClusterBadge sub-component.
 * Renders a small badge for an affected cluster.
 *
 * @param {Object} props
 * @param {string} props.clusterId - The intelligence cluster identifier
 * @returns {React.ReactElement} The cluster badge element
 */
function ClusterBadge({ clusterId }) {
  const label = getClusterLabel(clusterId);
  const icon = getClusterIcon(clusterId);

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-glass-light text-primary-200">
      <span className="text-xs flex-shrink-0" aria-hidden="true">
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </span>
  );
}

ClusterBadge.propTypes = {
  clusterId: PropTypes.string.isRequired,
};

/**
 * ActionItem sub-component.
 * Renders a single recommended action as a clickable row.
 *
 * @param {Object} props
 * @param {string} props.actionId - The action identifier
 * @param {function} [props.onClick] - Click handler for the action
 * @returns {React.ReactElement} The action item element
 */
function ActionItem({ actionId, onClick }) {
  const handleClick = useCallback(() => {
    if (typeof onClick === 'function') {
      onClick(actionId);
    }
  }, [actionId, onClick]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  return (
    <button
      type="button"
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-glass-sm',
        'text-xs text-primary-200 font-medium',
        'transition-all duration-200',
        'hover:bg-glass-light hover:text-primary-50',
        'focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
        'border border-transparent hover:border-glass-border',
        typeof onClick === 'function' ? 'cursor-pointer' : 'cursor-default',
      ]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`Recommended action: ${actionId}`}
    >
      <svg
        className="w-3 h-3 text-accent-blue flex-shrink-0"
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
      <span className="truncate">{actionId}</span>
    </button>
  );
}

ActionItem.propTypes = {
  actionId: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

ActionItem.defaultProps = {
  onClick: undefined,
};

/**
 * RiskSignalCard component.
 * Displays a risk signal card showing risk level (critical/high/medium/low),
 * description, category, affected systems, affected clusters, detection timestamp,
 * and recommended actions. Uses color coding per severity level.
 *
 * Supports expandable details section for additional context and actions.
 *
 * @param {Object} props
 * @param {Object} props.signal - The risk signal object
 * @param {string} [props.signal.id] - Unique risk signal identifier
 * @param {string} [props.signal.severity='medium'] - Severity level ('critical', 'high', 'medium', 'low')
 * @param {string} [props.signal.category] - Risk category (e.g., 'resource', 'schedule', 'cost')
 * @param {string} [props.signal.title] - Risk signal title
 * @param {string} [props.signal.message] - Risk signal description/message
 * @param {string} [props.signal.detectedAt] - ISO timestamp of detection
 * @param {string} [props.signal.projectId] - Associated project identifier
 * @param {string[]} [props.signal.affectedClusters] - Array of affected intelligence cluster IDs
 * @param {string[]} [props.signal.affectedSystems] - Array of affected system IDs
 * @param {string[]} [props.signal.recommendedActions] - Array of recommended action IDs
 * @param {boolean} [props.compact=false] - Whether to render in compact mode
 * @param {boolean} [props.expandable=true] - Whether the card is expandable to show details
 * @param {boolean} [props.showAffectedSystems=true] - Whether to show affected systems
 * @param {boolean} [props.showAffectedClusters=true] - Whether to show affected clusters
 * @param {boolean} [props.showActions=true] - Whether to show recommended actions
 * @param {boolean} [props.showTimestamp=true] - Whether to show the detection timestamp
 * @param {boolean} [props.animated=true] - Whether to apply entrance animation
 * @param {number} [props.animationDelay=0] - Animation delay in milliseconds
 * @param {function} [props.onActionClick] - Callback fired when a recommended action is clicked
 * @param {function} [props.onClick] - Callback fired when the card is clicked
 * @param {string} [props.className=''] - Additional CSS classes to apply
 * @returns {React.ReactElement|null} The risk signal card component, or null if signal is invalid
 */
function RiskSignalCard({
  signal,
  compact,
  expandable,
  showAffectedSystems,
  showAffectedClusters,
  showActions,
  showTimestamp,
  animated,
  animationDelay,
  onActionClick,
  onClick,
  className,
}) {
  const [expanded, setExpanded] = useState(false);

  // Validate signal
  if (!signal || typeof signal !== 'object') {
    return null;
  }

  const severity = typeof signal.severity === 'string' ? signal.severity : 'medium';
  const category = typeof signal.category === 'string' ? signal.category : '';
  const title = typeof signal.title === 'string' ? signal.title : '';
  const message = typeof signal.message === 'string' ? signal.message : '';
  const detectedAt = typeof signal.detectedAt === 'string' ? signal.detectedAt : null;
  const projectId = typeof signal.projectId === 'string' ? signal.projectId : null;
  const affectedClusters = Array.isArray(signal.affectedClusters) ? signal.affectedClusters : [];
  const affectedSystems = Array.isArray(signal.affectedSystems) ? signal.affectedSystems : [];
  const recommendedActions = Array.isArray(signal.recommendedActions) ? signal.recommendedActions : [];

  // If there is no message and no title, do not render
  if (message.length === 0 && title.length === 0) {
    return null;
  }

  const severityTextColor = getSeverityTextColor(severity);
  const severityBgColor = getSeverityBgColor(severity);
  const severityBorderColor = getSeverityBorderColor(severity);
  const severityIcon = getSeverityIcon(severity);
  const severityLabel = getSeverityLabel(severity);

  const hasDetails = (
    (showAffectedSystems && affectedSystems.length > 0) ||
    (showAffectedClusters && affectedClusters.length > 0) ||
    (showActions && recommendedActions.length > 0)
  );

  /**
   * Toggles the expanded state
   */
  const toggleExpanded = useCallback(() => {
    if (expandable && hasDetails) {
      setExpanded((prev) => !prev);
    }
  }, [expandable, hasDetails]);

  /**
   * Handles card click
   */
  const handleClick = useCallback(() => {
    if (typeof onClick === 'function') {
      onClick(signal);
    } else {
      toggleExpanded();
    }
  }, [onClick, signal, toggleExpanded]);

  /**
   * Handles keyboard events on the card
   * @param {React.KeyboardEvent} event - The keyboard event
   */
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  /**
   * Handles recommended action click
   * @param {string} actionId - The action identifier
   */
  const handleActionClick = useCallback((actionId) => {
    if (typeof onActionClick === 'function') {
      onActionClick(actionId, signal);
    }
  }, [onActionClick, signal]);

  const isInteractive = typeof onClick === 'function' || (expandable && hasDetails);

  const wrapperClassName = [
    'w-full',
    className || '',
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Compact mode rendering
  if (compact) {
    const compactContent = (
      <div
        className={[
          'flex items-start gap-3 px-4 py-3 rounded-glass-sm border',
          severityBgColor,
          severityBorderColor,
          isInteractive ? 'cursor-pointer hover:bg-opacity-25 transition-all duration-200' : '',
          wrapperClassName,
        ]
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()}
        onClick={isInteractive ? handleClick : undefined}
        onKeyDown={isInteractive ? handleKeyDown : undefined}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        aria-label={title ? `Risk signal: ${title}` : `Risk signal: ${severity} severity`}
      >
        {/* Severity Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <span className="text-sm" aria-hidden="true">
            {severityIcon}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={[
                'text-xs font-semibold uppercase px-2 py-0.5 rounded-full',
                severityBgColor,
                severityTextColor,
              ].join(' ')}
            >
              {severityLabel}
            </span>
            {category ? (
              <span className="text-xs text-primary-300 capitalize">
                {category}
              </span>
            ) : null}
          </div>
          <p className="text-sm text-primary-100 leading-relaxed">
            {message || title}
          </p>
          {showTimestamp && detectedAt ? (
            <p className="text-xs text-primary-300 mt-1">
              Detected: {formatTimestamp(detectedAt)}
            </p>
          ) : null}
        </div>
      </div>
    );

    if (animated) {
      return (
        <AnimatedTransition
          show
          type="slide-up"
          duration="fast"
          delay={typeof animationDelay === 'number' ? animationDelay : 0}
        >
          {compactContent}
        </AnimatedTransition>
      );
    }

    return compactContent;
  }

  // Full mode rendering
  const fullContent = (
    <div className={wrapperClassName}>
      <GlassCard
        variant="sm"
        padding="none"
        hoverable={isInteractive}
        animated={false}
        className={[
          'overflow-hidden border',
          severityBorderColor,
        ]
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()}
      >
        {/* Header */}
        <div
          className={[
            'px-5 pt-4 pb-3',
            isInteractive ? 'cursor-pointer' : '',
          ]
            .filter(Boolean)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim()}
          onClick={isInteractive ? handleClick : undefined}
          onKeyDown={isInteractive ? handleKeyDown : undefined}
          role={isInteractive ? 'button' : undefined}
          tabIndex={isInteractive ? 0 : undefined}
          aria-expanded={expandable && hasDetails ? expanded : undefined}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Severity Icon */}
              <span
                className={[
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0',
                  severityBgColor,
                ].join(' ')}
                aria-hidden="true"
              >
                {severityIcon}
              </span>

              {/* Title and Meta */}
              <div className="flex flex-col flex-1 min-w-0">
                {title ? (
                  <h3 className="text-sm font-semibold text-primary-50 leading-tight truncate">
                    {title}
                  </h3>
                ) : null}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span
                    className={[
                      'text-xs font-semibold uppercase px-2 py-0.5 rounded-full',
                      severityBgColor,
                      severityTextColor,
                    ].join(' ')}
                  >
                    {severityLabel}
                  </span>
                  {category ? (
                    <span className="text-xs text-primary-300 capitalize">
                      {category}
                    </span>
                  ) : null}
                  {projectId ? (
                    <span className="text-xs text-primary-300">
                      · {projectId}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Expand/Collapse Indicator */}
            {expandable && hasDetails ? (
              <svg
                className={[
                  'w-4 h-4 text-primary-300 flex-shrink-0 mt-1 transition-transform duration-200',
                  expanded ? 'rotate-180' : 'rotate-0',
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
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            ) : null}
          </div>
        </div>

        {/* Message */}
        {message ? (
          <div className="px-5 pb-3">
            <p className="text-sm text-primary-100 leading-relaxed">
              {message}
            </p>
          </div>
        ) : null}

        {/* Timestamp */}
        {showTimestamp && detectedAt ? (
          <div className="px-5 pb-3">
            <div className="flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 text-primary-300 flex-shrink-0"
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
              <span className="text-xs text-primary-300">
                Detected: {formatTimestamp(detectedAt)}
              </span>
            </div>
          </div>
        ) : null}

        {/* Severity Color Bar */}
        <div
          className={[
            'w-full h-0.5',
            severity === 'critical' ? 'bg-red-400' :
              severity === 'high' ? 'bg-orange-400' :
                severity === 'medium' ? 'bg-amber-400' :
                  severity === 'low' ? 'bg-green-400' :
                    'bg-primary-300',
            'opacity-40',
          ]
            .filter(Boolean)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim()}
          aria-hidden="true"
        />

        {/* Expandable Details */}
        {expandable && hasDetails ? (
          <AnimatedTransition
            show={expanded}
            type="slide-up"
            duration="fast"
            unmountOnExit
          >
            <div className="px-5 py-4 border-t border-glass-border">
              {/* Affected Systems */}
              {showAffectedSystems && affectedSystems.length > 0 ? (
                <div className="mb-3">
                  <p className="text-xs text-primary-300 font-semibold uppercase tracking-wider mb-2">
                    Affected Systems ({affectedSystems.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {affectedSystems.map((systemId, index) => (
                      <SystemBadge
                        key={systemId || `system-${index}`}
                        systemId={systemId}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Affected Clusters */}
              {showAffectedClusters && affectedClusters.length > 0 ? (
                <div className="mb-3">
                  <p className="text-xs text-primary-300 font-semibold uppercase tracking-wider mb-2">
                    Affected Clusters ({affectedClusters.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {affectedClusters.map((clusterId, index) => (
                      <ClusterBadge
                        key={clusterId || `cluster-${index}`}
                        clusterId={clusterId}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Recommended Actions */}
              {showActions && recommendedActions.length > 0 ? (
                <div>
                  <p className="text-xs text-primary-300 font-semibold uppercase tracking-wider mb-2">
                    Recommended Actions ({recommendedActions.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {recommendedActions.map((actionId, index) => (
                      <ActionItem
                        key={actionId || `action-${index}`}
                        actionId={actionId}
                        onClick={handleActionClick}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </AnimatedTransition>
        ) : null}

        {/* Non-expandable inline details */}
        {!expandable && hasDetails ? (
          <div className="px-5 py-4 border-t border-glass-border">
            {/* Affected Systems */}
            {showAffectedSystems && affectedSystems.length > 0 ? (
              <div className="mb-3">
                <p className="text-xs text-primary-300 font-semibold uppercase tracking-wider mb-2">
                  Affected Systems ({affectedSystems.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {affectedSystems.map((systemId, index) => (
                    <SystemBadge
                      key={systemId || `system-${index}`}
                      systemId={systemId}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {/* Affected Clusters */}
            {showAffectedClusters && affectedClusters.length > 0 ? (
              <div className="mb-3">
                <p className="text-xs text-primary-300 font-semibold uppercase tracking-wider mb-2">
                  Affected Clusters ({affectedClusters.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {affectedClusters.map((clusterId, index) => (
                    <ClusterBadge
                      key={clusterId || `cluster-${index}`}
                      clusterId={clusterId}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {/* Recommended Actions */}
            {showActions && recommendedActions.length > 0 ? (
              <div>
                <p className="text-xs text-primary-300 font-semibold uppercase tracking-wider mb-2">
                  Recommended Actions ({recommendedActions.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {recommendedActions.map((actionId, index) => (
                    <ActionItem
                      key={actionId || `action-${index}`}
                      actionId={actionId}
                      onClick={handleActionClick}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </GlassCard>
    </div>
  );

  if (animated) {
    return (
      <AnimatedTransition
        show
        type="scale"
        duration="normal"
        delay={typeof animationDelay === 'number' ? animationDelay : 0}
      >
        {fullContent}
      </AnimatedTransition>
    );
  }

  return fullContent;
}

RiskSignalCard.propTypes = {
  signal: PropTypes.shape({
    id: PropTypes.string,
    severity: PropTypes.oneOf(['critical', 'high', 'medium', 'low']),
    category: PropTypes.string,
    title: PropTypes.string,
    message: PropTypes.string,
    detectedAt: PropTypes.string,
    projectId: PropTypes.string,
    affectedClusters: PropTypes.arrayOf(PropTypes.string),
    affectedSystems: PropTypes.arrayOf(PropTypes.string),
    recommendedActions: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  compact: PropTypes.bool,
  expandable: PropTypes.bool,
  showAffectedSystems: PropTypes.bool,
  showAffectedClusters: PropTypes.bool,
  showActions: PropTypes.bool,
  showTimestamp: PropTypes.bool,
  animated: PropTypes.bool,
  animationDelay: PropTypes.number,
  onActionClick: PropTypes.func,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

RiskSignalCard.defaultProps = {
  compact: false,
  expandable: true,
  showAffectedSystems: true,
  showAffectedClusters: true,
  showActions: true,
  showTimestamp: true,
  animated: true,
  animationDelay: 0,
  onActionClick: undefined,
  onClick: undefined,
  className: '',
};

export default RiskSignalCard;