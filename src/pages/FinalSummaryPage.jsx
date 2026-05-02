/**
 * Final summary and demo conclusion screen for Ask Dreeso Memory.
 * Screen 20: Aggregated insights across all personas, action execution summary,
 * platform capabilities overview, export/share options, and session summary.
 *
 * @module FinalSummaryPage
 * @see SCRUM-7896
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { useUIState } from '../context/UIStateContext';
import GlassCard from '../components/ui/GlassCard';
import AnimatedTransition from '../components/ui/AnimatedTransition';
import RiskSignalCard from '../components/ui/RiskSignalCard';
import { SCREEN_IDS, INTELLIGENCE_CLUSTERS, SYSTEMS, PERSONAS } from '../constants';
import { logEvent, AUDIT_EVENT_TYPES, getAuditTrail, getAuditTrailCount, exportAuditTrail } from '../services/AuditLogger';
import { getActionLog, getActionLogCount, exportActionLog } from '../services/ActionExecutor';
import { DASHBOARD_SUMMARY, RISK_SIGNALS, FORECAST_MODELS } from '../data/mockData';
import { getAllPersonaProfiles } from '../data/personaData';

/**
 * Animation stagger delay in milliseconds between each section.
 * @type {number}
 */
const STAGGER_DELAY_MS = 100;

/**
 * Maximum number of action log entries to display.
 * @type {number}
 */
const MAX_DISPLAYED_ACTIONS = 10;

/**
 * Maximum number of audit log entries to display.
 * @type {number}
 */
const MAX_DISPLAYED_AUDIT = 10;

/**
 * Maximum number of risk signals to display.
 * @type {number}
 */
const MAX_DISPLAYED_RISKS = 5;

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
 * Formats a relative time string.
 *
 * @param {string|number|null} timestamp - ISO timestamp or Unix ms
 * @returns {string} Formatted relative time string
 */
function formatRelativeTime(timestamp) {
  if (timestamp === null || timestamp === undefined) {
    return 'Just now';
  }

  let ms;
  if (typeof timestamp === 'number') {
    ms = timestamp;
  } else if (typeof timestamp === 'string') {
    try {
      ms = new Date(timestamp).getTime();
      if (isNaN(ms)) {
        return 'Just now';
      }
    } catch {
      return 'Just now';
    }
  } else {
    return 'Just now';
  }

  const now = Date.now();
  const diffMs = now - ms;
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

  return formatTimestamp(typeof timestamp === 'string' ? timestamp : new Date(ms).toISOString());
}

/**
 * Resolves severity classes for display.
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
 * Resolves the severity icon.
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
 * Resolves the status badge class.
 *
 * @param {string} status - The status string
 * @returns {string} Tailwind classes
 */
function getStatusBadgeClass(status) {
  switch (status) {
    case 'success':
      return 'bg-green-400 bg-opacity-15 text-green-400';
    case 'error':
      return 'bg-red-400 bg-opacity-15 text-red-400';
    case 'pending':
      return 'bg-amber-400 bg-opacity-15 text-amber-400';
    default:
      return 'bg-glass-light text-primary-200';
  }
}

/**
 * PlatformKPICard sub-component.
 * Renders a single platform KPI metric card.
 *
 * @param {Object} props
 * @param {Object} props.kpi - The KPI data object
 * @param {number} props.index - Index for staggered animation delay
 * @returns {React.ReactElement|null} The KPI card element
 */
function PlatformKPICard({ kpi, index }) {
  if (!kpi || typeof kpi !== 'object') {
    return null;
  }

  const label = typeof kpi.label === 'string' ? kpi.label : 'Metric';
  const value = kpi.value !== undefined && kpi.value !== null ? kpi.value : 0;
  const icon = typeof kpi.icon === 'string' ? kpi.icon : '📊';

  return (
    <AnimatedTransition
      show
      type="scale"
      duration="fast"
      delay={index * 60}
    >
      <div className="glass-sm p-4 flex flex-col items-center text-center h-full">
        <span className="text-xl mb-1" aria-hidden="true">{icon}</span>
        <span className="text-xl font-bold text-primary-50">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        <span className="text-xs text-primary-300 mt-0.5">{label}</span>
      </div>
    </AnimatedTransition>
  );
}

/**
 * PersonaSummaryCard sub-component.
 * Renders a summary card for a single persona.
 *
 * @param {Object} props
 * @param {Object} props.profile - The persona profile object
 * @param {number} props.index - Index for staggered animation delay
 * @returns {React.ReactElement|null} The persona summary card
 */
function PersonaSummaryCard({ profile, index }) {
  if (!profile || typeof profile !== 'object') {
    return null;
  }

  const name = typeof profile.name === 'string' ? profile.name : 'Persona';
  const role = typeof profile.role === 'string' ? profile.role : 'Role';
  const department = typeof profile.department === 'string' ? profile.department : '';
  const avatar = typeof profile.avatar === 'string' ? profile.avatar : '?';
  const color = typeof profile.color === 'string' ? profile.color : '#3B82F6';
  const expertise = Array.isArray(profile.expertise) ? profile.expertise : [];
  const connectedSystems = Array.isArray(profile.connectedSystems) ? profile.connectedSystems : [];
  const clusterAccess = Array.isArray(profile.clusterAccess) ? profile.clusterAccess : [];

  const primaryClusters = clusterAccess.filter((c) => c.isPrimary);
  const fullAccessCount = clusterAccess.filter((c) => c.accessLevel === 'full').length;
  const readAccessCount = clusterAccess.filter((c) => c.accessLevel === 'read').length;

  return (
    <AnimatedTransition
      show
      type="scale"
      duration="normal"
      delay={index * 100}
    >
      <GlassCard variant="sm" padding="md" animated>
        <div className="flex items-start gap-3 mb-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold text-white flex-shrink-0"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          >
            {avatar}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-primary-50 leading-tight truncate">
              {name}
            </h4>
            <p className="text-xs text-primary-200 leading-tight">
              {role}
            </p>
            {department ? (
              <p className="text-xs text-primary-300 leading-tight">
                {department}
              </p>
            ) : null}
          </div>
        </div>

        {/* Primary Clusters */}
        {primaryClusters.length > 0 ? (
          <div className="mb-3">
            <p className="text-xs text-primary-300 font-semibold uppercase tracking-wider mb-1.5">
              Primary Clusters
            </p>
            <div className="flex flex-wrap gap-1">
              {primaryClusters.map((cluster, idx) => {
                const clusterDef = Object.values(INTELLIGENCE_CLUSTERS).find(
                  (c) => c.id === cluster.clusterId
                );
                return (
                  <span
                    key={cluster.clusterId || `cluster-${idx}`}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-glass-light text-primary-200"
                  >
                    <span className="text-xs" aria-hidden="true">
                      {clusterDef ? clusterDef.icon : '📁'}
                    </span>
                    <span className="truncate">{cluster.label || cluster.clusterId}</span>
                  </span>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Access Summary */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-primary-300">
            <span className="text-green-400 font-medium">{fullAccessCount}</span> full
          </span>
          <span className="text-xs text-primary-300">
            <span className="text-amber-400 font-medium">{readAccessCount}</span> read
          </span>
          <span className="text-xs text-primary-300">
            <span className="text-primary-200 font-medium">{connectedSystems.length}</span> system{connectedSystems.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Connected Systems */}
        {connectedSystems.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {connectedSystems.map((systemId) => {
              const systemDef = Object.values(SYSTEMS).find((s) => s.id === systemId);
              if (!systemDef) {
                return null;
              }
              return (
                <span
                  key={systemId}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium border border-glass-border"
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
        ) : null}

        {/* Expertise Tags */}
        {expertise.length > 0 ? (
          <div className="mt-3 pt-2 border-t border-glass-border">
            <div className="flex flex-wrap gap-1">
              {expertise.slice(0, 4).map((skill, idx) => (
                <span
                  key={`skill-${idx}`}
                  className="text-xs px-1.5 py-0.5 rounded-full bg-glass-light text-primary-300"
                >
                  {skill}
                </span>
              ))}
              {expertise.length > 4 ? (
                <span className="text-xs text-primary-300">
                  +{expertise.length - 4} more
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </GlassCard>
    </AnimatedTransition>
  );
}

/**
 * ActionLogItem sub-component.
 * Renders a single action log entry row.
 *
 * @param {Object} props
 * @param {Object} props.entry - The action log entry object
 * @param {number} props.index - Index for staggered animation delay
 * @returns {React.ReactElement|null} The action log item element
 */
function ActionLogItem({ entry, index }) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const actionType = typeof entry.actionType === 'string' ? entry.actionType : 'unknown';
  const status = typeof entry.status === 'string' ? entry.status : 'unknown';
  const message = typeof entry.message === 'string' ? entry.message : '';
  const timestamp = typeof entry.isoTimestamp === 'string' ? entry.isoTimestamp : null;
  const personaId = typeof entry.persona === 'string' ? entry.persona : null;
  const targetSystem = typeof entry.targetSystem === 'string' ? entry.targetSystem : null;

  const statusBadgeClass = getStatusBadgeClass(status);

  const systemDef = targetSystem
    ? Object.values(SYSTEMS).find((s) => s.id === targetSystem)
    : null;

  return (
    <AnimatedTransition
      show
      type="slide-up"
      duration="fast"
      delay={index * 50}
    >
      <div className="flex items-start gap-3 px-3 py-2.5 rounded-glass-sm bg-glass-light border border-glass-border">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={[
                'text-xs px-1.5 py-0.5 rounded-full capitalize font-medium',
                statusBadgeClass,
              ].join(' ')}
            >
              {status}
            </span>
            <span className="text-xs text-primary-200 font-medium capitalize">
              {actionType.replace(/[-_]/g, ' ')}
            </span>
            {systemDef ? (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs"
                style={{
                  backgroundColor: systemDef.color ? `${systemDef.color}15` : 'rgba(59, 130, 246, 0.08)',
                  color: systemDef.color || '#3B82F6',
                }}
              >
                <span
                  className="w-1 h-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: systemDef.color || '#3B82F6' }}
                  aria-hidden="true"
                />
                {systemDef.label}
              </span>
            ) : null}
            {personaId ? (
              <span className="text-xs text-primary-300 capitalize">
                {personaId}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-primary-200 leading-relaxed truncate">
            {message}
          </p>
        </div>
        <span className="text-xs text-primary-300 flex-shrink-0 whitespace-nowrap">
          {timestamp ? formatRelativeTime(timestamp) : ''}
        </span>
      </div>
    </AnimatedTransition>
  );
}

/**
 * AuditLogItem sub-component.
 * Renders a single audit log entry row.
 *
 * @param {Object} props
 * @param {Object} props.entry - The audit log entry object
 * @param {number} props.index - Index for staggered animation delay
 * @returns {React.ReactElement|null} The audit log item element
 */
function AuditLogItem({ entry, index }) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const eventType = typeof entry.eventType === 'string' ? entry.eventType : 'UNKNOWN';
  const timestamp = typeof entry.timestamp === 'number' ? entry.timestamp : null;
  const personaId = typeof entry.persona === 'string' ? entry.persona : null;
  const details = entry.details && typeof entry.details === 'object' ? entry.details : {};

  const eventIcon = eventType.includes('AUTH') ? '🔐'
    : eventType.includes('QUERY') ? '🔍'
      : eventType.includes('ACTION') ? '⚡'
        : eventType.includes('NAVIGATION') ? '🧭'
          : eventType.includes('CTA') ? '💡'
            : eventType.includes('SCREEN') ? '📱'
              : eventType.includes('PERSONA') ? '👤'
                : eventType.includes('STATE') ? '🔄'
                  : eventType.includes('ERROR') ? '⚠️'
                    : '📋';

  const detailSummary = typeof details.action === 'string'
    ? details.action
    : typeof details.queryText === 'string'
      ? `"${details.queryText.substring(0, 50)}${details.queryText.length > 50 ? '...' : ''}"`
      : typeof details.message === 'string'
        ? details.message.substring(0, 60)
        : '';

  return (
    <AnimatedTransition
      show
      type="slide-up"
      duration="fast"
      delay={index * 40}
    >
      <div className="flex items-center gap-2 px-3 py-2 rounded-glass-sm hover:bg-glass-light transition-colors duration-200">
        <span className="text-sm flex-shrink-0" aria-hidden="true">
          {eventIcon}
        </span>
        <span className="text-xs text-primary-200 font-medium flex-shrink-0 min-w-[120px]">
          {eventType.replace(/_/g, ' ')}
        </span>
        <span className="text-xs text-primary-300 truncate flex-1 min-w-0">
          {detailSummary}
        </span>
        {personaId ? (
          <span className="text-xs text-primary-300 flex-shrink-0 capitalize">
            {personaId}
          </span>
        ) : null}
        <span className="text-xs text-primary-300 flex-shrink-0 whitespace-nowrap">
          {timestamp ? formatRelativeTime(timestamp) : ''}
        </span>
      </div>
    </AnimatedTransition>
  );
}

/**
 * CapabilityCard sub-component.
 * Renders a single platform capability card.
 *
 * @param {Object} props
 * @param {string} props.icon - Emoji icon
 * @param {string} props.title - Capability title
 * @param {string} props.description - Capability description
 * @param {string[]} props.features - Feature list
 * @param {number} props.index - Index for staggered animation delay
 * @returns {React.ReactElement} The capability card element
 */
function CapabilityCard({ icon, title, description, features, index }) {
  return (
    <AnimatedTransition
      show
      type="slide-up"
      duration="normal"
      delay={index * STAGGER_DELAY_MS}
    >
      <div className="glass-sm p-4 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-3">
          <span
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 bg-accent-blue bg-opacity-20"
            aria-hidden="true"
          >
            {icon}
          </span>
          <div className="flex flex-col min-w-0">
            <h3 className="text-sm font-semibold text-primary-50 leading-tight">
              {title}
            </h3>
            <p className="text-xs text-primary-200 leading-relaxed mt-0.5">
              {description}
            </p>
          </div>
        </div>
        {Array.isArray(features) && features.length > 0 ? (
          <div className="flex flex-col gap-1 mt-auto">
            {features.map((feature, idx) => (
              <div key={`feature-${idx}`} className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-accent-blue flex-shrink-0" aria-hidden="true" />
                <span className="text-xs text-primary-300">{feature}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </AnimatedTransition>
  );
}

/**
 * SystemStatusCard sub-component.
 * Renders a system status summary card.
 *
 * @param {Object} props
 * @param {Object} props.system - The system status object
 * @param {number} props.index - Index for staggered animation delay
 * @returns {React.ReactElement|null} The system status card
 */
function SystemStatusCard({ system, index }) {
  if (!system || typeof system !== 'object') {
    return null;
  }

  const label = typeof system.label === 'string' ? system.label : 'System';
  const systemId = typeof system.systemId === 'string' ? system.systemId : '';
  const status = typeof system.status === 'string' ? system.status : 'unknown';
  const health = typeof system.health === 'string' ? system.health : 'unknown';

  const systemDef = Object.values(SYSTEMS).find((s) => s.id === systemId);
  const color = systemDef ? systemDef.color : '#6B7280';
  const description = systemDef ? systemDef.description : '';

  const statusDotColor = status === 'connected'
    ? 'bg-green-400'
    : status === 'degraded'
      ? 'bg-amber-400'
      : status === 'disconnected'
        ? 'bg-red-400'
        : 'bg-primary-300';

  return (
    <AnimatedTransition
      show
      type="scale"
      duration="fast"
      delay={index * 60}
    >
      <div className="glass-sm p-3 flex items-center gap-3">
        <span
          className={[
            'w-2.5 h-2.5 rounded-full flex-shrink-0',
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
          className="w-1 h-6 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-sm font-medium text-primary-50 truncate">
            {label}
          </span>
          <span className="text-xs text-primary-300 truncate">
            {description}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-primary-200 capitalize">
            {status}
          </span>
          {health === 'degraded' ? (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-400 bg-opacity-15 text-amber-400">
              Degraded
            </span>
          ) : null}
        </div>
      </div>
    </AnimatedTransition>
  );
}

/**
 * FinalSummaryPage component.
 * Renders the final summary/demo conclusion screen showing aggregated insights
 * across all personas, action execution summary, platform capabilities overview,
 * export/share options, and session summary.
 *
 * @returns {React.ReactElement|null} The final summary page component, or null if not authenticated
 */
function FinalSummaryPage() {
  const { user, isAuthenticated, persona, role } = useAuth();
  const { navigateTo } = useNavigation();
  const { state } = useUIState();

  const [activeSection, setActiveSection] = useState('overview');
  const [exportStatus, setExportStatus] = useState(null);

  /**
   * Log screen view on mount
   */
  useEffect(() => {
    logEvent(AUDIT_EVENT_TYPES.SCREEN_VIEW, {
      screenId: SCREEN_IDS.AUDIT_LOG,
      screenName: 'Final Summary',
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
   * Resolves system status data
   */
  const systemStatus = useMemo(() => {
    if (dashboardData && Array.isArray(dashboardData.systemStatus)) {
      return dashboardData.systemStatus;
    }
    return [];
  }, [dashboardData]);

  /**
   * Resolves all persona profiles
   */
  const allPersonaProfiles = useMemo(() => {
    return getAllPersonaProfiles();
  }, []);

  /**
   * Resolves action log entries
   */
  const actionLogEntries = useMemo(() => {
    const entries = getActionLog();
    return entries.slice(-MAX_DISPLAYED_ACTIONS).reverse();
  }, []);

  /**
   * Resolves action log count
   */
  const actionLogCount = useMemo(() => {
    return getActionLogCount();
  }, []);

  /**
   * Resolves action log statistics
   */
  const actionStats = useMemo(() => {
    const entries = getActionLog();
    const successCount = entries.filter((e) => e.status === 'success').length;
    const errorCount = entries.filter((e) => e.status === 'error').length;
    const pendingCount = entries.filter((e) => e.status === 'pending').length;

    const uniqueTypes = new Set(entries.map((e) => e.actionType).filter(Boolean));
    const uniqueSystems = new Set(entries.map((e) => e.targetSystem).filter(Boolean));
    const uniquePersonas = new Set(entries.map((e) => e.persona).filter(Boolean));

    return {
      total: entries.length,
      success: successCount,
      error: errorCount,
      pending: pendingCount,
      uniqueTypes: uniqueTypes.size,
      uniqueSystems: uniqueSystems.size,
      uniquePersonas: uniquePersonas.size,
    };
  }, []);

  /**
   * Resolves audit trail entries
   */
  const auditTrailEntries = useMemo(() => {
    const entries = getAuditTrail();
    return entries.slice(-MAX_DISPLAYED_AUDIT).reverse();
  }, []);

  /**
   * Resolves audit trail count
   */
  const auditTrailCount = useMemo(() => {
    return getAuditTrailCount();
  }, []);

  /**
   * Resolves audit trail statistics
   */
  const auditStats = useMemo(() => {
    const entries = getAuditTrail();
    const eventTypes = {};
    for (const entry of entries) {
      if (typeof entry.eventType === 'string') {
        eventTypes[entry.eventType] = (eventTypes[entry.eventType] || 0) + 1;
      }
    }

    return {
      total: entries.length,
      eventTypes,
      uniqueEventTypes: Object.keys(eventTypes).length,
    };
  }, []);

  /**
   * Resolves top risk signals
   */
  const topRiskSignals = useMemo(() => {
    if (Array.isArray(RISK_SIGNALS)) {
      return RISK_SIGNALS.slice(0, MAX_DISPLAYED_RISKS);
    }
    return [];
  }, []);

  /**
   * Resolves forecast models
   */
  const forecastModels = useMemo(() => {
    if (Array.isArray(FORECAST_MODELS)) {
      return FORECAST_MODELS;
    }
    return [];
  }, []);

  /**
   * Resolves intelligence cluster summary
   */
  const clusterSummary = useMemo(() => {
    return Object.values(INTELLIGENCE_CLUSTERS).map((cluster) => ({
      id: cluster.id,
      label: cluster.label,
      icon: cluster.icon,
      color: cluster.color,
      description: cluster.description,
    }));
  }, []);

  /**
   * Platform capabilities data
   */
  const capabilities = useMemo(() => [
    {
      icon: '🧠',
      title: 'AI-Powered Intelligence',
      description: 'Natural language query processing across enterprise systems.',
      features: [
        'Multi-domain query interpretation',
        'Keyword and intent classification',
        'Persona-aware result filtering',
        'Confidence scoring',
      ],
    },
    {
      icon: '🔗',
      title: 'Multi-System Orchestration',
      description: 'Unified data aggregation from SAP, Procore, Salesforce, and Primavera.',
      features: [
        'Parallel system querying',
        'Source transparency tracking',
        'System health monitoring',
        'Cross-system data correlation',
      ],
    },
    {
      icon: '📊',
      title: '6 Intelligence Clusters',
      description: 'Specialized domains covering all enterprise operations.',
      features: [
        'Project & Portfolio',
        'Sales & Business Development',
        'Commercial & Procurement',
        'Finance & Cash Flow',
        'Workforce Planning',
        'Knowledge/IP',
      ],
    },
    {
      icon: '⚡',
      title: 'Actionable Insights',
      description: 'Execute enterprise actions directly from query results.',
      features: [
        'Contextual CTA suggestions',
        'Action execution simulation',
        'Undo and confirmation flows',
        'Audit trail persistence',
      ],
    },
    {
      icon: '👥',
      title: '4 Persona Flows',
      description: 'Role-based experiences tailored to each user type.',
      features: [
        'Lukas — Project Director',
        'Elena — Commercial Manager',
        'Sophie — Finance Lead',
        'James — Business Development',
      ],
    },
    {
      icon: '🛡️',
      title: 'Enterprise Security',
      description: 'Session management, audit logging, and access control.',
      features: [
        'Role-based cluster access',
        'Session expiry management',
        'Full audit trail',
        'Action log persistence',
      ],
    },
  ], []);

  /**
   * Handles section tab change
   * @param {string} section - The section identifier
   */
  const handleSectionChange = useCallback((section) => {
    setActiveSection(section);

    logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {
      action: 'FINAL_SUMMARY_SECTION_CHANGE',
      section,
      persona,
    });
  }, [persona]);

  /**
   * Handles export of audit trail
   */
  const handleExportAuditTrail = useCallback(() => {
    try {
      const jsonString = exportAuditTrail();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-trail-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportStatus('audit-success');
      setTimeout(() => setExportStatus(null), 3000);

      logEvent(AUDIT_EVENT_TYPES.ACTION_EXECUTE, {
        action: 'EXPORT_AUDIT_TRAIL',
        entryCount: auditTrailCount,
        persona,
      });
    } catch {
      setExportStatus('audit-error');
      setTimeout(() => setExportStatus(null), 3000);
    }
  }, [auditTrailCount, persona]);

  /**
   * Handles export of action log
   */
  const handleExportActionLog = useCallback(() => {
    try {
      const jsonString = exportActionLog();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `action-log-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportStatus('action-success');
      setTimeout(() => setExportStatus(null), 3000);

      logEvent(AUDIT_EVENT_TYPES.ACTION_EXECUTE, {
        action: 'EXPORT_ACTION_LOG',
        entryCount: actionLogCount,
        persona,
      });
    } catch {
      setExportStatus('action-error');
      setTimeout(() => setExportStatus(null), 3000);
    }
  }, [actionLogCount, persona]);

  /**
   * Handles navigation to dashboard
   */
  const handleBackToDashboard = useCallback(() => {
    logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {
      action: 'FINAL_SUMMARY_BACK_TO_DASHBOARD',
      persona,
    });

    navigateTo(SCREEN_IDS.DASHBOARD);
  }, [persona, navigateTo]);

  /**
   * Handles navigation to query page
   */
  const handleNewQuery = useCallback(() => {
    logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {
      action: 'FINAL_SUMMARY_NEW_QUERY',
      persona,
    });

    navigateTo(SCREEN_IDS.QUERY_INPUT);
  }, [persona, navigateTo]);

  const accentColor = resolvePersonaColor(persona);
  const displayName = resolveDisplayName(user, persona);
  const avatarInitial = resolveAvatarInitial(user, persona);

  /**
   * Section tab definitions
   */
  const sections = useMemo(() => [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'personas', label: 'Personas', icon: '👥' },
    { id: 'actions', label: 'Actions', icon: '⚡' },
    { id: 'audit', label: 'Audit Trail', icon: '📋' },
    { id: 'risks', label: 'Risks', icon: '🚨' },
    { id: 'capabilities', label: 'Capabilities', icon: '🧠' },
  ], []);

  /**
   * Session summary KPIs
   */
  const sessionKpis = useMemo(() => [
    { label: 'Actions Executed', value: actionStats.total, icon: '⚡' },
    { label: 'Successful', value: actionStats.success, icon: '✅' },
    { label: 'Audit Events', value: auditStats.total, icon: '📋' },
    { label: 'Event Types', value: auditStats.uniqueEventTypes, icon: '🔄' },
    { label: 'Systems Used', value: actionStats.uniqueSystems, icon: '🖥️' },
    { label: 'Personas Used', value: actionStats.uniquePersonas, icon: '👤' },
  ], [actionStats, auditStats]);

  // Do not render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
      {/* Page Header */}
      <AnimatedTransition show type="fade" duration="normal">
        <GlassCard variant="default" padding="lg" animated>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div
                className="flex items-center justify-center w-14 h-14 rounded-full text-xl font-bold text-white flex-shrink-0 shadow-accent-glow"
                style={{ backgroundColor: accentColor }}
                aria-hidden="true"
              >
                {avatarInitial}
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-semibold text-primary-50 leading-tight">
                  Session Summary
                </h1>
                <p className="text-sm text-primary-200 mt-0.5">
                  {displayName} · {import.meta.env.VITE_APP_TITLE || 'Ask Dreeso Memory'} v{import.meta.env.VITE_APP_VERSION || '1.0.0'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* New Query */}
              <button
                type="button"
                className={[
                  'flex items-center gap-2 px-4 py-2.5 rounded-glass-sm',
                  'text-sm font-medium text-primary-200 border border-glass-border',
                  'hover:bg-glass-light hover:text-primary-50 hover:border-primary-300',
                  'transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
                ]
                  .filter(Boolean)
                  .join(' ')
                  .replace(/\s+/g, ' ')
                  .trim()}
                onClick={handleNewQuery}
                aria-label="Start a new query"
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

              {/* Back to Dashboard */}
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
                onClick={handleBackToDashboard}
                aria-label="Back to dashboard"
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
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span>Dashboard</span>
              </button>
            </div>
          </div>
        </GlassCard>
      </AnimatedTransition>

      {/* Session KPIs */}
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
              Session Metrics
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {sessionKpis.map((kpi, index) => (
              <PlatformKPICard
                key={`session-kpi-${index}`}
                kpi={kpi}
                index={index}
              />
            ))}
          </div>
        </div>
      </AnimatedTransition>

      {/* Section Navigation */}
      <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 2}>
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={[
                'flex items-center gap-2 px-4 py-2.5 rounded-glass-sm',
                'text-sm font-medium whitespace-nowrap',
                'transition-all duration-300 ease-in-out',
                'focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
                activeSection === section.id
                  ? 'bg-glass-light text-primary-50 border border-glass-border'
                  : 'text-primary-200 border border-transparent hover:bg-glass-light hover:text-primary-50',
              ]
                .filter(Boolean)
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim()}
              onClick={() => handleSectionChange(section.id)}
              aria-current={activeSection === section.id ? 'page' : undefined}
            >
              <span className="text-sm" aria-hidden="true">{section.icon}</span>
              <span>{section.label}</span>
            </button>
          ))}
        </div>
      </AnimatedTransition>

      {/* Overview Section */}
      {activeSection === 'overview' ? (
        <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 3}>
          <div className="flex flex-col gap-6">
            {/* Platform KPIs */}
            {kpis.length > 0 ? (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-blue bg-opacity-20"
                    aria-hidden="true"
                  >
                    📈
                  </span>
                  <h2 className="text-base font-semibold text-primary-50 leading-tight">
                    Platform Key Metrics
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {kpis.map((kpi, index) => (
                    <PlatformKPICard
                      key={kpi.id || `platform-kpi-${index}`}
                      kpi={kpi}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {/* Intelligence Clusters Summary */}
            <GlassCard variant="default" padding="md" animated>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-blue bg-opacity-20"
                    aria-hidden="true"
                  >
                    🧠
                  </span>
                  <h2 className="text-base font-semibold text-primary-50 leading-tight">
                    Intelligence Clusters
                  </h2>
                </div>
                <span className="text-xs text-primary-300">
                  {clusterSummary.length} clusters
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {clusterSummary.map((cluster, index) => (
                  <AnimatedTransition
                    key={cluster.id}
                    show
                    type="scale"
                    duration="fast"
                    delay={index * 60}
                  >
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-glass-sm bg-glass-light border border-glass-border">
                      <span
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                        style={{
                          backgroundColor: cluster.color ? `${cluster.color}20` : 'rgba(59, 130, 246, 0.12)',
                        }}
                        aria-hidden="true"
                      >
                        {cluster.icon}
                      </span>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-medium text-primary-50 truncate">
                          {cluster.label}
                        </span>
                        <span className="text-xs text-primary-300 truncate">
                          {cluster.description}
                        </span>
                      </div>
                    </div>
                  </AnimatedTransition>
                ))}
              </div>
            </GlassCard>

            {/* System Status */}
            {systemStatus.length > 0 ? (
              <GlassCard variant="default" padding="md" animated>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-teal bg-opacity-20"
                      aria-hidden="true"
                    >
                      🖥️
                    </span>
                    <h2 className="text-base font-semibold text-primary-50 leading-tight">
                      Connected Systems
                    </h2>
                  </div>
                  <span className="text-xs text-primary-300">
                    {systemStatus.length} system{systemStatus.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {systemStatus.map((system, index) => (
                    <SystemStatusCard
                      key={system.systemId || `system-${index}`}
                      system={system}
                      index={index}
                    />
                  ))}
                </div>
              </GlassCard>
            ) : null}

            {/* Forecast Models Summary */}
            {forecastModels.length > 0 ? (
              <GlassCard variant="default" padding="md" animated>
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-purple bg-opacity-20"
                    aria-hidden="true"
                  >
                    📈
                  </span>
                  <h2 className="text-base font-semibold text-primary-50 leading-tight">
                    Forecast Models
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {forecastModels.map((model, index) => (
                    <AnimatedTransition
                      key={model.id || `forecast-${index}`}
                      show
                      type="scale"
                      duration="fast"
                      delay={index * 60}
                    >
                      <div className="glass-sm p-3 flex flex-col items-center text-center">
                        <span className="text-lg mb-1" aria-hidden="true">
                          {model.type === 'revenue' ? '📈' : model.type === 'workforce' ? '👥' : '📋'}
                        </span>
                        <span className="text-sm font-semibold text-primary-50">
                          {typeof model.name === 'string' ? model.name : 'Forecast'}
                        </span>
                        <span className="text-xs text-primary-300 mt-0.5 capitalize">
                          {typeof model.type === 'string' ? model.type : 'generic'}
                        </span>
                        {typeof model.confidence === 'number' ? (
                          <span className="text-xs text-primary-200 mt-1">
                            Confidence: {model.confidence <= 1 ? `${(model.confidence * 100).toFixed(0)}%` : `${model.confidence.toFixed(0)}%`}
                          </span>
                        ) : null}
                      </div>
                    </AnimatedTransition>
                  ))}
                </div>
              </GlassCard>
            ) : null}
          </div>
        </AnimatedTransition>
      ) : null}

      {/* Personas Section */}
      {activeSection === 'personas' ? (
        <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 3}>
          <div className="flex flex-col gap-6">
            <GlassCard variant="default" padding="md" animated>
              <div className="flex items-start gap-3">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-blue bg-opacity-20"
                  aria-hidden="true"
                >
                  👥
                </span>
                <div className="flex flex-col">
                  <p className="text-sm text-primary-100 leading-relaxed">
                    Ask Dreeso Memory supports {allPersonaProfiles.length} persona flows, each tailored to a specific
                    role within the enterprise. Each persona has unique cluster access, connected systems, and
                    domain-specific query suggestions.
                  </p>
                </div>
              </div>
            </GlassCard>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allPersonaProfiles.map((profile, index) => (
                <PersonaSummaryCard
                  key={profile.id}
                  profile={profile}
                  index={index}
                />
              ))}
            </div>
          </div>
        </AnimatedTransition>
      ) : null}

      {/* Actions Section */}
      {activeSection === 'actions' ? (
        <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 3}>
          <div className="flex flex-col gap-6">
            {/* Action Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { label: 'Total Actions', value: actionStats.total, icon: '⚡' },
                { label: 'Successful', value: actionStats.success, icon: '✅' },
                { label: 'Errors', value: actionStats.error, icon: '❌' },
                { label: 'Pending', value: actionStats.pending, icon: '⏳' },
                { label: 'Action Types', value: actionStats.uniqueTypes, icon: '🔄' },
                { label: 'Systems', value: actionStats.uniqueSystems, icon: '🖥️' },
                { label: 'Personas', value: actionStats.uniquePersonas, icon: '👤' },
              ].map((kpi, index) => (
                <PlatformKPICard
                  key={`action-stat-${index}`}
                  kpi={kpi}
                  index={index}
                />
              ))}
            </div>

            {/* Action Log */}
            <GlassCard variant="default" padding="md" animated>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-purple bg-opacity-20"
                    aria-hidden="true"
                  >
                    ⚡
                  </span>
                  <div className="flex flex-col">
                    <h3 className="text-sm font-semibold text-primary-50 leading-tight">
                      Action Execution Log
                    </h3>
                    <p className="text-xs text-primary-300 leading-tight">
                      Recent actions executed during this session
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-primary-300">
                    {actionLogCount} total
                  </span>
                  <button
                    type="button"
                    className={[
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-glass-sm',
                      'text-xs font-medium text-primary-200 border border-glass-border',
                      'hover:bg-glass-light hover:text-primary-50 hover:border-primary-300',
                      'transition-all duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
                    ]
                      .filter(Boolean)
                      .join(' ')
                      .replace(/\s+/g, ' ')
                      .trim()}
                    onClick={handleExportActionLog}
                    aria-label="Export action log"
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
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>

              {exportStatus === 'action-success' ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-glass-sm bg-green-400 bg-opacity-10 border border-green-400 border-opacity-20 mb-4">
                  <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-xs text-green-400">Action log exported successfully.</p>
                </div>
              ) : null}

              {actionLogEntries.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {actionLogEntries.map((entry, index) => (
                    <ActionLogItem
                      key={entry.id || `action-${index}`}
                      entry={entry}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center text-center py-8">
                  <span className="text-3xl mb-4" aria-hidden="true">⚡</span>
                  <h3 className="text-lg font-semibold text-primary-50 mb-2">
                    No Actions Recorded
                  </h3>
                  <p className="text-sm text-primary-200 max-w-md">
                    No actions have been executed during this session. Execute actions from query results to see them here.
                  </p>
                </div>
              )}
            </GlassCard>
          </div>
        </AnimatedTransition>
      ) : null}

      {/* Audit Trail Section */}
      {activeSection === 'audit' ? (
        <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 3}>
          <div className="flex flex-col gap-6">
            {/* Audit Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <PlatformKPICard
                kpi={{ label: 'Total Events', value: auditStats.total, icon: '📋' }}
                index={0}
              />
              <PlatformKPICard
                kpi={{ label: 'Event Types', value: auditStats.uniqueEventTypes, icon: '🔄' }}
                index={1}
              />
              <PlatformKPICard
                kpi={{ label: 'Avg Events/Type', value: auditStats.total > 0 && auditStats.uniqueEventTypes > 0 ? Math.round(auditStats.total / auditStats.uniqueEventTypes) : 0, icon: '📊' }}
                index={2}
              />
            </div>

            {/* Event Type Breakdown */}
            {Object.keys(auditStats.eventTypes).length > 0 ? (
              <GlassCard variant="default" padding="md" animated>
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-blue bg-opacity-20"
                    aria-hidden="true"
                  >
                    📊
                  </span>
                  <h3 className="text-sm font-semibold text-primary-50 leading-tight">
                    Event Type Breakdown
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {Object.entries(auditStats.eventTypes)
                    .sort((a, b) => b[1] - a[1])
                    .map(([eventType, count], index) => (
                      <AnimatedTransition
                        key={eventType}
                        show
                        type="scale"
                        duration="fast"
                        delay={index * 40}
                      >
                        <div className="flex items-center justify-between px-3 py-2 rounded-glass-sm bg-glass-light border border-glass-border">
                          <span className="text-xs text-primary-200 truncate flex-1 min-w-0">
                            {eventType.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs font-semibold text-primary-100 flex-shrink-0 ml-2">
                            {count}
                          </span>
                        </div>
                      </AnimatedTransition>
                    ))}
                </div>
              </GlassCard>
            ) : null}

            {/* Audit Trail Log */}
            <GlassCard variant="default" padding="md" animated>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-teal bg-opacity-20"
                    aria-hidden="true"
                  >
                    📋
                  </span>
                  <div className="flex flex-col">
                    <h3 className="text-sm font-semibold text-primary-50 leading-tight">
                      Audit Trail
                    </h3>
                    <p className="text-xs text-primary-300 leading-tight">
                      Recent audit events from this session
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-primary-300">
                    {auditTrailCount} total
                  </span>
                  <button
                    type="button"
                    className={[
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-glass-sm',
                      'text-xs font-medium text-primary-200 border border-glass-border',
                      'hover:bg-glass-light hover:text-primary-50 hover:border-primary-300',
                      'transition-all duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
                    ]
                      .filter(Boolean)
                      .join(' ')
                      .replace(/\s+/g, ' ')
                      .trim()}
                    onClick={handleExportAuditTrail}
                    aria-label="Export audit trail"
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
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>

              {exportStatus === 'audit-success' ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-glass-sm bg-green-400 bg-opacity-10 border border-green-400 border-opacity-20 mb-4">
                  <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-xs text-green-400">Audit trail exported successfully.</p>
                </div>
              ) : null}

              {auditTrailEntries.length > 0 ? (
                <div className="flex flex-col gap-0.5">
                  {auditTrailEntries.map((entry, index) => (
                    <AuditLogItem
                      key={entry.id || `audit-${index}`}
                      entry={entry}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center text-center py-8">
                  <span className="text-3xl mb-4" aria-hidden="true">📋</span>
                  <h3 className="text-lg font-semibold text-primary-50 mb-2">
                    No Audit Events
                  </h3>
                  <p className="text-sm text-primary-200 max-w-md">
                    No audit events have been recorded during this session.
                  </p>
                </div>
              )}
            </GlassCard>
          </div>
        </AnimatedTransition>
      ) : null}

      {/* Risks Section */}
      {activeSection === 'risks' ? (
        <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 3}>
          <div className="flex flex-col gap-6">
            {/* Risk Overview */}
            <GlassCard variant="default" padding="md" animated>
              <div className="flex items-start gap-3">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-red-400 bg-opacity-20"
                  aria-hidden="true"
                >
                  🚨
                </span>
                <div className="flex flex-col">
                  <p className="text-sm text-primary-100 leading-relaxed">
                    {topRiskSignals.length} cross-functional risk signal{topRiskSignals.length !== 1 ? 's' : ''} detected
                    across the enterprise portfolio. These signals span multiple intelligence clusters and
                    require coordinated attention from relevant stakeholders.
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Risk Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Critical', value: topRiskSignals.filter((s) => s.severity === 'critical').length, icon: '🔴' },
                { label: 'High', value: topRiskSignals.filter((s) => s.severity === 'high').length, icon: '🟠' },
                { label: 'Medium', value: topRiskSignals.filter((s) => s.severity === 'medium').length, icon: '🟡' },
                { label: 'Low', value: topRiskSignals.filter((s) => s.severity === 'low').length, icon: '🟢' },
              ].map((kpi, index) => (
                <PlatformKPICard
                  key={`risk-stat-${index}`}
                  kpi={kpi}
                  index={index}
                />
              ))}
            </div>

            {/* Risk Signal Cards */}
            {topRiskSignals.length > 0 ? (
              <div className="flex flex-col gap-3">
                {topRiskSignals.map((signal, index) => (
                  <RiskSignalCard
                    key={signal.id || `risk-${index}`}
                    signal={signal}
                    compact={false}
                    expandable
                    showAffectedSystems
                    showAffectedClusters
                    showActions
                    showTimestamp
                    animated
                    animationDelay={index * 80}
                  />
                ))}
              </div>
            ) : (
              <GlassCard variant="default" padding="lg" animated>
                <div className="flex flex-col items-center text-center py-8">
                  <span className="text-3xl mb-4" aria-hidden="true">✅</span>
                  <h3 className="text-lg font-semibold text-primary-50 mb-2">
                    No Active Risks
                  </h3>
                  <p className="text-sm text-primary-200 max-w-md">
                    No cross-functional risk signals are currently active.
                  </p>
                </div>
              </GlassCard>
            )}
          </div>
        </AnimatedTransition>
      ) : null}

      {/* Capabilities Section */}
      {activeSection === 'capabilities' ? (
        <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 3}>
          <div className="flex flex-col gap-6">
            {/* Capabilities Overview */}
            <GlassCard variant="default" padding="md" animated>
              <div className="flex items-start gap-3">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-blue bg-opacity-20"
                  aria-hidden="true"
                >
                  🧠
                </span>
                <div className="flex flex-col">
                  <p className="text-sm text-primary-100 leading-relaxed">
                    Ask Dreeso Memory is an AI-powered enterprise intelligence platform that connects to
                    multiple enterprise systems and provides instant, contextual insights through natural
                    language queries. The platform supports {allPersonaProfiles.length} persona flows,{' '}
                    {clusterSummary.length} intelligence clusters, and {systemStatus.length} connected systems.
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Capability Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {capabilities.map((capability, index) => (
                <CapabilityCard
                  key={`capability-${index}`}
                  icon={capability.icon}
                  title={capability.title}
                  description={capability.description}
                  features={capability.features}
                  index={index}
                />
              ))}
            </div>

            {/* Technology Stack */}
            <GlassCard variant="default" padding="md" animated>
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-teal bg-opacity-20"
                  aria-hidden="true"
                >
                  🛠️
                </span>
                <h3 className="text-sm font-semibold text-primary-50 leading-tight">
                  Technology Stack
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'React 18', description: 'UI Framework' },
                  { label: 'Vite', description: 'Build Tool' },
                  { label: 'Tailwind CSS', description: 'Styling' },
                  { label: 'React Router', description: 'Navigation' },
                ].map((tech, idx) => (
                  <AnimatedTransition
                    key={`tech-${idx}`}
                    show
                    type="scale"
                    duration="fast"
                    delay={idx * 60}
                  >
                    <div className="glass-sm p-3 flex flex-col items-center text-center">
                      <span className="text-sm font-semibold text-primary-50">{tech.label}</span>
                      <span className="text-xs text-primary-300 mt-0.5">{tech.description}</span>
                    </div>
                  </AnimatedTransition>
                ))}
              </div>
            </GlassCard>

            {/* Design System */}
            <GlassCard variant="default" padding="md" animated>
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-pink bg-opacity-20"
                  aria-hidden="true"
                >
                  🎨
                </span>
                <h3 className="text-sm font-semibold text-primary-50 leading-tight">
                  Design System
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Glassmorphism', description: 'Backdrop blur + transparency' },
                  { label: 'Dark Theme', description: 'Gradient backgrounds' },
                  { label: 'Urbanist Font', description: 'Modern typography' },
                  { label: 'Responsive', description: '3-column → 1-column' },
                  { label: 'Animated', description: 'Smooth transitions' },
                  { label: 'Accessible', description: 'ARIA labels + keyboard nav' },
                ].map((item, idx) => (
                  <AnimatedTransition
                    key={`design-${idx}`}
                    show
                    type="scale"
                    duration="fast"
                    delay={idx * 60}
                  >
                    <div className="glass-sm p-3 flex flex-col items-center text-center">
                      <span className="text-sm font-semibold text-primary-50">{item.label}</span>
                      <span className="text-xs text-primary-300 mt-0.5">{item.description}</span>
                    </div>
                  </AnimatedTransition>
                ))}
              </div>
            </GlassCard>
          </div>
        </AnimatedTransition>
      ) : null}

      {/* Export Section */}
      <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 5}>
        <GlassCard variant="default" padding="md" animated>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-blue bg-opacity-20"
                aria-hidden="true"
              >
                📥
              </span>
              <div className="flex flex-col">
                <h3 className="text-sm font-semibold text-primary-50 leading-tight">
                  Export Session Data
                </h3>
                <p className="text-xs text-primary-300 leading-tight">
                  Download audit trail and action log as JSON files
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className={[
                  'flex items-center gap-2 px-4 py-2.5 rounded-glass-sm',
                  'text-sm font-medium text-primary-200 border border-glass-border',
                  'hover:bg-glass-light hover:text-primary-50 hover:border-primary-300',
                  'transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
                ]
                  .filter(Boolean)
                  .join(' ')
                  .replace(/\s+/g, ' ')
                  .trim()}
                onClick={handleExportAuditTrail}
                aria-label="Export audit trail"
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Audit Trail ({auditTrailCount})</span>
              </button>
              <button
                type="button"
                className={[
                  'flex items-center gap-2 px-4 py-2.5 rounded-glass-sm',
                  'text-sm font-medium text-primary-200 border border-glass-border',
                  'hover:bg-glass-light hover:text-primary-50 hover:border-primary-300',
                  'transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
                ]
                  .filter(Boolean)
                  .join(' ')
                  .replace(/\s+/g, ' ')
                  .trim()}
                onClick={handleExportActionLog}
                aria-label="Export action log"
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Action Log ({actionLogCount})</span>
              </button>
            </div>
          </div>
        </GlassCard>
      </AnimatedTransition>

      {/* Footer */}
      <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 6}>
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white bg-accent-blue flex-shrink-0 shadow-accent-glow"
              aria-hidden="true"
            >
              D
            </span>
            <div className="flex flex-col items-start">
              <span className="text-lg font-semibold text-primary-50 leading-tight">
                {import.meta.env.VITE_APP_TITLE || 'Ask Dreeso Memory'}
              </span>
              <span className="text-xs text-primary-200 leading-tight">
                AI-Powered Enterprise Intelligence Platform
              </span>
            </div>
          </div>
          <p className="text-xs text-primary-300 text-center max-w-lg">
            Thank you for exploring Ask Dreeso Memory. This demo showcases multi-system intelligence
            orchestration, persona-based workflows, and actionable enterprise insights — all powered
            by natural language queries.
          </p>
          <p className="text-xs text-primary-300">
            v{import.meta.env.VITE_APP_VERSION || '1.0.0'} · Built with React, Vite, and Tailwind CSS
          </p>
        </div>
      </AnimatedTransition>
    </div>
  );
}

export default FinalSummaryPage;