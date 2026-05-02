import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UIStateProvider } from './context/UIStateContext';
import router from './router';

/**
 * Root application component for Ask Dreeso Memory.
 * Wraps the router with all context providers in the correct hierarchy.
 *
 * Provider hierarchy:
 * 1. AuthProvider - Authentication state (no dependencies)
 * 2. UIStateProvider - UI state management (no context dependencies)
 * 3. RouterProvider - React Router (contains NavigationProvider and QueryProvider
 *    which are instantiated within route components that have router context)
 *
 * Note: NavigationProvider and QueryProvider require React Router context
 * (useNavigate, useLocation) so they cannot be placed above RouterProvider.
 * They are instead composed within the route tree via layout components.
 *
 * @module App
 * @see SCRUM-7894
 */

/**
 * InnerApp component.
 * Renders the RouterProvider which contains all route definitions.
 * NavigationProvider and QueryProvider are instantiated within the
 * route tree where React Router context is available.
 *
 * @returns {React.ReactElement} The router provider component
 */
function InnerApp() {
  return <RouterProvider router={router} />;
}

/**
 * App component.
 * Root component that establishes the context provider hierarchy
 * and renders the application router.
 *
 * @returns {React.ReactElement} The root application component
 */
function App() {
  return (
    <AuthProvider>
      <UIStateProvider>
        <InnerApp />
      </UIStateProvider>
    </AuthProvider>
  );
}

export default App;