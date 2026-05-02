/**
 * Onboarding welcome screen for Ask Dreeso Memory.
 * Screen 2: Shown after first login. Introduces the platform, intelligence
 * clusters, and persona capabilities. Includes a 'Get Started' CTA to
 * proceed to the dashboard.
 *
 * @module OnboardingPage
 * @see SCRUM-7894
 */

import React, { useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import GlassCard from '../../components/ui/GlassCard';
import GradientBackground from '../../components/ui/GradientBackground';
import AnimatedTransition from '../../components/ui/AnimatedTransition';
import { SCREEN_IDS, INTELLIGENCE_CLUSTERS, SYSTEMS } from '../../constants';
import { getScreenPath } from '../../config/screenConfig';
import { getAccessibleClusters, getPrimaryClusters, getConnectedSystems } from '../../data/personaData';
import { logEvent, AUDIT_EVENT_TYPES } from '../../services/AuditLogger';

/**
 * Animation stagger delay in milliseconds between each section.
 * @type {number}
 */
const STAGGER_DELAY_MS = 120;

/**
 * Resolves the accent color for a persona.
 *
 * @param {string|null} persona - The persona ID
 * @returns {string} The accent color hex string
 */
function resolvePersonaColor(persona) {
  if (!persona) {
    return '#3B82F6';
  }

  const colorMap = {
    lukas: '#3B82F6',
    elena: '#8B5CF6',
    sophie: '#EC4899',
    james: '#F59E0B',
  };

  const normalized = persona.toLowerCase();
  return colorMap[normalized] || '#3B82F6';
}

/**
 * Resolves the display name for the current user.
 *
 * @param {Object|null} user - The current user object
 * @param {string|null} persona - The persona ID
 * @returns {string} The display name
 */
function resolveDisplayName(user, persona) {
  if (user && typeof user.fullName === 'string' && user.fullName.trim().length > 0) {
    return user.fullName.trim();
  }

  if (typeof persona === 'string' && persona.length > 0) {
    return persona.charAt(0).toUpperCase() + persona.slice(1);
  }

  return 'User';
}

/**
 * Resolves the display role for the current user.
 *
 * @param {Object|null} user - The current user object
 * @param {string|null} role - The role from auth context
 * @returns {string} The display role
 */
function resolveDisplayRole(user, role) {
  if (user && typeof user.role === 'string' && user.role.trim().length > 0) {
    return user.role.trim();
  }

  if (typeof role === 'string' && role.trim().length > 0) {
    return role.trim();
  }

  return 'User';
}

/**
 * Resolves the avatar initial for the current user.
 *
 * @param {Object|null} user - The current user object
 * @param {string|null} persona - The persona ID
 * @returns {string} The avatar initial character
 */
function resolveAvatarInitial(user, persona) {
  if (user && typeof user.fullName === 'string' && user.fullName.trim().length > 0) {
    return user.fullName.trim().charAt(0).toUpperCase();
  }

  if (typeof persona === 'string' && persona.length > 0) {
    return persona.charAt(0).toUpperCase();
  }

  return 'U';
}

/**
 * Resolves the access level badge classes.
 *
 * @param {string} accessLevel - Access level ('full', 'read', 'none')
 * @returns {{ bg: string, text: string }} Tailwind classes for the access badge
 */
function getAccessLevelClasses(accessLevel) {
  switch (accessLevel) {
    case 'full':
      return {
        bg: 'bg-green-400 bg-opacity-15',
        text: 'text-green-400',
      };
    case 'read':
      return {
        bg: 'bg-amber-400 bg-opacity-15',
        text: 'text-amber-400',
      };
    case 'none':
    default:
      return {
        bg: 'bg-primary-300 bg-opacity-15',
        text: 'text-primary-300',
      };
  }
}

/**
 * Resolves the access level display label.
 *
 * @param {string} accessLevel - Access level ('full', 'read', 'none')
 * @returns {string} Human-readable access level label
 */
function getAccessLevelLabel(accessLevel) {
  switch (accessLevel) {
    case 'full':
      return 'Full Access';
    case 'read':
      return 'Read Only';
    case 'none':
      return 'No Access';
    default:
      return 'Unknown';
  }
}

/**
 * FeatureCard sub-component.
 * Renders a single platform feature card.
 *
 * @param {Object} props
 * @param {string} props.icon - Emoji icon
 * @param {string} props.title - Feature title
 * @param {string} props.description - Feature description
 * @param {number} props.index - Index for staggered animation delay
 * @returns {React.ReactElement} The feature card element
 */
function FeatureCard({ icon, title, description, index }) {
  return (
    <AnimatedTransition
      show
      type="slide-up"
      duration="normal"
      delay={index * STAGGER_DELAY_MS}
    >
      <div className="glass-sm p-4 flex items-start gap-3 h-full">
        <span
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 bg-accent-blue bg-opacity-20"
          aria-hidden="true"
        >
          {icon}
        </span>
        <div className="flex flex-col min-w-0">
          <h3 className="text-sm font-semibold text-primary-50 leading-tight">
            {title}
          </h3>
          <p className="text-xs text-primary-200 leading-relaxed mt-1">
            {description}
          </p>
        </div>
      </div>
    </AnimatedTransition>
  );
}

/**
 * ClusterItem sub-component.
 * Renders a single intelligence cluster row.
 *
 * @param {Object} props
 * @param {Object} props.cluster - The cluster definition object
 * @param {string} props.accessLevel - Access level for this cluster
 * @param {boolean} props.isPrimary - Whether this is a primary cluster
 * @param {number} props.index - Index for staggered animation delay
 * @returns {React.ReactElement} The cluster item element
 */
function ClusterItem({ cluster, accessLevel, isPrimary, index }) {
  const accessClasses = getAccessLevelClasses(accessLevel);
  const accessLabel = getAccessLevelLabel(accessLevel);

  return (
    <AnimatedTransition
      show
      type="scale"
      duration="fast"
      delay={index * 80}
    >
      <div
        className={[
          'flex items-center gap-3 px-4 py-3 rounded-glass-sm border transition-all duration-200',
          isPrimary ? 'bg-glass-light border-glass-border' : 'bg-transparent border-transparent',
        ]
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()}
      >
        {/* Cluster Icon */}
        <span
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0"
          style={{
            backgroundColor: cluster.color ? `${cluster.color}20` : 'rgba(59, 130, 246, 0.12)',
          }}
          aria-hidden="true"
        >
          {cluster.icon}
        </span>

        {/* Cluster Info */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-primary-50 truncate">
              {cluster.label}
            </span>
            {isPrimary ? (
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: cluster.color || '#3B82F6' }}
                aria-hidden="true"
              />
            ) : null}
          </div>
          <span className="text-xs text-primary-300 truncate">
            {cluster.description}
          </span>
        </div>

        {/* Access Badge */}
        <span
          className={[
            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0',
            accessClasses.bg,
            accessClasses.text,
          ].join(' ')}
        >
          {accessLabel}
        </span>
      </div>
    </AnimatedTransition>
  );
}

/**
 * SystemBadge sub-component.
 * Renders a connected system badge.
 *
 * @param {Object} props
 * @param {string} props.systemId - The system identifier
 * @param {number} props.index - Index for staggered animation delay
 * @returns {React.ReactElement|null} The system badge element
 */
function SystemBadge({ systemId, index }) {
  const systemValues = Object.values(SYSTEMS);
  const system = systemValues.find((s) => s.id === systemId);

  if (!system) {
    return null;
  }

  return (
    <AnimatedTransition
      show
      type="scale"
      duration="fast"
      delay={index * 60}
    >
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-glass-border"
        style={{
          backgroundColor: system.color ? `${system.color}15` : 'rgba(59, 130, 246, 0.08)',
          color: system.color || '#3B82F6',
        }}
      >
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: system.color || '#3B82F6' }}
          aria-hidden="true"
        />
        {system.label}
      </span>
    </AnimatedTransition>
  );
}

/**
 * OnboardingPage component.
 * Renders the onboarding welcome screen shown after first login.
 * Introduces the platform, intelligence clusters, and persona capabilities.
 * Includes a 'Get Started' CTA to proceed to the dashboard.
 *
 * @returns {React.ReactElement} The onboarding page component
 */
function OnboardingPage() {
  const { user, isAuthenticated, persona, role } = useAuth();
  const { navigateTo } = useNavigation();
  const navigate = useNavigate();

  /**
   * Redirect to splash if not authenticated
   */
  useEffect(() => {
    if (!isAuthenticated) {
      const splashPath = getScreenPath(SCREEN_IDS.SPLASH);
      navigate(splashPath, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  /**
   * Log screen view on mount
   */
  useEffect(() => {
    logEvent(AUDIT_EVENT_TYPES.SCREEN_VIEW, {
      screenId: SCREEN_IDS.PERSONA_SELECT,
      screenName: 'Onboarding',
      persona,
    });
  }, [persona]);

  /**
   * Resolves accessible clusters for the current persona
   */
  const accessibleClusters = useMemo(() => {
    if (!persona) {
      return [];
    }
    return getAccessibleClusters(persona);
  }, [persona]);

  /**
   * Resolves primary cluster IDs for the current persona
   */
  const primaryClusterIds = useMemo(() => {
    if (!persona) {
      return new Set();
    }
    const primaries = getPrimaryClusters(persona);
    return new Set(primaries.map((c) => c.clusterId));
  }, [persona]);

  /**
   * Resolves all cluster definitions with access info for display
   */
  const clusterDisplayList = useMemo(() => {
    const allClusterValues = Object.values(INTELLIGENCE_CLUSTERS);

    if (!persona || accessibleClusters.length === 0) {
      return allClusterValues.map((cluster) => ({
        cluster,
        accessLevel: 'read',
        isPrimary: false,
      }));
    }

    return allClusterValues
      .map((cluster) => {
        const access = accessibleClusters.find((ac) => ac.clusterId === cluster.id);
        return {
          cluster,
          accessLevel: access ? access.accessLevel : 'none',
          isPrimary: primaryClusterIds.has(cluster.id),
        };
      })
      .sort((a, b) => {
        // Primary clusters first
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;

        // Then by access level
        const accessOrder = { full: 0, read: 1, none: 2 };
        const aOrder = accessOrder[a.accessLevel] !== undefined ? accessOrder[a.accessLevel] : 3;
        const bOrder = accessOrder[b.accessLevel] !== undefined ? accessOrder[b.accessLevel] : 3;
        return aOrder - bOrder;
      });
  }, [persona, accessibleClusters, primaryClusterIds]);

  /**
   * Resolves connected systems for the current persona
   */
  const connectedSystems = useMemo(() => {
    if (!persona) {
      return [];
    }
    return getConnectedSystems(persona);
  }, [persona]);

  /**
   * Handles the 'Get Started' CTA click
   */
  const handleGetStarted = useCallback(() => {
    logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {
      action: 'ONBOARDING_GET_STARTED',
      fromScreen: SCREEN_IDS.PERSONA_SELECT,
      toScreen: SCREEN_IDS.DASHBOARD,
      persona,
    });

    navigateTo(SCREEN_IDS.DASHBOARD);
  }, [persona, navigateTo]);

  /**
   * Handles keyboard events on the Get Started button
   * @param {React.KeyboardEvent} event - The keyboard event
   */
  const handleGetStartedKeyDown = useCallback((event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleGetStarted();
    }
  }, [handleGetStarted]);

  const accentColor = resolvePersonaColor(persona);
  const displayName = resolveDisplayName(user, persona);
  const displayRole = resolveDisplayRole(user, role);
  const avatarInitial = resolveAvatarInitial(user, persona);

  /**
   * Platform feature cards data
   */
  const features = useMemo(() => [
    {
      icon: '🧠',
      title: 'AI-Powered Intelligence',
      description: 'Ask questions in natural language and get instant insights from across your enterprise systems.',
    },
    {
      icon: '🔗',
      title: 'Multi-System Integration',
      description: 'Unified data from SAP, Procore, Salesforce, and Primavera — all in one place.',
    },
    {
      icon: '📊',
      title: 'Intelligence Clusters',
      description: 'Six specialized domains covering projects, sales, procurement, finance, workforce, and knowledge.',
    },
    {
      icon: '⚡',
      title: 'Actionable Insights',
      description: 'Get contextual follow-up suggestions and execute actions directly from query results.',
    },
  ], []);

  // Do not render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <GradientBackground
      variant="primary"
      overlay="dots"
      fullScreen
      className="flex flex-col"
    >
      {/* Header */}
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

      {/* Main Content */}
      <main
        className="flex-1 overflow-y-auto px-4 py-6"
        role="main"
      >
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
          {/* Welcome Section */}
          <AnimatedTransition show type="scale" duration="normal">
            <GlassCard variant="default" padding="lg" animated>
              <div className="flex flex-col items-center text-center">
                {/* Persona Avatar */}
                <div
                  className="flex items-center justify-center w-16 h-16 rounded-full text-2xl font-bold text-white flex-shrink-0 mb-4 shadow-accent-glow"
                  style={{ backgroundColor: accentColor }}
                  aria-hidden="true"
                >
                  {avatarInitial}
                </div>

                <h1 className="text-2xl font-semibold text-primary-50 leading-tight">
                  Welcome, {displayName}!
                </h1>
                <p className="text-sm text-primary-200 mt-1">
                  {displayRole}
                </p>
                <p className="text-sm text-primary-200 mt-4 max-w-lg leading-relaxed">
                  Ask Dreeso Memory is your AI-powered intelligence platform. It connects to your enterprise systems and provides instant, contextual insights to help you make better decisions.
                </p>
              </div>
            </GlassCard>
          </AnimatedTransition>

          {/* Platform Features */}
          <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS}>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-blue bg-opacity-20"
                  aria-hidden="true"
                >
                  ✨
                </span>
                <h2 className="text-base font-semibold text-primary-50 leading-tight">
                  What You Can Do
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {features.map((feature, index) => (
                  <FeatureCard
                    key={`feature-${index}`}
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                    index={index}
                  />
                ))}
              </div>
            </div>
          </AnimatedTransition>

          {/* Intelligence Clusters */}
          <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 2}>
            <GlassCard variant="default" padding="md" animated>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-blue bg-opacity-20"
                    aria-hidden="true"
                  >
                    🧠
                  </span>
                  <div className="flex flex-col">
                    <h2 className="text-base font-semibold text-primary-50 leading-tight">
                      Your Intelligence Clusters
                    </h2>
                    <p className="text-xs text-primary-300 leading-tight">
                      Data domains available to your role
                    </p>
                  </div>
                </div>
                <span className="text-xs text-primary-300">
                  {accessibleClusters.length} accessible
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                {clusterDisplayList.map((item, index) => (
                  <ClusterItem
                    key={item.cluster.id}
                    cluster={item.cluster}
                    accessLevel={item.accessLevel}
                    isPrimary={item.isPrimary}
                    index={index}
                  />
                ))}
              </div>
            </GlassCard>
          </AnimatedTransition>

          {/* Connected Systems */}
          {connectedSystems.length > 0 ? (
            <AnimatedTransition show type="fade" duration="normal" delay={STAGGER_DELAY_MS * 3}>
              <GlassCard variant="default" padding="md" animated>
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-accent-teal bg-opacity-20"
                    aria-hidden="true"
                  >
                    🖥️
                  </span>
                  <div className="flex flex-col">
                    <h2 className="text-base font-semibold text-primary-50 leading-tight">
                      Connected Systems
                    </h2>
                    <p className="text-xs text-primary-300 leading-tight">
                      Enterprise systems linked to your profile
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {connectedSystems.map((systemId, index) => (
                    <SystemBadge
                      key={systemId}
                      systemId={systemId}
                      index={index}
                    />
                  ))}
                </div>
              </GlassCard>
            </AnimatedTransition>
          ) : null}

          {/* Get Started CTA */}
          <AnimatedTransition show type="slide-up" duration="normal" delay={STAGGER_DELAY_MS * 4}>
            <div className="flex flex-col items-center gap-4 py-4">
              <button
                type="button"
                className={[
                  'flex items-center gap-3 px-8 py-4 rounded-glass-sm',
                  'text-base font-semibold text-white',
                  'bg-accent-blue hover:bg-opacity-90 active:bg-opacity-80 shadow-accent-glow',
                  'transition-all duration-300 ease-in-out',
                  'focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50',
                  'transform hover:scale-105 active:scale-95',
                ]
                  .filter(Boolean)
                  .join(' ')
                  .replace(/\s+/g, ' ')
                  .trim()}
                onClick={handleGetStarted}
                onKeyDown={handleGetStartedKeyDown}
                aria-label="Get started and proceed to dashboard"
              >
                <span>Get Started</span>
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>
              <p className="text-xs text-primary-300 text-center max-w-sm">
                You can always access these settings and explore clusters from the sidebar navigation.
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

export default OnboardingPage;