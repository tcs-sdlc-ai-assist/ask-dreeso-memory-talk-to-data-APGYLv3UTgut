/**
 * Main navigation sidebar component for Ask Dreeso Memory.
 * Displays intelligence cluster links, screen navigation, and
 * persona-specific menu items. Uses useNavigation and useAuth contexts.
 *
 * @module Sidebar
 * @see SCRUM-7894
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { SCREEN_IDS, INTELLIGENCE_CLUSTERS, SYSTEMS } from '../../constants';
import { getScreenConfig, getScreensByPersona, FLOW_GROUPS } from '../../config/screenConfig';
import { getAccessibleClusters, getPrimaryClusters } from '../../data/personaData';

/**
 * Mapping from intelligence cluster IDs to screen IDs
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
 * Mapping from system IDs to screen IDs
 * @type {Object.<string, number>}
 */
const SYSTEM_SCREEN_MAP = Object.freeze({
  [SYSTEMS.SAP.id]: SCREEN_IDS.SYSTEM_SAP,
  [SYSTEMS.PROCORE.id]: SCREEN_IDS.SYSTEM_PROCORE,
  [SYSTEMS.SALESFORCE.id]: SCREEN_IDS.SYSTEM_SALESFORCE,
  [SYSTEMS.PRIMAVERA.id]: SCREEN_IDS.SYSTEM_PRIMAVERA,
});

/**
 * Core navigation items available to all authenticated users
 * @type {Array<{ id: string, label: string, screenId: number, icon: string }>}
 */
const CORE_NAV_ITEMS = Object.freeze([
  {
    id: 'dashboard',
    label: 'Dashboard',
    screenId: SCREEN_IDS.DASHBOARD,
    icon: '📊',
  },
  {
    id: 'query',
    label: 'Ask Dreeso',
    screenId: SCREEN_IDS.QUERY_INPUT,
    icon: '🔍',
  },
]);

/**
 * Utility navigation items at the bottom of the sidebar
 * @type {Array<{ id: string, label: string, screenId: number, icon: string }>}
 */
const UTILITY_NAV_ITEMS = Object.freeze([
  {
    id: 'settings',
    label: 'Settings',
    screenId: SCREEN_IDS.SETTINGS,
    icon: '⚙️',
  },
  {
    id: 'audit-log',
    label: 'Audit Log',
    screenId: SCREEN_IDS.AUDIT_LOG,
    icon: '📋',
  },
]);

/**
 * Resolves the accent color for a persona.
 *
 * @param {string|null} persona - The persona ID
 * @returns {string} The accent color hex string
 */
function resolvePersonaAccent(persona) {
  if (!persona) {
    return '#3B82F6';
  }

  const colorMap = {
    lukas: '#3B82F6',
    elena: '#8B5CF6',
    sophie: '#EC4899',
    james: '#F59E0B',
  };

  const normalized = persona.toLowerCase();
  return colorMap[normalized] || '#3B82F6';
}

/**
 * NavItem sub-component.
 * Renders a single navigation item button.
 *
 * @param {Object} props
 * @param {string} props.icon - Emoji or icon identifier
 * @param {string} props.label - Display label
 * @param {boolean} props.isActive - Whether this item is currently active
 * @param {boolean} props.collapsed - Whether the sidebar is collapsed
 * @param {function} props.onClick - Click handler
 * @param {string} [props.accentColor] - Optional accent color for active state
 * @param {boolean} [props.isPrimary] - Whether this is a primary cluster item
 * @returns {React.ReactElement} The navigation item element
 */
function NavItem({ icon, label, isActive, collapsed, onClick, accentColor, isPrimary }) {
  const activeClasses = isActive
    ? 'bg-glass-light border-l-2 text-primary-50'
    : 'border-l-2 border-transparent text-primary-200 hover:bg-glass-light hover:text-primary-50';

  const activeBorderStyle = isActive && accentColor
    ? { borderLeftColor: accentColor }
    : isActive
      ? { borderLeftColor: '#3B82F6' }
      : undefined;

  return (
    <button
      type="button"
      className={[
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-glass-sm transition-all duration-200 text-left',
        activeClasses,
        collapsed ? 'justify-center' : '',
      ]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()}
      style={activeBorderStyle}
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="text-base flex-shrink-0" aria-hidden="true">
        {icon}
      </span>
      {!collapsed ? (
        <span className="text-sm font-medium truncate flex-1">
          {label}
        </span>
      ) : null}
      {!collapsed && isPrimary ? (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: accentColor || '#3B82F6' }}
          aria-hidden="true"
        />
      ) : null}
    </button>
  );
}

/**
 * SectionHeader sub-component.
 * Renders a section header label in the sidebar.
 *
 * @param {Object} props
 * @param {string} props.label - Section header label
 * @param {boolean} props.collapsed - Whether the sidebar is collapsed
 * @returns {React.ReactElement|null} The section header element or null if collapsed
 */
function SectionHeader({ label, collapsed }) {
  if (collapsed) {
    return (
      <div className="my-2 mx-3 border-t border-glass-border" aria-hidden="true" />
    );
  }

  return (
    <div className="px-3 pt-4 pb-1">
      <p className="text-xs text-primary-300 font-semibold uppercase tracking-wider">
        {label}
      </p>
    </div>
  );
}

/**
 * Sidebar component.
 * Renders the main navigation sidebar with intelligence cluster links,
 * screen navigation, and persona-specific menu items. Supports collapsed
 * and expanded states. Uses useNavigation and useAuth contexts.
 *
 * @returns {React.ReactElement|null} The sidebar component, or null if not authenticated
 */
function Sidebar() {
  const { isAuthenticated, persona } = useAuth();
  const { navigateTo, currentScreen } = useNavigation();
  const [collapsed, setCollapsed] = useState(false);

  /**
   * Toggles the sidebar collapsed state
   */
  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  /**
   * Handles navigation to a screen
   * @param {number} screenId - The screen ID to navigate to
   */
  const handleNavigate = useCallback((screenId) => {
    navigateTo(screenId);
  }, [navigateTo]);

  /**
   * Resolves accessible clusters for the current persona
   */
  const accessibleClusters = useMemo(() => {
    if (!persona) {
      return [];
    }
    return getAccessibleClusters(persona);
  }, [persona]);

  /**
   * Resolves primary clusters for the current persona
   */
  const primaryClusterIds = useMemo(() => {
    if (!persona) {
      return new Set();
    }
    const primaries = getPrimaryClusters(persona);
    return new Set(primaries.map((c) => c.clusterId));
  }, [persona]);

  /**
   * Builds cluster navigation items from accessible clusters
   */
  const clusterNavItems = useMemo(() => {
    return accessibleClusters
      .map((cluster) => {
        const screenId = CLUSTER_SCREEN_MAP[cluster.clusterId];
        if (screenId === undefined) {
          return null;
        }

        const clusterDef = Object.values(INTELLIGENCE_CLUSTERS).find(
          (c) => c.id === cluster.clusterId
        );

        return {
          id: cluster.clusterId,
          label: cluster.label,
          screenId,
          icon: clusterDef ? clusterDef.icon : '📁',
          isPrimary: primaryClusterIds.has(cluster.clusterId),
          accessLevel: cluster.accessLevel,
        };
      })
      .filter(Boolean);
  }, [accessibleClusters, primaryClusterIds]);

  /**
   * Builds system navigation items based on persona's connected systems
   */
  const systemNavItems = useMemo(() => {
    if (!persona) {
      return [];
    }

    const items = [];
    const systemValues = Object.values(SYSTEMS);

    for (const system of systemValues) {
      const screenId = SYSTEM_SCREEN_MAP[system.id];
      if (screenId === undefined) {
        continue;
      }

      const screenConfig = getScreenConfig(screenId);
      if (!screenConfig) {
        continue;
      }

      // Show system if it's associated with the current persona or has no persona restriction
      if (screenConfig.persona === null || screenConfig.persona === persona) {
        items.push({
          id: system.id,
          label: system.label,
          screenId,
          icon: '🖥️',
          color: system.color,
        });
      }
    }

    return items;
  }, [persona]);

  const accentColor = resolvePersonaAccent(persona);

  // Do not render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav
      className={[
        'flex flex-col h-full glass-sm transition-all duration-300 ease-in-out overflow-hidden',
        collapsed ? 'w-16' : 'w-64',
      ].join(' ')}
      aria-label="Main navigation"
    >
      {/* Header / Collapse Toggle */}
      <div className={[
        'flex items-center px-3 py-4 border-b border-glass-border',
        collapsed ? 'justify-center' : 'justify-between',
      ].join(' ')}>
        {!collapsed ? (
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ backgroundColor: accentColor }}
              aria-hidden="true"
            >
              D
            </span>
            <span className="text-sm font-semibold text-primary-50 truncate">
              Dreeso Memory
            </span>
          </div>
        ) : null}
        <button
          type="button"
          className="flex items-center justify-center w-8 h-8 rounded-glass-sm text-primary-200 hover:bg-glass-light hover:text-primary-50 transition-all duration-200 flex-shrink-0"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={[
              'w-4 h-4 transition-transform duration-200',
              collapsed ? 'rotate-180' : '',
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
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      {/* Scrollable Navigation Content */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Core Navigation */}
        <SectionHeader label="Navigation" collapsed={collapsed} />
        <div className="flex flex-col gap-0.5 px-1">
          {CORE_NAV_ITEMS.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={currentScreen === item.screenId}
              collapsed={collapsed}
              onClick={() => handleNavigate(item.screenId)}
              accentColor={accentColor}
              isPrimary={false}
            />
          ))}
        </div>

        {/* Intelligence Clusters */}
        {clusterNavItems.length > 0 ? (
          <>
            <SectionHeader label="Intelligence Clusters" collapsed={collapsed} />
            <div className="flex flex-col gap-0.5 px-1">
              {clusterNavItems.map((item) => (
                <NavItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  isActive={currentScreen === item.screenId}
                  collapsed={collapsed}
                  onClick={() => handleNavigate(item.screenId)}
                  accentColor={accentColor}
                  isPrimary={item.isPrimary}
                />
              ))}
            </div>
          </>
        ) : null}

        {/* Connected Systems */}
        {systemNavItems.length > 0 ? (
          <>
            <SectionHeader label="Systems" collapsed={collapsed} />
            <div className="flex flex-col gap-0.5 px-1">
              {systemNavItems.map((item) => (
                <NavItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  isActive={currentScreen === item.screenId}
                  collapsed={collapsed}
                  onClick={() => handleNavigate(item.screenId)}
                  accentColor={item.color || accentColor}
                  isPrimary={false}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {/* Utility Navigation (bottom) */}
      <div className="border-t border-glass-border py-2">
        <div className="flex flex-col gap-0.5 px-1">
          {UTILITY_NAV_ITEMS.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={currentScreen === item.screenId}
              collapsed={collapsed}
              onClick={() => handleNavigate(item.screenId)}
              accentColor={accentColor}
              isPrimary={false}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}

export default Sidebar;