/**
 * Persona indicator and switcher component for Ask Dreeso Memory.
 * Displays the current persona name, role, and avatar in the top-right area.
 * Provides a dropdown for persona switching or logout.
 * Uses useAuth context for authentication state and actions.
 *
 * @module PersonaBar
 * @see SCRUM-7900
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * Resolves the accent color for a persona based on their name or role.
 * Falls back to the default accent blue if no match is found.
 *
 * @param {string|null} persona - The persona ID
 * @param {Object|null} user - The current user object
 * @returns {string} The accent color hex string
 */
function resolvePersonaColor(persona, user) {
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
 * PersonaBar component.
 * Renders a top-right persona indicator bar showing the current persona's
 * name, role, and avatar. Includes a dropdown menu for switching personas
 * or logging out. Uses the useAuth context for authentication state.
 *
 * @returns {React.ReactElement|null} The persona bar component, or null if not authenticated
 */
function PersonaBar() {
  const { user, isAuthenticated, persona, role, logout, personaLogin, getPersonas, loading } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [switchingPersona, setSwitchingPersona] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  /**
   * Closes the dropdown when clicking outside
   */
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  /**
   * Closes the dropdown on Escape key press
   */
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && dropdownOpen) {
        setDropdownOpen(false);
        if (buttonRef.current) {
          buttonRef.current.focus();
        }
      }
    }

    if (dropdownOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  /**
   * Toggles the dropdown menu visibility
   */
  const toggleDropdown = useCallback(() => {
    setDropdownOpen((prev) => !prev);
  }, []);

  /**
   * Handles persona switch action
   * @param {string} personaId - The persona ID to switch to
   */
  const handlePersonaSwitch = useCallback(async (personaId) => {
    if (switchingPersona || loading) {
      return;
    }

    if (personaId === persona) {
      setDropdownOpen(false);
      return;
    }

    setSwitchingPersona(true);

    try {
      await personaLogin(personaId);
    } catch {
      // Error is handled by AuthContext
    } finally {
      setSwitchingPersona(false);
      setDropdownOpen(false);
    }
  }, [switchingPersona, loading, persona, personaLogin]);

  /**
   * Handles logout action
   */
  const handleLogout = useCallback(async () => {
    if (loading) {
      return;
    }

    setDropdownOpen(false);

    try {
      await logout();
    } catch {
      // Error is handled by AuthContext
    }
  }, [loading, logout]);

  // Do not render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const accentColor = resolvePersonaColor(persona, user);
  const avatarInitial = resolveAvatarInitial(user, persona);
  const displayName = resolveDisplayName(user, persona);
  const displayRole = resolveDisplayRole(user, role);
  const availablePersonas = getPersonas();

  return (
    <div className="relative flex items-center">
      <button
        ref={buttonRef}
        type="button"
        className="flex items-center gap-3 px-3 py-2 rounded-glass-sm transition-all duration-300 ease-in-out hover:bg-glass-light focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-opacity-50"
        onClick={toggleDropdown}
        aria-expanded={dropdownOpen}
        aria-haspopup="true"
        aria-label={`Persona menu for ${displayName}`}
      >
        {/* Avatar */}
        <div
          className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold text-white flex-shrink-0"
          style={{ backgroundColor: accentColor }}
          aria-hidden="true"
        >
          {avatarInitial}
        </div>

        {/* Name and Role */}
        <div className="hidden sm:flex flex-col items-start">
          <span className="text-sm font-semibold text-primary-50 leading-tight">
            {displayName}
          </span>
          <span className="text-xs text-primary-200 leading-tight">
            {displayRole}
          </span>
        </div>

        {/* Chevron */}
        <svg
          className={[
            'w-4 h-4 text-primary-200 transition-transform duration-200',
            dropdownOpen ? 'rotate-180' : 'rotate-0',
          ].join(' ')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen ? (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-64 glass-sm py-2 z-50 animate-fade-in"
          role="menu"
          aria-orientation="vertical"
          aria-label="Persona options"
        >
          {/* Current Persona Header */}
          <div className="px-4 py-2 border-b border-glass-border">
            <p className="text-xs text-primary-300 font-medium uppercase tracking-wider">
              Current Persona
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div
                className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold text-white flex-shrink-0"
                style={{ backgroundColor: accentColor }}
                aria-hidden="true"
              >
                {avatarInitial}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-primary-50 leading-tight">
                  {displayName}
                </span>
                <span className="text-xs text-primary-200 leading-tight">
                  {displayRole}
                </span>
              </div>
            </div>
          </div>

          {/* Persona Switch Options */}
          {Array.isArray(availablePersonas) && availablePersonas.length > 0 ? (
            <div className="py-1 border-b border-glass-border">
              <p className="px-4 py-1 text-xs text-primary-300 font-medium uppercase tracking-wider">
                Switch Persona
              </p>
              {availablePersonas.map((p) => {
                const isCurrentPersona = p.id === persona;
                const personaColor = resolvePersonaColor(p.id, null);

                return (
                  <button
                    key={p.id}
                    type="button"
                    className={[
                      'w-full flex items-center gap-3 px-4 py-2 text-left transition-all duration-200',
                      isCurrentPersona
                        ? 'bg-glass-light cursor-default'
                        : 'hover:bg-glass-light cursor-pointer',
                      switchingPersona ? 'opacity-50 cursor-not-allowed' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')
                      .replace(/\s+/g, ' ')
                      .trim()}
                    role="menuitem"
                    onClick={() => handlePersonaSwitch(p.id)}
                    disabled={switchingPersona || isCurrentPersona}
                    aria-current={isCurrentPersona ? 'true' : undefined}
                  >
                    <div
                      className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold text-white flex-shrink-0"
                      style={{ backgroundColor: personaColor }}
                      aria-hidden="true"
                    >
                      {p.avatar || (p.name ? p.name.charAt(0).toUpperCase() : '?')}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-medium text-primary-50 leading-tight truncate">
                        {p.name}
                      </span>
                      <span className="text-xs text-primary-200 leading-tight truncate">
                        {p.role}
                      </span>
                    </div>
                    {isCurrentPersona ? (
                      <svg
                        className="w-4 h-4 text-accent-blue flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}

          {/* Logout */}
          <div className="py-1">
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2 text-left transition-all duration-200 hover:bg-glass-light cursor-pointer"
              role="menuitem"
              onClick={handleLogout}
              disabled={loading}
            >
              <svg
                className="w-5 h-5 text-primary-300 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="text-sm font-medium text-primary-100">
                Logout
              </span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default PersonaBar;