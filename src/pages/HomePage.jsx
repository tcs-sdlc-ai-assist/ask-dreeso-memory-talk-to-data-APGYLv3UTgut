/**
 * Main home/dashboard screen for Ask Dreeso Memory.
 * Screen 3: Displays intelligence cluster grid, persona-specific welcome message,
 * recent queries, quick action shortcuts, system status, and risk alerts.
 * Entry point for all persona flows.
 *
 * @module HomePage
 * @see SCRUM-7897
 * @see SCRUM-7892
 */

import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { useQuery } from '../context/QueryContext';
import { useUIState } from '../context/UIStateContext';
import GlassCard from '../components/ui/GlassCard';
import AnimatedTransition from '../components/ui/AnimatedTransition';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ClusterGrid from '../components/clusters/ClusterGrid';
import CTABubbles from '../components/query/CTABubbles';
import { SCREEN_IDS, INTELLIGENCE_CLUSTERS, SYSTEMS } from '../constants';
import { getScreenPath } from '../config/screenConfig';
import { getAccessibleClusters, getPrimaryClusters, getConnectedSystems } from '../data/personaData';
import { DASHBOARD_SUMMARY, RISK_SIGNALS } from '../data/mockData';
import { logEvent, AUDIT_EVENT_TYPES } from '../services/AuditLogger';

/**
 * Animation stagger delay in milliseconds between each section.
 * @type {number}
 */
const STAGGER_DELAY_MS = 100;

/**
 * Maximum number of recent activity items to display.
 * @type {number}
 */
const MAX_RECENT_ACTIVITY = 5;

/**
 * Maximum number of risk alerts to display on the dashboard.
 * @type {number}
 */
const MAX_RISK_ALERTS = 3;

/**
 * Resolves the accent color for a persona.
 *
 * @param {string|null} persona - The persona ID
 * @returns {string} The accent color hex string
 */
function resolvePersonaColor(persona) {
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
 * Resolves the display name for the current user.
 *
 * @param {Object|null} user - The current user object
 * @param {string|null} persona - The persona ID
 * @returns {string} The display name
 */
function resolveDisplayName(user, persona) {
  if (user && typeof user.fullName === 'string' && user.fullName.trim().length > 0) {
    return user.fullName.trim();
  }

  if (typeof persona === 'string' && persona.length > 0) {
    return persona.charAt(0).toUpperCase() + persona.slice(1);
  }

  return 'User';
}

/**
 * Resolves the display role for the current user.
 *
 * @param {Object|null} user - The current user object
 * @param {string|null} role - The role from auth context
 * @returns {string} The display role
 */
function resolveDisplayRole(user, role) {
  if (user && typeof user.role === 'string' && user.role.trim().length > 0) {
    return user.role.trim();
  }

  if (typeof role === 'string' && role.trim().length > 0) {
    return role.trim();
  }

  return 'User';
}

/**
 * Resolves the avatar initial for the current user.
 *
 * @param {Object|null} user - The current user object
 * @param {string|null} persona - The persona ID
 * @returns {string} The avatar initial character
 */
function resolveAvatarInitial(user, persona) {
  if (user && typeof user.fullName === 'string' && user.fullName.trim().length > 0) {
    return user.fullName.trim().charAt(0).toUpperCase();
  }

  if (typeof persona === 'string' && persona.length > 0) {
    return persona.charAt(0).toUpperCase();
  }

  return 'U';
}

/**
 * Resolves the severity color class for an activity or risk item.
 *
 * @param {string} severity - The severity level
 * @returns {{ text: string, bg: string, border: string }} Tailwind classes
 */
function getSeverityClasses(severity) {
  switch (severity) {
    case 'critical':
      return {
        text: 'text-red-400',
        bg: 'bg-red-400 bg-opacity-15',
        border: 'border-red-400 border-opacity-20',
      };
    case 'high':
      return {
        text: 'text-orange-400',
        bg: 'bg-orange-400 bg-opacity-15',
        border: 'border-orange-400 border-opacity-20',
      };
    case 'medium':
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-400 bg-opacity-15',
        border: 'border-amber-400 border-opacity-20',
      };
    case 'low':
    default:
      return {
        text: 'text-green-400',
        bg: 'bg-green-400 bg-opacity-15',
        border: 'border-green-400 border-opacity-20',
      };
  }
}

/**
 * Resolves the severity icon for a risk signal.
 *
 * @param {string} severity - The severity level
 * @returns {string} Emoji icon
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
 * Resolves the activity type icon.
 *
 * @param {string} type - The activity type
 * @returns {string} Emoji icon
 */
function getActivityIcon(type) {
  switch (type) {
    case 'alert':
      return '⚠️';
    case 'update':
      return '🔄';
    case 'action':
      return '⚡';
    case 'insight':
      return '💡';
    default:
      return '📋';
  }
}

/**
 * Formats an ISO timestamp to a relative or short format.
 *
 * @param {string|null} isoTimestamp - ISO 8601 timestamp string
 * @returns {string} Formatted time string
 */
function formatRelativeTime(isoTimestamp) {
  if (typeof isoTimestamp !== 'string' || isoTimestamp.length === 0) {
    return 'Just now';
  }

  try {
    const date = new Date(isoTimestamp);
    if (isNaN(date.getTime())) {
      return 'Just now';
    }

    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) {
      return 'Just now';
    }
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }

    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return 'Just now';
  }
}

/**
 * KPICard sub-component.
 * Renders a single KPI metric card.
 *
 * @param {Object} props
 * @param {Object} props.kpi - The KPI data object
 * @param {number} props.index - Index for staggered animation delay
 * @returns {React.ReactElement} The KPI card element
 */
function KPICard({ kpi, index }) {
  if (!kpi || typeof kpi !== 'object') {
    return null;
  }

  const label = typeof kpi.label === 'string' ? kpi.label : 'Metric';
  const value = kpi.value !== undefined && kpi.value !== null ? kpi.value : 0;
  const unit = typeof kpi.unit === 'string' ? kpi.unit : '';
  const icon = typeof kpi.icon === 'string' ? kpi.icon : '📊';
  const trend = typeof kpi.trend === 'string' ? kpi.trend : 'stable';
  const changePercent = typeof kpi.changePercent === 'number' ? kpi.changePercent : 0;

  const trendColor = trend === 'up'
    ? 'text-green-400'
    : trend === 'down'
      ? 'text-red-400'
      : 'text-primary-300';

  const trendArrow = trend === 'up'
    ? '↑'
    : trend === 'down'
      ? '↓'
      : '→';

  return (
    <AnimatedTransition
      show
      type="scale"
      duration="fast"
      delay={index * 60}
    >
      <div className="glass-sm p-4 flex flex-col items-center text-center h-full">
        <span className="text-lg mb-1" aria-hidden="true">{icon}</span>
        <span className="text-xl font-bold text-primary-50">
          {typeof value === 'number' ? value.toLocaleString() : value}
          {unit ? <span className="text-sm font-normal text-primary-200 ml-0.5">{unit}</span> : null}
        </span>
        <span className="text-xs text-primary-300 mt-0.5">{label}</span>
        {changePercent !== 0 ? (
          <span className={['text-xs mt-1 font-medium', trendColor].join(' ')}>
            {trendArrow} {changePercent > 0 ? '+' : ''}{changePercent}%
          </span>
        ) : null}
      </div>
    </AnimatedTransition>
  );
}

/**
 * ActivityItem sub-component.
 * Renders a single recent activity row.
 *
 * @param {Object} props
 * @param {Object} props.activity - The activity data object
 * @param {number} props.index - Index for staggered animation delay
 * @returns {React.ReactElement} The activity item element
 */
function ActivityItem({ activity, index }) {
  if (!activity || typeof activity !== 'object') {
    return null;
  }

  const type = typeof activity.type === 'string' ? activity.type : 'update';
  const message = typeof activity.message === 'string' ? activity.message : '';
  const timestamp = typeof activity.timestamp === 'string' ? activity.timestamp : null;
  const severity = typeof activity.severity === 'string' ? activity.severity : 'low';

  const icon = getActivityIcon(type);
  const severityClasses = getSeverityClasses(severity);

  return (
    <AnimatedTransition
      show
      type="slide-up"
      duration="fast"
      delay={index * 60}
    >
      <div
        className={[
          'flex items-start gap-3 px-3 py-2.5 rounded-glass-sm border transition-all duration-200',
          'hover:bg-glass-light',
          severityClasses.border,
        ]
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()}
      >
        <span className="text-sm flex-shrink-0 mt-0.5" aria-hidden="true">
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-primary-100 leading-relaxed">
            {message}
          </p>
        </div>
        <span className="text-xs text-primary-300 flex-shrink-0 whitespace-nowrap">
          {formatRelativeTime(timestamp)}
        </span>
      </div>
    </AnimatedTransition>
  );
}

/**
 * SystemStatusItem sub-component.
 * Renders a single system status indicator.
 *
 * @param {Object} props
 * @param {Object} props.system - The system status object
 * @param {number} props.index - Index for staggered animation delay
 * @returns {React.ReactElement} The system status item element
 */
function SystemStatusItem({ system, index }) {
  if (!system || typeof system !== 'object') {
    return null;
  }

  const label = typeof system.label === 'string' ? system.label : 'System';
  const systemId = typeof system.systemId === 'string' ? system.systemId : '';
  const status = typeof system.status === 'string' ? system.status : 'unknown';
  const health = typeof system.health === 'string' ? system.health : 'unknown';
  const lastSync = typeof system.lastSync === 'string' ? system.lastSync : null;

  const systemValues = Object.values(SYSTEMS);
  const systemDef = systemValues.find((s) => s.id === systemId);
  const color = systemDef ? systemDef.color : '#6B7280';

  const statusDotColor = status === 'connected'
    ? 'bg-green-400'
    : status === 'degraded'
      ? 'bg-amber-400'
      : status === 'disconnected'
        ? 'bg-red-400'
        : 'bg-primary-300';

  const statusLabel = status === 'connected'
    ? 'Connected'
    : status === 'degraded'
      ? 'Degraded'
      : status === 'disconnected'
        ? 'Disconnected'
        : 'Unknown';

  return (
    <AnimatedTransition
      show
      type="scale"
      duration="fast"
      delay={index * 60}
    >
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-glass-sm bg-glass-light">
        <span
          className={[
            'w-2 h-2 rounded-full flex-shrink-0',
            statusDotColor,
            status === 'connected' ? 'animate-pulse' : '',
          ]
            .filter(Boolean)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim()}
          aria-hidden="true"
        />
        <span
          className="w-1 h-5 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-sm font-medium text-primary-50 truncate">
            {label}
          </span>
          <span className="text-xs text-primary-300">
            {statusLabel}
            {lastSync ? ` · ${formatRelativeTime(lastSync)}` : ''}
          </span>
        </div>
        {health === 'degraded' ? (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-400 bg-opacity-15 text-amber-400 flex-shrink-0">
            Degraded
          </span>
        ) : null}
      </div>
    </AnimatedTransition>
  );
}

/**
 * RiskAlertItem sub-component.
 * Renders a single risk alert row.
 *
 * @param {Object} props
 * @param {Object} props.signal - The risk signal object
 * @param {number} props.index - Index for staggered animation delay
 * @returns {React.ReactElement} The risk alert item element
 */
function RiskAlertItem({ signal, index }) {
  if (!signal || typeof signal !== 'object') {
    return null;
  }

  const severity = typeof signal.severity === 'string' ? signal.severity : 'medium';
  const title = typeof signal.title === 'string' ? signal.title : '';
  const message = typeof signal.message === 'string' ? signal.message : '';
  const category = typeof signal.category === 'string' ? signal.category : '';

  const severityClasses = getSeverityClasses(severity);
  const severityIcon = getSeverityIcon(severity);

  return (
    <AnimatedTransition
      show
      type="slide-up"
      duration="fast"
      delay={index * 80}
    >
      <div
        className={[
          'flex items-start gap-3 px-4 py-3 rounded-glass-sm border',
          severityClasses.bg,
          severityClasses.border,
        ]
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()}
      >
        <span className="text-sm flex-shrink-0 mt-0.5" aria-hidden="true">
          {severityIcon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={[
                'text-xs font-semibold uppercase px-2 py-0.5 rounded-full',
                severityClasses.bg,
                severityClasses.text,
              ].join(' ')}
            >
              {severity}
            </span>
            {category ? (
              <span className="text-xs text-primary-300 capitalize">
                {category}
              </span>
            ) : null}
          </div>
          {title ? (
            <h4 className="text-sm font-medium text-primary-50 mb-0.5">
              {title}
            </h4>
          ) : null}
          <p className="text-xs text-primary-200 leading-relaxed line-clamp-2">
            {message}
          </p>
        </div>
      </div>
    </AnimatedTransition>
  );
}

/**
 * QuickActionButton sub-component.
 * Renders a single quick action shortcut button.
 *
 * @param {Object} props
 * @param {string} props.icon - Emoji icon
 * @param {string} props.label - Button label
 * @param {function} props.onClick - Click handler
 * @param {number} props.index - Index for staggered animation delay
 * @returns {React.ReactElement} The quick action button element
 */
function QuickActionButton({ icon, label, onClick, index }) {
  const handleClick = useCallback(() => {
    if (typeof onClick === 'function') {
      onClick();
    }
  }, [onClick]);

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
      delay={index * 60}
    >
      <button
        type="button"
        className={[
          'flex flex-col items-center gap-2 px-4 py-3 rounded-glass-sm',
          'border border-glass-border',
          'transition-all duration-300 ease-in-out',
          'hover:bg-glass-light hover:border-primary-300',
          'focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
          'cursor-pointer',
        ]
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={label}
      >
        <span className="text-xl" aria-hidden="true">{icon}</span>
        <span className="text-xs text-primary-200 font-medium text-center leading-tight">
          {label}
        </span>
      </button>
    </AnimatedTransition>
  );
}

/**
 * HomePage component.
 * Renders the main home/dashboard screen displaying intelligence cluster grid,
 * persona-specific welcome message, KPI metrics, recent activity, system status,
 * risk alerts, quick action shortcuts, and CTA bubbles.
 *
 * @returns {React.ReactElement} The home page component
 */
function HomePage() {
  const { user, isAuthenticated, persona, role } = useAuth();
  const { navigateTo } = useNavigation();
  const { executeQuery, isLoading: queryLoading } = useQuery();
  const { state } = useUIState();

  /**
   * Log screen view on mount
   */
  useEffect(() => {
    logEvent(AUDIT_EVENT_TYPES.SCREEN_VIEW, {
      screenId: SCREEN_IDS.DASHBOARD,
      screenName: 'Dashboard',
      persona,
    });
  }, [persona]);

  /**
   * Resolves dashboard summary data
   */
  const dashboardData = useMemo(() => {
    return DASHBOARD_SUMMARY;
  }, []);

  /**
   * Resolves KPI data
   */
  const kpis = useMemo(() => {
    if (dashboardData && Array.isArray(dashboardData.kpis)) {
      return dashboardData.kpis;
    }
    return [];
  }, [dashboardData]);

  /**
   * Resolves recent activity data
   */
  const recentActivity = useMemo(() => {
    if (dashboardData && Array.isArray(dashboardData.recentActivity)) {
      return dashboardData.recentActivity.slice(0, MAX_RECENT_ACTIVITY);
    }
    return [];
  }, [dashboardData]);

  /**
   * Resolves system status data
   */
  const systemStatus = useMemo(() => {
    if (dashboardData && Array.isArray(dashboardData.systemStatus)) {
      return dashboardData.systemStatus;
    }
    return [];
  }, [dashboardData]);

  /**
   * Resolves top risk signals
   */
  const topRiskSignals = useMemo(() => {
    if (Array.isArray(RISK_SIGNALS)) {
      return RISK_SIGNALS.slice(0, MAX_RISK_ALERTS);
    }
    return [];
  }, []);

  /**
   * Resolves connected systems for the current persona
   */
  const connectedSystems = useMemo(() => {
    if (!persona) {
      return [];
    }
    return getConnectedSystems(persona);
  }, [persona]);

  /**
   * Handles cluster card navigation
   *
   * @param {string} clusterId - The cluster ID that was clicked
   * @param {number|null} screenId - The target screen ID
   */
  const handleClusterNavigate = useCallback((clusterId, screenId) => {
    logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {
      action: 'DASHBOARD_CLUSTER_CLICK',
      clusterId,
      persona,
    });

    if (typeof screenId === 'number') {
      navigateTo(screenId);
    }
  }, [persona, navigateTo]);

  /**
   * Handles sample query click from cluster cards
   *
   * @param {string} query - The query text that was clicked
   * @param {string} clusterId - The cluster ID the query belongs to
   */
  const handleQueryClick = useCallback(async (query, clusterId) => {
    logEvent(AUDIT_EVENT_TYPES.QUERY_SUBMIT, {
      action: 'DASHBOARD_QUERY_CLICK',
      queryText: query,
      clusterId,
      persona,
    });

    try {
      await executeQuery(query, { clusterId });
    } catch {
      // Error is handled by QueryContext
    }
  }, [persona, executeQuery]);

  /**
   * Handles navigation to the query input screen
   */
  const handleAskDreeso = useCallback(() => {
    logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {
      action: 'DASHBOARD_ASK_DREESO',
      persona,
    });

    navigateTo(SCREEN_IDS.QUERY_INPUT);
  }, [persona, navigateTo]);

  /**
   * Handles navigation to the settings screen
   */
  const handleSettings = useCallback(() => {
    navigateTo(SCREEN_IDS.SETTINGS);
  }, [navigateTo]);

  /**
   * Handles navigation to the audit log screen
   */
  const handleAuditLog = useCallback(() => {
    navigateTo(SCREEN_IDS.AUDIT_LOG);
  }, [navigateTo]);

  /**
   * Handles CTA bubble click
   *
   * @param {Object} bubble - The clicked CTA bubble object
   */
  const handleBubbleClick = useCallback((bubble) => {
    logEvent(AUDIT_EVENT_TYPES.CTA_CLICK, {
      action: 'DASHBOARD_CTA_CLICK',
      bubbleLabel: bubble ? bubble.label : null,
      persona,
    });
  }, [persona]);

  const accentColor = resolvePersonaColor(persona);
  const displayName = resolveDisplayName(user, persona);
  const displayRole = resolveDisplayRole(user, role);
  const avatarInitial = resolveAvatarInitial(user, persona);

  /**
   * Quick action shortcuts data
   */
  const quickActions = useMemo(() => [
    {
      icon: '🔍',
      label: 'Ask Dreeso',
      onClick: handleAskDreeso,
    },
    {
      icon: '📊',
      label: 'View Reports',
      onClick: () => {
        navigateTo(SCREEN_IDS.QUERY_INPUT);
      },
    },
    {
      icon: '⚙️',
      label: 'Settings',
      onClick: handleSettings,
    },
    {
      icon: '📋',
      label: 'Audit Log',
      onClick: handleAuditLog,
    },
  ], [handleAskDreeso, handleSettings, handleAuditLog, navigateTo]);

  // Do not render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
      {/* Welcome Section */}
      <AnimatedTransition show type="fade" duration="normal">
        <GlassCard variant="default" padding="lg" animated>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {/* Persona Avatar */}
              <div
                className="flex items-center justify-center w-14 h-14 rounded-full text-xl font-bold text-white flex-shrink-0 shadow-accent-glow"
                style={{ backgroundColor: accentColor }}
                aria-hidden="true"
              >
                {avatarInitial}
              </div>

              <div className="flex flex-col">
                <h1 className="text-xl font-semibold text-primary-50 leading-tight">
                  Welcome back, {displayName}
                </h1>
                <p className="text-sm text-primary-200 mt-0.5">
                  {displayRole} · {import.meta.env.VITE_APP_TITLE || 'Ask Dreeso Memory'}
                </p>
              </div>
            </div>

            {/* Ask Dreeso CTA */}
            <button
              type="button"
              className={[
                'flex items-center gap-2 px-5 py-2.5 rounded-glass-sm',
                'text-sm font-semibold text-white',
                'bg-accent-blue hover:bg-opacity-90 active:bg-opacity-80 shadow-accent-glow',
                'transition-all duration-300 ease-in-out',
                'focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
              ]
                .filter(Boolean)
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim()}
              onClick={handleAskDreeso}
              aria-label="Ask Dreeso a question"
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
              <span>Ask Dreeso</span>
            </button>
          </div>
        </GlassCard>
      </AnimatedTransition>

      {/* KPI Metrics */}
      {kpis.length > 0 ? (
        <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS}>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-blue bg-opacity-20"
                aria-hidden="true"
              >
                📊
              </span>
              <h2 className="text-base font-semibold text-primary-50 leading-tight">
                Key Metrics
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {kpis.map((kpi, index) => (
                <KPICard
                  key={kpi.id || `kpi-${index}`}
                  kpi={kpi}
                  index={index}
                />
              ))}
            </div>
          </div>
        </AnimatedTransition>
      ) : null}

      {/* Quick Actions */}
      <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 2}>
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-blue bg-opacity-20"
              aria-hidden="true"
            >
              ⚡
            </span>
            <h2 className="text-base font-semibold text-primary-50 leading-tight">
              Quick Actions
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((action, index) => (
              <QuickActionButton
                key={`quick-action-${index}`}
                icon={action.icon}
                label={action.label}
                onClick={action.onClick}
                index={index}
              />
            ))}
          </div>
        </div>
      </AnimatedTransition>

      {/* CTA Bubbles */}
      <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 3}>
        <CTABubbles
          onBubbleClick={handleBubbleClick}
          showHeader
          className=""
        />
      </AnimatedTransition>

      {/* Intelligence Clusters */}
      <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 4}>
        <ClusterGrid
          showSampleQueries
          showAccessBadge
          showDescription
          showHeader
          animated
          hideInaccessible={false}
          onClusterNavigate={handleClusterNavigate}
          onQueryClick={handleQueryClick}
        />
      </AnimatedTransition>

      {/* Bottom Grid: Risk Alerts + Recent Activity + System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Alerts */}
        {topRiskSignals.length > 0 ? (
          <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 5}>
            <GlassCard variant="default" padding="md" animated>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-red-400 bg-opacity-20"
                    aria-hidden="true"
                  >
                    🚨
                  </span>
                  <h2 className="text-sm font-semibold text-primary-50 leading-tight">
                    Risk Alerts
                  </h2>
                </div>
                <span className="text-xs text-primary-300">
                  {topRiskSignals.length} alert{topRiskSignals.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {topRiskSignals.map((signal, index) => (
                  <RiskAlertItem
                    key={signal.id || `risk-${index}`}
                    signal={signal}
                    index={index}
                  />
                ))}
              </div>
            </GlassCard>
          </AnimatedTransition>
        ) : null}

        {/* Recent Activity */}
        {recentActivity.length > 0 ? (
          <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 6}>
            <GlassCard variant="default" padding="md" animated>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-blue bg-opacity-20"
                    aria-hidden="true"
                  >
                    📋
                  </span>
                  <h2 className="text-sm font-semibold text-primary-50 leading-tight">
                    Recent Activity
                  </h2>
                </div>
                <span className="text-xs text-primary-300">
                  {recentActivity.length} item{recentActivity.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {recentActivity.map((activity, index) => (
                  <ActivityItem
                    key={activity.id || `activity-${index}`}
                    activity={activity}
                    index={index}
                  />
                ))}
              </div>
            </GlassCard>
          </AnimatedTransition>
        ) : null}

        {/* System Status */}
        {systemStatus.length > 0 ? (
          <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 7}>
            <GlassCard variant="default" padding="md" animated>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-teal bg-opacity-20"
                    aria-hidden="true"
                  >
                    🖥️
                  </span>
                  <h2 className="text-sm font-semibold text-primary-50 leading-tight">
                    System Status
                  </h2>
                </div>
                <span className="text-xs text-primary-300">
                  {systemStatus.length} system{systemStatus.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {systemStatus.map((system, index) => (
                  <SystemStatusItem
                    key={system.systemId || `system-${index}`}
                    system={system}
                    index={index}
                  />
                ))}
              </div>

              {/* Connected Systems for Persona */}
              {connectedSystems.length > 0 ? (
                <div className="mt-4 pt-3 border-t border-glass-border">
                  <p className="text-xs text-primary-300 font-medium uppercase tracking-wider mb-2">
                    Your Connected Systems
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {connectedSystems.map((systemId) => {
                      const systemValues = Object.values(SYSTEMS);
                      const systemDef = systemValues.find((s) => s.id === systemId);
                      if (!systemDef) {
                        return null;
                      }

                      return (
                        <span
                          key={systemId}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border border-glass-border"
                          style={{
                            backgroundColor: systemDef.color ? `${systemDef.color}15` : 'rgba(59, 130, 246, 0.08)',
                            color: systemDef.color || '#3B82F6',
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: systemDef.color || '#3B82F6' }}
                            aria-hidden="true"
                          />
                          {systemDef.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </GlassCard>
          </AnimatedTransition>
        ) : null}
      </div>

      {/* Footer */}
      <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 8}>
        <div className="flex items-center justify-center py-4">
          <p className="text-xs text-primary-300">
            {import.meta.env.VITE_APP_TITLE || 'Ask Dreeso Memory'}{' '}
            v{import.meta.env.VITE_APP_VERSION || '1.0.0'} · Last updated:{' '}
            {dashboardData && dashboardData.lastUpdated
              ? formatRelativeTime(dashboardData.lastUpdated)
              : 'Just now'}
          </p>
        </div>
      </AnimatedTransition>
    </div>
  );
}

export default HomePage;