/**
 * Primary application layout wrapper for Ask Dreeso Memory.
 * Provides gradient background, sidebar navigation, persona bar,
 * and main content area. Wraps all authenticated screens.
 * Responsive: sidebar collapses on mobile, adapts on tablet.
 *
 * @module MainLayout
 * @see SCRUM-7894
 */

import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import PersonaBar from './PersonaBar';
import GradientBackground from '../ui/GradientBackground';
import { useAuth } from '../../context/AuthContext';

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
 * MainLayout component.
 * Renders the primary application layout with a gradient background,
 * collapsible sidebar navigation, persona bar in the header, and a
 * scrollable main content area. Supports responsive behavior:
 * - Mobile (<768px): sidebar is hidden by default, toggled via hamburger menu
 * - Tablet (768-1024px): sidebar is visible but can be collapsed
 * - Desktop (>1024px): sidebar is always visible
 *
 * Renders children or the router Outlet for nested routes.
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.children] - Optional child components to render in the content area
 * @returns {React.ReactElement} The main layout component
 */
function MainLayout({ children }) {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      const nowMobile = width < MOBILE_BREAKPOINT;
      const nowTablet = width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT;

      setIsMobile(nowMobile);
      setIsTablet(nowTablet);

      // Close mobile menu when resizing to larger viewport
      if (!nowMobile && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [mobileMenuOpen]);

  /**
   * Toggles the mobile sidebar menu
   */
  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  /**
   * Closes the mobile sidebar menu
   */
  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  /**
   * Handles keyboard events on the mobile overlay
   * @param {React.KeyboardEvent} event - The keyboard event
   */
  const handleOverlayKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      setMobileMenuOpen(false);
    }
  }, []);

  // If not authenticated, render only children or Outlet without layout chrome
  if (!isAuthenticated) {
    return children ? children : <Outlet />;
  }

  return (
    <GradientBackground
      variant="primary"
      overlay="none"
      fullScreen
      className="flex flex-col"
    >
      {/* Header Bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-glass-border z-30 flex-shrink-0">
        {/* Left: Mobile menu toggle + App title */}
        <div className="flex items-center gap-3">
          {isMobile ? (
            <button
              type="button"
              className="flex items-center justify-center w-9 h-9 rounded-glass-sm text-primary-200 hover:bg-glass-light hover:text-primary-50 transition-all duration-200"
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-sidebar"
            >
              {mobileMenuOpen ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          ) : null}

          <div className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white bg-accent-blue flex-shrink-0"
              aria-hidden="true"
            >
              D
            </span>
            <span className="text-sm font-semibold text-primary-50 hidden sm:inline">
              {import.meta.env.VITE_APP_TITLE || 'Ask Dreeso Memory'}
            </span>
          </div>
        </div>

        {/* Right: Persona Bar */}
        <PersonaBar />
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Overlay */}
        {isMobile && mobileMenuOpen ? (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-300"
            onClick={closeMobileMenu}
            onKeyDown={handleOverlayKeyDown}
            role="button"
            tabIndex={0}
            aria-label="Close navigation menu"
          />
        ) : null}

        {/* Sidebar */}
        {isMobile ? (
          <div
            id="mobile-sidebar"
            className={[
              'fixed top-0 left-0 z-50 h-full transition-transform duration-300 ease-in-out',
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
            ].join(' ')}
            aria-hidden={!mobileMenuOpen}
          >
            <Sidebar />
          </div>
        ) : (
          <div className="flex-shrink-0 z-20">
            <Sidebar />
          </div>
        )}

        {/* Content Area */}
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden"
          role="main"
        >
          <div className="p-4 sm:p-6 lg:p-8 min-h-full">
            {children ? children : <Outlet />}
          </div>
        </main>
      </div>
    </GradientBackground>
  );
}

MainLayout.propTypes = {
  children: PropTypes.node,
};

MainLayout.defaultProps = {
  children: undefined,
};

export default MainLayout;