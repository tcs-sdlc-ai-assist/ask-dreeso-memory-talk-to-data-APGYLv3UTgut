/**
 * Animation wrapper component for smooth enter/exit transitions
 * in Ask Dreeso Memory. Supports fade, slide, and scale animations
 * with configurable duration. Used for screen and view transitions.
 *
 * @module AnimatedTransition
 * @see SCRUM-7895
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Animation type definitions mapping type names to enter/exit CSS classes.
 * @type {Object.<string, { enter: string, exit: string, base: string }>}
 */
const ANIMATION_TYPES = Object.freeze({
  fade: {
    enter: 'opacity-100',
    exit: 'opacity-0',
    base: 'transition-opacity',
  },
  'slide-up': {
    enter: 'opacity-100 translate-y-0',
    exit: 'opacity-0 translate-y-4',
    base: 'transition-all',
  },
  'slide-down': {
    enter: 'opacity-100 translate-y-0',
    exit: 'opacity-0 -translate-y-4',
    base: 'transition-all',
  },
  'slide-left': {
    enter: 'opacity-100 translate-x-0',
    exit: 'opacity-0 translate-x-4',
    base: 'transition-all',
  },
  'slide-right': {
    enter: 'opacity-100 translate-x-0',
    exit: 'opacity-0 -translate-x-4',
    base: 'transition-all',
  },
  scale: {
    enter: 'opacity-100 scale-100',
    exit: 'opacity-0 scale-95',
    base: 'transition-all',
  },
  'scale-up': {
    enter: 'opacity-100 scale-100',
    exit: 'opacity-0 scale-90',
    base: 'transition-all',
  },
  none: {
    enter: '',
    exit: '',
    base: '',
  },
});

/**
 * Duration definitions mapping duration names to Tailwind duration classes
 * and their corresponding millisecond values.
 * @type {Object.<string, { className: string, ms: number }>}
 */
const DURATION_MAP = Object.freeze({
  fast: {
    className: 'duration-200',
    ms: 200,
  },
  normal: {
    className: 'duration-300',
    ms: 300,
  },
  slow: {
    className: 'duration-400',
    ms: 400,
  },
});

/**
 * Easing definitions mapping easing names to Tailwind easing classes.
 * @type {Object.<string, string>}
 */
const EASING_MAP = Object.freeze({
  'ease-in': 'ease-in',
  'ease-out': 'ease-out',
  'ease-in-out': 'ease-in-out',
  linear: 'ease-linear',
});

/**
 * AnimatedTransition component.
 * Wraps children with smooth enter/exit animations. Supports multiple
 * animation types (fade, slide, scale), configurable durations, and
 * easing functions. Manages visibility state to properly handle
 * mount/unmount transitions.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to animate
 * @param {boolean} [props.show=true] - Whether the content should be visible (triggers enter/exit)
 * @param {string} [props.type='fade'] - Animation type ('fade', 'slide-up', 'slide-down', 'slide-left', 'slide-right', 'scale', 'scale-up', 'none')
 * @param {string} [props.duration='normal'] - Animation duration ('fast', 'normal', 'slow')
 * @param {string} [props.easing='ease-in-out'] - Easing function ('ease-in', 'ease-out', 'ease-in-out', 'linear')
 * @param {number} [props.delay=0] - Delay before animation starts in milliseconds
 * @param {boolean} [props.unmountOnExit=false] - Whether to unmount children when hidden
 * @param {boolean} [props.appear=true] - Whether to animate on initial mount
 * @param {function} [props.onEnter] - Callback fired when enter animation starts
 * @param {function} [props.onEntered] - Callback fired when enter animation completes
 * @param {function} [props.onExit] - Callback fired when exit animation starts
 * @param {function} [props.onExited] - Callback fired when exit animation completes
 * @param {string} [props.className=''] - Additional CSS classes to apply to the wrapper
 * @param {string} [props.as='div'] - HTML element to render as
 * @returns {React.ReactElement|null} The animated wrapper or null if unmounted
 */
function AnimatedTransition({
  children,
  show,
  type,
  duration,
  easing,
  delay,
  unmountOnExit,
  appear,
  onEnter,
  onEntered,
  onExit,
  onExited,
  className,
  as,
}) {
  const [mounted, setMounted] = useState(show);
  const [animationState, setAnimationState] = useState(appear ? 'exited' : (show ? 'entered' : 'exited'));
  const timeoutRef = useRef(null);
  const initialRenderRef = useRef(true);

  const animConfig = ANIMATION_TYPES[type] || ANIMATION_TYPES.fade;
  const durationConfig = DURATION_MAP[duration] || DURATION_MAP.normal;
  const easingClass = EASING_MAP[easing] || EASING_MAP['ease-in-out'];

  /**
   * Clears any pending animation timeout
   */
  const clearAnimationTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Handle show prop changes
  useEffect(() => {
    clearAnimationTimeout();

    if (show) {
      // Enter transition
      setMounted(true);

      // If this is the initial render and appear is false, skip animation
      if (initialRenderRef.current && !appear) {
        setAnimationState('entered');
        initialRenderRef.current = false;
        return;
      }

      initialRenderRef.current = false;

      // Start in exited state, then transition to entered
      setAnimationState('exited');

      // Use requestAnimationFrame to ensure the exited state is painted first
      const rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimationState('entering');

          if (typeof onEnter === 'function') {
            onEnter();
          }

          timeoutRef.current = setTimeout(() => {
            setAnimationState('entered');

            if (typeof onEntered === 'function') {
              onEntered();
            }
          }, durationConfig.ms + (typeof delay === 'number' ? delay : 0));
        });
      });

      return () => {
        cancelAnimationFrame(rafId);
      };
    } else {
      // Exit transition
      initialRenderRef.current = false;

      setAnimationState('exiting');

      if (typeof onExit === 'function') {
        onExit();
      }

      timeoutRef.current = setTimeout(() => {
        setAnimationState('exited');

        if (unmountOnExit) {
          setMounted(false);
        }

        if (typeof onExited === 'function') {
          onExited();
        }
      }, durationConfig.ms + (typeof delay === 'number' ? delay : 0));
    }

    return () => {
      clearAnimationTimeout();
    };
  }, [show, appear, unmountOnExit, durationConfig.ms, delay, onEnter, onEntered, onExit, onExited, clearAnimationTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAnimationTimeout();
    };
  }, [clearAnimationTimeout]);

  // If unmountOnExit is true and not mounted, render nothing
  if (unmountOnExit && !mounted) {
    return null;
  }

  // Determine animation classes based on current state
  let stateClasses = '';

  if (type === 'none') {
    stateClasses = show ? '' : (unmountOnExit ? '' : 'hidden');
  } else {
    switch (animationState) {
      case 'entering':
      case 'entered':
        stateClasses = animConfig.enter;
        break;
      case 'exiting':
      case 'exited':
        stateClasses = animConfig.exit;
        break;
      default:
        stateClasses = animConfig.exit;
        break;
    }
  }

  // Build delay style
  const delayStyle = typeof delay === 'number' && delay > 0
    ? { transitionDelay: `${delay}ms` }
    : undefined;

  // Combine all classes
  const combinedClassName = [
    animConfig.base,
    durationConfig.className,
    easingClass,
    'transform',
    stateClasses,
    className || '',
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  const Component = as || 'div';

  return (
    <Component
      className={combinedClassName}
      style={delayStyle}
      aria-hidden={!show ? true : undefined}
    >
      {children}
    </Component>
  );
}

AnimatedTransition.propTypes = {
  children: PropTypes.node.isRequired,
  show: PropTypes.bool,
  type: PropTypes.oneOf([
    'fade',
    'slide-up',
    'slide-down',
    'slide-left',
    'slide-right',
    'scale',
    'scale-up',
    'none',
  ]),
  duration: PropTypes.oneOf(['fast', 'normal', 'slow']),
  easing: PropTypes.oneOf(['ease-in', 'ease-out', 'ease-in-out', 'linear']),
  delay: PropTypes.number,
  unmountOnExit: PropTypes.bool,
  appear: PropTypes.bool,
  onEnter: PropTypes.func,
  onEntered: PropTypes.func,
  onExit: PropTypes.func,
  onExited: PropTypes.func,
  className: PropTypes.string,
  as: PropTypes.string,
};

AnimatedTransition.defaultProps = {
  show: true,
  type: 'fade',
  duration: 'normal',
  easing: 'ease-in-out',
  delay: 0,
  unmountOnExit: false,
  appear: true,
  onEnter: undefined,
  onEntered: undefined,
  onExit: undefined,
  onExited: undefined,
  className: '',
  as: 'div',
};

export default AnimatedTransition;