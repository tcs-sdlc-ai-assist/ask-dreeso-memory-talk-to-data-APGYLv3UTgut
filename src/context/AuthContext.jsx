/**
 * Authentication state management context and provider for Ask Dreeso Memory.
 * Manages user, isAuthenticated, persona, and role state.
 * Integrates with AuthService, PersonaQuickLogin, and SessionManager.
 *
 * @module AuthContext
 * @see SCRUM-7898
 * @see SCRUM-7899
 * @see SCRUM-7900
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { signup as authSignup, login as authLogin, logout as authLogout } from '../services/AuthService';
import { personaLogin as personaQuickLogin, getAvailablePersonas } from '../services/PersonaQuickLogin';
import { getSession, isSessionValid, getPersona, getRole, clearSession } from '../services/SessionManager';
import { logEvent, AUDIT_EVENT_TYPES } from '../services/AuditLogger';

/**
 * @typedef {Object} AuthUser
 * @property {string} userId - Unique user identifier
 * @property {string} fullName - Full display name
 * @property {string} email - User email address
 * @property {string} role - User role
 */

/**
 * @typedef {Object} AuthContextValue
 * @property {AuthUser|null} user - Current authenticated user or null
 * @property {boolean} isAuthenticated - Whether a valid session exists
 * @property {string|null} persona - Active persona ID or null
 * @property {string|null} role - Active role or null
 * @property {boolean} loading - Whether an auth operation is in progress
 * @property {Object|null} error - Current error object or null
 * @property {function(string, string, string, string): Promise<Object>} signup - Signup function
 * @property {function(string, string): Promise<Object>} login - Login function
 * @property {function(string): Promise<Object>} personaLogin - Persona quick login function
 * @property {function(): Promise<Object>} logout - Logout function
 * @property {function(): void} clearError - Clears the current error
 * @property {function(): Object[]} getPersonas - Returns available personas for quick login
 */

const AuthContext = createContext(null);

/**
 * Builds the initial auth state from the current session
 * @returns {{ user: AuthUser|null, isAuthenticated: boolean, persona: string|null, role: string|null }}
 */
function buildInitialState() {
  const session = getSession();

  if (!session || !isSessionValid()) {
    return {
      user: null,
      isAuthenticated: false,
      persona: null,
      role: null,
    };
  }

  return {
    user: {
      userId: session.userId || '',
      fullName: session.fullName || '',
      email: session.email || '',
      role: session.role || '',
    },
    isAuthenticated: true,
    persona: session.persona || null,
    role: session.role || null,
  };
}

/**
 * Authentication Provider component.
 * Wraps children with the AuthContext and manages all authentication state.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactElement} The provider component
 */
export function AuthProvider({ children }) {
  const initialState = buildInitialState();

  const [user, setUser] = useState(initialState.user);
  const [isAuthenticated, setIsAuthenticated] = useState(initialState.isAuthenticated);
  const [persona, setPersona] = useState(initialState.persona);
  const [role, setRole] = useState(initialState.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check session validity on mount and sync state
  useEffect(() => {
    if (!isSessionValid()) {
      setUser(null);
      setIsAuthenticated(false);
      setPersona(null);
      setRole(null);
      return;
    }

    const session = getSession();
    if (session) {
      setUser({
        userId: session.userId || '',
        fullName: session.fullName || '',
        email: session.email || '',
        role: session.role || '',
      });
      setIsAuthenticated(true);
      setPersona(session.persona || null);
      setRole(session.role || null);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Handles a successful authentication response by updating state
   * @param {Object} response - The auth response object
   */
  const handleAuthSuccess = useCallback((response) => {
    if (response && response.status === 'success' && response.user && response.session) {
      setUser({
        userId: response.user.userId || '',
        fullName: response.user.fullName || '',
        email: response.user.email || '',
        role: response.user.role || '',
      });
      setIsAuthenticated(true);
      setPersona(response.session.persona || null);
      setRole(response.session.role || response.user.role || null);
      setError(null);
    }
  }, []);

  /**
   * Registers a new user account.
   *
   * @param {string} fullName - The user's full name
   * @param {string} email - The user's email address
   * @param {string} password - The user's password
   * @param {string} userRole - The user's role
   * @returns {Promise<Object>} Promise resolving to the authentication response
   */
  const signup = useCallback(async (fullName, email, password, userRole) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authSignup(fullName, email, password, userRole);

      if (response.status === 'success') {
        handleAuthSuccess(response);
      } else {
        setError({
          errorCode: response.errorCode || 'SIGNUP_ERROR',
          message: response.message || 'Signup failed. Please try again.',
        });
      }

      setLoading(false);
      return response;
    } catch {
      const errorObj = {
        errorCode: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred during signup.',
      };
      setError(errorObj);
      setLoading(false);

      logEvent(AUDIT_EVENT_TYPES.ERROR, {
        action: 'SIGNUP_ERROR',
        message: 'An unexpected error occurred during signup.',
      });

      return {
        status: 'error',
        errorCode: errorObj.errorCode,
        message: errorObj.message,
      };
    }
  }, [handleAuthSuccess]);

  /**
   * Authenticates a user with email and password.
   *
   * @param {string} email - The user's email address
   * @param {string} password - The user's password
   * @returns {Promise<Object>} Promise resolving to the authentication response
   */
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authLogin(email, password);

      if (response.status === 'success') {
        handleAuthSuccess(response);
      } else {
        setError({
          errorCode: response.errorCode || 'LOGIN_ERROR',
          message: response.message || 'Login failed. Please try again.',
        });
      }

      setLoading(false);
      return response;
    } catch {
      const errorObj = {
        errorCode: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred during login.',
      };
      setError(errorObj);
      setLoading(false);

      logEvent(AUDIT_EVENT_TYPES.ERROR, {
        action: 'LOGIN_ERROR',
        message: 'An unexpected error occurred during login.',
      });

      return {
        status: 'error',
        errorCode: errorObj.errorCode,
        message: errorObj.message,
      };
    }
  }, [handleAuthSuccess]);

  /**
   * Performs a quick login as a predefined persona.
   *
   * @param {string} personaKey - The persona key, ID, or name
   * @returns {Promise<Object>} Promise resolving to the authentication response
   */
  const personaLoginHandler = useCallback(async (personaKey) => {
    setLoading(true);
    setError(null);

    try {
      const response = await personaQuickLogin(personaKey);

      if (response.status === 'success') {
        handleAuthSuccess(response);
      } else {
        setError({
          errorCode: response.errorCode || 'PERSONA_LOGIN_ERROR',
          message: response.message || 'Persona login failed. Please try again.',
        });
      }

      setLoading(false);
      return response;
    } catch {
      const errorObj = {
        errorCode: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred during persona login.',
      };
      setError(errorObj);
      setLoading(false);

      logEvent(AUDIT_EVENT_TYPES.ERROR, {
        action: 'PERSONA_LOGIN_ERROR',
        message: 'An unexpected error occurred during persona login.',
      });

      return {
        status: 'error',
        errorCode: errorObj.errorCode,
        message: errorObj.message,
      };
    }
  }, [handleAuthSuccess]);

  /**
   * Logs out the current user by clearing the session and resetting state.
   *
   * @returns {Promise<Object>} Promise resolving to the logout response
   */
  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await authLogout();

      setUser(null);
      setIsAuthenticated(false);
      setPersona(null);
      setRole(null);
      setLoading(false);

      return response;
    } catch {
      // Even on error, clear local state
      clearSession();
      setUser(null);
      setIsAuthenticated(false);
      setPersona(null);
      setRole(null);
      setLoading(false);

      logEvent(AUDIT_EVENT_TYPES.ERROR, {
        action: 'LOGOUT_ERROR',
        message: 'An unexpected error occurred during logout.',
      });

      return { status: 'success' };
    }
  }, []);

  /**
   * Clears the current error state.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Returns all available personas for quick login.
   *
   * @returns {Object[]} Array of available persona objects
   */
  const getPersonas = useCallback(() => {
    return getAvailablePersonas();
  }, []);

  const contextValue = useMemo(() => ({
    user,
    isAuthenticated,
    persona,
    role,
    loading,
    error,
    signup,
    login,
    personaLogin: personaLoginHandler,
    logout,
    clearError,
    getPersonas,
  }), [
    user,
    isAuthenticated,
    persona,
    role,
    loading,
    error,
    signup,
    login,
    personaLoginHandler,
    logout,
    clearError,
    getPersonas,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Custom hook to access the authentication context.
 * Must be used within an AuthProvider.
 *
 * @returns {AuthContextValue} The authentication context value
 * @throws {Error} If used outside of AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}

export default AuthContext;