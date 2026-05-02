/**
 * Audit trail persistence service for Ask Dreeso Memory.
 * Persists all user actions to localStorage including auth events,
 * navigation, queries, actions, and state transitions with timestamps.
 *
 * @module AuditLogger
 * @see SCRUM-7892
 * @see SCRUM-7893
 * @see SCRUM-7896
 * @see SCRUM-7898
 * @see SCRUM-7899
 * @see SCRUM-7900
 */

import { LOCAL_STORAGE_KEYS } from '../constants';

/**
 * Maximum number of audit log entries to retain per session.
 * Older entries are pruned when this limit is exceeded.
 * @type {number}
 */
const MAX_AUDIT_ENTRIES = 1000;

/**
 * Valid event types for audit logging
 * @type {Object.<string, string>}
 */
export const AUDIT_EVENT_TYPES = Object.freeze({
  AUTH_LOGIN: 'AUTH_LOGIN',
  AUTH_LOGOUT: 'AUTH_LOGOUT',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  NAVIGATION: 'NAVIGATION',
  QUERY_SUBMIT: 'QUERY_SUBMIT',
  QUERY_RESULT: 'QUERY_RESULT',
  QUERY_ERROR: 'QUERY_ERROR',
  ACTION_EXECUTE: 'ACTION_EXECUTE',
  ACTION_SUCCESS: 'ACTION_SUCCESS',
  ACTION_ERROR: 'ACTION_ERROR',
  STATE_TRANSITION: 'STATE_TRANSITION',
  PERSONA_SELECT: 'PERSONA_SELECT',
  CTA_CLICK: 'CTA_CLICK',
  SCREEN_VIEW: 'SCREEN_VIEW',
  ERROR: 'ERROR',
});

/**
 * @typedef {Object} AuditLogEntry
 * @property {string} id - Unique entry identifier
 * @property {number} timestamp - Unix timestamp in milliseconds
 * @property {string} isoTimestamp - ISO 8601 formatted timestamp
 * @property {string} eventType - Type of event (from AUDIT_EVENT_TYPES)
 * @property {Object} details - Event-specific details
 * @property {string|null} persona - Persona ID at time of event, or null
 * @property {number|null} screenId - Screen ID at time of event, or null
 */

/**
 * Generates a unique identifier for an audit log entry
 * @returns {string} A unique identifier string
 */
function generateEntryId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `audit-${timestamp}-${random}`;
}

/**
 * Safely reads and parses the audit log from localStorage
 * @returns {AuditLogEntry[]} The parsed audit log array, or empty array on failure
 */
function readAuditLog() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.AUDIT_LOG);
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
 * Safely writes the audit log array to localStorage
 * @param {AuditLogEntry[]} entries - The audit log entries to persist
 * @returns {boolean} True if write succeeded, false otherwise
 */
function writeAuditLog(entries) {
  try {
    if (!Array.isArray(entries)) {
      return false;
    }
    localStorage.setItem(LOCAL_STORAGE_KEYS.AUDIT_LOG, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

/**
 * Prunes the audit log to stay within the maximum entry limit.
 * Removes the oldest entries first.
 * @param {AuditLogEntry[]} entries - The current audit log entries
 * @returns {AuditLogEntry[]} The pruned audit log entries
 */
function pruneEntries(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }
  if (entries.length <= MAX_AUDIT_ENTRIES) {
    return entries;
  }
  return entries.slice(entries.length - MAX_AUDIT_ENTRIES);
}

/**
 * Retrieves the current persona from the session in localStorage.
 * Reads directly to avoid circular dependency with SessionManager.
 * @returns {string|null} The persona ID, or null if not available
 */
function getCurrentPersonaFromStorage() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.SELECTED_PERSONA);
    if (raw === null || raw === undefined) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return typeof parsed === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Retrieves the current screen ID from localStorage.
 * @returns {number|null} The screen ID, or null if not available
 */
function getCurrentScreenFromStorage() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_SCREEN);
    if (raw === null || raw === undefined) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return typeof parsed === 'number' ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Logs an event to the audit trail and persists it to localStorage.
 * Each event is timestamped and enriched with current persona and screen context.
 *
 * @param {string} eventType - The type of event (use AUDIT_EVENT_TYPES constants)
 * @param {Object} [details={}] - Event-specific details to record
 * @returns {AuditLogEntry|null} The created audit log entry, or null on failure
 */
export function logEvent(eventType, details = {}) {
  if (typeof eventType !== 'string' || eventType.length === 0) {
    return null;
  }

  if (details === null || typeof details !== 'object' || Array.isArray(details)) {
    details = {};
  }

  const isEnabled = import.meta.env.VITE_ENABLE_AUDIT_LOG;
  if (isEnabled === 'false') {
    return null;
  }

  const now = Date.now();

  /** @type {AuditLogEntry} */
  const entry = {
    id: generateEntryId(),
    timestamp: now,
    isoTimestamp: new Date(now).toISOString(),
    eventType,
    details: { ...details },
    persona: getCurrentPersonaFromStorage(),
    screenId: getCurrentScreenFromStorage(),
  };

  try {
    const entries = readAuditLog();
    entries.push(entry);
    const pruned = pruneEntries(entries);
    const written = writeAuditLog(pruned);
    return written ? entry : null;
  } catch {
    return null;
  }
}

/**
 * Retrieves the complete audit trail from localStorage.
 * Returns entries sorted by timestamp in ascending order.
 *
 * @returns {AuditLogEntry[]} Array of all audit log entries
 */
export function getAuditTrail() {
  const entries = readAuditLog();
  return entries.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Clears the entire audit trail from localStorage.
 *
 * @returns {boolean} True if the audit trail was cleared successfully
 */
export function clearAuditTrail() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.AUDIT_LOG);
    return true;
  } catch {
    return false;
  }
}

/**
 * Retrieves audit trail entries filtered by event type.
 * Returns entries sorted by timestamp in ascending order.
 *
 * @param {string} type - The event type to filter by (from AUDIT_EVENT_TYPES)
 * @returns {AuditLogEntry[]} Array of matching audit log entries
 */
export function getAuditTrailByType(type) {
  if (typeof type !== 'string' || type.length === 0) {
    return [];
  }

  const entries = readAuditLog();
  return entries
    .filter((entry) => entry.eventType === type)
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Returns the total number of audit log entries currently stored.
 *
 * @returns {number} The count of audit log entries
 */
export function getAuditTrailCount() {
  const entries = readAuditLog();
  return entries.length;
}

/**
 * Retrieves audit trail entries filtered by persona ID.
 * Returns entries sorted by timestamp in ascending order.
 *
 * @param {string} personaId - The persona identifier to filter by
 * @returns {AuditLogEntry[]} Array of matching audit log entries
 */
export function getAuditTrailByPersona(personaId) {
  if (typeof personaId !== 'string' || personaId.length === 0) {
    return [];
  }

  const entries = readAuditLog();
  return entries
    .filter((entry) => entry.persona === personaId)
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Retrieves audit trail entries within a given time range.
 * Returns entries sorted by timestamp in ascending order.
 *
 * @param {number} startTimestamp - Start of range (Unix ms, inclusive)
 * @param {number} endTimestamp - End of range (Unix ms, inclusive)
 * @returns {AuditLogEntry[]} Array of matching audit log entries
 */
export function getAuditTrailByTimeRange(startTimestamp, endTimestamp) {
  if (typeof startTimestamp !== 'number' || typeof endTimestamp !== 'number') {
    return [];
  }

  if (isNaN(startTimestamp) || isNaN(endTimestamp)) {
    return [];
  }

  if (startTimestamp > endTimestamp) {
    return [];
  }

  const entries = readAuditLog();
  return entries
    .filter((entry) => entry.timestamp >= startTimestamp && entry.timestamp <= endTimestamp)
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Exports the audit trail as a JSON string for download or sharing.
 *
 * @returns {string} JSON string representation of the audit trail
 */
export function exportAuditTrail() {
  const entries = getAuditTrail();
  try {
    return JSON.stringify(entries, null, 2);
  } catch {
    return '[]';
  }
}