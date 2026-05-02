/**
 * Intelligence cluster grid layout component for Ask Dreeso Memory.
 * Displays all 6 intelligence clusters in a responsive grid layout.
 * Responsive: 3-column on desktop, 2-column on tablet, 1-column on mobile.
 * Uses 12-column grid system.
 *
 * @module ClusterGrid
 * @see SCRUM-7897
 */

import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import IntelligenceClusterCard from './IntelligenceClusterCard';
import AnimatedTransition from '../ui/AnimatedTransition';
import { useAuth } from '../../context/AuthContext';
import { INTELLIGENCE_CLUSTERS } from '../../constants';
import { getAccessibleClusters, getPrimaryClusters } from '../../data/personaData';

/**
 * Animation stagger delay in milliseconds between each cluster card.
 * @type {number}
 */
const STAGGER_DELAY_MS = 80;

/**
 * Default ordering of intelligence cluster IDs for display.
 * @type {string[]}
 */
const DEFAULT_CLUSTER_ORDER = Object.freeze([
  INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id,
  INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id,
  INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id,
  INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id,
  INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id,
  INTELLIGENCE_CLUSTERS.KNOWLEDGE_IP.id,
]);

/**
 * Resolves the access level for a cluster given the persona's cluster access list.
 *
 * @param {string} clusterId - The intelligence cluster ID
 * @param {Object[]} accessibleClusters - Array of cluster access definitions
 * @returns {string} The access level ('full', 'read', 'none')
 */
function resolveAccessLevel(clusterId, accessibleClusters) {
  if (!Array.isArray(accessibleClusters) || accessibleClusters.length === 0) {
    return 'read';
  }

  const match = accessibleClusters.find((c) => c.clusterId === clusterId);
  return match ? match.accessLevel : 'none';
}

/**
 * Checks whether a cluster is a primary cluster for the current persona.
 *
 * @param {string} clusterId - The intelligence cluster ID
 * @param {Set<string>} primaryClusterIds - Set of primary cluster IDs
 * @returns {boolean} True if the cluster is primary
 */
function isPrimaryCluster(clusterId, primaryClusterIds) {
  return primaryClusterIds.has(clusterId);
}

/**
 * ClusterGrid component.
 * Renders all 6 intelligence clusters in a responsive grid layout.
 * Desktop: 3 columns, Tablet: 2 columns, Mobile: 1 column.
 * Each cluster card shows name, icon, description, access level badge,
 * and sample queries. Cards are sorted with primary clusters first,
 * then by access level (full > read > none).
 *
 * @param {Object} props
 * @param {string[]} [props.clusterIds] - Optional override for which cluster IDs to display and their order
 * @param {boolean} [props.showSampleQueries=true] - Whether to show sample queries on each card
 * @param {boolean} [props.showAccessBadge=true] - Whether to show the access level badge on each card
 * @param {boolean} [props.showDescription=true] - Whether to show the description on each card
 * @param {boolean} [props.showHeader=true] - Whether to show the section header above the grid
 * @param {boolean} [props.animated=true] - Whether to apply staggered entrance animations
 * @param {boolean} [props.hideInaccessible=false] - Whether to hide clusters with 'none' access level
 * @param {function} [props.onClusterNavigate] - Optional callback fired when a cluster card is clicked
 * @param {function} [props.onQueryClick] - Optional callback fired when a sample query is clicked
 * @param {string} [props.className=''] - Additional CSS classes to apply to the wrapper
 * @returns {React.ReactElement} The cluster grid component
 */
function ClusterGrid({
  clusterIds,
  showSampleQueries,
  showAccessBadge,
  showDescription,
  showHeader,
  animated,
  hideInaccessible,
  onClusterNavigate,
  onQueryClick,
  className,
}) {
  const { persona } = useAuth();

  /**
   * Resolves the full cluster access list for the current persona
   */
  const allClusterAccess = useMemo(() => {
    if (!persona) {
      return [];
    }
    return getAccessibleClusters(persona);
  }, [persona]);

  /**
   * Resolves the full cluster access list including 'none' access clusters
   */
  const fullClusterAccess = useMemo(() => {
    if (!persona) {
      return [];
    }

    // getAccessibleClusters only returns full/read, so we need to build the full list
    const { getClusterAccess } = require('../../data/personaData');
    return getClusterAccess(persona);
  }, [persona]);

  /**
   * Resolves primary cluster IDs for the current persona
   */
  const primaryClusterIds = useMemo(() => {
    if (!persona) {
      return new Set();
    }
    const primaries = getPrimaryClusters(persona);
    return new Set(primaries.map((c) => c.clusterId));
  }, [persona]);

  /**
   * Resolves the ordered list of cluster IDs to display
   */
  const resolvedClusterIds = useMemo(() => {
    // Use provided cluster IDs if available
    if (Array.isArray(clusterIds) && clusterIds.length > 0) {
      return clusterIds.filter(
        (id) => typeof id === 'string' && id.trim().length > 0
      );
    }

    // Default: sort by primary first, then by access level, then by default order
    const ordered = [...DEFAULT_CLUSTER_ORDER];

    if (persona && fullClusterAccess.length > 0) {
      ordered.sort((a, b) => {
        const aIsPrimary = primaryClusterIds.has(a) ? 0 : 1;
        const bIsPrimary = primaryClusterIds.has(b) ? 0 : 1;

        if (aIsPrimary !== bIsPrimary) {
          return aIsPrimary - bIsPrimary;
        }

        const accessOrder = { full: 0, read: 1, none: 2 };
        const aAccess = resolveAccessLevel(a, fullClusterAccess);
        const bAccess = resolveAccessLevel(b, fullClusterAccess);
        const aOrder = accessOrder[aAccess] !== undefined ? accessOrder[aAccess] : 3;
        const bOrder = accessOrder[bAccess] !== undefined ? accessOrder[bAccess] : 3;

        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }

        // Preserve default order for same access level
        return DEFAULT_CLUSTER_ORDER.indexOf(a) - DEFAULT_CLUSTER_ORDER.indexOf(b);
      });
    }

    return ordered;
  }, [clusterIds, persona, fullClusterAccess, primaryClusterIds]);

  /**
   * Filters out inaccessible clusters if hideInaccessible is true
   */
  const displayedClusterIds = useMemo(() => {
    if (!hideInaccessible) {
      return resolvedClusterIds;
    }

    return resolvedClusterIds.filter((clusterId) => {
      const accessLevel = resolveAccessLevel(clusterId, fullClusterAccess);
      return accessLevel !== 'none';
    });
  }, [resolvedClusterIds, hideInaccessible, fullClusterAccess]);

  /**
   * Handles cluster card navigation
   *
   * @param {string} clusterId - The cluster ID that was clicked
   * @param {number|null} screenId - The target screen ID
   */
  const handleClusterNavigate = useCallback((clusterId, screenId) => {
    if (typeof onClusterNavigate === 'function') {
      onClusterNavigate(clusterId, screenId);
    }
  }, [onClusterNavigate]);

  /**
   * Handles sample query click
   *
   * @param {string} query - The query text that was clicked
   * @param {string} clusterId - The cluster ID the query belongs to
   */
  const handleQueryClick = useCallback((query, clusterId) => {
    if (typeof onQueryClick === 'function') {
      onQueryClick(query, clusterId);
    }
  }, [onQueryClick]);

  const wrapperClassName = [
    'w-full',
    className || '',
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Empty state: no clusters to display
  if (displayedClusterIds.length === 0) {
    return (
      <div className={wrapperClassName}>
        {showHeader ? (
          <div className="flex items-center gap-2 mb-6">
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-blue bg-opacity-20"
              aria-hidden="true"
            >
              🧠
            </span>
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-primary-50 leading-tight">
                Intelligence Clusters
              </h2>
              <p className="text-sm text-primary-200 leading-tight">
                Explore data across enterprise domains
              </p>
            </div>
          </div>
        ) : null}
        <div className="flex flex-col items-center text-center py-12">
          <span className="text-3xl mb-4" aria-hidden="true">📁</span>
          <h3 className="text-lg font-semibold text-primary-50 mb-2">
            No Clusters Available
          </h3>
          <p className="text-sm text-primary-200 max-w-md">
            No intelligence clusters are available for your current persona. Please contact your administrator for access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClassName}>
      {/* Section Header */}
      {showHeader ? (
        <AnimatedTransition
          show
          type="fade"
          duration="fast"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-blue bg-opacity-20"
                aria-hidden="true"
              >
                🧠
              </span>
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold text-primary-50 leading-tight">
                  Intelligence Clusters
                </h2>
                <p className="text-sm text-primary-200 leading-tight">
                  Explore data across enterprise domains
                </p>
              </div>
            </div>
            <span className="text-xs text-primary-300">
              {displayedClusterIds.length} cluster{displayedClusterIds.length !== 1 ? 's' : ''}
            </span>
          </div>
        </AnimatedTransition>
      ) : null}

      {/* Cluster Grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6"
        role="list"
        aria-label="Intelligence clusters"
      >
        {displayedClusterIds.map((clusterId, index) => {
          const accessLevel = persona
            ? resolveAccessLevel(clusterId, fullClusterAccess)
            : 'read';
          const isPrimary = isPrimaryCluster(clusterId, primaryClusterIds);
          const animationDelay = animated ? index * STAGGER_DELAY_MS : 0;

          return (
            <div
              key={clusterId}
              className="col-span-1"
              role="listitem"
            >
              <IntelligenceClusterCard
                clusterId={clusterId}
                accessLevel={accessLevel}
                isPrimary={isPrimary}
                showSampleQueries={showSampleQueries}
                showAccessBadge={showAccessBadge}
                showDescription={showDescription}
                animated={animated}
                animationDelay={animationDelay}
                onNavigate={handleClusterNavigate}
                onQueryClick={handleQueryClick}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

ClusterGrid.propTypes = {
  clusterIds: PropTypes.arrayOf(PropTypes.string),
  showSampleQueries: PropTypes.bool,
  showAccessBadge: PropTypes.bool,
  showDescription: PropTypes.bool,
  showHeader: PropTypes.bool,
  animated: PropTypes.bool,
  hideInaccessible: PropTypes.bool,
  onClusterNavigate: PropTypes.func,
  onQueryClick: PropTypes.func,
  className: PropTypes.string,
};

ClusterGrid.defaultProps = {
  clusterIds: undefined,
  showSampleQueries: true,
  showAccessBadge: true,
  showDescription: true,
  showHeader: true,
  animated: true,
  hideInaccessible: false,
  onClusterNavigate: undefined,
  onQueryClick: undefined,
  className: '',
};

export default ClusterGrid;