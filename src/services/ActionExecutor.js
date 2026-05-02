/**
 * Simulated action execution service for Ask Dreeso Memory.
 * Simulates executing actions in enterprise systems (SAP, Procore, Salesforce, Primavera)
 * and persists an action log in localStorage.
 *
 * @module ActionExecutor
 * @see SCRUM-7891
 */

import { SYSTEMS } from '../constants';
import { getActionResult, ACTION_RESULTS } from '../data/mockData';
import { logEvent, AUDIT_EVENT_TYPES } from './AuditLogger';
import { getSession } from './SessionManager';

/**
 * localStorage key used for action log storage
 * @type {string}
 */
const ACTION_LOG_KEY = 'ask-dreeso-action-log';

/**
 * Maximum number of action log entries to retain
 * @type {number}
 */
const MAX_ACTION_LOG_ENTRIES = 500;

/**
 * Valid action types for execution
 * @type {Object.<string, string>}
 */
export const ACTION_TYPES = Object.freeze({
  NAVIGATE: 'navigate',
  GENERATE_REPORT: 'generate-report',
  SCHEDULE: 'schedule',
  ESCALATE: 'escalate',
  UPDATE: 'update',
  WORKFLOW: 'workflow',
  RECOMMENDATION: 'recommendation',
  SHARE: 'share',
  CREATE: 'create',
  EXPORT_CSV: 'export-csv',
});

/**
 * @typedef {Object} ActionLogEntry
 * @property {string} id - Unique entry identifier
 * @property {string} actionType - Type of action executed
 * @property {Object} payload - Action-specific payload data
 * @property {string|null} targetSystem - Target system identifier, or null
 * @property {string} status - Execution status ('success', 'error', 'pending')
 * @property {string} message - Result message
 * @property {number} timestamp - Unix timestamp in milliseconds
 * @property {string} isoTimestamp - ISO 8601 formatted timestamp
 * @property {string|null} persona - Persona ID at time of execution, or null
 * @property {string|null} actionId - Associated mock action ID, or null
 */

/**
 * @typedef {Object} ActionExecutionResult
 * @property {boolean} success - Whether the action executed successfully
 * @property {string} message - Result message
 * @property {string} timestamp - ISO 8601 formatted timestamp
 * @property {string} status - Execution status ('success', 'error', 'pending')
 * @property {Object|null} details - Additional result details, or null
 * @property {string} id - Unique execution identifier
 */

/**
 * Generates a unique identifier for an action log entry
 * @returns {string} A unique identifier string
 */
function generateActionId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `action-${timestamp}-${random}`;
}

/**
 * Safely reads and parses the action log from localStorage
 * @returns {ActionLogEntry[]} The parsed action log array, or empty array on failure
 */
function readActionLog() {
  try {
    const raw = localStorage.getItem(ACTION_LOG_KEY);
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
 * Safely writes the action log array to localStorage
 * @param {ActionLogEntry[]} entries - The action log entries to persist
 * @returns {boolean} True if write succeeded, false otherwise
 */
function writeActionLog(entries) {
  try {
    if (!Array.isArray(entries)) {
      return false;
    }
    localStorage.setItem(ACTION_LOG_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

/**
 * Prunes the action log to stay within the maximum entry limit.
 * Removes the oldest entries first.
 * @param {ActionLogEntry[]} entries - The current action log entries
 * @returns {ActionLogEntry[]} The pruned action log entries
 */
function pruneActionLog(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }
  if (entries.length <= MAX_ACTION_LOG_ENTRIES) {
    return entries;
  }
  return entries.slice(entries.length - MAX_ACTION_LOG_ENTRIES);
}

/**
 * Retrieves the current persona from the active session
 * @returns {string|null} The persona ID, or null if not available
 */
function getCurrentPersona() {
  try {
    const session = getSession();
    return session ? session.persona : null;
  } catch {
    return null;
  }
}

/**
 * Validates a target system identifier against known systems
 * @param {string} targetSystem - The system identifier to validate
 * @returns {boolean} True if the system is valid
 */
function isValidSystem(targetSystem) {
  if (typeof targetSystem !== 'string' || targetSystem.trim().length === 0) {
    return false;
  }

  const validSystemIds = Object.values(SYSTEMS).map((s) => s.id);
  return validSystemIds.includes(targetSystem.trim().toLowerCase());
}

/**
 * Resolves a system identifier to its normalized form
 * @param {string} targetSystem - The system identifier
 * @returns {string|null} The normalized system ID, or null if invalid
 */
function resolveSystemId(targetSystem) {
  if (typeof targetSystem !== 'string' || targetSystem.trim().length === 0) {
    return null;
  }

  const normalized = targetSystem.trim().toLowerCase();
  const systemValues = Object.values(SYSTEMS);
  const match = systemValues.find(
    (s) => s.id === normalized || s.label.toLowerCase() === normalized
  );

  return match ? match.id : null;
}

/**
 * Returns the display label for a system ID
 * @param {string} systemId - The system identifier
 * @returns {string} The display label, or the systemId if not found
 */
function getSystemLabel(systemId) {
  if (typeof systemId !== 'string') {
    return 'Unknown System';
  }

  const systemValues = Object.values(SYSTEMS);
  const match = systemValues.find((s) => s.id === systemId);
  return match ? match.label : systemId;
}

/**
 * Simulates action execution for a specific system.
 * Returns a simulated result based on the action type and target system.
 *
 * @param {string} actionType - The type of action to execute
 * @param {Object} payload - Action-specific payload data
 * @param {string|null} resolvedSystemId - The resolved system identifier, or null
 * @returns {{ success: boolean, message: string, status: string, details: Object|null }} Simulated result
 */
function simulateExecution(actionType, payload, resolvedSystemId) {
  const systemLabel = resolvedSystemId ? getSystemLabel(resolvedSystemId) : 'system';
  const now = new Date().toISOString();

  // Check if there is a matching mock action result
  if (payload && typeof payload.actionId === 'string') {
    const mockResult = getActionResult(payload.actionId);
    if (mockResult) {
      return {
        success: mockResult.status === 'success',
        message: mockResult.message,
        status: mockResult.status,
        details: mockResult.details || null,
      };
    }
  }

  // Simulate based on action type
  switch (actionType) {
    case ACTION_TYPES.NAVIGATE:
      return {
        success: true,
        message: `Navigation to ${payload.target || 'target'} initiated in ${systemLabel}.`,
        status: 'success',
        details: { target: payload.target || null, system: resolvedSystemId },
      };

    case ACTION_TYPES.GENERATE_REPORT:
      return {
        success: true,
        message: `Report "${payload.reportName || 'Report'}" generated successfully from ${systemLabel}.`,
        status: 'success',
        details: {
          reportName: payload.reportName || 'Generated Report',
          generatedAt: now,
          format: payload.format || 'PDF',
          system: resolvedSystemId,
        },
      };

    case ACTION_TYPES.SCHEDULE:
      return {
        success: true,
        message: `Meeting "${payload.title || 'Meeting'}" scheduled successfully via ${systemLabel}.`,
        status: 'success',
        details: {
          title: payload.title || 'Scheduled Meeting',
          scheduledAt: payload.scheduledAt || now,
          attendees: payload.attendees || [],
          system: resolvedSystemId,
        },
      };

    case ACTION_TYPES.ESCALATE:
      return {
        success: true,
        message: `Escalation submitted successfully to ${systemLabel}. Stakeholders have been notified.`,
        status: 'success',
        details: {
          escalatedTo: payload.escalatedTo || [],
          severity: payload.severity || 'high',
          system: resolvedSystemId,
        },
      };

    case ACTION_TYPES.UPDATE:
      return {
        success: true,
        message: `Update applied successfully in ${systemLabel}.`,
        status: 'success',
        details: {
          updatedFields: payload.updatedFields || {},
          system: resolvedSystemId,
        },
      };

    case ACTION_TYPES.WORKFLOW:
      return {
        success: true,
        message: `Workflow initiated successfully in ${systemLabel}. Awaiting approvals.`,
        status: 'pending',
        details: {
          workflowName: payload.workflowName || 'Workflow',
          initiatedAt: now,
          approvalRequired: payload.approvalRequired || true,
          system: resolvedSystemId,
        },
      };

    case ACTION_TYPES.RECOMMENDATION:
      return {
        success: true,
        message: `Recommendation recorded and shared with relevant stakeholders.`,
        status: 'success',
        details: {
          recommendation: payload.recommendation || '',
          sharedWith: payload.sharedWith || [],
          system: resolvedSystemId,
        },
      };

    case ACTION_TYPES.SHARE:
      return {
        success: true,
        message: `Content shared successfully with ${(payload.recipients || []).length || 0} recipients.`,
        status: 'success',
        details: {
          recipients: payload.recipients || [],
          sharedAt: now,
          system: resolvedSystemId,
        },
      };

    case ACTION_TYPES.CREATE:
      return {
        success: true,
        message: `New entry created successfully in ${systemLabel}.`,
        status: 'success',
        details: {
          createdAt: now,
          entityType: payload.entityType || 'entry',
          system: resolvedSystemId,
        },
      };

    case ACTION_TYPES.EXPORT_CSV:
      return {
        success: true,
        message: `Data exported as CSV from ${systemLabel} successfully.`,
        status: 'success',
        details: {
          fileName: payload.fileName || 'export.csv',
          exportedAt: now,
          rowCount: payload.rowCount || 0,
          system: resolvedSystemId,
        },
      };

    default:
      return {
        success: true,
        message: `Action "${actionType}" executed successfully in ${systemLabel}.`,
        status: 'success',
        details: { system: resolvedSystemId },
      };
  }
}

/**
 * Executes a simulated action in an enterprise system.
 * Validates inputs, simulates execution, persists the action to the log,
 * and logs an audit event.
 *
 * @param {string} actionType - The type of action to execute (e.g., 'generate-report', 'schedule')
 * @param {Object} [payload={}] - Action-specific payload data
 * @param {string} [targetSystem] - Target system identifier (e.g., 'sap', 'procore')
 * @returns {Promise<ActionExecutionResult>} Promise resolving to the execution result
 */
export async function executeAction(actionType, payload = {}, targetSystem) {
  const delay = parseInt(import.meta.env.VITE_MOCK_DELAY_MS, 10) || 500;

  await new Promise((resolve) => setTimeout(resolve, delay));

  const now = Date.now();
  const isoTimestamp = new Date(now).toISOString();
  const executionId = generateActionId();

  // Validate action type
  if (typeof actionType !== 'string' || actionType.trim().length === 0) {
    const errorEntry = {
      id: executionId,
      actionType: '',
      payload: {},
      targetSystem: null,
      status: 'error',
      message: 'Action type is required.',
      timestamp: now,
      isoTimestamp,
      persona: getCurrentPersona(),
      actionId: null,
    };

    const entries = readActionLog();
    entries.push(errorEntry);
    writeActionLog(pruneActionLog(entries));

    logEvent(AUDIT_EVENT_TYPES.ACTION_ERROR, {
      executionId,
      actionType: '',
      errorCode: 'INVALID_ACTION_TYPE',
      message: 'Action type is required.',
    });

    return {
      success: false,
      message: 'Action type is required.',
      timestamp: isoTimestamp,
      status: 'error',
      details: null,
      id: executionId,
    };
  }

  // Normalize payload
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    payload = {};
  }

  // Resolve target system
  const resolvedSystemId = typeof targetSystem === 'string' && targetSystem.trim().length > 0
    ? resolveSystemId(targetSystem)
    : null;

  try {
    // Log action execution attempt
    logEvent(AUDIT_EVENT_TYPES.ACTION_EXECUTE, {
      executionId,
      actionType: actionType.trim(),
      targetSystem: resolvedSystemId,
      payload,
    });

    // Simulate execution
    const result = simulateExecution(actionType.trim(), payload, resolvedSystemId);

    // Create action log entry
    /** @type {ActionLogEntry} */
    const logEntry = {
      id: executionId,
      actionType: actionType.trim(),
      payload: { ...payload },
      targetSystem: resolvedSystemId,
      status: result.status,
      message: result.message,
      timestamp: now,
      isoTimestamp,
      persona: getCurrentPersona(),
      actionId: payload.actionId || null,
    };

    // Persist to action log
    const entries = readActionLog();
    entries.push(logEntry);
    const pruned = pruneActionLog(entries);
    writeActionLog(pruned);

    // Log audit event for result
    if (result.success) {
      logEvent(AUDIT_EVENT_TYPES.ACTION_SUCCESS, {
        executionId,
        actionType: actionType.trim(),
        targetSystem: resolvedSystemId,
        status: result.status,
        message: result.message,
      });
    } else {
      logEvent(AUDIT_EVENT_TYPES.ACTION_ERROR, {
        executionId,
        actionType: actionType.trim(),
        targetSystem: resolvedSystemId,
        status: result.status,
        message: result.message,
      });
    }

    return {
      success: result.success,
      message: result.message,
      timestamp: isoTimestamp,
      status: result.status,
      details: result.details,
      id: executionId,
    };
  } catch {
    // Handle unexpected errors
    const errorMessage = 'An unexpected error occurred during action execution.';

    const errorEntry = {
      id: executionId,
      actionType: actionType.trim(),
      payload: { ...payload },
      targetSystem: resolvedSystemId,
      status: 'error',
      message: errorMessage,
      timestamp: now,
      isoTimestamp,
      persona: getCurrentPersona(),
      actionId: payload.actionId || null,
    };

    const entries = readActionLog();
    entries.push(errorEntry);
    writeActionLog(pruneActionLog(entries));

    logEvent(AUDIT_EVENT_TYPES.ACTION_ERROR, {
      executionId,
      actionType: actionType.trim(),
      targetSystem: resolvedSystemId,
      errorCode: 'EXECUTION_ERROR',
      message: errorMessage,
    });

    return {
      success: false,
      message: errorMessage,
      timestamp: isoTimestamp,
      status: 'error',
      details: null,
      id: executionId,
    };
  }
}

/**
 * Retrieves the complete action log from localStorage.
 * Returns entries sorted by timestamp in ascending order.
 *
 * @returns {ActionLogEntry[]} Array of all action log entries
 */
export function getActionLog() {
  const entries = readActionLog();
  return entries.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Clears the entire action log from localStorage.
 *
 * @returns {boolean} True if the action log was cleared successfully
 */
export function clearActionLog() {
  try {
    localStorage.removeItem(ACTION_LOG_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns the total number of action log entries currently stored.
 *
 * @returns {number} The count of action log entries
 */
export function getActionLogCount() {
  const entries = readActionLog();
  return entries.length;
}

/**
 * Retrieves action log entries filtered by action type.
 * Returns entries sorted by timestamp in ascending order.
 *
 * @param {string} actionType - The action type to filter by
 * @returns {ActionLogEntry[]} Array of matching action log entries
 */
export function getActionLogByType(actionType) {
  if (typeof actionType !== 'string' || actionType.trim().length === 0) {
    return [];
  }

  const normalized = actionType.trim();
  const entries = readActionLog();
  return entries
    .filter((entry) => entry.actionType === normalized)
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Retrieves action log entries filtered by target system.
 * Returns entries sorted by timestamp in ascending order.
 *
 * @param {string} systemId - The system identifier to filter by
 * @returns {ActionLogEntry[]} Array of matching action log entries
 */
export function getActionLogBySystem(systemId) {
  if (typeof systemId !== 'string' || systemId.trim().length === 0) {
    return [];
  }

  const resolved = resolveSystemId(systemId);
  if (!resolved) {
    return [];
  }

  const entries = readActionLog();
  return entries
    .filter((entry) => entry.targetSystem === resolved)
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Retrieves action log entries filtered by status.
 * Returns entries sorted by timestamp in ascending order.
 *
 * @param {string} status - The status to filter by ('success', 'error', 'pending')
 * @returns {ActionLogEntry[]} Array of matching action log entries
 */
export function getActionLogByStatus(status) {
  if (typeof status !== 'string' || status.trim().length === 0) {
    return [];
  }

  const normalized = status.trim().toLowerCase();
  const validStatuses = ['success', 'error', 'pending'];
  if (!validStatuses.includes(normalized)) {
    return [];
  }

  const entries = readActionLog();
  return entries
    .filter((entry) => entry.status === normalized)
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Retrieves action log entries filtered by persona ID.
 * Returns entries sorted by timestamp in ascending order.
 *
 * @param {string} personaId - The persona identifier to filter by
 * @returns {ActionLogEntry[]} Array of matching action log entries
 */
export function getActionLogByPersona(personaId) {
  if (typeof personaId !== 'string' || personaId.trim().length === 0) {
    return [];
  }

  const entries = readActionLog();
  return entries
    .filter((entry) => entry.persona === personaId.trim())
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Exports the action log as a JSON string for download or sharing.
 *
 * @returns {string} JSON string representation of the action log
 */
export function exportActionLog() {
  const entries = getActionLog();
  try {
    return JSON.stringify(entries, null, 2);
  } catch {
    return '[]';
  }
}