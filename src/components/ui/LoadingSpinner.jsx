/**
 * Animated loading spinner component with skeleton loader variant
 * for Ask Dreeso Memory. Supports multiple sizes, optional message text,
 * and a skeleton loader mode. Used during LOADING view state.
 *
 * @module LoadingSpinner
 * @see SCRUM-7895
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * Size definitions mapping size names to dimension and styling values.
 * @type {Object.<string, { container: string, spinner: string, text: string }>}
 */
const SIZE_CONFIG = Object.freeze({
  xs: {
    container: 'w-4 h-4',
    spinner: 'w-4 h-4 border-2',
    text: 'text-xs',
  },
  sm: {
    container: 'w-6 h-6',
    spinner: 'w-6 h-6 border-2',
    text: 'text-sm',
  },
  md: {
    container: 'w-10 h-10',
    spinner: 'w-10 h-10 border-3',
    text: 'text-base',
  },
  lg: {
    container: 'w-14 h-14',
    spinner: 'w-14 h-14 border-4',
    text: 'text-lg',
  },
  xl: {
    container: 'w-20 h-20',
    spinner: 'w-20 h-20 border-4',
    text: 'text-xl',
  },
});

/**
 * Skeleton loader row count by variant.
 * @type {Object.<string, number>}
 */
const SKELETON_ROWS = Object.freeze({
  card: 3,
  list: 5,
  detail: 4,
});

/**
 * SkeletonLoader sub-component.
 * Renders animated placeholder rows simulating content loading.
 *
 * @param {Object} props
 * @param {string} [props.variant='card'] - Skeleton variant ('card', 'list', 'detail')
 * @param {string} [props.className=''] - Additional CSS classes
 * @returns {React.ReactElement} The skeleton loader component
 */
function SkeletonLoader({ variant, className }) {
  const rowCount = SKELETON_ROWS[variant] || SKELETON_ROWS.card;

  const rows = [];
  for (let i = 0; i < rowCount; i++) {
    const widthClass = i === 0
      ? 'w-3/4'
      : i === rowCount - 1
        ? 'w-1/2'
        : 'w-full';

    rows.push(
      <div
        key={i}
        className={[
          'h-3 rounded-full',
          'bg-glass-light',
          'animate-glass-shimmer',
          'bg-gradient-to-r from-glass-light via-glass-medium to-glass-light',
          'bg-[length:200%_100%]',
          widthClass,
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ animationDelay: `${i * 150}ms` }}
      />
    );
  }

  const combinedClassName = [
    'flex flex-col gap-3',
    className || '',
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <div className={combinedClassName} role="status" aria-label="Loading content">
      {variant === 'card' || variant === 'detail' ? (
        <div
          className="h-5 w-1/3 rounded-full bg-glass-light animate-glass-shimmer bg-gradient-to-r from-glass-light via-glass-medium to-glass-light bg-[length:200%_100%] mb-1"
        />
      ) : null}
      {rows}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

SkeletonLoader.propTypes = {
  variant: PropTypes.oneOf(['card', 'list', 'detail']),
  className: PropTypes.string,
};

SkeletonLoader.defaultProps = {
  variant: 'card',
  className: '',
};

/**
 * LoadingSpinner component.
 * Renders an animated circular spinner with optional message text.
 * Supports a skeleton loader variant for content placeholder loading.
 *
 * @param {Object} props
 * @param {string} [props.size='md'] - Spinner size ('xs', 'sm', 'md', 'lg', 'xl')
 * @param {string} [props.message=''] - Optional loading message to display below the spinner
 * @param {boolean} [props.skeleton=false] - Whether to render a skeleton loader instead of a spinner
 * @param {string} [props.skeletonVariant='card'] - Skeleton variant ('card', 'list', 'detail')
 * @param {boolean} [props.fullScreen=false] - Whether to center the spinner in the full viewport
 * @param {string} [props.color='accent-blue'] - Spinner border color class
 * @param {string} [props.className=''] - Additional CSS classes to apply
 * @returns {React.ReactElement} The loading spinner or skeleton loader component
 */
function LoadingSpinner({ size, message, skeleton, skeletonVariant, fullScreen, color, className }) {
  // If skeleton mode, render the skeleton loader
  if (skeleton) {
    const skeletonContainerClass = [
      fullScreen ? 'min-h-screen w-full flex items-center justify-center' : '',
      className || '',
    ]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (fullScreen) {
      return (
        <div className={skeletonContainerClass}>
          <div className="w-full max-w-md px-4">
            <SkeletonLoader variant={skeletonVariant} />
          </div>
        </div>
      );
    }

    return (
      <SkeletonLoader variant={skeletonVariant} className={skeletonContainerClass} />
    );
  }

  const sizeConfig = SIZE_CONFIG[size] || SIZE_CONFIG.md;

  const spinnerBorderColor = color === 'accent-blue'
    ? 'border-accent-blue'
    : color === 'accent-cyan'
      ? 'border-accent-cyan'
      : color === 'accent-purple'
        ? 'border-accent-purple'
        : color === 'accent-pink'
          ? 'border-accent-pink'
          : color === 'accent-teal'
            ? 'border-accent-teal'
            : color === 'accent-gold'
              ? 'border-accent-gold'
              : color === 'white'
                ? 'border-white'
                : 'border-accent-blue';

  const spinnerClassName = [
    sizeConfig.spinner,
    'rounded-full',
    'border-glass-border',
    'border-t-transparent',
    spinnerBorderColor,
    'animate-spin',
  ]
    .filter(Boolean)
    .join(' ');

  const wrapperClassName = [
    'flex flex-col items-center justify-center gap-3',
    fullScreen ? 'min-h-screen w-full' : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  const hasMessage = typeof message === 'string' && message.trim().length > 0;

  return (
    <div className={wrapperClassName} role="status" aria-label={hasMessage ? message.trim() : 'Loading'}>
      <div className={spinnerClassName} />
      {hasMessage ? (
        <p className={[
          sizeConfig.text,
          'text-primary-200',
          'animate-fade-in',
          'text-center',
        ].join(' ')}>
          {message.trim()}
        </p>
      ) : null}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  message: PropTypes.string,
  skeleton: PropTypes.bool,
  skeletonVariant: PropTypes.oneOf(['card', 'list', 'detail']),
  fullScreen: PropTypes.bool,
  color: PropTypes.oneOf([
    'accent-blue',
    'accent-cyan',
    'accent-purple',
    'accent-pink',
    'accent-teal',
    'accent-gold',
    'white',
  ]),
  className: PropTypes.string,
};

LoadingSpinner.defaultProps = {
  size: 'md',
  message: '',
  skeleton: false,
  skeletonVariant: 'card',
  fullScreen: false,
  color: 'accent-blue',
  className: '',
};

export default LoadingSpinner;