/**
 * Source transparency panel showing enterprise system contribution indicators
 * for Ask Dreeso Memory. Displays green dot indicators for each system that
 * contributed to the current query result, along with system name, status,
 * and contribution level.
 *
 * @module SourceIndicatorPanel
 * @see SCRUM-7890
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import AnimatedTransition from '../ui/AnimatedTransition';
import GlassCard from '../ui/GlassCard';
import { getSourceTransparency, getActiveSourceCount, getOverallConfidence } from '../../services/SourceTransparencyEngine';

/**
 * Resolves the status dot color class based on system status and activity.
 *
 * @param {boolean} active - Whether the system contributed data
 * @param {string} status - Connection status ('connected', 'degraded', 'disconnected', 'unknown')
 * @returns {string} Tailwind background color class
 */
function getStatusDotColor(active, status) {
  if (!active) {
    return 'bg-primary-300 bg-opacity-40';
  }

  switch (status) {
    case 'connected':
      return 'bg-green-400';
    case 'degraded':
      return 'bg-amber-400';
    case 'disconnected':
      return 'bg-red-400';
    default:
      return 'bg-primary-300';
  }
}

/**
 * Resolves the status label text based on system status.
 *
 * @param {boolean} active - Whether the system contributed data
 * @param {string} status - Connection status
 * @returns {string} Human-readable status label
 */
function getStatusLabel(active, status) {
  if (!active) {
    return 'Not queried';
  }

  switch (status) {
    case 'connected':
      return 'Connected';
    case 'degraded':
      return 'Degraded';
    case 'disconnected':
      return 'Disconnected';
    default:
      return 'Unknown';
  }
}

/**
 * Resolves the contribution level badge classes.
 *
 * @param {string} contributionLevel - Contribution level ('high', 'medium', 'low', 'none')
 * @returns {string} Tailwind classes for the contribution badge
 */
function getContributionBadgeClasses(contributionLevel) {
  switch (contributionLevel) {
    case 'high':
      return 'bg-green-400 bg-opacity-15 text-green-400';
    case 'medium':
      return 'bg-amber-400 bg-opacity-15 text-amber-400';
    case 'low':
      return 'bg-primary-200 bg-opacity-15 text-primary-200';
    case 'none':
    default:
      return 'bg-glass-light text-primary-300';
  }
}

/**
 * Formats a confidence value as a percentage string.
 *
 * @param {number} confidence - Confidence value between 0 and 1
 * @returns {string} Formatted percentage string
 */
function formatConfidence(confidence) {
  if (typeof confidence !== 'number' || isNaN(confidence)) {
    return '0%';
  }
  if (confidence <= 1 && confidence >= 0) {
    return `${(confidence * 100).toFixed(0)}%`;
  }
  return `${confidence.toFixed(0)}%`;
}

/**
 * Formats a date string to a readable relative or absolute format.
 *
 * @param {string|null} dateStr - ISO date string or null
 * @returns {string} Formatted date string
 */
function formatLastSynced(dateStr) {
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
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * SystemIndicator sub-component.
 * Renders a single system's contribution indicator row.
 *
 * @param {Object} props
 * @param {Object} props.indicator - The source indicator object
 * @param {number} props.index - Index for staggered animation delay
 * @param {boolean} props.compact - Whether to render in compact mode
 * @returns {React.ReactElement} The system indicator element
 */
function SystemIndicator({ indicator, index, compact }) {
  if (!indicator || typeof indicator !== 'object') {
    return null;
  }

  const label = typeof indicator.label === 'string' ? indicator.label : 'Unknown';
  const active = Boolean(indicator.active);
  const status = typeof indicator.status === 'string' ? indicator.status : 'unknown';
  const contributionLevel = typeof indicator.contributionLevel === 'string' ? indicator.contributionLevel : 'none';
  const confidence = typeof indicator.confidence === 'number' ? indicator.confidence : 0;
  const resultCount = typeof indicator.resultCount === 'number' ? indicator.resultCount : 0;
  const lastSynced = typeof indicator.lastSynced === 'string' ? indicator.lastSynced : null;
  const dataType = typeof indicator.dataType === 'string' ? indicator.dataType : null;
  const color = typeof indicator.color === 'string' ? indicator.color : '#6B7280';

  const statusDotColor = getStatusDotColor(active, status);
  const statusLabel = getStatusLabel(active, status);
  const contributionBadgeClasses = getContributionBadgeClasses(contributionLevel);

  if (compact) {
    return (
      <AnimatedTransition
        show
        type="scale"
        duration="fast"
        delay={index * 60}
      >
        <div
          className={[
            'flex items-center gap-2 px-3 py-2 rounded-glass-sm',
            'transition-all duration-200',
            active ? 'bg-glass-light' : 'bg-transparent',
          ]
            .filter(Boolean)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim()}
          title={`${label}: ${statusLabel}${active ? ` · ${formatConfidence(confidence)} confidence` : ''}`}
        >
          {/* Status Dot */}
          <span
            className={[
              'w-2 h-2 rounded-full flex-shrink-0',
              statusDotColor,
              active && status === 'connected' ? 'animate-pulse' : '',
            ]
              .filter(Boolean)
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim()}
            aria-hidden="true"
          />

          {/* System Label */}
          <span
            className={[
              'text-xs font-medium truncate',
              active ? 'text-primary-100' : 'text-primary-300',
            ].join(' ')}
          >
            {label}
          </span>

          {/* Confidence */}
          {active ? (
            <span className="text-xs text-primary-300 flex-shrink-0 ml-auto">
              {formatConfidence(confidence)}
            </span>
          ) : null}
        </div>
      </AnimatedTransition>
    );
  }

  return (
    <AnimatedTransition
      show
      type="slide-up"
      duration="fast"
      delay={index * 80}
    >
      <div
        className={[
          'flex items-center gap-3 px-4 py-3 rounded-glass-sm border',
          'transition-all duration-300 ease-in-out',
          active
            ? 'bg-glass-light border-glass-border'
            : 'bg-transparent border-transparent',
        ]
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()}
      >
        {/* Status Dot and System Color Indicator */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className={[
              'w-2.5 h-2.5 rounded-full flex-shrink-0',
              statusDotColor,
              active && status === 'connected' ? 'animate-pulse' : '',
            ]
              .filter(Boolean)
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim()}
            aria-hidden="true"
          />
          <span
            className="w-1 h-6 rounded-full flex-shrink-0"
            style={{ backgroundColor: active ? color : 'rgba(255,255,255,0.05)' }}
            aria-hidden="true"
          />
        </div>

        {/* System Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={[
                'text-sm font-medium truncate',
                active ? 'text-primary-50' : 'text-primary-300',
              ].join(' ')}
            >
              {label}
            </span>
            {active && contributionLevel !== 'none' ? (
              <span
                className={[
                  'text-xs px-1.5 py-0.5 rounded-full capitalize flex-shrink-0',
                  contributionBadgeClasses,
                ].join(' ')}
              >
                {contributionLevel}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-primary-300">
              {statusLabel}
            </span>
            {active && dataType ? (
              <>
                <span className="text-xs text-primary-300">·</span>
                <span className="text-xs text-primary-300 truncate">
                  {dataType}
                </span>
              </>
            ) : null}
          </div>
        </div>

        {/* Right Side: Confidence and Result Count */}
        {active ? (
          <div className="flex flex-col items-end flex-shrink-0">
            <span className="text-sm font-semibold text-primary-100">
              {formatConfidence(confidence)}
            </span>
            <span className="text-xs text-primary-300">
              {resultCount} result{resultCount !== 1 ? 's' : ''}
            </span>
          </div>
        ) : (
          <div className="flex items-center flex-shrink-0">
            <span className="text-xs text-primary-300">
              {lastSynced ? `Last: ${formatLastSynced(lastSynced)}` : '—'}
            </span>
          </div>
        )}
      </div>
    </AnimatedTransition>
  );
}

SystemIndicator.propTypes = {
  indicator: PropTypes.object.isRequired,
  index: PropTypes.number,
  compact: PropTypes.bool,
};

SystemIndicator.defaultProps = {
  index: 0,
  compact: false,
};

/**
 * SourceIndicatorPanel component.
 * Displays a source transparency panel showing green dot indicators for each
 * enterprise system that contributed to the current query result. Shows system
 * name, connection status, contribution level, confidence score, and result count.
 *
 * Supports two display modes:
 * - Full mode (default): detailed cards with contribution badges and data types
 * - Compact mode: minimal inline indicators suitable for headers or sidebars
 *
 * @param {Object} props
 * @param {Object|Object[]|null} [props.queryResult=null] - The query result to analyze for source transparency
 * @param {boolean} [props.compact=false] - Whether to render in compact mode
 * @param {boolean} [props.showHeader=true] - Whether to show the section header
 * @param {boolean} [props.showSummary=true] - Whether to show the summary bar
 * @param {boolean} [props.showInactive=true] - Whether to show inactive (non-contributing) systems
 * @param {string} [props.className=''] - Additional CSS classes to apply to the wrapper
 * @returns {React.ReactElement|null} The source indicator panel, or null if no query result
 */
function SourceIndicatorPanel({ queryResult, compact, showHeader, showSummary, showInactive, className }) {
  /**
   * Resolves source transparency indicators from the query result
   */
  const indicators = useMemo(() => {
    if (!queryResult) {
      return [];
    }
    return getSourceTransparency(queryResult);
  }, [queryResult]);

  /**
   * Separates active and inactive indicators
   */
  const activeIndicators = useMemo(() => {
    return indicators.filter((ind) => ind.active);
  }, [indicators]);

  const inactiveIndicators = useMemo(() => {
    return indicators.filter((ind) => !ind.active);
  }, [indicators]);

  /**
   * Calculates summary statistics
   */
  const activeCount = useMemo(() => {
    if (!queryResult) {
      return 0;
    }
    return getActiveSourceCount(queryResult);
  }, [queryResult]);

  const overallConfidence = useMemo(() => {
    if (!queryResult) {
      return 0;
    }
    return getOverallConfidence(queryResult);
  }, [queryResult]);

  // Do not render if there are no indicators
  if (!Array.isArray(indicators) || indicators.length === 0) {
    return null;
  }

  const wrapperClassName = [
    'w-full',
    className || '',
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Compact mode rendering
  if (compact) {
    return (
      <AnimatedTransition show type="fade" duration="fast">
        <div className={wrapperClassName}>
          {showHeader ? (
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-xs bg-accent-teal bg-opacity-20"
                aria-hidden="true"
              >
                🖥️
              </span>
              <p className="text-xs text-primary-300 font-semibold uppercase tracking-wider">
                Sources
              </p>
              {activeCount > 0 ? (
                <span className="text-xs text-primary-300">
                  ({activeCount} active)
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-1">
            {activeIndicators.map((indicator, index) => (
              <SystemIndicator
                key={indicator.system || `source-compact-${index}`}
                indicator={indicator}
                index={index}
                compact
              />
            ))}
            {showInactive ? inactiveIndicators.map((indicator, index) => (
              <SystemIndicator
                key={indicator.system || `source-compact-inactive-${index}`}
                indicator={indicator}
                index={activeIndicators.length + index}
                compact
              />
            )) : null}
          </div>
        </div>
      </AnimatedTransition>
    );
  }

  // Full mode rendering
  return (
    <AnimatedTransition show type="slide-up" duration="normal">
      <div className={wrapperClassName}>
        <GlassCard variant="sm" padding="md" animated>
          {/* Header */}
          {showHeader ? (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-teal bg-opacity-20"
                  aria-hidden="true"
                >
                  🖥️
                </span>
                <div className="flex flex-col">
                  <h3 className="text-sm font-semibold text-primary-50 leading-tight">
                    Source Systems
                  </h3>
                  <p className="text-xs text-primary-300 leading-tight">
                    Enterprise systems contributing to this result
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Summary Bar */}
          {showSummary && activeCount > 0 ? (
            <div className="flex flex-wrap items-center gap-3 mb-4 pb-3 border-b border-glass-border">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full bg-green-400 animate-pulse"
                  aria-hidden="true"
                />
                <span className="text-xs text-primary-200">
                  {activeCount} system{activeCount !== 1 ? 's' : ''} active
                </span>
              </div>
              <span className="text-xs text-primary-300">·</span>
              <span className="text-xs text-primary-200">
                {indicators.length} total
              </span>
              {overallConfidence > 0 ? (
                <>
                  <span className="text-xs text-primary-300">·</span>
                  <span className="text-xs text-primary-200">
                    Avg confidence: {formatConfidence(overallConfidence)}
                  </span>
                </>
              ) : null}
            </div>
          ) : null}

          {/* Active Systems */}
          {activeIndicators.length > 0 ? (
            <div className="flex flex-col gap-2">
              {activeIndicators.map((indicator, index) => (
                <SystemIndicator
                  key={indicator.system || `source-active-${index}`}
                  indicator={indicator}
                  index={index}
                  compact={false}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-4">
              <p className="text-xs text-primary-300">
                No systems contributed to this result.
              </p>
            </div>
          )}

          {/* Inactive Systems */}
          {showInactive && inactiveIndicators.length > 0 ? (
            <div className="mt-3 pt-3 border-t border-glass-border">
              <p className="text-xs text-primary-300 font-medium uppercase tracking-wider mb-2 px-1">
                Not Queried
              </p>
              <div className="flex flex-col gap-1.5">
                {inactiveIndicators.map((indicator, index) => (
                  <SystemIndicator
                    key={indicator.system || `source-inactive-${index}`}
                    indicator={indicator}
                    index={activeIndicators.length + index}
                    compact={false}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </GlassCard>
      </div>
    </AnimatedTransition>
  );
}

SourceIndicatorPanel.propTypes = {
  queryResult: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array,
  ]),
  compact: PropTypes.bool,
  showHeader: PropTypes.bool,
  showSummary: PropTypes.bool,
  showInactive: PropTypes.bool,
  className: PropTypes.string,
};

SourceIndicatorPanel.defaultProps = {
  queryResult: null,
  compact: false,
  showHeader: true,
  showSummary: true,
  showInactive: true,
  className: '',
};

export default SourceIndicatorPanel;