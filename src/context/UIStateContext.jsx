/**
 * UI State Management Context and Provider for Ask Dreeso Memory.
 * Manages currentScreen, currentView, persona, loading state, error state,
 * and query results. Syncs state with localStorage via SessionManager.
 *
 * @module UIStateContext
 * @see SCRUM-7892
 * @see SCRUM-7893
 * @see SCRUM-7895
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { SCREEN_IDS, VIEW_STATES, LOCAL_STORAGE_KEYS } from '../constants';
import {
  getSession,
  getPersona,
  updateCurrentScreen,
  updateCurrentView,
} from '../services/SessionManager';
import { logEvent, AUDIT_EVENT_TYPES } from '../services/AuditLogger';
import { getDefaultViewState } from '../config/screenConfig';

/**
 * @typedef {Object} UIState
 * @property {number} currentScreen - Current screen ID
 * @property {string} currentView - Current view state
 * @property {string|null} persona - Active persona ID
 * @property {boolean} loading - Whether a query/action is in progress
 * @property {Object|null} error - Current error object or null
 * @property {Object|null} queryResult - Current query result or null
 * @property {Object|null} actionResult - Current action result or null
 * @property {Object[]} actionsTaken - Array of actions taken in this session
 * @property {string|null} queryText - Current query text or null
 */

/**
 * Action types for the UI state reducer
 * @type {Object.<string, string>}
 */
const ACTION_TYPES = Object.freeze({
  SET_STATE: 'SET_STATE',
  SET_SCREEN: 'SET_SCREEN',
  SET_VIEW: 'SET_VIEW',
  SET_PERSONA: 'SET_PERSONA',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_QUERY_RESULT: 'SET_QUERY_RESULT',
  SET_ACTION_RESULT: 'SET_ACTION_RESULT',
  ADD_ACTION_TAKEN: 'ADD_ACTION_TAKEN',
  SET_QUERY_TEXT: 'SET_QUERY_TEXT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  CLEAR_QUERY_RESULT: 'CLEAR_QUERY_RESULT',
  CLEAR_ACTION_RESULT: 'CLEAR_ACTION_RESULT',
  RESET_STATE: 'RESET_STATE',
  TRANSITION: 'TRANSITION',
});

/**
 * Transition event types for the state machine
 * @type {Object.<string, string>}
 */
export const TRANSITION_EVENTS = Object.freeze({
  QUERY_SUBMIT: 'QUERY_SUBMIT',
  QUERY_SUCCESS: 'QUERY_SUCCESS',
  QUERY_ERROR: 'QUERY_ERROR',
  CTA_CLICK: 'CTA_CLICK',
  ACTION_EXECUTE: 'ACTION_EXECUTE',
  ACTION_SUCCESS: 'ACTION_SUCCESS',
  ACTION_ERROR: 'ACTION_ERROR',
  NAVIGATE: 'NAVIGATE',
  BACK: 'BACK',
  RESET: 'RESET',
});

/**
 * Builds the initial UI state from session and localStorage
 * @returns {UIState} The initial UI state
 */
function buildInitialState() {
  const session = getSession();
  const persona = session ? session.persona : null;

  let currentScreen = SCREEN_IDS.SPLASH;
  let currentView = VIEW_STATES.INPUT;

  if (session) {
    if (typeof session.currentScreen === 'number') {
      currentScreen = session.currentScreen;
    }
    if (typeof session.currentView === 'string' && Object.values(VIEW_STATES).includes(session.currentView)) {
      currentView = session.currentView;
    }
  }

  try {
    const lastScreen = localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_SCREEN);
    if (lastScreen !== null && lastScreen !== undefined) {
      const parsed = JSON.parse(lastScreen);
      if (typeof parsed === 'number' && session) {
        currentScreen = parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }

  return {
    currentScreen,
    currentView,
    persona,
    loading: false,
    error: null,
    queryResult: null,
    actionResult: null,
    actionsTaken: [],
    queryText: null,
  };
}

/**
 * Resolves the next view state based on a transition event
 * @param {UIState} state - Current UI state
 * @param {string} event - Transition event type
 * @param {Object} [payload] - Optional event payload
 * @returns {Partial<UIState>} Partial state update
 */
function resolveTransition(state, event, payload) {
  switch (event) {
    case TRANSITION_EVENTS.QUERY_SUBMIT:
      return {
        currentView: VIEW_STATES.LOADING,
        loading: true,
        error: null,
        queryResult: null,
        queryText: payload && typeof payload.queryText === 'string' ? payload.queryText : state.queryText,
      };

    case TRANSITION_EVENTS.QUERY_SUCCESS:
      return {
        currentView: VIEW_STATES.RESULT,
        loading: false,
        error: null,
        queryResult: payload && payload.result ? payload.result : null,
      };

    case TRANSITION_EVENTS.QUERY_ERROR:
      return {
        currentView: VIEW_STATES.INPUT,
        loading: false,
        error: payload && payload.error ? payload.error : { message: 'An error occurred during query execution.' },
        queryResult: null,
      };

    case TRANSITION_EVENTS.CTA_CLICK:
      return {
        currentView: VIEW_STATES.CTA,
      };

    case TRANSITION_EVENTS.ACTION_EXECUTE:
      return {
        currentView: VIEW_STATES.ACTION,
        loading: true,
        error: null,
        actionResult: null,
      };

    case TRANSITION_EVENTS.ACTION_SUCCESS:
      return {
        currentView: VIEW_STATES.CONFIRMATION,
        loading: false,
        error: null,
        actionResult: payload && payload.result ? payload.result : null,
      };

    case TRANSITION_EVENTS.ACTION_ERROR:
      return {
        currentView: VIEW_STATES.ACTION,
        loading: false,
        error: payload && payload.error ? payload.error : { message: 'An error occurred during action execution.' },
        actionResult: null,
      };

    case TRANSITION_EVENTS.NAVIGATE:
      if (payload && typeof payload.screenId === 'number') {
        const defaultView = getDefaultViewState(payload.screenId);
        return {
          currentScreen: payload.screenId,
          currentView: payload.viewState || defaultView,
          loading: false,
          error: null,
        };
      }
      return {};

    case TRANSITION_EVENTS.BACK:
      return {
        currentView: VIEW_STATES.INPUT,
        loading: false,
        error: null,
      };

    case TRANSITION_EVENTS.RESET:
      return {
        currentView: VIEW_STATES.INPUT,
        loading: false,
        error: null,
        queryResult: null,
        actionResult: null,
        queryText: null,
      };

    default:
      return {};
  }
}

/**
 * UI state reducer function
 * @param {UIState} state - Current state
 * @param {{ type: string, payload?: * }} action - Dispatched action
 * @returns {UIState} New state
 */
function uiStateReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.SET_STATE: {
      if (!action.payload || typeof action.payload !== 'object') {
        return state;
      }
      return { ...state, ...action.payload };
    }

    case ACTION_TYPES.SET_SCREEN: {
      if (typeof action.payload !== 'number') {
        return state;
      }
      return { ...state, currentScreen: action.payload };
    }

    case ACTION_TYPES.SET_VIEW: {
      if (typeof action.payload !== 'string') {
        return state;
      }
      return { ...state, currentView: action.payload };
    }

    case ACTION_TYPES.SET_PERSONA: {
      return { ...state, persona: action.payload || null };
    }

    case ACTION_TYPES.SET_LOADING: {
      return { ...state, loading: Boolean(action.payload) };
    }

    case ACTION_TYPES.SET_ERROR: {
      return { ...state, error: action.payload || null };
    }

    case ACTION_TYPES.SET_QUERY_RESULT: {
      return { ...state, queryResult: action.payload || null };
    }

    case ACTION_TYPES.SET_ACTION_RESULT: {
      return { ...state, actionResult: action.payload || null };
    }

    case ACTION_TYPES.ADD_ACTION_TAKEN: {
      if (!action.payload) {
        return state;
      }
      return {
        ...state,
        actionsTaken: [...state.actionsTaken, action.payload],
      };
    }

    case ACTION_TYPES.SET_QUERY_TEXT: {
      return { ...state, queryText: action.payload || null };
    }

    case ACTION_TYPES.CLEAR_ERROR: {
      return { ...state, error: null };
    }

    case ACTION_TYPES.CLEAR_QUERY_RESULT: {
      return { ...state, queryResult: null };
    }

    case ACTION_TYPES.CLEAR_ACTION_RESULT: {
      return { ...state, actionResult: null };
    }

    case ACTION_TYPES.RESET_STATE: {
      const persona = getPersona();
      return {
        currentScreen: persona ? SCREEN_IDS.DASHBOARD : SCREEN_IDS.SPLASH,
        currentView: VIEW_STATES.INPUT,
        persona,
        loading: false,
        error: null,
        queryResult: null,
        actionResult: null,
        actionsTaken: [],
        queryText: null,
      };
    }

    case ACTION_TYPES.TRANSITION: {
      if (!action.payload || typeof action.payload.event !== 'string') {
        return state;
      }
      const updates = resolveTransition(state, action.payload.event, action.payload.data);
      return { ...state, ...updates };
    }

    default:
      return state;
  }
}

/**
 * @typedef {Object} UIStateContextValue
 * @property {UIState} state - Current UI state
 * @property {function(): UIState} getCurrentState - Returns the current UI state
 * @property {function(Object): void} setState - Merges partial state into current state
 * @property {function(string, Object=): void} transitionState - Transitions state based on event
 * @property {function(number): void} setScreen - Sets the current screen ID
 * @property {function(string): void} setView - Sets the current view state
 * @property {function(string|null): void} setPersona - Sets the active persona
 * @property {function(boolean): void} setLoading - Sets the loading state
 * @property {function(Object|null): void} setError - Sets the error state
 * @property {function(): void} clearError - Clears the error state
 * @property {function(Object|null): void} setQueryResult - Sets the query result
 * @property {function(): void} clearQueryResult - Clears the query result
 * @property {function(Object|null): void} setActionResult - Sets the action result
 * @property {function(): void} clearActionResult - Clears the action result
 * @property {function(Object): void} addActionTaken - Adds an action to the actions taken list
 * @property {function(string|null): void} setQueryText - Sets the current query text
 * @property {function(): void} resetState - Resets the UI state to initial values
 */

const UIStateContext = createContext(null);

/**
 * UI State Provider component.
 * Wraps children with the UIStateContext and manages all UI state transitions.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactElement} The provider component
 */
export function UIStateProvider({ children }) {
  const [state, dispatch] = useReducer(uiStateReducer, null, buildInitialState);

  // Sync screen and view changes to SessionManager
  useEffect(() => {
    updateCurrentScreen(state.currentScreen);
  }, [state.currentScreen]);

  useEffect(() => {
    updateCurrentView(state.currentView);
  }, [state.currentView]);

  // Sync persona from session on mount and when session changes
  useEffect(() => {
    const session = getSession();
    const sessionPersona = session ? session.persona : null;
    if (sessionPersona !== state.persona) {
      dispatch({ type: ACTION_TYPES.SET_PERSONA, payload: sessionPersona });
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCurrentState = useCallback(() => {
    return { ...state };
  }, [state]);

  const setState = useCallback((newState) => {
    if (!newState || typeof newState !== 'object' || Array.isArray(newState)) {
      return;
    }
    dispatch({ type: ACTION_TYPES.SET_STATE, payload: newState });
  }, []);

  const transitionState = useCallback((event, data) => {
    if (typeof event !== 'string' || event.trim().length === 0) {
      return;
    }

    logEvent(AUDIT_EVENT_TYPES.STATE_TRANSITION, {
      event,
      fromScreen: state.currentScreen,
      fromView: state.currentView,
      persona: state.persona,
      data: data || null,
    });

    dispatch({
      type: ACTION_TYPES.TRANSITION,
      payload: { event, data: data || null },
    });
  }, [state.currentScreen, state.currentView, state.persona]);

  const setScreen = useCallback((screenId) => {
    if (typeof screenId !== 'number' || isNaN(screenId)) {
      return;
    }

    logEvent(AUDIT_EVENT_TYPES.SCREEN_VIEW, {
      screenId,
      previousScreen: state.currentScreen,
      persona: state.persona,
    });

    dispatch({ type: ACTION_TYPES.SET_SCREEN, payload: screenId });
  }, [state.currentScreen, state.persona]);

  const setView = useCallback((viewState) => {
    if (typeof viewState !== 'string' || viewState.length === 0) {
      return;
    }
    const validViewStates = Object.values(VIEW_STATES);
    if (!validViewStates.includes(viewState)) {
      return;
    }
    dispatch({ type: ACTION_TYPES.SET_VIEW, payload: viewState });
  }, []);

  const setPersona = useCallback((personaId) => {
    if (personaId !== null && typeof personaId !== 'string') {
      return;
    }

    logEvent(AUDIT_EVENT_TYPES.PERSONA_SELECT, {
      personaId,
      previousPersona: state.persona,
    });

    dispatch({ type: ACTION_TYPES.SET_PERSONA, payload: personaId });
  }, [state.persona]);

  const setLoading = useCallback((isLoading) => {
    dispatch({ type: ACTION_TYPES.SET_LOADING, payload: Boolean(isLoading) });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error || null });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: ACTION_TYPES.CLEAR_ERROR });
  }, []);

  const setQueryResult = useCallback((result) => {
    dispatch({ type: ACTION_TYPES.SET_QUERY_RESULT, payload: result || null });
  }, []);

  const clearQueryResult = useCallback(() => {
    dispatch({ type: ACTION_TYPES.CLEAR_QUERY_RESULT });
  }, []);

  const setActionResult = useCallback((result) => {
    dispatch({ type: ACTION_TYPES.SET_ACTION_RESULT, payload: result || null });
  }, []);

  const clearActionResult = useCallback(() => {
    dispatch({ type: ACTION_TYPES.CLEAR_ACTION_RESULT });
  }, []);

  const addActionTaken = useCallback((action) => {
    if (!action || typeof action !== 'object') {
      return;
    }
    dispatch({ type: ACTION_TYPES.ADD_ACTION_TAKEN, payload: action });
  }, []);

  const setQueryText = useCallback((text) => {
    dispatch({ type: ACTION_TYPES.SET_QUERY_TEXT, payload: text || null });
  }, []);

  const resetState = useCallback(() => {
    logEvent(AUDIT_EVENT_TYPES.STATE_TRANSITION, {
      event: 'RESET',
      fromScreen: state.currentScreen,
      fromView: state.currentView,
      persona: state.persona,
    });

    dispatch({ type: ACTION_TYPES.RESET_STATE });
  }, [state.currentScreen, state.currentView, state.persona]);

  const contextValue = useMemo(() => ({
    state,
    getCurrentState,
    setState,
    transitionState,
    setScreen,
    setView,
    setPersona,
    setLoading,
    setError,
    clearError,
    setQueryResult,
    clearQueryResult,
    setActionResult,
    clearActionResult,
    addActionTaken,
    setQueryText,
    resetState,
  }), [
    state,
    getCurrentState,
    setState,
    transitionState,
    setScreen,
    setView,
    setPersona,
    setLoading,
    setError,
    clearError,
    setQueryResult,
    clearQueryResult,
    setActionResult,
    clearActionResult,
    addActionTaken,
    setQueryText,
    resetState,
  ]);

  return (
    <UIStateContext.Provider value={contextValue}>
      {children}
    </UIStateContext.Provider>
  );
}

UIStateProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Custom hook to access the UI state context.
 * Must be used within a UIStateProvider.
 *
 * @returns {UIStateContextValue} The UI state context value
 * @throws {Error} If used outside of UIStateProvider
 */
export function useUIState() {
  const context = useContext(UIStateContext);

  if (context === null) {
    throw new Error('useUIState must be used within a UIStateProvider.');
  }

  return context;
}

export default UIStateContext;