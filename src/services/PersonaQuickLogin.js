/**
 * Persona-based quick login service for Ask Dreeso Memory.
 * Enables one-click login as a predefined persona, creating a session
 * and logging the event to the audit trail.
 *
 * @module PersonaQuickLogin
 * @see SCRUM-7900
 */

import { PERSONAS } from '../constants';
import {
  getPersonaProfile,
  getAllPersonaProfiles,
} from '../data/personaData';
import { setSession, clearSession } from './SessionManager';
import { logEvent, AUDIT_EVENT_TYPES } from './AuditLogger';

/**
 * Default session expiry duration in milliseconds (1 hour)
 * @type {number}
 */
const SESSION_DURATION_MS = 60 * 60 * 1000;

/**
 * Generates a unique user identifier for persona quick login
 * @param {string} personaId - The persona identifier
 * @returns {string} A unique user ID string
 */
function generatePersonaUserId(personaId) {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `persona-${personaId}-${timestamp}-${random}`;
}

/**
 * Generates a mock authentication token for persona quick login
 * @param {string} personaId - The persona identifier
 * @returns {string} A mock token string
 */
function generatePersonaToken(personaId) {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 12);
  return `persona_token_${personaId}_${timestamp}_${random}`;
}

/**
 * Creates an error response object
 * @param {string} errorCode - The error code
 * @param {string} message - The error message
 * @returns {{ status: string, errorCode: string, message: string }} The error response
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
 * @returns {{ status: string, user: Object, session: Object }} The success response
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
 * Resolves a persona key to a valid persona ID.
 * Accepts persona IDs (e.g., 'lukas') or PERSONAS constant keys (e.g., 'LUKAS').
 *
 * @param {string} personaKey - The persona key or ID
 * @returns {string|null} The resolved persona ID, or null if not found
 */
function resolvePersonaId(personaKey) {
  if (typeof personaKey !== 'string' || personaKey.trim().length === 0) {
    return null;
  }

  const trimmed = personaKey.trim();

  // Check if it's a direct persona ID (e.g., 'lukas')
  const profile = getPersonaProfile(trimmed);
  if (profile) {
    return trimmed;
  }

  // Check if it's a PERSONAS constant key (e.g., 'LUKAS')
  const upperKey = trimmed.toUpperCase();
  if (PERSONAS[upperKey] && PERSONAS[upperKey].id) {
    return PERSONAS[upperKey].id;
  }

  // Check if it matches a persona name (e.g., 'Lukas')
  const allProfiles = getAllPersonaProfiles();
  const matchByName = allProfiles.find(
    (p) => p.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (matchByName) {
    return matchByName.id;
  }

  return null;
}

/**
 * Performs a quick login as a predefined persona.
 * Clears any existing session, creates a new session for the persona,
 * and logs the event to the audit trail.
 *
 * @param {string} personaKey - The persona key, ID, or name (e.g., 'lukas', 'LUKAS', 'Lukas')
 * @returns {Promise<Object>} Promise resolving to the authentication response
 */
export async function personaLogin(personaKey) {
  const delay = parseInt(import.meta.env.VITE_MOCK_DELAY_MS, 10) || 500;

  await new Promise((resolve) => setTimeout(resolve, delay));

  try {
    // Validate input
    if (typeof personaKey !== 'string' || personaKey.trim().length === 0) {
      return errorResponse('VALIDATION_ERROR', 'Persona key is required.');
    }

    // Resolve persona ID
    const personaId = resolvePersonaId(personaKey);

    if (!personaId) {
      logEvent(AUDIT_EVENT_TYPES.AUTH_LOGIN, {
        action: 'PERSONA_LOGIN_FAILED',
        personaKey: personaKey.trim(),
        reason: 'Persona does not exist.',
      });

      return errorResponse('PERSONA_NOT_FOUND', 'Persona does not exist.');
    }

    // Load persona profile
    const profile = getPersonaProfile(personaId);

    if (!profile) {
      logEvent(AUDIT_EVENT_TYPES.AUTH_LOGIN, {
        action: 'PERSONA_LOGIN_FAILED',
        personaKey: personaKey.trim(),
        personaId,
        reason: 'Persona profile not found.',
      });

      return errorResponse('PERSONA_NOT_FOUND', 'Persona profile not found.');
    }

    // Clear any existing session
    clearSession();

    // Create session
    const userId = generatePersonaUserId(personaId);
    const token = generatePersonaToken(personaId);
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

    const sessionObj = {
      userId,
      persona: profile.id,
      role: profile.role,
      token,
      expiresAt,
      fullName: profile.name,
      email: profile.email,
    };

    const sessionSet = setSession(sessionObj);

    if (!sessionSet) {
      return errorResponse('SESSION_ERROR', 'Failed to create session. Please try again.');
    }

    // Build user object for response
    const user = {
      userId,
      fullName: profile.name,
      email: profile.email,
      role: profile.role,
    };

    // Log audit event
    logEvent(AUDIT_EVENT_TYPES.AUTH_LOGIN, {
      action: 'PERSONA_LOGIN',
      userId,
      persona: profile.id,
      personaName: profile.name,
      role: profile.role,
      email: profile.email,
    });

    logEvent(AUDIT_EVENT_TYPES.PERSONA_SELECT, {
      personaId: profile.id,
      personaName: profile.name,
      role: profile.role,
      department: profile.department,
    });

    return successResponse(user, sessionObj);
  } catch {
    return errorResponse('UNKNOWN_ERROR', 'An unexpected error occurred during persona login.');
  }
}

/**
 * Returns all available personas for quick login.
 * Each entry includes the persona ID, name, role, avatar, color,
 * department, and demo credential display label.
 *
 * @returns {Object[]} Array of available persona objects for quick login
 */
export function getAvailablePersonas() {
  const profiles = getAllPersonaProfiles();

  return profiles.map((profile) => ({
    id: profile.id,
    name: profile.name,
    role: profile.role,
    avatar: profile.avatar,
    color: profile.color,
    department: profile.department,
    displayLabel: profile.demoCredential ? profile.demoCredential.displayLabel : `Login as ${profile.name}`,
  }));
}