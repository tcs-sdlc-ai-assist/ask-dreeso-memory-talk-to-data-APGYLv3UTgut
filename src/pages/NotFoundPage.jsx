/**
 * 404 Not Found page for Ask Dreeso Memory.
 * Handles invalid routes gracefully with gradient background,
 * error message, and navigation back to home/dashboard.
 *
 * @module NotFoundPage
 */

import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/ui/GlassCard';
import GradientBackground from '../components/ui/GradientBackground';
import AnimatedTransition from '../components/ui/AnimatedTransition';
import { SCREEN_IDS } from '../constants';
import { getScreenPath } from '../config/screenConfig';
import { logEvent, AUDIT_EVENT_TYPES } from '../services/AuditLogger';

/**
 * NotFoundPage component.
 * Renders a 404 error page with gradient background, error message,
 * and navigation options to return to the dashboard or login screen.
 *
 * @returns {React.ReactElement} The 404 not found page component
 */
function NotFoundPage() {
  const { isAuthenticated, persona } = useAuth();
  const navigate = useNavigate();

  /**
   * Log screen view on mount
   */
  useEffect(() => {
    logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {
      action: 'NOT_FOUND_PAGE_VIEW',
      path: typeof window !== 'undefined' ? window.location.pathname : '',
      persona,
    });
  }, [persona]);

  /**
   * Handles navigation back to the appropriate home screen.
   * If authenticated, navigates to the dashboard.
   * If not authenticated, navigates to the splash/login screen.
   */
  const handleGoHome = useCallback(() => {
    logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {
      action: 'NOT_FOUND_GO_HOME',
      persona,
    });

    if (isAuthenticated) {
      const dashboardPath = getScreenPath(SCREEN_IDS.DASHBOARD);
      navigate(dashboardPath, { replace: true });
    } else {
      const splashPath = getScreenPath(SCREEN_IDS.SPLASH);
      navigate(splashPath, { replace: true });
    }
  }, [isAuthenticated, persona, navigate]);

  /**
   * Handles navigation back in browser history
   */
  const handleGoBack = useCallback(() => {
    logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {
      action: 'NOT_FOUND_GO_BACK',
      persona,
    });

    navigate(-1);
  }, [persona, navigate]);

  /**
   * Handles keyboard events on the Go Home button
   * @param {React.KeyboardEvent} event - The keyboard event
   */
  const handleGoHomeKeyDown = useCallback((event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleGoHome();
    }
  }, [handleGoHome]);

  /**
   * Handles keyboard events on the Go Back button
   * @param {React.KeyboardEvent} event - The keyboard event
   */
  const handleGoBackKeyDown = useCallback((event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleGoBack();
    }
  }, [handleGoBack]);

  return (
    <GradientBackground
      variant="primary"
      overlay="dots"
      fullScreen
      className="flex flex-col"
    >
      {/* Header Branding */}
      <header className="flex items-center justify-center px-4 py-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white bg-accent-blue flex-shrink-0 shadow-accent-glow"
            aria-hidden="true"
          >
            D
          </span>
          <div className="flex flex-col items-start">
            <span className="text-lg font-semibold text-primary-50 leading-tight">
              {import.meta.env.VITE_APP_TITLE || 'Ask Dreeso Memory'}
            </span>
            <span className="text-xs text-primary-200 leading-tight">
              AI-Powered Intelligence Platform
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        className="flex-1 flex items-center justify-center px-4 py-8 overflow-y-auto"
        role="main"
      >
        <div className="w-full max-w-md animate-fade-in">
          <AnimatedTransition show type="scale" duration="normal">
            <GlassCard variant="default" padding="lg" animated>
              <div className="flex flex-col items-center text-center">
                {/* Error Icon */}
                <span
                  className="w-20 h-20 rounded-full flex items-center justify-center text-4xl flex-shrink-0 bg-accent-blue bg-opacity-10 mb-6"
                  aria-hidden="true"
                >
                  🔍
                </span>

                {/* Error Code */}
                <h1 className="text-5xl font-bold text-primary-50 leading-tight mb-2">
                  404
                </h1>

                {/* Error Title */}
                <h2 className="text-xl font-semibold text-primary-50 leading-tight mb-3">
                  Page Not Found
                </h2>

                {/* Error Description */}
                <p className="text-sm text-primary-200 leading-relaxed max-w-sm mb-8">
                  The page you&apos;re looking for doesn&apos;t exist or has been moved.
                  Please check the URL or navigate back to a known page.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                  {/* Go Back Button */}
                  <button
                    type="button"
                    className={[
                      'flex items-center justify-center gap-2 px-5 py-2.5 rounded-glass-sm',
                      'text-sm font-medium text-primary-200 border border-glass-border',
                      'hover:bg-glass-light hover:text-primary-50 hover:border-primary-300',
                      'transition-all duration-300 ease-in-out',
                      'focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
                      'w-full sm:w-auto',
                    ]
                      .filter(Boolean)
                      .join(' ')
                      .replace(/\s+/g, ' ')
                      .trim()}
                    onClick={handleGoBack}
                    onKeyDown={handleGoBackKeyDown}
                    aria-label="Go back to previous page"
                  >
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
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                      />
                    </svg>
                    <span>Go Back</span>
                  </button>

                  {/* Go Home Button */}
                  <button
                    type="button"
                    className={[
                      'flex items-center justify-center gap-2 px-6 py-2.5 rounded-glass-sm',
                      'text-sm font-semibold text-white',
                      'bg-accent-blue hover:bg-opacity-90 active:bg-opacity-80 shadow-accent-glow',
                      'transition-all duration-300 ease-in-out',
                      'focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
                      'w-full sm:w-auto',
                    ]
                      .filter(Boolean)
                      .join(' ')
                      .replace(/\s+/g, ' ')
                      .trim()}
                    onClick={handleGoHome}
                    onKeyDown={handleGoHomeKeyDown}
                    aria-label={isAuthenticated ? 'Go to dashboard' : 'Go to login'}
                  >
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
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    <span>{isAuthenticated ? 'Go to Dashboard' : 'Go to Login'}</span>
                  </button>
                </div>
              </div>
            </GlassCard>
          </AnimatedTransition>

          {/* Additional Help Text */}
          <AnimatedTransition show type="fade" duration="normal" delay={200}>
            <div className="flex flex-col items-center gap-3 mt-6">
              <p className="text-xs text-primary-300 text-center max-w-sm">
                If you believe this is an error, please contact your administrator
                or try navigating using the sidebar menu.
              </p>
            </div>
          </AnimatedTransition>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-center px-4 py-4 flex-shrink-0">
        <p className="text-xs text-primary-300">
          {import.meta.env.VITE_APP_TITLE || 'Ask Dreeso Memory'}{' '}
          v{import.meta.env.VITE_APP_VERSION || '1.0.0'}
        </p>
      </footer>
    </GradientBackground>
  );
}

export default NotFoundPage;