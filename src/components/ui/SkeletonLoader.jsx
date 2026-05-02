/**
 * Skeleton loading placeholder component with animated pulse effect
 * for Ask Dreeso Memory. Supports table, card, and text variants
 * for different content types during loading states.
 *
 * @module SkeletonLoader
 * @see SCRUM-7895
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * Variant configurations defining row counts and layout patterns.
 * @type {Object.<string, { rows: number, hasHeader: boolean, hasAvatar: boolean }>}
 */
const VARIANT_CONFIG = Object.freeze({
  card: {
    rows: 3,
    hasHeader: true,
    hasAvatar: false,
  },
  text: {
    rows: 4,
    hasHeader: false,
    hasAvatar: false,
  },
  table: {
    rows: 5,
    hasHeader: true,
    hasAvatar: false,
  },
  list: {
    rows: 5,
    hasHeader: false,
    hasAvatar: true,
  },
  detail: {
    rows: 4,
    hasHeader: true,
    hasAvatar: true,
  },
  profile: {
    rows: 3,
    hasHeader: true,
    hasAvatar: true,
  },
});

/**
 * Size configurations mapping size names to dimension classes.
 * @type {Object.<string, { rowHeight: string, headerHeight: string, avatarSize: string, gap: string }>}
 */
const SIZE_CONFIG = Object.freeze({
  sm: {
    rowHeight: 'h-2.5',
    headerHeight: 'h-4',
    avatarSize: 'w-8 h-8',
    gap: 'gap-2',
  },
  md: {
    rowHeight: 'h-3',
    headerHeight: 'h-5',
    avatarSize: 'w-10 h-10',
    gap: 'gap-3',
  },
  lg: {
    rowHeight: 'h-4',
    headerHeight: 'h-6',
    avatarSize: 'w-14 h-14',
    gap: 'gap-4',
  },
});

/**
 * Base shimmer classes applied to all skeleton elements.
 * @type {string}
 */
const SHIMMER_CLASSES = [
  'bg-glass-light',
  'animate-glass-shimmer',
  'bg-gradient-to-r',
  'from-glass-light',
  'via-glass-medium',
  'to-glass-light',
  'bg-[length:200%_100%]',
].join(' ');

/**
 * Generates a width class for a row based on its index and total count.
 * Creates a natural-looking variation in row widths.
 *
 * @param {number} index - The row index
 * @param {number} total - The total number of rows
 * @returns {string} Tailwind width class
 */
function getRowWidthClass(index, total) {
  if (index === 0) {
    return 'w-3/4';
  }
  if (index === total - 1) {
    return 'w-1/2';
  }
  if (index % 3 === 0) {
    return 'w-5/6';
  }
  if (index % 2 === 0) {
    return 'w-2/3';
  }
  return 'w-full';
}

/**
 * Renders a single shimmer row element.
 *
 * @param {Object} props
 * @param {number} props.index - Row index for animation delay
 * @param {string} props.widthClass - Tailwind width class
 * @param {string} props.heightClass - Tailwind height class
 * @param {string} [props.extraClass=''] - Additional CSS classes
 * @returns {React.ReactElement} The shimmer row element
 */
function ShimmerRow({ index, widthClass, heightClass, extraClass }) {
  const className = [
    'rounded-full',
    SHIMMER_CLASSES,
    heightClass,
    widthClass,
    extraClass || '',
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <div
      className={className}
      style={{ animationDelay: `${index * 150}ms` }}
    />
  );
}

ShimmerRow.propTypes = {
  index: PropTypes.number.isRequired,
  widthClass: PropTypes.string.isRequired,
  heightClass: PropTypes.string.isRequired,
  extraClass: PropTypes.string,
};

ShimmerRow.defaultProps = {
  extraClass: '',
};

/**
 * Renders a table skeleton with header row and body rows.
 *
 * @param {Object} props
 * @param {number} props.rows - Number of body rows
 * @param {number} props.columns - Number of columns
 * @param {Object} props.sizeConfig - Size configuration object
 * @returns {React.ReactElement} The table skeleton element
 */
function TableSkeleton({ rows, columns, sizeConfig }) {
  const headerCells = [];
  for (let col = 0; col < columns; col++) {
    headerCells.push(
      <div
        key={`header-${col}`}
        className={[
          'rounded-full',
          SHIMMER_CLASSES,
          sizeConfig.headerHeight,
          'flex-1',
        ].join(' ')}
        style={{ animationDelay: `${col * 100}ms` }}
      />
    );
  }

  const bodyRows = [];
  for (let row = 0; row < rows; row++) {
    const cells = [];
    for (let col = 0; col < columns; col++) {
      const widthVariant = col === 0 ? 'w-full' : col === columns - 1 ? 'w-3/4' : 'w-5/6';
      cells.push(
        <div
          key={`cell-${row}-${col}`}
          className="flex-1"
        >
          <div
            className={[
              'rounded-full',
              SHIMMER_CLASSES,
              sizeConfig.rowHeight,
              widthVariant,
            ].join(' ')}
            style={{ animationDelay: `${(row * columns + col) * 100}ms` }}
          />
        </div>
      );
    }

    bodyRows.push(
      <div key={`row-${row}`} className={['flex', sizeConfig.gap].join(' ')}>
        {cells}
      </div>
    );
  }

  return (
    <div className={['flex flex-col', sizeConfig.gap].join(' ')}>
      <div className={['flex', sizeConfig.gap, 'pb-2 border-b border-glass-border'].join(' ')}>
        {headerCells}
      </div>
      {bodyRows}
    </div>
  );
}

TableSkeleton.propTypes = {
  rows: PropTypes.number.isRequired,
  columns: PropTypes.number.isRequired,
  sizeConfig: PropTypes.object.isRequired,
};

/**
 * Renders a card skeleton with optional header and avatar.
 *
 * @param {Object} props
 * @param {number} props.rows - Number of content rows
 * @param {Object} props.sizeConfig - Size configuration object
 * @param {Object} props.variantConfig - Variant configuration object
 * @returns {React.ReactElement} The card skeleton element
 */
function CardSkeleton({ rows, sizeConfig, variantConfig }) {
  const contentRows = [];
  for (let i = 0; i < rows; i++) {
    const widthClass = getRowWidthClass(i, rows);
    contentRows.push(
      <ShimmerRow
        key={`row-${i}`}
        index={variantConfig.hasHeader ? i + 1 : i}
        widthClass={widthClass}
        heightClass={sizeConfig.rowHeight}
      />
    );
  }

  return (
    <div className={['flex flex-col', sizeConfig.gap].join(' ')}>
      {variantConfig.hasAvatar ? (
        <div className={['flex items-center', sizeConfig.gap].join(' ')}>
          <div
            className={[
              'rounded-full flex-shrink-0',
              SHIMMER_CLASSES,
              sizeConfig.avatarSize,
            ].join(' ')}
            style={{ animationDelay: '0ms' }}
          />
          <div className={['flex flex-col flex-1', sizeConfig.gap].join(' ')}>
            {variantConfig.hasHeader ? (
              <ShimmerRow
                index={0}
                widthClass="w-1/3"
                heightClass={sizeConfig.headerHeight}
              />
            ) : null}
            <ShimmerRow
              index={1}
              widthClass="w-1/2"
              heightClass={sizeConfig.rowHeight}
            />
          </div>
        </div>
      ) : variantConfig.hasHeader ? (
        <ShimmerRow
          index={0}
          widthClass="w-1/3"
          heightClass={sizeConfig.headerHeight}
          extraClass="mb-1"
        />
      ) : null}
      {contentRows}
    </div>
  );
}

CardSkeleton.propTypes = {
  rows: PropTypes.number.isRequired,
  sizeConfig: PropTypes.object.isRequired,
  variantConfig: PropTypes.object.isRequired,
};

/**
 * SkeletonLoader component.
 * Renders animated placeholder content simulating loading states.
 * Supports multiple variants (card, text, table, list, detail, profile)
 * and sizes (sm, md, lg) for different content types.
 *
 * @param {Object} props
 * @param {string} [props.variant='card'] - Skeleton variant ('card', 'text', 'table', 'list', 'detail', 'profile')
 * @param {string} [props.size='md'] - Size of skeleton elements ('sm', 'md', 'lg')
 * @param {number} [props.rows] - Override the default number of rows for the variant
 * @param {number} [props.columns=3] - Number of columns for table variant
 * @param {number} [props.count=1] - Number of skeleton blocks to render
 * @param {boolean} [props.animated=true] - Whether to apply the shimmer animation
 * @param {boolean} [props.rounded=false] - Whether to apply rounded container styling
 * @param {string} [props.className=''] - Additional CSS classes to apply
 * @returns {React.ReactElement} The skeleton loader component
 */
function SkeletonLoader({ variant, size, rows, columns, count, animated, rounded, className }) {
  const variantConfig = VARIANT_CONFIG[variant] || VARIANT_CONFIG.card;
  const sizeConfig = SIZE_CONFIG[size] || SIZE_CONFIG.md;
  const resolvedRows = typeof rows === 'number' && rows > 0 ? rows : variantConfig.rows;
  const resolvedColumns = typeof columns === 'number' && columns > 0 ? columns : 3;
  const resolvedCount = typeof count === 'number' && count > 0 ? count : 1;

  const containerClassName = [
    rounded ? 'glass-sm p-4' : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  const renderSkeleton = (index) => {
    const key = `skeleton-${index}`;

    if (variant === 'table') {
      return (
        <div key={key} className={containerClassName || undefined} role="status" aria-label="Loading content">
          <TableSkeleton
            rows={resolvedRows}
            columns={resolvedColumns}
            sizeConfig={sizeConfig}
          />
          <span className="sr-only">Loading...</span>
        </div>
      );
    }

    if (variant === 'text') {
      const textRows = [];
      for (let i = 0; i < resolvedRows; i++) {
        const widthClass = getRowWidthClass(i, resolvedRows);
        textRows.push(
          <ShimmerRow
            key={`text-row-${i}`}
            index={i}
            widthClass={widthClass}
            heightClass={sizeConfig.rowHeight}
          />
        );
      }

      return (
        <div
          key={key}
          className={[
            'flex flex-col',
            sizeConfig.gap,
            containerClassName,
          ]
            .filter(Boolean)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim()}
          role="status"
          aria-label="Loading content"
        >
          {textRows}
          <span className="sr-only">Loading...</span>
        </div>
      );
    }

    return (
      <div
        key={key}
        className={containerClassName || undefined}
        role="status"
        aria-label="Loading content"
      >
        <CardSkeleton
          rows={resolvedRows}
          sizeConfig={sizeConfig}
          variantConfig={variantConfig}
        />
        <span className="sr-only">Loading...</span>
      </div>
    );
  };

  if (resolvedCount === 1) {
    return renderSkeleton(0);
  }

  const skeletons = [];
  for (let i = 0; i < resolvedCount; i++) {
    skeletons.push(renderSkeleton(i));
  }

  return (
    <div className={['flex flex-col', sizeConfig.gap].join(' ')}>
      {skeletons}
    </div>
  );
}

SkeletonLoader.propTypes = {
  variant: PropTypes.oneOf(['card', 'text', 'table', 'list', 'detail', 'profile']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  rows: PropTypes.number,
  columns: PropTypes.number,
  count: PropTypes.number,
  animated: PropTypes.bool,
  rounded: PropTypes.bool,
  className: PropTypes.string,
};

SkeletonLoader.defaultProps = {
  variant: 'card',
  size: 'md',
  rows: undefined,
  columns: 3,
  count: 1,
  animated: true,
  rounded: false,
  className: '',
};

export default SkeletonLoader;