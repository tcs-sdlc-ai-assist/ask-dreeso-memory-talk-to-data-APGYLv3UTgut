/**
 * Authentication route guard component for Ask Dreeso Memory.
 * Checks authentication state via useAuth and redirects unauthenticated
 * users to the splash/login screen. Renders children or Outlet if authenticated.
 *
 * @module ProtectedRoute
 * @see SCRUM-7898
 * @see SCRUM-7899
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getScreenPath } from '../../config/screenConfig';
import { SCREEN_IDS } from '../../constants';

/**
 * ProtectedRoute component.
 * Wraps routes that require authentication. If the user is not authenticated,
 * they are redirected to the splash screen. If authenticated, renders children
 * or the router Outlet.
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.children] - Optional child components to render when authenticated
 * @returns {React.ReactElement} The protected content or a redirect
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // While an auth operation is in progress, show nothing to avoid flash of redirect
  if (loading) {
    return null;
  }

  // If not authenticated, redirect to the splash/login screen
  if (!isAuthenticated) {
    const loginPath = getScreenPath(SCREEN_IDS.SPLASH);

    return (
      <Navigate
        to={loginPath}
        state={{ from: location }}
        replace
      />
    );
  }

  // If authenticated, render children or the Outlet for nested routes
  return children ? children : <Outlet />;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node,
};

ProtectedRoute.defaultProps = {
  children: undefined,
};

export default ProtectedRoute;