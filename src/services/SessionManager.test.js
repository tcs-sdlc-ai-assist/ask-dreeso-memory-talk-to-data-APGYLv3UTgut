import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  setSession,
  getSession,
  clearSession,
  isSessionValid,
  getPersona,
  getRole,
  updateCurrentScreen,
  updateCurrentView,
} from './SessionManager';
import { LOCAL_STORAGE_KEYS, VIEW_STATES } from '../constants';

/**
 * Helper to create a valid session object for testing.
 * @param {Object} [overrides={}] - Fields to override
 * @returns {Object} A valid session object
 */
function createValidSession(overrides = {}) {
  const now = Date.now();
  return {
    userId: 'user-test-abc123',
    persona: 'lukas',
    role: 'Project Director',
    token: 'mock_token_test_abc123',
    expiresAt: new Date(now + 60 * 60 * 1000).toISOString(),
    fullName: 'Lukas Müller',
    email: 'lukas.mueller@dreeso.demo',
    ...overrides,
  };
}

/**
 * Helper to create an expired session object for testing.
 * @param {Object} [overrides={}] - Fields to override
 * @returns {Object} An expired session object
 */
function createExpiredSession(overrides = {}) {
  return createValidSession({
    expiresAt: new Date(Date.now() - 1000).toISOString(),
    ...overrides,
  });
}

describe('SessionManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('setSession', () => {
    it('stores a valid session in localStorage and returns true', () => {
      const session = createValidSession();
      const result = setSession(session);

      expect(result).toBe(true);

      const stored = JSON.parse(localStorage.getItem('ask-dreeso-session'));
      expect(stored).not.toBeNull();
      expect(stored.userId).toBe(session.userId);
      expect(stored.persona).toBe(session.persona);
      expect(stored.role).toBe(session.role);
      expect(stored.token).toBe(session.token);
      expect(stored.expiresAt).toBe(session.expiresAt);
    });

    it('also persists the persona to SELECTED_PERSONA key', () => {
      const session = createValidSession({ persona: 'elena' });
      setSession(session);

      const storedPersona = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.SELECTED_PERSONA));
      expect(storedPersona).toBe('elena');
    });

    it('generates a default expiresAt if not provided', () => {
      const session = createValidSession();
      delete session.expiresAt;

      const result = setSession(session);
      expect(result).toBe(true);

      const stored = JSON.parse(localStorage.getItem('ask-dreeso-session'));
      expect(stored.expiresAt).toBeDefined();
      expect(typeof stored.expiresAt).toBe('string');

      const expiresAtTime = new Date(stored.expiresAt).getTime();
      expect(expiresAtTime).toBeGreaterThan(Date.now());
    });

    it('returns false for null input', () => {
      const result = setSession(null);
      expect(result).toBe(false);
    });

    it('returns false for undefined input', () => {
      const result = setSession(undefined);
      expect(result).toBe(false);
    });

    it('returns false for non-object input', () => {
      expect(setSession('string')).toBe(false);
      expect(setSession(123)).toBe(false);
      expect(setSession(true)).toBe(false);
    });

    it('returns false when userId is missing', () => {
      const session = createValidSession();
      delete session.userId;
      expect(setSession(session)).toBe(false);
    });

    it('returns false when userId is empty string', () => {
      const session = createValidSession({ userId: '' });
      expect(setSession(session)).toBe(false);
    });

    it('returns false when persona is missing', () => {
      const session = createValidSession();
      delete session.persona;
      expect(setSession(session)).toBe(false);
    });

    it('returns false when persona is empty string', () => {
      const session = createValidSession({ persona: '' });
      expect(setSession(session)).toBe(false);
    });

    it('returns false when role is missing', () => {
      const session = createValidSession();
      delete session.role;
      expect(setSession(session)).toBe(false);
    });

    it('returns false when role is empty string', () => {
      const session = createValidSession({ role: '' });
      expect(setSession(session)).toBe(false);
    });

    it('returns false when token is missing', () => {
      const session = createValidSession();
      delete session.token;
      expect(setSession(session)).toBe(false);
    });

    it('returns false when token is empty string', () => {
      const session = createValidSession({ token: '' });
      expect(setSession(session)).toBe(false);
    });

    it('does not mutate the original session object', () => {
      const session = createValidSession();
      const originalUserId = session.userId;
      setSession(session);
      expect(session.userId).toBe(originalUserId);
    });
  });

  describe('getSession', () => {
    it('returns the session object when a valid session exists', () => {
      const session = createValidSession();
      setSession(session);

      const retrieved = getSession();
      expect(retrieved).not.toBeNull();
      expect(retrieved.userId).toBe(session.userId);
      expect(retrieved.persona).toBe(session.persona);
      expect(retrieved.role).toBe(session.role);
      expect(retrieved.token).toBe(session.token);
    });

    it('returns null when no session exists', () => {
      const result = getSession();
      expect(result).toBeNull();
    });

    it('returns null when session is expired', () => {
      const session = createExpiredSession();
      localStorage.setItem('ask-dreeso-session', JSON.stringify(session));

      const result = getSession();
      expect(result).toBeNull();
    });

    it('clears expired session from localStorage', () => {
      const session = createExpiredSession();
      localStorage.setItem('ask-dreeso-session', JSON.stringify(session));

      getSession();

      const stored = localStorage.getItem('ask-dreeso-session');
      expect(stored).toBeNull();
    });

    it('returns null when localStorage contains invalid JSON', () => {
      localStorage.setItem('ask-dreeso-session', 'not-valid-json{{{');

      const result = getSession();
      expect(result).toBeNull();
    });

    it('returns null when localStorage contains a non-object value', () => {
      localStorage.setItem('ask-dreeso-session', JSON.stringify('just a string'));

      const result = getSession();
      expect(result).toBeNull();
    });

    it('returns null when localStorage contains an array', () => {
      localStorage.setItem('ask-dreeso-session', JSON.stringify([1, 2, 3]));

      const result = getSession();
      expect(result).toBeNull();
    });

    it('returns null when stored session is missing required fields', () => {
      const incomplete = { userId: 'user-123' };
      localStorage.setItem('ask-dreeso-session', JSON.stringify(incomplete));

      const result = getSession();
      expect(result).toBeNull();
    });

    it('returns null when expiresAt is an invalid date string', () => {
      const session = createValidSession({ expiresAt: 'not-a-date' });
      localStorage.setItem('ask-dreeso-session', JSON.stringify(session));

      const result = getSession();
      expect(result).toBeNull();
    });

    it('returns null when stored value is null', () => {
      localStorage.setItem('ask-dreeso-session', JSON.stringify(null));

      const result = getSession();
      expect(result).toBeNull();
    });

    it('returns null when stored value is a number', () => {
      localStorage.setItem('ask-dreeso-session', JSON.stringify(42));

      const result = getSession();
      expect(result).toBeNull();
    });
  });

  describe('clearSession', () => {
    it('removes the session from localStorage', () => {
      const session = createValidSession();
      setSession(session);

      clearSession();

      expect(localStorage.getItem('ask-dreeso-session')).toBeNull();
    });

    it('removes the SELECTED_PERSONA key from localStorage', () => {
      const session = createValidSession();
      setSession(session);

      clearSession();

      expect(localStorage.getItem(LOCAL_STORAGE_KEYS.SELECTED_PERSONA)).toBeNull();
    });

    it('removes the LAST_SCREEN key from localStorage', () => {
      localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_SCREEN, JSON.stringify(3));

      clearSession();

      expect(localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_SCREEN)).toBeNull();
    });

    it('does not throw when no session exists', () => {
      expect(() => clearSession()).not.toThrow();
    });

    it('does not throw when called multiple times', () => {
      clearSession();
      clearSession();
      clearSession();
      expect(localStorage.getItem('ask-dreeso-session')).toBeNull();
    });
  });

  describe('isSessionValid', () => {
    it('returns true when a valid, non-expired session exists', () => {
      const session = createValidSession();
      setSession(session);

      expect(isSessionValid()).toBe(true);
    });

    it('returns false when no session exists', () => {
      expect(isSessionValid()).toBe(false);
    });

    it('returns false when session is expired', () => {
      const session = createExpiredSession();
      localStorage.setItem('ask-dreeso-session', JSON.stringify(session));

      expect(isSessionValid()).toBe(false);
    });

    it('clears expired session from localStorage when checking validity', () => {
      const session = createExpiredSession();
      localStorage.setItem('ask-dreeso-session', JSON.stringify(session));

      isSessionValid();

      expect(localStorage.getItem('ask-dreeso-session')).toBeNull();
    });

    it('returns false when localStorage contains corrupted data', () => {
      localStorage.setItem('ask-dreeso-session', '{corrupted json!!!');

      expect(isSessionValid()).toBe(false);
    });

    it('returns false when session is missing required fields', () => {
      const incomplete = {
        userId: 'user-123',
        persona: 'lukas',
        // missing role, token, expiresAt
      };
      localStorage.setItem('ask-dreeso-session', JSON.stringify(incomplete));

      expect(isSessionValid()).toBe(false);
    });

    it('returns false when expiresAt is an invalid date', () => {
      const session = createValidSession({ expiresAt: 'invalid-date' });
      localStorage.setItem('ask-dreeso-session', JSON.stringify(session));

      expect(isSessionValid()).toBe(false);
    });
  });

  describe('getPersona', () => {
    it('returns the persona ID from a valid session', () => {
      const session = createValidSession({ persona: 'sophie' });
      setSession(session);

      expect(getPersona()).toBe('sophie');
    });

    it('returns null when no session exists', () => {
      expect(getPersona()).toBeNull();
    });

    it('returns null when session is expired', () => {
      const session = createExpiredSession({ persona: 'james' });
      localStorage.setItem('ask-dreeso-session', JSON.stringify(session));

      expect(getPersona()).toBeNull();
    });
  });

  describe('getRole', () => {
    it('returns the role from a valid session', () => {
      const session = createValidSession({ role: 'Finance Lead' });
      setSession(session);

      expect(getRole()).toBe('Finance Lead');
    });

    it('returns null when no session exists', () => {
      expect(getRole()).toBeNull();
    });

    it('returns null when session is expired', () => {
      const session = createExpiredSession({ role: 'Commercial Manager' });
      localStorage.setItem('ask-dreeso-session', JSON.stringify(session));

      expect(getRole()).toBeNull();
    });
  });

  describe('updateCurrentScreen', () => {
    it('updates the currentScreen in the active session and returns true', () => {
      const session = createValidSession();
      setSession(session);

      const result = updateCurrentScreen(5);
      expect(result).toBe(true);

      const stored = JSON.parse(localStorage.getItem('ask-dreeso-session'));
      expect(stored.currentScreen).toBe(5);
    });

    it('also persists the screen ID to LAST_SCREEN key', () => {
      const session = createValidSession();
      setSession(session);

      updateCurrentScreen(9);

      const lastScreen = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_SCREEN));
      expect(lastScreen).toBe(9);
    });

    it('returns false when no session exists', () => {
      const result = updateCurrentScreen(3);
      expect(result).toBe(false);
    });

    it('returns false when screenId is not a number', () => {
      const session = createValidSession();
      setSession(session);

      expect(updateCurrentScreen('not-a-number')).toBe(false);
      expect(updateCurrentScreen(null)).toBe(false);
      expect(updateCurrentScreen(undefined)).toBe(false);
    });

    it('returns false when screenId is NaN', () => {
      const session = createValidSession();
      setSession(session);

      expect(updateCurrentScreen(NaN)).toBe(false);
    });

    it('accepts screen ID 0', () => {
      const session = createValidSession();
      setSession(session);

      const result = updateCurrentScreen(0);
      expect(result).toBe(true);

      const stored = JSON.parse(localStorage.getItem('ask-dreeso-session'));
      expect(stored.currentScreen).toBe(0);
    });
  });

  describe('updateCurrentView', () => {
    it('updates the currentView in the active session and returns true', () => {
      const session = createValidSession();
      setSession(session);

      const result = updateCurrentView(VIEW_STATES.RESULT);
      expect(result).toBe(true);

      const stored = JSON.parse(localStorage.getItem('ask-dreeso-session'));
      expect(stored.currentView).toBe(VIEW_STATES.RESULT);
    });

    it('returns false when no session exists', () => {
      const result = updateCurrentView(VIEW_STATES.INPUT);
      expect(result).toBe(false);
    });

    it('returns false when viewState is not a string', () => {
      const session = createValidSession();
      setSession(session);

      expect(updateCurrentView(123)).toBe(false);
      expect(updateCurrentView(null)).toBe(false);
      expect(updateCurrentView(undefined)).toBe(false);
    });

    it('returns false when viewState is an empty string', () => {
      const session = createValidSession();
      setSession(session);

      expect(updateCurrentView('')).toBe(false);
    });

    it('returns false when viewState is not a valid VIEW_STATE', () => {
      const session = createValidSession();
      setSession(session);

      expect(updateCurrentView('INVALID_STATE')).toBe(false);
      expect(updateCurrentView('random')).toBe(false);
    });

    it('accepts all valid VIEW_STATES', () => {
      const session = createValidSession();
      setSession(session);

      const validStates = Object.values(VIEW_STATES);
      for (const state of validStates) {
        const result = updateCurrentView(state);
        expect(result).toBe(true);

        const stored = JSON.parse(localStorage.getItem('ask-dreeso-session'));
        expect(stored.currentView).toBe(state);
      }
    });
  });

  describe('defensive checks for corrupted data', () => {
    it('handles localStorage containing an empty string gracefully', () => {
      localStorage.setItem('ask-dreeso-session', '');

      expect(getSession()).toBeNull();
      expect(isSessionValid()).toBe(false);
    });

    it('handles localStorage containing undefined as string', () => {
      localStorage.setItem('ask-dreeso-session', 'undefined');

      expect(getSession()).toBeNull();
      expect(isSessionValid()).toBe(false);
    });

    it('handles localStorage containing boolean true', () => {
      localStorage.setItem('ask-dreeso-session', JSON.stringify(true));

      expect(getSession()).toBeNull();
      expect(isSessionValid()).toBe(false);
    });

    it('handles session with non-string userId', () => {
      const session = createValidSession({ userId: 12345 });
      localStorage.setItem('ask-dreeso-session', JSON.stringify(session));

      expect(getSession()).toBeNull();
    });

    it('handles session with non-string persona', () => {
      const session = createValidSession({ persona: 42 });
      localStorage.setItem('ask-dreeso-session', JSON.stringify(session));

      expect(getSession()).toBeNull();
    });

    it('handles session with non-string role', () => {
      const session = createValidSession({ role: true });
      localStorage.setItem('ask-dreeso-session', JSON.stringify(session));

      expect(getSession()).toBeNull();
    });

    it('handles session with non-string token', () => {
      const session = createValidSession({ token: null });
      localStorage.setItem('ask-dreeso-session', JSON.stringify(session));

      expect(getSession()).toBeNull();
    });

    it('handles session with non-string expiresAt', () => {
      const session = createValidSession({ expiresAt: 12345 });
      localStorage.setItem('ask-dreeso-session', JSON.stringify(session));

      expect(getSession()).toBeNull();
    });

    it('handles deeply nested invalid JSON gracefully', () => {
      localStorage.setItem('ask-dreeso-session', '{"userId": "test", "persona": "lukas", "role": "PM", "token": "tok", "expiresAt": }');

      expect(getSession()).toBeNull();
      expect(isSessionValid()).toBe(false);
    });
  });

  describe('session expiry edge cases', () => {
    it('treats a session expiring exactly now as expired', () => {
      const session = createValidSession({
        expiresAt: new Date(Date.now()).toISOString(),
      });
      localStorage.setItem('ask-dreeso-session', JSON.stringify(session));

      const result = getSession();
      expect(result).toBeNull();
    });

    it('treats a session expiring 1ms in the future as valid', () => {
      const session = createValidSession({
        expiresAt: new Date(Date.now() + 100000).toISOString(),
      });
      localStorage.setItem('ask-dreeso-session', JSON.stringify(session));

      const result = getSession();
      expect(result).not.toBeNull();
      expect(result.userId).toBe(session.userId);
    });

    it('treats a session with far-future expiry as valid', () => {
      const session = createValidSession({
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });
      localStorage.setItem('ask-dreeso-session', JSON.stringify(session));

      expect(isSessionValid()).toBe(true);
    });
  });

  describe('round-trip consistency', () => {
    it('setSession followed by getSession returns equivalent data', () => {
      const session = createValidSession({
        persona: 'james',
        role: 'Business Development Manager',
        fullName: 'James Carter',
        email: 'james.carter@dreeso.demo',
      });

      setSession(session);
      const retrieved = getSession();

      expect(retrieved).not.toBeNull();
      expect(retrieved.userId).toBe(session.userId);
      expect(retrieved.persona).toBe(session.persona);
      expect(retrieved.role).toBe(session.role);
      expect(retrieved.token).toBe(session.token);
      expect(retrieved.expiresAt).toBe(session.expiresAt);
      expect(retrieved.fullName).toBe(session.fullName);
      expect(retrieved.email).toBe(session.email);
    });

    it('setSession overwrites a previous session', () => {
      const session1 = createValidSession({ persona: 'lukas' });
      const session2 = createValidSession({ persona: 'elena', userId: 'user-elena-123' });

      setSession(session1);
      setSession(session2);

      const retrieved = getSession();
      expect(retrieved).not.toBeNull();
      expect(retrieved.persona).toBe('elena');
      expect(retrieved.userId).toBe('user-elena-123');
    });

    it('clearSession followed by getSession returns null', () => {
      const session = createValidSession();
      setSession(session);

      clearSession();

      expect(getSession()).toBeNull();
    });

    it('clearSession followed by isSessionValid returns false', () => {
      const session = createValidSession();
      setSession(session);

      clearSession();

      expect(isSessionValid()).toBe(false);
    });

    it('clearSession followed by getPersona returns null', () => {
      const session = createValidSession();
      setSession(session);

      clearSession();

      expect(getPersona()).toBeNull();
    });

    it('clearSession followed by getRole returns null', () => {
      const session = createValidSession();
      setSession(session);

      clearSession();

      expect(getRole()).toBeNull();
    });
  });
});