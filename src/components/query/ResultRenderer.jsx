/**
 * Dynamic result rendering component for Ask Dreeso Memory.
 * Displays structured query results as tables, risk signals, or forecast
 * models based on result type. Supports responsive layouts: full tables
 * on desktop, stacked cards on tablet, carousel on mobile.
 *
 * @module ResultRenderer
 * @see SCRUM-7892
 * @see SCRUM-7893
 * @see SCRUM-7897
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import GlassCard from '../ui/GlassCard';
import AnimatedTransition from '../ui/AnimatedTransition';
import LoadingSpinner from '../ui/LoadingSpinner';

/**
 * Breakpoint value in pixels for mobile detection.
 * @type {number}
 */
const MOBILE_BREAKPOINT = 768;

/**
 * Breakpoint value in pixels for tablet detection.
 * @type {number}
 */
const TABLET_BREAKPOINT = 1024;

/**
 * Returns the current window width safely.
 * @returns {number} The current window inner width
 */
function getWindowWidth() {
  if (typeof window !== 'undefined') {
    return window.innerWidth;
  }
  return TABLET_BREAKPOINT + 1;
}

/**
 * Determines the result type from a query result object.
 * @param {Object} result - A single query result object
 * @returns {string} The result type ('project', 'sales', 'procurement', 'finance', 'workforce', 'knowledge', 'forecast', 'risk', 'generic')
 */
function detectResultType(result) {
  if (!result || typeof result !== 'object') {
    return 'generic';
  }

  const clusterId = typeof result.clusterId === 'string' ? result.clusterId : '';

  if (clusterId.includes('project-portfolio')) {
    return 'project';
  }
  if (clusterId.includes('sales-business-dev')) {
    return 'sales';
  }
  if (clusterId.includes('commercial-procurement')) {
    return 'procurement';
  }
  if (clusterId.includes('finance-cash-flow')) {
    return 'finance';
  }
  if (clusterId.includes('workforce-planning')) {
    return 'workforce';
  }
  if (clusterId.includes('knowledge-ip')) {
    return 'knowledge';
  }

  // Check for forecast model structure
  if (result.type === 'revenue' || result.type === 'workforce' || result.type === 'procurement') {
    return 'forecast';
  }

  // Check for risk signal structure
  if (typeof result.severity === 'string' && typeof result.category === 'string' && typeof result.title === 'string') {
    return 'risk';
  }

  return 'generic';
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
 * Resolves severity to a background color class.
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
 * Resolves a project status to a color class.
 * @param {string} status - The project status
 * @returns {string} Tailwind color class
 */
function getStatusColor(status) {
  switch (status) {
    case 'on-track':
      return 'text-green-400';
    case 'at-risk':
      return 'text-amber-400';
    case 'critical':
      return 'text-red-400';
    default:
      return 'text-primary-200';
  }
}

/**
 * Resolves a project status to a badge background class.
 * @param {string} status - The project status
 * @returns {string} Tailwind background class
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
 * ProgressBar sub-component.
 * Renders a horizontal progress bar with percentage label.
 *
 * @param {Object} props
 * @param {number} props.value - Progress value (0-100)
 * @param {string} [props.color='bg-accent-blue'] - Tailwind background color class
 * @param {string} [props.label] - Optional label
 * @returns {React.ReactElement} The progress bar element
 */
function ProgressBar({ value, color, label }) {
  const clampedValue = Math.max(0, Math.min(100, typeof value === 'number' ? value : 0));

  return (
    <div className="flex items-center gap-2 w-full">
      {label ? (
        <span className="text-xs text-primary-300 flex-shrink-0 w-8 text-right">
          {label}
        </span>
      ) : null}
      <div className="flex-1 h-2 rounded-full bg-glass-light overflow-hidden">
        <div
          className={[
            'h-full rounded-full transition-all duration-500 ease-out',
            color || 'bg-accent-blue',
          ].join(' ')}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      <span className="text-xs text-primary-200 flex-shrink-0 w-10 text-right">
        {clampedValue.toFixed(0)}%
      </span>
    </div>
  );
}

ProgressBar.propTypes = {
  value: PropTypes.number.isRequired,
  color: PropTypes.string,
  label: PropTypes.string,
};

ProgressBar.defaultProps = {
  color: 'bg-accent-blue',
  label: undefined,
};

/**
 * RiskSignalCard sub-component.
 * Renders a single risk signal as a card.
 *
 * @param {Object} props
 * @param {Object} props.signal - The risk signal object
 * @returns {React.ReactElement} The risk signal card element
 */
function RiskSignalCard({ signal }) {
  if (!signal || typeof signal !== 'object') {
    return null;
  }

  const severity = typeof signal.severity === 'string' ? signal.severity : 'medium';
  const message = typeof signal.message === 'string' ? signal.message : '';
  const category = typeof signal.category === 'string' ? signal.category : '';
  const detectedAt = typeof signal.detectedAt === 'string' ? signal.detectedAt : '';

  return (
    <div
      className={[
        'flex items-start gap-3 px-4 py-3 rounded-glass-sm border border-glass-border',
        getSeverityBgColor(severity),
      ].join(' ')}
    >
      <div className="flex-shrink-0 mt-0.5">
        <span className={['text-sm font-semibold uppercase', getSeverityColor(severity)].join(' ')}>
          {severity === 'critical' ? '🔴' : severity === 'high' ? '🟠' : severity === 'medium' ? '🟡' : '🟢'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={[
              'text-xs font-semibold uppercase px-2 py-0.5 rounded-full',
              getSeverityBgColor(severity),
              getSeverityColor(severity),
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
        <p className="text-sm text-primary-100 leading-relaxed">
          {message}
        </p>
        {detectedAt ? (
          <p className="text-xs text-primary-300 mt-1">
            Detected: {formatDate(detectedAt)}
          </p>
        ) : null}
      </div>
    </div>
  );
}

RiskSignalCard.propTypes = {
  signal: PropTypes.object.isRequired,
};

/**
 * ActionButton sub-component.
 * Renders a single action button.
 *
 * @param {Object} props
 * @param {Object} props.action - The action object
 * @param {function} [props.onActionClick] - Click handler
 * @returns {React.ReactElement} The action button element
 */
function ActionButton({ action, onActionClick }) {
  if (!action || typeof action !== 'object') {
    return null;
  }

  const label = typeof action.label === 'string' ? action.label : 'Action';
  const priority = typeof action.priority === 'string' ? action.priority : 'medium';

  const priorityClasses = priority === 'high'
    ? 'border-accent-blue text-accent-blue hover:bg-accent-blue hover:bg-opacity-10'
    : 'border-glass-border text-primary-200 hover:bg-glass-light hover:text-primary-50';

  const handleClick = useCallback(() => {
    if (typeof onActionClick === 'function') {
      onActionClick(action);
    }
  }, [action, onActionClick]);

  return (
    <button
      type="button"
      className={[
        'flex items-center gap-2 px-3 py-2 rounded-glass-sm border text-sm font-medium',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
        priorityClasses,
      ]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()}
      onClick={handleClick}
    >
      {priority === 'high' ? (
        <svg
          className="w-4 h-4 flex-shrink-0"
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
      ) : null}
      <span className="truncate">{label}</span>
    </button>
  );
}

ActionButton.propTypes = {
  action: PropTypes.object.isRequired,
  onActionClick: PropTypes.func,
};

ActionButton.defaultProps = {
  onActionClick: undefined,
};

/**
 * SourceBadge sub-component.
 * Renders a source system badge.
 *
 * @param {Object} props
 * @param {Object} props.source - The source object
 * @returns {React.ReactElement} The source badge element
 */
function SourceBadge({ source }) {
  if (!source || typeof source !== 'object') {
    return null;
  }

  const label = typeof source.label === 'string' ? source.label : 'Unknown';
  const confidence = typeof source.confidence === 'number' ? source.confidence : 0;

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-glass-light text-xs text-primary-200 border border-glass-border">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" aria-hidden="true" />
      <span>{label}</span>
      <span className="text-primary-300">{formatPercent(confidence)}</span>
    </span>
  );
}

SourceBadge.propTypes = {
  source: PropTypes.object.isRequired,
};

/**
 * ProjectTableDesktop sub-component.
 * Renders project data as a full table for desktop viewports.
 *
 * @param {Object} props
 * @param {Object[]} props.projects - Array of project objects
 * @returns {React.ReactElement} The project table element
 */
function ProjectTableDesktop({ projects }) {
  if (!Array.isArray(projects) || projects.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-glass-border">
            <th className="text-left py-3 px-3 text-xs font-semibold text-primary-300 uppercase tracking-wider">
              Project
            </th>
            <th className="text-left py-3 px-3 text-xs font-semibold text-primary-300 uppercase tracking-wider">
              Status
            </th>
            <th className="text-left py-3 px-3 text-xs font-semibold text-primary-300 uppercase tracking-wider">
              Completion
            </th>
            <th className="text-right py-3 px-3 text-xs font-semibold text-primary-300 uppercase tracking-wider">
              Budget
            </th>
            <th className="text-right py-3 px-3 text-xs font-semibold text-primary-300 uppercase tracking-wider">
              Spent
            </th>
            <th className="text-left py-3 px-3 text-xs font-semibold text-primary-300 uppercase tracking-wider">
              Due Date
            </th>
            <th className="text-left py-3 px-3 text-xs font-semibold text-primary-300 uppercase tracking-wider">
              Risk
            </th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project, index) => {
            const name = typeof project.name === 'string' ? project.name : `Project ${index + 1}`;
            const status = typeof project.status === 'string' ? project.status : 'unknown';
            const completion = typeof project.completion === 'number' ? project.completion : 0;
            const budget = typeof project.budget === 'number' ? project.budget : 0;
            const spent = typeof project.spent === 'number' ? project.spent : 0;
            const dueDate = typeof project.dueDate === 'string' ? project.dueDate : '';
            const riskLevel = typeof project.riskLevel === 'string' ? project.riskLevel : 'low';

            return (
              <tr
                key={project.id || `project-${index}`}
                className="border-b border-glass-border hover:bg-glass-light transition-colors duration-200"
              >
                <td className="py-3 px-3">
                  <span className="text-sm font-medium text-primary-50">{name}</span>
                </td>
                <td className="py-3 px-3">
                  <span
                    className={[
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                      getStatusBadgeClass(status),
                    ].join(' ')}
                  >
                    {status.replace('-', ' ')}
                  </span>
                </td>
                <td className="py-3 px-3 w-40">
                  <ProgressBar
                    value={completion}
                    color={status === 'critical' ? 'bg-red-400' : status === 'at-risk' ? 'bg-amber-400' : 'bg-green-400'}
                  />
                </td>
                <td className="py-3 px-3 text-right text-primary-100">
                  {formatCurrency(budget)}
                </td>
                <td className="py-3 px-3 text-right text-primary-100">
                  {formatCurrency(spent)}
                </td>
                <td className="py-3 px-3 text-primary-200">
                  {formatDate(dueDate)}
                </td>
                <td className="py-3 px-3">
                  <span className={['text-xs font-medium capitalize', getSeverityColor(riskLevel)].join(' ')}>
                    {riskLevel}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

ProjectTableDesktop.propTypes = {
  projects: PropTypes.array.isRequired,
};

/**
 * ProjectCardStack sub-component.
 * Renders project data as stacked cards for tablet viewports.
 *
 * @param {Object} props
 * @param {Object[]} props.projects - Array of project objects
 * @returns {React.ReactElement} The project card stack element
 */
function ProjectCardStack({ projects }) {
  if (!Array.isArray(projects) || projects.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {projects.map((project, index) => {
        const name = typeof project.name === 'string' ? project.name : `Project ${index + 1}`;
        const status = typeof project.status === 'string' ? project.status : 'unknown';
        const completion = typeof project.completion === 'number' ? project.completion : 0;
        const budget = typeof project.budget === 'number' ? project.budget : 0;
        const spent = typeof project.spent === 'number' ? project.spent : 0;
        const dueDate = typeof project.dueDate === 'string' ? project.dueDate : '';
        const riskLevel = typeof project.riskLevel === 'string' ? project.riskLevel : 'low';
        const manager = typeof project.manager === 'string' ? project.manager : '';

        return (
          <div
            key={project.id || `project-card-${index}`}
            className="glass-sm p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-primary-50 truncate">{name}</h4>
                {manager ? (
                  <p className="text-xs text-primary-300 mt-0.5">{manager}</p>
                ) : null}
              </div>
              <span
                className={[
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize flex-shrink-0 ml-2',
                  getStatusBadgeClass(status),
                ].join(' ')}
              >
                {status.replace('-', ' ')}
              </span>
            </div>
            <ProgressBar
              value={completion}
              color={status === 'critical' ? 'bg-red-400' : status === 'at-risk' ? 'bg-amber-400' : 'bg-green-400'}
            />
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div>
                <p className="text-xs text-primary-300">Budget</p>
                <p className="text-sm font-medium text-primary-100">{formatCurrency(budget)}</p>
              </div>
              <div>
                <p className="text-xs text-primary-300">Spent</p>
                <p className="text-sm font-medium text-primary-100">{formatCurrency(spent)}</p>
              </div>
              <div>
                <p className="text-xs text-primary-300">Due</p>
                <p className="text-sm font-medium text-primary-100">{formatDate(dueDate)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-glass-border">
              <span className="text-xs text-primary-300">Risk Level</span>
              <span className={['text-xs font-medium capitalize', getSeverityColor(riskLevel)].join(' ')}>
                {riskLevel}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

ProjectCardStack.propTypes = {
  projects: PropTypes.array.isRequired,
};

/**
 * ProjectCarousel sub-component.
 * Renders project data as a swipeable carousel for mobile viewports.
 *
 * @param {Object} props
 * @param {Object[]} props.projects - Array of project objects
 * @returns {React.ReactElement} The project carousel element
 */
function ProjectCarousel({ projects }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!Array.isArray(projects) || projects.length === 0) {
    return null;
  }

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : projects.length - 1));
  }, [projects.length]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev < projects.length - 1 ? prev + 1 : 0));
  }, [projects.length]);

  const project = projects[activeIndex];
  if (!project) {
    return null;
  }

  const name = typeof project.name === 'string' ? project.name : `Project ${activeIndex + 1}`;
  const status = typeof project.status === 'string' ? project.status : 'unknown';
  const completion = typeof project.completion === 'number' ? project.completion : 0;
  const budget = typeof project.budget === 'number' ? project.budget : 0;
  const spent = typeof project.spent === 'number' ? project.spent : 0;
  const dueDate = typeof project.dueDate === 'string' ? project.dueDate : '';
  const riskLevel = typeof project.riskLevel === 'string' ? project.riskLevel : 'low';

  return (
    <div className="flex flex-col gap-3">
      <div className="glass-sm p-4">
        <div className="flex items-start justify-between mb-3">
          <h4 className="text-sm font-semibold text-primary-50 truncate flex-1 min-w-0">{name}</h4>
          <span
            className={[
              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize flex-shrink-0 ml-2',
              getStatusBadgeClass(status),
            ].join(' ')}
          >
            {status.replace('-', ' ')}
          </span>
        </div>
        <ProgressBar
          value={completion}
          color={status === 'critical' ? 'bg-red-400' : status === 'at-risk' ? 'bg-amber-400' : 'bg-green-400'}
        />
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <p className="text-xs text-primary-300">Budget</p>
            <p className="text-sm font-medium text-primary-100">{formatCurrency(budget)}</p>
          </div>
          <div>
            <p className="text-xs text-primary-300">Spent</p>
            <p className="text-sm font-medium text-primary-100">{formatCurrency(spent)}</p>
          </div>
          <div>
            <p className="text-xs text-primary-300">Due Date</p>
            <p className="text-sm font-medium text-primary-100">{formatDate(dueDate)}</p>
          </div>
          <div>
            <p className="text-xs text-primary-300">Risk</p>
            <p className={['text-sm font-medium capitalize', getSeverityColor(riskLevel)].join(' ')}>
              {riskLevel}
            </p>
          </div>
        </div>
      </div>

      {/* Carousel Controls */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          className="flex items-center justify-center w-8 h-8 rounded-full bg-glass-light text-primary-200 hover:bg-glass-medium hover:text-primary-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50"
          onClick={handlePrev}
          aria-label="Previous project"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-1.5">
          {projects.map((_, idx) => (
            <button
              key={`dot-${idx}`}
              type="button"
              className={[
                'w-2 h-2 rounded-full transition-all duration-200',
                idx === activeIndex ? 'bg-accent-blue' : 'bg-glass-light',
              ].join(' ')}
              onClick={() => setActiveIndex(idx)}
              aria-label={`Go to project ${idx + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          className="flex items-center justify-center w-8 h-8 rounded-full bg-glass-light text-primary-200 hover:bg-glass-medium hover:text-primary-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50"
          onClick={handleNext}
          aria-label="Next project"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

ProjectCarousel.propTypes = {
  projects: PropTypes.array.isRequired,
};

/**
 * SummaryKPIs sub-component.
 * Renders key performance indicators from result data.
 *
 * @param {Object} props
 * @param {Array} props.kpis - Array of KPI objects with label, value, and optional unit
 * @returns {React.ReactElement} The KPI grid element
 */
function SummaryKPIs({ kpis }) {
  if (!Array.isArray(kpis) || kpis.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {kpis.map((kpi, index) => (
        <div
          key={kpi.id || `kpi-${index}`}
          className="glass-sm p-3 flex flex-col items-center text-center"
        >
          {kpi.icon ? (
            <span className="text-lg mb-1" aria-hidden="true">{kpi.icon}</span>
          ) : null}
          <span className="text-lg font-bold text-primary-50">
            {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
            {kpi.unit ? <span className="text-sm font-normal text-primary-200 ml-0.5">{kpi.unit}</span> : null}
          </span>
          <span className="text-xs text-primary-300 mt-0.5">{kpi.label}</span>
        </div>
      ))}
    </div>
  );
}

SummaryKPIs.propTypes = {
  kpis: PropTypes.array.isRequired,
};

/**
 * ForecastRenderer sub-component.
 * Renders forecast model data with projections.
 *
 * @param {Object} props
 * @param {Object} props.forecast - The forecast model object
 * @returns {React.ReactElement} The forecast display element
 */
function ForecastRenderer({ forecast }) {
  if (!forecast || typeof forecast !== 'object') {
    return null;
  }

  const name = typeof forecast.name === 'string' ? forecast.name : 'Forecast';
  const confidence = typeof forecast.confidence === 'number' ? forecast.confidence : 0;
  const data = forecast.data && typeof forecast.data === 'object' ? forecast.data : {};

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-primary-50">{name}</h4>
        <span className="text-xs text-primary-300">
          Confidence: {formatPercent(confidence)}
        </span>
      </div>

      {/* Quarterly projections if available */}
      {Array.isArray(data.quarterlyProjection) && data.quarterlyProjection.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-primary-300 font-medium uppercase tracking-wider">
            Quarterly Projection
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {data.quarterlyProjection.map((q, idx) => (
              <div
                key={q.quarter || `q-${idx}`}
                className="glass-sm p-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs text-primary-300">{q.quarter}</p>
                  <p className="text-sm font-semibold text-primary-50">
                    {formatCurrency(q.projected)}
                  </p>
                </div>
                <span className="text-xs text-primary-300">
                  {formatPercent(q.confidence)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Hiring needs if available */}
      {Array.isArray(data.hiringNeeds) && data.hiringNeeds.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-primary-300 font-medium uppercase tracking-wider">
            Hiring Needs
          </p>
          <div className="flex flex-col gap-1.5">
            {data.hiringNeeds.map((need, idx) => (
              <div
                key={`hire-${idx}`}
                className="flex items-center justify-between px-3 py-2 rounded-glass-sm bg-glass-light"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-primary-100">{need.role}</span>
                  <span className={[
                    'text-xs px-1.5 py-0.5 rounded-full',
                    need.urgency === 'high' ? 'bg-red-400 bg-opacity-15 text-red-400' :
                      need.urgency === 'medium' ? 'bg-amber-400 bg-opacity-15 text-amber-400' :
                        'bg-green-400 bg-opacity-15 text-green-400',
                  ].join(' ')}>
                    {need.urgency}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-primary-300">
                  <span>{need.count} needed</span>
                  <span>by {formatDate(need.byDate)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Material trends if available */}
      {Array.isArray(data.materialTrends) && data.materialTrends.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-primary-300 font-medium uppercase tracking-wider">
            Material Trends
          </p>
          <div className="flex flex-col gap-1.5">
            {data.materialTrends.map((material, idx) => (
              <div
                key={`mat-${idx}`}
                className="flex items-center justify-between px-3 py-2 rounded-glass-sm bg-glass-light"
              >
                <span className="text-sm text-primary-100">{material.material}</span>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-primary-200">
                    {material.currentPrice} {material.unit}
                  </span>
                  <span className={
                    material.trend === 'rising' ? 'text-red-400' :
                      material.trend === 'declining' ? 'text-green-400' :
                        'text-primary-300'
                  }>
                    {material.changePercent > 0 ? '+' : ''}{material.changePercent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

ForecastRenderer.propTypes = {
  forecast: PropTypes.object.isRequired,
};

/**
 * GenericDataRenderer sub-component.
 * Renders generic structured data as key-value pairs.
 *
 * @param {Object} props
 * @param {Object} props.data - The data object to render
 * @returns {React.ReactElement} The generic data display element
 */
function GenericDataRenderer({ data }) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const entries = Object.entries(data).filter(([, value]) => {
    return typeof value !== 'object' || value === null;
  });

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {entries.map(([key, value]) => (
        <div
          key={key}
          className="flex items-center justify-between px-3 py-2 rounded-glass-sm bg-glass-light"
        >
          <span className="text-xs text-primary-300 capitalize">
            {key.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').trim()}
          </span>
          <span className="text-sm font-medium text-primary-100">
            {typeof value === 'number'
              ? (Math.abs(value) >= 10000 ? formatCurrency(value) : value.toLocaleString())
              : typeof value === 'boolean'
                ? (value ? 'Yes' : 'No')
                : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

GenericDataRenderer.propTypes = {
  data: PropTypes.object.isRequired,
};

/**
 * SingleResultRenderer sub-component.
 * Renders a single query result based on its detected type.
 *
 * @param {Object} props
 * @param {Object} props.result - The query result object
 * @param {boolean} props.isMobile - Whether the viewport is mobile
 * @param {boolean} props.isTablet - Whether the viewport is tablet
 * @param {function} [props.onActionClick] - Action click handler
 * @returns {React.ReactElement} The rendered result element
 */
function SingleResultRenderer({ result, isMobile, isTablet, onActionClick }) {
  if (!result || typeof result !== 'object') {
    return null;
  }

  const resultType = detectResultType(result);
  const summary = typeof result.summary === 'string' ? result.summary : '';
  const data = result.data && typeof result.data === 'object' ? result.data : {};
  const sources = Array.isArray(result.sources) ? result.sources : [];
  const actions = Array.isArray(result.actions) ? result.actions : [];
  const riskSignals = Array.isArray(result.riskSignals) ? result.riskSignals : [];

  // Extract projects for project-type results
  const projects = Array.isArray(data.projects) ? data.projects : [];

  // Build KPIs based on result type
  const kpis = useMemo(() => {
    const items = [];

    if (resultType === 'project') {
      if (typeof data.totalProjects === 'number') {
        items.push({ label: 'Total Projects', value: data.totalProjects, icon: '📊' });
      }
      if (typeof data.onTrack === 'number') {
        items.push({ label: 'On Track', value: data.onTrack, icon: '✅' });
      }
      if (typeof data.atRisk === 'number') {
        items.push({ label: 'At Risk', value: data.atRisk, icon: '⚠️' });
      }
      if (typeof data.critical === 'number') {
        items.push({ label: 'Critical', value: data.critical, icon: '🔴' });
      }
      if (typeof data.totalBudget === 'number') {
        items.push({ label: 'Total Budget', value: formatCurrency(data.totalBudget), icon: '💰' });
      }
      if (typeof data.budgetUtilizationPercent === 'number') {
        items.push({ label: 'Budget Used', value: `${data.budgetUtilizationPercent}%`, icon: '📋' });
      }
    } else if (resultType === 'sales') {
      if (typeof data.pipelineValue === 'number') {
        items.push({ label: 'Pipeline Value', value: formatCurrency(data.pipelineValue), icon: '📈' });
      }
      if (typeof data.activeOpportunities === 'number') {
        items.push({ label: 'Active Opportunities', value: data.activeOpportunities, icon: '💼' });
      }
      if (typeof data.winRate === 'number') {
        items.push({ label: 'Win Rate', value: formatPercent(data.winRate), icon: '🏆' });
      }
      if (typeof data.averageDealSize === 'number') {
        items.push({ label: 'Avg Deal Size', value: formatCurrency(data.averageDealSize), icon: '💰' });
      }
    } else if (resultType === 'procurement') {
      if (typeof data.totalContracts === 'number') {
        items.push({ label: 'Total Contracts', value: data.totalContracts, icon: '📋' });
      }
      if (typeof data.totalValue === 'number') {
        items.push({ label: 'Total Value', value: formatCurrency(data.totalValue), icon: '💰' });
      }
      if (typeof data.pendingRenewal === 'number') {
        items.push({ label: 'Pending Renewal', value: data.pendingRenewal, icon: '🔄' });
      }
      if (typeof data.ytdSpend === 'number') {
        items.push({ label: 'YTD Spend', value: formatCurrency(data.ytdSpend), icon: '💳' });
      }
    } else if (resultType === 'finance') {
      if (typeof data.currentCashPosition === 'number') {
        items.push({ label: 'Cash Position', value: formatCurrency(data.currentCashPosition), icon: '💰' });
      }
      if (typeof data.projectedQ1Position === 'number') {
        items.push({ label: 'Q1 Projected', value: formatCurrency(data.projectedQ1Position), icon: '📊' });
      }
      if (typeof data.netCashFlow === 'number') {
        items.push({ label: 'Net Cash Flow', value: formatCurrency(data.netCashFlow), icon: '📈' });
      }
      if (typeof data.totalBudget === 'number') {
        items.push({ label: 'Total Budget', value: formatCurrency(data.totalBudget), icon: '💳' });
      }
      if (typeof data.variancePercent === 'number') {
        items.push({ label: 'Variance', value: `${data.variancePercent}%`, icon: '📉' });
      }
    } else if (resultType === 'workforce') {
      if (typeof data.totalWorkforce === 'number') {
        items.push({ label: 'Total Workforce', value: data.totalWorkforce, icon: '👥' });
      }
      if (typeof data.utilizationRate === 'number') {
        items.push({ label: 'Utilization', value: formatPercent(data.utilizationRate), icon: '📊' });
      }
      if (typeof data.availableForReallocation === 'number') {
        items.push({ label: 'Available', value: data.availableForReallocation, icon: '🔄' });
      }
      if (typeof data.understaffedProjects === 'number') {
        items.push({ label: 'Understaffed', value: data.understaffedProjects, icon: '⚠️' });
      }
    } else if (resultType === 'knowledge') {
      if (typeof data.totalResults === 'number') {
        items.push({ label: 'Results Found', value: data.totalResults, icon: '🔍' });
      }
    }

    return items;
  }, [resultType, data]);

  // Overdue milestones for project type
  const overdueMilestones = Array.isArray(data.overdueMilestones) ? data.overdueMilestones : [];

  // Knowledge top results
  const topResults = Array.isArray(data.topResults) ? data.topResults : [];

  // Sales top opportunities
  const topOpportunities = Array.isArray(data.topOpportunities) ? data.topOpportunities : [];

  // Finance monthly forecast
  const monthlyForecast = Array.isArray(data.monthlyForecast) ? data.monthlyForecast : [];

  // Finance project variances
  const projectVariances = Array.isArray(data.projectVariances) ? data.projectVariances : [];

  // Workforce allocation
  const allocationByProject = Array.isArray(data.allocationByProject) ? data.allocationByProject : [];

  // Procurement pending renewals
  const pendingRenewals = Array.isArray(data.pendingRenewals) ? data.pendingRenewals : [];

  return (
    <div className="flex flex-col gap-5">
      {/* Summary */}
      {summary ? (
        <div className="flex items-start gap-3">
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-blue bg-opacity-20"
            aria-hidden="true"
          >
            🧠
          </span>
          <p className="text-sm text-primary-100 leading-relaxed">{summary}</p>
        </div>
      ) : null}

      {/* KPIs */}
      {kpis.length > 0 ? (
        <SummaryKPIs kpis={kpis} />
      ) : null}

      {/* Project-specific: Project table/cards/carousel */}
      {resultType === 'project' && projects.length > 0 ? (
        <div>
          <p className="text-xs text-primary-300 font-semibold uppercase tracking-wider mb-3">
            Projects
          </p>
          {isMobile ? (
            <ProjectCarousel projects={projects} />
          ) : isTablet ? (
            <ProjectCardStack projects={projects} />
          ) : (
            <ProjectTableDesktop projects={projects} />
          )}
        </div>
      ) : null}

      {/* Project-specific: Overdue milestones */}
      {resultType === 'project' && overdueMilestones.length > 0 ? (
        <div>
          <p className="text-xs text-primary-300 font-semibold uppercase tracking-wider mb-3">
            Overdue Milestones ({overdueMilestones.length})
          </p>
          <div className="flex flex-col gap-2">
            {overdueMilestones.map((ms, idx) => (
              <div
                key={ms.id || `ms-${idx}`}
                className="flex items-center justify-between px-3 py-2.5 rounded-glass-sm bg-glass-light border border-glass-border"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary-50 truncate">{ms.name}</p>
                  <p className="text-xs text-primary-300">{ms.projectName}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <span className="text-xs text-red-400 font-medium">
                    {ms.daysOverdue}d overdue
                  </span>
                  <span className={[
                    'text-xs px-1.5 py-0.5 rounded-full',
                    ms.impact === 'critical-path' ? 'bg-red-400 bg-opacity-15 text-red-400' : 'bg-glass-light text-primary-300',
                  ].join(' ')}>
                    {ms.impact === 'critical-path' ? 'Critical Path' : 'Non-Critical'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Sales-specific: Top opportunities */}
      {resultType === 'sales' && topOpportunities.length > 0 ? (
        <div>
          <p className="text-xs text-primary-300 font-semibold uppercase tracking-wider mb-3">
            Top Opportunities
          </p>
          <div className="flex flex-col gap-2">
            {topOpportunities.map((opp, idx) => (
              <div
                key={opp.id || `opp-${idx}`}
                className="flex items-center justify-between px-3 py-2.5 rounded-glass-sm bg-glass-light border border-glass-border"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary-50 truncate">{opp.name}</p>
                  <p className="text-xs text-primary-300">{opp.company} · {opp.stage}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <span className="text-sm font-semibold text-primary-100">
                    {formatCurrency(opp.value)}
                  </span>
                  <span className="text-xs text-primary-300">
                    {opp.probability}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Finance-specific: Monthly forecast */}
      {resultType === 'finance' && monthlyForecast.length > 0 ? (
        <div>
          <p className="text-xs text-primary-300 font-semibold uppercase tracking-wider mb-3">
            Monthly Forecast
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {monthlyForecast.map((month, idx) => (
              <div
                key={month.month || `month-${idx}`}
                className="glass-sm p-3"
              >
                <p className="text-xs text-primary-300 mb-2">{month.month}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-primary-300">Inflows</p>
                    <p className="text-sm font-medium text-green-400">{formatCurrency(month.inflows)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-primary-300">Outflows</p>
                    <p className="text-sm font-medium text-red-400">{formatCurrency(month.outflows)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-primary-300">Net</p>
                    <p className={[
                      'text-sm font-medium',
                      month.netFlow >= 0 ? 'text-green-400' : 'text-red-400',
                    ].join(' ')}>
                      {formatCurrency(month.netFlow)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Finance-specific: Project variances */}
      {resultType === 'finance' && projectVariances.length > 0 ? (
        <div>
          <p className="text-xs text-primary-300 font-semibold uppercase tracking-wider mb-3">
            Budget Variance by Project
          </p>
          <div className="flex flex-col gap-2">
            {projectVariances.map((pv, idx) => (
              <div
                key={pv.projectId || `pv-${idx}`}
                className="flex items-center justify-between px-3 py-2.5 rounded-glass-sm bg-glass-light border border-glass-border"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary-50 truncate">{pv.projectName}</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 ml-3">
                  <span className="text-xs text-primary-300">
                    Budget: {formatCurrency(pv.budget)}
                  </span>
                  <span className={[
                    'text-sm font-semibold',
                    pv.variance >= 0 ? 'text-green-400' : 'text-red-400',
                  ].join(' ')}>
                    {pv.variance >= 0 ? '+' : ''}{formatCurrency(pv.variance)}
                  </span>
                  <span className={[
                    'text-xs',
                    pv.variancePercent >= 0 ? 'text-green-400' : 'text-red-400',
                  ].join(' ')}>
                    ({pv.variancePercent >= 0 ? '+' : ''}{pv.variancePercent}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Workforce-specific: Allocation by project */}
      {resultType === 'workforce' && allocationByProject.length > 0 ? (
        <div>
          <p className="text-xs text-primary-300 font-semibold uppercase tracking-wider mb-3">
            Resource Allocation
          </p>
          <div className="flex flex-col gap-2">
            {allocationByProject.map((alloc, idx) => (
              <div
                key={alloc.projectId || `alloc-${idx}`}
                className="flex items-center justify-between px-3 py-2.5 rounded-glass-sm bg-glass-light border border-glass-border"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary-50 truncate">{alloc.projectName}</p>
                  {Array.isArray(alloc.criticalRoles) && alloc.criticalRoles.length > 0 ? (
                    <p className="text-xs text-amber-400 mt-0.5">
                      Needs: {alloc.criticalRoles.join(', ')}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <span className="text-xs text-primary-300">
                    {alloc.allocated}/{alloc.required}
                  </span>
                  <span className={[
                    'text-xs font-medium',
                    alloc.gap >= 0 ? 'text-green-400' : 'text-red-400',
                  ].join(' ')}>
                    {alloc.gap >= 0 ? '+' : ''}{alloc.gap}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Procurement-specific: Pending renewals */}
      {resultType === 'procurement' && pendingRenewals.length > 0 ? (
        <div>
          <p className="text-xs text-primary-300 font-semibold uppercase tracking-wider mb-3">
            Pending Renewals
          </p>
          <div className="flex flex-col gap-2">
            {pendingRenewals.map((renewal, idx) => (
              <div
                key={renewal.id || `renewal-${idx}`}
                className="flex items-center justify-between px-3 py-2.5 rounded-glass-sm bg-glass-light border border-glass-border"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary-50 truncate">{renewal.name}</p>
                  <p className="text-xs text-primary-300">{renewal.vendor}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <span className="text-sm font-medium text-primary-100">
                    {formatCurrency(renewal.value)}
                  </span>
                  <span className="text-xs text-primary-300">
                    {renewal.daysUntilExpiry}d left
                  </span>
                  <span className={[
                    'text-xs px-1.5 py-0.5 rounded-full capitalize',
                    renewal.recommendation === 'renew' ? 'bg-green-400 bg-opacity-15 text-green-400' :
                      'bg-amber-400 bg-opacity-15 text-amber-400',
                  ].join(' ')}>
                    {renewal.recommendation}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Knowledge-specific: Top results */}
      {resultType === 'knowledge' && topResults.length > 0 ? (
        <div>
          <p className="text-xs text-primary-300 font-semibold uppercase tracking-wider mb-3">
            Relevant Lessons Learned
          </p>
          <div className="flex flex-col gap-2">
            {topResults.map((lesson, idx) => (
              <div
                key={lesson.id || `lesson-${idx}`}
                className="glass-sm p-3"
              >
                <div className="flex items-start justify-between mb-1">
                  <h5 className="text-sm font-medium text-primary-50 flex-1 min-w-0 truncate">
                    {lesson.title}
                  </h5>
                  <span className="text-xs text-accent-blue flex-shrink-0 ml-2">
                    {formatPercent(lesson.relevanceScore)} match
                  </span>
                </div>
                <p className="text-xs text-primary-300 mb-1">{lesson.project} · {lesson.category}</p>
                <p className="text-xs text-primary-200 leading-relaxed">{lesson.summary}</p>
                {Array.isArray(lesson.tags) && lesson.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {lesson.tags.map((tag, tagIdx) => (
                      <span
                        key={`tag-${tagIdx}`}
                        className="text-xs px-1.5 py-0.5 rounded-full bg-glass-light text-primary-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Forecast type */}
      {resultType === 'forecast' ? (
        <ForecastRenderer forecast={result} />
      ) : null}

      {/* Generic data fallback */}
      {resultType === 'generic' && data && Object.keys(data).length > 0 ? (
        <GenericDataRenderer data={data} />
      ) : null}

      {/* Risk Signals */}
      {riskSignals.length > 0 ? (
        <div>
          <p className="text-xs text-primary-300 font-semibold uppercase tracking-wider mb-3">
            Risk Signals ({riskSignals.length})
          </p>
          <div className="flex flex-col gap-2">
            {riskSignals.map((signal, idx) => (
              <RiskSignalCard key={signal.id || `risk-${idx}`} signal={signal} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Sources */}
      {sources.length > 0 ? (
        <div>
          <p className="text-xs text-primary-300 font-semibold uppercase tracking-wider mb-2">
            Sources
          </p>
          <div className="flex flex-wrap gap-2">
            {sources.map((source, idx) => (
              <SourceBadge key={source.systemId || `source-${idx}`} source={source} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Actions */}
      {actions.length > 0 ? (
        <div>
          <p className="text-xs text-primary-300 font-semibold uppercase tracking-wider mb-2">
            Suggested Actions
          </p>
          <div className="flex flex-wrap gap-2">
            {actions.map((action, idx) => (
              <ActionButton
                key={action.id || `action-${idx}`}
                action={action}
                onActionClick={onActionClick}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

SingleResultRenderer.propTypes = {
  result: PropTypes.object.isRequired,
  isMobile: PropTypes.bool.isRequired,
  isTablet: PropTypes.bool.isRequired,
  onActionClick: PropTypes.func,
};

SingleResultRenderer.defaultProps = {
  onActionClick: undefined,
};

/**
 * ResultRenderer component.
 * Dynamic result rendering component that displays structured query results
 * as tables, risk signals, or forecast models based on result type.
 * Supports responsive layouts: full tables on desktop, stacked cards on
 * tablet, carousel on mobile.
 *
 * @param {Object} props
 * @param {Object|null} props.results - The orchestration result object from QueryContext
 * @param {boolean} [props.isLoading=false] - Whether results are currently loading
 * @param {Object|null} [props.error=null] - Error object if query failed
 * @param {string} [props.queryText=''] - The query text that produced these results
 * @param {number} [props.confidence=0] - Overall confidence score
 * @param {function} [props.onActionClick] - Handler for action button clicks
 * @param {function} [props.onNewQuery] - Handler for starting a new query
 * @param {string} [props.className=''] - Additional CSS classes
 * @returns {React.ReactElement} The result renderer component
 */
function ResultRenderer({
  results,
  isLoading,
  error,
  queryText,
  confidence,
  onActionClick,
  onNewQuery,
  className,
}) {
  const [isMobile, setIsMobile] = useState(getWindowWidth() < MOBILE_BREAKPOINT);
  const [isTablet, setIsTablet] = useState(
    getWindowWidth() >= MOBILE_BREAKPOINT && getWindowWidth() < TABLET_BREAKPOINT
  );

  /**
   * Handles window resize events to update responsive state
   */
  useEffect(() => {
    function handleResize() {
      const width = getWindowWidth();
      setIsMobile(width < MOBILE_BREAKPOINT);
      setIsTablet(width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  /**
   * Extracts the result items from the orchestration result
   */
  const resultItems = useMemo(() => {
    if (!results || typeof results !== 'object') {
      return [];
    }

    // Handle orchestration result structure
    if (results.aggregatedResults && Array.isArray(results.aggregatedResults.results)) {
      return results.aggregatedResults.results;
    }

    // Handle direct array
    if (Array.isArray(results)) {
      return results;
    }

    // Handle single result
    if (typeof results.clusterId === 'string' || typeof results.summary === 'string') {
      return [results];
    }

    return [];
  }, [results]);

  /**
   * Extracts summary statistics from the orchestration result
   */
  const summaryStats = useMemo(() => {
    if (!results || typeof results !== 'object') {
      return null;
    }

    if (results.aggregatedResults && results.aggregatedResults.summary) {
      return results.aggregatedResults.summary;
    }

    return null;
  }, [results]);

  /**
   * Extracts timing information from the orchestration result
   */
  const timing = useMemo(() => {
    if (!results || typeof results !== 'object') {
      return null;
    }

    if (results.timing && typeof results.timing.durationMs === 'number') {
      return results.timing;
    }

    return null;
  }, [results]);

  const handleNewQuery = useCallback(() => {
    if (typeof onNewQuery === 'function') {
      onNewQuery();
    }
  }, [onNewQuery]);

  const wrapperClassName = [
    'w-full',
    className || '',
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Loading state
  if (isLoading) {
    return (
      <div className={wrapperClassName}>
        <GlassCard variant="default" padding="lg" animated>
          <LoadingSpinner
            size="lg"
            message="Querying intelligence systems..."
            className="py-12"
          />
        </GlassCard>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={wrapperClassName}>
        <GlassCard variant="default" padding="lg" animated>
          <div className="flex flex-col items-center text-center py-8">
            <span className="text-3xl mb-4" aria-hidden="true">⚠️</span>
            <h3 className="text-lg font-semibold text-primary-50 mb-2">
              Query Error
            </h3>
            <p className="text-sm text-primary-200 mb-6 max-w-md">
              {error.message || 'An unexpected error occurred while processing your query.'}
            </p>
            {typeof onNewQuery === 'function' ? (
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
            ) : null}
          </div>
        </GlassCard>
      </div>
    );
  }

  // Empty state
  if (resultItems.length === 0) {
    return (
      <div className={wrapperClassName}>
        <GlassCard variant="default" padding="lg" animated>
          <div className="flex flex-col items-center text-center py-8">
            <span className="text-3xl mb-4" aria-hidden="true">🔍</span>
            <h3 className="text-lg font-semibold text-primary-50 mb-2">
              No Results Found
            </h3>
            <p className="text-sm text-primary-200 mb-6 max-w-md">
              {queryText
                ? `No results found for "${queryText}". Try rephrasing your query or asking about a different topic.`
                : 'Submit a query to see results here.'}
            </p>
            {typeof onNewQuery === 'function' ? (
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span>New Query</span>
              </button>
            ) : null}
          </div>
        </GlassCard>
      </div>
    );
  }

  // Results state
  return (
    <div className={wrapperClassName}>
      <AnimatedTransition show type="fade" duration="normal">
        <GlassCard variant="default" padding="lg" animated>
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <span
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 bg-accent-blue bg-opacity-20"
                aria-hidden="true"
              >
                📊
              </span>
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold text-primary-50 leading-tight">
                  Query Results
                </h2>
                {queryText ? (
                  <p className="text-sm text-primary-200 leading-tight mt-0.5 truncate max-w-xs sm:max-w-md">
                    &ldquo;{queryText}&rdquo;
                  </p>
                ) : null}
              </div>
            </div>

            {typeof onNewQuery === 'function' ? (
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-glass-sm text-xs font-medium text-primary-200 border border-glass-border hover:bg-glass-light hover:text-primary-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50 flex-shrink-0"
                onClick={handleNewQuery}
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span>New Query</span>
              </button>
            ) : null}
          </div>

          {/* Meta info bar */}
          <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-glass-border">
            {summaryStats ? (
              <>
                <span className="text-xs text-primary-300">
                  {summaryStats.totalSources} source{summaryStats.totalSources !== 1 ? 's' : ''}
                </span>
                <span className="text-xs text-primary-300">·</span>
                <span className="text-xs text-primary-300">
                  {resultItems.length} result{resultItems.length !== 1 ? 's' : ''}
                </span>
                {summaryStats.totalActions > 0 ? (
                  <>
                    <span className="text-xs text-primary-300">·</span>
                    <span className="text-xs text-primary-300">
                      {summaryStats.totalActions} action{summaryStats.totalActions !== 1 ? 's' : ''}
                    </span>
                  </>
                ) : null}
                {summaryStats.totalRiskSignals > 0 ? (
                  <>
                    <span className="text-xs text-primary-300">·</span>
                    <span className="text-xs text-amber-400">
                      {summaryStats.totalRiskSignals} risk signal{summaryStats.totalRiskSignals !== 1 ? 's' : ''}
                    </span>
                  </>
                ) : null}
              </>
            ) : null}
            {typeof confidence === 'number' && confidence > 0 ? (
              <>
                <span className="text-xs text-primary-300">·</span>
                <span className="text-xs text-primary-300">
                  Confidence: {formatPercent(confidence)}
                </span>
              </>
            ) : null}
            {timing ? (
              <>
                <span className="text-xs text-primary-300">·</span>
                <span className="text-xs text-primary-300">
                  {timing.durationMs}ms
                </span>
              </>
            ) : null}
          </div>

          {/* Result Items */}
          <div className="flex flex-col gap-8">
            {resultItems.map((result, index) => (
              <AnimatedTransition
                key={result.id || `result-${index}`}
                show
                type="slide-up"
                duration="normal"
                delay={index * 100}
              >
                <div>
                  {resultItems.length > 1 && index > 0 ? (
                    <div className="border-t border-glass-border mb-6" />
                  ) : null}
                  <SingleResultRenderer
                    result={result}
                    isMobile={isMobile}
                    isTablet={isTablet}
                    onActionClick={onActionClick}
                  />
                </div>
              </AnimatedTransition>
            ))}
          </div>
        </GlassCard>
      </AnimatedTransition>
    </div>
  );
}

ResultRenderer.propTypes = {
  results: PropTypes.object,
  isLoading: PropTypes.bool,
  error: PropTypes.object,
  queryText: PropTypes.string,
  confidence: PropTypes.number,
  onActionClick: PropTypes.func,
  onNewQuery: PropTypes.func,
  className: PropTypes.string,
};

ResultRenderer.defaultProps = {
  results: null,
  isLoading: false,
  error: null,
  queryText: '',
  confidence: 0,
  onActionClick: undefined,
  onNewQuery: undefined,
  className: '',
};

export default ResultRenderer;