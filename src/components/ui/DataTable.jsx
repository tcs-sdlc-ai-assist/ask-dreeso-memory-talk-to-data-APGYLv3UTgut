/**
 * Responsive data table component for Ask Dreeso Memory.
 * Reusable data table with zebra striping, sortable columns, and responsive behavior.
 * Desktop: full table. Tablet: stacked cards. Mobile: horizontal scroll or carousel.
 *
 * @module DataTable
 * @see SCRUM-7892
 * @see SCRUM-7893
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import AnimatedTransition from './AnimatedTransition';

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
 * Sort direction constants.
 * @type {Object.<string, string>}
 */
const SORT_DIRECTIONS = Object.freeze({
  ASC: 'asc',
  DESC: 'desc',
  NONE: 'none',
});

/**
 * Default cell renderer that handles common value types.
 *
 * @param {*} value - The cell value
 * @returns {string} The formatted cell value
 */
function defaultCellRenderer(value) {
  if (value === null || value === undefined) {
    return '—';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'number') {
    return value.toLocaleString();
  }

  if (typeof value === 'string') {
    return value;
  }

  return String(value);
}

/**
 * Compares two values for sorting purposes.
 *
 * @param {*} a - First value
 * @param {*} b - Second value
 * @param {string} direction - Sort direction ('asc' or 'desc')
 * @returns {number} Comparison result
 */
function compareValues(a, b, direction) {
  const multiplier = direction === SORT_DIRECTIONS.DESC ? -1 : 1;

  if (a === null || a === undefined) {
    return 1 * multiplier;
  }
  if (b === null || b === undefined) {
    return -1 * multiplier;
  }

  if (typeof a === 'number' && typeof b === 'number') {
    return (a - b) * multiplier;
  }

  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b) * multiplier;
  }

  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return ((a === b) ? 0 : a ? -1 : 1) * multiplier;
  }

  return String(a).localeCompare(String(b)) * multiplier;
}

/**
 * Resolves the next sort direction in the cycle: none -> asc -> desc -> none.
 *
 * @param {string} currentDirection - The current sort direction
 * @returns {string} The next sort direction
 */
function getNextSortDirection(currentDirection) {
  switch (currentDirection) {
    case SORT_DIRECTIONS.NONE:
      return SORT_DIRECTIONS.ASC;
    case SORT_DIRECTIONS.ASC:
      return SORT_DIRECTIONS.DESC;
    case SORT_DIRECTIONS.DESC:
      return SORT_DIRECTIONS.NONE;
    default:
      return SORT_DIRECTIONS.ASC;
  }
}

/**
 * SortIcon sub-component.
 * Renders a sort direction indicator icon.
 *
 * @param {Object} props
 * @param {string} props.direction - The current sort direction ('asc', 'desc', 'none')
 * @returns {React.ReactElement} The sort icon element
 */
function SortIcon({ direction }) {
  if (direction === SORT_DIRECTIONS.ASC) {
    return (
      <svg
        className="w-3.5 h-3.5 text-accent-blue flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
    );
  }

  if (direction === SORT_DIRECTIONS.DESC) {
    return (
      <svg
        className="w-3.5 h-3.5 text-accent-blue flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    );
  }

  return (
    <svg
      className="w-3.5 h-3.5 text-primary-300 opacity-40 flex-shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
      />
    </svg>
  );
}

SortIcon.propTypes = {
  direction: PropTypes.string.isRequired,
};

/**
 * DesktopTable sub-component.
 * Renders a full table layout for desktop viewports with zebra striping and sortable columns.
 *
 * @param {Object} props
 * @param {Object[]} props.columns - Column definitions
 * @param {Object[]} props.data - Row data
 * @param {string|null} props.sortColumn - Currently sorted column key
 * @param {string} props.sortDirection - Current sort direction
 * @param {function} props.onSort - Sort handler
 * @param {function} props.onRowClick - Row click handler
 * @param {boolean} props.striped - Whether to apply zebra striping
 * @param {boolean} props.hoverable - Whether rows are hoverable
 * @param {string} props.rowKeyField - Field to use as row key
 * @returns {React.ReactElement} The desktop table element
 */
function DesktopTable({ columns, data, sortColumn, sortDirection, onSort, onRowClick, striped, hoverable, rowKeyField }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-glass-border">
            {columns.map((column) => {
              const isSorted = sortColumn === column.key;
              const currentDirection = isSorted ? sortDirection : SORT_DIRECTIONS.NONE;
              const isSortable = column.sortable !== false;

              return (
                <th
                  key={column.key}
                  className={[
                    'py-3 px-3 text-xs font-semibold text-primary-300 uppercase tracking-wider',
                    column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left',
                    isSortable ? 'cursor-pointer select-none hover:text-primary-200 transition-colors duration-200' : '',
                    column.width ? '' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')
                    .replace(/\s+/g, ' ')
                    .trim()}
                  style={column.width ? { width: column.width, minWidth: column.minWidth || undefined } : { minWidth: column.minWidth || undefined }}
                  onClick={isSortable ? () => onSort(column.key) : undefined}
                  aria-sort={
                    isSorted
                      ? currentDirection === SORT_DIRECTIONS.ASC
                        ? 'ascending'
                        : currentDirection === SORT_DIRECTIONS.DESC
                          ? 'descending'
                          : 'none'
                      : undefined
                  }
                >
                  <div className={[
                    'flex items-center gap-1.5',
                    column.align === 'right' ? 'justify-end' : column.align === 'center' ? 'justify-center' : 'justify-start',
                  ].join(' ')}>
                    <span>{column.label}</span>
                    {isSortable ? (
                      <SortIcon direction={currentDirection} />
                    ) : null}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => {
            const rowKey = row[rowKeyField] || `row-${rowIndex}`;
            const isEven = rowIndex % 2 === 0;
            const isClickable = typeof onRowClick === 'function';

            return (
              <tr
                key={rowKey}
                className={[
                  'border-b border-glass-border transition-colors duration-200',
                  striped && !isEven ? 'bg-glass-light bg-opacity-30' : '',
                  hoverable ? 'hover:bg-glass-light' : '',
                  isClickable ? 'cursor-pointer' : '',
                ]
                  .filter(Boolean)
                  .join(' ')
                  .replace(/\s+/g, ' ')
                  .trim()}
                onClick={isClickable ? () => onRowClick(row, rowIndex) : undefined}
              >
                {columns.map((column) => {
                  const rawValue = row[column.key];
                  const renderedValue = typeof column.render === 'function'
                    ? column.render(rawValue, row, rowIndex)
                    : defaultCellRenderer(rawValue);

                  return (
                    <td
                      key={`${rowKey}-${column.key}`}
                      className={[
                        'py-3 px-3',
                        column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left',
                        column.cellClassName || 'text-primary-100',
                      ]
                        .filter(Boolean)
                        .join(' ')
                        .replace(/\s+/g, ' ')
                        .trim()}
                    >
                      {renderedValue}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

DesktopTable.propTypes = {
  columns: PropTypes.array.isRequired,
  data: PropTypes.array.isRequired,
  sortColumn: PropTypes.string,
  sortDirection: PropTypes.string.isRequired,
  onSort: PropTypes.func.isRequired,
  onRowClick: PropTypes.func,
  striped: PropTypes.bool.isRequired,
  hoverable: PropTypes.bool.isRequired,
  rowKeyField: PropTypes.string.isRequired,
};

DesktopTable.defaultProps = {
  sortColumn: null,
  onRowClick: undefined,
};

/**
 * TabletCards sub-component.
 * Renders data as stacked cards for tablet viewports.
 *
 * @param {Object} props
 * @param {Object[]} props.columns - Column definitions
 * @param {Object[]} props.data - Row data
 * @param {function} props.onRowClick - Row click handler
 * @param {string} props.rowKeyField - Field to use as row key
 * @returns {React.ReactElement} The tablet card stack element
 */
function TabletCards({ columns, data, onRowClick, rowKeyField }) {
  const isClickable = typeof onRowClick === 'function';

  return (
    <div className="flex flex-col gap-3">
      {data.map((row, rowIndex) => {
        const rowKey = row[rowKeyField] || `card-${rowIndex}`;

        return (
          <div
            key={rowKey}
            className={[
              'glass-sm p-4 transition-all duration-200',
              isClickable ? 'cursor-pointer hover:bg-glass-medium' : '',
            ]
              .filter(Boolean)
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim()}
            onClick={isClickable ? () => onRowClick(row, rowIndex) : undefined}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={isClickable ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onRowClick(row, rowIndex);
              }
            } : undefined}
          >
            <div className="grid grid-cols-2 gap-3">
              {columns.map((column) => {
                const rawValue = row[column.key];
                const renderedValue = typeof column.render === 'function'
                  ? column.render(rawValue, row, rowIndex)
                  : defaultCellRenderer(rawValue);

                return (
                  <div key={`${rowKey}-${column.key}`} className="flex flex-col">
                    <span className="text-xs text-primary-300 font-medium mb-0.5">
                      {column.label}
                    </span>
                    <span className={[
                      'text-sm',
                      column.cellClassName || 'text-primary-100',
                    ].join(' ')}>
                      {renderedValue}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

TabletCards.propTypes = {
  columns: PropTypes.array.isRequired,
  data: PropTypes.array.isRequired,
  onRowClick: PropTypes.func,
  rowKeyField: PropTypes.string.isRequired,
};

TabletCards.defaultProps = {
  onRowClick: undefined,
};

/**
 * MobileCarousel sub-component.
 * Renders data as a horizontally scrollable carousel for mobile viewports.
 *
 * @param {Object} props
 * @param {Object[]} props.columns - Column definitions
 * @param {Object[]} props.data - Row data
 * @param {function} props.onRowClick - Row click handler
 * @param {string} props.rowKeyField - Field to use as row key
 * @returns {React.ReactElement} The mobile carousel element
 */
function MobileCarousel({ columns, data, onRowClick, rowKeyField }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : data.length - 1));
  }, [data.length]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev < data.length - 1 ? prev + 1 : 0));
  }, [data.length]);

  if (data.length === 0) {
    return null;
  }

  const row = data[activeIndex];
  if (!row) {
    return null;
  }

  const rowKey = row[rowKeyField] || `mobile-${activeIndex}`;
  const isClickable = typeof onRowClick === 'function';

  return (
    <div className="flex flex-col gap-3">
      <div
        className={[
          'glass-sm p-4',
          isClickable ? 'cursor-pointer' : '',
        ]
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()}
        onClick={isClickable ? () => onRowClick(row, activeIndex) : undefined}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={isClickable ? (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onRowClick(row, activeIndex);
          }
        } : undefined}
      >
        <div className="flex flex-col gap-2.5">
          {columns.map((column) => {
            const rawValue = row[column.key];
            const renderedValue = typeof column.render === 'function'
              ? column.render(rawValue, row, activeIndex)
              : defaultCellRenderer(rawValue);

            return (
              <div
                key={`${rowKey}-${column.key}`}
                className="flex items-center justify-between px-1 py-1 rounded-glass-sm"
              >
                <span className="text-xs text-primary-300 font-medium flex-shrink-0 min-w-[100px]">
                  {column.label}
                </span>
                <span className={[
                  'text-sm text-right',
                  column.cellClassName || 'text-primary-100',
                ].join(' ')}>
                  {renderedValue}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Carousel Controls */}
      {data.length > 1 ? (
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-glass-light text-primary-200 hover:bg-glass-medium hover:text-primary-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50"
            onClick={handlePrev}
            aria-label="Previous item"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-1.5">
            {data.map((_, idx) => (
              <button
                key={`dot-${idx}`}
                type="button"
                className={[
                  'w-2 h-2 rounded-full transition-all duration-200',
                  idx === activeIndex ? 'bg-accent-blue' : 'bg-glass-light',
                ].join(' ')}
                onClick={() => setActiveIndex(idx)}
                aria-label={`Go to item ${idx + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-glass-light text-primary-200 hover:bg-glass-medium hover:text-primary-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50"
            onClick={handleNext}
            aria-label="Next item"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      ) : null}

      {/* Item Counter */}
      <div className="flex items-center justify-center">
        <span className="text-xs text-primary-300">
          {activeIndex + 1} of {data.length}
        </span>
      </div>
    </div>
  );
}

MobileCarousel.propTypes = {
  columns: PropTypes.array.isRequired,
  data: PropTypes.array.isRequired,
  onRowClick: PropTypes.func,
  rowKeyField: PropTypes.string.isRequired,
};

MobileCarousel.defaultProps = {
  onRowClick: undefined,
};

/**
 * DataTable component.
 * Reusable responsive data table with zebra striping, sortable columns,
 * and responsive behavior. Desktop: full table. Tablet: stacked cards.
 * Mobile: horizontal scroll or carousel.
 *
 * @param {Object} props
 * @param {Object[]} props.columns - Column definitions array
 * @param {string} props.columns[].key - The data field key for this column
 * @param {string} props.columns[].label - Display label for the column header
 * @param {boolean} [props.columns[].sortable=true] - Whether this column is sortable
 * @param {string} [props.columns[].align='left'] - Text alignment ('left', 'center', 'right')
 * @param {string} [props.columns[].width] - CSS width for the column
 * @param {string} [props.columns[].minWidth] - CSS min-width for the column
 * @param {string} [props.columns[].cellClassName] - Additional CSS classes for cells in this column
 * @param {function} [props.columns[].render] - Custom cell renderer function (value, row, rowIndex) => ReactNode
 * @param {Object[]} props.data - Array of row data objects
 * @param {string} [props.rowKeyField='id'] - Field name to use as the unique key for each row
 * @param {boolean} [props.striped=true] - Whether to apply zebra striping to rows
 * @param {boolean} [props.hoverable=true] - Whether rows should have hover effects
 * @param {boolean} [props.sortable=true] - Whether columns are sortable by default
 * @param {string} [props.defaultSortColumn] - Column key to sort by initially
 * @param {string} [props.defaultSortDirection='asc'] - Initial sort direction ('asc' or 'desc')
 * @param {boolean} [props.showHeader=true] - Whether to show the section header
 * @param {string} [props.title] - Optional title for the table section header
 * @param {string} [props.subtitle] - Optional subtitle for the table section header
 * @param {string} [props.icon] - Optional icon emoji for the section header
 * @param {string} [props.emptyMessage='No data available.'] - Message to display when data is empty
 * @param {string} [props.emptyIcon='📋'] - Icon to display in the empty state
 * @param {boolean} [props.animated=true] - Whether to apply entrance animation
 * @param {function} [props.onRowClick] - Optional callback fired when a row is clicked (row, rowIndex) => void
 * @param {function} [props.onSort] - Optional callback fired when sort changes (columnKey, direction) => void
 * @param {string} [props.className=''] - Additional CSS classes to apply to the wrapper
 * @returns {React.ReactElement} The data table component
 */
function DataTable({
  columns,
  data,
  rowKeyField,
  striped,
  hoverable,
  sortable,
  defaultSortColumn,
  defaultSortDirection,
  showHeader,
  title,
  subtitle,
  icon,
  emptyMessage,
  emptyIcon,
  animated,
  onRowClick,
  onSort,
  className,
}) {
  const [sortColumn, setSortColumn] = useState(
    typeof defaultSortColumn === 'string' && defaultSortColumn.length > 0
      ? defaultSortColumn
      : null
  );
  const [sortDirection, setSortDirection] = useState(
    defaultSortDirection === SORT_DIRECTIONS.DESC
      ? SORT_DIRECTIONS.DESC
      : defaultSortColumn
        ? SORT_DIRECTIONS.ASC
        : SORT_DIRECTIONS.NONE
  );
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
   * Validates and normalizes the columns array
   */
  const normalizedColumns = useMemo(() => {
    if (!Array.isArray(columns)) {
      return [];
    }

    return columns
      .filter((col) => col && typeof col === 'object' && typeof col.key === 'string' && col.key.length > 0)
      .map((col) => ({
        key: col.key,
        label: typeof col.label === 'string' ? col.label : col.key,
        sortable: sortable && col.sortable !== false,
        align: col.align === 'right' || col.align === 'center' ? col.align : 'left',
        width: typeof col.width === 'string' ? col.width : undefined,
        minWidth: typeof col.minWidth === 'string' ? col.minWidth : undefined,
        cellClassName: typeof col.cellClassName === 'string' ? col.cellClassName : undefined,
        render: typeof col.render === 'function' ? col.render : undefined,
      }));
  }, [columns, sortable]);

  /**
   * Validates and normalizes the data array
   */
  const normalizedData = useMemo(() => {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.filter((row) => row && typeof row === 'object' && !Array.isArray(row));
  }, [data]);

  /**
   * Sorts the data based on current sort state
   */
  const sortedData = useMemo(() => {
    if (
      sortColumn === null ||
      sortDirection === SORT_DIRECTIONS.NONE ||
      normalizedData.length === 0
    ) {
      return normalizedData;
    }

    return [...normalizedData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      return compareValues(aValue, bValue, sortDirection);
    });
  }, [normalizedData, sortColumn, sortDirection]);

  /**
   * Handles column sort toggle
   *
   * @param {string} columnKey - The column key to sort by
   */
  const handleSort = useCallback((columnKey) => {
    if (typeof columnKey !== 'string' || columnKey.length === 0) {
      return;
    }

    const column = normalizedColumns.find((col) => col.key === columnKey);
    if (!column || !column.sortable) {
      return;
    }

    let nextDirection;

    if (sortColumn === columnKey) {
      nextDirection = getNextSortDirection(sortDirection);
    } else {
      nextDirection = SORT_DIRECTIONS.ASC;
    }

    if (nextDirection === SORT_DIRECTIONS.NONE) {
      setSortColumn(null);
    } else {
      setSortColumn(columnKey);
    }

    setSortDirection(nextDirection);

    if (typeof onSort === 'function') {
      onSort(columnKey, nextDirection);
    }
  }, [sortColumn, sortDirection, normalizedColumns, onSort]);

  const wrapperClassName = [
    'w-full',
    className || '',
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Empty state
  if (normalizedColumns.length === 0 || normalizedData.length === 0) {
    const content = (
      <div className={wrapperClassName}>
        {showHeader && title ? (
          <div className="flex items-center gap-2 mb-4">
            {icon ? (
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-blue bg-opacity-20"
                aria-hidden="true"
              >
                {icon}
              </span>
            ) : null}
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold text-primary-50 leading-tight">
                {title}
              </h3>
              {subtitle ? (
                <p className="text-xs text-primary-200 leading-tight">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
        <div className="flex flex-col items-center text-center py-8">
          <span className="text-3xl mb-4" aria-hidden="true">
            {emptyIcon}
          </span>
          <p className="text-sm text-primary-200 max-w-md">
            {emptyMessage}
          </p>
        </div>
      </div>
    );

    if (animated) {
      return (
        <AnimatedTransition show type="fade" duration="normal">
          {content}
        </AnimatedTransition>
      );
    }

    return content;
  }

  const tableContent = (
    <div className={wrapperClassName}>
      {/* Section Header */}
      {showHeader && title ? (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {icon ? (
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-blue bg-opacity-20"
                aria-hidden="true"
              >
                {icon}
              </span>
            ) : null}
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold text-primary-50 leading-tight">
                {title}
              </h3>
              {subtitle ? (
                <p className="text-xs text-primary-200 leading-tight">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>
          <span className="text-xs text-primary-300">
            {sortedData.length} item{sortedData.length !== 1 ? 's' : ''}
          </span>
        </div>
      ) : null}

      {/* Sort Indicator (mobile/tablet) */}
      {(isMobile || isTablet) && sortColumn !== null && sortDirection !== SORT_DIRECTIONS.NONE ? (
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="text-xs text-primary-300">Sorted by:</span>
          <span className="text-xs text-primary-200 font-medium">
            {normalizedColumns.find((c) => c.key === sortColumn)?.label || sortColumn}
          </span>
          <SortIcon direction={sortDirection} />
        </div>
      ) : null}

      {/* Responsive Content */}
      {isMobile ? (
        <MobileCarousel
          columns={normalizedColumns}
          data={sortedData}
          onRowClick={onRowClick}
          rowKeyField={rowKeyField}
        />
      ) : isTablet ? (
        <TabletCards
          columns={normalizedColumns}
          data={sortedData}
          onRowClick={onRowClick}
          rowKeyField={rowKeyField}
        />
      ) : (
        <DesktopTable
          columns={normalizedColumns}
          data={sortedData}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          onRowClick={onRowClick}
          striped={striped}
          hoverable={hoverable}
          rowKeyField={rowKeyField}
        />
      )}
    </div>
  );

  if (animated) {
    return (
      <AnimatedTransition show type="fade" duration="normal">
        {tableContent}
      </AnimatedTransition>
    );
  }

  return tableContent;
}

DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string,
      sortable: PropTypes.bool,
      align: PropTypes.oneOf(['left', 'center', 'right']),
      width: PropTypes.string,
      minWidth: PropTypes.string,
      cellClassName: PropTypes.string,
      render: PropTypes.func,
    })
  ).isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  rowKeyField: PropTypes.string,
  striped: PropTypes.bool,
  hoverable: PropTypes.bool,
  sortable: PropTypes.bool,
  defaultSortColumn: PropTypes.string,
  defaultSortDirection: PropTypes.oneOf(['asc', 'desc']),
  showHeader: PropTypes.bool,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  icon: PropTypes.string,
  emptyMessage: PropTypes.string,
  emptyIcon: PropTypes.string,
  animated: PropTypes.bool,
  onRowClick: PropTypes.func,
  onSort: PropTypes.func,
  className: PropTypes.string,
};

DataTable.defaultProps = {
  rowKeyField: 'id',
  striped: true,
  hoverable: true,
  sortable: true,
  defaultSortColumn: undefined,
  defaultSortDirection: 'asc',
  showHeader: true,
  title: undefined,
  subtitle: undefined,
  icon: undefined,
  emptyMessage: 'No data available.',
  emptyIcon: '📋',
  animated: true,
  onRowClick: undefined,
  onSort: undefined,
  className: '',
};

export default DataTable;