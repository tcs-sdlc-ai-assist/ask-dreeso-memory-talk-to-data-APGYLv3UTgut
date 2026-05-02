/**
 * Forecast data visualization component for Ask Dreeso Memory.
 * Renders simple visual representations of forecast data using
 * CSS-based visualizations including bar indicators, trend arrows,
 * and percentage displays. No external charting library required.
 *
 * @module ForecastChart
 * @see SCRUM-7892
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import GlassCard from './GlassCard';
import AnimatedTransition from './AnimatedTransition';

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
 * @param {number} value - The numeric value (0-1 or 0-100)
 * @returns {string} Formatted percentage string
 */
function formatPercent(value) {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%';
  }
  if (value <= 1 && value >= -1) {
    return `${(value * 100).toFixed(0)}%`;
  }
  return `${value.toFixed(0)}%`;
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
 * Resolves a trend direction to an arrow indicator.
 * @param {string} trend - The trend direction ('up', 'down', 'stable', 'rising', 'declining')
 * @returns {{ icon: string, color: string, label: string }} Trend indicator properties
 */
function getTrendIndicator(trend) {
  switch (trend) {
    case 'up':
    case 'rising':
      return { icon: '↑', color: 'text-green-400', label: 'Rising' };
    case 'down':
    case 'declining':
      return { icon: '↓', color: 'text-red-400', label: 'Declining' };
    case 'stable':
      return { icon: '→', color: 'text-primary-200', label: 'Stable' };
    default:
      return { icon: '→', color: 'text-primary-300', label: 'Unknown' };
  }
}

/**
 * Resolves an urgency level to color classes.
 * @param {string} urgency - The urgency level ('high', 'medium', 'low')
 * @returns {{ bg: string, text: string }} Tailwind classes for the urgency badge
 */
function getUrgencyClasses(urgency) {
  switch (urgency) {
    case 'high':
      return { bg: 'bg-red-400 bg-opacity-15', text: 'text-red-400' };
    case 'medium':
      return { bg: 'bg-amber-400 bg-opacity-15', text: 'text-amber-400' };
    case 'low':
      return { bg: 'bg-green-400 bg-opacity-15', text: 'text-green-400' };
    default:
      return { bg: 'bg-glass-light', text: 'text-primary-300' };
  }
}

/**
 * Resolves a confidence value to a color class for the bar.
 * @param {number} confidence - Confidence value between 0 and 1
 * @returns {string} Tailwind background color class
 */
function getConfidenceBarColor(confidence) {
  if (typeof confidence !== 'number' || isNaN(confidence)) {
    return 'bg-primary-300';
  }
  const pct = confidence <= 1 ? confidence * 100 : confidence;
  if (pct >= 80) {
    return 'bg-green-400';
  }
  if (pct >= 60) {
    return 'bg-accent-blue';
  }
  if (pct >= 40) {
    return 'bg-amber-400';
  }
  return 'bg-red-400';
}

/**
 * Normalizes a confidence value to a percentage (0-100).
 * @param {number} value - Confidence value (0-1 or 0-100)
 * @returns {number} Normalized percentage value
 */
function normalizeConfidence(value) {
  if (typeof value !== 'number' || isNaN(value)) {
    return 0;
  }
  if (value <= 1 && value >= 0) {
    return value * 100;
  }
  return Math.max(0, Math.min(100, value));
}

/**
 * ConfidenceBar sub-component.
 * Renders a horizontal bar indicating confidence level.
 *
 * @param {Object} props
 * @param {number} props.value - Confidence value (0-1)
 * @param {string} [props.label] - Optional label text
 * @returns {React.ReactElement} The confidence bar element
 */
function ConfidenceBar({ value, label }) {
  const pct = normalizeConfidence(value);
  const barColor = getConfidenceBarColor(value);

  return (
    <div className="flex items-center gap-2 w-full">
      {label ? (
        <span className="text-xs text-primary-300 flex-shrink-0 min-w-[60px]">
          {label}
        </span>
      ) : null}
      <div className="flex-1 h-2 rounded-full bg-glass-light overflow-hidden">
        <div
          className={[
            'h-full rounded-full transition-all duration-700 ease-out',
            barColor,
          ].join(' ')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-primary-200 flex-shrink-0 w-10 text-right">
        {formatPercent(value)}
      </span>
    </div>
  );
}

ConfidenceBar.propTypes = {
  value: PropTypes.number.isRequired,
  label: PropTypes.string,
};

ConfidenceBar.defaultProps = {
  label: undefined,
};

/**
 * TrendArrow sub-component.
 * Renders a trend direction arrow with color coding.
 *
 * @param {Object} props
 * @param {string} props.trend - Trend direction ('up', 'down', 'stable', 'rising', 'declining')
 * @param {number} [props.changePercent] - Optional percentage change value
 * @returns {React.ReactElement} The trend arrow element
 */
function TrendArrow({ trend, changePercent }) {
  const indicator = getTrendIndicator(trend);
  const hasChange = typeof changePercent === 'number' && !isNaN(changePercent);

  return (
    <span className={['inline-flex items-center gap-1 text-sm font-semibold', indicator.color].join(' ')}>
      <span aria-hidden="true">{indicator.icon}</span>
      {hasChange ? (
        <span className="text-xs">
          {changePercent > 0 ? '+' : ''}{changePercent}%
        </span>
      ) : (
        <span className="text-xs">{indicator.label}</span>
      )}
    </span>
  );
}

TrendArrow.propTypes = {
  trend: PropTypes.string.isRequired,
  changePercent: PropTypes.number,
};

TrendArrow.defaultProps = {
  changePercent: undefined,
};

/**
 * BarChart sub-component.
 * Renders a simple vertical bar chart using CSS.
 *
 * @param {Object} props
 * @param {Array<{ label: string, value: number, color?: string }>} props.bars - Array of bar data objects
 * @param {number} [props.maxValue] - Optional maximum value for scaling
 * @param {string} [props.valuePrefix=''] - Prefix for value display (e.g., '€')
 * @param {boolean} [props.showValues=true] - Whether to show values above bars
 * @returns {React.ReactElement|null} The bar chart element
 */
function BarChart({ bars, maxValue, valuePrefix, showValues }) {
  if (!Array.isArray(bars) || bars.length === 0) {
    return null;
  }

  const resolvedMax = typeof maxValue === 'number' && maxValue > 0
    ? maxValue
    : Math.max(...bars.map((b) => (typeof b.value === 'number' ? Math.abs(b.value) : 0)), 1);

  return (
    <div className="flex items-end gap-2 h-32 w-full">
      {bars.map((bar, index) => {
        const value = typeof bar.value === 'number' ? bar.value : 0;
        const heightPct = Math.max(4, (Math.abs(value) / resolvedMax) * 100);
        const barColor = typeof bar.color === 'string' ? bar.color : 'bg-accent-blue';
        const label = typeof bar.label === 'string' ? bar.label : `Bar ${index + 1}`;

        return (
          <div
            key={`bar-${index}`}
            className="flex flex-col items-center gap-1 flex-1 min-w-0"
          >
            {showValues ? (
              <span className="text-xs text-primary-200 truncate max-w-full text-center">
                {valuePrefix || ''}{typeof value === 'number' ? value.toLocaleString() : '0'}
              </span>
            ) : null}
            <div className="w-full flex justify-center">
              <div
                className={[
                  'w-full max-w-[40px] rounded-t-sm transition-all duration-700 ease-out',
                  barColor,
                ].join(' ')}
                style={{ height: `${heightPct}%`, minHeight: '4px' }}
                title={`${label}: ${valuePrefix || ''}${value.toLocaleString()}`}
              />
            </div>
            <span className="text-xs text-primary-300 truncate max-w-full text-center">
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

BarChart.propTypes = {
  bars: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.number,
      color: PropTypes.string,
    })
  ).isRequired,
  maxValue: PropTypes.number,
  valuePrefix: PropTypes.string,
  showValues: PropTypes.bool,
};

BarChart.defaultProps = {
  maxValue: undefined,
  valuePrefix: '',
  showValues: true,
};

/**
 * QuarterlyProjectionSection sub-component.
 * Renders quarterly projection data as bar indicators with confidence.
 *
 * @param {Object} props
 * @param {Array} props.projections - Array of quarterly projection objects
 * @returns {React.ReactElement|null} The quarterly projection section
 */
function QuarterlyProjectionSection({ projections }) {
  if (!Array.isArray(projections) || projections.length === 0) {
    return null;
  }

  const maxProjected = Math.max(
    ...projections.map((q) => (typeof q.projected === 'number' ? q.projected : 0)),
    1
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-primary-300 font-semibold uppercase tracking-wider">
        Quarterly Projection
      </p>
      <div className="flex flex-col gap-2">
        {projections.map((q, idx) => {
          const quarter = typeof q.quarter === 'string' ? q.quarter : `Q${idx + 1}`;
          const projected = typeof q.projected === 'number' ? q.projected : 0;
          const confidence = typeof q.confidence === 'number' ? q.confidence : 0;
          const widthPct = Math.max(8, (projected / maxProjected) * 100);
          const barColor = getConfidenceBarColor(confidence);

          return (
            <div
              key={quarter}
              className="flex items-center gap-3"
            >
              <span className="text-xs text-primary-300 flex-shrink-0 w-16">
                {quarter}
              </span>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-5 rounded-glass-sm bg-glass-light overflow-hidden relative">
                  <div
                    className={[
                      'h-full rounded-glass-sm transition-all duration-700 ease-out flex items-center justify-end pr-2',
                      barColor,
                    ].join(' ')}
                    style={{ width: `${widthPct}%` }}
                  >
                    {widthPct > 30 ? (
                      <span className="text-xs font-medium text-white truncate">
                        {formatCurrency(projected)}
                      </span>
                    ) : null}
                  </div>
                  {widthPct <= 30 ? (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-primary-200">
                      {formatCurrency(projected)}
                    </span>
                  ) : null}
                </div>
                <span className="text-xs text-primary-300 flex-shrink-0 w-10 text-right">
                  {formatPercent(confidence)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

QuarterlyProjectionSection.propTypes = {
  projections: PropTypes.array.isRequired,
};

/**
 * HiringNeedsSection sub-component.
 * Renders hiring needs data with urgency indicators.
 *
 * @param {Object} props
 * @param {Array} props.needs - Array of hiring need objects
 * @returns {React.ReactElement|null} The hiring needs section
 */
function HiringNeedsSection({ needs }) {
  if (!Array.isArray(needs) || needs.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-primary-300 font-semibold uppercase tracking-wider">
        Hiring Needs
      </p>
      <div className="flex flex-col gap-1.5">
        {needs.map((need, idx) => {
          const role = typeof need.role === 'string' ? need.role : `Role ${idx + 1}`;
          const count = typeof need.count === 'number' ? need.count : 0;
          const urgency = typeof need.urgency === 'string' ? need.urgency : 'medium';
          const byDate = typeof need.byDate === 'string' ? need.byDate : '';
          const urgencyClasses = getUrgencyClasses(urgency);

          return (
            <div
              key={`hire-${idx}`}
              className="flex items-center justify-between px-3 py-2 rounded-glass-sm bg-glass-light"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm text-primary-100 truncate">{role}</span>
                <span
                  className={[
                    'text-xs px-1.5 py-0.5 rounded-full capitalize flex-shrink-0',
                    urgencyClasses.bg,
                    urgencyClasses.text,
                  ].join(' ')}
                >
                  {urgency}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-primary-300 flex-shrink-0">
                <span className="font-medium text-primary-200">{count} needed</span>
                {byDate ? (
                  <span>by {formatDate(byDate)}</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

HiringNeedsSection.propTypes = {
  needs: PropTypes.array.isRequired,
};

/**
 * MaterialTrendsSection sub-component.
 * Renders material cost trends with trend arrows.
 *
 * @param {Object} props
 * @param {Array} props.trends - Array of material trend objects
 * @returns {React.ReactElement|null} The material trends section
 */
function MaterialTrendsSection({ trends }) {
  if (!Array.isArray(trends) || trends.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-primary-300 font-semibold uppercase tracking-wider">
        Material Trends
      </p>
      <div className="flex flex-col gap-1.5">
        {trends.map((material, idx) => {
          const name = typeof material.material === 'string' ? material.material : `Material ${idx + 1}`;
          const currentPrice = typeof material.currentPrice === 'number' ? material.currentPrice : 0;
          const unit = typeof material.unit === 'string' ? material.unit : '';
          const trend = typeof material.trend === 'string' ? material.trend : 'stable';
          const changePercent = typeof material.changePercent === 'number' ? material.changePercent : 0;

          return (
            <div
              key={`mat-${idx}`}
              className="flex items-center justify-between px-3 py-2 rounded-glass-sm bg-glass-light"
            >
              <span className="text-sm text-primary-100 truncate flex-1 min-w-0">{name}</span>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-primary-200">
                  {currentPrice.toLocaleString()} {unit}
                </span>
                <TrendArrow trend={trend} changePercent={changePercent} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

MaterialTrendsSection.propTypes = {
  trends: PropTypes.array.isRequired,
};

/**
 * RevenueOverview sub-component.
 * Renders revenue forecast overview with KPI cards and bar chart.
 *
 * @param {Object} props
 * @param {Object} props.data - Revenue forecast data object
 * @returns {React.ReactElement|null} The revenue overview section
 */
function RevenueOverview({ data }) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const currentYear = data.currentYear && typeof data.currentYear === 'object' ? data.currentYear : null;
  const nextYear = data.nextYear && typeof data.nextYear === 'object' ? data.nextYear : null;

  const kpis = [];

  if (currentYear) {
    if (typeof currentYear.projected === 'number') {
      kpis.push({ label: 'Projected', value: formatCurrency(currentYear.projected), icon: '📊' });
    }
    if (typeof currentYear.actual === 'number') {
      kpis.push({ label: 'Actual', value: formatCurrency(currentYear.actual), icon: '✅' });
    }
    if (typeof currentYear.remaining === 'number') {
      kpis.push({ label: 'Remaining', value: formatCurrency(currentYear.remaining), icon: '⏳' });
    }
    if (typeof currentYear.onTrackPercent === 'number') {
      kpis.push({ label: 'On Track', value: `${currentYear.onTrackPercent}%`, icon: '🎯' });
    }
  }

  const nextYearBars = [];
  if (nextYear) {
    if (typeof nextYear.worstCase === 'number') {
      nextYearBars.push({ label: 'Worst', value: nextYear.worstCase, color: 'bg-red-400 bg-opacity-60' });
    }
    if (typeof nextYear.projected === 'number') {
      nextYearBars.push({ label: 'Projected', value: nextYear.projected, color: 'bg-accent-blue' });
    }
    if (typeof nextYear.bestCase === 'number') {
      nextYearBars.push({ label: 'Best', value: nextYear.bestCase, color: 'bg-green-400' });
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Current Year KPIs */}
      {kpis.length > 0 ? (
        <div>
          <p className="text-xs text-primary-300 font-semibold uppercase tracking-wider mb-3">
            Current Year
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {kpis.map((kpi, index) => (
              <div
                key={`kpi-${index}`}
                className="glass-sm p-3 flex flex-col items-center text-center"
              >
                <span className="text-lg mb-1" aria-hidden="true">{kpi.icon}</span>
                <span className="text-lg font-bold text-primary-50">{kpi.value}</span>
                <span className="text-xs text-primary-300 mt-0.5">{kpi.label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Next Year Scenario Bars */}
      {nextYearBars.length > 0 ? (
        <div>
          <p className="text-xs text-primary-300 font-semibold uppercase tracking-wider mb-3">
            Next Year Scenarios
          </p>
          <div className="flex flex-col gap-2">
            {nextYearBars.map((bar, idx) => {
              const maxVal = nextYearBars.reduce((max, b) => Math.max(max, Math.abs(b.value)), 1);
              const widthPct = Math.max(10, (Math.abs(bar.value) / maxVal) * 100);

              return (
                <div key={`scenario-${idx}`} className="flex items-center gap-3">
                  <span className="text-xs text-primary-300 flex-shrink-0 w-16">
                    {bar.label}
                  </span>
                  <div className="flex-1 h-6 rounded-glass-sm bg-glass-light overflow-hidden relative">
                    <div
                      className={[
                        'h-full rounded-glass-sm transition-all duration-700 ease-out flex items-center justify-end pr-2',
                        bar.color,
                      ].join(' ')}
                      style={{ width: `${widthPct}%` }}
                    >
                      {widthPct > 25 ? (
                        <span className="text-xs font-medium text-white truncate">
                          {formatCurrency(bar.value)}
                        </span>
                      ) : null}
                    </div>
                    {widthPct <= 25 ? (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-primary-200">
                        {formatCurrency(bar.value)}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

RevenueOverview.propTypes = {
  data: PropTypes.object.isRequired,
};

/**
 * ForecastChart component.
 * Renders forecast model data as CSS-based visualizations including
 * bar indicators, trend arrows, confidence bars, and percentage displays.
 * Supports revenue, workforce, and procurement forecast types.
 *
 * @param {Object} props
 * @param {Object} props.forecast - The forecast model object
 * @param {string} [props.forecast.id] - Unique forecast identifier
 * @param {string} [props.forecast.name] - Forecast display name
 * @param {string} [props.forecast.type] - Forecast type ('revenue', 'workforce', 'procurement')
 * @param {number} [props.forecast.confidence] - Overall confidence score (0-1)
 * @param {string} [props.forecast.lastUpdated] - ISO timestamp of last update
 * @param {Object} [props.forecast.data] - Forecast-specific data
 * @param {boolean} [props.showHeader=true] - Whether to show the section header
 * @param {boolean} [props.showConfidence=true] - Whether to show the confidence indicator
 * @param {boolean} [props.compact=false] - Whether to render in compact mode
 * @param {boolean} [props.animated=true] - Whether to apply entrance animation
 * @param {string} [props.className=''] - Additional CSS classes to apply
 * @returns {React.ReactElement|null} The forecast chart component, or null if forecast is invalid
 */
function ForecastChart({
  forecast,
  showHeader,
  showConfidence,
  compact,
  animated,
  className,
}) {
  // Validate forecast
  if (!forecast || typeof forecast !== 'object') {
    return null;
  }

  const name = typeof forecast.name === 'string' ? forecast.name : 'Forecast';
  const type = typeof forecast.type === 'string' ? forecast.type : 'generic';
  const confidence = typeof forecast.confidence === 'number' ? forecast.confidence : 0;
  const lastUpdated = typeof forecast.lastUpdated === 'string' ? forecast.lastUpdated : null;
  const data = forecast.data && typeof forecast.data === 'object' ? forecast.data : {};

  /**
   * Resolves the forecast type icon
   */
  const typeIcon = useMemo(() => {
    switch (type) {
      case 'revenue':
        return '📈';
      case 'workforce':
        return '👥';
      case 'procurement':
        return '📋';
      default:
        return '📊';
    }
  }, [type]);

  /**
   * Resolves quarterly projections
   */
  const quarterlyProjections = useMemo(() => {
    if (Array.isArray(data.quarterlyProjection) && data.quarterlyProjection.length > 0) {
      return data.quarterlyProjection;
    }
    return [];
  }, [data.quarterlyProjection]);

  /**
   * Resolves hiring needs
   */
  const hiringNeeds = useMemo(() => {
    if (Array.isArray(data.hiringNeeds) && data.hiringNeeds.length > 0) {
      return data.hiringNeeds;
    }
    return [];
  }, [data.hiringNeeds]);

  /**
   * Resolves material trends
   */
  const materialTrends = useMemo(() => {
    if (Array.isArray(data.materialTrends) && data.materialTrends.length > 0) {
      return data.materialTrends;
    }
    return [];
  }, [data.materialTrends]);

  /**
   * Determines if there is any data to display
   */
  const hasData = useMemo(() => {
    return (
      quarterlyProjections.length > 0 ||
      hiringNeeds.length > 0 ||
      materialTrends.length > 0 ||
      (type === 'revenue' && (data.currentYear || data.nextYear)) ||
      (type === 'workforce' && (typeof data.currentHeadcount === 'number' || typeof data.projectedQ1 === 'number')) ||
      (type === 'procurement' && (typeof data.currentSpend === 'number' || typeof data.projectedYearEnd === 'number'))
    );
  }, [quarterlyProjections, hiringNeeds, materialTrends, type, data]);

  const wrapperClassName = [
    'w-full',
    className || '',
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Empty state
  if (!hasData) {
    const emptyContent = (
      <div className={wrapperClassName}>
        <GlassCard variant="sm" padding="md" animated={animated}>
          <div className="flex flex-col items-center text-center py-6">
            <span className="text-2xl mb-3" aria-hidden="true">📊</span>
            <h3 className="text-sm font-semibold text-primary-50 mb-1">
              No Forecast Data
            </h3>
            <p className="text-xs text-primary-200 max-w-xs">
              No forecast data is available for display.
            </p>
          </div>
        </GlassCard>
      </div>
    );

    if (animated) {
      return (
        <AnimatedTransition show type="fade" duration="normal">
          {emptyContent}
        </AnimatedTransition>
      );
    }

    return emptyContent;
  }

  // Build workforce KPIs
  const workforceKpis = useMemo(() => {
    if (type !== 'workforce') {
      return [];
    }
    const items = [];
    if (typeof data.currentHeadcount === 'number') {
      items.push({ label: 'Current', value: data.currentHeadcount, icon: '👥' });
    }
    if (typeof data.projectedQ1 === 'number') {
      items.push({ label: 'Q1 Projected', value: data.projectedQ1, icon: '📊' });
    }
    if (typeof data.projectedQ2 === 'number') {
      items.push({ label: 'Q2 Projected', value: data.projectedQ2, icon: '📈' });
    }
    if (data.peakDemand && typeof data.peakDemand.headcount === 'number') {
      items.push({ label: 'Peak Demand', value: data.peakDemand.headcount, icon: '🔝' });
    }
    return items;
  }, [type, data]);

  // Build procurement KPIs
  const procurementKpis = useMemo(() => {
    if (type !== 'procurement') {
      return [];
    }
    const items = [];
    if (typeof data.currentSpend === 'number') {
      items.push({ label: 'Current Spend', value: formatCurrency(data.currentSpend), icon: '💳' });
    }
    if (typeof data.projectedYearEnd === 'number') {
      items.push({ label: 'Year-End Projected', value: formatCurrency(data.projectedYearEnd), icon: '📊' });
    }
    if (typeof data.budgetedYearEnd === 'number') {
      items.push({ label: 'Budgeted', value: formatCurrency(data.budgetedYearEnd), icon: '💰' });
    }
    if (typeof data.overrunProjected === 'number') {
      items.push({
        label: 'Overrun',
        value: formatCurrency(data.overrunProjected),
        icon: data.overrunProjected > 0 ? '⚠️' : '✅',
      });
    }
    return items;
  }, [type, data]);

  const content = (
    <div className={wrapperClassName}>
      <GlassCard variant="sm" padding={compact ? 'sm' : 'md'} animated={false}>
        {/* Header */}
        {showHeader ? (
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-blue bg-opacity-20"
                aria-hidden="true"
              >
                {typeIcon}
              </span>
              <div className="flex flex-col">
                <h3 className="text-sm font-semibold text-primary-50 leading-tight">
                  {name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-primary-300 capitalize">
                    {type.replace(/[-_]/g, ' ')} forecast
                  </span>
                  {lastUpdated ? (
                    <>
                      <span className="text-xs text-primary-300">·</span>
                      <span className="text-xs text-primary-300">
                        Updated {formatDate(lastUpdated)}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Confidence Indicator */}
        {showConfidence && confidence > 0 ? (
          <div className="mb-4">
            <ConfidenceBar value={confidence} label="Confidence" />
          </div>
        ) : null}

        {/* Revenue-specific content */}
        {type === 'revenue' ? (
          <div className="flex flex-col gap-5">
            <RevenueOverview data={data} />
          </div>
        ) : null}

        {/* Workforce-specific KPIs */}
        {type === 'workforce' && workforceKpis.length > 0 ? (
          <div className="mb-4">
            <p className="text-xs text-primary-300 font-semibold uppercase tracking-wider mb-3">
              Headcount Overview
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {workforceKpis.map((kpi, index) => (
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
            {data.peakDemand && typeof data.peakDemand.month === 'string' ? (
              <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-glass-sm bg-amber-400 bg-opacity-10 border border-amber-400 border-opacity-20">
                <svg
                  className="w-4 h-4 text-amber-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                <p className="text-xs text-amber-400">
                  Peak demand of {data.peakDemand.headcount} expected in {data.peakDemand.month}
                  {Array.isArray(data.peakDemand.criticalSkills) && data.peakDemand.criticalSkills.length > 0
                    ? `. Critical skills: ${data.peakDemand.criticalSkills.join(', ')}`
                    : ''}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Procurement-specific KPIs */}
        {type === 'procurement' && procurementKpis.length > 0 ? (
          <div className="mb-4">
            <p className="text-xs text-primary-300 font-semibold uppercase tracking-wider mb-3">
              Spend Overview
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {procurementKpis.map((kpi, index) => (
                <div
                  key={`proc-kpi-${index}`}
                  className="glass-sm p-3 flex flex-col items-center text-center"
                >
                  <span className="text-lg mb-1" aria-hidden="true">{kpi.icon}</span>
                  <span className="text-sm font-bold text-primary-50">{kpi.value}</span>
                  <span className="text-xs text-primary-300 mt-0.5">{kpi.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Quarterly Projections */}
        {quarterlyProjections.length > 0 ? (
          <div className={type !== 'generic' ? 'mt-4' : ''}>
            <QuarterlyProjectionSection projections={quarterlyProjections} />
          </div>
        ) : null}

        {/* Hiring Needs */}
        {hiringNeeds.length > 0 ? (
          <div className="mt-4">
            <HiringNeedsSection needs={hiringNeeds} />
          </div>
        ) : null}

        {/* Material Trends */}
        {materialTrends.length > 0 ? (
          <div className="mt-4">
            <MaterialTrendsSection trends={materialTrends} />
          </div>
        ) : null}
      </GlassCard>
    </div>
  );

  if (animated) {
    return (
      <AnimatedTransition show type="scale" duration="normal">
        {content}
      </AnimatedTransition>
    );
  }

  return content;
}

ForecastChart.propTypes = {
  forecast: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.string,
    confidence: PropTypes.number,
    lastUpdated: PropTypes.string,
    personaId: PropTypes.string,
    data: PropTypes.object,
    sources: PropTypes.array,
  }).isRequired,
  showHeader: PropTypes.bool,
  showConfidence: PropTypes.bool,
  compact: PropTypes.bool,
  animated: PropTypes.bool,
  className: PropTypes.string,
};

ForecastChart.defaultProps = {
  showHeader: true,
  showConfidence: true,
  compact: false,
  animated: true,
  className: '',
};

export default ForecastChart;