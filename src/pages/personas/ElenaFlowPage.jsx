/**
 * Elena Rossi (Senior QS / Commercial Manager) persona flow pages for Ask Dreeso Memory.
 * Screens 9-12: Implements commercial/procurement queries, cost analysis,
 * contract management, and procurement action execution screens with
 * persona-specific data and CTA flows.
 *
 * @module ElenaFlowPage
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
  PROCUREMENT_DATA,
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
 * Elena persona ID constant.
 * @type {string}
 */
const ELENA_PERSONA_ID = PERSONAS.ELENA.id;

/**
 * Resolves the accent color for Elena.
 * @returns {string} The accent color hex string
 */
function getElenaColor() {
  return PERSONAS.ELENA.color || '#8B5CF6';
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
 * CommercialSummaryCard sub-component.
 * Renders the commercial/procurement summary KPIs for Elena.
 *
 * @param {Object} props
 * @param {Object} props.data - The commercial data object
 * @returns {React.ReactElement|null} The commercial summary card
 */
function CommercialSummaryCard({ data }) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const kpis = [];

  if (typeof data.totalContracts === 'number') {
    kpis.push({ label: 'Total Contracts', value: data.totalContracts, icon: '📋' });
  }
  if (typeof data.totalValue === 'number') {
    kpis.push({ label: 'Total Value', value: formatCurrency(data.totalValue), icon: '💰' });
  }
  if (typeof data.activeContracts === 'number') {
    kpis.push({ label: 'Active', value: data.activeContracts, icon: '✅' });
  }
  if (typeof data.pendingRenewal === 'number') {
    kpis.push({ label: 'Pending Renewal', value: data.pendingRenewal, icon: '🔄' });
  }
  if (typeof data.expiringSoon === 'number') {
    kpis.push({ label: 'Expiring Soon', value: data.expiringSoon, icon: '⏰' });
  }
  if (typeof data.disputesOpen === 'number') {
    kpis.push({ label: 'Disputes Open', value: data.disputesOpen, icon: '⚠️' });
  }

  if (kpis.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi, index) => (
        <AnimatedTransition
          key={`elena-kpi-${index}`}
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
 * SpendSummaryCard sub-component.
 * Renders the procurement spend summary KPIs for Elena.
 *
 * @param {Object} props
 * @param {Object} props.data - The spend data object
 * @returns {React.ReactElement|null} The spend summary card
 */
function SpendSummaryCard({ data }) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const kpis = [];

  if (typeof data.ytdSpend === 'number') {
    kpis.push({ label: 'YTD Spend', value: formatCurrency(data.ytdSpend), icon: '💳' });
  }
  if (typeof data.budget === 'number') {
    kpis.push({ label: 'Budget', value: formatCurrency(data.budget), icon: '💰' });
  }
  if (typeof data.utilizationPercent === 'number') {
    kpis.push({ label: 'Utilization', value: `${data.utilizationPercent}%`, icon: '📊' });
  }
  if (typeof data.savingsAchieved === 'number') {
    kpis.push({ label: 'Savings', value: formatCurrency(data.savingsAchieved), icon: '✅' });
  }
  if (typeof data.costEscalation === 'number') {
    kpis.push({ label: 'Cost Escalation', value: formatPercent(data.costEscalation), icon: '📈' });
  }

  if (kpis.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {kpis.map((kpi, index) => (
        <AnimatedTransition
          key={`elena-spend-kpi-${index}`}
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
 * PendingRenewalsSection sub-component.
 * Renders pending contract renewals for Elena.
 *
 * @param {Object} props
 * @param {Object[]} props.renewals - Array of pending renewal objects
 * @returns {React.ReactElement|null} The pending renewals section
 */
function PendingRenewalsSection({ renewals }) {
  if (!Array.isArray(renewals) || renewals.length === 0) {
    return null;
  }

  const columns = useMemo(() => [
    {
      key: 'name',
      label: 'Contract',
      sortable: true,
      render: (value) => (
        <span className="text-sm font-medium text-primary-50">{value}</span>
      ),
    },
    {
      key: 'vendor',
      label: 'Vendor',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-primary-200">{typeof value === 'string' ? value : 'N/A'}</span>
      ),
    },
    {
      key: 'value',
      label: 'Value',
      sortable: true,
      align: 'right',
      render: (value) => (
        <span className="text-sm text-primary-100">
          {formatCurrency(typeof value === 'number' ? value : 0)}
        </span>
      ),
    },
    {
      key: 'daysUntilExpiry',
      label: 'Days Left',
      sortable: true,
      align: 'right',
      render: (value) => (
        <span className={[
          'text-sm font-medium',
          typeof value === 'number' && value <= 45 ? 'text-red-400' :
            typeof value === 'number' && value <= 60 ? 'text-amber-400' : 'text-primary-100',
        ].join(' ')}>
          {typeof value === 'number' ? `${value}d` : 'N/A'}
        </span>
      ),
    },
    {
      key: 'performanceRating',
      label: 'Rating',
      sortable: true,
      align: 'right',
      render: (value) => (
        <span className="text-sm text-primary-100">
          {typeof value === 'number' ? `${value.toFixed(1)}/5` : 'N/A'}
        </span>
      ),
    },
    {
      key: 'recommendation',
      label: 'Action',
      sortable: true,
      render: (value) => (
        <span
          className={[
            'text-xs px-1.5 py-0.5 rounded-full capitalize',
            value === 'renew' ? 'bg-green-400 bg-opacity-15 text-green-400' :
              'bg-amber-400 bg-opacity-15 text-amber-400',
          ].join(' ')}
        >
          {typeof value === 'string' ? value : 'review'}
        </span>
      ),
    },
  ], []);

  return (
    <DataTable
      columns={columns}
      data={renewals}
      rowKeyField="id"
      striped
      hoverable
      sortable
      defaultSortColumn="daysUntilExpiry"
      defaultSortDirection="asc"
      showHeader
      title="Pending Contract Renewals"
      subtitle="Contracts expiring within 60 days"
      icon="🔄"
      emptyMessage="No pending renewals."
      emptyIcon="📋"
      animated
    />
  );
}

/**
 * VendorIssuesSection sub-component.
 * Renders vendor performance issues for Elena.
 *
 * @param {Object} props
 * @param {Object[]} props.issues - Array of vendor issue objects
 * @returns {React.ReactElement|null} The vendor issues section
 */
function VendorIssuesSection({ issues }) {
  if (!Array.isArray(issues) || issues.length === 0) {
    return null;
  }

  return (
    <GlassCard variant="default" padding="md" animated>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-orange-400 bg-opacity-20"
            aria-hidden="true"
          >
            ⚠️
          </span>
          <h3 className="text-sm font-semibold text-primary-50 leading-tight">
            Vendor Performance Issues
          </h3>
        </div>
        <span className="text-xs text-orange-400 font-medium">
          {issues.length} issue{issues.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {issues.map((issue, idx) => (
          <AnimatedTransition
            key={issue.vendorId || `vendor-issue-${idx}`}
            show
            type="slide-up"
            duration="fast"
            delay={idx * 60}
          >
            <div
              className={[
                'flex items-start gap-3 px-4 py-3 rounded-glass-sm border',
                issue.severity === 'high'
                  ? 'bg-orange-400 bg-opacity-10 border-orange-400 border-opacity-20'
                  : 'bg-amber-400 bg-opacity-10 border-amber-400 border-opacity-20',
              ].join(' ')}
            >
              <span className="text-sm flex-shrink-0 mt-0.5" aria-hidden="true">
                {issue.severity === 'high' ? '🟠' : '🟡'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-primary-50">
                    {typeof issue.vendorName === 'string' ? issue.vendorName : 'Vendor'}
                  </span>
                  <span
                    className={[
                      'text-xs font-semibold uppercase px-2 py-0.5 rounded-full',
                      issue.severity === 'high'
                        ? 'bg-orange-400 bg-opacity-15 text-orange-400'
                        : 'bg-amber-400 bg-opacity-15 text-amber-400',
                    ].join(' ')}
                  >
                    {typeof issue.severity === 'string' ? issue.severity : 'medium'}
                  </span>
                </div>
                <p className="text-sm text-primary-100 leading-relaxed">
                  {typeof issue.issue === 'string' ? issue.issue : ''}
                </p>
                {typeof issue.impactedProject === 'string' ? (
                  <p className="text-xs text-primary-300 mt-1">
                    Impacted: {issue.impactedProject}
                  </p>
                ) : null}
              </div>
            </div>
          </AnimatedTransition>
        ))}
      </div>
    </GlassCard>
  );
}

/**
 * SpendByCategorySection sub-component.
 * Renders spend by category breakdown for Elena.
 *
 * @param {Object} props
 * @param {Object[]} props.categories - Array of spend category objects
 * @returns {React.ReactElement|null} The spend by category section
 */
function SpendByCategorySection({ categories }) {
  if (!Array.isArray(categories) || categories.length === 0) {
    return null;
  }

  return (
    <GlassCard variant="default" padding="md" animated>
      <div className="flex items-center gap-2 mb-4">
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-purple bg-opacity-20"
          aria-hidden="true"
        >
          💳
        </span>
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-primary-50 leading-tight">
            Spend by Category
          </h3>
          <p className="text-xs text-primary-300 leading-tight">
            Budget vs actual spend breakdown
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {categories.map((cat, idx) => {
          const category = typeof cat.category === 'string' ? cat.category : `Category ${idx + 1}`;
          const spend = typeof cat.spend === 'number' ? cat.spend : 0;
          const budget = typeof cat.budget === 'number' ? cat.budget : 0;
          const variance = typeof cat.variance === 'number' ? cat.variance : 0;
          const utilizationPct = budget > 0 ? Math.min((spend / budget) * 100, 100) : 0;

          return (
            <AnimatedTransition
              key={`spend-cat-${idx}`}
              show
              type="slide-up"
              duration="fast"
              delay={idx * 60}
            >
              <div className="px-3 py-2.5 rounded-glass-sm bg-glass-light border border-glass-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-primary-50">{category}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-primary-300">
                      {formatCurrency(spend)} / {formatCurrency(budget)}
                    </span>
                    <span
                      className={[
                        'text-xs font-medium',
                        variance >= 0 ? 'text-green-400' : 'text-red-400',
                      ].join(' ')}
                    >
                      {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-glass-light overflow-hidden">
                  <div
                    className={[
                      'h-full rounded-full transition-all duration-700 ease-out',
                      variance < 0 ? 'bg-red-400' : utilizationPct > 85 ? 'bg-amber-400' : 'bg-green-400',
                    ].join(' ')}
                    style={{ width: `${utilizationPct}%` }}
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
 * ContractsByTypeSection sub-component.
 * Renders contracts by type breakdown for Elena.
 *
 * @param {Object} props
 * @param {Object[]} props.types - Array of contract type objects
 * @returns {React.ReactElement|null} The contracts by type section
 */
function ContractsByTypeSection({ types }) {
  if (!Array.isArray(types) || types.length === 0) {
    return null;
  }

  return (
    <GlassCard variant="default" padding="md" animated>
      <div className="flex items-center gap-2 mb-4">
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-blue bg-opacity-20"
          aria-hidden="true"
        >
          📋
        </span>
        <h3 className="text-sm font-semibold text-primary-50 leading-tight">
          Contracts by Type
        </h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {types.map((type, idx) => (
          <AnimatedTransition
            key={`contract-type-${idx}`}
            show
            type="scale"
            duration="fast"
            delay={idx * 60}
          >
            <div className="glass-sm p-3 flex flex-col items-center text-center">
              <span className="text-lg font-bold text-primary-50">
                {typeof type.count === 'number' ? type.count : 0}
              </span>
              <span className="text-xs text-primary-300 mt-0.5">
                {typeof type.type === 'string' ? type.type : 'Type'}
              </span>
              <span className="text-xs text-primary-200 mt-1">
                {formatCurrency(typeof type.value === 'number' ? type.value : 0)}
              </span>
            </div>
          </AnimatedTransition>
        ))}
      </div>
    </GlassCard>
  );
}

/**
 * ElenaRiskSignalsSection sub-component.
 * Renders risk signals relevant to Elena's commercial/procurement domain.
 *
 * @param {Object} props
 * @param {Object[]} props.signals - Array of risk signal objects
 * @param {function} [props.onActionClick] - Action click handler
 * @returns {React.ReactElement|null} The risk signals section
 */
function ElenaRiskSignalsSection({ signals, onActionClick }) {
  if (!Array.isArray(signals) || signals.length === 0) {
    return null;
  }

  const relevantSignals = signals.filter((signal) => {
    if (!signal || typeof signal !== 'object') {
      return false;
    }
    if (Array.isArray(signal.affectedClusters)) {
      return signal.affectedClusters.some(
        (cid) => cid === INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id
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
              Commercial Risk Signals
            </h3>
            <p className="text-xs text-primary-300 leading-tight">
              Active risks affecting procurement and contracts
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
 * ElenaActionsSection sub-component.
 * Renders suggested actions for Elena.
 *
 * @param {Object} props
 * @param {Object[]} props.actions - Array of action objects
 * @param {boolean} props.disabled - Whether actions are disabled
 * @param {function} props.onExecute - Execute callback
 * @param {function} props.onSuccess - Success callback
 * @param {function} props.onError - Error callback
 * @returns {React.ReactElement|null} The actions section
 */
function ElenaActionsSection({ actions, disabled, onExecute, onSuccess, onError }) {
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
            Recommended actions for commercial management
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action, index) => (
          <ActionButton
            key={action.id || `elena-action-${index}`}
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
 * PriceIndexSection sub-component.
 * Renders material price index trends for Elena.
 *
 * @param {Object} props
 * @param {Object[]} props.trends - Array of price index trend objects
 * @returns {React.ReactElement|null} The price index section
 */
function PriceIndexSection({ trends }) {
  if (!Array.isArray(trends) || trends.length === 0) {
    return null;
  }

  return (
    <GlassCard variant="default" padding="md" animated>
      <div className="flex items-center gap-2 mb-4">
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-amber-400 bg-opacity-20"
          aria-hidden="true"
        >
          📈
        </span>
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-primary-50 leading-tight">
            Material Price Index Trend
          </h3>
          <p className="text-xs text-primary-300 leading-tight">
            Monthly price index tracking (base = 100)
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-glass-border">
              <th className="text-left py-2 px-3 text-xs font-semibold text-primary-300 uppercase tracking-wider">Month</th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-primary-300 uppercase tracking-wider">Steel</th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-primary-300 uppercase tracking-wider">Concrete</th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-primary-300 uppercase tracking-wider">Labor</th>
            </tr>
          </thead>
          <tbody>
            {trends.map((row, idx) => (
              <tr
                key={`price-idx-${idx}`}
                className="border-b border-glass-border hover:bg-glass-light transition-colors duration-200"
              >
                <td className="py-2 px-3 text-primary-200">
                  {typeof row.month === 'string' ? row.month : `Month ${idx + 1}`}
                </td>
                <td className={[
                  'py-2 px-3 text-right font-medium',
                  typeof row.steelIndex === 'number' && row.steelIndex > 105 ? 'text-red-400' : 'text-primary-100',
                ].join(' ')}>
                  {typeof row.steelIndex === 'number' ? row.steelIndex : 'N/A'}
                </td>
                <td className={[
                  'py-2 px-3 text-right font-medium',
                  typeof row.concreteIndex === 'number' && row.concreteIndex > 105 ? 'text-amber-400' : 'text-primary-100',
                ].join(' ')}>
                  {typeof row.concreteIndex === 'number' ? row.concreteIndex : 'N/A'}
                </td>
                <td className={[
                  'py-2 px-3 text-right font-medium',
                  typeof row.laborIndex === 'number' && row.laborIndex > 105 ? 'text-amber-400' : 'text-primary-100',
                ].join(' ')}>
                  {typeof row.laborIndex === 'number' ? row.laborIndex : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

/**
 * ElenaFlowPage component.
 * Renders the Elena Rossi (Senior QS / Commercial Manager) persona flow pages.
 * Implements commercial/procurement queries, cost analysis, contract management,
 * and procurement action execution screens with persona-specific data and CTA flows.
 *
 * @returns {React.ReactElement|null} The Elena flow page component, or null if not authenticated
 */
function ElenaFlowPage() {
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

  const [activeTab, setActiveTab] = useState('contracts');
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
      screenId: SCREEN_IDS.CLUSTER_COMMERCIAL,
      screenName: 'Elena Flow - Commercial & Procurement',
      persona,
    });
  }, [persona]);

  /**
   * Resolves the Elena persona profile
   */
  const elenaProfile = useMemo(() => {
    return getPersonaProfile(ELENA_PERSONA_ID);
  }, []);

  /**
   * Resolves contract data from mock data
   */
  const contractData = useMemo(() => {
    if (Array.isArray(PROCUREMENT_DATA) && PROCUREMENT_DATA.length > 0) {
      return PROCUREMENT_DATA[0];
    }
    return null;
  }, []);

  /**
   * Resolves spend data from mock data
   */
  const spendData = useMemo(() => {
    if (Array.isArray(PROCUREMENT_DATA) && PROCUREMENT_DATA.length > 1) {
      return PROCUREMENT_DATA[1];
    }
    return null;
  }, []);

  /**
   * Resolves the procurement forecast model
   */
  const procurementForecast = useMemo(() => {
    if (Array.isArray(FORECAST_MODELS)) {
      return FORECAST_MODELS.find((m) => m.type === 'procurement') || null;
    }
    return null;
  }, []);

  /**
   * Resolves pending renewals from contract data
   */
  const pendingRenewals = useMemo(() => {
    if (contractData && contractData.data && Array.isArray(contractData.data.pendingRenewals)) {
      return contractData.data.pendingRenewals;
    }
    return [];
  }, [contractData]);

  /**
   * Resolves vendor issues from contract data
   */
  const vendorIssues = useMemo(() => {
    if (contractData && contractData.data && Array.isArray(contractData.data.vendorIssues)) {
      return contractData.data.vendorIssues;
    }
    return [];
  }, [contractData]);

  /**
   * Resolves contracts by type from contract data
   */
  const contractsByType = useMemo(() => {
    if (contractData && contractData.data && Array.isArray(contractData.data.contractsByType)) {
      return contractData.data.contractsByType;
    }
    return [];
  }, [contractData]);

  /**
   * Resolves spend by category from spend data
   */
  const spendByCategory = useMemo(() => {
    if (spendData && spendData.data && Array.isArray(spendData.data.spendByCategory)) {
      return spendData.data.spendByCategory;
    }
    return [];
  }, [spendData]);

  /**
   * Resolves price index trend from spend data
   */
  const priceIndexTrend = useMemo(() => {
    if (spendData && spendData.data && Array.isArray(spendData.data.priceIndexTrend)) {
      return spendData.data.priceIndexTrend;
    }
    return [];
  }, [spendData]);

  /**
   * Resolves all suggested actions from contract and spend data
   */
  const allActions = useMemo(() => {
    const actions = [];
    if (contractData && Array.isArray(contractData.actions)) {
      for (const action of contractData.actions) {
        actions.push(action);
      }
    }
    if (spendData && Array.isArray(spendData.actions)) {
      for (const action of spendData.actions) {
        if (!actions.some((a) => a.id === action.id)) {
          actions.push(action);
        }
      }
    }
    return actions;
  }, [contractData, spendData]);

  /**
   * Resolves risk signals relevant to Elena
   */
  const elenaRiskSignals = useMemo(() => {
    if (!Array.isArray(RISK_SIGNALS)) {
      return [];
    }
    return RISK_SIGNALS.filter((signal) => {
      if (!signal || typeof signal !== 'object') {
        return false;
      }
      if (Array.isArray(signal.affectedClusters)) {
        return signal.affectedClusters.some(
          (cid) => cid === INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id
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
      action: 'ELENA_FLOW_QUERY_SUBMIT',
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
      action: 'ELENA_FLOW_ACTION_CLICK',
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
      action: 'ELENA_FLOW_RISK_ACTION_CLICK',
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
      action: 'ELENA_FLOW_NEW_QUERY',
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
      action: 'ELENA_FLOW_CTA_CLICK',
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
      action: 'ELENA_FLOW_UNDO',
      executionId: result ? result.id : null,
      persona,
    });
  }, [persona]);

  /**
   * Handles proceed from ActionConfirmation
   */
  const handleProceed = useCallback(() => {
    logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {
      action: 'ELENA_FLOW_PROCEED',
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
        screenId: SCREEN_IDS.CLUSTER_COMMERCIAL,
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
      action: 'ELENA_FLOW_ACTION_BUTTON_EXECUTE',
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
      action: 'ELENA_FLOW_ACTION_BUTTON_SUCCESS',
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
      action: 'ELENA_FLOW_ACTION_BUTTON_ERROR',
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
      action: 'ELENA_FLOW_TAB_CHANGE',
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

  const accentColor = getElenaColor();

  /**
   * Tab definitions
   */
  const tabs = useMemo(() => [
    { id: 'contracts', label: 'Contracts', icon: '📋' },
    { id: 'spend', label: 'Spend Analysis', icon: '💳' },
    { id: 'vendors', label: 'Vendors', icon: '🤝' },
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
                {elenaProfile ? elenaProfile.avatar : 'E'}
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-semibold text-primary-50 leading-tight">
                  Commercial & Procurement Intelligence
                </h1>
                <p className="text-sm text-primary-200 mt-0.5">
                  {elenaProfile ? elenaProfile.name : 'Elena Rossi'} · {elenaProfile ? elenaProfile.role : 'Commercial Manager'}
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

      {/* Contracts Tab */}
      {activeTab === 'contracts' ? (
        <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 2}>
          <div className="flex flex-col gap-6">
            {/* Contract Summary */}
            {contractData && contractData.data ? (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-purple bg-opacity-20"
                    aria-hidden="true"
                  >
                    📋
                  </span>
                  <h2 className="text-base font-semibold text-primary-50 leading-tight">
                    Contract Overview
                  </h2>
                </div>
                <CommercialSummaryCard data={contractData.data} />
              </div>
            ) : null}

            {/* Summary Text */}
            {contractData && typeof contractData.summary === 'string' ? (
              <GlassCard variant="default" padding="md" animated>
                <div className="flex items-start gap-3">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-purple bg-opacity-20"
                    aria-hidden="true"
                  >
                    🧠
                  </span>
                  <p className="text-sm text-primary-100 leading-relaxed">
                    {contractData.summary}
                  </p>
                </div>
              </GlassCard>
            ) : null}

            {/* Contracts by Type */}
            <ContractsByTypeSection types={contractsByType} />

            {/* Pending Renewals */}
            <PendingRenewalsSection renewals={pendingRenewals} />

            {/* Actions */}
            <ElenaActionsSection
              actions={allActions.filter((a) =>
                a.id === 'act-cm-001' || a.id === 'act-cm-002' || a.id === 'act-cm-003'
              )}
              disabled={actionExecuting}
              onExecute={handleActionExecute}
              onSuccess={handleActionSuccess}
              onError={handleActionError}
            />

            {/* CTA Bubbles */}
            <CTABubbles
              clusterId={INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id}
              onBubbleClick={handleBubbleClick}
              showHeader
            />
          </div>
        </AnimatedTransition>
      ) : null}

      {/* Spend Analysis Tab */}
      {activeTab === 'spend' ? (
        <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 2}>
          <div className="flex flex-col gap-6">
            {/* Spend Summary */}
            {spendData && typeof spendData.summary === 'string' ? (
              <GlassCard variant="default" padding="md" animated>
                <div className="flex items-start gap-3">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-purple bg-opacity-20"
                    aria-hidden="true"
                  >
                    💳
                  </span>
                  <p className="text-sm text-primary-100 leading-relaxed">
                    {spendData.summary}
                  </p>
                </div>
              </GlassCard>
            ) : null}

            {/* Spend KPIs */}
            {spendData && spendData.data ? (
              <SpendSummaryCard data={spendData.data} />
            ) : null}

            {/* Spend by Category */}
            <SpendByCategorySection categories={spendByCategory} />

            {/* Price Index Trend */}
            <PriceIndexSection trends={priceIndexTrend} />

            {/* Procurement Forecast */}
            {procurementForecast ? (
              <ForecastChart
                forecast={procurementForecast}
                showHeader
                showConfidence
                compact={false}
                animated
              />
            ) : null}

            {/* Spend Actions */}
            <ElenaActionsSection
              actions={allActions.filter((a) =>
                a.id === 'act-cm-004' || a.id === 'act-cm-005'
              )}
              disabled={actionExecuting}
              onExecute={handleActionExecute}
              onSuccess={handleActionSuccess}
              onError={handleActionError}
            />
          </div>
        </AnimatedTransition>
      ) : null}

      {/* Vendors Tab */}
      {activeTab === 'vendors' ? (
        <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 2}>
          <div className="flex flex-col gap-6">
            {/* Vendor Overview */}
            <GlassCard variant="default" padding="md" animated>
              <div className="flex items-start gap-3">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-purple bg-opacity-20"
                  aria-hidden="true"
                >
                  🤝
                </span>
                <div className="flex flex-col">
                  <p className="text-sm text-primary-100 leading-relaxed">
                    {vendorIssues.length} vendor performance issue{vendorIssues.length !== 1 ? 's' : ''} flagged
                    requiring attention. {pendingRenewals.length} contract{pendingRenewals.length !== 1 ? 's' : ''} pending
                    renewal with associated vendors.
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Vendor Issues */}
            <VendorIssuesSection issues={vendorIssues} />

            {/* Pending Renewals (vendor perspective) */}
            {pendingRenewals.length > 0 ? (
              <GlassCard variant="default" padding="md" animated>
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-blue bg-opacity-20"
                    aria-hidden="true"
                  >
                    🔄
                  </span>
                  <h3 className="text-sm font-semibold text-primary-50 leading-tight">
                    Vendor Renewal Status
                  </h3>
                </div>
                <div className="flex flex-col gap-2">
                  {pendingRenewals.map((renewal, idx) => (
                    <AnimatedTransition
                      key={renewal.id || `vendor-renewal-${idx}`}
                      show
                      type="slide-up"
                      duration="fast"
                      delay={idx * 60}
                    >
                      <div className="flex items-center justify-between px-3 py-2.5 rounded-glass-sm bg-glass-light border border-glass-border">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary-50 truncate">
                            {typeof renewal.vendor === 'string' ? renewal.vendor : 'Vendor'}
                          </p>
                          <p className="text-xs text-primary-300">
                            {typeof renewal.name === 'string' ? renewal.name : 'Contract'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                          <span className="text-sm font-medium text-primary-100">
                            {formatCurrency(typeof renewal.value === 'number' ? renewal.value : 0)}
                          </span>
                          <span className="text-xs text-primary-300">
                            Rating: {typeof renewal.performanceRating === 'number' ? `${renewal.performanceRating.toFixed(1)}/5` : 'N/A'}
                          </span>
                          <span
                            className={[
                              'text-xs px-1.5 py-0.5 rounded-full capitalize',
                              renewal.recommendation === 'renew'
                                ? 'bg-green-400 bg-opacity-15 text-green-400'
                                : 'bg-amber-400 bg-opacity-15 text-amber-400',
                            ].join(' ')}
                          >
                            {typeof renewal.recommendation === 'string' ? renewal.recommendation : 'review'}
                          </span>
                        </div>
                      </div>
                    </AnimatedTransition>
                  ))}
                </div>
              </GlassCard>
            ) : null}

            {/* Vendor Actions */}
            <ElenaActionsSection
              actions={allActions.filter((a) =>
                a.id === 'act-cm-001' || a.id === 'act-cm-002'
              )}
              disabled={actionExecuting}
              onExecute={handleActionExecute}
              onSuccess={handleActionSuccess}
              onError={handleActionError}
            />

            {/* CTA Bubbles */}
            <CTABubbles
              clusterId={INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id}
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
                    {elenaRiskSignals.length} risk signal{elenaRiskSignals.length !== 1 ? 's' : ''} detected
                    affecting commercial and procurement operations.
                    {elenaRiskSignals.filter((s) => s.severity === 'critical' || s.severity === 'high').length > 0
                      ? ` ${elenaRiskSignals.filter((s) => s.severity === 'critical' || s.severity === 'high').length} high-priority risk${elenaRiskSignals.filter((s) => s.severity === 'critical' || s.severity === 'high').length !== 1 ? 's' : ''} require immediate attention.`
                      : ' No critical risks at this time.'}
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Risk Signal Cards */}
            <ElenaRiskSignalsSection
              signals={elenaRiskSignals}
              onActionClick={handleRiskActionClick}
            />

            {/* Contract-level risk signals */}
            {contractData && Array.isArray(contractData.riskSignals) && contractData.riskSignals.length > 0 ? (
              <GlassCard variant="default" padding="md" animated>
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-amber-400 bg-opacity-20"
                    aria-hidden="true"
                  >
                    ⚠️
                  </span>
                  <h3 className="text-sm font-semibold text-primary-50 leading-tight">
                    Contract-Level Risk Signals
                  </h3>
                </div>
                <div className="flex flex-col gap-2">
                  {contractData.riskSignals.map((signal, index) => (
                    <AnimatedTransition
                      key={signal.id || `contract-risk-${index}`}
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

            {/* Spend-level risk signals */}
            {spendData && Array.isArray(spendData.riskSignals) && spendData.riskSignals.length > 0 ? (
              <GlassCard variant="default" padding="md" animated>
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-amber-400 bg-opacity-20"
                    aria-hidden="true"
                  >
                    📈
                  </span>
                  <h3 className="text-sm font-semibold text-primary-50 leading-tight">
                    Cost Escalation Risks
                  </h3>
                </div>
                <div className="flex flex-col gap-2">
                  {spendData.riskSignals.map((signal, index) => (
                    <AnimatedTransition
                      key={signal.id || `spend-risk-${index}`}
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
                placeholder="Ask about contracts, procurement spend, vendors, or material costs..."
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
                  message="Querying procurement and commercial systems..."
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
                clusterId={INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id}
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
            v{import.meta.env.VITE_APP_VERSION || '1.0.0'} · Commercial & Procurement Intelligence
          </p>
        </div>
      </AnimatedTransition>
    </div>
  );
}

export default ElenaFlowPage;