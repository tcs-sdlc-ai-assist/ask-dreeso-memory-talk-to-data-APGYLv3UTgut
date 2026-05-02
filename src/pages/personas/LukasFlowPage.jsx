/**
 * Lukas Müller (Project Director) persona flow pages for Ask Dreeso Memory.
 * Screens 5-8: Implements project portfolio queries, risk analysis,
 * resource allocation, and project action execution screens with
 * persona-specific data and CTA flows.
 *
 * @module LukasFlowPage
 * @see SCRUM-7892
 * @see SCRUM-7893
 * @see SCRUM-7889
 * @see SCRUM-7896
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { useQuery } from '../../context/QueryContext';
import { useUIState, TRANSITION_EVENTS } from '../../context/UIStateContext';
import GlassCard from '../../components/ui/GlassCard';
import AnimatedTransition from '../../components/ui/AnimatedTransition';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import QueryInput from '../../components/query/QueryInput';
import ResultRenderer from '../../components/query/ResultRenderer';
import CTABubbles from '../../components/query/CTABubbles';
import SourceIndicatorPanel from '../../components/query/SourceIndicatorPanel';
import ActionButton from '../../components/actions/ActionButton';
import ActionConfirmation from '../../components/actions/ActionConfirmation';
import ForecastChart from '../../components/ui/ForecastChart';
import RiskSignalCard from '../../components/ui/RiskSignalCard';
import DataTable from '../../components/ui/DataTable';
import { SCREEN_IDS, VIEW_STATES, INTELLIGENCE_CLUSTERS, PERSONAS } from '../../constants';
import { logEvent, AUDIT_EVENT_TYPES } from '../../services/AuditLogger';
import { executeAction } from '../../services/ActionExecutor';
import {
  PROJECT_PORTFOLIO_DATA,
  WORKFORCE_DATA,
  RISK_SIGNALS,
  FORECAST_MODELS,
} from '../../data/mockData';
import { getPersonaProfile, getPrimaryClusters, getAccessibleClusters } from '../../data/personaData';

/**
 * Animation stagger delay in milliseconds between each section.
 * @type {number}
 */
const STAGGER_DELAY_MS = 100;

/**
 * Lukas persona ID constant.
 * @type {string}
 */
const LUKAS_PERSONA_ID = PERSONAS.LUKAS.id;

/**
 * Resolves the accent color for Lukas.
 * @returns {string} The accent color hex string
 */
function getLukasColor() {
  return PERSONAS.LUKAS.color || '#3B82F6';
}

/**
 * Formats a number as currency (EUR).
 * @param {number} value - The numeric value
 * @returns {string} Formatted currency string
 */
function formatCurrency(value) {
  if (typeof value !== 'number' || isNaN(value)) {
    return '€0';
  }
  if (Math.abs(value) >= 1000000) {
    return `€${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `€${(value / 1000).toFixed(0)}K`;
  }
  return `€${value.toFixed(0)}`;
}

/**
 * Formats a percentage value.
 * @param {number} value - The numeric value (0-100 or 0-1)
 * @returns {string} Formatted percentage string
 */
function formatPercent(value) {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%';
  }
  if (value <= 1 && value >= -1) {
    return `${(value * 100).toFixed(1)}%`;
  }
  return `${value.toFixed(1)}%`;
}

/**
 * Formats a date string to a readable format.
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate(dateStr) {
  if (typeof dateStr !== 'string' || dateStr.length === 0) {
    return 'N/A';
  }
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr;
    }
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Resolves a project status to a badge class.
 * @param {string} status - The project status
 * @returns {string} Tailwind classes for the status badge
 */
function getStatusBadgeClass(status) {
  switch (status) {
    case 'on-track':
      return 'bg-green-400 bg-opacity-15 text-green-400';
    case 'at-risk':
      return 'bg-amber-400 bg-opacity-15 text-amber-400';
    case 'critical':
      return 'bg-red-400 bg-opacity-15 text-red-400';
    default:
      return 'bg-glass-light text-primary-200';
  }
}

/**
 * Resolves severity to a color class.
 * @param {string} severity - The severity level
 * @returns {string} Tailwind color class
 */
function getSeverityColor(severity) {
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
 * PortfolioSummaryCard sub-component.
 * Renders the portfolio summary KPIs for Lukas.
 *
 * @param {Object} props
 * @param {Object} props.data - The portfolio data object
 * @returns {React.ReactElement|null} The portfolio summary card
 */
function PortfolioSummaryCard({ data }) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const kpis = [];

  if (typeof data.totalProjects === 'number') {
    kpis.push({ label: 'Total Projects', value: data.totalProjects, icon: '📊' });
  }
  if (typeof data.onTrack === 'number') {
    kpis.push({ label: 'On Track', value: data.onTrack, icon: '✅' });
  }
  if (typeof data.atRisk === 'number') {
    kpis.push({ label: 'At Risk', value: data.atRisk, icon: '⚠️' });
  }
  if (typeof data.critical === 'number') {
    kpis.push({ label: 'Critical', value: data.critical, icon: '🔴' });
  }
  if (typeof data.totalBudget === 'number') {
    kpis.push({ label: 'Total Budget', value: formatCurrency(data.totalBudget), icon: '💰' });
  }
  if (typeof data.budgetUtilizationPercent === 'number') {
    kpis.push({ label: 'Budget Used', value: `${data.budgetUtilizationPercent}%`, icon: '📋' });
  }

  if (kpis.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi, index) => (
        <AnimatedTransition
          key={`lukas-kpi-${index}`}
          show
          type="scale"
          duration="fast"
          delay={index * 60}
        >
          <div className="glass-sm p-3 flex flex-col items-center text-center">
            <span className="text-lg mb-1" aria-hidden="true">{kpi.icon}</span>
            <span className="text-lg font-bold text-primary-50">
              {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
            </span>
            <span className="text-xs text-primary-300 mt-0.5">{kpi.label}</span>
          </div>
        </AnimatedTransition>
      ))}
    </div>
  );
}

/**
 * ProjectListSection sub-component.
 * Renders the project list as a data table for Lukas.
 *
 * @param {Object} props
 * @param {Object[]} props.projects - Array of project objects
 * @param {function} [props.onProjectClick] - Click handler for a project row
 * @returns {React.ReactElement|null} The project list section
 */
function ProjectListSection({ projects, onProjectClick }) {
  if (!Array.isArray(projects) || projects.length === 0) {
    return null;
  }

  const columns = useMemo(() => [
    {
      key: 'name',
      label: 'Project',
      sortable: true,
      render: (value) => (
        <span className="text-sm font-medium text-primary-50">{value}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span
          className={[
            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize',
            getStatusBadgeClass(value),
          ].join(' ')}
        >
          {typeof value === 'string' ? value.replace('-', ' ') : 'unknown'}
        </span>
      ),
    },
    {
      key: 'completion',
      label: 'Completion',
      sortable: true,
      align: 'right',
      render: (value) => (
        <span className="text-sm text-primary-100">
          {typeof value === 'number' ? `${value}%` : '0%'}
        </span>
      ),
    },
    {
      key: 'budget',
      label: 'Budget',
      sortable: true,
      align: 'right',
      render: (value) => (
        <span className="text-sm text-primary-100">
          {formatCurrency(typeof value === 'number' ? value : 0)}
        </span>
      ),
    },
    {
      key: 'spent',
      label: 'Spent',
      sortable: true,
      align: 'right',
      render: (value) => (
        <span className="text-sm text-primary-100">
          {formatCurrency(typeof value === 'number' ? value : 0)}
        </span>
      ),
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-primary-200">
          {formatDate(typeof value === 'string' ? value : '')}
        </span>
      ),
    },
    {
      key: 'riskLevel',
      label: 'Risk',
      sortable: true,
      render: (value) => (
        <span className={['text-xs font-medium capitalize', getSeverityColor(value)].join(' ')}>
          {typeof value === 'string' ? value : 'low'}
        </span>
      ),
    },
  ], []);

  return (
    <DataTable
      columns={columns}
      data={projects}
      rowKeyField="id"
      striped
      hoverable
      sortable
      defaultSortColumn="status"
      defaultSortDirection="desc"
      showHeader
      title="Active Projects"
      subtitle="Portfolio overview for all active projects"
      icon="📊"
      emptyMessage="No active projects found."
      emptyIcon="📁"
      animated
      onRowClick={onProjectClick}
    />
  );
}

/**
 * OverdueMilestonesSection sub-component.
 * Renders overdue milestones for Lukas.
 *
 * @param {Object} props
 * @param {Object[]} props.milestones - Array of overdue milestone objects
 * @returns {React.ReactElement|null} The overdue milestones section
 */
function OverdueMilestonesSection({ milestones }) {
  if (!Array.isArray(milestones) || milestones.length === 0) {
    return null;
  }

  return (
    <GlassCard variant="default" padding="md" animated>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-red-400 bg-opacity-20"
            aria-hidden="true"
          >
            ⏰
          </span>
          <h3 className="text-sm font-semibold text-primary-50 leading-tight">
            Overdue Milestones
          </h3>
        </div>
        <span className="text-xs text-red-400 font-medium">
          {milestones.length} overdue
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {milestones.map((ms, idx) => (
          <AnimatedTransition
            key={ms.id || `ms-${idx}`}
            show
            type="slide-up"
            duration="fast"
            delay={idx * 60}
          >
            <div className="flex items-center justify-between px-3 py-2.5 rounded-glass-sm bg-glass-light border border-glass-border">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary-50 truncate">
                  {typeof ms.name === 'string' ? ms.name : 'Milestone'}
                </p>
                <p className="text-xs text-primary-300">
                  {typeof ms.projectName === 'string' ? ms.projectName : ''}
                  {typeof ms.assignee === 'string' ? ` · ${ms.assignee}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                <span className="text-xs text-red-400 font-medium">
                  {typeof ms.daysOverdue === 'number' ? `${ms.daysOverdue}d overdue` : 'Overdue'}
                </span>
                <span
                  className={[
                    'text-xs px-1.5 py-0.5 rounded-full',
                    ms.impact === 'critical-path'
                      ? 'bg-red-400 bg-opacity-15 text-red-400'
                      : 'bg-glass-light text-primary-300',
                  ].join(' ')}
                >
                  {ms.impact === 'critical-path' ? 'Critical Path' : 'Non-Critical'}
                </span>
              </div>
            </div>
          </AnimatedTransition>
        ))}
      </div>
    </GlassCard>
  );
}

/**
 * ResourceAllocationSection sub-component.
 * Renders resource allocation data for Lukas.
 *
 * @param {Object} props
 * @param {Object} props.workforceData - The workforce data object
 * @returns {React.ReactElement|null} The resource allocation section
 */
function ResourceAllocationSection({ workforceData }) {
  if (!workforceData || typeof workforceData !== 'object') {
    return null;
  }

  const data = workforceData.data || {};
  const allocationByProject = Array.isArray(data.allocationByProject) ? data.allocationByProject : [];

  const kpis = [];
  if (typeof data.totalWorkforce === 'number') {
    kpis.push({ label: 'Total Workforce', value: data.totalWorkforce, icon: '👥' });
  }
  if (typeof data.utilizationRate === 'number') {
    kpis.push({ label: 'Utilization', value: formatPercent(data.utilizationRate), icon: '📊' });
  }
  if (typeof data.availableForReallocation === 'number') {
    kpis.push({ label: 'Available', value: data.availableForReallocation, icon: '🔄' });
  }
  if (typeof data.understaffedProjects === 'number') {
    kpis.push({ label: 'Understaffed', value: data.understaffedProjects, icon: '⚠️' });
  }

  return (
    <GlassCard variant="default" padding="md" animated>
      <div className="flex items-center gap-2 mb-4">
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-pink bg-opacity-20"
          aria-hidden="true"
        >
          👥
        </span>
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-primary-50 leading-tight">
            Resource Allocation
          </h3>
          <p className="text-xs text-primary-300 leading-tight">
            Workforce distribution across projects
          </p>
        </div>
      </div>

      {/* KPIs */}
      {kpis.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {kpis.map((kpi, index) => (
            <div
              key={`wf-kpi-${index}`}
              className="glass-sm p-3 flex flex-col items-center text-center"
            >
              <span className="text-lg mb-1" aria-hidden="true">{kpi.icon}</span>
              <span className="text-lg font-bold text-primary-50">
                {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
              </span>
              <span className="text-xs text-primary-300 mt-0.5">{kpi.label}</span>
            </div>
          ))}
        </div>
      ) : null}

      {/* Allocation by Project */}
      {allocationByProject.length > 0 ? (
        <div>
          <p className="text-xs text-primary-300 font-semibold uppercase tracking-wider mb-3">
            Allocation by Project
          </p>
          <div className="flex flex-col gap-2">
            {allocationByProject.map((alloc, idx) => (
              <AnimatedTransition
                key={alloc.projectId || `alloc-${idx}`}
                show
                type="slide-up"
                duration="fast"
                delay={idx * 60}
              >
                <div className="flex items-center justify-between px-3 py-2.5 rounded-glass-sm bg-glass-light border border-glass-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary-50 truncate">
                      {typeof alloc.projectName === 'string' ? alloc.projectName : 'Project'}
                    </p>
                    {Array.isArray(alloc.criticalRoles) && alloc.criticalRoles.length > 0 ? (
                      <p className="text-xs text-amber-400 mt-0.5">
                        Needs: {alloc.criticalRoles.join(', ')}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <span className="text-xs text-primary-300">
                      {typeof alloc.allocated === 'number' ? alloc.allocated : 0}/
                      {typeof alloc.required === 'number' ? alloc.required : 0}
                    </span>
                    <span
                      className={[
                        'text-xs font-medium',
                        typeof alloc.gap === 'number' && alloc.gap >= 0 ? 'text-green-400' : 'text-red-400',
                      ].join(' ')}
                    >
                      {typeof alloc.gap === 'number' ? (alloc.gap >= 0 ? `+${alloc.gap}` : alloc.gap) : '0'}
                    </span>
                  </div>
                </div>
              </AnimatedTransition>
            ))}
          </div>
        </div>
      ) : null}
    </GlassCard>
  );
}

/**
 * LukasRiskSignalsSection sub-component.
 * Renders risk signals relevant to Lukas's portfolio.
 *
 * @param {Object} props
 * @param {Object[]} props.signals - Array of risk signal objects
 * @param {function} [props.onActionClick] - Action click handler
 * @returns {React.ReactElement|null} The risk signals section
 */
function LukasRiskSignalsSection({ signals, onActionClick }) {
  if (!Array.isArray(signals) || signals.length === 0) {
    return null;
  }

  // Filter signals relevant to Lukas's clusters
  const relevantSignals = signals.filter((signal) => {
    if (!signal || typeof signal !== 'object') {
      return false;
    }
    // Include signals affecting project portfolio or workforce clusters
    if (Array.isArray(signal.affectedClusters)) {
      return signal.affectedClusters.some(
        (cid) =>
          cid === INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id ||
          cid === INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id
      );
    }
    return true;
  });

  if (relevantSignals.length === 0) {
    return null;
  }

  return (
    <GlassCard variant="default" padding="md" animated>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-red-400 bg-opacity-20"
            aria-hidden="true"
          >
            🚨
          </span>
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-primary-50 leading-tight">
              Portfolio Risk Signals
            </h3>
            <p className="text-xs text-primary-300 leading-tight">
              Active risks affecting your projects
            </p>
          </div>
        </div>
        <span className="text-xs text-primary-300">
          {relevantSignals.length} signal{relevantSignals.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {relevantSignals.map((signal, index) => (
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
            onActionClick={onActionClick}
          />
        ))}
      </div>
    </GlassCard>
  );
}

/**
 * LukasActionsSection sub-component.
 * Renders suggested actions for Lukas.
 *
 * @param {Object} props
 * @param {Object[]} props.actions - Array of action objects
 * @param {boolean} props.disabled - Whether actions are disabled
 * @param {function} props.onExecute - Execute callback
 * @param {function} props.onSuccess - Success callback
 * @param {function} props.onError - Error callback
 * @returns {React.ReactElement|null} The actions section
 */
function LukasActionsSection({ actions, disabled, onExecute, onSuccess, onError }) {
  if (!Array.isArray(actions) || actions.length === 0) {
    return null;
  }

  return (
    <GlassCard variant="default" padding="md" animated>
      <div className="flex items-center gap-2 mb-4">
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-purple bg-opacity-20"
          aria-hidden="true"
        >
          ⚡
        </span>
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-primary-50 leading-tight">
            Suggested Actions
          </h3>
          <p className="text-xs text-primary-300 leading-tight">
            Recommended actions for your portfolio
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action, index) => (
          <ActionButton
            key={action.id || `lukas-action-${index}`}
            actionType={typeof action.type === 'string' ? action.type : 'workflow'}
            label={typeof action.label === 'string' ? action.label : 'Action'}
            actionId={typeof action.id === 'string' ? action.id : undefined}
            targetSystem={typeof action.target === 'string' ? action.target : undefined}
            variant={action.priority === 'high' ? 'primary' : 'secondary'}
            size="sm"
            showSystemBadge
            showIcon
            disabled={disabled}
            onExecute={onExecute}
            onSuccess={onSuccess}
            onError={onError}
          />
        ))}
      </div>
    </GlassCard>
  );
}

/**
 * LukasFlowPage component.
 * Renders the Lukas Müller (Project Director) persona flow pages.
 * Implements project portfolio queries, risk analysis, resource allocation,
 * and project action execution screens with persona-specific data and CTA flows.
 *
 * @returns {React.ReactElement|null} The Lukas flow page component, or null if not authenticated
 */
function LukasFlowPage() {
  const { user, isAuthenticated, persona, role } = useAuth();
  const { navigateTo } = useNavigation();
  const {
    executeQuery,
    isLoading,
    error,
    results,
    ctaBubbles,
    queryText,
    confidence,
    clearResults,
    clearError,
  } = useQuery();
  const { state, transitionState, addActionTaken } = useUIState();

  const [activeTab, setActiveTab] = useState('portfolio');
  const [actionResult, setActionResult] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [actionLabel, setActionLabel] = useState(null);
  const [actionTargetSystem, setActionTargetSystem] = useState(null);
  const [actionExecuting, setActionExecuting] = useState(false);

  const currentView = state.currentView;

  /**
   * Log screen view on mount
   */
  useEffect(() => {
    logEvent(AUDIT_EVENT_TYPES.SCREEN_VIEW, {
      screenId: SCREEN_IDS.CLUSTER_PROJECT,
      screenName: 'Lukas Flow - Project Portfolio',
      persona,
    });
  }, [persona]);

  /**
   * Resolves the Lukas persona profile
   */
  const lukasProfile = useMemo(() => {
    return getPersonaProfile(LUKAS_PERSONA_ID);
  }, []);

  /**
   * Resolves portfolio data from mock data
   */
  const portfolioData = useMemo(() => {
    if (Array.isArray(PROJECT_PORTFOLIO_DATA) && PROJECT_PORTFOLIO_DATA.length > 0) {
      return PROJECT_PORTFOLIO_DATA[0];
    }
    return null;
  }, []);

  /**
   * Resolves milestone data from mock data
   */
  const milestoneData = useMemo(() => {
    if (Array.isArray(PROJECT_PORTFOLIO_DATA) && PROJECT_PORTFOLIO_DATA.length > 1) {
      return PROJECT_PORTFOLIO_DATA[1];
    }
    return null;
  }, []);

  /**
   * Resolves workforce data from mock data
   */
  const workforceData = useMemo(() => {
    if (Array.isArray(WORKFORCE_DATA) && WORKFORCE_DATA.length > 0) {
      return WORKFORCE_DATA[0];
    }
    return null;
  }, []);

  /**
   * Resolves the workforce forecast model
   */
  const workforceForecast = useMemo(() => {
    if (Array.isArray(FORECAST_MODELS)) {
      return FORECAST_MODELS.find((m) => m.type === 'workforce') || null;
    }
    return null;
  }, []);

  /**
   * Resolves projects from portfolio data
   */
  const projects = useMemo(() => {
    if (portfolioData && portfolioData.data && Array.isArray(portfolioData.data.projects)) {
      return portfolioData.data.projects;
    }
    return [];
  }, [portfolioData]);

  /**
   * Resolves overdue milestones from milestone data
   */
  const overdueMilestones = useMemo(() => {
    if (milestoneData && milestoneData.data && Array.isArray(milestoneData.data.overdueMilestones)) {
      return milestoneData.data.overdueMilestones;
    }
    return [];
  }, [milestoneData]);

  /**
   * Resolves all suggested actions from portfolio and workforce data
   */
  const allActions = useMemo(() => {
    const actions = [];
    if (portfolioData && Array.isArray(portfolioData.actions)) {
      for (const action of portfolioData.actions) {
        actions.push(action);
      }
    }
    if (milestoneData && Array.isArray(milestoneData.actions)) {
      for (const action of milestoneData.actions) {
        if (!actions.some((a) => a.id === action.id)) {
          actions.push(action);
        }
      }
    }
    if (workforceData && Array.isArray(workforceData.actions)) {
      for (const action of workforceData.actions) {
        if (!actions.some((a) => a.id === action.id)) {
          actions.push(action);
        }
      }
    }
    return actions;
  }, [portfolioData, milestoneData, workforceData]);

  /**
   * Resolves risk signals relevant to Lukas
   */
  const lukasRiskSignals = useMemo(() => {
    if (!Array.isArray(RISK_SIGNALS)) {
      return [];
    }
    return RISK_SIGNALS.filter((signal) => {
      if (!signal || typeof signal !== 'object') {
        return false;
      }
      if (Array.isArray(signal.affectedClusters)) {
        return signal.affectedClusters.some(
          (cid) =>
            cid === INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id ||
            cid === INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id
        );
      }
      return false;
    });
  }, []);

  /**
   * Handles query submission
   * @param {string} submittedQuery - The submitted query text
   */
  const handleQuerySubmit = useCallback((submittedQuery) => {
    logEvent(AUDIT_EVENT_TYPES.QUERY_SUBMIT, {
      action: 'LUKAS_FLOW_QUERY_SUBMIT',
      queryText: submittedQuery,
      persona,
    });

    setActionResult(null);
    setActionType(null);
    setActionLabel(null);
    setActionTargetSystem(null);
  }, [persona]);

  /**
   * Handles action click from ResultRenderer
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

    setActionType(type);
    setActionLabel(label);
    setActionTargetSystem(target);
    setActionExecuting(true);

    logEvent(AUDIT_EVENT_TYPES.ACTION_EXECUTE, {
      action: 'LUKAS_FLOW_ACTION_CLICK',
      actionType: type,
      actionLabel: label,
      actionId,
      persona,
    });

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

        addActionTaken({
          id: result.id,
          actionType: type,
          targetSystem: target,
          label,
          status: result.status,
          message: result.message,
          timestamp: result.timestamp,
        });

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
   * Handles risk signal action click
   * @param {string} actionId - The action identifier
   * @param {Object} signal - The risk signal object
   */
  const handleRiskActionClick = useCallback((actionId, signal) => {
    logEvent(AUDIT_EVENT_TYPES.ACTION_EXECUTE, {
      action: 'LUKAS_FLOW_RISK_ACTION_CLICK',
      actionId,
      signalId: signal ? signal.id : null,
      persona,
    });

    // Find the matching action from allActions
    const matchedAction = allActions.find((a) => a.id === actionId);
    if (matchedAction) {
      handleActionClick(matchedAction);
    }
  }, [persona, allActions, handleActionClick]);

  /**
   * Handles starting a new query
   */
  const handleNewQuery = useCallback(() => {
    logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {
      action: 'LUKAS_FLOW_NEW_QUERY',
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
   * @param {Object} bubble - The clicked CTA bubble object
   */
  const handleBubbleClick = useCallback((bubble) => {
    logEvent(AUDIT_EVENT_TYPES.CTA_CLICK, {
      action: 'LUKAS_FLOW_CTA_CLICK',
      bubbleLabel: bubble ? bubble.label : null,
      persona,
    });

    setActionResult(null);
    setActionType(null);
    setActionLabel(null);
    setActionTargetSystem(null);
  }, [persona]);

  /**
   * Handles undo from ActionConfirmation
   * @param {Object} result - The action result to undo
   */
  const handleUndo = useCallback((result) => {
    logEvent(AUDIT_EVENT_TYPES.ACTION_EXECUTE, {
      action: 'LUKAS_FLOW_UNDO',
      executionId: result ? result.id : null,
      persona,
    });
  }, [persona]);

  /**
   * Handles proceed from ActionConfirmation
   */
  const handleProceed = useCallback(() => {
    logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {
      action: 'LUKAS_FLOW_PROCEED',
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

    if (results) {
      transitionState(TRANSITION_EVENTS.NAVIGATE, {
        screenId: SCREEN_IDS.CLUSTER_PROJECT,
        viewState: VIEW_STATES.RESULT,
      });
    } else {
      transitionState(TRANSITION_EVENTS.RESET, {});
    }
  }, [results, transitionState]);

  /**
   * Handles action execute callback from ActionButton
   * @param {Object} executionInfo - The execution info
   */
  const handleActionExecute = useCallback((executionInfo) => {
    logEvent(AUDIT_EVENT_TYPES.ACTION_EXECUTE, {
      action: 'LUKAS_FLOW_ACTION_BUTTON_EXECUTE',
      ...executionInfo,
      persona,
    });
  }, [persona]);

  /**
   * Handles action success callback from ActionButton
   * @param {Object} result - The action result
   */
  const handleActionSuccess = useCallback((result) => {
    logEvent(AUDIT_EVENT_TYPES.ACTION_SUCCESS, {
      action: 'LUKAS_FLOW_ACTION_BUTTON_SUCCESS',
      executionId: result ? result.id : null,
      persona,
    });
  }, [persona]);

  /**
   * Handles action error callback from ActionButton
   * @param {Object} result - The error result
   */
  const handleActionError = useCallback((result) => {
    logEvent(AUDIT_EVENT_TYPES.ACTION_ERROR, {
      action: 'LUKAS_FLOW_ACTION_BUTTON_ERROR',
      message: result ? result.message : null,
      persona,
    });
  }, [persona]);

  /**
   * Handles tab switching
   * @param {string} tab - The tab identifier
   */
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);

    logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {
      action: 'LUKAS_FLOW_TAB_CHANGE',
      tab,
      persona,
    });
  }, [persona]);

  /**
   * Handles project row click
   * @param {Object} project - The project object
   */
  const handleProjectClick = useCallback((project) => {
    if (!project || typeof project !== 'object') {
      return;
    }

    logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {
      action: 'LUKAS_FLOW_PROJECT_CLICK',
      projectId: project.id || null,
      projectName: project.name || null,
      persona,
    });
  }, [persona]);

  /**
   * Determines view states
   */
  const showInput = currentView === VIEW_STATES.INPUT ||
    currentView === VIEW_STATES.RESULT ||
    currentView === VIEW_STATES.CTA;

  const showResults = (currentView === VIEW_STATES.RESULT ||
    currentView === VIEW_STATES.CTA) &&
    !isLoading &&
    results !== null;

  const showConfirmation = (currentView === VIEW_STATES.CONFIRMATION ||
    currentView === VIEW_STATES.ACTION) &&
    actionResult !== null;

  const showActionExecuting = currentView === VIEW_STATES.ACTION &&
    actionExecuting &&
    actionResult === null;

  const accentColor = getLukasColor();

  /**
   * Tab definitions
   */
  const tabs = useMemo(() => [
    { id: 'portfolio', label: 'Portfolio', icon: '📊' },
    { id: 'milestones', label: 'Milestones', icon: '⏰' },
    { id: 'resources', label: 'Resources', icon: '👥' },
    { id: 'risks', label: 'Risks', icon: '🚨' },
    { id: 'query', label: 'Ask Dreeso', icon: '🔍' },
  ], []);

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
                className="flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold text-white flex-shrink-0 shadow-accent-glow"
                style={{ backgroundColor: accentColor }}
                aria-hidden="true"
              >
                {lukasProfile ? lukasProfile.avatar : 'L'}
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-semibold text-primary-50 leading-tight">
                  Project & Portfolio Intelligence
                </h1>
                <p className="text-sm text-primary-200 mt-0.5">
                  {lukasProfile ? lukasProfile.name : 'Lukas Müller'} · {lukasProfile ? lukasProfile.role : 'Project Director'}
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
        </GlassCard>
      </AnimatedTransition>

      {/* Tab Navigation */}
      <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS}>
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={[
                'flex items-center gap-2 px-4 py-2.5 rounded-glass-sm',
                'text-sm font-medium whitespace-nowrap',
                'transition-all duration-300 ease-in-out',
                'focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
                activeTab === tab.id
                  ? 'bg-glass-light text-primary-50 border border-glass-border'
                  : 'text-primary-200 border border-transparent hover:bg-glass-light hover:text-primary-50',
              ]
                .filter(Boolean)
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim()}
              onClick={() => handleTabChange(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <span className="text-sm" aria-hidden="true">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </AnimatedTransition>

      {/* Portfolio Tab */}
      {activeTab === 'portfolio' ? (
        <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 2}>
          <div className="flex flex-col gap-6">
            {/* Portfolio Summary */}
            {portfolioData && portfolioData.data ? (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-blue bg-opacity-20"
                    aria-hidden="true"
                  >
                    📊
                  </span>
                  <h2 className="text-base font-semibold text-primary-50 leading-tight">
                    Portfolio Overview
                  </h2>
                </div>
                <PortfolioSummaryCard data={portfolioData.data} />
              </div>
            ) : null}

            {/* Summary Text */}
            {portfolioData && typeof portfolioData.summary === 'string' ? (
              <GlassCard variant="default" padding="md" animated>
                <div className="flex items-start gap-3">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-blue bg-opacity-20"
                    aria-hidden="true"
                  >
                    🧠
                  </span>
                  <p className="text-sm text-primary-100 leading-relaxed">
                    {portfolioData.summary}
                  </p>
                </div>
              </GlassCard>
            ) : null}

            {/* Project List */}
            <ProjectListSection
              projects={projects}
              onProjectClick={handleProjectClick}
            />

            {/* Actions */}
            <LukasActionsSection
              actions={allActions.filter((a) =>
                a.id === 'act-pp-001' || a.id === 'act-pp-002' || a.id === 'act-pp-003'
              )}
              disabled={actionExecuting}
              onExecute={handleActionExecute}
              onSuccess={handleActionSuccess}
              onError={handleActionError}
            />

            {/* CTA Bubbles */}
            <CTABubbles
              clusterId={INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id}
              onBubbleClick={handleBubbleClick}
              showHeader
            />
          </div>
        </AnimatedTransition>
      ) : null}

      {/* Milestones Tab */}
      {activeTab === 'milestones' ? (
        <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 2}>
          <div className="flex flex-col gap-6">
            {/* Milestone Summary */}
            {milestoneData && typeof milestoneData.summary === 'string' ? (
              <GlassCard variant="default" padding="md" animated>
                <div className="flex items-start gap-3">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-amber-400 bg-opacity-20"
                    aria-hidden="true"
                  >
                    ⏰
                  </span>
                  <p className="text-sm text-primary-100 leading-relaxed">
                    {milestoneData.summary}
                  </p>
                </div>
              </GlassCard>
            ) : null}

            {/* Milestone KPIs */}
            {milestoneData && milestoneData.data ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {typeof milestoneData.data.totalMilestones === 'number' ? (
                  <div className="glass-sm p-3 flex flex-col items-center text-center">
                    <span className="text-lg mb-1" aria-hidden="true">📋</span>
                    <span className="text-lg font-bold text-primary-50">
                      {milestoneData.data.totalMilestones}
                    </span>
                    <span className="text-xs text-primary-300 mt-0.5">Total</span>
                  </div>
                ) : null}
                {typeof milestoneData.data.completed === 'number' ? (
                  <div className="glass-sm p-3 flex flex-col items-center text-center">
                    <span className="text-lg mb-1" aria-hidden="true">✅</span>
                    <span className="text-lg font-bold text-primary-50">
                      {milestoneData.data.completed}
                    </span>
                    <span className="text-xs text-primary-300 mt-0.5">Completed</span>
                  </div>
                ) : null}
                {typeof milestoneData.data.upcoming === 'number' ? (
                  <div className="glass-sm p-3 flex flex-col items-center text-center">
                    <span className="text-lg mb-1" aria-hidden="true">📅</span>
                    <span className="text-lg font-bold text-primary-50">
                      {milestoneData.data.upcoming}
                    </span>
                    <span className="text-xs text-primary-300 mt-0.5">Upcoming</span>
                  </div>
                ) : null}
                {typeof milestoneData.data.overdue === 'number' ? (
                  <div className="glass-sm p-3 flex flex-col items-center text-center">
                    <span className="text-lg mb-1" aria-hidden="true">🔴</span>
                    <span className="text-lg font-bold text-red-400">
                      {milestoneData.data.overdue}
                    </span>
                    <span className="text-xs text-primary-300 mt-0.5">Overdue</span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Overdue Milestones */}
            <OverdueMilestonesSection milestones={overdueMilestones} />

            {/* Milestone Actions */}
            <LukasActionsSection
              actions={allActions.filter((a) =>
                a.id === 'act-pp-004' || a.id === 'act-pp-005'
              )}
              disabled={actionExecuting}
              onExecute={handleActionExecute}
              onSuccess={handleActionSuccess}
              onError={handleActionError}
            />
          </div>
        </AnimatedTransition>
      ) : null}

      {/* Resources Tab */}
      {activeTab === 'resources' ? (
        <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 2}>
          <div className="flex flex-col gap-6">
            {/* Workforce Summary */}
            {workforceData && typeof workforceData.summary === 'string' ? (
              <GlassCard variant="default" padding="md" animated>
                <div className="flex items-start gap-3">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-pink bg-opacity-20"
                    aria-hidden="true"
                  >
                    👥
                  </span>
                  <p className="text-sm text-primary-100 leading-relaxed">
                    {workforceData.summary}
                  </p>
                </div>
              </GlassCard>
            ) : null}

            {/* Resource Allocation */}
            <ResourceAllocationSection workforceData={workforceData} />

            {/* Workforce Forecast */}
            {workforceForecast ? (
              <ForecastChart
                forecast={workforceForecast}
                showHeader
                showConfidence
                compact={false}
                animated
              />
            ) : null}

            {/* Workforce Actions */}
            <LukasActionsSection
              actions={allActions.filter((a) =>
                a.id === 'act-wf-001' || a.id === 'act-wf-002' || a.id === 'act-wf-003'
              )}
              disabled={actionExecuting}
              onExecute={handleActionExecute}
              onSuccess={handleActionSuccess}
              onError={handleActionError}
            />

            {/* CTA Bubbles for Workforce */}
            <CTABubbles
              clusterId={INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id}
              onBubbleClick={handleBubbleClick}
              showHeader
            />
          </div>
        </AnimatedTransition>
      ) : null}

      {/* Risks Tab */}
      {activeTab === 'risks' ? (
        <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 2}>
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
                    {lukasRiskSignals.length} risk signal{lukasRiskSignals.length !== 1 ? 's' : ''} detected
                    across your portfolio. {lukasRiskSignals.filter((s) => s.severity === 'critical').length > 0
                      ? `${lukasRiskSignals.filter((s) => s.severity === 'critical').length} critical risk${lukasRiskSignals.filter((s) => s.severity === 'critical').length !== 1 ? 's' : ''} require immediate attention.`
                      : 'No critical risks at this time.'}
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Risk Signal Cards */}
            <LukasRiskSignalsSection
              signals={lukasRiskSignals}
              onActionClick={handleRiskActionClick}
            />

            {/* Risk-specific portfolio risk signals from query results */}
            {portfolioData && Array.isArray(portfolioData.riskSignals) && portfolioData.riskSignals.length > 0 ? (
              <GlassCard variant="default" padding="md" animated>
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-amber-400 bg-opacity-20"
                    aria-hidden="true"
                  >
                    ⚠️
                  </span>
                  <h3 className="text-sm font-semibold text-primary-50 leading-tight">
                    Project-Level Risk Signals
                  </h3>
                </div>
                <div className="flex flex-col gap-2">
                  {portfolioData.riskSignals.map((signal, index) => (
                    <AnimatedTransition
                      key={signal.id || `proj-risk-${index}`}
                      show
                      type="slide-up"
                      duration="fast"
                      delay={index * 60}
                    >
                      <div
                        className={[
                          'flex items-start gap-3 px-4 py-3 rounded-glass-sm border',
                          signal.severity === 'high'
                            ? 'bg-orange-400 bg-opacity-10 border-orange-400 border-opacity-20'
                            : 'bg-amber-400 bg-opacity-10 border-amber-400 border-opacity-20',
                        ].join(' ')}
                      >
                        <span className="text-sm flex-shrink-0 mt-0.5" aria-hidden="true">
                          {signal.severity === 'high' ? '🟠' : '🟡'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={[
                                'text-xs font-semibold uppercase px-2 py-0.5 rounded-full',
                                signal.severity === 'high'
                                  ? 'bg-orange-400 bg-opacity-15 text-orange-400'
                                  : 'bg-amber-400 bg-opacity-15 text-amber-400',
                              ].join(' ')}
                            >
                              {typeof signal.severity === 'string' ? signal.severity : 'medium'}
                            </span>
                            {typeof signal.category === 'string' ? (
                              <span className="text-xs text-primary-300 capitalize">
                                {signal.category}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-sm text-primary-100 leading-relaxed">
                            {typeof signal.message === 'string' ? signal.message : ''}
                          </p>
                        </div>
                      </div>
                    </AnimatedTransition>
                  ))}
                </div>
              </GlassCard>
            ) : null}
          </div>
        </AnimatedTransition>
      ) : null}

      {/* Query Tab */}
      {activeTab === 'query' ? (
        <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 2}>
          <div className="flex flex-col gap-6">
            {/* Query Input */}
            <AnimatedTransition
              show={showInput}
              type="fade"
              duration="normal"
            >
              <QueryInput
                placeholder="Ask about your projects, milestones, resources, or portfolio risks..."
                autoFocus={currentView === VIEW_STATES.INPUT}
                onQuerySubmit={handleQuerySubmit}
              />
            </AnimatedTransition>

            {/* Loading State */}
            <AnimatedTransition
              show={isLoading}
              type="fade"
              duration="fast"
              unmountOnExit
            >
              <GlassCard variant="default" padding="lg" animated>
                <LoadingSpinner
                  size="lg"
                  message="Querying project and workforce systems..."
                  className="py-12"
                />
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
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span>Try Again</span>
                  </button>
                </div>
              </GlassCard>
            </AnimatedTransition>

            {/* Results */}
            <AnimatedTransition
              show={showResults}
              type="slide-up"
              duration="normal"
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

            {/* CTA Bubbles + Source Panel */}
            {showResults ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <CTABubbles
                    queryResult={results}
                    bubbles={ctaBubbles.length > 0 ? ctaBubbles : undefined}
                    onBubbleClick={handleBubbleClick}
                    showHeader
                  />
                </div>
                <div className="lg:col-span-1">
                  <SourceIndicatorPanel
                    queryResult={results}
                    compact={false}
                    showHeader
                    showSummary
                    showInactive
                  />
                </div>
              </div>
            ) : null}

            {/* Empty State */}
            {currentView === VIEW_STATES.INPUT && !isLoading && !results && !error && !showConfirmation ? (
              <CTABubbles
                clusterId={INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id}
                onBubbleClick={handleBubbleClick}
                showHeader
              />
            ) : null}
          </div>
        </AnimatedTransition>
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

      {/* Footer */}
      <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 5}>
        <div className="flex items-center justify-center py-4">
          <p className="text-xs text-primary-300">
            {import.meta.env.VITE_APP_TITLE || 'Ask Dreeso Memory'}{' '}
            v{import.meta.env.VITE_APP_VERSION || '1.0.0'} · Project & Portfolio Intelligence
          </p>
        </div>
      </AnimatedTransition>
    </div>
  );
}

export default LukasFlowPage;