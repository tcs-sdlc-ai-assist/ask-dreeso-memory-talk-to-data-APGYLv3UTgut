/**
 * Authentication layout wrapper for Ask Dreeso Memory.
 * Provides a centered card layout with gradient background and branding
 * for login, signup, and splash screens. Does not include sidebar or persona bar.
 *
 * @module AuthLayout
 * @see SCRUM-7898
 * @see SCRUM-7899
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Outlet } from 'react-router-dom';
import GradientBackground from '../ui/GradientBackground';

/**
 * AuthLayout component.
 * Renders a full-screen gradient background with centered content area
 * for authentication screens (login, signup, splash). Includes app branding
 * in the header and a footer with version info. Does not render sidebar
 * or persona bar since the user is not yet authenticated.
 *
 * Renders children or the router Outlet for nested routes.
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.children] - Optional child components to render in the content area
 * @returns {React.ReactElement} The authentication layout component
 */
function AuthLayout({ children }) {
  return (
    <GradientBackground
      variant="primary"
      overlay="dots"
      fullScreen
      className="flex flex-col"
    >
      {/* Header Branding */}
      <header className="flex items-center justify-center px-4 py-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white bg-accent-blue flex-shrink-0 shadow-accent-glow"
            aria-hidden="true"
          >
            D
          </span>
          <div className="flex flex-col items-start">
            <span className="text-lg font-semibold text-primary-50 leading-tight">
              {import.meta.env.VITE_APP_TITLE || 'Ask Dreeso Memory'}
            </span>
            <span className="text-xs text-primary-200 leading-tight">
              AI-Powered Intelligence Platform
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        className="flex-1 flex items-center justify-center px-4 py-8 overflow-y-auto"
        role="main"
      >
        <div className="w-full max-w-md animate-fade-in">
          {children ? children : <Outlet />}
        </div>
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-center px-4 py-4 flex-shrink-0">
        <p className="text-xs text-primary-300">
          {import.meta.env.VITE_APP_TITLE || 'Ask Dreeso Memory'}{' '}
          v{import.meta.env.VITE_APP_VERSION || '1.0.0'}
        </p>
      </footer>
    </GradientBackground>
  );
}

AuthLayout.propTypes = {
  children: PropTypes.node,
};

AuthLayout.defaultProps = {
  children: undefined,
};

export default AuthLayout;