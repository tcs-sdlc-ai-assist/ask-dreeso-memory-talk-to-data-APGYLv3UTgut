/**
 * Glassmorphism card UI component for Ask Dreeso Memory.
 * Provides a card with backdrop blur, semi-transparent background,
 * border, and shadow effects. Supports multiple variants and
 * optional hover effects.
 *
 * @module GlassCard
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * Glass variant definitions mapping variant names to Tailwind/CSS classes.
 * @type {Object.<string, string>}
 */
const GLASS_VARIANTS = Object.freeze({
  default: 'glass',
  sm: 'glass-sm',
  lg: 'glass-lg',
  subtle: 'bg-glass-light backdrop-blur-glass border border-glass-border rounded-glass shadow-glass-sm',
  solid: 'bg-glass-medium backdrop-blur-glass-lg border border-glass-border rounded-glass shadow-glass',
  outline: 'bg-transparent backdrop-blur-xs border border-glass-border rounded-glass',
});

/**
 * Padding size definitions mapping size names to Tailwind classes.
 * @type {Object.<string, string>}
 */
const PADDING_SIZES = Object.freeze({
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
  xl: 'p-9',
});

/**
 * GlassCard component.
 * Renders a glassmorphism-styled card container with backdrop blur,
 * semi-transparent background, border, and shadow. Supports multiple
 * visual variants, padding sizes, hover effects, and custom styling.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render within the card
 * @param {string} [props.variant='default'] - Glass variant ('default', 'sm', 'lg', 'subtle', 'solid', 'outline')
 * @param {string} [props.padding='md'] - Padding size ('none', 'sm', 'md', 'lg', 'xl')
 * @param {boolean} [props.hoverable=false] - Whether to apply hover effect styles
 * @param {boolean} [props.animated=false] - Whether to apply fade-in animation on mount
 * @param {string} [props.className=''] - Additional CSS classes to apply
 * @param {function} [props.onClick] - Optional click handler
 * @param {string} [props.as='div'] - HTML element to render as
 * @returns {React.ReactElement} The glass card component
 */
function GlassCard({ children, variant, padding, hoverable, animated, className, onClick, as }) {
  const glassClass = GLASS_VARIANTS[variant] || GLASS_VARIANTS.default;
  const paddingClass = PADDING_SIZES[padding] || PADDING_SIZES.md;
  const hoverClass = hoverable ? 'glass-hover cursor-pointer' : '';
  const animationClass = animated ? 'animate-fade-in' : '';
  const interactiveClass = typeof onClick === 'function' ? 'cursor-pointer' : '';

  const combinedClassName = [
    glassClass,
    paddingClass,
    hoverClass,
    animationClass,
    interactiveClass,
    className || '',
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  const Component = as || 'div';

  const handleClick = typeof onClick === 'function' ? onClick : undefined;
  const handleKeyDown = typeof onClick === 'function'
    ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick(event);
        }
      }
    : undefined;

  const interactiveProps = typeof onClick === 'function'
    ? {
        role: 'button',
        tabIndex: 0,
        onKeyDown: handleKeyDown,
      }
    : {};

  return (
    <Component
      className={combinedClassName}
      onClick={handleClick}
      {...interactiveProps}
    >
      {children}
    </Component>
  );
}

GlassCard.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'sm', 'lg', 'subtle', 'solid', 'outline']),
  padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg', 'xl']),
  hoverable: PropTypes.bool,
  animated: PropTypes.bool,
  className: PropTypes.string,
  onClick: PropTypes.func,
  as: PropTypes.string,
};

GlassCard.defaultProps = {
  variant: 'default',
  padding: 'md',
  hoverable: false,
  animated: false,
  className: '',
  onClick: undefined,
  as: 'div',
};

export default GlassCard;