/**
 * James Carter (Business Development Manager / Sales Director) persona flow pages for Ask Dreeso Memory.
 * Screens 17-19: Implements sales pipeline queries, business development analysis,
 * revenue forecasting, and sales action execution screens with
 * persona-specific data and CTA flows.
 *
 * @module JamesFlowPage
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
  SALES_PIPELINE_DATA,
  RISK_SIGNALS,
  FORECAST_MODELS,
} from '../../data/mockData';
import { getPersonaProfile } from '../../data/personaData';

/**
 * Animation stagger delay in milliseconds between each section.
 * @type {number}
 */
const STAGGER_DELAY_MS = 100;

/**
 * James persona ID constant.
 * @type {string}
 */
const JAMES_PERSONA_ID = PERSONAS.JAMES.id;

/**
 * Resolves the accent color for James.
 * @returns {string} The accent color hex string
 */
function getJamesColor() {
  return PERSONAS.JAMES.color || '#F59E0B';
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
 * PipelineSummaryCard sub-component.
 * Renders the sales pipeline summary KPIs for James.
 *
 * @param {Object} props
 * @param {Object} props.data - The pipeline data object
 * @returns {React.ReactElement|null} The pipeline summary card
 */
function PipelineSummaryCard({ data }) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const kpis = [];

  if (typeof data.pipelineValue === 'number') {
    kpis.push({ label: 'Pipeline Value', value: formatCurrency(data.pipelineValue), icon: '📈' });
  }
  if (typeof data.activeOpportunities === 'number') {
    kpis.push({ label: 'Active Opportunities', value: data.activeOpportunities, icon: '💼' });
  }
  if (typeof data.winRate === 'number') {
    kpis.push({ label: 'Win Rate', value: formatPercent(data.winRate), icon: '🏆' });
  }
  if (typeof data.winRateTrend === 'number') {
    kpis.push({ label: 'Win Rate Trend', value: `${data.winRateTrend > 0 ? '+' : ''}${formatPercent(data.winRateTrend)}`, icon: data.winRateTrend >= 0 ? '📈' : '📉' });
  }
  if (typeof data.averageDealSize === 'number') {
    kpis.push({ label: 'Avg Deal Size', value: formatCurrency(data.averageDealSize), icon: '💰' });
  }
  if (typeof data.averageSalesCycle === 'number') {
    kpis.push({ label: 'Avg Sales Cycle', value: `${data.averageSalesCycle}d`, icon: '⏱️' });
  }

  if (kpis.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi, index) => (
        <AnimatedTransition
          key={`james-kpi-${index}`}
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
 * LeadConversionSummaryCard sub-component.
 * Renders the lead conversion summary KPIs for James.
 *
 * @param {Object} props
 * @param {Object} props.data - The lead conversion data object
 * @returns {React.ReactElement|null} The lead conversion summary card
 */
function LeadConversionSummaryCard({ data }) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const kpis = [];

  if (typeof data.totalLeads === 'number') {
    kpis.push({ label: 'Total Leads', value: data.totalLeads, icon: '📋' });
  }
  if (typeof data.qualifiedLeads === 'number') {
    kpis.push({ label: 'Qualified', value: data.qualifiedLeads, icon: '✅' });
  }
  if (typeof data.convertedLeads === 'number') {
    kpis.push({ label: 'Converted', value: data.convertedLeads, icon: '🎯' });
  }
  if (typeof data.conversionRate === 'number') {
    kpis.push({ label: 'Conversion Rate', value: formatPercent(data.conversionRate), icon: '📊' });
  }
  if (typeof data.averageConversionTime === 'number') {
    kpis.push({ label: 'Avg Conversion', value: `${data.averageConversionTime}d`, icon: '⏱️' });
  }

  if (kpis.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {kpis.map((kpi, index) => (
        <AnimatedTransition
          key={`james-lead-kpi-${index}`}
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
 * TopOpportunitiesSection sub-component.
 * Renders top opportunities for James.
 *
 * @param {Object} props
 * @param {Object[]} props.opportunities - Array of opportunity objects
 * @returns {React.ReactElement|null} The top opportunities section
 */
function TopOpportunitiesSection({ opportunities }) {
  if (!Array.isArray(opportunities) || opportunities.length === 0) {
    return null;
  }

  const columns = useMemo(() => [
    {
      key: 'name',
      label: 'Opportunity',
      sortable: true,
      render: (value) => (
        <span className="text-sm font-medium text-primary-50">{value}</span>
      ),
    },
    {
      key: 'company',
      label: 'Company',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-primary-200">{typeof value === 'string' ? value : 'N/A'}</span>
      ),
    },
    {
      key: 'stage',
      label: 'Stage',
      sortable: true,
      render: (value) => (
        <span className={[
          'text-xs px-1.5 py-0.5 rounded-full capitalize',
          value === 'Final Review' ? 'bg-green-400 bg-opacity-15 text-green-400' :
            value === 'Negotiation' ? 'bg-amber-400 bg-opacity-15 text-amber-400' :
              'bg-glass-light text-primary-200',
        ].join(' ')}>
          {typeof value === 'string' ? value : 'N/A'}
        </span>
      ),
    },
    {
      key: 'value',
      label: 'Value',
      sortable: true,
      align: 'right',
      render: (value) => (
        <span className="text-sm font-semibold text-primary-100">
          {formatCurrency(typeof value === 'number' ? value : 0)}
        </span>
      ),
    },
    {
      key: 'probability',
      label: 'Probability',
      sortable: true,
      align: 'right',
      render: (value) => (
        <span className={[
          'text-sm font-medium',
          typeof value === 'number' && value >= 70 ? 'text-green-400' :
            typeof value === 'number' && value >= 50 ? 'text-amber-400' : 'text-primary-200',
        ].join(' ')}>
          {typeof value === 'number' ? `${value}%` : 'N/A'}
        </span>
      ),
    },
    {
      key: 'expectedClose',
      label: 'Expected Close',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-primary-200">
          {formatDate(typeof value === 'string' ? value : '')}
        </span>
      ),
    },
  ], []);

  return (
    <DataTable
      columns={columns}
      data={opportunities}
      rowKeyField="id"
      striped
      hoverable
      sortable
      defaultSortColumn="value"
      defaultSortDirection="desc"
      showHeader
      title="Top Opportunities"
      subtitle="Highest value deals in the pipeline"
      icon="💼"
      emptyMessage="No opportunities found."
      emptyIcon="📋"
      animated
    />
  );
}

/**
 * PipelineStagesSection sub-component.
 * Renders pipeline stages breakdown for James.
 *
 * @param {Object} props
 * @param {Object[]} props.stages - Array of pipeline stage objects
 * @returns {React.ReactElement|null} The pipeline stages section
 */
function PipelineStagesSection({ stages }) {
  if (!Array.isArray(stages) || stages.length === 0) {
    return null;
  }

  const maxValue = Math.max(...stages.map((s) => (typeof s.value === 'number' ? s.value : 0)), 1);

  return (
    <GlassCard variant="default" padding="md" animated>
      <div className="flex items-center gap-2 mb-4">
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-gold bg-opacity-20"
          aria-hidden="true"
        >
          📊
        </span>
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-primary-50 leading-tight">
            Pipeline by Stage
          </h3>
          <p className="text-xs text-primary-300 leading-tight">
            Deal count and value distribution
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {stages.map((stage, idx) => {
          const name = typeof stage.name === 'string' ? stage.name : `Stage ${idx + 1}`;
          const count = typeof stage.count === 'number' ? stage.count : 0;
          const value = typeof stage.value === 'number' ? stage.value : 0;
          const widthPct = Math.max(8, (value / maxValue) * 100);

          return (
            <AnimatedTransition
              key={`stage-${idx}`}
              show
              type="slide-up"
              duration="fast"
              delay={idx * 60}
            >
              <div className="px-3 py-2.5 rounded-glass-sm bg-glass-light border border-glass-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-primary-50">{name}</span>
                    <span className="text-xs text-primary-300">
                      {count} deal{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-primary-100">
                    {formatCurrency(value)}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-glass-light overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out bg-accent-gold"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            </AnimatedTransition>
          );
        })}
      </div>
    </GlassCard>
  );
}

/**
 * QuarterlyTrendSection sub-component.
 * Renders quarterly win/loss trend for James.
 *
 * @param {Object} props
 * @param {Object[]} props.trend - Array of quarterly trend objects
 * @returns {React.ReactElement|null} The quarterly trend section
 */
function QuarterlyTrendSection({ trend }) {
  if (!Array.isArray(trend) || trend.length === 0) {
    return null;
  }

  return (
    <GlassCard variant="default" padding="md" animated>
      <div className="flex items-center gap-2 mb-4">
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-blue bg-opacity-20"
          aria-hidden="true"
        >
          📈
        </span>
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-primary-50 leading-tight">
            Quarterly Win/Loss Trend
          </h3>
          <p className="text-xs text-primary-300 leading-tight">
            Deals won vs lost by quarter
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {trend.map((q, idx) => {
          const quarter = typeof q.quarter === 'string' ? q.quarter : `Q${idx + 1}`;
          const won = typeof q.won === 'number' ? q.won : 0;
          const lost = typeof q.lost === 'number' ? q.lost : 0;
          const value = typeof q.value === 'number' ? q.value : 0;
          const total = won + lost;
          const winPct = total > 0 ? Math.round((won / total) * 100) : 0;

          return (
            <AnimatedTransition
              key={`trend-${idx}`}
              show
              type="scale"
              duration="fast"
              delay={idx * 60}
            >
              <div className="glass-sm p-3">
                <p className="text-xs text-primary-300 mb-2 font-medium">{quarter}</p>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-400">Won: {won}</span>
                    <span className="text-xs text-red-400">Lost: {lost}</span>
                  </div>
                  <span className="text-xs text-primary-300">{winPct}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-glass-light overflow-hidden flex">
                  {total > 0 ? (
                    <>
                      <div
                        className="h-full bg-green-400 transition-all duration-700 ease-out"
                        style={{ width: `${winPct}%` }}
                      />
                      <div
                        className="h-full bg-red-400 transition-all duration-700 ease-out"
                        style={{ width: `${100 - winPct}%` }}
                      />
                    </>
                  ) : null}
                </div>
                <p className="text-sm font-semibold text-primary-100 mt-2">
                  {formatCurrency(value)}
                </p>
              </div>
            </AnimatedTransition>
          );
        })}
      </div>
    </GlassCard>
  );
}

/**
 * LeadsBySourceSection sub-component.
 * Renders leads by source breakdown for James.
 *
 * @param {Object} props
 * @param {Object[]} props.sources - Array of lead source objects
 * @returns {React.ReactElement|null} The leads by source section
 */
function LeadsBySourceSection({ sources }) {
  if (!Array.isArray(sources) || sources.length === 0) {
    return null;
  }

  return (
    <GlassCard variant="default" padding="md" animated>
      <div className="flex items-center gap-2 mb-4">
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-gold bg-opacity-20"
          aria-hidden="true"
        >
          🎯
        </span>
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-primary-50 leading-tight">
            Leads by Source
          </h3>
          <p className="text-xs text-primary-300 leading-tight">
            Lead count and conversion rate by source
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {sources.map((src, idx) => {
          const source = typeof src.source === 'string' ? src.source : `Source ${idx + 1}`;
          const count = typeof src.count === 'number' ? src.count : 0;
          const conversionRate = typeof src.conversionRate === 'number' ? src.conversionRate : 0;

          return (
            <AnimatedTransition
              key={`lead-source-${idx}`}
              show
              type="slide-up"
              duration="fast"
              delay={idx * 60}
            >
              <div className="flex items-center justify-between px-3 py-2.5 rounded-glass-sm bg-glass-light border border-glass-border">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm font-medium text-primary-50 truncate">{source}</span>
                  <span className="text-xs text-primary-300">{count} leads</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={[
                    'text-sm font-medium',
                    conversionRate >= 0.3 ? 'text-green-400' :
                      conversionRate >= 0.2 ? 'text-amber-400' : 'text-primary-200',
                  ].join(' ')}>
                    {formatPercent(conversionRate)}
                  </span>
                </div>
              </div>
            </AnimatedTransition>
          );
        })}
      </div>
    </GlassCard>
  );
}

/**
 * LeadsBySectorSection sub-component.
 * Renders leads by sector breakdown for James.
 *
 * @param {Object} props
 * @param {Object[]} props.sectors - Array of lead sector objects
 * @returns {React.ReactElement|null} The leads by sector section
 */
function LeadsBySectorSection({ sectors }) {
  if (!Array.isArray(sectors) || sectors.length === 0) {
    return null;
  }

  return (
    <GlassCard variant="default" padding="md" animated>
      <div className="flex items-center gap-2 mb-4">
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-purple bg-opacity-20"
          aria-hidden="true"
        >
          🏢
        </span>
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-primary-50 leading-tight">
            Leads by Sector
          </h3>
          <p className="text-xs text-primary-300 leading-tight">
            Lead count and conversion rate by industry sector
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {sectors.map((sec, idx) => {
          const sector = typeof sec.sector === 'string' ? sec.sector : `Sector ${idx + 1}`;
          const count = typeof sec.count === 'number' ? sec.count : 0;
          const conversionRate = typeof sec.conversionRate === 'number' ? sec.conversionRate : 0;

          return (
            <AnimatedTransition
              key={`lead-sector-${idx}`}
              show
              type="slide-up"
              duration="fast"
              delay={idx * 60}
            >
              <div className="flex items-center justify-between px-3 py-2.5 rounded-glass-sm bg-glass-light border border-glass-border">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm font-medium text-primary-50 truncate">{sector}</span>
                  <span className="text-xs text-primary-300">{count} leads</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={[
                    'text-sm font-medium',
                    conversionRate >= 0.25 ? 'text-green-400' :
                      conversionRate >= 0.18 ? 'text-amber-400' : 'text-primary-200',
                  ].join(' ')}>
                    {formatPercent(conversionRate)}
                  </span>
                </div>
              </div>
            </AnimatedTransition>
          );
        })}
      </div>
    </GlassCard>
  );
}

/**
 * JamesRiskSignalsSection sub-component.
 * Renders risk signals relevant to James's sales domain.
 *
 * @param {Object} props
 * @param {Object[]} props.signals - Array of risk signal objects
 * @param {function} [props.onActionClick] - Action click handler
 * @returns {React.ReactElement|null} The risk signals section
 */
function JamesRiskSignalsSection({ signals, onActionClick }) {
  if (!Array.isArray(signals) || signals.length === 0) {
    return null;
  }

  const relevantSignals = signals.filter((signal) => {
    if (!signal || typeof signal !== 'object') {
      return false;
    }
    if (Array.isArray(signal.affectedClusters)) {
      return signal.affectedClusters.some(
        (cid) => cid === INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id
      );
    }
    return false;
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
              Sales Risk Signals
            </h3>
            <p className="text-xs text-primary-300 leading-tight">
              Active risks affecting sales and business development
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
 * JamesActionsSection sub-component.
 * Renders suggested actions for James.
 *
 * @param {Object} props
 * @param {Object[]} props.actions - Array of action objects
 * @param {boolean} props.disabled - Whether actions are disabled
 * @param {function} props.onExecute - Execute callback
 * @param {function} props.onSuccess - Success callback
 * @param {function} props.onError - Error callback
 * @returns {React.ReactElement|null} The actions section
 */
function JamesActionsSection({ actions, disabled, onExecute, onSuccess, onError }) {
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
            Recommended actions for sales management
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action, index) => (
          <ActionButton
            key={action.id || `james-action-${index}`}
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
 * JamesFlowPage component.
 * Renders the James Carter (Business Development Manager / Sales Director) persona flow pages.
 * Implements sales pipeline queries, business development analysis, revenue forecasting,
 * and sales action execution screens with persona-specific data and CTA flows.
 *
 * @returns {React.ReactElement|null} The James flow page component, or null if not authenticated
 */
function JamesFlowPage() {
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

  const [activeTab, setActiveTab] = useState('pipeline');
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
      screenId: SCREEN_IDS.CLUSTER_SALES,
      screenName: 'James Flow - Sales & Business Development',
      persona,
    });
  }, [persona]);

  /**
   * Resolves the James persona profile
   */
  const jamesProfile = useMemo(() => {
    return getPersonaProfile(JAMES_PERSONA_ID);
  }, []);

  /**
   * Resolves pipeline data from mock data
   */
  const pipelineData = useMemo(() => {
    if (Array.isArray(SALES_PIPELINE_DATA) && SALES_PIPELINE_DATA.length > 0) {
      return SALES_PIPELINE_DATA[0];
    }
    return null;
  }, []);

  /**
   * Resolves lead conversion data from mock data
   */
  const leadConversionData = useMemo(() => {
    if (Array.isArray(SALES_PIPELINE_DATA) && SALES_PIPELINE_DATA.length > 1) {
      return SALES_PIPELINE_DATA[1];
    }
    return null;
  }, []);

  /**
   * Resolves the revenue forecast model
   */
  const revenueForecast = useMemo(() => {
    if (Array.isArray(FORECAST_MODELS)) {
      return FORECAST_MODELS.find((m) => m.type === 'revenue') || null;
    }
    return null;
  }, []);

  /**
   * Resolves top opportunities from pipeline data
   */
  const topOpportunities = useMemo(() => {
    if (pipelineData && pipelineData.data && Array.isArray(pipelineData.data.topOpportunities)) {
      return pipelineData.data.topOpportunities;
    }
    return [];
  }, [pipelineData]);

  /**
   * Resolves pipeline stages from pipeline data
   */
  const pipelineStages = useMemo(() => {
    if (pipelineData && pipelineData.data && Array.isArray(pipelineData.data.stages)) {
      return pipelineData.data.stages;
    }
    return [];
  }, [pipelineData]);

  /**
   * Resolves quarterly trend from pipeline data
   */
  const quarterlyTrend = useMemo(() => {
    if (pipelineData && pipelineData.data && Array.isArray(pipelineData.data.quarterlyTrend)) {
      return pipelineData.data.quarterlyTrend;
    }
    return [];
  }, [pipelineData]);

  /**
   * Resolves leads by source from lead conversion data
   */
  const leadsBySource = useMemo(() => {
    if (leadConversionData && leadConversionData.data && Array.isArray(leadConversionData.data.leadsBySource)) {
      return leadConversionData.data.leadsBySource;
    }
    return [];
  }, [leadConversionData]);

  /**
   * Resolves leads by sector from lead conversion data
   */
  const leadsBySector = useMemo(() => {
    if (leadConversionData && leadConversionData.data && Array.isArray(leadConversionData.data.leadsBySector)) {
      return leadConversionData.data.leadsBySector;
    }
    return [];
  }, [leadConversionData]);

  /**
   * Resolves all suggested actions from pipeline and lead conversion data
   */
  const allActions = useMemo(() => {
    const actions = [];
    if (pipelineData && Array.isArray(pipelineData.actions)) {
      for (const action of pipelineData.actions) {
        actions.push(action);
      }
    }
    if (leadConversionData && Array.isArray(leadConversionData.actions)) {
      for (const action of leadConversionData.actions) {
        if (!actions.some((a) => a.id === action.id)) {
          actions.push(action);
        }
      }
    }
    return actions;
  }, [pipelineData, leadConversionData]);

  /**
   * Resolves risk signals relevant to James
   */
  const jamesRiskSignals = useMemo(() => {
    if (!Array.isArray(RISK_SIGNALS)) {
      return [];
    }
    return RISK_SIGNALS.filter((signal) => {
      if (!signal || typeof signal !== 'object') {
        return false;
      }
      if (Array.isArray(signal.affectedClusters)) {
        return signal.affectedClusters.some(
          (cid) => cid === INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id
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
      action: 'JAMES_FLOW_QUERY_SUBMIT',
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
      action: 'JAMES_FLOW_ACTION_CLICK',
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
      action: 'JAMES_FLOW_RISK_ACTION_CLICK',
      actionId,
      signalId: signal ? signal.id : null,
      persona,
    });

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
      action: 'JAMES_FLOW_NEW_QUERY',
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
      action: 'JAMES_FLOW_CTA_CLICK',
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
      action: 'JAMES_FLOW_UNDO',
      executionId: result ? result.id : null,
      persona,
    });
  }, [persona]);

  /**
   * Handles proceed from ActionConfirmation
   */
  const handleProceed = useCallback(() => {
    logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {
      action: 'JAMES_FLOW_PROCEED',
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
        screenId: SCREEN_IDS.CLUSTER_SALES,
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
      action: 'JAMES_FLOW_ACTION_BUTTON_EXECUTE',
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
      action: 'JAMES_FLOW_ACTION_BUTTON_SUCCESS',
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
      action: 'JAMES_FLOW_ACTION_BUTTON_ERROR',
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
      action: 'JAMES_FLOW_TAB_CHANGE',
      tab,
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

  const accentColor = getJamesColor();

  /**
   * Tab definitions
   */
  const tabs = useMemo(() => [
    { id: 'pipeline', label: 'Pipeline', icon: '📈' },
    { id: 'leads', label: 'Lead Analysis', icon: '🎯' },
    { id: 'forecast', label: 'Forecasts', icon: '📊' },
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
                {jamesProfile ? jamesProfile.avatar : 'J'}
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-semibold text-primary-50 leading-tight">
                  Sales & Business Development Intelligence
                </h1>
                <p className="text-sm text-primary-200 mt-0.5">
                  {jamesProfile ? jamesProfile.name : 'James Carter'} · {jamesProfile ? jamesProfile.role : 'Business Development Manager'}
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

      {/* Pipeline Tab */}
      {activeTab === 'pipeline' ? (
        <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 2}>
          <div className="flex flex-col gap-6">
            {/* Pipeline Summary */}
            {pipelineData && pipelineData.data ? (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-gold bg-opacity-20"
                    aria-hidden="true"
                  >
                    📈
                  </span>
                  <h2 className="text-base font-semibold text-primary-50 leading-tight">
                    Pipeline Overview
                  </h2>
                </div>
                <PipelineSummaryCard data={pipelineData.data} />
              </div>
            ) : null}

            {/* Summary Text */}
            {pipelineData && typeof pipelineData.summary === 'string' ? (
              <GlassCard variant="default" padding="md" animated>
                <div className="flex items-start gap-3">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-gold bg-opacity-20"
                    aria-hidden="true"
                  >
                    🧠
                  </span>
                  <p className="text-sm text-primary-100 leading-relaxed">
                    {pipelineData.summary}
                  </p>
                </div>
              </GlassCard>
            ) : null}

            {/* Pipeline Stages */}
            <PipelineStagesSection stages={pipelineStages} />

            {/* Top Opportunities */}
            <TopOpportunitiesSection opportunities={topOpportunities} />

            {/* Quarterly Trend */}
            <QuarterlyTrendSection trend={quarterlyTrend} />

            {/* Actions */}
            <JamesActionsSection
              actions={allActions.filter((a) =>
                a.id === 'act-sp-001' || a.id === 'act-sp-002' || a.id === 'act-sp-003'
              )}
              disabled={actionExecuting}
              onExecute={handleActionExecute}
              onSuccess={handleActionSuccess}
              onError={handleActionError}
            />

            {/* CTA Bubbles */}
            <CTABubbles
              clusterId={INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id}
              onBubbleClick={handleBubbleClick}
              showHeader
            />
          </div>
        </AnimatedTransition>
      ) : null}

      {/* Lead Analysis Tab */}
      {activeTab === 'leads' ? (
        <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 2}>
          <div className="flex flex-col gap-6">
            {/* Lead Conversion Summary */}
            {leadConversionData && typeof leadConversionData.summary === 'string' ? (
              <GlassCard variant="default" padding="md" animated>
                <div className="flex items-start gap-3">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-gold bg-opacity-20"
                    aria-hidden="true"
                  >
                    🎯
                  </span>
                  <p className="text-sm text-primary-100 leading-relaxed">
                    {leadConversionData.summary}
                  </p>
                </div>
              </GlassCard>
            ) : null}

            {/* Lead KPIs */}
            {leadConversionData && leadConversionData.data ? (
              <LeadConversionSummaryCard data={leadConversionData.data} />
            ) : null}

            {/* Leads by Source */}
            <LeadsBySourceSection sources={leadsBySource} />

            {/* Leads by Sector */}
            <LeadsBySectorSection sectors={leadsBySector} />

            {/* Lead Actions */}
            <JamesActionsSection
              actions={allActions.filter((a) =>
                a.id === 'act-sp-004' || a.id === 'act-sp-005'
              )}
              disabled={actionExecuting}
              onExecute={handleActionExecute}
              onSuccess={handleActionSuccess}
              onError={handleActionError}
            />

            {/* CTA Bubbles */}
            <CTABubbles
              clusterId={INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id}
              onBubbleClick={handleBubbleClick}
              showHeader
            />
          </div>
        </AnimatedTransition>
      ) : null}

      {/* Forecasts Tab */}
      {activeTab === 'forecast' ? (
        <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 2}>
          <div className="flex flex-col gap-6">
            {/* Forecast Overview */}
            <GlassCard variant="default" padding="md" animated>
              <div className="flex items-start gap-3">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-gold bg-opacity-20"
                  aria-hidden="true"
                >
                  📊
                </span>
                <div className="flex flex-col">
                  <p className="text-sm text-primary-100 leading-relaxed">
                    Revenue and pipeline forecasts for the sales portfolio. Models are updated daily based on
                    deal progress, pipeline changes, and market conditions.
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Revenue Forecast */}
            {revenueForecast ? (
              <ForecastChart
                forecast={revenueForecast}
                showHeader
                showConfidence
                compact={false}
                animated
              />
            ) : null}

            {/* Quarterly Trend (repeated for forecast context) */}
            <QuarterlyTrendSection trend={quarterlyTrend} />

            {/* Pipeline Stages (repeated for forecast context) */}
            <PipelineStagesSection stages={pipelineStages} />

            {/* Forecast Actions */}
            <JamesActionsSection
              actions={allActions.filter((a) =>
                a.id === 'act-sp-002' || a.id === 'act-sp-003'
              )}
              disabled={actionExecuting}
              onExecute={handleActionExecute}
              onSuccess={handleActionSuccess}
              onError={handleActionError}
            />

            {/* CTA Bubbles */}
            <CTABubbles
              clusterId={INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id}
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
                    {jamesRiskSignals.length} risk signal{jamesRiskSignals.length !== 1 ? 's' : ''} detected
                    affecting sales and business development operations.
                    {jamesRiskSignals.filter((s) => s.severity === 'critical' || s.severity === 'high').length > 0
                      ? ` ${jamesRiskSignals.filter((s) => s.severity === 'critical' || s.severity === 'high').length} high-priority risk${jamesRiskSignals.filter((s) => s.severity === 'critical' || s.severity === 'high').length !== 1 ? 's' : ''} require immediate attention.`
                      : ' No critical risks at this time.'}
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Risk Signal Cards */}
            <JamesRiskSignalsSection
              signals={jamesRiskSignals}
              onActionClick={handleRiskActionClick}
            />

            {/* Pipeline-level risk signals */}
            {pipelineData && Array.isArray(pipelineData.riskSignals) && pipelineData.riskSignals.length > 0 ? (
              <GlassCard variant="default" padding="md" animated>
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-amber-400 bg-opacity-20"
                    aria-hidden="true"
                  >
                    ⚠️
                  </span>
                  <h3 className="text-sm font-semibold text-primary-50 leading-tight">
                    Pipeline Risk Signals
                  </h3>
                </div>
                <div className="flex flex-col gap-2">
                  {pipelineData.riskSignals.map((signal, index) => (
                    <AnimatedTransition
                      key={signal.id || `pipeline-risk-${index}`}
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

            {/* Lead conversion risk signals */}
            {leadConversionData && Array.isArray(leadConversionData.riskSignals) && leadConversionData.riskSignals.length > 0 ? (
              <GlassCard variant="default" padding="md" animated>
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-amber-400 bg-opacity-20"
                    aria-hidden="true"
                  >
                    📉
                  </span>
                  <h3 className="text-sm font-semibold text-primary-50 leading-tight">
                    Lead Conversion Risks
                  </h3>
                </div>
                <div className="flex flex-col gap-2">
                  {leadConversionData.riskSignals.map((signal, index) => (
                    <AnimatedTransition
                      key={signal.id || `lead-risk-${index}`}
                      show
                      type="slide-up"
                      duration="fast"
                      delay={index * 60}
                    >
                      <div
                        className={[
                          'flex items-start gap-3 px-4 py-3 rounded-glass-sm border',
                          'bg-amber-400 bg-opacity-10 border-amber-400 border-opacity-20',
                        ].join(' ')}
                      >
                        <span className="text-sm flex-shrink-0 mt-0.5" aria-hidden="true">🟡</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-400 bg-opacity-15 text-amber-400">
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
                placeholder="Ask about pipeline value, deals, leads, win rates, or competitive landscape..."
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
                  message="Querying CRM and sales systems..."
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
                clusterId={INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id}
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
            v{import.meta.env.VITE_APP_VERSION || '1.0.0'} · Sales & Business Development Intelligence
          </p>
        </div>
      </AnimatedTransition>
    </div>
  );
}

export default JamesFlowPage;