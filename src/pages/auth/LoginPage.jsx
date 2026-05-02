/**
 * User login screen for Ask Dreeso Memory.
 * Screen 1: Login page with email/password form and persona quick login buttons
 * (Lukas, Elena, Sophie, James). Form validation, error handling, and redirect
 * to persona home on success. Uses AuthLayout wrapper and useAuth context.
 *
 * @module LoginPage
 * @see SCRUM-7899
 * @see SCRUM-7900
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import GlassCard from '../../components/ui/GlassCard';
import AnimatedTransition from '../../components/ui/AnimatedTransition';
import { SCREEN_IDS } from '../../constants';
import { getScreenPath } from '../../config/screenConfig';

/**
 * Maximum field length
 * @type {number}
 */
const MAX_FIELD_LENGTH = 256;

/**
 * Validates an email address format.
 *
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
 * Resolves the accent color for a persona.
 *
 * @param {string} personaId - The persona identifier
 * @returns {string} The accent color hex string
 */
function resolvePersonaColor(personaId) {
  const colorMap = {
    lukas: '#3B82F6',
    elena: '#8B5CF6',
    sophie: '#EC4899',
    james: '#F59E0B',
  };

  if (typeof personaId !== 'string') {
    return '#3B82F6';
  }

  const normalized = personaId.toLowerCase();
  return colorMap[normalized] || '#3B82F6';
}

/**
 * PersonaQuickLoginButton sub-component.
 * Renders a single persona quick login button.
 *
 * @param {Object} props
 * @param {Object} props.persona - The persona object
 * @param {function} props.onClick - Click handler
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {boolean} props.loading - Whether this persona is currently loading
 * @returns {React.ReactElement} The persona quick login button element
 */
function PersonaQuickLoginButton({ persona, onClick, disabled, loading }) {
  const accentColor = resolvePersonaColor(persona.id);

  const handleClick = useCallback(() => {
    if (!disabled && typeof onClick === 'function') {
      onClick(persona.id);
    }
  }, [persona.id, disabled, onClick]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  return (
    <button
      type="button"
      className={[
        'flex items-center gap-3 w-full px-4 py-3 rounded-glass-sm',
        'border transition-all duration-300 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
        disabled
          ? 'border-glass-border opacity-50 cursor-not-allowed'
          : 'border-glass-border hover:bg-glass-light hover:border-primary-300 cursor-pointer',
      ]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-label={persona.displayLabel || `Login as ${persona.name}`}
    >
      {/* Avatar */}
      <div
        className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold text-white flex-shrink-0"
        style={{ backgroundColor: accentColor }}
        aria-hidden="true"
      >
        {persona.avatar || (persona.name ? persona.name.charAt(0).toUpperCase() : '?')}
      </div>

      {/* Name and Role */}
      <div className="flex flex-col items-start flex-1 min-w-0">
        <span className="text-sm font-semibold text-primary-50 leading-tight truncate w-full text-left">
          {persona.name}
        </span>
        <span className="text-xs text-primary-200 leading-tight truncate w-full text-left">
          {persona.role}
        </span>
      </div>

      {/* Loading or Arrow */}
      {loading ? (
        <svg
          className="w-4 h-4 animate-spin text-primary-200 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <svg
          className="w-4 h-4 text-primary-300 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      )}
    </button>
  );
}

/**
 * LoginPage component.
 * Renders the user login form with email and password fields, form validation,
 * error display, and persona quick login buttons for Lukas, Elena, Sophie, and James.
 * Redirects to the dashboard on successful authentication.
 *
 * @returns {React.ReactElement} The login page component
 */
function LoginPage() {
  const { login, personaLogin, isAuthenticated, loading, error: authError, clearError, getPersonas } = useAuth();
  const navigate = useNavigate();
  const emailRef = useRef(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [personaLoginInProgress, setPersonaLoginInProgress] = useState(null);

  const [fieldErrors, setFieldErrors] = useState({
    email: null,
    password: null,
  });

  const [formError, setFormError] = useState(null);

  /**
   * Resolves available personas for quick login
   */
  const availablePersonas = useMemo(() => {
    return getPersonas();
  }, [getPersonas]);

  /**
   * Auto-focus the email field on mount
   */
  useEffect(() => {
    if (emailRef.current) {
      emailRef.current.focus();
    }
  }, []);

  /**
   * Redirect to dashboard if already authenticated
   */
  useEffect(() => {
    if (isAuthenticated) {
      const dashboardPath = getScreenPath(SCREEN_IDS.DASHBOARD);
      navigate(dashboardPath, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  /**
   * Sync auth context error to form error
   */
  useEffect(() => {
    if (authError && authError.message) {
      setFormError(authError.message);
    }
  }, [authError]);

  /**
   * Clears a specific field error when the user modifies the field
   *
   * @param {string} field - The field name to clear
   */
  const clearFieldError = useCallback((field) => {
    setFieldErrors((prev) => {
      if (prev[field] === null) {
        return prev;
      }
      return { ...prev, [field]: null };
    });
  }, []);

  /**
   * Handles email input change
   * @param {React.ChangeEvent<HTMLInputElement>} event - The change event
   */
  const handleEmailChange = useCallback((event) => {
    const value = event.target.value;
    if (value.length > MAX_FIELD_LENGTH) {
      return;
    }
    setEmail(value);
    clearFieldError('email');
    if (formError) {
      setFormError(null);
    }
    if (authError) {
      clearError();
    }
  }, [formError, authError, clearError, clearFieldError]);

  /**
   * Handles password input change
   * @param {React.ChangeEvent<HTMLInputElement>} event - The change event
   */
  const handlePasswordChange = useCallback((event) => {
    const value = event.target.value;
    if (value.length > MAX_FIELD_LENGTH) {
      return;
    }
    setPassword(value);
    clearFieldError('password');
    if (formError) {
      setFormError(null);
    }
    if (authError) {
      clearError();
    }
  }, [formError, authError, clearError, clearFieldError]);

  /**
   * Toggles password visibility
   */
  const toggleShowPassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  /**
   * Validates all form fields
   * @returns {boolean} True if all fields are valid
   */
  const validateForm = useCallback(() => {
    const errors = {
      email: null,
      password: null,
    };

    let isValid = true;

    // Validate email
    if (email.trim().length === 0) {
      errors.email = 'Email is required.';
      isValid = false;
    } else if (!isValidEmail(email)) {
      errors.email = 'Please enter a valid email address.';
      isValid = false;
    }

    // Validate password
    if (password.length === 0) {
      errors.password = 'Password is required.';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  }, [email, password]);

  /**
   * Handles form submission
   * @param {React.FormEvent} event - The form event
   */
  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();

    if (loading || loginInProgress || personaLoginInProgress !== null) {
      return;
    }

    setFormError(null);

    if (!validateForm()) {
      return;
    }

    setLoginInProgress(true);

    try {
      const response = await login(email.trim(), password);

      if (response && response.status === 'success') {
        const dashboardPath = getScreenPath(SCREEN_IDS.DASHBOARD);
        navigate(dashboardPath, { replace: true });
      } else if (response && response.message) {
        setFormError(response.message);
      }
    } catch {
      setFormError('An unexpected error occurred. Please try again.');
    } finally {
      setLoginInProgress(false);
    }
  }, [loading, loginInProgress, personaLoginInProgress, validateForm, login, email, password, navigate]);

  /**
   * Handles persona quick login
   * @param {string} personaId - The persona ID to login as
   */
  const handlePersonaLogin = useCallback(async (personaId) => {
    if (loading || loginInProgress || personaLoginInProgress !== null) {
      return;
    }

    setFormError(null);
    setFieldErrors({ email: null, password: null });
    setPersonaLoginInProgress(personaId);

    if (authError) {
      clearError();
    }

    try {
      const response = await personaLogin(personaId);

      if (response && response.status === 'success') {
        const dashboardPath = getScreenPath(SCREEN_IDS.DASHBOARD);
        navigate(dashboardPath, { replace: true });
      } else if (response && response.message) {
        setFormError(response.message);
      }
    } catch {
      setFormError('An unexpected error occurred during persona login.');
    } finally {
      setPersonaLoginInProgress(null);
    }
  }, [loading, loginInProgress, personaLoginInProgress, authError, clearError, personaLogin, navigate]);

  const isFormDisabled = loading || loginInProgress || personaLoginInProgress !== null;
  const signupPath = '/signup';

  return (
    <AnimatedTransition show type="scale" duration="normal">
      <GlassCard variant="default" padding="lg" animated>
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <span
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-white bg-accent-blue flex-shrink-0 shadow-accent-glow mb-4"
            aria-hidden="true"
          >
            D
          </span>
          <h1 className="text-xl font-semibold text-primary-50 leading-tight">
            Welcome Back
          </h1>
          <p className="text-sm text-primary-200 mt-1">
            Sign in to Ask Dreeso Memory
          </p>
        </div>

        {/* Form Error */}
        <AnimatedTransition
          show={Boolean(formError)}
          type="slide-up"
          duration="fast"
          unmountOnExit
        >
          <div
            className="flex items-start gap-2 px-4 py-3 rounded-glass-sm bg-red-400 bg-opacity-10 border border-red-400 border-opacity-20 mb-6"
            role="alert"
          >
            <svg
              className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-red-400 leading-relaxed">
              {formError}
            </p>
          </div>
        </AnimatedTransition>

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="login-email"
                className="text-sm font-medium text-primary-100"
              >
                Email
                <span className="text-red-400 ml-0.5" aria-hidden="true">*</span>
              </label>
              <input
                ref={emailRef}
                id="login-email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Enter your email address"
                disabled={isFormDisabled}
                required
                maxLength={MAX_FIELD_LENGTH}
                autoComplete="email"
                className={[
                  'w-full px-4 py-2.5 rounded-glass-sm',
                  'bg-glass-light border transition-all duration-300 ease-in-out',
                  'text-primary-50 text-sm placeholder-primary-300',
                  'outline-none',
                  'focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
                  fieldErrors.email
                    ? 'border-red-400 border-opacity-60'
                    : 'border-glass-border hover:border-primary-300',
                  isFormDisabled ? 'opacity-60 cursor-not-allowed' : '',
                ]
                  .filter(Boolean)
                  .join(' ')
                  .replace(/\s+/g, ' ')
                  .trim()}
                aria-invalid={fieldErrors.email ? 'true' : 'false'}
                aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
              />
              <AnimatedTransition
                show={Boolean(fieldErrors.email)}
                type="slide-up"
                duration="fast"
                unmountOnExit
              >
                <p
                  id="login-email-error"
                  className="text-xs text-red-400 flex items-center gap-1"
                  role="alert"
                >
                  <svg
                    className="w-3.5 h-3.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{fieldErrors.email}</span>
                </p>
              </AnimatedTransition>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="login-password"
                className="text-sm font-medium text-primary-100"
              >
                Password
                <span className="text-red-400 ml-0.5" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Enter your password"
                  disabled={isFormDisabled}
                  required
                  maxLength={MAX_FIELD_LENGTH}
                  autoComplete="current-password"
                  className={[
                    'w-full px-4 py-2.5 pr-10 rounded-glass-sm',
                    'bg-glass-light border transition-all duration-300 ease-in-out',
                    'text-primary-50 text-sm placeholder-primary-300',
                    'outline-none',
                    'focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
                    fieldErrors.password
                      ? 'border-red-400 border-opacity-60'
                      : 'border-glass-border hover:border-primary-300',
                    isFormDisabled ? 'opacity-60 cursor-not-allowed' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')
                    .replace(/\s+/g, ' ')
                    .trim()}
                  aria-invalid={fieldErrors.password ? 'true' : 'false'}
                  aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-300 hover:text-primary-100 transition-colors duration-200 focus:outline-none"
                  onClick={toggleShowPassword}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <AnimatedTransition
                show={Boolean(fieldErrors.password)}
                type="slide-up"
                duration="fast"
                unmountOnExit
              >
                <p
                  id="login-password-error"
                  className="text-xs text-red-400 flex items-center gap-1"
                  role="alert"
                >
                  <svg
                    className="w-3.5 h-3.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{fieldErrors.password}</span>
                </p>
              </AnimatedTransition>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6">
            <button
              type="submit"
              className={[
                'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-glass-sm',
                'text-sm font-semibold text-white',
                'transition-all duration-300 ease-in-out',
                'focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
                isFormDisabled
                  ? 'bg-accent-blue bg-opacity-50 cursor-not-allowed'
                  : 'bg-accent-blue hover:bg-opacity-90 active:bg-opacity-80 shadow-accent-glow',
              ]
                .filter(Boolean)
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim()}
              disabled={isFormDisabled}
              aria-label={loginInProgress ? 'Signing in...' : 'Sign in'}
            >
              {loginInProgress ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Sign In</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-glass-border" aria-hidden="true" />
          <span className="text-xs text-primary-300 font-medium uppercase tracking-wider">
            Or quick login as
          </span>
          <div className="flex-1 h-px bg-glass-border" aria-hidden="true" />
        </div>

        {/* Persona Quick Login Buttons */}
        {Array.isArray(availablePersonas) && availablePersonas.length > 0 ? (
          <div className="flex flex-col gap-2">
            {availablePersonas.map((persona) => (
              <PersonaQuickLoginButton
                key={persona.id}
                persona={persona}
                onClick={handlePersonaLogin}
                disabled={isFormDisabled}
                loading={personaLoginInProgress === persona.id}
              />
            ))}
          </div>
        ) : null}

        {/* Footer Links */}
        <div className="mt-6 pt-4 border-t border-glass-border">
          <p className="text-sm text-primary-200 text-center">
            Don&apos;t have an account?{' '}
            <Link
              to={signupPath}
              className="text-accent-blue font-medium hover:text-opacity-80 transition-colors duration-200 focus:outline-none focus:underline"
            >
              Create account
            </Link>
          </p>
        </div>
      </GlassCard>
    </AnimatedTransition>
  );
}

export default LoginPage;