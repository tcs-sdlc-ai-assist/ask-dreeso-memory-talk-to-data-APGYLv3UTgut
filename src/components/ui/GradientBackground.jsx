/**
 * Reusable gradient background wrapper component for Ask Dreeso Memory.
 * Implements the design system gradient (#0A1A2F → #1E2A44) with optional
 * overlay patterns and customizable styling.
 *
 * @module GradientBackground
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * Gradient variant definitions mapping variant names to Tailwind/CSS classes.
 * @type {Object.<string, string>}
 */
const GRADIENT_VARIANTS = Object.freeze({
  primary: 'bg-gradient-to-br from-[#0A1A2F] via-[#142238] to-[#1E2A44]',
  subtle: 'bg-gradient-to-br from-[#0A1A2F] to-[#142238]',
  intense: 'bg-gradient-to-br from-[#0A1A2F] via-[#142238] to-[#1E2A44]',
  radial: '',
});

/**
 * Overlay pattern definitions mapping pattern names to style objects.
 * @type {Object.<string, Object>}
 */
const OVERLAY_PATTERNS = Object.freeze({
  none: null,
  dots: {
    backgroundImage:
      'radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
  },
  grid: {
    backgroundImage:
      'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
    backgroundSize: '48px 48px',
  },
  noise: {
    backgroundImage:
      'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.03\'/%3E%3C/svg%3E")',
    backgroundSize: '256px 256px',
  },
});

/**
 * Inline style for the radial gradient variant.
 * @type {Object}
 */
const RADIAL_GRADIENT_STYLE = Object.freeze({
  background: 'radial-gradient(ellipse at center, #142238 0%, #0A1A2F 70%, #1E2A44 100%)',
});

/**
 * GradientBackground component.
 * Wraps children with the design system gradient background and optional
 * overlay patterns. Supports multiple gradient variants and overlay styles.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render within the gradient background
 * @param {string} [props.variant='primary'] - Gradient variant ('primary', 'subtle', 'intense', 'radial')
 * @param {string} [props.overlay='none'] - Overlay pattern ('none', 'dots', 'grid', 'noise')
 * @param {boolean} [props.fullScreen=false] - Whether the background should fill the entire viewport
 * @param {string} [props.className=''] - Additional CSS classes to apply
 * @returns {React.ReactElement} The gradient background wrapper
 */
function GradientBackground({ children, variant, overlay, fullScreen, className }) {
  const gradientClass = GRADIENT_VARIANTS[variant] || GRADIENT_VARIANTS.primary;
  const overlayPattern = OVERLAY_PATTERNS[overlay] || null;
  const isRadial = variant === 'radial';

  const baseClasses = fullScreen ? 'min-h-screen w-full' : 'w-full';
  const combinedClassName = [
    baseClasses,
    'relative',
    isRadial ? '' : gradientClass,
    className || '',
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  const inlineStyle = isRadial ? { ...RADIAL_GRADIENT_STYLE } : undefined;

  return (
    <div className={combinedClassName} style={inlineStyle}>
      {overlayPattern ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={overlayPattern}
          aria-hidden="true"
        />
      ) : null}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

GradientBackground.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'subtle', 'intense', 'radial']),
  overlay: PropTypes.oneOf(['none', 'dots', 'grid', 'noise']),
  fullScreen: PropTypes.bool,
  className: PropTypes.string,
};

GradientBackground.defaultProps = {
  variant: 'primary',
  overlay: 'none',
  fullScreen: false,
  className: '',
};

export default GradientBackground;