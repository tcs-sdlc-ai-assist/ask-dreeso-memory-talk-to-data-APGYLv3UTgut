/**
 * Sophie Dubois (Finance Lead / Project Manager) persona flow pages for Ask Dreeso Memory.
 * Screens 13-16: Implements finance/cash flow queries, budget variance analysis,
 * revenue forecasting, and financial action execution screens with
 * persona-specific data and CTA flows.
 *
 * @module SophieFlowPage
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
  FINANCE_CASH_FLOW_DATA,
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
 * Sophie persona ID constant.
 * @type {string}
 */
const SOPHIE_PERSONA_ID = PERSONAS.SOPHIE.id;

/**
 * Resolves the accent color for Sophie.
 * @returns {string} The accent color hex string
 */
function getSophieColor() {
  return PERSONAS.SOPHIE.color || '#EC4899';
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
 * CashFlowSummaryCard sub-component.
 * Renders the cash flow summary KPIs for Sophie.
 *
 * @param {Object} props
 * @param {Object} props.data - The cash flow data object
 * @returns {React.ReactElement|null} The cash flow summary card
 */
function CashFlowSummaryCard({ data }) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const kpis = [];

  if (typeof data.currentCashPosition === 'number') {
    kpis.push({ label: 'Cash Position', value: formatCurrency(data.currentCashPosition), icon: '💰' });
  }
  if (typeof data.projectedQ1Position === 'number') {
    kpis.push({ label: 'Q1 Projected', value: formatCurrency(data.projectedQ1Position), icon: '📊' });
  }
  if (typeof data.projectedInflows === 'number') {
    kpis.push({ label: 'Inflows', value: formatCurrency(data.projectedInflows), icon: '📈' });
  }
  if (typeof data.projectedOutflows === 'number') {
    kpis.push({ label: 'Outflows', value: formatCurrency(data.projectedOutflows), icon: '📉' });
  }
  if (typeof data.netCashFlow === 'number') {
    kpis.push({ label: 'Net Cash Flow', value: formatCurrency(data.netCashFlow), icon: data.netCashFlow >= 0 ? '✅' : '⚠️' });
  }

  if (kpis.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {kpis.map((kpi, index) => (
        <AnimatedTransition
          key={`sophie-kpi-${index}`}
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
 * BudgetVarianceSummaryCard sub-component.
 * Renders the budget variance summary KPIs for Sophie.
 *
 * @param {Object} props
 * @param {Object} props.data - The budget variance data object
 * @returns {React.ReactElement|null} The budget variance summary card
 */
function BudgetVarianceSummaryCard({ data }) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const kpis = [];

  if (typeof data.totalBudget === 'number') {
    kpis.push({ label: 'Total Budget', value: formatCurrency(data.totalBudget), icon: '💰' });
  }
  if (typeof data.totalActual === 'number') {
    kpis.push({ label: 'Total Actual', value: formatCurrency(data.totalActual), icon: '💳' });
  }
  if (typeof data.totalVariance === 'number') {
    kpis.push({ label: 'Variance', value: formatCurrency(data.totalVariance), icon: data.totalVariance >= 0 ? '✅' : '🔴' });
  }
  if (typeof data.variancePercent === 'number') {
    kpis.push({ label: 'Variance %', value: `${data.variancePercent}%`, icon: data.variancePercent >= 0 ? '📈' : '📉' });
  }

  if (kpis.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {kpis.map((kpi, index) => (
        <AnimatedTransition
          key={`sophie-budget-kpi-${index}`}
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
 * MonthlyForecastSection sub-component.
 * Renders the monthly cash flow forecast for Sophie.
 *
 * @param {Object} props
 * @param {Object[]} props.forecast - Array of monthly forecast objects
 * @returns {React.ReactElement|null} The monthly forecast section
 */
function MonthlyForecastSection({ forecast }) {
  if (!Array.isArray(forecast) || forecast.length === 0) {
    return null;
  }

  return (
    <GlassCard variant="default" padding="md" animated>
      <div className="flex items-center gap-2 mb-4">
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-pink bg-opacity-20"
          aria-hidden="true"
        >
          📅
        </span>
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-primary-50 leading-tight">
            Monthly Cash Flow Forecast
          </h3>
          <p className="text-xs text-primary-300 leading-tight">
            Projected inflows, outflows, and net cash flow
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {forecast.map((month, idx) => {
          const monthName = typeof month.month === 'string' ? month.month : `Month ${idx + 1}`;
          const inflows = typeof month.inflows === 'number' ? month.inflows : 0;
          const outflows = typeof month.outflows === 'number' ? month.outflows : 0;
          const netFlow = typeof month.netFlow === 'number' ? month.netFlow : 0;
          const closingBalance = typeof month.closingBalance === 'number' ? month.closingBalance : 0;

          return (
            <AnimatedTransition
              key={`month-forecast-${idx}`}
              show
              type="slide-up"
              duration="fast"
              delay={idx * 60}
            >
              <div className="glass-sm p-3">
                <p className="text-xs text-primary-300 mb-2 font-medium">{monthName}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-primary-300">Inflows</p>
                    <p className="text-sm font-medium text-green-400">{formatCurrency(inflows)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-primary-300">Outflows</p>
                    <p className="text-sm font-medium text-red-400">{formatCurrency(outflows)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-primary-300">Net Flow</p>
                    <p className={[
                      'text-sm font-medium',
                      netFlow >= 0 ? 'text-green-400' : 'text-red-400',
                    ].join(' ')}>
                      {formatCurrency(netFlow)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-primary-300">Closing</p>
                    <p className="text-sm font-medium text-primary-100">{formatCurrency(closingBalance)}</p>
                  </div>
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
 * AtRiskReceivablesSection sub-component.
 * Renders at-risk receivables for Sophie.
 *
 * @param {Object} props
 * @param {Object[]} props.receivables - Array of at-risk receivable objects
 * @returns {React.ReactElement|null} The at-risk receivables section
 */
function AtRiskReceivablesSection({ receivables }) {
  if (!Array.isArray(receivables) || receivables.length === 0) {
    return null;
  }

  return (
    <GlassCard variant="default" padding="md" animated>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-amber-400 bg-opacity-20"
            aria-hidden="true"
          >
            ⚠️
          </span>
          <h3 className="text-sm font-semibold text-primary-50 leading-tight">
            At-Risk Receivables
          </h3>
        </div>
        <span className="text-xs text-amber-400 font-medium">
          {formatCurrency(receivables.reduce((sum, r) => sum + (typeof r.amount === 'number' ? r.amount : 0), 0))} at risk
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {receivables.map((receivable, idx) => (
          <AnimatedTransition
            key={receivable.projectId || `receivable-${idx}`}
            show
            type="slide-up"
            duration="fast"
            delay={idx * 60}
          >
            <div className="flex items-start gap-3 px-4 py-3 rounded-glass-sm border bg-amber-400 bg-opacity-10 border-amber-400 border-opacity-20">
              <span className="text-sm flex-shrink-0 mt-0.5" aria-hidden="true">🟡</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-primary-50">
                    {typeof receivable.projectName === 'string' ? receivable.projectName : 'Project'}
                  </span>
                  <span className="text-sm font-semibold text-amber-400">
                    {formatCurrency(typeof receivable.amount === 'number' ? receivable.amount : 0)}
                  </span>
                </div>
                <p className="text-xs text-primary-200 leading-relaxed">
                  {typeof receivable.risk === 'string' ? receivable.risk : ''}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  {typeof receivable.dueDate === 'string' ? (
                    <span className="text-xs text-primary-300">
                      Due: {formatDate(receivable.dueDate)}
                    </span>
                  ) : null}
                  {typeof receivable.probability === 'number' ? (
                    <span className="text-xs text-primary-300">
                      Collection probability: {formatPercent(receivable.probability)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </AnimatedTransition>
        ))}
      </div>
    </GlassCard>
  );
}

/**
 * PayablesScheduleSection sub-component.
 * Renders the payables schedule for Sophie.
 *
 * @param {Object} props
 * @param {Object[]} props.payables - Array of payable objects
 * @returns {React.ReactElement|null} The payables schedule section
 */
function PayablesScheduleSection({ payables }) {
  if (!Array.isArray(payables) || payables.length === 0) {
    return null;
  }

  const columns = useMemo(() => [
    {
      key: 'vendor',
      label: 'Vendor',
      sortable: true,
      render: (value) => (
        <span className="text-sm font-medium text-primary-50">{typeof value === 'string' ? value : 'N/A'}</span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
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
  ], []);

  return (
    <DataTable
      columns={columns}
      data={payables}
      rowKeyField="vendor"
      striped
      hoverable
      sortable
      defaultSortColumn="dueDate"
      defaultSortDirection="asc"
      showHeader
      title="Upcoming Payables"
      subtitle="Scheduled vendor payments"
      icon="💳"
      emptyMessage="No upcoming payables."
      emptyIcon="📋"
      animated
    />
  );
}

/**
 * ProjectVariancesSection sub-component.
 * Renders project budget variances for Sophie.
 *
 * @param {Object} props
 * @param {Object[]} props.variances - Array of project variance objects
 * @returns {React.ReactElement|null} The project variances section
 */
function ProjectVariancesSection({ variances }) {
  if (!Array.isArray(variances) || variances.length === 0) {
    return null;
  }

  return (
    <GlassCard variant="default" padding="md" animated>
      <div className="flex items-center gap-2 mb-4">
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-pink bg-opacity-20"
          aria-hidden="true"
        >
          📊
        </span>
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-primary-50 leading-tight">
            Budget Variance by Project
          </h3>
          <p className="text-xs text-primary-300 leading-tight">
            Actual spend vs budget across all projects
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {variances.map((pv, idx) => {
          const projectName = typeof pv.projectName === 'string' ? pv.projectName : `Project ${idx + 1}`;
          const budget = typeof pv.budget === 'number' ? pv.budget : 0;
          const actual = typeof pv.actual === 'number' ? pv.actual : 0;
          const variance = typeof pv.variance === 'number' ? pv.variance : 0;
          const variancePercent = typeof pv.variancePercent === 'number' ? pv.variancePercent : 0;
          const drivers = Array.isArray(pv.drivers) ? pv.drivers : [];
          const utilizationPct = budget > 0 ? Math.min((actual / budget) * 100, 120) : 0;

          return (
            <AnimatedTransition
              key={pv.projectId || `variance-${idx}`}
              show
              type="slide-up"
              duration="fast"
              delay={idx * 60}
            >
              <div className="px-4 py-3 rounded-glass-sm bg-glass-light border border-glass-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-primary-50">{projectName}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-primary-300">
                      {formatCurrency(actual)} / {formatCurrency(budget)}
                    </span>
                    <span
                      className={[
                        'text-sm font-semibold',
                        variance >= 0 ? 'text-green-400' : 'text-red-400',
                      ].join(' ')}
                    >
                      {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                    </span>
                    <span
                      className={[
                        'text-xs',
                        variancePercent >= 0 ? 'text-green-400' : 'text-red-400',
                      ].join(' ')}
                    >
                      ({variancePercent >= 0 ? '+' : ''}{variancePercent}%)
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-glass-light overflow-hidden mb-2">
                  <div
                    className={[
                      'h-full rounded-full transition-all duration-700 ease-out',
                      variance < 0 ? 'bg-red-400' : utilizationPct > 85 ? 'bg-amber-400' : 'bg-green-400',
                    ].join(' ')}
                    style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                  />
                </div>
                {drivers.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {drivers.map((driver, dIdx) => (
                      <span
                        key={`driver-${idx}-${dIdx}`}
                        className="text-xs px-1.5 py-0.5 rounded-full bg-glass-light text-primary-300"
                      >
                        {driver}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </AnimatedTransition>
          );
        })}
      </div>
    </GlassCard>
  );
}

/**
 * VarianceByCategorySection sub-component.
 * Renders variance by category breakdown for Sophie.
 *
 * @param {Object} props
 * @param {Object[]} props.categories - Array of variance category objects
 * @returns {React.ReactElement|null} The variance by category section
 */
function VarianceByCategorySection({ categories }) {
  if (!Array.isArray(categories) || categories.length === 0) {
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
          Variance by Category
        </h3>
      </div>
      <div className="flex flex-col gap-2">
        {categories.map((cat, idx) => {
          const category = typeof cat.category === 'string' ? cat.category : `Category ${idx + 1}`;
          const variance = typeof cat.variance === 'number' ? cat.variance : 0;

          return (
            <AnimatedTransition
              key={`var-cat-${idx}`}
              show
              type="slide-up"
              duration="fast"
              delay={idx * 60}
            >
              <div className="flex items-center justify-between px-3 py-2.5 rounded-glass-sm bg-glass-light border border-glass-border">
                <span className="text-sm font-medium text-primary-50">{category}</span>
                <span
                  className={[
                    'text-sm font-semibold',
                    variance >= 0 ? 'text-green-400' : 'text-red-400',
                  ].join(' ')}
                >
                  {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                </span>
              </div>
            </AnimatedTransition>
          );
        })}
      </div>
    </GlassCard>
  );
}

/**
 * SophieRiskSignalsSection sub-component.
 * Renders risk signals relevant to Sophie's finance domain.
 *
 * @param {Object} props
 * @param {Object[]} props.signals - Array of risk signal objects
 * @param {function} [props.onActionClick] - Action click handler
 * @returns {React.ReactElement|null} The risk signals section
 */
function SophieRiskSignalsSection({ signals, onActionClick }) {
  if (!Array.isArray(signals) || signals.length === 0) {
    return null;
  }

  const relevantSignals = signals.filter((signal) => {
    if (!signal || typeof signal !== 'object') {
      return false;
    }
    if (Array.isArray(signal.affectedClusters)) {
      return signal.affectedClusters.some(
        (cid) => cid === INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id
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
              Financial Risk Signals
            </h3>
            <p className="text-xs text-primary-300 leading-tight">
              Active risks affecting finance and cash flow
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
 * SophieActionsSection sub-component.
 * Renders suggested actions for Sophie.
 *
 * @param {Object} props
 * @param {Object[]} props.actions - Array of action objects
 * @param {boolean} props.disabled - Whether actions are disabled
 * @param {function} props.onExecute - Execute callback
 * @param {function} props.onSuccess - Success callback
 * @param {function} props.onError - Error callback
 * @returns {React.ReactElement|null} The actions section
 */
function SophieActionsSection({ actions, disabled, onExecute, onSuccess, onError }) {
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
            Recommended actions for financial management
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action, index) => (
          <ActionButton
            key={action.id || `sophie-action-${index}`}
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
 * SophieFlowPage component.
 * Renders the Sophie Dubois (Finance Lead) persona flow pages.
 * Implements finance/cash flow queries, budget variance analysis,
 * revenue forecasting, and financial action execution screens with
 * persona-specific data and CTA flows.
 *
 * @returns {React.ReactElement|null} The Sophie flow page component, or null if not authenticated
 */
function SophieFlowPage() {
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

  const [activeTab, setActiveTab] = useState('cashflow');
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
      screenId: SCREEN_IDS.CLUSTER_FINANCE,
      screenName: 'Sophie Flow - Finance & Cash Flow',
      persona,
    });
  }, [persona]);

  /**
   * Resolves the Sophie persona profile
   */
  const sophieProfile = useMemo(() => {
    return getPersonaProfile(SOPHIE_PERSONA_ID);
  }, []);

  /**
   * Resolves cash flow data from mock data
   */
  const cashFlowData = useMemo(() => {
    if (Array.isArray(FINANCE_CASH_FLOW_DATA) && FINANCE_CASH_FLOW_DATA.length > 0) {
      return FINANCE_CASH_FLOW_DATA[0];
    }
    return null;
  }, []);

  /**
   * Resolves budget variance data from mock data
   */
  const budgetVarianceData = useMemo(() => {
    if (Array.isArray(FINANCE_CASH_FLOW_DATA) && FINANCE_CASH_FLOW_DATA.length > 1) {
      return FINANCE_CASH_FLOW_DATA[1];
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
   * Resolves monthly forecast from cash flow data
   */
  const monthlyForecast = useMemo(() => {
    if (cashFlowData && cashFlowData.data && Array.isArray(cashFlowData.data.monthlyForecast)) {
      return cashFlowData.data.monthlyForecast;
    }
    return [];
  }, [cashFlowData]);

  /**
   * Resolves at-risk receivables from cash flow data
   */
  const atRiskReceivables = useMemo(() => {
    if (cashFlowData && cashFlowData.data && Array.isArray(cashFlowData.data.atRiskReceivables)) {
      return cashFlowData.data.atRiskReceivables;
    }
    return [];
  }, [cashFlowData]);

  /**
   * Resolves payables schedule from cash flow data
   */
  const payablesSchedule = useMemo(() => {
    if (cashFlowData && cashFlowData.data && Array.isArray(cashFlowData.data.payablesSchedule)) {
      return cashFlowData.data.payablesSchedule;
    }
    return [];
  }, [cashFlowData]);

  /**
   * Resolves project variances from budget variance data
   */
  const projectVariances = useMemo(() => {
    if (budgetVarianceData && budgetVarianceData.data && Array.isArray(budgetVarianceData.data.projectVariances)) {
      return budgetVarianceData.data.projectVariances;
    }
    return [];
  }, [budgetVarianceData]);

  /**
   * Resolves variance by category from budget variance data
   */
  const varianceByCategory = useMemo(() => {
    if (budgetVarianceData && budgetVarianceData.data && Array.isArray(budgetVarianceData.data.varianceByCategory)) {
      return budgetVarianceData.data.varianceByCategory;
    }
    return [];
  }, [budgetVarianceData]);

  /**
   * Resolves all suggested actions from cash flow and budget variance data
   */
  const allActions = useMemo(() => {
    const actions = [];
    if (cashFlowData && Array.isArray(cashFlowData.actions)) {
      for (const action of cashFlowData.actions) {
        actions.push(action);
      }
    }
    if (budgetVarianceData && Array.isArray(budgetVarianceData.actions)) {
      for (const action of budgetVarianceData.actions) {
        if (!actions.some((a) => a.id === action.id)) {
          actions.push(action);
        }
      }
    }
    return actions;
  }, [cashFlowData, budgetVarianceData]);

  /**
   * Resolves risk signals relevant to Sophie
   */
  const sophieRiskSignals = useMemo(() => {
    if (!Array.isArray(RISK_SIGNALS)) {
      return [];
    }
    return RISK_SIGNALS.filter((signal) => {
      if (!signal || typeof signal !== 'object') {
        return false;
      }
      if (Array.isArray(signal.affectedClusters)) {
        return signal.affectedClusters.some(
          (cid) => cid === INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id
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
      action: 'SOPHIE_FLOW_QUERY_SUBMIT',
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
      action: 'SOPHIE_FLOW_ACTION_CLICK',
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
      action: 'SOPHIE_FLOW_RISK_ACTION_CLICK',
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
      action: 'SOPHIE_FLOW_NEW_QUERY',
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
      action: 'SOPHIE_FLOW_CTA_CLICK',
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
      action: 'SOPHIE_FLOW_UNDO',
      executionId: result ? result.id : null,
      persona,
    });
  }, [persona]);

  /**
   * Handles proceed from ActionConfirmation
   */
  const handleProceed = useCallback(() => {
    logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {
      action: 'SOPHIE_FLOW_PROCEED',
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
        screenId: SCREEN_IDS.CLUSTER_FINANCE,
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
      action: 'SOPHIE_FLOW_ACTION_BUTTON_EXECUTE',
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
      action: 'SOPHIE_FLOW_ACTION_BUTTON_SUCCESS',
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
      action: 'SOPHIE_FLOW_ACTION_BUTTON_ERROR',
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
      action: 'SOPHIE_FLOW_TAB_CHANGE',
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

  const accentColor = getSophieColor();

  /**
   * Tab definitions
   */
  const tabs = useMemo(() => [
    { id: 'cashflow', label: 'Cash Flow', icon: '💰' },
    { id: 'budget', label: 'Budget Variance', icon: '📊' },
    { id: 'forecast', label: 'Forecasts', icon: '📈' },
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
                {sophieProfile ? sophieProfile.avatar : 'S'}
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-semibold text-primary-50 leading-tight">
                  Finance & Cash Flow Intelligence
                </h1>
                <p className="text-sm text-primary-200 mt-0.5">
                  {sophieProfile ? sophieProfile.name : 'Sophie Dubois'} · {sophieProfile ? sophieProfile.role : 'Finance Lead'}
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

      {/* Cash Flow Tab */}
      {activeTab === 'cashflow' ? (
        <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 2}>
          <div className="flex flex-col gap-6">
            {/* Cash Flow Summary */}
            {cashFlowData && cashFlowData.data ? (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-pink bg-opacity-20"
                    aria-hidden="true"
                  >
                    💰
                  </span>
                  <h2 className="text-base font-semibold text-primary-50 leading-tight">
                    Cash Flow Overview
                  </h2>
                </div>
                <CashFlowSummaryCard data={cashFlowData.data} />
              </div>
            ) : null}

            {/* Summary Text */}
            {cashFlowData && typeof cashFlowData.summary === 'string' ? (
              <GlassCard variant="default" padding="md" animated>
                <div className="flex items-start gap-3">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-pink bg-opacity-20"
                    aria-hidden="true"
                  >
                    🧠
                  </span>
                  <p className="text-sm text-primary-100 leading-relaxed">
                    {cashFlowData.summary}
                  </p>
                </div>
              </GlassCard>
            ) : null}

            {/* Monthly Forecast */}
            <MonthlyForecastSection forecast={monthlyForecast} />

            {/* At-Risk Receivables */}
            <AtRiskReceivablesSection receivables={atRiskReceivables} />

            {/* Payables Schedule */}
            <PayablesScheduleSection payables={payablesSchedule} />

            {/* Actions */}
            <SophieActionsSection
              actions={allActions.filter((a) =>
                a.id === 'act-fc-001' || a.id === 'act-fc-002' || a.id === 'act-fc-003'
              )}
              disabled={actionExecuting}
              onExecute={handleActionExecute}
              onSuccess={handleActionSuccess}
              onError={handleActionError}
            />

            {/* CTA Bubbles */}
            <CTABubbles
              clusterId={INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id}
              onBubbleClick={handleBubbleClick}
              showHeader
            />
          </div>
        </AnimatedTransition>
      ) : null}

      {/* Budget Variance Tab */}
      {activeTab === 'budget' ? (
        <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 2}>
          <div className="flex flex-col gap-6">
            {/* Budget Variance Summary */}
            {budgetVarianceData && typeof budgetVarianceData.summary === 'string' ? (
              <GlassCard variant="default" padding="md" animated>
                <div className="flex items-start gap-3">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-pink bg-opacity-20"
                    aria-hidden="true"
                  >
                    📊
                  </span>
                  <p className="text-sm text-primary-100 leading-relaxed">
                    {budgetVarianceData.summary}
                  </p>
                </div>
              </GlassCard>
            ) : null}

            {/* Budget KPIs */}
            {budgetVarianceData && budgetVarianceData.data ? (
              <BudgetVarianceSummaryCard data={budgetVarianceData.data} />
            ) : null}

            {/* Project Variances */}
            <ProjectVariancesSection variances={projectVariances} />

            {/* Variance by Category */}
            <VarianceByCategorySection categories={varianceByCategory} />

            {/* Budget Actions */}
            <SophieActionsSection
              actions={allActions.filter((a) =>
                a.id === 'act-fc-004' || a.id === 'act-fc-005' || a.id === 'act-fc-006'
              )}
              disabled={actionExecuting}
              onExecute={handleActionExecute}
              onSuccess={handleActionSuccess}
              onError={handleActionError}
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
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-pink bg-opacity-20"
                  aria-hidden="true"
                >
                  📈
                </span>
                <div className="flex flex-col">
                  <p className="text-sm text-primary-100 leading-relaxed">
                    Revenue and cash flow forecasts for the portfolio. Models are updated daily based on
                    project progress, pipeline changes, and market conditions.
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

            {/* Monthly Cash Flow Forecast (repeated for forecast context) */}
            <MonthlyForecastSection forecast={monthlyForecast} />

            {/* Forecast Actions */}
            <SophieActionsSection
              actions={allActions.filter((a) =>
                a.id === 'act-fc-002' || a.id === 'act-fc-003'
              )}
              disabled={actionExecuting}
              onExecute={handleActionExecute}
              onSuccess={handleActionSuccess}
              onError={handleActionError}
            />

            {/* CTA Bubbles */}
            <CTABubbles
              clusterId={INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id}
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
                    {sophieRiskSignals.length} risk signal{sophieRiskSignals.length !== 1 ? 's' : ''} detected
                    affecting financial operations.
                    {sophieRiskSignals.filter((s) => s.severity === 'critical' || s.severity === 'high').length > 0
                      ? ` ${sophieRiskSignals.filter((s) => s.severity === 'critical' || s.severity === 'high').length} high-priority risk${sophieRiskSignals.filter((s) => s.severity === 'critical' || s.severity === 'high').length !== 1 ? 's' : ''} require immediate attention.`
                      : ' No critical risks at this time.'}
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Risk Signal Cards */}
            <SophieRiskSignalsSection
              signals={sophieRiskSignals}
              onActionClick={handleRiskActionClick}
            />

            {/* Cash flow risk signals */}
            {cashFlowData && Array.isArray(cashFlowData.riskSignals) && cashFlowData.riskSignals.length > 0 ? (
              <GlassCard variant="default" padding="md" animated>
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-amber-400 bg-opacity-20"
                    aria-hidden="true"
                  >
                    ⚠️
                  </span>
                  <h3 className="text-sm font-semibold text-primary-50 leading-tight">
                    Cash Flow Risk Signals
                  </h3>
                </div>
                <div className="flex flex-col gap-2">
                  {cashFlowData.riskSignals.map((signal, index) => (
                    <AnimatedTransition
                      key={signal.id || `cf-risk-${index}`}
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

            {/* Budget variance risk signals */}
            {budgetVarianceData && Array.isArray(budgetVarianceData.riskSignals) && budgetVarianceData.riskSignals.length > 0 ? (
              <GlassCard variant="default" padding="md" animated>
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-red-400 bg-opacity-20"
                    aria-hidden="true"
                  >
                    📉
                  </span>
                  <h3 className="text-sm font-semibold text-primary-50 leading-tight">
                    Budget Overrun Risks
                  </h3>
                </div>
                <div className="flex flex-col gap-2">
                  {budgetVarianceData.riskSignals.map((signal, index) => (
                    <AnimatedTransition
                      key={signal.id || `bv-risk-${index}`}
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
                placeholder="Ask about cash flow, budgets, revenue forecasts, or financial risks..."
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
                  message="Querying financial and accounting systems..."
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
                clusterId={INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id}
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
            v{import.meta.env.VITE_APP_VERSION || '1.0.0'} · Finance & Cash Flow Intelligence
          </p>
        </div>
      </AnimatedTransition>
    </div>
  );
}

export default SophieFlowPage;