import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  logEvent,
  AUDIT_EVENT_TYPES,
  getAuditTrail,
  clearAuditTrail,
  getAuditTrailByType,
  getAuditTrailCount,
  getAuditTrailByPersona,
  getAuditTrailByTimeRange,
  exportAuditTrail,
} from './AuditLogger';
import { LOCAL_STORAGE_KEYS } from '../constants';

/**
 * Helper to clear all relevant localStorage keys before/after each test.
 */
function clearAllStorage() {
  localStorage.clear();
}

describe('AuditLogger', () => {
  beforeEach(() => {
    clearAllStorage();
  });

  afterEach(() => {
    clearAllStorage();
  });

  describe('logEvent', () => {
    it('creates an audit log entry and returns it', () => {
      const entry = logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {
        action: 'TEST_ACTION',
        fromScreen: 0,
      });

      expect(entry).not.toBeNull();
      expect(typeof entry.id).toBe('string');
      expect(entry.id.length).toBeGreaterThan(0);
      expect(entry.eventType).toBe(AUDIT_EVENT_TYPES.NAVIGATION);
      expect(entry.details).toBeDefined();
      expect(entry.details.action).toBe('TEST_ACTION');
      expect(entry.details.fromScreen).toBe(0);
    });

    it('includes a timestamp in milliseconds', () => {
      const before = Date.now();
      const entry = logEvent(AUDIT_EVENT_TYPES.QUERY_SUBMIT, { queryText: 'test' });
      const after = Date.now();

      expect(entry).not.toBeNull();
      expect(typeof entry.timestamp).toBe('number');
      expect(entry.timestamp).toBeGreaterThanOrEqual(before);
      expect(entry.timestamp).toBeLessThanOrEqual(after);
    });

    it('includes an ISO timestamp string', () => {
      const entry = logEvent(AUDIT_EVENT_TYPES.SCREEN_VIEW, { screenId: 3 });

      expect(entry).not.toBeNull();
      expect(typeof entry.isoTimestamp).toBe('string');
      expect(entry.isoTimestamp.length).toBeGreaterThan(0);

      const parsed = new Date(entry.isoTimestamp);
      expect(isNaN(parsed.getTime())).toBe(false);
    });

    it('persists the entry to localStorage', () => {
      logEvent(AUDIT_EVENT_TYPES.AUTH_LOGIN, { userId: 'user-123' });

      const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.AUDIT_LOG);
      expect(raw).not.toBeNull();

      const parsed = JSON.parse(raw);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(1);
      expect(parsed[0].eventType).toBe(AUDIT_EVENT_TYPES.AUTH_LOGIN);
    });

    it('appends multiple entries to localStorage', () => {
      logEvent(AUDIT_EVENT_TYPES.AUTH_LOGIN, { userId: 'user-1' });
      logEvent(AUDIT_EVENT_TYPES.NAVIGATION, { action: 'NAV' });
      logEvent(AUDIT_EVENT_TYPES.QUERY_SUBMIT, { queryText: 'test' });

      const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.AUDIT_LOG);
      const parsed = JSON.parse(raw);
      expect(parsed.length).toBe(3);
    });

    it('generates unique IDs for each entry', () => {
      const entry1 = logEvent(AUDIT_EVENT_TYPES.NAVIGATION, { action: 'A' });
      const entry2 = logEvent(AUDIT_EVENT_TYPES.NAVIGATION, { action: 'B' });
      const entry3 = logEvent(AUDIT_EVENT_TYPES.NAVIGATION, { action: 'C' });

      expect(entry1.id).not.toBe(entry2.id);
      expect(entry2.id).not.toBe(entry3.id);
      expect(entry1.id).not.toBe(entry3.id);
    });

    it('returns null for empty string eventType', () => {
      const entry = logEvent('', { action: 'test' });
      expect(entry).toBeNull();
    });

    it('returns null for non-string eventType', () => {
      const entry = logEvent(null, { action: 'test' });
      expect(entry).toBeNull();
    });

    it('returns null for undefined eventType', () => {
      const entry = logEvent(undefined, { action: 'test' });
      expect(entry).toBeNull();
    });

    it('returns null for number eventType', () => {
      const entry = logEvent(42, { action: 'test' });
      expect(entry).toBeNull();
    });

    it('handles null details gracefully by defaulting to empty object', () => {
      const entry = logEvent(AUDIT_EVENT_TYPES.ERROR, null);

      expect(entry).not.toBeNull();
      expect(entry.details).toBeDefined();
      expect(typeof entry.details).toBe('object');
    });

    it('handles undefined details gracefully', () => {
      const entry = logEvent(AUDIT_EVENT_TYPES.ERROR);

      expect(entry).not.toBeNull();
      expect(entry.details).toBeDefined();
      expect(typeof entry.details).toBe('object');
    });

    it('handles array details gracefully by defaulting to empty object', () => {
      const entry = logEvent(AUDIT_EVENT_TYPES.ERROR, [1, 2, 3]);

      expect(entry).not.toBeNull();
      expect(entry.details).toBeDefined();
      expect(typeof entry.details).toBe('object');
      expect(Array.isArray(entry.details)).toBe(false);
    });

    it('includes persona from localStorage if available', () => {
      localStorage.setItem(LOCAL_STORAGE_KEYS.SELECTED_PERSONA, JSON.stringify('elena'));

      const entry = logEvent(AUDIT_EVENT_TYPES.QUERY_SUBMIT, { queryText: 'test' });

      expect(entry).not.toBeNull();
      expect(entry.persona).toBe('elena');
    });

    it('sets persona to null when no persona is in localStorage', () => {
      const entry = logEvent(AUDIT_EVENT_TYPES.QUERY_SUBMIT, { queryText: 'test' });

      expect(entry).not.toBeNull();
      expect(entry.persona).toBeNull();
    });

    it('includes screenId from localStorage if available', () => {
      localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_SCREEN, JSON.stringify(5));

      const entry = logEvent(AUDIT_EVENT_TYPES.SCREEN_VIEW, { screenId: 5 });

      expect(entry).not.toBeNull();
      expect(entry.screenId).toBe(5);
    });

    it('sets screenId to null when no screen is in localStorage', () => {
      const entry = logEvent(AUDIT_EVENT_TYPES.SCREEN_VIEW, {});

      expect(entry).not.toBeNull();
      expect(entry.screenId).toBeNull();
    });

    it('handles corrupted persona in localStorage gracefully', () => {
      localStorage.setItem(LOCAL_STORAGE_KEYS.SELECTED_PERSONA, 'not-valid-json{{{');

      const entry = logEvent(AUDIT_EVENT_TYPES.NAVIGATION, { action: 'test' });

      expect(entry).not.toBeNull();
      expect(entry.persona).toBeNull();
    });

    it('handles corrupted screen in localStorage gracefully', () => {
      localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_SCREEN, 'corrupted');

      const entry = logEvent(AUDIT_EVENT_TYPES.NAVIGATION, { action: 'test' });

      expect(entry).not.toBeNull();
      expect(entry.screenId).toBeNull();
    });

    it('handles corrupted audit log in localStorage gracefully', () => {
      localStorage.setItem(LOCAL_STORAGE_KEYS.AUDIT_LOG, 'not-valid-json{{{');

      const entry = logEvent(AUDIT_EVENT_TYPES.NAVIGATION, { action: 'test' });

      // Should still succeed because readAuditLog returns [] on parse error
      expect(entry).not.toBeNull();
      expect(entry.eventType).toBe(AUDIT_EVENT_TYPES.NAVIGATION);
    });

    it('handles non-array audit log in localStorage gracefully', () => {
      localStorage.setItem(LOCAL_STORAGE_KEYS.AUDIT_LOG, JSON.stringify({ not: 'an array' }));

      const entry = logEvent(AUDIT_EVENT_TYPES.NAVIGATION, { action: 'test' });

      expect(entry).not.toBeNull();
    });

    it('does not mutate the details object passed in', () => {
      const details = { action: 'TEST', value: 42 };
      const originalAction = details.action;

      logEvent(AUDIT_EVENT_TYPES.ACTION_EXECUTE, details);

      expect(details.action).toBe(originalAction);
      expect(details.value).toBe(42);
    });

    it('accepts all valid AUDIT_EVENT_TYPES', () => {
      const eventTypes = Object.values(AUDIT_EVENT_TYPES);

      for (const eventType of eventTypes) {
        const entry = logEvent(eventType, { test: true });
        expect(entry).not.toBeNull();
        expect(entry.eventType).toBe(eventType);
      }
    });

    it('accepts custom event type strings', () => {
      const entry = logEvent('CUSTOM_EVENT', { custom: true });

      expect(entry).not.toBeNull();
      expect(entry.eventType).toBe('CUSTOM_EVENT');
    });
  });

  describe('getAuditTrail', () => {
    it('returns an empty array when no events have been logged', () => {
      const trail = getAuditTrail();

      expect(Array.isArray(trail)).toBe(true);
      expect(trail.length).toBe(0);
    });

    it('returns all logged events', () => {
      logEvent(AUDIT_EVENT_TYPES.AUTH_LOGIN, { userId: 'user-1' });
      logEvent(AUDIT_EVENT_TYPES.NAVIGATION, { action: 'NAV' });
      logEvent(AUDIT_EVENT_TYPES.QUERY_SUBMIT, { queryText: 'test' });

      const trail = getAuditTrail();

      expect(trail.length).toBe(3);
    });

    it('returns entries sorted by timestamp in ascending order', () => {
      logEvent(AUDIT_EVENT_TYPES.AUTH_LOGIN, { order: 1 });
      logEvent(AUDIT_EVENT_TYPES.NAVIGATION, { order: 2 });
      logEvent(AUDIT_EVENT_TYPES.QUERY_SUBMIT, { order: 3 });

      const trail = getAuditTrail();

      for (let i = 1; i < trail.length; i++) {
        expect(trail[i].timestamp).toBeGreaterThanOrEqual(trail[i - 1].timestamp);
      }
    });

    it('returns entries with all required fields', () => {
      logEvent(AUDIT_EVENT_TYPES.SCREEN_VIEW, { screenId: 2 });

      const trail = getAuditTrail();
      expect(trail.length).toBe(1);

      const entry = trail[0];
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('timestamp');
      expect(entry).toHaveProperty('isoTimestamp');
      expect(entry).toHaveProperty('eventType');
      expect(entry).toHaveProperty('details');
      expect(entry).toHaveProperty('persona');
      expect(entry).toHaveProperty('screenId');
    });

    it('returns an empty array when localStorage contains corrupted data', () => {
      localStorage.setItem(LOCAL_STORAGE_KEYS.AUDIT_LOG, 'corrupted{{{');

      const trail = getAuditTrail();

      expect(Array.isArray(trail)).toBe(true);
      expect(trail.length).toBe(0);
    });

    it('returns an empty array when localStorage contains non-array data', () => {
      localStorage.setItem(LOCAL_STORAGE_KEYS.AUDIT_LOG, JSON.stringify('just a string'));

      const trail = getAuditTrail();

      expect(Array.isArray(trail)).toBe(true);
      expect(trail.length).toBe(0);
    });
  });

  describe('clearAuditTrail', () => {
    it('removes all audit log entries from localStorage', () => {
      logEvent(AUDIT_EVENT_TYPES.AUTH_LOGIN, { userId: 'user-1' });
      logEvent(AUDIT_EVENT_TYPES.NAVIGATION, { action: 'NAV' });

      expect(getAuditTrailCount()).toBe(2);

      const result = clearAuditTrail();

      expect(result).toBe(true);
      expect(getAuditTrailCount()).toBe(0);
      expect(localStorage.getItem(LOCAL_STORAGE_KEYS.AUDIT_LOG)).toBeNull();
    });

    it('returns true even when no entries exist', () => {
      const result = clearAuditTrail();
      expect(result).toBe(true);
    });

    it('allows new entries to be logged after clearing', () => {
      logEvent(AUDIT_EVENT_TYPES.AUTH_LOGIN, { userId: 'user-1' });
      clearAuditTrail();

      logEvent(AUDIT_EVENT_TYPES.NAVIGATION, { action: 'NEW' });

      const trail = getAuditTrail();
      expect(trail.length).toBe(1);
      expect(trail[0].eventType).toBe(AUDIT_EVENT_TYPES.NAVIGATION);
    });
  });

  describe('getAuditTrailByType', () => {
    it('returns entries matching the specified event type', () => {
      logEvent(AUDIT_EVENT_TYPES.AUTH_LOGIN, { userId: 'user-1' });
      logEvent(AUDIT_EVENT_TYPES.NAVIGATION, { action: 'NAV1' });
      logEvent(AUDIT_EVENT_TYPES.NAVIGATION, { action: 'NAV2' });
      logEvent(AUDIT_EVENT_TYPES.QUERY_SUBMIT, { queryText: 'test' });

      const navEntries = getAuditTrailByType(AUDIT_EVENT_TYPES.NAVIGATION);

      expect(navEntries.length).toBe(2);
      for (const entry of navEntries) {
        expect(entry.eventType).toBe(AUDIT_EVENT_TYPES.NAVIGATION);
      }
    });

    it('returns an empty array when no entries match the type', () => {
      logEvent(AUDIT_EVENT_TYPES.AUTH_LOGIN, { userId: 'user-1' });

      const entries = getAuditTrailByType(AUDIT_EVENT_TYPES.QUERY_ERROR);

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('returns an empty array for empty string type', () => {
      logEvent(AUDIT_EVENT_TYPES.AUTH_LOGIN, { userId: 'user-1' });

      const entries = getAuditTrailByType('');

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('returns an empty array for non-string type', () => {
      logEvent(AUDIT_EVENT_TYPES.AUTH_LOGIN, { userId: 'user-1' });

      const entries = getAuditTrailByType(null);

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('returns an empty array for undefined type', () => {
      const entries = getAuditTrailByType(undefined);

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('returns entries sorted by timestamp in ascending order', () => {
      logEvent(AUDIT_EVENT_TYPES.NAVIGATION, { action: 'NAV1' });
      logEvent(AUDIT_EVENT_TYPES.NAVIGATION, { action: 'NAV2' });
      logEvent(AUDIT_EVENT_TYPES.NAVIGATION, { action: 'NAV3' });

      const entries = getAuditTrailByType(AUDIT_EVENT_TYPES.NAVIGATION);

      for (let i = 1; i < entries.length; i++) {
        expect(entries[i].timestamp).toBeGreaterThanOrEqual(entries[i - 1].timestamp);
      }
    });

    it('filters correctly across all event types', () => {
      logEvent(AUDIT_EVENT_TYPES.AUTH_LOGIN, {});
      logEvent(AUDIT_EVENT_TYPES.AUTH_LOGOUT, {});
      logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {});
      logEvent(AUDIT_EVENT_TYPES.QUERY_SUBMIT, {});
      logEvent(AUDIT_EVENT_TYPES.QUERY_RESULT, {});
      logEvent(AUDIT_EVENT_TYPES.QUERY_ERROR, {});
      logEvent(AUDIT_EVENT_TYPES.ACTION_EXECUTE, {});
      logEvent(AUDIT_EVENT_TYPES.ACTION_SUCCESS, {});
      logEvent(AUDIT_EVENT_TYPES.ACTION_ERROR, {});
      logEvent(AUDIT_EVENT_TYPES.STATE_TRANSITION, {});
      logEvent(AUDIT_EVENT_TYPES.PERSONA_SELECT, {});
      logEvent(AUDIT_EVENT_TYPES.CTA_CLICK, {});
      logEvent(AUDIT_EVENT_TYPES.SCREEN_VIEW, {});
      logEvent(AUDIT_EVENT_TYPES.ERROR, {});

      const eventTypes = Object.values(AUDIT_EVENT_TYPES);
      for (const eventType of eventTypes) {
        const entries = getAuditTrailByType(eventType);
        expect(entries.length).toBe(1);
        expect(entries[0].eventType).toBe(eventType);
      }
    });
  });

  describe('getAuditTrailCount', () => {
    it('returns 0 when no events have been logged', () => {
      expect(getAuditTrailCount()).toBe(0);
    });

    it('returns the correct count after logging events', () => {
      logEvent(AUDIT_EVENT_TYPES.AUTH_LOGIN, {});
      logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {});
      logEvent(AUDIT_EVENT_TYPES.QUERY_SUBMIT, {});

      expect(getAuditTrailCount()).toBe(3);
    });

    it('returns 0 after clearing the audit trail', () => {
      logEvent(AUDIT_EVENT_TYPES.AUTH_LOGIN, {});
      logEvent(AUDIT_EVENT_TYPES.NAVIGATION, {});

      clearAuditTrail();

      expect(getAuditTrailCount()).toBe(0);
    });

    it('returns 0 when localStorage contains corrupted data', () => {
      localStorage.setItem(LOCAL_STORAGE_KEYS.AUDIT_LOG, 'corrupted{{{');

      expect(getAuditTrailCount()).toBe(0);
    });

    it('returns 0 when localStorage contains non-array data', () => {
      localStorage.setItem(LOCAL_STORAGE_KEYS.AUDIT_LOG, JSON.stringify({ not: 'array' }));

      expect(getAuditTrailCount()).toBe(0);
    });
  });

  describe('getAuditTrailByPersona', () => {
    it('returns entries matching the specified persona ID', () => {
      localStorage.setItem(LOCAL_STORAGE_KEYS.SELECTED_PERSONA, JSON.stringify('lukas'));
      logEvent(AUDIT_EVENT_TYPES.NAVIGATION, { action: 'NAV1' });
      logEvent(AUDIT_EVENT_TYPES.QUERY_SUBMIT, { queryText: 'test' });

      localStorage.setItem(LOCAL_STORAGE_KEYS.SELECTED_PERSONA, JSON.stringify('elena'));
      logEvent(AUDIT_EVENT_TYPES.NAVIGATION, { action: 'NAV2' });

      const lukasEntries = getAuditTrailByPersona('lukas');
      expect(lukasEntries.length).toBe(2);
      for (const entry of lukasEntries) {
        expect(entry.persona).toBe('lukas');
      }

      const elenaEntries = getAuditTrailByPersona('elena');
      expect(elenaEntries.length).toBe(1);
      expect(elenaEntries[0].persona).toBe('elena');
    });

    it('returns an empty array when no entries match the persona', () => {
      logEvent(AUDIT_EVENT_TYPES.AUTH_LOGIN, {});

      const entries = getAuditTrailByPersona('nonexistent');

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('returns an empty array for empty string persona', () => {
      const entries = getAuditTrailByPersona('');

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('returns an empty array for non-string persona', () => {
      const entries = getAuditTrailByPersona(null);

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('returns entries sorted by timestamp in ascending order', () => {
      localStorage.setItem(LOCAL_STORAGE_KEYS.SELECTED_PERSONA, JSON.stringify('sophie'));
      logEvent(AUDIT_EVENT_TYPES.NAVIGATION, { order: 1 });
      logEvent(AUDIT_EVENT_TYPES.QUERY_SUBMIT, { order: 2 });
      logEvent(AUDIT_EVENT_TYPES.SCREEN_VIEW, { order: 3 });

      const entries = getAuditTrailByPersona('sophie');

      for (let i = 1; i < entries.length; i++) {
        expect(entries[i].timestamp).toBeGreaterThanOrEqual(entries[i - 1].timestamp);
      }
    });
  });

  describe('getAuditTrailByTimeRange', () => {
    it('returns entries within the specified time range', () => {
      const before = Date.now();
      logEvent(AUDIT_EVENT_TYPES.AUTH_LOGIN, { order: 1 });
      logEvent(AUDIT_EVENT_TYPES.NAVIGATION, { order: 2 });
      const after = Date.now();

      const entries = getAuditTrailByTimeRange(before, after);

      expect(entries.length).toBe(2);
    });

    it('returns an empty array when no entries fall within the range', () => {
      logEvent(AUDIT_EVENT_TYPES.AUTH_LOGIN, {});

      const futureStart = Date.now() + 100000;
      const futureEnd = Date.now() + 200000;

      const entries = getAuditTrailByTimeRange(futureStart, futureEnd);

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('returns an empty array when startTimestamp is greater than endTimestamp', () => {
      logEvent(AUDIT_EVENT_TYPES.AUTH_LOGIN, {});

      const entries = getAuditTrailByTimeRange(Date.now() + 1000, Date.now() - 1000);

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('returns an empty array for non-number startTimestamp', () => {
      const entries = getAuditTrailByTimeRange('not-a-number', Date.now());

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('returns an empty array for non-number endTimestamp', () => {
      const entries = getAuditTrailByTimeRange(Date.now(), null);

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('returns an empty array for NaN timestamps', () => {
      const entries = getAuditTrailByTimeRange(NaN, NaN);

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('returns entries sorted by timestamp in ascending order', () => {
      const start = Date.now();
      logEvent(AUDIT_EVENT_TYPES.NAVIGATION, { order: 1 });
      logEvent(AUDIT_EVENT_TYPES.QUERY_SUBMIT, { order: 2 });
      logEvent(AUDIT_EVENT_TYPES.SCREEN_VIEW, { order: 3 });
      const end = Date.now();

      const entries = getAuditTrailByTimeRange(start, end);

      for (let i = 1; i < entries.length; i++) {
        expect(entries[i].timestamp).toBeGreaterThanOrEqual(entries[i - 1].timestamp);
      }
    });

    it('includes entries at exact boundary timestamps (inclusive)', () => {
      logEvent(AUDIT_EVENT_TYPES.AUTH_LOGIN, {});

      const trail = getAuditTrail();
      expect(trail.length).toBe(1);

      const ts = trail[0].timestamp;
      const entries = getAuditTrailByTimeRange(ts, ts);

      expect(entries.length).toBe(1);
      expect(entries[0].timestamp).toBe(ts);
    });
  });

  describe('exportAuditTrail', () => {
    it('returns a valid JSON string', () => {
      logEvent(AUDIT_EVENT_TYPES.AUTH_LOGIN, { userId: 'user-1' });
      logEvent(AUDIT_EVENT_TYPES.NAVIGATION, { action: 'NAV' });

      const exported = exportAuditTrail();

      expect(typeof exported).toBe('string');

      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(2);
    });

    it('returns "[]" when no events have been logged', () => {
      const exported = exportAuditTrail();

      expect(exported).toBe('[]');
    });

    it('returns entries sorted by timestamp in ascending order', () => {
      logEvent(AUDIT_EVENT_TYPES.AUTH_LOGIN, { order: 1 });
      logEvent(AUDIT_EVENT_TYPES.NAVIGATION, { order: 2 });
      logEvent(AUDIT_EVENT_TYPES.QUERY_SUBMIT, { order: 3 });

      const exported = exportAuditTrail();
      const parsed = JSON.parse(exported);

      for (let i = 1; i < parsed.length; i++) {
        expect(parsed[i].timestamp).toBeGreaterThanOrEqual(parsed[i - 1].timestamp);
      }
    });

    it('returns a pretty-printed JSON string with indentation', () => {
      logEvent(AUDIT_EVENT_TYPES.AUTH_LOGIN, { userId: 'user-1' });

      const exported = exportAuditTrail();

      // Pretty-printed JSON should contain newlines
      expect(exported).toContain('\n');
    });

    it('exported entries contain all required fields', () => {
      logEvent(AUDIT_EVENT_TYPES.SCREEN_VIEW, { screenId: 5 });

      const exported = exportAuditTrail();
      const parsed = JSON.parse(exported);

      expect(parsed.length).toBe(1);
      const entry = parsed[0];
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('timestamp');
      expect(entry).toHaveProperty('isoTimestamp');
      expect(entry).toHaveProperty('eventType');
      expect(entry).toHaveProperty('details');
      expect(entry).toHaveProperty('persona');
      expect(entry).toHaveProperty('screenId');
    });
  });

  describe('AUDIT_EVENT_TYPES', () => {
    it('contains all expected event type constants', () => {
      expect(AUDIT_EVENT_TYPES.AUTH_LOGIN).toBe('AUTH_LOGIN');
      expect(AUDIT_EVENT_TYPES.AUTH_LOGOUT).toBe('AUTH_LOGOUT');
      expect(AUDIT_EVENT_TYPES.AUTH_SESSION_EXPIRED).toBe('AUTH_SESSION_EXPIRED');
      expect(AUDIT_EVENT_TYPES.NAVIGATION).toBe('NAVIGATION');
      expect(AUDIT_EVENT_TYPES.QUERY_SUBMIT).toBe('QUERY_SUBMIT');
      expect(AUDIT_EVENT_TYPES.QUERY_RESULT).toBe('QUERY_RESULT');
      expect(AUDIT_EVENT_TYPES.QUERY_ERROR).toBe('QUERY_ERROR');
      expect(AUDIT_EVENT_TYPES.ACTION_EXECUTE).toBe('ACTION_EXECUTE');
      expect(AUDIT_EVENT_TYPES.ACTION_SUCCESS).toBe('ACTION_SUCCESS');
      expect(AUDIT_EVENT_TYPES.ACTION_ERROR).toBe('ACTION_ERROR');
      expect(AUDIT_EVENT_TYPES.STATE_TRANSITION).toBe('STATE_TRANSITION');
      expect(AUDIT_EVENT_TYPES.PERSONA_SELECT).toBe('PERSONA_SELECT');
      expect(AUDIT_EVENT_TYPES.CTA_CLICK).toBe('CTA_CLICK');
      expect(AUDIT_EVENT_TYPES.SCREEN_VIEW).toBe('SCREEN_VIEW');
      expect(AUDIT_EVENT_TYPES.ERROR).toBe('ERROR');
    });

    it('is frozen and cannot be modified', () => {
      expect(Object.isFrozen(AUDIT_EVENT_TYPES)).toBe(true);
    });

    it('contains at least 15 event types', () => {
      const keys = Object.keys(AUDIT_EVENT_TYPES);
      expect(keys.length).toBeGreaterThanOrEqual(15);
    });
  });

  describe('pruning behavior', () => {
    it('prunes entries when exceeding the maximum limit', () => {
      // The max is 1000 entries. Log 1005 entries and verify pruning.
      for (let i = 0; i < 1005; i++) {
        logEvent(AUDIT_EVENT_TYPES.NAVIGATION, { index: i });
      }

      const count = getAuditTrailCount();
      expect(count).toBeLessThanOrEqual(1000);
      expect(count).toBeGreaterThan(0);
    });

    it('retains the most recent entries after pruning', () => {
      for (let i = 0; i < 1005; i++) {
        logEvent(AUDIT_EVENT_TYPES.NAVIGATION, { index: i });
      }

      const trail = getAuditTrail();
      const lastEntry = trail[trail.length - 1];

      expect(lastEntry.details.index).toBe(1004);
    });
  });

  describe('timestamp accuracy', () => {
    it('timestamps are within a reasonable range of Date.now()', () => {
      const before = Date.now();
      const entry = logEvent(AUDIT_EVENT_TYPES.NAVIGATION, { action: 'test' });
      const after = Date.now();

      expect(entry).not.toBeNull();
      expect(entry.timestamp).toBeGreaterThanOrEqual(before);
      expect(entry.timestamp).toBeLessThanOrEqual(after);
    });

    it('isoTimestamp matches the timestamp value', () => {
      const entry = logEvent(AUDIT_EVENT_TYPES.NAVIGATION, { action: 'test' });

      expect(entry).not.toBeNull();

      const fromIso = new Date(entry.isoTimestamp).getTime();
      expect(fromIso).toBe(entry.timestamp);
    });

    it('sequential entries have non-decreasing timestamps', () => {
      const entries = [];
      for (let i = 0; i < 10; i++) {
        const entry = logEvent(AUDIT_EVENT_TYPES.NAVIGATION, { index: i });
        entries.push(entry);
      }

      for (let i = 1; i < entries.length; i++) {
        expect(entries[i].timestamp).toBeGreaterThanOrEqual(entries[i - 1].timestamp);
      }
    });
  });

  describe('end-to-end flow', () => {
    it('log, retrieve, filter, export, and clear cycle works correctly', () => {
      // Log events with different personas
      localStorage.setItem(LOCAL_STORAGE_KEYS.SELECTED_PERSONA, JSON.stringify('lukas'));
      logEvent(AUDIT_EVENT_TYPES.AUTH_LOGIN, { userId: 'user-lukas' });
      logEvent(AUDIT_EVENT_TYPES.NAVIGATION, { action: 'DASHBOARD' });

      localStorage.setItem(LOCAL_STORAGE_KEYS.SELECTED_PERSONA, JSON.stringify('sophie'));
      logEvent(AUDIT_EVENT_TYPES.QUERY_SUBMIT, { queryText: 'cash flow' });
      logEvent(AUDIT_EVENT_TYPES.QUERY_RESULT, { totalResults: 3 });

      // Verify total count
      expect(getAuditTrailCount()).toBe(4);

      // Verify retrieval
      const trail = getAuditTrail();
      expect(trail.length).toBe(4);

      // Verify filtering by type
      const navEntries = getAuditTrailByType(AUDIT_EVENT_TYPES.NAVIGATION);
      expect(navEntries.length).toBe(1);
      expect(navEntries[0].details.action).toBe('DASHBOARD');

      // Verify filtering by persona
      const lukasEntries = getAuditTrailByPersona('lukas');
      expect(lukasEntries.length).toBe(2);

      const sophieEntries = getAuditTrailByPersona('sophie');
      expect(sophieEntries.length).toBe(2);

      // Verify export
      const exported = exportAuditTrail();
      const parsed = JSON.parse(exported);
      expect(parsed.length).toBe(4);

      // Verify clear
      clearAuditTrail();
      expect(getAuditTrailCount()).toBe(0);
      expect(getAuditTrail().length).toBe(0);
    });

    it('multiple log-clear cycles work correctly', () => {
      logEvent(AUDIT_EVENT_TYPES.AUTH_LOGIN, { cycle: 1 });
      expect(getAuditTrailCount()).toBe(1);

      clearAuditTrail();
      expect(getAuditTrailCount()).toBe(0);

      logEvent(AUDIT_EVENT_TYPES.NAVIGATION, { cycle: 2 });
      logEvent(AUDIT_EVENT_TYPES.QUERY_SUBMIT, { cycle: 2 });
      expect(getAuditTrailCount()).toBe(2);

      clearAuditTrail();
      expect(getAuditTrailCount()).toBe(0);

      logEvent(AUDIT_EVENT_TYPES.SCREEN_VIEW, { cycle: 3 });
      expect(getAuditTrailCount()).toBe(1);

      const trail = getAuditTrail();
      expect(trail[0].details.cycle).toBe(3);
    });
  });

  describe('defensive checks for corrupted localStorage', () => {
    it('getAuditTrail handles empty string in localStorage', () => {
      localStorage.setItem(LOCAL_STORAGE_KEYS.AUDIT_LOG, '');

      const trail = getAuditTrail();
      expect(Array.isArray(trail)).toBe(true);
      expect(trail.length).toBe(0);
    });

    it('getAuditTrailByType handles corrupted localStorage', () => {
      localStorage.setItem(LOCAL_STORAGE_KEYS.AUDIT_LOG, 'corrupted');

      const entries = getAuditTrailByType(AUDIT_EVENT_TYPES.NAVIGATION);
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('getAuditTrailCount handles corrupted localStorage', () => {
      localStorage.setItem(LOCAL_STORAGE_KEYS.AUDIT_LOG, '{invalid}');

      expect(getAuditTrailCount()).toBe(0);
    });

    it('getAuditTrailByPersona handles corrupted localStorage', () => {
      localStorage.setItem(LOCAL_STORAGE_KEYS.AUDIT_LOG, 'bad-data');

      const entries = getAuditTrailByPersona('lukas');
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('getAuditTrailByTimeRange handles corrupted localStorage', () => {
      localStorage.setItem(LOCAL_STORAGE_KEYS.AUDIT_LOG, '{{{{');

      const entries = getAuditTrailByTimeRange(0, Date.now());
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('exportAuditTrail handles corrupted localStorage', () => {
      localStorage.setItem(LOCAL_STORAGE_KEYS.AUDIT_LOG, 'not-json');

      const exported = exportAuditTrail();
      expect(exported).toBe('[]');
    });

    it('clearAuditTrail works even with corrupted localStorage', () => {
      localStorage.setItem(LOCAL_STORAGE_KEYS.AUDIT_LOG, 'corrupted');

      const result = clearAuditTrail();
      expect(result).toBe(true);
      expect(localStorage.getItem(LOCAL_STORAGE_KEYS.AUDIT_LOG)).toBeNull();
    });
  });
});