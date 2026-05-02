/**
 * Natural language query input component for Ask Dreeso Memory.
 * Provides a text field, submit button, validation, error feedback,
 * placeholder suggestions, and auto-focus. Triggers query execution
 * via useQuery context.
 *
 * @module QueryInput
 * @see SCRUM-7892
 * @see SCRUM-7893
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '../../context/QueryContext';
import { useAuth } from '../../context/AuthContext';
import GlassCard from '../ui/GlassCard';
import AnimatedTransition from '../ui/AnimatedTransition';
import { getQuerySuggestions } from '../../data/mockData';

/**
 * Maximum query length in characters
 * @type {number}
 */
const MAX_QUERY_LENGTH = 512;

/**
 * Minimum query length in characters
 * @type {number}
 */
const MIN_QUERY_LENGTH = 3;

/**
 * Number of suggestions to display
 * @type {number}
 */
const MAX_SUGGESTIONS = 4;

/**
 * QueryInput component.
 * Renders a natural language query input form with a text field, submit button,
 * validation feedback, error display, and contextual placeholder suggestions.
 * Auto-focuses the input on mount. Triggers query execution via the useQuery context.
 *
 * @param {Object} props
 * @param {string} [props.className=''] - Additional CSS classes to apply to the wrapper
 * @param {string} [props.placeholder='Ask Dreeso anything...'] - Placeholder text for the input
 * @param {boolean} [props.autoFocus=true] - Whether to auto-focus the input on mount
 * @param {function} [props.onQuerySubmit] - Optional callback fired after a query is submitted
 * @returns {React.ReactElement} The query input component
 */
function QueryInput({ className, placeholder, autoFocus, onQuerySubmit }) {
  const { executeQuery, isLoading, error, clearError, validateQuery } = useQuery();
  const { persona } = useAuth();

  const [inputValue, setInputValue] = useState('');
  const [validationError, setValidationError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const inputRef = useRef(null);

  /**
   * Auto-focus the input on mount if autoFocus is true
   */
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  /**
   * Resolves query suggestions based on the current persona
   */
  const suggestions = useMemo(() => {
    if (!persona) {
      return [];
    }
    const allSuggestions = getQuerySuggestions(persona);
    if (!Array.isArray(allSuggestions) || allSuggestions.length === 0) {
      return [];
    }
    return allSuggestions.slice(0, MAX_SUGGESTIONS);
  }, [persona]);

  /**
   * Handles input value changes with validation
   * @param {React.ChangeEvent<HTMLTextAreaElement>} event - The change event
   */
  const handleInputChange = useCallback((event) => {
    const value = event.target.value;

    // Enforce max length
    if (value.length > MAX_QUERY_LENGTH) {
      return;
    }

    setInputValue(value);

    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null);
    }

    // Clear context error when user modifies input
    if (error) {
      clearError();
    }

    // Hide suggestions once user starts typing
    if (value.trim().length > 0) {
      setShowSuggestions(false);
    } else {
      setShowSuggestions(true);
    }
  }, [validationError, error, clearError]);

  /**
   * Validates the current input value
   * @returns {boolean} True if the input is valid
   */
  const validateInput = useCallback(() => {
    const trimmed = inputValue.trim();

    if (trimmed.length === 0) {
      setValidationError('Please enter a query.');
      return false;
    }

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setValidationError(`Query must be at least ${MIN_QUERY_LENGTH} characters long.`);
      return false;
    }

    if (trimmed.length > MAX_QUERY_LENGTH) {
      setValidationError(`Query must not exceed ${MAX_QUERY_LENGTH} characters.`);
      return false;
    }

    const validation = validateQuery(trimmed);
    if (!validation.valid) {
      setValidationError(validation.message);
      return false;
    }

    setValidationError(null);
    return true;
  }, [inputValue, validateQuery]);

  /**
   * Handles form submission
   * @param {React.FormEvent} event - The form event
   */
  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    if (!validateInput()) {
      return;
    }

    const trimmedQuery = inputValue.trim();

    try {
      await executeQuery(trimmedQuery);

      if (typeof onQuerySubmit === 'function') {
        onQuerySubmit(trimmedQuery);
      }
    } catch {
      // Error is handled by QueryContext
    }
  }, [inputValue, isLoading, validateInput, executeQuery, onQuerySubmit]);

  /**
   * Handles suggestion click
   * @param {string} suggestion - The suggestion text to use
   */
  const handleSuggestionClick = useCallback(async (suggestion) => {
    if (isLoading) {
      return;
    }

    setInputValue(suggestion);
    setShowSuggestions(false);
    setValidationError(null);

    if (error) {
      clearError();
    }

    try {
      await executeQuery(suggestion);

      if (typeof onQuerySubmit === 'function') {
        onQuerySubmit(suggestion);
      }
    } catch {
      // Error is handled by QueryContext
    }
  }, [isLoading, error, clearError, executeQuery, onQuerySubmit]);

  /**
   * Handles keyboard events on the textarea
   * @param {React.KeyboardEvent<HTMLTextAreaElement>} event - The keyboard event
   */
  const handleKeyDown = useCallback((event) => {
    // Submit on Enter (without Shift)
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  }, [handleSubmit]);

  /**
   * Computes the character count display
   */
  const charCount = inputValue.length;
  const charCountDisplay = charCount > 0 ? `${charCount}/${MAX_QUERY_LENGTH}` : '';
  const isNearLimit = charCount > MAX_QUERY_LENGTH * 0.9;

  /**
   * Determines the current error message to display
   */
  const displayError = validationError || (error ? error.message : null);

  const wrapperClassName = [
    'w-full',
    className || '',
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <div className={wrapperClassName}>
      <GlassCard variant="default" padding="lg" animated>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <span
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 bg-accent-blue bg-opacity-20"
            aria-hidden="true"
          >
            🔍
          </span>
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-primary-50 leading-tight">
              Ask Dreeso
            </h2>
            <p className="text-sm text-primary-200 leading-tight">
              Ask a question in natural language
            </p>
          </div>
        </div>

        {/* Query Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Input Area */}
          <div className="relative">
            <textarea
              ref={inputRef}
              className={[
                'w-full min-h-[100px] max-h-[200px] px-4 py-3 rounded-glass-sm',
                'bg-glass-light border transition-all duration-300 ease-in-out',
                'text-primary-50 text-sm placeholder-primary-300',
                'resize-none outline-none',
                'focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
                displayError
                  ? 'border-red-400 border-opacity-60'
                  : 'border-glass-border hover:border-primary-300',
              ]
                .filter(Boolean)
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim()}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              aria-label="Query input"
              aria-invalid={displayError ? 'true' : 'false'}
              aria-describedby={displayError ? 'query-error' : undefined}
              rows={3}
              maxLength={MAX_QUERY_LENGTH}
            />

            {/* Character Count */}
            {charCount > 0 ? (
              <span
                className={[
                  'absolute bottom-2 right-3 text-xs',
                  isNearLimit ? 'text-amber-400' : 'text-primary-300',
                ].join(' ')}
                aria-hidden="true"
              >
                {charCountDisplay}
              </span>
            ) : null}
          </div>

          {/* Error Display */}
          <AnimatedTransition
            show={Boolean(displayError)}
            type="slide-up"
            duration="fast"
            unmountOnExit
          >
            <div
              id="query-error"
              className="flex items-center gap-2 mt-2 px-1"
              role="alert"
            >
              <svg
                className="w-4 h-4 text-red-400 flex-shrink-0"
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
              <p className="text-sm text-red-400">
                {displayError}
              </p>
            </div>
          </AnimatedTransition>

          {/* Submit Button */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-primary-300 hidden sm:block">
              Press Enter to submit, Shift+Enter for new line
            </p>
            <button
              type="submit"
              className={[
                'flex items-center gap-2 px-6 py-2.5 rounded-glass-sm',
                'text-sm font-semibold text-white',
                'transition-all duration-300 ease-in-out',
                'focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
                isLoading
                  ? 'bg-accent-blue bg-opacity-50 cursor-not-allowed'
                  : 'bg-accent-blue hover:bg-opacity-90 active:bg-opacity-80 shadow-accent-glow',
              ]
                .filter(Boolean)
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim()}
              disabled={isLoading}
              aria-label={isLoading ? 'Submitting query...' : 'Submit query'}
            >
              {isLoading ? (
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
                  <span>Processing...</span>
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <span>Ask Dreeso</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Suggestions */}
        <AnimatedTransition
          show={showSuggestions && suggestions.length > 0 && !isLoading}
          type="fade"
          duration="normal"
          unmountOnExit
        >
          <div className="mt-6 pt-4 border-t border-glass-border">
            <p className="text-xs text-primary-300 font-medium uppercase tracking-wider mb-3">
              Suggested Queries
            </p>
            <div className="flex flex-col gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`suggestion-${index}`}
                  type="button"
                  className={[
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-glass-sm',
                    'text-left text-sm text-primary-200',
                    'transition-all duration-200',
                    'hover:bg-glass-light hover:text-primary-50',
                    'focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
                    'border border-transparent hover:border-glass-border',
                  ]
                    .filter(Boolean)
                    .join(' ')
                    .replace(/\s+/g, ' ')
                    .trim()}
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={isLoading}
                >
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
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <span className="truncate">{suggestion}</span>
                </button>
              ))}
            </div>
          </div>
        </AnimatedTransition>
      </GlassCard>
    </div>
  );
}

QueryInput.propTypes = {
  className: PropTypes.string,
  placeholder: PropTypes.string,
  autoFocus: PropTypes.bool,
  onQuerySubmit: PropTypes.func,
};

QueryInput.defaultProps = {
  className: '',
  placeholder: 'Ask Dreeso anything...',
  autoFocus: true,
  onQuerySubmit: undefined,
};

export default QueryInput;