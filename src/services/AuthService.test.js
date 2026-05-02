import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  signup,
  login,
  logout,
  getUserByEmail,
  validateCredentials,
} from './AuthService';
import { LOCAL_STORAGE_KEYS } from '../constants';

/**
 * Helper to clear all relevant localStorage keys before/after each test.
 */
function clearAllStorage() {
  localStorage.clear();
}

/**
 * Valid signup parameters for testing.
 * @param {Object} [overrides={}] - Fields to override
 * @returns {{ fullName: string, email: string, password: string, role: string }}
 */
function validSignupParams(overrides = {}) {
  return {
    fullName: 'Test User',
    email: `test-${Date.now()}@dreeso.demo`,
    password: 'SecurePass1!',
    role: 'Project Director',
    ...overrides,
  };
}

describe('AuthService', () => {
  beforeEach(() => {
    clearAllStorage();
  });

  afterEach(() => {
    clearAllStorage();
  });

  describe('signup', () => {
    it('creates a new user account and returns success with user and session data', async () => {
      const params = validSignupParams();
      const response = await signup(params.fullName, params.email, params.password, params.role);

      expect(response).not.toBeNull();
      expect(response.status).toBe('success');
      expect(response.user).toBeDefined();
      expect(response.user.fullName).toBe(params.fullName);
      expect(response.user.email).toBe(params.email.toLowerCase());
      expect(response.user.role).toBe(params.role);
      expect(typeof response.user.userId).toBe('string');
      expect(response.user.userId.length).toBeGreaterThan(0);

      expect(response.session).toBeDefined();
      expect(typeof response.session.persona).toBe('string');
      expect(response.session.persona.length).toBeGreaterThan(0);
      expect(typeof response.session.token).toBe('string');
      expect(response.session.token.length).toBeGreaterThan(0);
      expect(typeof response.session.expiresAt).toBe('string');
      expect(response.session.role).toBe(params.role);
    });

    it('persists the user record to localStorage', async () => {
      const params = validSignupParams();
      await signup(params.fullName, params.email, params.password, params.role);

      const stored = JSON.parse(localStorage.getItem('ask-dreeso-users'));
      expect(Array.isArray(stored)).toBe(true);
      expect(stored.length).toBe(1);
      expect(stored[0].email).toBe(params.email.toLowerCase());
      expect(stored[0].fullName).toBe(params.fullName);
      expect(stored[0].role).toBe(params.role);
      expect(typeof stored[0].passwordHash).toBe('string');
      expect(stored[0].passwordHash.length).toBeGreaterThan(0);
    });

    it('creates a session in localStorage after signup', async () => {
      const params = validSignupParams();
      await signup(params.fullName, params.email, params.password, params.role);

      const session = JSON.parse(localStorage.getItem('ask-dreeso-session'));
      expect(session).not.toBeNull();
      expect(session.userId).toBeDefined();
      expect(session.persona).toBeDefined();
      expect(session.role).toBe(params.role);
      expect(session.token).toBeDefined();
      expect(session.expiresAt).toBeDefined();
    });

    it('maps Project Director role to lukas persona', async () => {
      const params = validSignupParams({ role: 'Project Director' });
      const response = await signup(params.fullName, params.email, params.password, params.role);

      expect(response.status).toBe('success');
      expect(response.session.persona).toBe('lukas');
    });

    it('maps Commercial Manager role to elena persona', async () => {
      const params = validSignupParams({ role: 'Commercial Manager' });
      const response = await signup(params.fullName, params.email, params.password, params.role);

      expect(response.status).toBe('success');
      expect(response.session.persona).toBe('elena');
    });

    it('maps Finance Lead role to sophie persona', async () => {
      const params = validSignupParams({ role: 'Finance Lead' });
      const response = await signup(params.fullName, params.email, params.password, params.role);

      expect(response.status).toBe('success');
      expect(response.session.persona).toBe('sophie');
    });

    it('maps Business Development Manager role to james persona', async () => {
      const params = validSignupParams({ role: 'Business Development Manager' });
      const response = await signup(params.fullName, params.email, params.password, params.role);

      expect(response.status).toBe('success');
      expect(response.session.persona).toBe('james');
    });

    it('returns error when fullName is empty', async () => {
      const params = validSignupParams({ fullName: '' });
      const response = await signup(params.fullName, params.email, params.password, params.role);

      expect(response.status).toBe('error');
      expect(response.errorCode).toBe('VALIDATION_ERROR');
      expect(response.message).toContain('Full name');
    });

    it('returns error when fullName is not a string', async () => {
      const response = await signup(null, 'test@test.com', 'SecurePass1!', 'Engineer');

      expect(response.status).toBe('error');
      expect(response.errorCode).toBe('VALIDATION_ERROR');
    });

    it('returns error when email is empty', async () => {
      const response = await signup('Test User', '', 'SecurePass1!', 'Engineer');

      expect(response.status).toBe('error');
      expect(response.errorCode).toBe('VALIDATION_ERROR');
      expect(response.message).toContain('Email');
    });

    it('returns error when email is not a string', async () => {
      const response = await signup('Test User', undefined, 'SecurePass1!', 'Engineer');

      expect(response.status).toBe('error');
      expect(response.errorCode).toBe('VALIDATION_ERROR');
    });

    it('returns error when email format is invalid', async () => {
      const response = await signup('Test User', 'not-an-email', 'SecurePass1!', 'Engineer');

      expect(response.status).toBe('error');
      expect(response.errorCode).toBe('VALIDATION_ERROR');
      expect(response.message).toContain('email');
    });

    it('returns error when password is empty', async () => {
      const response = await signup('Test User', 'test@test.com', '', 'Engineer');

      expect(response.status).toBe('error');
      expect(response.errorCode).toBe('VALIDATION_ERROR');
      expect(response.message).toContain('Password');
    });

    it('returns error when password is not a string', async () => {
      const response = await signup('Test User', 'test@test.com', null, 'Engineer');

      expect(response.status).toBe('error');
      expect(response.errorCode).toBe('VALIDATION_ERROR');
    });

    it('returns error when password is too short', async () => {
      const response = await signup('Test User', 'test@test.com', 'Ab1!', 'Engineer');

      expect(response.status).toBe('error');
      expect(response.errorCode).toBe('VALIDATION_ERROR');
      expect(response.message).toContain('8');
    });

    it('returns error when password has no uppercase letter', async () => {
      const response = await signup('Test User', 'test@test.com', 'securepass1!', 'Engineer');

      expect(response.status).toBe('error');
      expect(response.errorCode).toBe('VALIDATION_ERROR');
      expect(response.message).toContain('uppercase');
    });

    it('returns error when password has no number', async () => {
      const response = await signup('Test User', 'test@test.com', 'SecurePass!', 'Engineer');

      expect(response.status).toBe('error');
      expect(response.errorCode).toBe('VALIDATION_ERROR');
      expect(response.message).toContain('number');
    });

    it('returns error when password has no special character', async () => {
      const response = await signup('Test User', 'test@test.com', 'SecurePass1', 'Engineer');

      expect(response.status).toBe('error');
      expect(response.errorCode).toBe('VALIDATION_ERROR');
      expect(response.message).toContain('special');
    });

    it('returns error when role is empty', async () => {
      const response = await signup('Test User', 'test@test.com', 'SecurePass1!', '');

      expect(response.status).toBe('error');
      expect(response.errorCode).toBe('VALIDATION_ERROR');
      expect(response.message).toContain('Role');
    });

    it('returns error when role is not a string', async () => {
      const response = await signup('Test User', 'test@test.com', 'SecurePass1!', undefined);

      expect(response.status).toBe('error');
      expect(response.errorCode).toBe('VALIDATION_ERROR');
    });

    it('returns error when email already exists', async () => {
      const params = validSignupParams();
      await signup(params.fullName, params.email, params.password, params.role);

      const response = await signup('Another User', params.email, 'AnotherPass1!', 'Engineer');

      expect(response.status).toBe('error');
      expect(response.errorCode).toBe('EMAIL_EXISTS');
      expect(response.message).toContain('already exists');
    });

    it('treats email as case-insensitive for duplicate check', async () => {
      const params = validSignupParams({ email: 'Test@Dreeso.Demo' });
      await signup(params.fullName, params.email, params.password, params.role);

      const response = await signup('Another User', 'test@dreeso.demo', 'AnotherPass1!', 'Engineer');

      expect(response.status).toBe('error');
      expect(response.errorCode).toBe('EMAIL_EXISTS');
    });

    it('trims whitespace from fullName and email', async () => {
      const params = validSignupParams({
        fullName: '  Trimmed Name  ',
        email: '  trimmed@dreeso.demo  ',
      });
      const response = await signup(params.fullName, params.email, params.password, params.role);

      expect(response.status).toBe('success');
      expect(response.user.fullName).toBe('Trimmed Name');
      expect(response.user.email).toBe('trimmed@dreeso.demo');
    });

    it('stores multiple users correctly', async () => {
      const params1 = validSignupParams({ email: 'user1@dreeso.demo' });
      const params2 = validSignupParams({ email: 'user2@dreeso.demo', fullName: 'User Two' });

      await signup(params1.fullName, params1.email, params1.password, params1.role);
      await signup(params2.fullName, params2.email, params2.password, params2.role);

      const stored = JSON.parse(localStorage.getItem('ask-dreeso-users'));
      expect(Array.isArray(stored)).toBe(true);
      expect(stored.length).toBe(2);
    });
  });

  describe('login', () => {
    it('authenticates a user with valid credentials and returns success', async () => {
      const params = validSignupParams();
      await signup(params.fullName, params.email, params.password, params.role);

      // Clear session to simulate fresh login
      localStorage.removeItem('ask-dreeso-session');

      const response = await login(params.email, params.password);

      expect(response.status).toBe('success');
      expect(response.user).toBeDefined();
      expect(response.user.email).toBe(params.email.toLowerCase());
      expect(response.user.fullName).toBe(params.fullName);
      expect(response.user.role).toBe(params.role);

      expect(response.session).toBeDefined();
      expect(typeof response.session.persona).toBe('string');
      expect(typeof response.session.token).toBe('string');
      expect(typeof response.session.expiresAt).toBe('string');
    });

    it('creates a session in localStorage after login', async () => {
      const params = validSignupParams();
      await signup(params.fullName, params.email, params.password, params.role);

      localStorage.removeItem('ask-dreeso-session');

      await login(params.email, params.password);

      const session = JSON.parse(localStorage.getItem('ask-dreeso-session'));
      expect(session).not.toBeNull();
      expect(session.userId).toBeDefined();
      expect(session.persona).toBeDefined();
      expect(session.token).toBeDefined();
    });

    it('returns error when email is empty', async () => {
      const response = await login('', 'SomePass1!');

      expect(response.status).toBe('error');
      expect(response.errorCode).toBe('VALIDATION_ERROR');
      expect(response.message).toContain('Email');
    });

    it('returns error when email is not a string', async () => {
      const response = await login(null, 'SomePass1!');

      expect(response.status).toBe('error');
      expect(response.errorCode).toBe('VALIDATION_ERROR');
    });

    it('returns error when email format is invalid', async () => {
      const response = await login('not-an-email', 'SomePass1!');

      expect(response.status).toBe('error');
      expect(response.errorCode).toBe('VALIDATION_ERROR');
      expect(response.message).toContain('email');
    });

    it('returns error when password is empty', async () => {
      const response = await login('test@test.com', '');

      expect(response.status).toBe('error');
      expect(response.errorCode).toBe('VALIDATION_ERROR');
      expect(response.message).toContain('Password');
    });

    it('returns error when password is not a string', async () => {
      const response = await login('test@test.com', undefined);

      expect(response.status).toBe('error');
      expect(response.errorCode).toBe('VALIDATION_ERROR');
    });

    it('returns error when user does not exist', async () => {
      const response = await login('nonexistent@dreeso.demo', 'SomePass1!');

      expect(response.status).toBe('error');
      expect(response.errorCode).toBe('AUTH_FAILED');
      expect(response.message).toContain('Invalid');
    });

    it('returns error when password is incorrect', async () => {
      const params = validSignupParams();
      await signup(params.fullName, params.email, params.password, params.role);

      localStorage.removeItem('ask-dreeso-session');

      const response = await login(params.email, 'WrongPassword1!');

      expect(response.status).toBe('error');
      expect(response.errorCode).toBe('AUTH_FAILED');
      expect(response.message).toContain('Invalid');
    });

    it('handles case-insensitive email matching for login', async () => {
      const params = validSignupParams({ email: 'CaseTest@Dreeso.Demo' });
      await signup(params.fullName, params.email, params.password, params.role);

      localStorage.removeItem('ask-dreeso-session');

      const response = await login('casetest@dreeso.demo', params.password);

      expect(response.status).toBe('success');
      expect(response.user.email).toBe('casetest@dreeso.demo');
    });

    it('trims whitespace from email before login', async () => {
      const params = validSignupParams({ email: 'trimlogin@dreeso.demo' });
      await signup(params.fullName, params.email, params.password, params.role);

      localStorage.removeItem('ask-dreeso-session');

      const response = await login('  trimlogin@dreeso.demo  ', params.password);

      expect(response.status).toBe('success');
    });
  });

  describe('logout', () => {
    it('clears the session from localStorage and returns success', async () => {
      const params = validSignupParams();
      await signup(params.fullName, params.email, params.password, params.role);

      expect(localStorage.getItem('ask-dreeso-session')).not.toBeNull();

      const response = await logout();

      expect(response.status).toBe('success');
      expect(localStorage.getItem('ask-dreeso-session')).toBeNull();
    });

    it('returns success even when no session exists', async () => {
      const response = await logout();

      expect(response.status).toBe('success');
    });

    it('clears the SELECTED_PERSONA key from localStorage', async () => {
      const params = validSignupParams();
      await signup(params.fullName, params.email, params.password, params.role);

      expect(localStorage.getItem(LOCAL_STORAGE_KEYS.SELECTED_PERSONA)).not.toBeNull();

      await logout();

      expect(localStorage.getItem(LOCAL_STORAGE_KEYS.SELECTED_PERSONA)).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('returns the user record when email exists', async () => {
      const params = validSignupParams({ email: 'findme@dreeso.demo' });
      await signup(params.fullName, params.email, params.password, params.role);

      const user = getUserByEmail('findme@dreeso.demo');

      expect(user).not.toBeNull();
      expect(user.email).toBe('findme@dreeso.demo');
      expect(user.fullName).toBe(params.fullName);
      expect(user.role).toBe(params.role);
    });

    it('returns null when email does not exist', () => {
      const user = getUserByEmail('nonexistent@dreeso.demo');

      expect(user).toBeNull();
    });

    it('returns null when email is empty string', () => {
      const user = getUserByEmail('');

      expect(user).toBeNull();
    });

    it('returns null when email is not a string', () => {
      const user = getUserByEmail(null);

      expect(user).toBeNull();
    });

    it('performs case-insensitive email lookup', async () => {
      const params = validSignupParams({ email: 'CaseLookup@Dreeso.Demo' });
      await signup(params.fullName, params.email, params.password, params.role);

      const user = getUserByEmail('caselookup@dreeso.demo');

      expect(user).not.toBeNull();
      expect(user.email).toBe('caselookup@dreeso.demo');
    });

    it('returns null when localStorage has no users', () => {
      const user = getUserByEmail('test@test.com');

      expect(user).toBeNull();
    });

    it('handles corrupted localStorage gracefully', () => {
      localStorage.setItem('ask-dreeso-users', 'not-valid-json{{{');

      const user = getUserByEmail('test@test.com');

      expect(user).toBeNull();
    });

    it('handles non-array localStorage value gracefully', () => {
      localStorage.setItem('ask-dreeso-users', JSON.stringify('just a string'));

      const user = getUserByEmail('test@test.com');

      expect(user).toBeNull();
    });
  });

  describe('validateCredentials', () => {
    it('returns valid true and user when credentials are correct', async () => {
      const params = validSignupParams({ email: 'validate@dreeso.demo' });
      await signup(params.fullName, params.email, params.password, params.role);

      const result = validateCredentials('validate@dreeso.demo', params.password);

      expect(result.valid).toBe(true);
      expect(result.user).not.toBeNull();
      expect(result.user.email).toBe('validate@dreeso.demo');
      expect(result.message).toBe('');
    });

    it('returns valid false when email does not exist', () => {
      const result = validateCredentials('nobody@dreeso.demo', 'SomePass1!');

      expect(result.valid).toBe(false);
      expect(result.user).toBeNull();
      expect(result.message).toContain('Invalid');
    });

    it('returns valid false when password is wrong', async () => {
      const params = validSignupParams({ email: 'wrongpw@dreeso.demo' });
      await signup(params.fullName, params.email, params.password, params.role);

      const result = validateCredentials('wrongpw@dreeso.demo', 'WrongPassword1!');

      expect(result.valid).toBe(false);
      expect(result.user).toBeNull();
      expect(result.message).toContain('Invalid');
    });

    it('returns valid false when email is empty', () => {
      const result = validateCredentials('', 'SomePass1!');

      expect(result.valid).toBe(false);
      expect(result.user).toBeNull();
      expect(result.message).toContain('Email');
    });

    it('returns valid false when email is not a string', () => {
      const result = validateCredentials(undefined, 'SomePass1!');

      expect(result.valid).toBe(false);
      expect(result.user).toBeNull();
    });

    it('returns valid false when password is empty', () => {
      const result = validateCredentials('test@test.com', '');

      expect(result.valid).toBe(false);
      expect(result.user).toBeNull();
      expect(result.message).toContain('Password');
    });

    it('returns valid false when password is not a string', () => {
      const result = validateCredentials('test@test.com', null);

      expect(result.valid).toBe(false);
      expect(result.user).toBeNull();
    });

    it('returns valid false when email format is invalid', () => {
      const result = validateCredentials('not-an-email', 'SomePass1!');

      expect(result.valid).toBe(false);
      expect(result.user).toBeNull();
      expect(result.message).toContain('email');
    });
  });

  describe('end-to-end flow', () => {
    it('signup then login with same credentials succeeds', async () => {
      const params = validSignupParams({ email: 'e2e@dreeso.demo' });
      const signupResponse = await signup(params.fullName, params.email, params.password, params.role);
      expect(signupResponse.status).toBe('success');

      localStorage.removeItem('ask-dreeso-session');

      const loginResponse = await login(params.email, params.password);
      expect(loginResponse.status).toBe('success');
      expect(loginResponse.user.email).toBe(params.email.toLowerCase());
    });

    it('signup then logout then login succeeds', async () => {
      const params = validSignupParams({ email: 'e2e-logout@dreeso.demo' });
      await signup(params.fullName, params.email, params.password, params.role);

      await logout();
      expect(localStorage.getItem('ask-dreeso-session')).toBeNull();

      const loginResponse = await login(params.email, params.password);
      expect(loginResponse.status).toBe('success');
      expect(loginResponse.user.email).toBe(params.email.toLowerCase());

      const session = JSON.parse(localStorage.getItem('ask-dreeso-session'));
      expect(session).not.toBeNull();
      expect(session.persona).toBeDefined();
    });

    it('user record persists after logout', async () => {
      const params = validSignupParams({ email: 'persist@dreeso.demo' });
      await signup(params.fullName, params.email, params.password, params.role);

      await logout();

      const user = getUserByEmail('persist@dreeso.demo');
      expect(user).not.toBeNull();
      expect(user.fullName).toBe(params.fullName);
    });

    it('multiple signups create separate user records', async () => {
      await signup('User One', 'one@dreeso.demo', 'SecurePass1!', 'Engineer');
      await signup('User Two', 'two@dreeso.demo', 'SecurePass2!', 'Analyst');
      await signup('User Three', 'three@dreeso.demo', 'SecurePass3!', 'Finance Lead');

      const stored = JSON.parse(localStorage.getItem('ask-dreeso-users'));
      expect(stored.length).toBe(3);

      const emails = stored.map((u) => u.email);
      expect(emails).toContain('one@dreeso.demo');
      expect(emails).toContain('two@dreeso.demo');
      expect(emails).toContain('three@dreeso.demo');
    });

    it('login with one user does not affect other user records', async () => {
      await signup('User One', 'one@dreeso.demo', 'SecurePass1!', 'Engineer');
      await signup('User Two', 'two@dreeso.demo', 'SecurePass2!', 'Analyst');

      localStorage.removeItem('ask-dreeso-session');

      const loginResponse = await login('one@dreeso.demo', 'SecurePass1!');
      expect(loginResponse.status).toBe('success');

      const userTwo = getUserByEmail('two@dreeso.demo');
      expect(userTwo).not.toBeNull();
      expect(userTwo.fullName).toBe('User Two');
    });
  });

  describe('session expiry', () => {
    it('creates a session with a future expiresAt timestamp', async () => {
      const params = validSignupParams();
      const response = await signup(params.fullName, params.email, params.password, params.role);

      expect(response.status).toBe('success');

      const expiresAt = new Date(response.session.expiresAt).getTime();
      expect(expiresAt).toBeGreaterThan(Date.now());
    });

    it('login creates a session with a future expiresAt timestamp', async () => {
      const params = validSignupParams();
      await signup(params.fullName, params.email, params.password, params.role);

      localStorage.removeItem('ask-dreeso-session');

      const response = await login(params.email, params.password);

      expect(response.status).toBe('success');

      const expiresAt = new Date(response.session.expiresAt).getTime();
      expect(expiresAt).toBeGreaterThan(Date.now());
    });
  });

  describe('password hashing', () => {
    it('does not store the plaintext password', async () => {
      const params = validSignupParams({ email: 'hash-check@dreeso.demo' });
      await signup(params.fullName, params.email, params.password, params.role);

      const stored = JSON.parse(localStorage.getItem('ask-dreeso-users'));
      const user = stored.find((u) => u.email === 'hash-check@dreeso.demo');

      expect(user).toBeDefined();
      expect(user.passwordHash).toBeDefined();
      expect(user.passwordHash).not.toBe(params.password);
      expect(user.password).toBeUndefined();
    });

    it('different passwords produce different hashes', async () => {
      await signup('User A', 'a@dreeso.demo', 'PasswordA1!', 'Engineer');
      await signup('User B', 'b@dreeso.demo', 'PasswordB2!', 'Analyst');

      const stored = JSON.parse(localStorage.getItem('ask-dreeso-users'));
      const userA = stored.find((u) => u.email === 'a@dreeso.demo');
      const userB = stored.find((u) => u.email === 'b@dreeso.demo');

      expect(userA.passwordHash).not.toBe(userB.passwordHash);
    });
  });

  describe('persona mapping edge cases', () => {
    it('maps a role containing "procurement" to elena persona', async () => {
      const params = validSignupParams({ role: 'Senior Procurement Officer' });
      const response = await signup(params.fullName, params.email, params.password, params.role);

      expect(response.status).toBe('success');
      expect(response.session.persona).toBe('elena');
    });

    it('maps a role containing "sales" to james persona', async () => {
      const params = validSignupParams({ role: 'Sales Manager' });
      const response = await signup(params.fullName, params.email, params.password, params.role);

      expect(response.status).toBe('success');
      expect(response.session.persona).toBe('james');
    });

    it('maps a role containing "cash" to sophie persona', async () => {
      const params = validSignupParams({ role: 'Cash Flow Analyst' });
      const response = await signup(params.fullName, params.email, params.password, params.role);

      expect(response.status).toBe('success');
      expect(response.session.persona).toBe('sophie');
    });

    it('falls back to lukas persona for unrecognized roles', async () => {
      const params = validSignupParams({ role: 'Unknown Role XYZ', fullName: 'Random Person' });
      const response = await signup(params.fullName, params.email, params.password, params.role);

      expect(response.status).toBe('success');
      expect(response.session.persona).toBe('lukas');
    });

    it('detects persona from fullName when role does not match', async () => {
      const params = validSignupParams({ role: 'General Staff', fullName: 'Elena Someone' });
      const response = await signup(params.fullName, params.email, params.password, params.role);

      expect(response.status).toBe('success');
      expect(response.session.persona).toBe('elena');
    });
  });

  describe('defensive checks for corrupted localStorage', () => {
    it('signup handles corrupted users storage gracefully', async () => {
      localStorage.setItem('ask-dreeso-users', 'corrupted{{{data');

      const params = validSignupParams();
      const response = await signup(params.fullName, params.email, params.password, params.role);

      // Should still succeed because readUsers returns [] on parse error
      expect(response.status).toBe('success');
    });

    it('login handles corrupted users storage gracefully', async () => {
      localStorage.setItem('ask-dreeso-users', 'corrupted{{{data');

      const response = await login('test@test.com', 'SomePass1!');

      expect(response.status).toBe('error');
      expect(response.errorCode).toBe('AUTH_FAILED');
    });

    it('signup handles non-array users storage gracefully', async () => {
      localStorage.setItem('ask-dreeso-users', JSON.stringify({ not: 'an array' }));

      const params = validSignupParams();
      const response = await signup(params.fullName, params.email, params.password, params.role);

      expect(response.status).toBe('success');
    });
  });
});