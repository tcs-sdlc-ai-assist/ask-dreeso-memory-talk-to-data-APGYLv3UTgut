/**
 * Centralized localStorage session management utility for Ask Dreeso Memory.
 * Handles session persistence, retrieval, validation, and defensive checks
 * for corrupted/missing data and JSON parse errors.
 *
 * @module SessionManager
 * @see SCRUM-7898
 * @see SCRUM-7899
 * @see SCRUM-7900
 */

import { LOCAL_STORAGE_KEYS, VIEW_STATES } from '../constants';

/**
 * localStorage key used for session storage
 * @type {string}
 */
const SESSION_KEY = 'ask-dreeso-session';

/**
 * Default session expiry duration in milliseconds (1 hour)
 * @type {number}
 */
const DEFAULT_SESSION_DURATION_MS = 60 * 60 * 1000;

/**
 * @typedef {Object} Session
 * @property {string} userId - Unique user identifier
 * @property {string} persona - Persona identifier (e.g., 'lukas')
 * @property {string} role - User role / job title
 * @property {string} token - Mock authentication token
 * @property {string} expiresAt - ISO timestamp of session expiry
 * @property {string} [fullName] - Full display name
 * @property {string} [email] - User email address
 * @property {number} [currentScreen] - Current screen ID
 * @property {string} [currentView] - Current view state
 */

/**
 * Safely reads and parses a JSON value from localStorage
 * @param {string} key - The localStorage key to read
 * @returns {*} The parsed value, or null if not found or parse fails
 */
function safeReadFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) {
      return null;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Safely writes a JSON value to localStorage
 * @param {string} key - The localStorage key to write
 * @param {*} value - The value to serialize and store
 * @returns {boolean} True if write succeeded, false otherwise
 */
function safeWriteToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates that a session object has the required fields
 * @param {*} session - The session object to validate
 * @returns {boolean} True if the session has all required fields
 */
function isValidSessionShape(session) {
  if (!session || typeof session !== 'object') {
    return false;
  }
  if (typeof session.userId !== 'string' || session.userId.length === 0) {
    return false;
  }
  if (typeof session.persona !== 'string' || session.persona.length === 0) {
    return false;
  }
  if (typeof session.role !== 'string' || session.role.length === 0) {
    return false;
  }
  if (typeof session.token !== 'string' || session.token.length === 0) {
    return false;
  }
  if (typeof session.expiresAt !== 'string' || session.expiresAt.length === 0) {
    return false;
  }
  return true;
}

/**
 * Checks whether a session has expired based on its expiresAt field
 * @param {Session} session - The session object to check
 * @returns {boolean} True if the session has expired
 */
function isExpired(session) {
  try {
    const expiresAt = new Date(session.expiresAt).getTime();
    if (isNaN(expiresAt)) {
      return true;
    }
    return Date.now() >= expiresAt;
  } catch {
    return true;
  }
}

/**
 * Stores a session object in localStorage
 * @param {Session} sessionObj - The session object to persist
 * @returns {boolean} True if the session was stored successfully
 */
export function setSession(sessionObj) {
  if (!sessionObj || typeof sessionObj !== 'object') {
    return false;
  }

  const session = { ...sessionObj };

  if (!session.expiresAt) {
    const expiresAt = new Date(Date.now() + DEFAULT_SESSION_DURATION_MS).toISOString();
    session.expiresAt = expiresAt;
  }

  if (!isValidSessionShape(session)) {
    return false;
  }

  const written = safeWriteToStorage(SESSION_KEY, session);

  if (written && session.persona) {
    safeWriteToStorage(LOCAL_STORAGE_KEYS.SELECTED_PERSONA, session.persona);
  }

  return written;
}

/**
 * Retrieves the current session from localStorage
 * @returns {Session|null} The session object, or null if not found, invalid, or expired
 */
export function getSession() {
  const session = safeReadFromStorage(SESSION_KEY);

  if (!isValidSessionShape(session)) {
    return null;
  }

  if (isExpired(session)) {
    clearSession();
    return null;
  }

  return session;
}

/**
 * Clears the current session from localStorage
 */
export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.SELECTED_PERSONA);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.LAST_SCREEN);
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

/**
 * Checks whether the current session is valid and not expired
 * @returns {boolean} True if a valid, non-expired session exists
 */
export function isSessionValid() {
  const session = safeReadFromStorage(SESSION_KEY);

  if (!isValidSessionShape(session)) {
    return false;
  }

  if (isExpired(session)) {
    clearSession();
    return false;
  }

  return true;
}

/**
 * Returns the persona identifier from the current session
 * @returns {string|null} The persona ID, or null if no valid session exists
 */
export function getPersona() {
  const session = getSession();
  return session ? session.persona : null;
}

/**
 * Returns the role from the current session
 * @returns {string|null} The role string, or null if no valid session exists
 */
export function getRole() {
  const session = getSession();
  return session ? session.role : null;
}

/**
 * Updates the current screen ID in the active session
 * @param {number} screenId - The numeric screen identifier
 * @returns {boolean} True if the update succeeded
 */
export function updateCurrentScreen(screenId) {
  const session = getSession();

  if (!session) {
    return false;
  }

  if (typeof screenId !== 'number' || isNaN(screenId)) {
    return false;
  }

  session.currentScreen = screenId;

  const written = safeWriteToStorage(SESSION_KEY, session);

  if (written) {
    safeWriteToStorage(LOCAL_STORAGE_KEYS.LAST_SCREEN, screenId);
  }

  return written;
}

/**
 * Updates the current view state in the active session
 * @param {string} viewState - The view state identifier (e.g., VIEW_STATES.INPUT)
 * @returns {boolean} True if the update succeeded
 */
export function updateCurrentView(viewState) {
  const session = getSession();

  if (!session) {
    return false;
  }

  if (typeof viewState !== 'string' || viewState.length === 0) {
    return false;
  }

  const validViewStates = Object.values(VIEW_STATES);
  if (!validViewStates.includes(viewState)) {
    return false;
  }

  session.currentView = viewState;

  return safeWriteToStorage(SESSION_KEY, session);
}