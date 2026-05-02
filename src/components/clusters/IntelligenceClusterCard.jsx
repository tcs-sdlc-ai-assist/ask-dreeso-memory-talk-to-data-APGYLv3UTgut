/**
 * Intelligence cluster display card component for Ask Dreeso Memory.
 * Displays cluster name, icon, description, and sample queries.
 * Clickable to navigate to cluster-specific query view.
 *
 * @module IntelligenceClusterCard
 * @see SCRUM-7897
 */

import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import GlassCard from '../ui/GlassCard';
import AnimatedTransition from '../ui/AnimatedTransition';
import { useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '../../context/QueryContext';
import { logEvent, AUDIT_EVENT_TYPES } from '../../services/AuditLogger';
import { INTELLIGENCE_CLUSTERS, SCREEN_IDS } from '../../constants';
import { getAccessibleClusters, getPrimaryClusters } from '../../data/personaData';
import { getQuerySuggestions } from '../../data/mockData';

/**
 * Maximum number of sample queries to display per cluster.
 * @type {number}
 */
const MAX_SAMPLE_QUERIES = 3;

/**
 * Mapping from intelligence cluster IDs to screen IDs.
 * @type {Object.<string, number>}
 */
const CLUSTER_SCREEN_MAP = Object.freeze({
  [INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id]: SCREEN_IDS.CLUSTER_PROJECT,
  [INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id]: SCREEN_IDS.CLUSTER_SALES,
  [INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id]: SCREEN_IDS.CLUSTER_COMMERCIAL,
  [INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id]: SCREEN_IDS.CLUSTER_FINANCE,
  [INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id]: SCREEN_IDS.CLUSTER_WORKFORCE,
  [INTELLIGENCE_CLUSTERS.KNOWLEDGE_IP.id]: SCREEN_IDS.CLUSTER_KNOWLEDGE,
});

/**
 * Mapping from intelligence cluster IDs to sample query patterns.
 * @type {Object.<string, string[]>}
 */
const CLUSTER_SAMPLE_QUERIES = Object.freeze({
  [INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id]: [
    'What is the current status of all my projects?',
    'Which milestones are overdue this month?',
    'What are the top risks in my portfolio?',
  ],
  [INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id]: [
    'What is the current pipeline value?',
    'Which deals are in final negotiation?',
    'Show me the lead conversion analysis',
  ],
  [INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id]: [
    'Which contracts are expiring in the next 60 days?',
    'Show me vendor performance issues',
    'What is our procurement spend vs budget?',
  ],
  [INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id]: [
    'What is our cash flow forecast for Q1 2025?',
    'Show me the budget variance across all projects',
    'Which receivables are at risk?',
  ],
  [INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id]: [
    'Show me the resource allocation across projects',
    'Which projects need additional staffing?',
    'What is the capacity forecast for next quarter?',
  ],
  [INTELLIGENCE_CLUSTERS.KNOWLEDGE_IP.id]: [
    'What lessons learned apply to my current projects?',
    'Search for foundation engineering best practices',
    'Show me schedule recovery techniques',
  ],
});

/**
 * Resolves the cluster definition from a cluster ID.
 *
 * @param {string} clusterId - The intelligence cluster ID
 * @returns {Object|null} The cluster definition object, or null if not found
 */
function resolveClusterDefinition(clusterId) {
  if (typeof clusterId !== 'string' || clusterId.trim().length === 0) {
    return null;
  }

  const clusterValues = Object.values(INTELLIGENCE_CLUSTERS);
  const match = clusterValues.find((c) => c.id === clusterId);
  return match || null;
}

/**
 * Resolves the screen ID for a given cluster ID.
 *
 * @param {string} clusterId - The intelligence cluster ID
 * @returns {number|null} The screen ID, or null if not mapped
 */
function resolveClusterScreenId(clusterId) {
  if (typeof clusterId !== 'string' || clusterId.trim().length === 0) {
    return null;
  }

  const screenId = CLUSTER_SCREEN_MAP[clusterId];
  return screenId !== undefined ? screenId : null;
}

/**
 * Resolves sample queries for a given cluster ID.
 *
 * @param {string} clusterId - The intelligence cluster ID
 * @returns {string[]} Array of sample query strings
 */
function resolveSampleQueries(clusterId) {
  if (typeof clusterId !== 'string' || clusterId.trim().length === 0) {
    return [];
  }

  const queries = CLUSTER_SAMPLE_QUERIES[clusterId];
  if (Array.isArray(queries) && queries.length > 0) {
    return queries.slice(0, MAX_SAMPLE_QUERIES);
  }

  return [];
}

/**
 * Resolves the access level badge classes.
 *
 * @param {string} accessLevel - Access level ('full', 'read', 'none')
 * @returns {{ bg: string, text: string }} Tailwind classes for the access badge
 */
function getAccessLevelClasses(accessLevel) {
  switch (accessLevel) {
    case 'full':
      return {
        bg: 'bg-green-400 bg-opacity-15',
        text: 'text-green-400',
      };
    case 'read':
      return {
        bg: 'bg-amber-400 bg-opacity-15',
        text: 'text-amber-400',
      };
    case 'none':
    default:
      return {
        bg: 'bg-primary-300 bg-opacity-15',
        text: 'text-primary-300',
      };
  }
}

/**
 * Resolves the access level display label.
 *
 * @param {string} accessLevel - Access level ('full', 'read', 'none')
 * @returns {string} Human-readable access level label
 */
function getAccessLevelLabel(accessLevel) {
  switch (accessLevel) {
    case 'full':
      return 'Full Access';
    case 'read':
      return 'Read Only';
    case 'none':
      return 'No Access';
    default:
      return 'Unknown';
  }
}

/**
 * SampleQueryItem sub-component.
 * Renders a single sample query as a clickable row.
 *
 * @param {Object} props
 * @param {string} props.query - The sample query text
 * @param {function} props.onClick - Click handler for the query
 * @param {boolean} props.disabled - Whether the query is disabled
 * @returns {React.ReactElement} The sample query item element
 */
function SampleQueryItem({ query, onClick, disabled }) {
  const handleClick = useCallback((event) => {
    event.stopPropagation();
    if (!disabled && typeof onClick === 'function') {
      onClick(query);
    }
  }, [query, onClick, disabled]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      handleClick(event);
    }
  }, [handleClick]);

  return (
    <button
      type="button"
      className={[
        'w-full flex items-center gap-2 px-2.5 py-2 rounded-glass-sm',
        'text-left text-xs text-primary-200',
        'transition-all duration-200',
        'hover:bg-glass-light hover:text-primary-50',
        'focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
        'border border-transparent hover:border-glass-border',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      ]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-label={`Query: ${query}`}
    >
      <svg
        className="w-3 h-3 text-primary-300 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      <span className="truncate">{query}</span>
    </button>
  );
}

SampleQueryItem.propTypes = {
  query: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

SampleQueryItem.defaultProps = {
  disabled: false,
};

/**
 * IntelligenceClusterCard component.
 * Displays an intelligence cluster card with name, icon, description,
 * access level badge, and sample queries. Clickable to navigate to the
 * cluster-specific query view. Sample queries can be clicked to execute
 * a query directly.
 *
 * @param {Object} props
 * @param {string} props.clusterId - The intelligence cluster ID
 * @param {string} [props.accessLevel='read'] - Access level for the current persona ('full', 'read', 'none')
 * @param {boolean} [props.isPrimary=false] - Whether this is a primary cluster for the current persona
 * @param {string} [props.label] - Override display label for the cluster
 * @param {string} [props.description] - Override description for the cluster
 * @param {string} [props.icon] - Override icon for the cluster
 * @param {string} [props.color] - Override accent color for the cluster
 * @param {string[]} [props.sampleQueries] - Override sample queries for the cluster
 * @param {boolean} [props.showSampleQueries=true] - Whether to show sample queries
 * @param {boolean} [props.showAccessBadge=true] - Whether to show the access level badge
 * @param {boolean} [props.showDescription=true] - Whether to show the description
 * @param {boolean} [props.disabled=false] - Whether the card is disabled
 * @param {boolean} [props.animated=true] - Whether to apply entrance animation
 * @param {number} [props.animationDelay=0] - Animation delay in milliseconds
 * @param {function} [props.onNavigate] - Optional callback fired when the card is clicked
 * @param {function} [props.onQueryClick] - Optional callback fired when a sample query is clicked
 * @param {string} [props.className=''] - Additional CSS classes to apply
 * @returns {React.ReactElement|null} The intelligence cluster card component, or null if cluster not found
 */
function IntelligenceClusterCard({
  clusterId,
  accessLevel,
  isPrimary,
  label,
  description,
  icon,
  color,
  sampleQueries,
  showSampleQueries,
  showAccessBadge,
  showDescription,
  disabled,
  animated,
  animationDelay,
  onNavigate,
  onQueryClick,
  className,
}) {
  const { navigateTo } = useNavigation();
  const { persona } = useAuth();
  const { executeQuery, isLoading } = useQuery();

  /**
   * Resolves the cluster definition and display properties
   */
  const clusterDef = useMemo(() => {
    return resolveClusterDefinition(clusterId);
  }, [clusterId]);

  const displayLabel = typeof label === 'string' && label.trim().length > 0
    ? label
    : clusterDef ? clusterDef.label : 'Unknown Cluster';

  const displayDescription = typeof description === 'string' && description.trim().length > 0
    ? description
    : clusterDef ? clusterDef.description : '';

  const displayIcon = typeof icon === 'string' && icon.trim().length > 0
    ? icon
    : clusterDef ? clusterDef.icon : '📁';

  const displayColor = typeof color === 'string' && color.trim().length > 0
    ? color
    : clusterDef ? clusterDef.color : '#3B82F6';

  /**
   * Resolves sample queries to display
   */
  const resolvedSampleQueries = useMemo(() => {
    if (Array.isArray(sampleQueries) && sampleQueries.length > 0) {
      return sampleQueries.slice(0, MAX_SAMPLE_QUERIES);
    }
    return resolveSampleQueries(clusterId);
  }, [sampleQueries, clusterId]);

  /**
   * Resolves the target screen ID for navigation
   */
  const targetScreenId = useMemo(() => {
    return resolveClusterScreenId(clusterId);
  }, [clusterId]);

  /**
   * Handles card click to navigate to the cluster view
   */
  const handleCardClick = useCallback(() => {
    if (disabled || accessLevel === 'none') {
      return;
    }

    logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {
      action: 'CLUSTER_CARD_CLICK',
      clusterId,
      clusterLabel: displayLabel,
      persona,
    });

    if (typeof onNavigate === 'function') {
      onNavigate(clusterId, targetScreenId);
    }

    if (targetScreenId !== null) {
      navigateTo(targetScreenId);
    }
  }, [disabled, accessLevel, clusterId, displayLabel, persona, onNavigate, targetScreenId, navigateTo]);

  /**
   * Handles sample query click to execute the query
   *
   * @param {string} query - The sample query text
   */
  const handleQueryClick = useCallback(async (query) => {
    if (disabled || isLoading || accessLevel === 'none') {
      return;
    }

    logEvent(AUDIT_EVENT_TYPES.QUERY_SUBMIT, {
      action: 'CLUSTER_SAMPLE_QUERY_CLICK',
      clusterId,
      queryText: query,
      persona,
    });

    if (typeof onQueryClick === 'function') {
      onQueryClick(query, clusterId);
    }

    try {
      await executeQuery(query, { clusterId });
    } catch {
      // Error is handled by QueryContext
    }
  }, [disabled, isLoading, accessLevel, clusterId, persona, onQueryClick, executeQuery]);

  // Do not render if cluster ID is invalid
  if (typeof clusterId !== 'string' || clusterId.trim().length === 0) {
    return null;
  }

  const isDisabled = disabled || accessLevel === 'none';
  const accessClasses = getAccessLevelClasses(accessLevel);
  const accessLabel = getAccessLevelLabel(accessLevel);

  const cardContent = (
    <GlassCard
      variant="default"
      padding="none"
      hoverable={!isDisabled}
      animated={false}
      onClick={!isDisabled ? handleCardClick : undefined}
      className={[
        'overflow-hidden transition-all duration-300',
        isDisabled ? 'opacity-60 cursor-not-allowed' : '',
        isPrimary ? 'ring-1 ring-opacity-30' : '',
        className || '',
      ]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Cluster Icon */}
            <span
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
              style={{
                backgroundColor: displayColor ? `${displayColor}20` : 'rgba(59, 130, 246, 0.12)',
              }}
              aria-hidden="true"
            >
              {displayIcon}
            </span>

            {/* Cluster Name */}
            <div className="flex flex-col min-w-0">
              <h3 className="text-sm font-semibold text-primary-50 leading-tight truncate">
                {displayLabel}
              </h3>
              {isPrimary ? (
                <span className="flex items-center gap-1 mt-0.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: displayColor || '#3B82F6' }}
                    aria-hidden="true"
                  />
                  <span className="text-xs text-primary-300">Primary</span>
                </span>
              ) : null}
            </div>
          </div>

          {/* Access Badge */}
          {showAccessBadge ? (
            <span
              className={[
                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0',
                accessClasses.bg,
                accessClasses.text,
              ].join(' ')}
            >
              {accessLabel}
            </span>
          ) : null}
        </div>

        {/* Description */}
        {showDescription && displayDescription ? (
          <p className="text-xs text-primary-200 leading-relaxed mb-3 line-clamp-2">
            {displayDescription}
          </p>
        ) : null}

        {/* Color Accent Bar */}
        <div
          className="w-full h-0.5 rounded-full opacity-30"
          style={{ backgroundColor: displayColor || '#3B82F6' }}
          aria-hidden="true"
        />
      </div>

      {/* Sample Queries */}
      {showSampleQueries && resolvedSampleQueries.length > 0 && !isDisabled ? (
        <div className="px-5 pb-4 pt-2">
          <p className="text-xs text-primary-300 font-semibold uppercase tracking-wider mb-2">
            Sample Queries
          </p>
          <div className="flex flex-col gap-0.5">
            {resolvedSampleQueries.map((query, index) => (
              <SampleQueryItem
                key={`${clusterId}-query-${index}`}
                query={query}
                onClick={handleQueryClick}
                disabled={isLoading || isDisabled}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* Footer: Navigate CTA */}
      {!isDisabled ? (
        <div className="px-5 pb-4">
          <div className="flex items-center justify-between pt-2 border-t border-glass-border">
            <span className="text-xs text-primary-300">
              {resolvedSampleQueries.length > 0
                ? `${resolvedSampleQueries.length} sample queries`
                : 'Explore cluster'}
            </span>
            <div className="flex items-center gap-1 text-xs text-primary-200">
              <span>Explore</span>
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-5 pb-4">
          <div className="flex items-center justify-center pt-2 border-t border-glass-border">
            <span className="text-xs text-primary-300">
              Access restricted
            </span>
          </div>
        </div>
      )}
    </GlassCard>
  );

  if (animated) {
    return (
      <AnimatedTransition
        show
        type="scale"
        duration="normal"
        delay={typeof animationDelay === 'number' ? animationDelay : 0}
      >
        {cardContent}
      </AnimatedTransition>
    );
  }

  return cardContent;
}

IntelligenceClusterCard.propTypes = {
  clusterId: PropTypes.string.isRequired,
  accessLevel: PropTypes.oneOf(['full', 'read', 'none']),
  isPrimary: PropTypes.bool,
  label: PropTypes.string,
  description: PropTypes.string,
  icon: PropTypes.string,
  color: PropTypes.string,
  sampleQueries: PropTypes.arrayOf(PropTypes.string),
  showSampleQueries: PropTypes.bool,
  showAccessBadge: PropTypes.bool,
  showDescription: PropTypes.bool,
  disabled: PropTypes.bool,
  animated: PropTypes.bool,
  animationDelay: PropTypes.number,
  onNavigate: PropTypes.func,
  onQueryClick: PropTypes.func,
  className: PropTypes.string,
};

IntelligenceClusterCard.defaultProps = {
  accessLevel: 'read',
  isPrimary: false,
  label: undefined,
  description: undefined,
  icon: undefined,
  color: undefined,
  sampleQueries: undefined,
  showSampleQueries: true,
  showAccessBadge: true,
  showDescription: true,
  disabled: false,
  animated: true,
  animationDelay: 0,
  onNavigate: undefined,
  onQueryClick: undefined,
  className: '',
};

export default IntelligenceClusterCard;