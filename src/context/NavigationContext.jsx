/**
 * Navigation state management context and provider for Ask Dreeso Memory.
 * Manages route-based and state-based navigation, integrating with
 * UIStateContext and React Router for screen/view transitions.
 *
 * @module NavigationContext
 * @see SCRUM-7894
 */

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import { SCREEN_IDS, VIEW_STATES } from '../constants';
import { useUIState, TRANSITION_EVENTS } from './UIStateContext';
import {
  getScreenConfig,
  getScreenPath,
  getScreenIdByPath,
  getDefaultViewState,
  screenRequiresPersona,
  getFlowForPersona,
} from '../config/screenConfig';
import { logEvent, AUDIT_EVENT_TYPES } from '../services/AuditLogger';
import { getSession, getPersona } from '../services/SessionManager';

/**
 * @typedef {Object} NavigationRoute
 * @property {number} screenId - Current screen ID
 * @property {string} viewState - Current view state
 * @property {string} path - Current route path
 * @property {string|null} persona - Active persona ID or null
 */

/**
 * @typedef {Object} NavigationContextValue
 * @property {function(number, string=): void} navigateTo - Navigate to a screen with optional view state
 * @property {function(): NavigationRoute} getCurrentRoute - Returns the current navigation route
 * @property {function(): void} goBack - Navigate back to the previous logical screen
 * @property {function(): void} navigateToPersonaHome - Navigate to the persona's home/dashboard screen
 * @property {function(string): void} navigateToPath - Navigate to a specific route path
 * @property {number} currentScreen - Current screen ID
 * @property {string} currentView - Current view state
 */

const NavigationContext = createContext(null);

/**
 * Navigation history stack for back navigation support.
 * Maintained in-memory per session.
 * @type {number[]}
 */
let navigationHistory = [];

/**
 * Maximum navigation history length
 * @type {number}
 */
const MAX_HISTORY_LENGTH = 50;

/**
 * Pushes a screen ID onto the navigation history stack
 * @param {number} screenId - The screen ID to push
 */
function pushHistory(screenId) {
  if (typeof screenId !== 'number' || isNaN(screenId)) {
    return;
  }

  // Avoid duplicate consecutive entries
  if (navigationHistory.length > 0 && navigationHistory[navigationHistory.length - 1] === screenId) {
    return;
  }

  navigationHistory.push(screenId);

  if (navigationHistory.length > MAX_HISTORY_LENGTH) {
    navigationHistory = navigationHistory.slice(navigationHistory.length - MAX_HISTORY_LENGTH);
  }
}

/**
 * Pops the last screen ID from the navigation history stack
 * @returns {number|null} The previous screen ID, or null if history is empty
 */
function popHistory() {
  if (navigationHistory.length <= 1) {
    return null;
  }

  // Remove current screen
  navigationHistory.pop();

  // Return the previous screen
  return navigationHistory.length > 0 ? navigationHistory[navigationHistory.length - 1] : null;
}

/**
 * Clears the navigation history stack
 */
function clearHistory() {
  navigationHistory = [];
}

/**
 * Navigation Provider component.
 * Wraps children with the NavigationContext and manages all navigation state.
 * Must be used within a UIStateProvider and a React Router context.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactElement} The provider component
 */
export function NavigationProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, setScreen, setView, transitionState } = useUIState();

  /**
   * Navigates to a specific screen by ID with an optional view state.
   * Updates UIStateContext, pushes to navigation history, logs audit event,
   * and navigates the router to the corresponding path.
   *
   * @param {number} screenId - The numeric screen identifier (0-20)
   * @param {string} [viewState] - Optional view state override
   */
  const navigateTo = useCallback((screenId, viewState) => {
    if (typeof screenId !== 'number' || isNaN(screenId)) {
      return;
    }

    const config = getScreenConfig(screenId);
    if (!config) {
      return;
    }

    // Check if persona is required and available
    if (config.requiresPersona) {
      const persona = getPersona();
      if (!persona) {
        // Redirect to persona select if persona is required but not set
        const personaSelectPath = getScreenPath(SCREEN_IDS.PERSONA_SELECT);
        logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {
          action: 'REDIRECT_TO_PERSONA_SELECT',
          requestedScreen: screenId,
          reason: 'Persona required but not set.',
        });
        navigate(personaSelectPath);
        return;
      }
    }

    // Resolve view state
    const resolvedViewState = (typeof viewState === 'string' && Object.values(VIEW_STATES).includes(viewState))
      ? viewState
      : config.defaultViewState;

    // Log navigation event
    logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {
      fromScreen: state.currentScreen,
      fromView: state.currentView,
      toScreen: screenId,
      toView: resolvedViewState,
      path: config.path,
      persona: state.persona,
    });

    // Push to history
    pushHistory(screenId);

    // Transition state via UIStateContext
    transitionState(TRANSITION_EVENTS.NAVIGATE, {
      screenId,
      viewState: resolvedViewState,
    });

    // Navigate router
    navigate(config.path);
  }, [navigate, state.currentScreen, state.currentView, state.persona, transitionState]);

  /**
   * Returns the current navigation route information.
   *
   * @returns {NavigationRoute} The current navigation route
   */
  const getCurrentRoute = useCallback(() => {
    const path = location.pathname;
    const screenIdFromPath = getScreenIdByPath(path);
    const currentScreenId = screenIdFromPath !== null ? screenIdFromPath : state.currentScreen;

    return {
      screenId: currentScreenId,
      viewState: state.currentView,
      path,
      persona: state.persona,
    };
  }, [location.pathname, state.currentScreen, state.currentView, state.persona]);

  /**
   * Navigates back to the previous screen in the navigation history.
   * If no history is available, navigates to the dashboard or splash screen.
   */
  const goBack = useCallback(() => {
    const previousScreenId = popHistory();

    if (previousScreenId !== null) {
      const config = getScreenConfig(previousScreenId);
      if (config) {
        logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {
          action: 'GO_BACK',
          fromScreen: state.currentScreen,
          fromView: state.currentView,
          toScreen: previousScreenId,
          persona: state.persona,
        });

        transitionState(TRANSITION_EVENTS.NAVIGATE, {
          screenId: previousScreenId,
          viewState: config.defaultViewState,
        });

        navigate(config.path);
        return;
      }
    }

    // Fallback: navigate to dashboard if persona is set, otherwise splash
    const persona = getPersona();
    const fallbackScreenId = persona ? SCREEN_IDS.DASHBOARD : SCREEN_IDS.SPLASH;
    const fallbackConfig = getScreenConfig(fallbackScreenId);

    if (fallbackConfig) {
      logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {
        action: 'GO_BACK_FALLBACK',
        fromScreen: state.currentScreen,
        toScreen: fallbackScreenId,
        persona: state.persona,
      });

      pushHistory(fallbackScreenId);

      transitionState(TRANSITION_EVENTS.NAVIGATE, {
        screenId: fallbackScreenId,
        viewState: fallbackConfig.defaultViewState,
      });

      navigate(fallbackConfig.path);
    }
  }, [navigate, state.currentScreen, state.currentView, state.persona, transitionState]);

  /**
   * Navigates to the persona's home/dashboard screen.
   * If no persona is set, navigates to the persona select screen.
   */
  const navigateToPersonaHome = useCallback(() => {
    const persona = getPersona();

    if (!persona) {
      logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {
        action: 'NAVIGATE_TO_PERSONA_HOME',
        reason: 'No persona set, redirecting to persona select.',
        fromScreen: state.currentScreen,
      });

      const personaSelectConfig = getScreenConfig(SCREEN_IDS.PERSONA_SELECT);
      if (personaSelectConfig) {
        pushHistory(SCREEN_IDS.PERSONA_SELECT);

        transitionState(TRANSITION_EVENTS.NAVIGATE, {
          screenId: SCREEN_IDS.PERSONA_SELECT,
          viewState: personaSelectConfig.defaultViewState,
        });

        navigate(personaSelectConfig.path);
      }
      return;
    }

    const dashboardConfig = getScreenConfig(SCREEN_IDS.DASHBOARD);

    if (dashboardConfig) {
      logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {
        action: 'NAVIGATE_TO_PERSONA_HOME',
        fromScreen: state.currentScreen,
        toScreen: SCREEN_IDS.DASHBOARD,
        persona,
      });

      pushHistory(SCREEN_IDS.DASHBOARD);

      transitionState(TRANSITION_EVENTS.NAVIGATE, {
        screenId: SCREEN_IDS.DASHBOARD,
        viewState: dashboardConfig.defaultViewState,
      });

      navigate(dashboardConfig.path);
    }
  }, [navigate, state.currentScreen, state.persona, transitionState]);

  /**
   * Navigates to a specific route path.
   * Resolves the screen ID from the path and delegates to navigateTo.
   *
   * @param {string} path - The route path to navigate to
   */
  const navigateToPath = useCallback((path) => {
    if (typeof path !== 'string' || path.trim().length === 0) {
      return;
    }

    const screenId = getScreenIdByPath(path.trim());

    if (screenId !== null) {
      navigateTo(screenId);
    } else {
      // If path is not recognized, navigate directly via router
      logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {
        action: 'NAVIGATE_TO_PATH',
        path: path.trim(),
        fromScreen: state.currentScreen,
        persona: state.persona,
        note: 'Path not mapped to a screen ID.',
      });

      navigate(path.trim());
    }
  }, [navigate, navigateTo, state.currentScreen, state.persona]);

  const contextValue = useMemo(() => ({
    navigateTo,
    getCurrentRoute,
    goBack,
    navigateToPersonaHome,
    navigateToPath,
    currentScreen: state.currentScreen,
    currentView: state.currentView,
  }), [
    navigateTo,
    getCurrentRoute,
    goBack,
    navigateToPersonaHome,
    navigateToPath,
    state.currentScreen,
    state.currentView,
  ]);

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
}

NavigationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Custom hook to access the navigation context.
 * Must be used within a NavigationProvider.
 *
 * @returns {NavigationContextValue} The navigation context value
 * @throws {Error} If used outside of NavigationProvider
 */
export function useNavigation() {
  const context = useContext(NavigationContext);

  if (context === null) {
    throw new Error('useNavigation must be used within a NavigationProvider.');
  }

  return context;
}

export default NavigationContext;