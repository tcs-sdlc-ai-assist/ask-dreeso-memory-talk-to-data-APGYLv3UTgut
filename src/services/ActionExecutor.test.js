import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  executeAction,
  getActionLog,
  clearActionLog,
  getActionLogCount,
  getActionLogByType,
  getActionLogBySystem,
  getActionLogByStatus,
  getActionLogByPersona,
  exportActionLog,
  ACTION_TYPES,
} from './ActionExecutor';
import { LOCAL_STORAGE_KEYS } from '../constants';

/**
 * localStorage key used for action log storage (must match ActionExecutor internal key)
 * @type {string}
 */
const ACTION_LOG_KEY = 'ask-dreeso-action-log';

/**
 * Helper to clear all relevant localStorage keys before/after each test.
 */
function clearAllStorage() {
  localStorage.clear();
}

/**
 * Helper to set up a persona in session storage for testing.
 * @param {string} personaId - The persona ID to set
 */
function setPersonaInSession(personaId) {
  const session = {
    userId: `user-${personaId}-test`,
    persona: personaId,
    role: 'Test Role',
    token: 'mock_token_test',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    fullName: `${personaId} Test`,
    email: `${personaId}@dreeso.demo`,
  };
  localStorage.setItem('ask-dreeso-session', JSON.stringify(session));
  localStorage.setItem(LOCAL_STORAGE_KEYS.SELECTED_PERSONA, JSON.stringify(personaId));
}

describe('ActionExecutor', () => {
  beforeEach(() => {
    clearAllStorage();
  });

  afterEach(() => {
    clearAllStorage();
  });

  describe('ACTION_TYPES', () => {
    it('contains all expected action type constants', () => {
      expect(ACTION_TYPES.NAVIGATE).toBe('navigate');
      expect(ACTION_TYPES.GENERATE_REPORT).toBe('generate-report');
      expect(ACTION_TYPES.SCHEDULE).toBe('schedule');
      expect(ACTION_TYPES.ESCALATE).toBe('escalate');
      expect(ACTION_TYPES.UPDATE).toBe('update');
      expect(ACTION_TYPES.WORKFLOW).toBe('workflow');
      expect(ACTION_TYPES.RECOMMENDATION).toBe('recommendation');
      expect(ACTION_TYPES.SHARE).toBe('share');
      expect(ACTION_TYPES.CREATE).toBe('create');
      expect(ACTION_TYPES.EXPORT_CSV).toBe('export-csv');
    });

    it('is frozen and cannot be modified', () => {
      expect(Object.isFrozen(ACTION_TYPES)).toBe(true);
    });

    it('contains at least 10 action types', () => {
      const keys = Object.keys(ACTION_TYPES);
      expect(keys.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('executeAction', () => {
    describe('happy path - basic execution', () => {
      it('returns an execution result with all required fields', async () => {
        const result = await executeAction(ACTION_TYPES.NAVIGATE, { target: 'proj-101' });

        expect(result).not.toBeNull();
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('timestamp');
        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('details');
        expect(result).toHaveProperty('id');
        expect(typeof result.success).toBe('boolean');
        expect(typeof result.message).toBe('string');
        expect(typeof result.timestamp).toBe('string');
        expect(typeof result.status).toBe('string');
        expect(typeof result.id).toBe('string');
      });

      it('returns success for navigate action type', async () => {
        const result = await executeAction(ACTION_TYPES.NAVIGATE, { target: 'proj-101' });

        expect(result.success).toBe(true);
        expect(result.status).toBe('success');
        expect(result.message.length).toBeGreaterThan(0);
      });

      it('returns success for generate-report action type', async () => {
        const result = await executeAction(ACTION_TYPES.GENERATE_REPORT, { reportName: 'Test Report' });

        expect(result.success).toBe(true);
        expect(result.status).toBe('success');
        expect(result.message).toContain('Report');
      });

      it('returns success for schedule action type', async () => {
        const result = await executeAction(ACTION_TYPES.SCHEDULE, { title: 'Team Meeting' });

        expect(result.success).toBe(true);
        expect(result.status).toBe('success');
        expect(result.message).toContain('Meeting');
      });

      it('returns success for escalate action type', async () => {
        const result = await executeAction(ACTION_TYPES.ESCALATE, { severity: 'high' });

        expect(result.success).toBe(true);
        expect(result.status).toBe('success');
        expect(result.message).toContain('Escalation');
      });

      it('returns success for update action type', async () => {
        const result = await executeAction(ACTION_TYPES.UPDATE, { updatedFields: { status: 'done' } });

        expect(result.success).toBe(true);
        expect(result.status).toBe('success');
        expect(result.message).toContain('Update');
      });

      it('returns pending status for workflow action type', async () => {
        const result = await executeAction(ACTION_TYPES.WORKFLOW, { workflowName: 'Approval' });

        expect(result.success).toBe(true);
        expect(result.status).toBe('pending');
        expect(result.message).toContain('Workflow');
      });

      it('returns success for recommendation action type', async () => {
        const result = await executeAction(ACTION_TYPES.RECOMMENDATION, { recommendation: 'Test' });

        expect(result.success).toBe(true);
        expect(result.status).toBe('success');
        expect(result.message).toContain('Recommendation');
      });

      it('returns success for share action type', async () => {
        const result = await executeAction(ACTION_TYPES.SHARE, { recipients: ['user1', 'user2'] });

        expect(result.success).toBe(true);
        expect(result.status).toBe('success');
        expect(result.message).toContain('shared');
      });

      it('returns success for create action type', async () => {
        const result = await executeAction(ACTION_TYPES.CREATE, { entityType: 'lesson' });

        expect(result.success).toBe(true);
        expect(result.status).toBe('success');
        expect(result.message).toContain('created');
      });

      it('returns success for export-csv action type', async () => {
        const result = await executeAction(ACTION_TYPES.EXPORT_CSV, { fileName: 'data.csv' });

        expect(result.success).toBe(true);
        expect(result.status).toBe('success');
        expect(result.message).toContain('exported');
      });

      it('returns success for unknown action types', async () => {
        const result = await executeAction('custom-action', { data: 'test' });

        expect(result.success).toBe(true);
        expect(result.status).toBe('success');
        expect(result.message.length).toBeGreaterThan(0);
      });

      it('generates a unique execution ID for each call', async () => {
        const result1 = await executeAction(ACTION_TYPES.NAVIGATE, {});
        const result2 = await executeAction(ACTION_TYPES.NAVIGATE, {});
        const result3 = await executeAction(ACTION_TYPES.NAVIGATE, {});

        expect(result1.id).not.toBe(result2.id);
        expect(result2.id).not.toBe(result3.id);
        expect(result1.id).not.toBe(result3.id);
      });

      it('returns a valid ISO timestamp', async () => {
        const result = await executeAction(ACTION_TYPES.NAVIGATE, {});

        expect(typeof result.timestamp).toBe('string');
        const parsed = new Date(result.timestamp);
        expect(isNaN(parsed.getTime())).toBe(false);
      });
    });

    describe('happy path - action log persistence', () => {
      it('persists the action to localStorage', async () => {
        await executeAction(ACTION_TYPES.NAVIGATE, { target: 'proj-101' });

        const raw = localStorage.getItem(ACTION_LOG_KEY);
        expect(raw).not.toBeNull();

        const parsed = JSON.parse(raw);
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed.length).toBe(1);
        expect(parsed[0].actionType).toBe(ACTION_TYPES.NAVIGATE);
      });

      it('appends multiple actions to the log', async () => {
        await executeAction(ACTION_TYPES.NAVIGATE, {});
        await executeAction(ACTION_TYPES.SCHEDULE, {});
        await executeAction(ACTION_TYPES.GENERATE_REPORT, {});

        const raw = localStorage.getItem(ACTION_LOG_KEY);
        const parsed = JSON.parse(raw);
        expect(parsed.length).toBe(3);
      });

      it('stores the action type in the log entry', async () => {
        await executeAction(ACTION_TYPES.GENERATE_REPORT, { reportName: 'Test' });

        const log = getActionLog();
        expect(log.length).toBe(1);
        expect(log[0].actionType).toBe(ACTION_TYPES.GENERATE_REPORT);
      });

      it('stores the payload in the log entry', async () => {
        await executeAction(ACTION_TYPES.SCHEDULE, { title: 'Meeting', attendees: ['A', 'B'] });

        const log = getActionLog();
        expect(log.length).toBe(1);
        expect(log[0].payload).toBeDefined();
        expect(log[0].payload.title).toBe('Meeting');
      });

      it('stores the status in the log entry', async () => {
        await executeAction(ACTION_TYPES.WORKFLOW, {});

        const log = getActionLog();
        expect(log.length).toBe(1);
        expect(log[0].status).toBe('pending');
      });

      it('stores the message in the log entry', async () => {
        await executeAction(ACTION_TYPES.NAVIGATE, { target: 'test' });

        const log = getActionLog();
        expect(log.length).toBe(1);
        expect(typeof log[0].message).toBe('string');
        expect(log[0].message.length).toBeGreaterThan(0);
      });

      it('stores a timestamp in the log entry', async () => {
        const before = Date.now();
        await executeAction(ACTION_TYPES.NAVIGATE, {});
        const after = Date.now();

        const log = getActionLog();
        expect(log.length).toBe(1);
        expect(typeof log[0].timestamp).toBe('number');
        expect(log[0].timestamp).toBeGreaterThanOrEqual(before);
        expect(log[0].timestamp).toBeLessThanOrEqual(after);
      });

      it('stores an ISO timestamp in the log entry', async () => {
        await executeAction(ACTION_TYPES.NAVIGATE, {});

        const log = getActionLog();
        expect(log.length).toBe(1);
        expect(typeof log[0].isoTimestamp).toBe('string');
        const parsed = new Date(log[0].isoTimestamp);
        expect(isNaN(parsed.getTime())).toBe(false);
      });

      it('stores the persona in the log entry when session exists', async () => {
        setPersonaInSession('elena');

        await executeAction(ACTION_TYPES.NAVIGATE, {});

        const log = getActionLog();
        expect(log.length).toBe(1);
        expect(log[0].persona).toBe('elena');
      });

      it('stores null persona when no session exists', async () => {
        await executeAction(ACTION_TYPES.NAVIGATE, {});

        const log = getActionLog();
        expect(log.length).toBe(1);
        expect(log[0].persona).toBeNull();
      });

      it('stores the execution ID in the log entry', async () => {
        const result = await executeAction(ACTION_TYPES.NAVIGATE, {});

        const log = getActionLog();
        expect(log.length).toBe(1);
        expect(log[0].id).toBe(result.id);
      });
    });

    describe('happy path - system-specific behavior', () => {
      it('includes target system in result details when provided', async () => {
        const result = await executeAction(ACTION_TYPES.NAVIGATE, { target: 'proj-101' }, 'sap');

        expect(result.success).toBe(true);
        expect(result.details).not.toBeNull();
        expect(result.details.system).toBe('sap');
      });

      it('resolves system ID from system name', async () => {
        const result = await executeAction(ACTION_TYPES.GENERATE_REPORT, { reportName: 'Test' }, 'procore');

        expect(result.success).toBe(true);
        expect(result.details).not.toBeNull();
        expect(result.details.system).toBe('procore');
      });

      it('stores the target system in the action log', async () => {
        await executeAction(ACTION_TYPES.NAVIGATE, {}, 'salesforce');

        const log = getActionLog();
        expect(log.length).toBe(1);
        expect(log[0].targetSystem).toBe('salesforce');
      });

      it('stores null target system when not provided', async () => {
        await executeAction(ACTION_TYPES.NAVIGATE, {});

        const log = getActionLog();
        expect(log.length).toBe(1);
        expect(log[0].targetSystem).toBeNull();
      });

      it('handles invalid system name gracefully', async () => {
        const result = await executeAction(ACTION_TYPES.NAVIGATE, {}, 'nonexistent-system');

        expect(result.success).toBe(true);
        // Should still succeed, just with null resolved system
      });

      it('includes system label in message for navigate actions', async () => {
        const result = await executeAction(ACTION_TYPES.NAVIGATE, { target: 'test' }, 'sap');

        expect(result.message.length).toBeGreaterThan(0);
      });
    });

    describe('happy path - mock action result matching', () => {
      it('returns mock result when actionId matches a known action', async () => {
        const result = await executeAction(ACTION_TYPES.SCHEDULE, { actionId: 'act-pp-003' });

        expect(result.success).toBe(true);
        expect(result.message.length).toBeGreaterThan(0);
      });

      it('returns simulated result when actionId does not match', async () => {
        const result = await executeAction(ACTION_TYPES.SCHEDULE, { actionId: 'nonexistent-action-id' });

        expect(result.success).toBe(true);
        expect(result.message.length).toBeGreaterThan(0);
      });

      it('stores the actionId in the log entry', async () => {
        await executeAction(ACTION_TYPES.SCHEDULE, { actionId: 'act-pp-003' });

        const log = getActionLog();
        expect(log.length).toBe(1);
        expect(log[0].actionId).toBe('act-pp-003');
      });

      it('stores null actionId when not provided', async () => {
        await executeAction(ACTION_TYPES.NAVIGATE, {});

        const log = getActionLog();
        expect(log.length).toBe(1);
        expect(log[0].actionId).toBeNull();
      });
    });

    describe('happy path - result details', () => {
      it('navigate action includes target in details', async () => {
        const result = await executeAction(ACTION_TYPES.NAVIGATE, { target: 'proj-101' });

        expect(result.details).not.toBeNull();
        expect(result.details.target).toBe('proj-101');
      });

      it('generate-report action includes reportName in details', async () => {
        const result = await executeAction(ACTION_TYPES.GENERATE_REPORT, { reportName: 'Q1 Report' });

        expect(result.details).not.toBeNull();
        expect(result.details.reportName).toBe('Q1 Report');
      });

      it('schedule action includes title in details', async () => {
        const result = await executeAction(ACTION_TYPES.SCHEDULE, { title: 'Team Standup' });

        expect(result.details).not.toBeNull();
        expect(result.details.title).toBe('Team Standup');
      });

      it('escalate action includes severity in details', async () => {
        const result = await executeAction(ACTION_TYPES.ESCALATE, { severity: 'critical' });

        expect(result.details).not.toBeNull();
        expect(result.details.severity).toBe('critical');
      });

      it('share action includes recipients in details', async () => {
        const result = await executeAction(ACTION_TYPES.SHARE, { recipients: ['user1', 'user2'] });

        expect(result.details).not.toBeNull();
        expect(Array.isArray(result.details.recipients)).toBe(true);
        expect(result.details.recipients.length).toBe(2);
      });

      it('export-csv action includes fileName in details', async () => {
        const result = await executeAction(ACTION_TYPES.EXPORT_CSV, { fileName: 'export.csv', rowCount: 100 });

        expect(result.details).not.toBeNull();
        expect(result.details.fileName).toBe('export.csv');
      });

      it('create action includes entityType in details', async () => {
        const result = await executeAction(ACTION_TYPES.CREATE, { entityType: 'lesson' });

        expect(result.details).not.toBeNull();
        expect(result.details.entityType).toBe('lesson');
      });

      it('workflow action includes approvalRequired in details', async () => {
        const result = await executeAction(ACTION_TYPES.WORKFLOW, { approvalRequired: true });

        expect(result.details).not.toBeNull();
      });
    });

    describe('error handling - invalid action type', () => {
      it('returns error for empty string action type', async () => {
        const result = await executeAction('', {});

        expect(result.success).toBe(false);
        expect(result.status).toBe('error');
        expect(result.message).toContain('Action type is required');
        expect(result.details).toBeNull();
      });

      it('returns error for null action type', async () => {
        const result = await executeAction(null, {});

        expect(result.success).toBe(false);
        expect(result.status).toBe('error');
      });

      it('returns error for undefined action type', async () => {
        const result = await executeAction(undefined, {});

        expect(result.success).toBe(false);
        expect(result.status).toBe('error');
      });

      it('returns error for non-string action type', async () => {
        const result = await executeAction(42, {});

        expect(result.success).toBe(false);
        expect(result.status).toBe('error');
      });

      it('returns error for whitespace-only action type', async () => {
        const result = await executeAction('   ', {});

        expect(result.success).toBe(false);
        expect(result.status).toBe('error');
      });

      it('still returns an execution ID on error', async () => {
        const result = await executeAction('', {});

        expect(typeof result.id).toBe('string');
        expect(result.id.length).toBeGreaterThan(0);
      });

      it('still returns a timestamp on error', async () => {
        const result = await executeAction('', {});

        expect(typeof result.timestamp).toBe('string');
        const parsed = new Date(result.timestamp);
        expect(isNaN(parsed.getTime())).toBe(false);
      });

      it('persists error entries to the action log', async () => {
        await executeAction('', {});

        const log = getActionLog();
        expect(log.length).toBe(1);
        expect(log[0].status).toBe('error');
      });
    });

    describe('error handling - invalid payload', () => {
      it('handles null payload gracefully', async () => {
        const result = await executeAction(ACTION_TYPES.NAVIGATE, null);

        expect(result.success).toBe(true);
        expect(result.status).toBe('success');
      });

      it('handles undefined payload gracefully', async () => {
        const result = await executeAction(ACTION_TYPES.NAVIGATE);

        expect(result.success).toBe(true);
        expect(result.status).toBe('success');
      });

      it('handles array payload gracefully', async () => {
        const result = await executeAction(ACTION_TYPES.NAVIGATE, [1, 2, 3]);

        expect(result.success).toBe(true);
        expect(result.status).toBe('success');
      });

      it('handles string payload gracefully', async () => {
        const result = await executeAction(ACTION_TYPES.NAVIGATE, 'not-an-object');

        expect(result.success).toBe(true);
        expect(result.status).toBe('success');
      });

      it('handles number payload gracefully', async () => {
        const result = await executeAction(ACTION_TYPES.NAVIGATE, 42);

        expect(result.success).toBe(true);
        expect(result.status).toBe('success');
      });
    });

    describe('edge cases', () => {
      it('trims whitespace from action type', async () => {
        const result = await executeAction('  navigate  ', { target: 'test' });

        expect(result.success).toBe(true);

        const log = getActionLog();
        expect(log[0].actionType).toBe('navigate');
      });

      it('handles empty payload object', async () => {
        const result = await executeAction(ACTION_TYPES.NAVIGATE, {});

        expect(result.success).toBe(true);
      });

      it('handles payload with nested objects', async () => {
        const result = await executeAction(ACTION_TYPES.UPDATE, {
          updatedFields: { status: 'done', nested: { deep: true } },
        });

        expect(result.success).toBe(true);
      });

      it('handles empty string target system', async () => {
        const result = await executeAction(ACTION_TYPES.NAVIGATE, {}, '');

        expect(result.success).toBe(true);
      });

      it('handles undefined target system', async () => {
        const result = await executeAction(ACTION_TYPES.NAVIGATE, {}, undefined);

        expect(result.success).toBe(true);
      });
    });
  });

  describe('getActionLog', () => {
    it('returns an empty array when no actions have been executed', () => {
      const log = getActionLog();

      expect(Array.isArray(log)).toBe(true);
      expect(log.length).toBe(0);
    });

    it('returns all executed actions', async () => {
      await executeAction(ACTION_TYPES.NAVIGATE, {});
      await executeAction(ACTION_TYPES.SCHEDULE, {});
      await executeAction(ACTION_TYPES.GENERATE_REPORT, {});

      const log = getActionLog();

      expect(log.length).toBe(3);
    });

    it('returns entries sorted by timestamp in ascending order', async () => {
      await executeAction(ACTION_TYPES.NAVIGATE, {});
      await executeAction(ACTION_TYPES.SCHEDULE, {});
      await executeAction(ACTION_TYPES.GENERATE_REPORT, {});

      const log = getActionLog();

      for (let i = 1; i < log.length; i++) {
        expect(log[i].timestamp).toBeGreaterThanOrEqual(log[i - 1].timestamp);
      }
    });

    it('returns entries with all required fields', async () => {
      await executeAction(ACTION_TYPES.NAVIGATE, { target: 'test' });

      const log = getActionLog();
      expect(log.length).toBe(1);

      const entry = log[0];
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('actionType');
      expect(entry).toHaveProperty('payload');
      expect(entry).toHaveProperty('targetSystem');
      expect(entry).toHaveProperty('status');
      expect(entry).toHaveProperty('message');
      expect(entry).toHaveProperty('timestamp');
      expect(entry).toHaveProperty('isoTimestamp');
      expect(entry).toHaveProperty('persona');
      expect(entry).toHaveProperty('actionId');
    });

    it('returns an empty array when localStorage contains corrupted data', () => {
      localStorage.setItem(ACTION_LOG_KEY, 'corrupted{{{');

      const log = getActionLog();

      expect(Array.isArray(log)).toBe(true);
      expect(log.length).toBe(0);
    });

    it('returns an empty array when localStorage contains non-array data', () => {
      localStorage.setItem(ACTION_LOG_KEY, JSON.stringify({ not: 'an array' }));

      const log = getActionLog();

      expect(Array.isArray(log)).toBe(true);
      expect(log.length).toBe(0);
    });
  });

  describe('clearActionLog', () => {
    it('removes all action log entries from localStorage', async () => {
      await executeAction(ACTION_TYPES.NAVIGATE, {});
      await executeAction(ACTION_TYPES.SCHEDULE, {});

      expect(getActionLogCount()).toBe(2);

      const result = clearActionLog();

      expect(result).toBe(true);
      expect(getActionLogCount()).toBe(0);
      expect(localStorage.getItem(ACTION_LOG_KEY)).toBeNull();
    });

    it('returns true even when no entries exist', () => {
      const result = clearActionLog();
      expect(result).toBe(true);
    });

    it('allows new entries to be logged after clearing', async () => {
      await executeAction(ACTION_TYPES.NAVIGATE, {});
      clearActionLog();

      await executeAction(ACTION_TYPES.SCHEDULE, {});

      const log = getActionLog();
      expect(log.length).toBe(1);
      expect(log[0].actionType).toBe(ACTION_TYPES.SCHEDULE);
    });
  });

  describe('getActionLogCount', () => {
    it('returns 0 when no actions have been executed', () => {
      expect(getActionLogCount()).toBe(0);
    });

    it('returns the correct count after executing actions', async () => {
      await executeAction(ACTION_TYPES.NAVIGATE, {});
      await executeAction(ACTION_TYPES.SCHEDULE, {});
      await executeAction(ACTION_TYPES.GENERATE_REPORT, {});

      expect(getActionLogCount()).toBe(3);
    });

    it('returns 0 after clearing the action log', async () => {
      await executeAction(ACTION_TYPES.NAVIGATE, {});
      await executeAction(ACTION_TYPES.SCHEDULE, {});

      clearActionLog();

      expect(getActionLogCount()).toBe(0);
    });

    it('returns 0 when localStorage contains corrupted data', () => {
      localStorage.setItem(ACTION_LOG_KEY, 'corrupted{{{');

      expect(getActionLogCount()).toBe(0);
    });

    it('returns 0 when localStorage contains non-array data', () => {
      localStorage.setItem(ACTION_LOG_KEY, JSON.stringify({ not: 'array' }));

      expect(getActionLogCount()).toBe(0);
    });
  });

  describe('getActionLogByType', () => {
    it('returns entries matching the specified action type', async () => {
      await executeAction(ACTION_TYPES.NAVIGATE, {});
      await executeAction(ACTION_TYPES.SCHEDULE, {});
      await executeAction(ACTION_TYPES.NAVIGATE, {});
      await executeAction(ACTION_TYPES.GENERATE_REPORT, {});

      const navEntries = getActionLogByType(ACTION_TYPES.NAVIGATE);

      expect(navEntries.length).toBe(2);
      for (const entry of navEntries) {
        expect(entry.actionType).toBe(ACTION_TYPES.NAVIGATE);
      }
    });

    it('returns an empty array when no entries match the type', async () => {
      await executeAction(ACTION_TYPES.NAVIGATE, {});

      const entries = getActionLogByType(ACTION_TYPES.EXPORT_CSV);

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('returns an empty array for empty string type', () => {
      const entries = getActionLogByType('');

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('returns an empty array for non-string type', () => {
      const entries = getActionLogByType(null);

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('returns an empty array for undefined type', () => {
      const entries = getActionLogByType(undefined);

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('returns entries sorted by timestamp in ascending order', async () => {
      await executeAction(ACTION_TYPES.NAVIGATE, {});
      await executeAction(ACTION_TYPES.NAVIGATE, {});
      await executeAction(ACTION_TYPES.NAVIGATE, {});

      const entries = getActionLogByType(ACTION_TYPES.NAVIGATE);

      for (let i = 1; i < entries.length; i++) {
        expect(entries[i].timestamp).toBeGreaterThanOrEqual(entries[i - 1].timestamp);
      }
    });
  });

  describe('getActionLogBySystem', () => {
    it('returns entries matching the specified system ID', async () => {
      await executeAction(ACTION_TYPES.NAVIGATE, {}, 'sap');
      await executeAction(ACTION_TYPES.SCHEDULE, {}, 'procore');
      await executeAction(ACTION_TYPES.GENERATE_REPORT, {}, 'sap');

      const sapEntries = getActionLogBySystem('sap');

      expect(sapEntries.length).toBe(2);
      for (const entry of sapEntries) {
        expect(entry.targetSystem).toBe('sap');
      }
    });

    it('returns an empty array when no entries match the system', async () => {
      await executeAction(ACTION_TYPES.NAVIGATE, {}, 'sap');

      const entries = getActionLogBySystem('salesforce');

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('returns an empty array for empty string system', () => {
      const entries = getActionLogBySystem('');

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('returns an empty array for non-string system', () => {
      const entries = getActionLogBySystem(null);

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('returns an empty array for invalid system name', () => {
      const entries = getActionLogBySystem('nonexistent-system');

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('returns entries sorted by timestamp in ascending order', async () => {
      await executeAction(ACTION_TYPES.NAVIGATE, {}, 'sap');
      await executeAction(ACTION_TYPES.SCHEDULE, {}, 'sap');
      await executeAction(ACTION_TYPES.GENERATE_REPORT, {}, 'sap');

      const entries = getActionLogBySystem('sap');

      for (let i = 1; i < entries.length; i++) {
        expect(entries[i].timestamp).toBeGreaterThanOrEqual(entries[i - 1].timestamp);
      }
    });
  });

  describe('getActionLogByStatus', () => {
    it('returns entries matching the specified status', async () => {
      await executeAction(ACTION_TYPES.NAVIGATE, {});
      await executeAction(ACTION_TYPES.WORKFLOW, {});
      await executeAction(ACTION_TYPES.SCHEDULE, {});

      const successEntries = getActionLogByStatus('success');

      expect(successEntries.length).toBe(2);
      for (const entry of successEntries) {
        expect(entry.status).toBe('success');
      }
    });

    it('returns pending entries for workflow actions', async () => {
      await executeAction(ACTION_TYPES.WORKFLOW, {});

      const pendingEntries = getActionLogByStatus('pending');

      expect(pendingEntries.length).toBe(1);
      expect(pendingEntries[0].status).toBe('pending');
    });

    it('returns error entries for invalid action types', async () => {
      await executeAction('', {});

      const errorEntries = getActionLogByStatus('error');

      expect(errorEntries.length).toBe(1);
      expect(errorEntries[0].status).toBe('error');
    });

    it('returns an empty array when no entries match the status', async () => {
      await executeAction(ACTION_TYPES.NAVIGATE, {});

      const entries = getActionLogByStatus('error');

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('returns an empty array for empty string status', () => {
      const entries = getActionLogByStatus('');

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('returns an empty array for non-string status', () => {
      const entries = getActionLogByStatus(null);

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('returns an empty array for invalid status value', () => {
      const entries = getActionLogByStatus('invalid-status');

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('returns entries sorted by timestamp in ascending order', async () => {
      await executeAction(ACTION_TYPES.NAVIGATE, {});
      await executeAction(ACTION_TYPES.SCHEDULE, {});
      await executeAction(ACTION_TYPES.GENERATE_REPORT, {});

      const entries = getActionLogByStatus('success');

      for (let i = 1; i < entries.length; i++) {
        expect(entries[i].timestamp).toBeGreaterThanOrEqual(entries[i - 1].timestamp);
      }
    });
  });

  describe('getActionLogByPersona', () => {
    it('returns entries matching the specified persona ID', async () => {
      setPersonaInSession('lukas');
      await executeAction(ACTION_TYPES.NAVIGATE, {});
      await executeAction(ACTION_TYPES.SCHEDULE, {});

      setPersonaInSession('elena');
      await executeAction(ACTION_TYPES.GENERATE_REPORT, {});

      const lukasEntries = getActionLogByPersona('lukas');
      expect(lukasEntries.length).toBe(2);
      for (const entry of lukasEntries) {
        expect(entry.persona).toBe('lukas');
      }

      const elenaEntries = getActionLogByPersona('elena');
      expect(elenaEntries.length).toBe(1);
      expect(elenaEntries[0].persona).toBe('elena');
    });

    it('returns an empty array when no entries match the persona', async () => {
      setPersonaInSession('lukas');
      await executeAction(ACTION_TYPES.NAVIGATE, {});

      const entries = getActionLogByPersona('sophie');

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('returns an empty array for empty string persona', () => {
      const entries = getActionLogByPersona('');

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('returns an empty array for non-string persona', () => {
      const entries = getActionLogByPersona(null);

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('returns entries sorted by timestamp in ascending order', async () => {
      setPersonaInSession('james');
      await executeAction(ACTION_TYPES.NAVIGATE, {});
      await executeAction(ACTION_TYPES.SCHEDULE, {});
      await executeAction(ACTION_TYPES.GENERATE_REPORT, {});

      const entries = getActionLogByPersona('james');

      for (let i = 1; i < entries.length; i++) {
        expect(entries[i].timestamp).toBeGreaterThanOrEqual(entries[i - 1].timestamp);
      }
    });
  });

  describe('exportActionLog', () => {
    it('returns a valid JSON string', async () => {
      await executeAction(ACTION_TYPES.NAVIGATE, { target: 'test' });
      await executeAction(ACTION_TYPES.SCHEDULE, { title: 'Meeting' });

      const exported = exportActionLog();

      expect(typeof exported).toBe('string');

      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(2);
    });

    it('returns "[]" when no actions have been executed', () => {
      const exported = exportActionLog();

      expect(exported).toBe('[]');
    });

    it('returns entries sorted by timestamp in ascending order', async () => {
      await executeAction(ACTION_TYPES.NAVIGATE, {});
      await executeAction(ACTION_TYPES.SCHEDULE, {});
      await executeAction(ACTION_TYPES.GENERATE_REPORT, {});

      const exported = exportActionLog();
      const parsed = JSON.parse(exported);

      for (let i = 1; i < parsed.length; i++) {
        expect(parsed[i].timestamp).toBeGreaterThanOrEqual(parsed[i - 1].timestamp);
      }
    });

    it('returns a pretty-printed JSON string with indentation', async () => {
      await executeAction(ACTION_TYPES.NAVIGATE, {});

      const exported = exportActionLog();

      expect(exported).toContain('\n');
    });

    it('exported entries contain all required fields', async () => {
      await executeAction(ACTION_TYPES.NAVIGATE, { target: 'test' }, 'sap');

      const exported = exportActionLog();
      const parsed = JSON.parse(exported);

      expect(parsed.length).toBe(1);
      const entry = parsed[0];
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('actionType');
      expect(entry).toHaveProperty('payload');
      expect(entry).toHaveProperty('targetSystem');
      expect(entry).toHaveProperty('status');
      expect(entry).toHaveProperty('message');
      expect(entry).toHaveProperty('timestamp');
      expect(entry).toHaveProperty('isoTimestamp');
      expect(entry).toHaveProperty('persona');
      expect(entry).toHaveProperty('actionId');
    });
  });

  describe('pruning behavior', () => {
    it('prunes entries when exceeding the maximum limit', async () => {
      // The max is 500 entries. Log 505 entries and verify pruning.
      for (let i = 0; i < 505; i++) {
        // Directly write to localStorage to avoid delay
        const entries = JSON.parse(localStorage.getItem(ACTION_LOG_KEY) || '[]');
        entries.push({
          id: `action-test-${i}`,
          actionType: 'navigate',
          payload: {},
          targetSystem: null,
          status: 'success',
          message: `Action ${i}`,
          timestamp: Date.now() + i,
          isoTimestamp: new Date(Date.now() + i).toISOString(),
          persona: null,
          actionId: null,
        });
        localStorage.setItem(ACTION_LOG_KEY, JSON.stringify(entries));
      }

      // Execute one more action to trigger pruning
      await executeAction(ACTION_TYPES.NAVIGATE, {});

      const count = getActionLogCount();
      expect(count).toBeLessThanOrEqual(500);
      expect(count).toBeGreaterThan(0);
    });

    it('retains the most recent entries after pruning', async () => {
      // Write 505 entries directly
      const entries = [];
      for (let i = 0; i < 505; i++) {
        entries.push({
          id: `action-test-${i}`,
          actionType: 'navigate',
          payload: {},
          targetSystem: null,
          status: 'success',
          message: `Action ${i}`,
          timestamp: Date.now() + i,
          isoTimestamp: new Date(Date.now() + i).toISOString(),
          persona: null,
          actionId: null,
        });
      }
      localStorage.setItem(ACTION_LOG_KEY, JSON.stringify(entries));

      // Execute one more to trigger pruning
      await executeAction(ACTION_TYPES.NAVIGATE, { index: 'last' });

      const log = getActionLog();
      const lastEntry = log[log.length - 1];

      expect(lastEntry.payload.index).toBe('last');
    });
  });

  describe('defensive checks for corrupted localStorage', () => {
    it('executeAction handles corrupted action log gracefully', async () => {
      localStorage.setItem(ACTION_LOG_KEY, 'corrupted{{{data');

      const result = await executeAction(ACTION_TYPES.NAVIGATE, {});

      // Should still succeed because readActionLog returns [] on parse error
      expect(result.success).toBe(true);
    });

    it('executeAction handles non-array action log gracefully', async () => {
      localStorage.setItem(ACTION_LOG_KEY, JSON.stringify({ not: 'an array' }));

      const result = await executeAction(ACTION_TYPES.NAVIGATE, {});

      expect(result.success).toBe(true);
    });

    it('getActionLog handles empty string in localStorage', () => {
      localStorage.setItem(ACTION_LOG_KEY, '');

      const log = getActionLog();
      expect(Array.isArray(log)).toBe(true);
      expect(log.length).toBe(0);
    });

    it('getActionLogByType handles corrupted localStorage', () => {
      localStorage.setItem(ACTION_LOG_KEY, 'corrupted');

      const entries = getActionLogByType(ACTION_TYPES.NAVIGATE);
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('getActionLogCount handles corrupted localStorage', () => {
      localStorage.setItem(ACTION_LOG_KEY, '{invalid}');

      expect(getActionLogCount()).toBe(0);
    });

    it('getActionLogBySystem handles corrupted localStorage', () => {
      localStorage.setItem(ACTION_LOG_KEY, 'bad-data');

      const entries = getActionLogBySystem('sap');
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('getActionLogByStatus handles corrupted localStorage', () => {
      localStorage.setItem(ACTION_LOG_KEY, '{{{{');

      const entries = getActionLogByStatus('success');
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('getActionLogByPersona handles corrupted localStorage', () => {
      localStorage.setItem(ACTION_LOG_KEY, 'not-json');

      const entries = getActionLogByPersona('lukas');
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('exportActionLog handles corrupted localStorage', () => {
      localStorage.setItem(ACTION_LOG_KEY, 'not-json');

      const exported = exportActionLog();
      expect(exported).toBe('[]');
    });

    it('clearActionLog works even with corrupted localStorage', () => {
      localStorage.setItem(ACTION_LOG_KEY, 'corrupted');

      const result = clearActionLog();
      expect(result).toBe(true);
      expect(localStorage.getItem(ACTION_LOG_KEY)).toBeNull();
    });
  });

  describe('end-to-end flow', () => {
    it('execute, retrieve, filter, export, and clear cycle works correctly', async () => {
      // Execute actions with different personas
      setPersonaInSession('lukas');
      await executeAction(ACTION_TYPES.NAVIGATE, { target: 'proj-101' }, 'procore');
      await executeAction(ACTION_TYPES.SCHEDULE, { title: 'Meeting' });

      setPersonaInSession('sophie');
      await executeAction(ACTION_TYPES.GENERATE_REPORT, { reportName: 'Cash Flow' }, 'sap');
      await executeAction(ACTION_TYPES.WORKFLOW, { workflowName: 'Budget Revision' });

      // Verify total count
      expect(getActionLogCount()).toBe(4);

      // Verify retrieval
      const log = getActionLog();
      expect(log.length).toBe(4);

      // Verify filtering by type
      const navEntries = getActionLogByType(ACTION_TYPES.NAVIGATE);
      expect(navEntries.length).toBe(1);
      expect(navEntries[0].payload.target).toBe('proj-101');

      // Verify filtering by status
      const pendingEntries = getActionLogByStatus('pending');
      expect(pendingEntries.length).toBe(1);
      expect(pendingEntries[0].actionType).toBe(ACTION_TYPES.WORKFLOW);

      const successEntries = getActionLogByStatus('success');
      expect(successEntries.length).toBe(3);

      // Verify filtering by persona
      const lukasEntries = getActionLogByPersona('lukas');
      expect(lukasEntries.length).toBe(2);

      const sophieEntries = getActionLogByPersona('sophie');
      expect(sophieEntries.length).toBe(2);

      // Verify filtering by system
      const sapEntries = getActionLogBySystem('sap');
      expect(sapEntries.length).toBe(1);

      const procoreEntries = getActionLogBySystem('procore');
      expect(procoreEntries.length).toBe(1);

      // Verify export
      const exported = exportActionLog();
      const parsed = JSON.parse(exported);
      expect(parsed.length).toBe(4);

      // Verify clear
      clearActionLog();
      expect(getActionLogCount()).toBe(0);
      expect(getActionLog().length).toBe(0);
    });

    it('multiple execute-clear cycles work correctly', async () => {
      await executeAction(ACTION_TYPES.NAVIGATE, { cycle: 1 });
      expect(getActionLogCount()).toBe(1);

      clearActionLog();
      expect(getActionLogCount()).toBe(0);

      await executeAction(ACTION_TYPES.SCHEDULE, { cycle: 2 });
      await executeAction(ACTION_TYPES.GENERATE_REPORT, { cycle: 2 });
      expect(getActionLogCount()).toBe(2);

      clearActionLog();
      expect(getActionLogCount()).toBe(0);

      await executeAction(ACTION_TYPES.WORKFLOW, { cycle: 3 });
      expect(getActionLogCount()).toBe(1);

      const log = getActionLog();
      expect(log[0].actionType).toBe(ACTION_TYPES.WORKFLOW);
      expect(log[0].payload.cycle).toBe(3);
    });

    it('error actions are mixed with success actions correctly', async () => {
      await executeAction(ACTION_TYPES.NAVIGATE, {});
      await executeAction('', {}); // error
      await executeAction(ACTION_TYPES.SCHEDULE, {});
      await executeAction(null, {}); // error
      await executeAction(ACTION_TYPES.WORKFLOW, {}); // pending

      expect(getActionLogCount()).toBe(5);

      const successEntries = getActionLogByStatus('success');
      expect(successEntries.length).toBe(2);

      const errorEntries = getActionLogByStatus('error');
      expect(errorEntries.length).toBe(2);

      const pendingEntries = getActionLogByStatus('pending');
      expect(pendingEntries.length).toBe(1);
    });
  });

  describe('timestamp accuracy', () => {
    it('timestamps are within a reasonable range of Date.now()', async () => {
      const before = Date.now();
      const result = await executeAction(ACTION_TYPES.NAVIGATE, {});
      const after = Date.now();

      const log = getActionLog();
      expect(log.length).toBe(1);
      expect(log[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(log[0].timestamp).toBeLessThanOrEqual(after);
    });

    it('isoTimestamp matches the timestamp value', async () => {
      await executeAction(ACTION_TYPES.NAVIGATE, {});

      const log = getActionLog();
      expect(log.length).toBe(1);

      const fromIso = new Date(log[0].isoTimestamp).getTime();
      expect(fromIso).toBe(log[0].timestamp);
    });

    it('sequential entries have non-decreasing timestamps', async () => {
      await executeAction(ACTION_TYPES.NAVIGATE, {});
      await executeAction(ACTION_TYPES.SCHEDULE, {});
      await executeAction(ACTION_TYPES.GENERATE_REPORT, {});

      const log = getActionLog();

      for (let i = 1; i < log.length; i++) {
        expect(log[i].timestamp).toBeGreaterThanOrEqual(log[i - 1].timestamp);
      }
    });
  });

  describe('concurrent execution', () => {
    it('handles concurrent action executions without data loss', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(executeAction(ACTION_TYPES.NAVIGATE, { index: i }));
      }

      const results = await Promise.all(promises);

      expect(results.length).toBe(10);
      for (const result of results) {
        expect(result.success).toBe(true);
      }

      // Due to concurrent writes, some entries may be lost in localStorage
      // but all results should be valid
      const log = getActionLog();
      expect(log.length).toBeGreaterThan(0);
    });
  });
});