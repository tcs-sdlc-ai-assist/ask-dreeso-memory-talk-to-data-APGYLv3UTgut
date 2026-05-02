/**
 * User registration screen for Ask Dreeso Memory.
 * Screen 0: Signup page with Full Name, Email, Password, Confirm Password,
 * and Role Selection fields. Form validation, error display, and redirect
 * to home on success. Uses AuthLayout wrapper and useAuth context.
 *
 * @module SignupPage
 * @see SCRUM-7898
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import GlassCard from '../../components/ui/GlassCard';
import AnimatedTransition from '../../components/ui/AnimatedTransition';
import { SCREEN_IDS } from '../../constants';
import { getScreenPath } from '../../config/screenConfig';

/**
 * Minimum password length
 * @type {number}
 */
const MIN_PASSWORD_LENGTH = 8;

/**
 * Maximum field length
 * @type {number}
 */
const MAX_FIELD_LENGTH = 256;

/**
 * Available role options for registration
 * @type {Array<{ value: string, label: string }>}
 */
const ROLE_OPTIONS = Object.freeze([
  { value: '', label: 'Select a role...' },
  { value: 'Project Director', label: 'Project Director' },
  { value: 'Commercial Manager', label: 'Commercial Manager' },
  { value: 'Finance Lead', label: 'Finance Lead' },
  { value: 'Business Development Manager', label: 'Business Development Manager' },
  { value: 'Project Manager', label: 'Project Manager' },
  { value: 'Engineer', label: 'Engineer' },
  { value: 'Analyst', label: 'Analyst' },
]);

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
 * Validates password strength.
 *
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
 * FormField sub-component.
 * Renders a labeled form field with optional error display.
 *
 * @param {Object} props
 * @param {string} props.id - Field ID
 * @param {string} props.label - Field label
 * @param {string} props.type - Input type
 * @param {string} props.value - Current value
 * @param {function} props.onChange - Change handler
 * @param {string} [props.placeholder=''] - Placeholder text
 * @param {string|null} [props.error=null] - Error message
 * @param {boolean} [props.disabled=false] - Whether the field is disabled
 * @param {boolean} [props.required=false] - Whether the field is required
 * @param {number} [props.maxLength] - Maximum input length
 * @param {string} [props.autoComplete=''] - Autocomplete attribute
 * @returns {React.ReactElement} The form field element
 */
function FormField({ id, label, type, value, onChange, placeholder, error, disabled, required, maxLength, autoComplete }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium text-primary-100"
      >
        {label}
        {required ? (
          <span className="text-red-400 ml-0.5" aria-hidden="true">*</span>
        ) : null}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder || ''}
        disabled={disabled}
        required={required}
        maxLength={maxLength || MAX_FIELD_LENGTH}
        autoComplete={autoComplete || ''}
        className={[
          'w-full px-4 py-2.5 rounded-glass-sm',
          'bg-glass-light border transition-all duration-300 ease-in-out',
          'text-primary-50 text-sm placeholder-primary-300',
          'outline-none',
          'focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
          error
            ? 'border-red-400 border-opacity-60'
            : 'border-glass-border hover:border-primary-300',
          disabled ? 'opacity-60 cursor-not-allowed' : '',
        ]
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      <AnimatedTransition
        show={Boolean(error)}
        type="slide-up"
        duration="fast"
        unmountOnExit
      >
        <p
          id={`${id}-error`}
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
          <span>{error}</span>
        </p>
      </AnimatedTransition>
    </div>
  );
}

/**
 * SelectField sub-component.
 * Renders a labeled select field with optional error display.
 *
 * @param {Object} props
 * @param {string} props.id - Field ID
 * @param {string} props.label - Field label
 * @param {string} props.value - Current value
 * @param {function} props.onChange - Change handler
 * @param {Array<{ value: string, label: string }>} props.options - Select options
 * @param {string|null} [props.error=null] - Error message
 * @param {boolean} [props.disabled=false] - Whether the field is disabled
 * @param {boolean} [props.required=false] - Whether the field is required
 * @returns {React.ReactElement} The select field element
 */
function SelectField({ id, label, value, onChange, options, error, disabled, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium text-primary-100"
      >
        {label}
        {required ? (
          <span className="text-red-400 ml-0.5" aria-hidden="true">*</span>
        ) : null}
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={[
          'w-full px-4 py-2.5 rounded-glass-sm',
          'bg-glass-light border transition-all duration-300 ease-in-out',
          'text-primary-50 text-sm',
          'outline-none appearance-none',
          'focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
          error
            ? 'border-red-400 border-opacity-60'
            : 'border-glass-border hover:border-primary-300',
          disabled ? 'opacity-60 cursor-not-allowed' : '',
          value === '' ? 'text-primary-300' : '',
        ]
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        {Array.isArray(options) ? options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.value === ''}
            className="bg-primary-800 text-primary-50"
          >
            {option.label}
          </option>
        )) : null}
      </select>
      <AnimatedTransition
        show={Boolean(error)}
        type="slide-up"
        duration="fast"
        unmountOnExit
      >
        <p
          id={`${id}-error`}
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
          <span>{error}</span>
        </p>
      </AnimatedTransition>
    </div>
  );
}

/**
 * SignupPage component.
 * Renders the user registration form with Full Name, Email, Password,
 * Confirm Password, and Role Selection fields. Validates all inputs,
 * displays field-level and form-level errors, and redirects to the
 * dashboard on successful registration.
 *
 * @returns {React.ReactElement} The signup page component
 */
function SignupPage() {
  const { signup, isAuthenticated, loading, error: authError, clearError } = useAuth();
  const navigate = useNavigate();
  const fullNameRef = useRef(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({
    fullName: null,
    email: null,
    password: null,
    confirmPassword: null,
    role: null,
  });

  const [formError, setFormError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  /**
   * Auto-focus the full name field on mount
   */
  useEffect(() => {
    if (fullNameRef.current) {
      fullNameRef.current.focus();
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
   * Handles full name input change
   * @param {React.ChangeEvent<HTMLInputElement>} event - The change event
   */
  const handleFullNameChange = useCallback((event) => {
    const value = event.target.value;
    if (value.length > MAX_FIELD_LENGTH) {
      return;
    }
    setFullName(value);
    clearFieldError('fullName');
    if (formError) {
      setFormError(null);
    }
    if (authError) {
      clearError();
    }
  }, [formError, authError, clearError, clearFieldError]);

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
    if (confirmPassword.length > 0 && value !== confirmPassword) {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match.' }));
    } else {
      clearFieldError('confirmPassword');
    }
    if (formError) {
      setFormError(null);
    }
    if (authError) {
      clearError();
    }
  }, [confirmPassword, formError, authError, clearError, clearFieldError]);

  /**
   * Handles confirm password input change
   * @param {React.ChangeEvent<HTMLInputElement>} event - The change event
   */
  const handleConfirmPasswordChange = useCallback((event) => {
    const value = event.target.value;
    if (value.length > MAX_FIELD_LENGTH) {
      return;
    }
    setConfirmPassword(value);
    clearFieldError('confirmPassword');
    if (formError) {
      setFormError(null);
    }
    if (authError) {
      clearError();
    }
  }, [formError, authError, clearError, clearFieldError]);

  /**
   * Handles role selection change
   * @param {React.ChangeEvent<HTMLSelectElement>} event - The change event
   */
  const handleRoleChange = useCallback((event) => {
    const value = event.target.value;
    setRole(value);
    clearFieldError('role');
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
   * Toggles confirm password visibility
   */
  const toggleShowConfirmPassword = useCallback(() => {
    setShowConfirmPassword((prev) => !prev);
  }, []);

  /**
   * Validates all form fields
   * @returns {boolean} True if all fields are valid
   */
  const validateForm = useCallback(() => {
    const errors = {
      fullName: null,
      email: null,
      password: null,
      confirmPassword: null,
      role: null,
    };

    let isValid = true;

    // Validate full name
    if (fullName.trim().length === 0) {
      errors.fullName = 'Full name is required.';
      isValid = false;
    } else if (fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters.';
      isValid = false;
    }

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
    } else {
      const passwordCheck = validatePasswordStrength(password);
      if (!passwordCheck.valid) {
        errors.password = passwordCheck.message;
        isValid = false;
      }
    }

    // Validate confirm password
    if (confirmPassword.length === 0) {
      errors.confirmPassword = 'Please confirm your password.';
      isValid = false;
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
      isValid = false;
    }

    // Validate role
    if (role.trim().length === 0) {
      errors.role = 'Please select a role.';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  }, [fullName, email, password, confirmPassword, role]);

  /**
   * Handles form submission
   * @param {React.FormEvent} event - The form event
   */
  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setFormError(null);
    setSubmitted(true);

    if (!validateForm()) {
      return;
    }

    try {
      const response = await signup(
        fullName.trim(),
        email.trim(),
        password,
        role.trim()
      );

      if (response && response.status === 'success') {
        const dashboardPath = getScreenPath(SCREEN_IDS.DASHBOARD);
        navigate(dashboardPath, { replace: true });
      } else if (response && response.message) {
        setFormError(response.message);
      }
    } catch {
      setFormError('An unexpected error occurred. Please try again.');
    }
  }, [loading, validateForm, signup, fullName, email, password, role, navigate]);

  const splashPath = getScreenPath(SCREEN_IDS.SPLASH);

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
            Create Your Account
          </h1>
          <p className="text-sm text-primary-200 mt-1">
            Join Ask Dreeso Memory to get started
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

        {/* Signup Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-4">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="signup-fullname"
                className="text-sm font-medium text-primary-100"
              >
                Full Name
                <span className="text-red-400 ml-0.5" aria-hidden="true">*</span>
              </label>
              <input
                ref={fullNameRef}
                id="signup-fullname"
                type="text"
                value={fullName}
                onChange={handleFullNameChange}
                placeholder="Enter your full name"
                disabled={loading}
                required
                maxLength={MAX_FIELD_LENGTH}
                autoComplete="name"
                className={[
                  'w-full px-4 py-2.5 rounded-glass-sm',
                  'bg-glass-light border transition-all duration-300 ease-in-out',
                  'text-primary-50 text-sm placeholder-primary-300',
                  'outline-none',
                  'focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
                  fieldErrors.fullName
                    ? 'border-red-400 border-opacity-60'
                    : 'border-glass-border hover:border-primary-300',
                  loading ? 'opacity-60 cursor-not-allowed' : '',
                ]
                  .filter(Boolean)
                  .join(' ')
                  .replace(/\s+/g, ' ')
                  .trim()}
                aria-invalid={fieldErrors.fullName ? 'true' : 'false'}
                aria-describedby={fieldErrors.fullName ? 'signup-fullname-error' : undefined}
              />
              <AnimatedTransition
                show={Boolean(fieldErrors.fullName)}
                type="slide-up"
                duration="fast"
                unmountOnExit
              >
                <p
                  id="signup-fullname-error"
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
                  <span>{fieldErrors.fullName}</span>
                </p>
              </AnimatedTransition>
            </div>

            {/* Email */}
            <FormField
              id="signup-email"
              label="Email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="Enter your email address"
              error={fieldErrors.email}
              disabled={loading}
              required
              autoComplete="email"
            />

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="signup-password"
                className="text-sm font-medium text-primary-100"
              >
                Password
                <span className="text-red-400 ml-0.5" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Create a password"
                  disabled={loading}
                  required
                  maxLength={MAX_FIELD_LENGTH}
                  autoComplete="new-password"
                  className={[
                    'w-full px-4 py-2.5 pr-10 rounded-glass-sm',
                    'bg-glass-light border transition-all duration-300 ease-in-out',
                    'text-primary-50 text-sm placeholder-primary-300',
                    'outline-none',
                    'focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
                    fieldErrors.password
                      ? 'border-red-400 border-opacity-60'
                      : 'border-glass-border hover:border-primary-300',
                    loading ? 'opacity-60 cursor-not-allowed' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')
                    .replace(/\s+/g, ' ')
                    .trim()}
                  aria-invalid={fieldErrors.password ? 'true' : 'false'}
                  aria-describedby={fieldErrors.password ? 'signup-password-error' : 'signup-password-hint'}
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
                  id="signup-password-error"
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
              {!fieldErrors.password ? (
                <p id="signup-password-hint" className="text-xs text-primary-300">
                  Min 8 chars, 1 uppercase, 1 number, 1 special character
                </p>
              ) : null}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="signup-confirm-password"
                className="text-sm font-medium text-primary-100"
              >
                Confirm Password
                <span className="text-red-400 ml-0.5" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  placeholder="Confirm your password"
                  disabled={loading}
                  required
                  maxLength={MAX_FIELD_LENGTH}
                  autoComplete="new-password"
                  className={[
                    'w-full px-4 py-2.5 pr-10 rounded-glass-sm',
                    'bg-glass-light border transition-all duration-300 ease-in-out',
                    'text-primary-50 text-sm placeholder-primary-300',
                    'outline-none',
                    'focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
                    fieldErrors.confirmPassword
                      ? 'border-red-400 border-opacity-60'
                      : 'border-glass-border hover:border-primary-300',
                    loading ? 'opacity-60 cursor-not-allowed' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')
                    .replace(/\s+/g, ' ')
                    .trim()}
                  aria-invalid={fieldErrors.confirmPassword ? 'true' : 'false'}
                  aria-describedby={fieldErrors.confirmPassword ? 'signup-confirm-password-error' : undefined}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-300 hover:text-primary-100 transition-colors duration-200 focus:outline-none"
                  onClick={toggleShowConfirmPassword}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
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
                show={Boolean(fieldErrors.confirmPassword)}
                type="slide-up"
                duration="fast"
                unmountOnExit
              >
                <p
                  id="signup-confirm-password-error"
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
                  <span>{fieldErrors.confirmPassword}</span>
                </p>
              </AnimatedTransition>
            </div>

            {/* Role Selection */}
            <SelectField
              id="signup-role"
              label="Role"
              value={role}
              onChange={handleRoleChange}
              options={ROLE_OPTIONS}
              error={fieldErrors.role}
              disabled={loading}
              required
            />
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
                loading
                  ? 'bg-accent-blue bg-opacity-50 cursor-not-allowed'
                  : 'bg-accent-blue hover:bg-opacity-90 active:bg-opacity-80 shadow-accent-glow',
              ]
                .filter(Boolean)
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim()}
              disabled={loading}
              aria-label={loading ? 'Creating account...' : 'Create account'}
            >
              {loading ? (
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
                  <span>Creating Account...</span>
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
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                  <span>Create Account</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer Links */}
        <div className="mt-6 pt-4 border-t border-glass-border">
          <p className="text-sm text-primary-200 text-center">
            Already have an account?{' '}
            <Link
              to={splashPath}
              className="text-accent-blue font-medium hover:text-opacity-80 transition-colors duration-200 focus:outline-none focus:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </GlassCard>
    </AnimatedTransition>
  );
}

export default SignupPage;