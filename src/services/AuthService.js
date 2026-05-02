/**
 * Authentication service for Ask Dreeso Memory.
 * Handles signup, login, credential validation, and user record management.
 * Stores user records in localStorage and integrates with SessionManager and AuditLogger.
 *
 * @module AuthService
 * @see SCRUM-7898
 * @see SCRUM-7899
 */

import { LOCAL_STORAGE_KEYS, PERSONAS } from '../constants';
import { setSession, clearSession, getSession } from './SessionManager';
import { logEvent, AUDIT_EVENT_TYPES } from './AuditLogger';

/**
 * localStorage key used for user records storage
 * @type {string}
 */
const USERS_STORAGE_KEY = 'ask-dreeso-users';

/**
 * Default session expiry duration in milliseconds (1 hour)
 * @type {number}
 */
const SESSION_DURATION_MS = 60 * 60 * 1000;

/**
 * Minimum password length
 * @type {number}
 */
const MIN_PASSWORD_LENGTH = 8;

/**
 * @typedef {Object} UserRecord
 * @property {string} userId - Unique user identifier
 * @property {string} fullName - Full display name
 * @property {string} email - User email address
 * @property {string} passwordHash - Hashed password (simulated)
 * @property {string} role - User role
 * @property {string} createdAt - ISO timestamp of account creation
 */

/**
 * @typedef {Object} AuthResponse
 * @property {string} status - 'success' or 'error'
 * @property {Object} [user] - User data on success
 * @property {string} [user.userId] - User identifier
 * @property {string} [user.fullName] - Full display name
 * @property {string} [user.email] - User email
 * @property {string} [user.role] - User role
 * @property {Object} [session] - Session data on success
 * @property {string} [session.persona] - Persona identifier
 * @property {string} [session.role] - User role
 * @property {string} [session.token] - Mock authentication token
 * @property {string} [session.expiresAt] - ISO timestamp of session expiry
 * @property {string} [errorCode] - Error code on failure
 * @property {string} [message] - Error message on failure
 */

/**
 * Generates a unique user identifier
 * @returns {string} A unique user ID string
 */
function generateUserId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `user-${timestamp}-${random}`;
}

/**
 * Generates a mock authentication token
 * @returns {string} A mock token string
 */
function generateMockToken() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 12);
  return `mock_token_${timestamp}_${random}`;
}

/**
 * Simulates password hashing (demo only — not cryptographically secure)
 * @param {string} password - The plaintext password
 * @returns {string} A simulated hash string
 */
function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `hash_${Math.abs(hash).toString(36)}_${password.length}`;
}

/**
 * Verifies a password against a simulated hash
 * @param {string} password - The plaintext password to verify
 * @param {string} storedHash - The stored hash to compare against
 * @returns {boolean} True if the password matches the hash
 */
function verifyPassword(password, storedHash) {
  const computed = hashPassword(password);
  return computed === storedHash;
}

/**
 * Validates an email address format
 * @param {string} email - The email address to validate
 * @returns {boolean} True if the email format is valid
 */
function isValidEmail(email) {
  if (typeof email !== 'string' || email.length === 0) {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates a password against strength requirements.
 * Must be at least 8 characters, contain at least one uppercase letter,
 * one number, and one special character.
 * @param {string} password - The password to validate
 * @returns {{ valid: boolean, message: string }} Validation result
 */
function validatePasswordStrength(password) {
  if (typeof password !== 'string' || password.length === 0) {
    return { valid: false, message: 'Password is required.' };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number.' };
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character.' };
  }
  return { valid: true, message: '' };
}

/**
 * Safely reads and parses user records from localStorage
 * @returns {UserRecord[]} The parsed user records array, or empty array on failure
 */
function readUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw === null || raw === undefined) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

/**
 * Safely writes user records to localStorage
 * @param {UserRecord[]} users - The user records to persist
 * @returns {boolean} True if write succeeded, false otherwise
 */
function writeUsers(users) {
  try {
    if (!Array.isArray(users)) {
      return false;
    }
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return true;
  } catch {
    return false;
  }
}

/**
 * Maps a role string to a persona ID based on known persona definitions
 * @param {string} role - The user role
 * @param {string} fullName - The user's full name for fallback matching
 * @returns {string} The matched persona ID, or the first persona ID as default
 */
function mapRoleToPersona(role, fullName) {
  const roleLower = (role || '').toLowerCase();
  const nameLower = (fullName || '').toLowerCase();

  if (roleLower.includes('project') || roleLower.includes('portfolio')) {
    return PERSONAS.LUKAS.id;
  }
  if (roleLower.includes('commercial') || roleLower.includes('procurement') || roleLower.includes('qs')) {
    return PERSONAS.ELENA.id;
  }
  if (roleLower.includes('finance') || roleLower.includes('cash')) {
    return PERSONAS.SOPHIE.id;
  }
  if (roleLower.includes('sales') || roleLower.includes('business dev')) {
    return PERSONAS.JAMES.id;
  }

  // Fallback: try matching by name
  if (nameLower.includes('lukas')) {
    return PERSONAS.LUKAS.id;
  }
  if (nameLower.includes('elena')) {
    return PERSONAS.ELENA.id;
  }
  if (nameLower.includes('sophie')) {
    return PERSONAS.SOPHIE.id;
  }
  if (nameLower.includes('james')) {
    return PERSONAS.JAMES.id;
  }

  return PERSONAS.LUKAS.id;
}

/**
 * Creates an error response object
 * @param {string} errorCode - The error code
 * @param {string} message - The error message
 * @returns {AuthResponse} The error response
 */
function errorResponse(errorCode, message) {
  return {
    status: 'error',
    errorCode,
    message,
  };
}

/**
 * Creates a success response object with user and session data
 * @param {Object} user - The user data
 * @param {Object} session - The session data
 * @returns {AuthResponse} The success response
 */
function successResponse(user, session) {
  return {
    status: 'success',
    user: {
      userId: user.userId,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
    session: {
      persona: session.persona,
      role: session.role,
      token: session.token,
      expiresAt: session.expiresAt,
    },
  };
}

/**
 * Retrieves a user record by email address
 * @param {string} email - The email address to search for
 * @returns {UserRecord|null} The user record, or null if not found
 */
export function getUserByEmail(email) {
  if (typeof email !== 'string' || email.length === 0) {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const users = readUsers();

  const user = users.find(
    (u) => u.email && u.email.toLowerCase() === normalizedEmail
  );

  return user || null;
}

/**
 * Validates credentials against stored user records
 * @param {string} email - The email address
 * @param {string} password - The plaintext password
 * @returns {{ valid: boolean, user: UserRecord|null, message: string }} Validation result
 */
export function validateCredentials(email, password) {
  if (typeof email !== 'string' || email.length === 0) {
    return { valid: false, user: null, message: 'Email is required.' };
  }

  if (typeof password !== 'string' || password.length === 0) {
    return { valid: false, user: null, message: 'Password is required.' };
  }

  if (!isValidEmail(email)) {
    return { valid: false, user: null, message: 'Invalid email format.' };
  }

  const user = getUserByEmail(email);

  if (!user) {
    return { valid: false, user: null, message: 'Invalid email or password.' };
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return { valid: false, user: null, message: 'Invalid email or password.' };
  }

  return { valid: true, user, message: '' };
}

/**
 * Registers a new user account, creates a session, and logs the event.
 *
 * @param {string} fullName - The user's full name
 * @param {string} email - The user's email address
 * @param {string} password - The user's password
 * @param {string} role - The user's role
 * @returns {Promise<AuthResponse>} Promise resolving to the authentication response
 */
export async function signup(fullName, email, password, role) {
  const delay = parseInt(import.meta.env.VITE_MOCK_DELAY_MS, 10) || 500;

  await new Promise((resolve) => setTimeout(resolve, delay));

  try {
    // Validate full name
    if (typeof fullName !== 'string' || fullName.trim().length === 0) {
      return errorResponse('VALIDATION_ERROR', 'Full name is required.');
    }

    // Validate email
    if (typeof email !== 'string' || email.trim().length === 0) {
      return errorResponse('VALIDATION_ERROR', 'Email is required.');
    }

    if (!isValidEmail(email)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid email format.');
    }

    // Validate password
    if (typeof password !== 'string' || password.length === 0) {
      return errorResponse('VALIDATION_ERROR', 'Password is required.');
    }

    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return errorResponse('VALIDATION_ERROR', passwordCheck.message);
    }

    // Validate role
    if (typeof role !== 'string' || role.trim().length === 0) {
      return errorResponse('VALIDATION_ERROR', 'Role is required.');
    }

    // Check if email already exists
    const existingUser = getUserByEmail(email);
    if (existingUser) {
      return errorResponse('EMAIL_EXISTS', 'An account with this email already exists.');
    }

    // Create user record
    const userId = generateUserId();
    const passwordHashValue = hashPassword(password);
    const now = new Date().toISOString();

    /** @type {UserRecord} */
    const userRecord = {
      userId,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: passwordHashValue,
      role: role.trim(),
      createdAt: now,
    };

    // Persist user record
    const users = readUsers();
    users.push(userRecord);
    const written = writeUsers(users);

    if (!written) {
      return errorResponse('STORAGE_ERROR', 'Failed to save user account. Please try again.');
    }

    // Create session
    const persona = mapRoleToPersona(role, fullName);
    const token = generateMockToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

    const sessionObj = {
      userId,
      persona,
      role: role.trim(),
      token,
      expiresAt,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
    };

    const sessionSet = setSession(sessionObj);

    if (!sessionSet) {
      return errorResponse('SESSION_ERROR', 'Failed to create session. Please try again.');
    }

    // Log audit event
    logEvent(AUDIT_EVENT_TYPES.AUTH_LOGIN, {
      action: 'SIGNUP',
      userId,
      email: email.trim().toLowerCase(),
      persona,
      role: role.trim(),
    });

    return successResponse(userRecord, sessionObj);
  } catch {
    return errorResponse('UNKNOWN_ERROR', 'An unexpected error occurred during signup.');
  }
}

/**
 * Authenticates a user with email and password, creates a session, and logs the event.
 *
 * @param {string} email - The user's email address
 * @param {string} password - The user's password
 * @returns {Promise<AuthResponse>} Promise resolving to the authentication response
 */
export async function login(email, password) {
  const delay = parseInt(import.meta.env.VITE_MOCK_DELAY_MS, 10) || 500;

  await new Promise((resolve) => setTimeout(resolve, delay));

  try {
    // Validate email
    if (typeof email !== 'string' || email.trim().length === 0) {
      return errorResponse('VALIDATION_ERROR', 'Email is required.');
    }

    if (!isValidEmail(email)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid email format.');
    }

    // Validate password
    if (typeof password !== 'string' || password.length === 0) {
      return errorResponse('VALIDATION_ERROR', 'Password is required.');
    }

    // Validate credentials
    const credentialCheck = validateCredentials(email, password);

    if (!credentialCheck.valid) {
      logEvent(AUDIT_EVENT_TYPES.AUTH_LOGIN, {
        action: 'LOGIN_FAILED',
        email: email.trim().toLowerCase(),
        reason: credentialCheck.message,
      });

      return errorResponse('AUTH_FAILED', 'Invalid email or password.');
    }

    const user = credentialCheck.user;

    // Create session
    const persona = mapRoleToPersona(user.role, user.fullName);
    const token = generateMockToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

    const sessionObj = {
      userId: user.userId,
      persona,
      role: user.role,
      token,
      expiresAt,
      fullName: user.fullName,
      email: user.email,
    };

    const sessionSet = setSession(sessionObj);

    if (!sessionSet) {
      return errorResponse('SESSION_ERROR', 'Failed to create session. Please try again.');
    }

    // Log audit event
    logEvent(AUDIT_EVENT_TYPES.AUTH_LOGIN, {
      action: 'LOGIN',
      userId: user.userId,
      email: user.email,
      persona,
      role: user.role,
    });

    return successResponse(user, sessionObj);
  } catch {
    return errorResponse('UNKNOWN_ERROR', 'An unexpected error occurred during login.');
  }
}

/**
 * Logs out the current user by clearing the session and logging the event.
 *
 * @returns {Promise<{ status: string }>} Promise resolving to the logout response
 */
export async function logout() {
  try {
    const session = getSession();

    if (session) {
      logEvent(AUDIT_EVENT_TYPES.AUTH_LOGOUT, {
        action: 'LOGOUT',
        userId: session.userId,
        persona: session.persona,
        role: session.role,
      });
    }

    clearSession();

    return { status: 'success' };
  } catch {
    clearSession();
    return { status: 'success' };
  }
}