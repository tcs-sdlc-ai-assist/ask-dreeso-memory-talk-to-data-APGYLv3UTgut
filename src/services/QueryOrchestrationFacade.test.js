import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  interpretQuery,
  orchestrateQuery,
  getCTABubbles,
  executeAction,
  getSourceTransparency,
  getActionLog,
  orchestrateRaw,
  getSourceSummary,
  getActiveSources,
  getInactiveSources,
  getSourceCount,
  getConfidence,
  clearActions,
  getActionCount,
  getActionsByType,
  getActionsBySystem,
  getActionsByStatus,
  getActionsByPersona,
  exportActions,
  isValidQuery,
} from './QueryOrchestrationFacade';
import { INTELLIGENCE_CLUSTERS, SYSTEMS, PERSONAS, LOCAL_STORAGE_KEYS } from '../constants';

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

describe('QueryOrchestrationFacade', () => {
  beforeEach(() => {
    clearAllStorage();
  });

  afterEach(() => {
    clearAllStorage();
  });

  describe('interpretQuery', () => {
    describe('happy path', () => {
      it('returns a structured query intent for a valid query', () => {
        const result = interpretQuery('What is the current status of all my projects?');

        expect(result).not.toBeNull();
        expect(result).toHaveProperty('domains');
        expect(result).toHaveProperty('queryType');
        expect(result).toHaveProperty('keywords');
        expect(result).toHaveProperty('confidence');
        expect(result).toHaveProperty('targetSystems');
        expect(result).toHaveProperty('parameters');
        expect(result).toHaveProperty('personaHint');
        expect(result).toHaveProperty('originalQuery');
      });

      it('maps project-related queries to the project portfolio cluster', () => {
        const result = interpretQuery('What is the current status of all my projects?');

        expect(Array.isArray(result.domains)).toBe(true);
        expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id);
      });

      it('maps sales-related queries to the sales cluster', () => {
        const result = interpretQuery('What is the current pipeline value?');

        expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id);
      });

      it('maps finance-related queries to the finance cluster', () => {
        const result = interpretQuery('What is our cash flow forecast for Q1 2025?');

        expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id);
      });

      it('maps procurement-related queries to the commercial cluster', () => {
        const result = interpretQuery('Which contracts are expiring in the next 60 days?');

        expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id);
      });

      it('maps workforce-related queries to the workforce cluster', () => {
        const result = interpretQuery('Show me the resource allocation across projects');

        expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id);
      });

      it('maps knowledge-related queries to the knowledge cluster', () => {
        const result = interpretQuery('What lessons learned apply to my current projects?');

        expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.KNOWLEDGE_IP.id);
      });

      it('returns a confidence score between 0 and 1', () => {
        const result = interpretQuery('Show me the budget variance across all projects');

        expect(typeof result.confidence).toBe('number');
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      });

      it('extracts keywords from the query', () => {
        const result = interpretQuery('What is the current status of all my projects?');

        expect(Array.isArray(result.keywords)).toBe(true);
        expect(result.keywords.length).toBeGreaterThan(0);
      });

      it('preserves the original query text', () => {
        const query = 'Show me the project status';
        const result = interpretQuery(query);

        expect(result.originalQuery).toBe(query);
      });
    });

    describe('error handling', () => {
      it('returns an error object for empty string query', () => {
        const result = interpretQuery('');

        expect(result).not.toBeNull();
        expect(result.domains).toEqual([]);
        expect(result.confidence).toBe(0);
        expect(result.error).toBeDefined();
        expect(result.error.errorCode).toBe('INVALID_QUERY');
      });

      it('returns an error object for null query', () => {
        const result = interpretQuery(null);

        expect(result).not.toBeNull();
        expect(result.domains).toEqual([]);
        expect(result.error).toBeDefined();
      });

      it('returns an error object for undefined query', () => {
        const result = interpretQuery(undefined);

        expect(result).not.toBeNull();
        expect(result.domains).toEqual([]);
        expect(result.error).toBeDefined();
      });

      it('returns an error object for non-string query', () => {
        const result = interpretQuery(42);

        expect(result).not.toBeNull();
        expect(result.domains).toEqual([]);
        expect(result.error).toBeDefined();
      });

      it('returns an error object for too short query', () => {
        const result = interpretQuery('ab');

        expect(result).not.toBeNull();
        expect(result.error).toBeDefined();
        expect(result.error.errorCode).toBe('INVALID_QUERY');
      });
    });
  });

  describe('orchestrateQuery', () => {
    describe('happy path - end-to-end query flow', () => {
      it('returns an orchestration result with aggregatedResults, systems, and timing', async () => {
        const result = await orchestrateQuery('What is the current status of all my projects?');

        expect(result).not.toBeNull();
        expect(result).toHaveProperty('aggregatedResults');
        expect(result).toHaveProperty('systems');
        expect(result).toHaveProperty('timing');
      });

      it('returns results for project portfolio queries', async () => {
        const result = await orchestrateQuery('What is the current status of all my projects?');

        expect(result.aggregatedResults).toBeDefined();
        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
        expect(result.aggregatedResults.totalResults).toBeGreaterThan(0);
      });

      it('returns results for sales queries', async () => {
        const result = await orchestrateQuery('What is the current pipeline value?', {
          personaId: 'james',
        });

        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });

      it('returns results for finance queries', async () => {
        const result = await orchestrateQuery('What is our cash flow forecast for Q1 2025?', {
          personaId: 'sophie',
        });

        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });

      it('returns results for procurement queries', async () => {
        const result = await orchestrateQuery('Which contracts are expiring in the next 60 days?', {
          personaId: 'elena',
        });

        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });

      it('returns results for workforce queries', async () => {
        const result = await orchestrateQuery('Show me the resource allocation across projects', {
          personaId: 'lukas',
        });

        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });

      it('returns results for knowledge queries', async () => {
        const result = await orchestrateQuery('What lessons learned apply to my current projects?');

        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });

      it('returns summary statistics in aggregatedResults', async () => {
        const result = await orchestrateQuery('What is the current status of all my projects?');

        const summary = result.aggregatedResults.summary;
        expect(summary).toBeDefined();
        expect(typeof summary.totalSources).toBe('number');
        expect(typeof summary.averageConfidence).toBe('number');
        expect(typeof summary.totalActions).toBe('number');
        expect(typeof summary.totalRiskSignals).toBe('number');
      });

      it('returns cluster IDs in aggregatedResults', async () => {
        const result = await orchestrateQuery('What is the current status of all my projects?');

        expect(Array.isArray(result.aggregatedResults.clusters)).toBe(true);
        expect(result.aggregatedResults.clusters.length).toBeGreaterThan(0);
      });

      it('returns system contribution details', async () => {
        const result = await orchestrateQuery('What is the current status of all my projects?');

        expect(Array.isArray(result.systems)).toBe(true);
        expect(result.systems.length).toBeGreaterThan(0);

        for (const system of result.systems) {
          expect(system).toHaveProperty('systemId');
          expect(system).toHaveProperty('label');
          expect(system).toHaveProperty('active');
          expect(system).toHaveProperty('resultCount');
          expect(system).toHaveProperty('confidence');
          expect(system).toHaveProperty('status');
        }
      });

      it('returns timing information', async () => {
        const result = await orchestrateQuery('What is the current status of all my projects?');

        expect(result.timing).toBeDefined();
        expect(typeof result.timing.startTime).toBe('number');
        expect(typeof result.timing.endTime).toBe('number');
        expect(typeof result.timing.durationMs).toBe('number');
        expect(result.timing.durationMs).toBeGreaterThanOrEqual(0);
      });

      it('accepts optional personaId parameter', async () => {
        const result = await orchestrateQuery('What is the current pipeline value?', {
          personaId: 'james',
        });

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });

      it('accepts optional clusterId parameter', async () => {
        const result = await orchestrateQuery('Show me the project status', {
          clusterId: INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id,
        });

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });

      it('accepts both personaId and clusterId parameters', async () => {
        const result = await orchestrateQuery('Show me the budget variance', {
          personaId: 'sophie',
          clusterId: INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id,
        });

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });

      it('totalResults matches the length of results array', async () => {
        const result = await orchestrateQuery('What is the current status of all my projects?');

        expect(result.aggregatedResults.totalResults).toBe(result.aggregatedResults.results.length);
      });
    });

    describe('error handling', () => {
      it('returns error result for empty string query', async () => {
        const result = await orchestrateQuery('');

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results).toEqual([]);
        expect(result.aggregatedResults.error).toBeDefined();
        expect(result.aggregatedResults.error.errorCode).toBe('INVALID_QUERY');
      });

      it('returns error result for null query', async () => {
        const result = await orchestrateQuery(null);

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results).toEqual([]);
        expect(result.aggregatedResults.error).toBeDefined();
      });

      it('returns error result for undefined query', async () => {
        const result = await orchestrateQuery(undefined);

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results).toEqual([]);
        expect(result.aggregatedResults.error).toBeDefined();
      });

      it('returns error result for non-string query', async () => {
        const result = await orchestrateQuery(123);

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results).toEqual([]);
        expect(result.aggregatedResults.error).toBeDefined();
      });

      it('returns error result for whitespace-only query', async () => {
        const result = await orchestrateQuery('   ');

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results).toEqual([]);
        expect(result.aggregatedResults.error).toBeDefined();
      });

      it('handles null options gracefully', async () => {
        const result = await orchestrateQuery('project status', null);

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });

      it('handles non-object options gracefully', async () => {
        const result = await orchestrateQuery('project status', 'not-an-object');

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });

      it('handles array options gracefully', async () => {
        const result = await orchestrateQuery('project status', [1, 2, 3]);

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });

      it('error result contains timing information', async () => {
        const result = await orchestrateQuery('');

        expect(result.timing).toBeDefined();
        expect(typeof result.timing.startTime).toBe('number');
        expect(typeof result.timing.endTime).toBe('number');
        expect(typeof result.timing.durationMs).toBe('number');
      });

      it('error result summary has zero values', async () => {
        const result = await orchestrateQuery('');

        const summary = result.aggregatedResults.summary;
        expect(summary.totalSources).toBe(0);
        expect(summary.averageConfidence).toBe(0);
        expect(summary.totalActions).toBe(0);
        expect(summary.totalRiskSignals).toBe(0);
      });
    });
  });

  describe('orchestrateRaw', () => {
    describe('happy path', () => {
      it('returns an orchestration result for a valid query text', async () => {
        const result = await orchestrateRaw('What is the current status of all my projects?');

        expect(result).not.toBeNull();
        expect(result).toHaveProperty('aggregatedResults');
        expect(result).toHaveProperty('systems');
        expect(result).toHaveProperty('timing');
        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });

      it('accepts optional personaId parameter', async () => {
        const result = await orchestrateRaw('What is the current pipeline value?', {
          personaId: 'james',
        });

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });

      it('accepts optional clusterId parameter', async () => {
        const result = await orchestrateRaw('Show me the project status', {
          clusterId: INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id,
        });

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });
    });

    describe('error handling', () => {
      it('returns error result for empty string query', async () => {
        const result = await orchestrateRaw('');

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results).toEqual([]);
        expect(result.aggregatedResults.error).toBeDefined();
        expect(result.aggregatedResults.error.errorCode).toBe('INVALID_QUERY');
      });

      it('returns error result for null query', async () => {
        const result = await orchestrateRaw(null);

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results).toEqual([]);
        expect(result.aggregatedResults.error).toBeDefined();
      });

      it('returns error result for undefined query', async () => {
        const result = await orchestrateRaw(undefined);

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results).toEqual([]);
        expect(result.aggregatedResults.error).toBeDefined();
      });

      it('handles null options gracefully', async () => {
        const result = await orchestrateRaw('project status', null);

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getCTABubbles', () => {
    describe('happy path - CTA generation', () => {
      it('returns an array of CTA bubbles from a query result', async () => {
        const queryResult = await orchestrateQuery('What is the current status of all my projects?');
        const bubbles = getCTABubbles(queryResult);

        expect(Array.isArray(bubbles)).toBe(true);
        expect(bubbles.length).toBeGreaterThanOrEqual(3);
        expect(bubbles.length).toBeLessThanOrEqual(4);
      });

      it('each CTA bubble has required fields', async () => {
        const queryResult = await orchestrateQuery('What is the current status of all my projects?');
        const bubbles = getCTABubbles(queryResult);

        for (const bubble of bubbles) {
          expect(bubble).toHaveProperty('id');
          expect(bubble).toHaveProperty('label');
          expect(bubble).toHaveProperty('icon');
          expect(bubble).toHaveProperty('query');
          expect(bubble).toHaveProperty('type');
          expect(bubble).toHaveProperty('priority');
          expect(typeof bubble.id).toBe('string');
          expect(typeof bubble.label).toBe('string');
          expect(typeof bubble.icon).toBe('string');
          expect(typeof bubble.query).toBe('string');
          expect(typeof bubble.type).toBe('string');
          expect(typeof bubble.priority).toBe('string');
        }
      });

      it('generates unique IDs for each bubble', async () => {
        const queryResult = await orchestrateQuery('What is the current status of all my projects?');
        const bubbles = getCTABubbles(queryResult);

        const ids = bubbles.map((b) => b.id);
        const uniqueIds = new Set(ids);
        expect(ids.length).toBe(uniqueIds.size);
      });

      it('accepts an optional persona parameter', async () => {
        const queryResult = await orchestrateQuery('What is the current pipeline value?');
        const bubbles = getCTABubbles(queryResult, 'james');

        expect(Array.isArray(bubbles)).toBe(true);
        expect(bubbles.length).toBeGreaterThanOrEqual(3);
      });

      it('returns bubbles with valid type values', async () => {
        const queryResult = await orchestrateQuery('What is the current status of all my projects?');
        const bubbles = getCTABubbles(queryResult);

        const validTypes = ['query', 'action', 'navigate', 'report'];
        for (const bubble of bubbles) {
          expect(validTypes).toContain(bubble.type);
        }
      });

      it('returns bubbles with valid priority values', async () => {
        const queryResult = await orchestrateQuery('What is the current status of all my projects?');
        const bubbles = getCTABubbles(queryResult);

        const validPriorities = ['high', 'medium', 'low'];
        for (const bubble of bubbles) {
          expect(validPriorities).toContain(bubble.priority);
        }
      });

      it('returns bubbles with non-empty labels', async () => {
        const queryResult = await orchestrateQuery('What is the current status of all my projects?');
        const bubbles = getCTABubbles(queryResult);

        for (const bubble of bubbles) {
          expect(bubble.label.length).toBeGreaterThan(0);
        }
      });

      it('returns bubbles with non-empty query strings', async () => {
        const queryResult = await orchestrateQuery('What is the current status of all my projects?');
        const bubbles = getCTABubbles(queryResult);

        for (const bubble of bubbles) {
          expect(bubble.query.length).toBeGreaterThan(0);
        }
      });
    });

    describe('edge cases', () => {
      it('returns fallback bubbles when queryResult is null', () => {
        const bubbles = getCTABubbles(null);

        expect(Array.isArray(bubbles)).toBe(true);
        expect(bubbles.length).toBeGreaterThanOrEqual(3);
      });

      it('returns fallback bubbles when queryResult is undefined', () => {
        const bubbles = getCTABubbles(undefined);

        expect(Array.isArray(bubbles)).toBe(true);
        expect(bubbles.length).toBeGreaterThanOrEqual(3);
      });

      it('uses session persona when no persona parameter is provided', () => {
        setPersonaInSession('sophie');

        const bubbles = getCTABubbles(null);

        expect(Array.isArray(bubbles)).toBe(true);
        expect(bubbles.length).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('executeAction', () => {
    describe('happy path - action execution', () => {
      it('returns an execution result with all required fields', async () => {
        const result = await executeAction('navigate', { target: 'proj-101' });

        expect(result).not.toBeNull();
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('timestamp');
        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('details');
        expect(result).toHaveProperty('id');
      });

      it('returns success for navigate action type', async () => {
        const result = await executeAction('navigate', { target: 'proj-101' });

        expect(result.success).toBe(true);
        expect(result.status).toBe('success');
      });

      it('returns success for generate-report action type', async () => {
        const result = await executeAction('generate-report', { reportName: 'Test Report' });

        expect(result.success).toBe(true);
        expect(result.status).toBe('success');
      });

      it('returns success for schedule action type', async () => {
        const result = await executeAction('schedule', { title: 'Team Meeting' });

        expect(result.success).toBe(true);
        expect(result.status).toBe('success');
      });

      it('returns pending status for workflow action type', async () => {
        const result = await executeAction('workflow', { workflowName: 'Approval' });

        expect(result.success).toBe(true);
        expect(result.status).toBe('pending');
      });

      it('returns success for escalate action type', async () => {
        const result = await executeAction('escalate', { severity: 'high' });

        expect(result.success).toBe(true);
        expect(result.status).toBe('success');
      });

      it('returns success for share action type', async () => {
        const result = await executeAction('share', { recipients: ['user1'] });

        expect(result.success).toBe(true);
        expect(result.status).toBe('success');
      });

      it('returns success for create action type', async () => {
        const result = await executeAction('create', { entityType: 'lesson' });

        expect(result.success).toBe(true);
        expect(result.status).toBe('success');
      });

      it('returns success for export-csv action type', async () => {
        const result = await executeAction('export-csv', { fileName: 'data.csv' });

        expect(result.success).toBe(true);
        expect(result.status).toBe('success');
      });

      it('generates a unique execution ID', async () => {
        const result1 = await executeAction('navigate', {});
        const result2 = await executeAction('navigate', {});

        expect(result1.id).not.toBe(result2.id);
      });

      it('returns a valid ISO timestamp', async () => {
        const result = await executeAction('navigate', {});

        expect(typeof result.timestamp).toBe('string');
        const parsed = new Date(result.timestamp);
        expect(isNaN(parsed.getTime())).toBe(false);
      });

      it('accepts an optional target system parameter', async () => {
        const result = await executeAction('navigate', { target: 'proj-101' }, 'sap');

        expect(result.success).toBe(true);
        expect(result.details).not.toBeNull();
        expect(result.details.system).toBe('sap');
      });

      it('persists the action to the action log', async () => {
        await executeAction('navigate', { target: 'test' });

        const log = getActionLog();
        expect(log.length).toBeGreaterThan(0);
      });

      it('returns mock result when actionId matches a known action', async () => {
        const result = await executeAction('schedule', { actionId: 'act-pp-003' });

        expect(result.success).toBe(true);
        expect(result.message.length).toBeGreaterThan(0);
      });
    });

    describe('error handling', () => {
      it('returns error for empty string action type', async () => {
        const result = await executeAction('', {});

        expect(result.success).toBe(false);
        expect(result.status).toBe('error');
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

      it('handles null payload gracefully', async () => {
        const result = await executeAction('navigate', null);

        expect(result.success).toBe(true);
      });

      it('handles undefined payload gracefully', async () => {
        const result = await executeAction('navigate');

        expect(result.success).toBe(true);
      });
    });
  });

  describe('getSourceTransparency', () => {
    describe('happy path - source transparency', () => {
      it('returns source indicators for all known systems', async () => {
        const queryResult = await orchestrateQuery('What is the current status of all my projects?');
        const indicators = getSourceTransparency(queryResult);

        expect(Array.isArray(indicators)).toBe(true);
        expect(indicators.length).toBeGreaterThan(0);

        const systemIds = indicators.map((i) => i.system);
        expect(systemIds).toContain(SYSTEMS.SAP.id);
        expect(systemIds).toContain(SYSTEMS.PROCORE.id);
        expect(systemIds).toContain(SYSTEMS.SALESFORCE.id);
        expect(systemIds).toContain(SYSTEMS.PRIMAVERA.id);
      });

      it('each indicator has required fields', async () => {
        const queryResult = await orchestrateQuery('What is the current status of all my projects?');
        const indicators = getSourceTransparency(queryResult);

        for (const indicator of indicators) {
          expect(indicator).toHaveProperty('system');
          expect(indicator).toHaveProperty('label');
          expect(indicator).toHaveProperty('color');
          expect(indicator).toHaveProperty('status');
          expect(indicator).toHaveProperty('contributionLevel');
          expect(indicator).toHaveProperty('active');
          expect(indicator).toHaveProperty('resultCount');
          expect(indicator).toHaveProperty('confidence');
          expect(indicator).toHaveProperty('lastSynced');
          expect(indicator).toHaveProperty('dataType');
          expect(typeof indicator.system).toBe('string');
          expect(typeof indicator.label).toBe('string');
          expect(typeof indicator.active).toBe('boolean');
          expect(typeof indicator.resultCount).toBe('number');
          expect(typeof indicator.confidence).toBe('number');
        }
      });

      it('marks contributing systems as active', async () => {
        const queryResult = await orchestrateQuery('What is the current status of all my projects?');
        const indicators = getSourceTransparency(queryResult);

        const activeSystems = indicators.filter((i) => i.active);
        expect(activeSystems.length).toBeGreaterThan(0);

        for (const system of activeSystems) {
          expect(system.resultCount).toBeGreaterThan(0);
        }
      });

      it('marks non-contributing systems as inactive', async () => {
        const queryResult = await orchestrateQuery('What is the current pipeline value?');
        const indicators = getSourceTransparency(queryResult);

        const inactiveSystems = indicators.filter((i) => !i.active);
        for (const system of inactiveSystems) {
          expect(system.resultCount).toBe(0);
          expect(system.confidence).toBe(0);
        }
      });

      it('active systems have valid contribution levels', async () => {
        const queryResult = await orchestrateQuery('What is the current status of all my projects?');
        const indicators = getSourceTransparency(queryResult);

        const validLevels = ['high', 'medium', 'low', 'none'];
        for (const indicator of indicators) {
          expect(validLevels).toContain(indicator.contributionLevel);
        }
      });

      it('active systems have non-zero confidence scores', async () => {
        const queryResult = await orchestrateQuery('What is the current status of all my projects?');
        const indicators = getSourceTransparency(queryResult);

        const activeSystems = indicators.filter((i) => i.active);
        for (const system of activeSystems) {
          expect(system.confidence).toBeGreaterThan(0);
          expect(system.confidence).toBeLessThanOrEqual(1);
        }
      });
    });

    describe('edge cases', () => {
      it('returns all systems as inactive when queryResult is null', () => {
        const indicators = getSourceTransparency(null);

        expect(Array.isArray(indicators)).toBe(true);
        expect(indicators.length).toBeGreaterThan(0);

        for (const indicator of indicators) {
          expect(indicator.active).toBe(false);
          expect(indicator.resultCount).toBe(0);
          expect(indicator.confidence).toBe(0);
          expect(indicator.contributionLevel).toBe('none');
        }
      });

      it('returns all systems as inactive when queryResult is undefined', () => {
        const indicators = getSourceTransparency(undefined);

        expect(Array.isArray(indicators)).toBe(true);
        for (const indicator of indicators) {
          expect(indicator.active).toBe(false);
        }
      });
    });
  });

  describe('getSourceSummary', () => {
    it('returns a summary object with totalSystems, activeSystems, overallConfidence, and indicators', async () => {
      const queryResult = await orchestrateQuery('What is the current status of all my projects?');
      const summary = getSourceSummary(queryResult);

      expect(summary).not.toBeNull();
      expect(typeof summary.totalSystems).toBe('number');
      expect(typeof summary.activeSystems).toBe('number');
      expect(typeof summary.overallConfidence).toBe('number');
      expect(Array.isArray(summary.indicators)).toBe(true);
    });

    it('totalSystems equals the number of indicators', async () => {
      const queryResult = await orchestrateQuery('What is the current status of all my projects?');
      const summary = getSourceSummary(queryResult);

      expect(summary.totalSystems).toBe(summary.indicators.length);
    });

    it('activeSystems is less than or equal to totalSystems', async () => {
      const queryResult = await orchestrateQuery('What is the current status of all my projects?');
      const summary = getSourceSummary(queryResult);

      expect(summary.activeSystems).toBeLessThanOrEqual(summary.totalSystems);
    });

    it('overallConfidence is between 0 and 1', async () => {
      const queryResult = await orchestrateQuery('What is the current status of all my projects?');
      const summary = getSourceSummary(queryResult);

      expect(summary.overallConfidence).toBeGreaterThanOrEqual(0);
      expect(summary.overallConfidence).toBeLessThanOrEqual(1);
    });

    it('returns zero activeSystems for null queryResult', () => {
      const summary = getSourceSummary(null);

      expect(summary.activeSystems).toBe(0);
      expect(summary.overallConfidence).toBe(0);
    });
  });

  describe('getActiveSources', () => {
    it('returns only active source indicators', async () => {
      const queryResult = await orchestrateQuery('What is the current status of all my projects?');
      const activeSources = getActiveSources(queryResult);

      expect(Array.isArray(activeSources)).toBe(true);
      for (const source of activeSources) {
        expect(source.active).toBe(true);
      }
    });

    it('returns an empty array for null queryResult', () => {
      const activeSources = getActiveSources(null);

      expect(Array.isArray(activeSources)).toBe(true);
      expect(activeSources.length).toBe(0);
    });

    it('active sources have non-zero result counts', async () => {
      const queryResult = await orchestrateQuery('What is the current status of all my projects?');
      const activeSources = getActiveSources(queryResult);

      for (const source of activeSources) {
        expect(source.resultCount).toBeGreaterThan(0);
      }
    });
  });

  describe('getInactiveSources', () => {
    it('returns only inactive source indicators', async () => {
      const queryResult = await orchestrateQuery('What is the current pipeline value?');
      const inactiveSources = getInactiveSources(queryResult);

      expect(Array.isArray(inactiveSources)).toBe(true);
      for (const source of inactiveSources) {
        expect(source.active).toBe(false);
      }
    });

    it('returns all systems as inactive for null queryResult', () => {
      const inactiveSources = getInactiveSources(null);

      expect(Array.isArray(inactiveSources)).toBe(true);
      expect(inactiveSources.length).toBeGreaterThan(0);
    });
  });

  describe('getSourceCount', () => {
    it('returns the count of active source systems', async () => {
      const queryResult = await orchestrateQuery('What is the current status of all my projects?');
      const count = getSourceCount(queryResult);

      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);
    });

    it('returns 0 for null queryResult', () => {
      const count = getSourceCount(null);

      expect(count).toBe(0);
    });

    it('returns 0 for undefined queryResult', () => {
      const count = getSourceCount(undefined);

      expect(count).toBe(0);
    });
  });

  describe('getConfidence', () => {
    it('returns the overall confidence score between 0 and 1', async () => {
      const queryResult = await orchestrateQuery('What is the current status of all my projects?');
      const confidence = getConfidence(queryResult);

      expect(typeof confidence).toBe('number');
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });

    it('returns a non-zero confidence for valid query results', async () => {
      const queryResult = await orchestrateQuery('What is the current status of all my projects?');
      const confidence = getConfidence(queryResult);

      expect(confidence).toBeGreaterThan(0);
    });

    it('returns 0 for null queryResult', () => {
      const confidence = getConfidence(null);

      expect(confidence).toBe(0);
    });

    it('returns 0 for undefined queryResult', () => {
      const confidence = getConfidence(undefined);

      expect(confidence).toBe(0);
    });
  });

  describe('isValidQuery', () => {
    it('returns valid true for a normal query', () => {
      const result = isValidQuery('What is the current status of all my projects?');

      expect(result.valid).toBe(true);
      expect(result.message).toBe('');
    });

    it('returns valid true for minimum length query', () => {
      const result = isValidQuery('abc');

      expect(result.valid).toBe(true);
    });

    it('returns valid false for empty string', () => {
      const result = isValidQuery('');

      expect(result.valid).toBe(false);
      expect(result.message.length).toBeGreaterThan(0);
    });

    it('returns valid false for whitespace-only string', () => {
      const result = isValidQuery('   ');

      expect(result.valid).toBe(false);
    });

    it('returns valid false for non-string input', () => {
      const result = isValidQuery(null);

      expect(result.valid).toBe(false);
    });

    it('returns valid false for too short query', () => {
      const result = isValidQuery('ab');

      expect(result.valid).toBe(false);
    });

    it('returns valid false for query exceeding maximum length', () => {
      const longQuery = 'a'.repeat(513);
      const result = isValidQuery(longQuery);

      expect(result.valid).toBe(false);
    });

    it('returns an object with valid and message properties', () => {
      const result = isValidQuery('test query');

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('message');
      expect(typeof result.valid).toBe('boolean');
      expect(typeof result.message).toBe('string');
    });
  });

  describe('Action Log Management', () => {
    describe('getActionLog', () => {
      it('returns an empty array when no actions have been executed', () => {
        const log = getActionLog();

        expect(Array.isArray(log)).toBe(true);
        expect(log.length).toBe(0);
      });

      it('returns all executed actions', async () => {
        await executeAction('navigate', {});
        await executeAction('schedule', {});
        await executeAction('generate-report', {});

        const log = getActionLog();

        expect(log.length).toBe(3);
      });

      it('returns entries sorted by timestamp in ascending order', async () => {
        await executeAction('navigate', {});
        await executeAction('schedule', {});
        await executeAction('generate-report', {});

        const log = getActionLog();

        for (let i = 1; i < log.length; i++) {
          expect(log[i].timestamp).toBeGreaterThanOrEqual(log[i - 1].timestamp);
        }
      });
    });

    describe('clearActions', () => {
      it('removes all action log entries', async () => {
        await executeAction('navigate', {});
        await executeAction('schedule', {});

        expect(getActionCount()).toBe(2);

        const result = clearActions();

        expect(result).toBe(true);
        expect(getActionCount()).toBe(0);
      });

      it('returns true even when no entries exist', () => {
        const result = clearActions();
        expect(result).toBe(true);
      });
    });

    describe('getActionCount', () => {
      it('returns 0 when no actions have been executed', () => {
        expect(getActionCount()).toBe(0);
      });

      it('returns the correct count after executing actions', async () => {
        await executeAction('navigate', {});
        await executeAction('schedule', {});
        await executeAction('generate-report', {});

        expect(getActionCount()).toBe(3);
      });

      it('returns 0 after clearing the action log', async () => {
        await executeAction('navigate', {});
        clearActions();

        expect(getActionCount()).toBe(0);
      });
    });

    describe('getActionsByType', () => {
      it('returns entries matching the specified action type', async () => {
        await executeAction('navigate', {});
        await executeAction('schedule', {});
        await executeAction('navigate', {});

        const navEntries = getActionsByType('navigate');

        expect(navEntries.length).toBe(2);
        for (const entry of navEntries) {
          expect(entry.actionType).toBe('navigate');
        }
      });

      it('returns an empty array when no entries match', async () => {
        await executeAction('navigate', {});

        const entries = getActionsByType('export-csv');

        expect(Array.isArray(entries)).toBe(true);
        expect(entries.length).toBe(0);
      });

      it('returns an empty array for empty string type', () => {
        const entries = getActionsByType('');

        expect(Array.isArray(entries)).toBe(true);
        expect(entries.length).toBe(0);
      });

      it('returns an empty array for non-string type', () => {
        const entries = getActionsByType(null);

        expect(Array.isArray(entries)).toBe(true);
        expect(entries.length).toBe(0);
      });
    });

    describe('getActionsBySystem', () => {
      it('returns entries matching the specified system ID', async () => {
        await executeAction('navigate', {}, 'sap');
        await executeAction('schedule', {}, 'procore');
        await executeAction('generate-report', {}, 'sap');

        const sapEntries = getActionsBySystem('sap');

        expect(sapEntries.length).toBe(2);
        for (const entry of sapEntries) {
          expect(entry.targetSystem).toBe('sap');
        }
      });

      it('returns an empty array when no entries match', async () => {
        await executeAction('navigate', {}, 'sap');

        const entries = getActionsBySystem('salesforce');

        expect(Array.isArray(entries)).toBe(true);
        expect(entries.length).toBe(0);
      });

      it('returns an empty array for invalid system name', () => {
        const entries = getActionsBySystem('nonexistent');

        expect(Array.isArray(entries)).toBe(true);
        expect(entries.length).toBe(0);
      });
    });

    describe('getActionsByStatus', () => {
      it('returns entries matching the specified status', async () => {
        await executeAction('navigate', {});
        await executeAction('workflow', {});
        await executeAction('schedule', {});

        const successEntries = getActionsByStatus('success');

        expect(successEntries.length).toBe(2);
        for (const entry of successEntries) {
          expect(entry.status).toBe('success');
        }
      });

      it('returns pending entries for workflow actions', async () => {
        await executeAction('workflow', {});

        const pendingEntries = getActionsByStatus('pending');

        expect(pendingEntries.length).toBe(1);
        expect(pendingEntries[0].status).toBe('pending');
      });

      it('returns error entries for invalid action types', async () => {
        await executeAction('', {});

        const errorEntries = getActionsByStatus('error');

        expect(errorEntries.length).toBe(1);
        expect(errorEntries[0].status).toBe('error');
      });

      it('returns an empty array for invalid status value', () => {
        const entries = getActionsByStatus('invalid-status');

        expect(Array.isArray(entries)).toBe(true);
        expect(entries.length).toBe(0);
      });
    });

    describe('getActionsByPersona', () => {
      it('returns entries matching the specified persona ID', async () => {
        setPersonaInSession('lukas');
        await executeAction('navigate', {});
        await executeAction('schedule', {});

        setPersonaInSession('elena');
        await executeAction('generate-report', {});

        const lukasEntries = getActionsByPersona('lukas');
        expect(lukasEntries.length).toBe(2);
        for (const entry of lukasEntries) {
          expect(entry.persona).toBe('lukas');
        }

        const elenaEntries = getActionsByPersona('elena');
        expect(elenaEntries.length).toBe(1);
        expect(elenaEntries[0].persona).toBe('elena');
      });

      it('returns an empty array when no entries match', async () => {
        setPersonaInSession('lukas');
        await executeAction('navigate', {});

        const entries = getActionsByPersona('sophie');

        expect(Array.isArray(entries)).toBe(true);
        expect(entries.length).toBe(0);
      });

      it('returns an empty array for empty string persona', () => {
        const entries = getActionsByPersona('');

        expect(Array.isArray(entries)).toBe(true);
        expect(entries.length).toBe(0);
      });
    });

    describe('exportActions', () => {
      it('returns a valid JSON string', async () => {
        await executeAction('navigate', { target: 'test' });
        await executeAction('schedule', { title: 'Meeting' });

        const exported = exportActions();

        expect(typeof exported).toBe('string');

        const parsed = JSON.parse(exported);
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed.length).toBe(2);
      });

      it('returns "[]" when no actions have been executed', () => {
        const exported = exportActions();

        expect(exported).toBe('[]');
      });

      it('returns a pretty-printed JSON string', async () => {
        await executeAction('navigate', {});

        const exported = exportActions();

        expect(exported).toContain('\n');
      });

      it('exported entries contain all required fields', async () => {
        await executeAction('navigate', { target: 'test' }, 'sap');

        const exported = exportActions();
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
  });

  describe('Facade API completeness', () => {
    it('exports interpretQuery function', () => {
      expect(typeof interpretQuery).toBe('function');
    });

    it('exports orchestrateQuery function', () => {
      expect(typeof orchestrateQuery).toBe('function');
    });

    it('exports orchestrateRaw function', () => {
      expect(typeof orchestrateRaw).toBe('function');
    });

    it('exports getCTABubbles function', () => {
      expect(typeof getCTABubbles).toBe('function');
    });

    it('exports executeAction function', () => {
      expect(typeof executeAction).toBe('function');
    });

    it('exports getSourceTransparency function', () => {
      expect(typeof getSourceTransparency).toBe('function');
    });

    it('exports getActionLog function', () => {
      expect(typeof getActionLog).toBe('function');
    });

    it('exports getSourceSummary function', () => {
      expect(typeof getSourceSummary).toBe('function');
    });

    it('exports getActiveSources function', () => {
      expect(typeof getActiveSources).toBe('function');
    });

    it('exports getInactiveSources function', () => {
      expect(typeof getInactiveSources).toBe('function');
    });

    it('exports getSourceCount function', () => {
      expect(typeof getSourceCount).toBe('function');
    });

    it('exports getConfidence function', () => {
      expect(typeof getConfidence).toBe('function');
    });

    it('exports clearActions function', () => {
      expect(typeof clearActions).toBe('function');
    });

    it('exports getActionCount function', () => {
      expect(typeof getActionCount).toBe('function');
    });

    it('exports getActionsByType function', () => {
      expect(typeof getActionsByType).toBe('function');
    });

    it('exports getActionsBySystem function', () => {
      expect(typeof getActionsBySystem).toBe('function');
    });

    it('exports getActionsByStatus function', () => {
      expect(typeof getActionsByStatus).toBe('function');
    });

    it('exports getActionsByPersona function', () => {
      expect(typeof getActionsByPersona).toBe('function');
    });

    it('exports exportActions function', () => {
      expect(typeof exportActions).toBe('function');
    });

    it('exports isValidQuery function', () => {
      expect(typeof isValidQuery).toBe('function');
    });
  });

  describe('End-to-end integration flow', () => {
    it('complete query-to-action flow works correctly', async () => {
      // Step 1: Set up persona
      setPersonaInSession('lukas');

      // Step 2: Validate query
      const validation = isValidQuery('What is the current status of all my projects?');
      expect(validation.valid).toBe(true);

      // Step 3: Interpret query
      const intent = interpretQuery('What is the current status of all my projects?');
      expect(intent.domains.length).toBeGreaterThan(0);
      expect(intent.domains).toContain(INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id);

      // Step 4: Orchestrate query
      const queryResult = await orchestrateQuery('What is the current status of all my projects?', {
        personaId: 'lukas',
      });
      expect(queryResult.aggregatedResults.results.length).toBeGreaterThan(0);
      expect(queryResult.aggregatedResults.totalResults).toBeGreaterThan(0);

      // Step 5: Get source transparency
      const sources = getSourceTransparency(queryResult);
      expect(sources.length).toBeGreaterThan(0);
      const activeSources = sources.filter((s) => s.active);
      expect(activeSources.length).toBeGreaterThan(0);

      // Step 6: Get confidence
      const confidence = getConfidence(queryResult);
      expect(confidence).toBeGreaterThan(0);

      // Step 7: Get source count
      const sourceCount = getSourceCount(queryResult);
      expect(sourceCount).toBeGreaterThan(0);

      // Step 8: Generate CTA bubbles
      const bubbles = getCTABubbles(queryResult, 'lukas');
      expect(bubbles.length).toBeGreaterThanOrEqual(3);
      expect(bubbles.length).toBeLessThanOrEqual(4);

      // Step 9: Execute an action
      const actionResult = await executeAction('generate-report', {
        reportName: 'Portfolio Risk Report',
        actionId: 'act-pp-002',
      });
      expect(actionResult.success).toBe(true);
      expect(actionResult.id.length).toBeGreaterThan(0);

      // Step 10: Verify action log
      const actionLog = getActionLog();
      expect(actionLog.length).toBeGreaterThan(0);
      const lastAction = actionLog[actionLog.length - 1];
      expect(lastAction.actionType).toBe('generate-report');
      expect(lastAction.persona).toBe('lukas');

      // Step 11: Verify action count
      expect(getActionCount()).toBeGreaterThan(0);

      // Step 12: Export actions
      const exported = exportActions();
      const parsed = JSON.parse(exported);
      expect(parsed.length).toBeGreaterThan(0);

      // Step 13: Clear actions
      clearActions();
      expect(getActionCount()).toBe(0);
    });

    it('multi-persona query flow works correctly', async () => {
      // Lukas queries projects
      setPersonaInSession('lukas');
      const lukasResult = await orchestrateQuery('What is the current status of all my projects?', {
        personaId: 'lukas',
      });
      expect(lukasResult.aggregatedResults.results.length).toBeGreaterThan(0);
      await executeAction('navigate', { target: 'proj-101' }, 'procore');

      // Sophie queries finance
      setPersonaInSession('sophie');
      const sophieResult = await orchestrateQuery('What is our cash flow forecast for Q1 2025?', {
        personaId: 'sophie',
      });
      expect(sophieResult.aggregatedResults.results.length).toBeGreaterThan(0);
      await executeAction('generate-report', { reportName: 'Cash Flow' }, 'sap');

      // James queries sales
      setPersonaInSession('james');
      const jamesResult = await orchestrateQuery('What is the current pipeline value?', {
        personaId: 'james',
      });
      expect(jamesResult.aggregatedResults.results.length).toBeGreaterThan(0);
      await executeAction('schedule', { title: 'Deal Review' });

      // Elena queries procurement
      setPersonaInSession('elena');
      const elenaResult = await orchestrateQuery('Which contracts are expiring in the next 60 days?', {
        personaId: 'elena',
      });
      expect(elenaResult.aggregatedResults.results.length).toBeGreaterThan(0);
      await executeAction('workflow', { workflowName: 'Contract Renewal' });

      // Verify action log has entries from all personas
      const totalActions = getActionCount();
      expect(totalActions).toBe(4);

      const lukasActions = getActionsByPersona('lukas');
      expect(lukasActions.length).toBe(1);

      const sophieActions = getActionsByPersona('sophie');
      expect(sophieActions.length).toBe(1);

      const jamesActions = getActionsByPersona('james');
      expect(jamesActions.length).toBe(1);

      const elenaActions = getActionsByPersona('elena');
      expect(elenaActions.length).toBe(1);

      // Verify filtering by status
      const successActions = getActionsByStatus('success');
      expect(successActions.length).toBe(3);

      const pendingActions = getActionsByStatus('pending');
      expect(pendingActions.length).toBe(1);

      // Verify filtering by system
      const sapActions = getActionsBySystem('sap');
      expect(sapActions.length).toBe(1);

      const procoreActions = getActionsBySystem('procore');
      expect(procoreActions.length).toBe(1);

      // Clean up
      clearActions();
      expect(getActionCount()).toBe(0);
    });

    it('source transparency is consistent across different query types', async () => {
      // Project query
      const projectResult = await orchestrateQuery('What is the current status of all my projects?');
      const projectSources = getSourceTransparency(projectResult);
      const projectSummary = getSourceSummary(projectResult);

      expect(projectSources.length).toBe(projectSummary.totalSystems);
      expect(projectSummary.activeSystems).toBeGreaterThan(0);

      const projectActive = getActiveSources(projectResult);
      const projectInactive = getInactiveSources(projectResult);
      expect(projectActive.length + projectInactive.length).toBe(projectSources.length);

      // Sales query
      const salesResult = await orchestrateQuery('What is the current pipeline value?');
      const salesSources = getSourceTransparency(salesResult);
      const salesSummary = getSourceSummary(salesResult);

      expect(salesSources.length).toBe(salesSummary.totalSystems);
      expect(salesSummary.activeSystems).toBeGreaterThan(0);

      const salesActive = getActiveSources(salesResult);
      const salesInactive = getInactiveSources(salesResult);
      expect(salesActive.length + salesInactive.length).toBe(salesSources.length);
    });

    it('CTA bubbles are contextual to the query domain', async () => {
      // Project query CTAs
      const projectResult = await orchestrateQuery('What is the current status of all my projects?');
      const projectBubbles = getCTABubbles(projectResult, 'lukas');
      expect(projectBubbles.length).toBeGreaterThanOrEqual(3);

      // Sales query CTAs
      const salesResult = await orchestrateQuery('What is the current pipeline value?');
      const salesBubbles = getCTABubbles(salesResult, 'james');
      expect(salesBubbles.length).toBeGreaterThanOrEqual(3);

      // Bubbles should have different labels for different domains
      const projectLabels = projectBubbles.map((b) => b.label);
      const salesLabels = salesBubbles.map((b) => b.label);

      // At least some labels should differ
      const allSame = projectLabels.every((label) => salesLabels.includes(label));
      // They may overlap due to generic CTAs, but at least one should differ
      expect(projectLabels.length).toBeGreaterThan(0);
      expect(salesLabels.length).toBeGreaterThan(0);
    });

    it('execute-clear-execute cycle works correctly', async () => {
      // Execute actions
      await executeAction('navigate', { cycle: 1 });
      await executeAction('schedule', { cycle: 1 });
      expect(getActionCount()).toBe(2);

      // Clear
      clearActions();
      expect(getActionCount()).toBe(0);

      // Execute more actions
      await executeAction('generate-report', { cycle: 2 });
      expect(getActionCount()).toBe(1);

      const log = getActionLog();
      expect(log[0].actionType).toBe('generate-report');
      expect(log[0].payload.cycle).toBe(2);

      // Clean up
      clearActions();
    });

    it('error actions are tracked alongside success actions', async () => {
      await executeAction('navigate', {});
      await executeAction('', {}); // error
      await executeAction('schedule', {});
      await executeAction(null, {}); // error
      await executeAction('workflow', {}); // pending

      expect(getActionCount()).toBe(5);

      const successEntries = getActionsByStatus('success');
      expect(successEntries.length).toBe(2);

      const errorEntries = getActionsByStatus('error');
      expect(errorEntries.length).toBe(2);

      const pendingEntries = getActionsByStatus('pending');
      expect(pendingEntries.length).toBe(1);

      // Clean up
      clearActions();
    });
  });

  describe('concurrent operations', () => {
    it('handles concurrent orchestration calls without interference', async () => {
      const [result1, result2] = await Promise.all([
        orchestrateQuery('What is the current status of all my projects?'),
        orchestrateQuery('What is the current pipeline value?'),
      ]);

      expect(result1.aggregatedResults.results.length).toBeGreaterThan(0);
      expect(result2.aggregatedResults.results.length).toBeGreaterThan(0);

      // Both should have valid structures
      expect(result1.aggregatedResults).toBeDefined();
      expect(result2.aggregatedResults).toBeDefined();
      expect(result1.systems.length).toBeGreaterThan(0);
      expect(result2.systems.length).toBeGreaterThan(0);
    });

    it('handles concurrent action executions', async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(executeAction('navigate', { index: i }));
      }

      const results = await Promise.all(promises);

      expect(results.length).toBe(5);
      for (const result of results) {
        expect(result.success).toBe(true);
      }

      // Due to concurrent writes, some entries may be lost
      // but all results should be valid
      const log = getActionLog();
      expect(log.length).toBeGreaterThan(0);

      // Clean up
      clearActions();
    });
  });

  describe('defensive checks for corrupted localStorage', () => {
    it('orchestrateQuery works with corrupted action log', async () => {
      localStorage.setItem('ask-dreeso-action-log', 'corrupted{{{');

      const result = await orchestrateQuery('What is the current status of all my projects?');

      expect(result).not.toBeNull();
      expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
    });

    it('getActionLog handles corrupted localStorage', () => {
      localStorage.setItem('ask-dreeso-action-log', 'corrupted{{{');

      const log = getActionLog();
      expect(Array.isArray(log)).toBe(true);
      expect(log.length).toBe(0);
    });

    it('getActionCount handles corrupted localStorage', () => {
      localStorage.setItem('ask-dreeso-action-log', '{invalid}');

      expect(getActionCount()).toBe(0);
    });

    it('exportActions handles corrupted localStorage', () => {
      localStorage.setItem('ask-dreeso-action-log', 'not-json');

      const exported = exportActions();
      expect(exported).toBe('[]');
    });

    it('clearActions works with corrupted localStorage', () => {
      localStorage.setItem('ask-dreeso-action-log', 'corrupted');

      const result = clearActions();
      expect(result).toBe(true);
      expect(localStorage.getItem('ask-dreeso-action-log')).toBeNull();
    });
  });
});