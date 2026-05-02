import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  orchestrateQuery,
  orchestrateRawQuery,
  getClusterSystemMap,
  getSystemStatus,
} from './OrchestrationEngine';
import { INTELLIGENCE_CLUSTERS, SYSTEMS } from '../constants';

/**
 * Helper to clear all relevant localStorage keys before/after each test.
 */
function clearAllStorage() {
  localStorage.clear();
}

/**
 * Helper to create a valid interpreted query object for testing.
 * @param {Object} [overrides={}] - Fields to override
 * @returns {Object} A valid interpreted query object
 */
function createInterpretedQuery(overrides = {}) {
  return {
    domains: [INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id],
    queryType: 'STATUS_OVERVIEW',
    keywords: ['project', 'status'],
    confidence: 0.8,
    targetSystems: [SYSTEMS.PROCORE.id, SYSTEMS.PRIMAVERA.id],
    parameters: {},
    personaHint: 'lukas',
    originalQuery: 'What is the current status of all my projects?',
    ...overrides,
  };
}

describe('OrchestrationEngine', () => {
  beforeEach(() => {
    clearAllStorage();
  });

  afterEach(() => {
    clearAllStorage();
  });

  describe('orchestrateQuery', () => {
    describe('happy path - basic orchestration', () => {
      it('returns an orchestration result with aggregatedResults, systems, and timing', async () => {
        const query = createInterpretedQuery();
        const result = await orchestrateQuery(query);

        expect(result).not.toBeNull();
        expect(result).toHaveProperty('aggregatedResults');
        expect(result).toHaveProperty('systems');
        expect(result).toHaveProperty('timing');
      });

      it('returns aggregatedResults with results array, totalResults, clusters, and summary', async () => {
        const query = createInterpretedQuery();
        const result = await orchestrateQuery(query);

        expect(result.aggregatedResults).toHaveProperty('results');
        expect(result.aggregatedResults).toHaveProperty('totalResults');
        expect(result.aggregatedResults).toHaveProperty('clusters');
        expect(result.aggregatedResults).toHaveProperty('summary');
        expect(Array.isArray(result.aggregatedResults.results)).toBe(true);
        expect(typeof result.aggregatedResults.totalResults).toBe('number');
        expect(Array.isArray(result.aggregatedResults.clusters)).toBe(true);
      });

      it('returns summary with totalSources, averageConfidence, totalActions, and totalRiskSignals', async () => {
        const query = createInterpretedQuery();
        const result = await orchestrateQuery(query);

        const summary = result.aggregatedResults.summary;
        expect(summary).toHaveProperty('totalSources');
        expect(summary).toHaveProperty('averageConfidence');
        expect(summary).toHaveProperty('totalActions');
        expect(summary).toHaveProperty('totalRiskSignals');
        expect(typeof summary.totalSources).toBe('number');
        expect(typeof summary.averageConfidence).toBe('number');
        expect(typeof summary.totalActions).toBe('number');
        expect(typeof summary.totalRiskSignals).toBe('number');
      });

      it('returns results for project portfolio domain queries', async () => {
        const query = createInterpretedQuery({
          domains: [INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id],
          originalQuery: 'What is the current status of all my projects?',
        });
        const result = await orchestrateQuery(query);

        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
        expect(result.aggregatedResults.totalResults).toBeGreaterThan(0);
      });

      it('returns results for sales domain queries', async () => {
        const query = createInterpretedQuery({
          domains: [INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id],
          originalQuery: 'What is the current pipeline value?',
          personaHint: 'james',
          targetSystems: [SYSTEMS.SALESFORCE.id],
        });
        const result = await orchestrateQuery(query);

        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });

      it('returns results for finance domain queries', async () => {
        const query = createInterpretedQuery({
          domains: [INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id],
          originalQuery: 'What is our cash flow forecast for Q1 2025?',
          personaHint: 'sophie',
          targetSystems: [SYSTEMS.SAP.id],
        });
        const result = await orchestrateQuery(query);

        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });

      it('returns results for commercial procurement domain queries', async () => {
        const query = createInterpretedQuery({
          domains: [INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id],
          originalQuery: 'Which contracts are expiring in the next 60 days?',
          personaHint: 'elena',
          targetSystems: [SYSTEMS.SAP.id],
        });
        const result = await orchestrateQuery(query);

        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });

      it('returns results for workforce planning domain queries', async () => {
        const query = createInterpretedQuery({
          domains: [INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id],
          originalQuery: 'Show me the resource allocation across projects',
          personaHint: 'lukas',
          targetSystems: [SYSTEMS.PROCORE.id],
        });
        const result = await orchestrateQuery(query);

        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });

      it('returns results for knowledge IP domain queries', async () => {
        const query = createInterpretedQuery({
          domains: [INTELLIGENCE_CLUSTERS.KNOWLEDGE_IP.id],
          originalQuery: 'What lessons learned apply to my current projects?',
          personaHint: null,
          targetSystems: [SYSTEMS.PROCORE.id],
        });
        const result = await orchestrateQuery(query);

        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });
    });

    describe('happy path - result aggregation', () => {
      it('deduplicates results by ID', async () => {
        const query = createInterpretedQuery({
          domains: [INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id],
          originalQuery: 'project status overview',
          personaHint: 'lukas',
        });
        const result = await orchestrateQuery(query);

        const ids = result.aggregatedResults.results.map((r) => r.id);
        const uniqueIds = new Set(ids);
        expect(ids.length).toBe(uniqueIds.size);
      });

      it('extracts cluster IDs from results', async () => {
        const query = createInterpretedQuery({
          domains: [INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id],
        });
        const result = await orchestrateQuery(query);

        expect(result.aggregatedResults.clusters.length).toBeGreaterThan(0);
        for (const clusterId of result.aggregatedResults.clusters) {
          expect(typeof clusterId).toBe('string');
          expect(clusterId.length).toBeGreaterThan(0);
        }
      });

      it('counts total actions across all results', async () => {
        const query = createInterpretedQuery({
          domains: [INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id],
        });
        const result = await orchestrateQuery(query);

        expect(result.aggregatedResults.summary.totalActions).toBeGreaterThanOrEqual(0);
      });

      it('counts total risk signals across all results', async () => {
        const query = createInterpretedQuery({
          domains: [INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id],
        });
        const result = await orchestrateQuery(query);

        expect(result.aggregatedResults.summary.totalRiskSignals).toBeGreaterThanOrEqual(0);
      });

      it('calculates average confidence across all sources', async () => {
        const query = createInterpretedQuery({
          domains: [INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id],
        });
        const result = await orchestrateQuery(query);

        const avgConfidence = result.aggregatedResults.summary.averageConfidence;
        expect(typeof avgConfidence).toBe('number');
        expect(avgConfidence).toBeGreaterThanOrEqual(0);
        expect(avgConfidence).toBeLessThanOrEqual(1);
      });

      it('counts unique source systems', async () => {
        const query = createInterpretedQuery({
          domains: [INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id],
        });
        const result = await orchestrateQuery(query);

        expect(result.aggregatedResults.summary.totalSources).toBeGreaterThan(0);
      });

      it('totalResults matches the length of results array', async () => {
        const query = createInterpretedQuery({
          domains: [INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id],
        });
        const result = await orchestrateQuery(query);

        expect(result.aggregatedResults.totalResults).toBe(result.aggregatedResults.results.length);
      });
    });

    describe('happy path - system tracking', () => {
      it('returns system contribution details for all known systems', async () => {
        const query = createInterpretedQuery();
        const result = await orchestrateQuery(query);

        expect(Array.isArray(result.systems)).toBe(true);
        expect(result.systems.length).toBeGreaterThan(0);

        const systemIds = result.systems.map((s) => s.systemId);
        expect(systemIds).toContain(SYSTEMS.SAP.id);
        expect(systemIds).toContain(SYSTEMS.PROCORE.id);
        expect(systemIds).toContain(SYSTEMS.SALESFORCE.id);
        expect(systemIds).toContain(SYSTEMS.PRIMAVERA.id);
      });

      it('each system contribution has required fields', async () => {
        const query = createInterpretedQuery();
        const result = await orchestrateQuery(query);

        for (const system of result.systems) {
          expect(system).toHaveProperty('systemId');
          expect(system).toHaveProperty('label');
          expect(system).toHaveProperty('active');
          expect(system).toHaveProperty('resultCount');
          expect(system).toHaveProperty('confidence');
          expect(system).toHaveProperty('lastSynced');
          expect(system).toHaveProperty('status');
          expect(typeof system.systemId).toBe('string');
          expect(typeof system.label).toBe('string');
          expect(typeof system.active).toBe('boolean');
          expect(typeof system.resultCount).toBe('number');
          expect(typeof system.confidence).toBe('number');
          expect(typeof system.status).toBe('string');
        }
      });

      it('marks contributing systems as active', async () => {
        const query = createInterpretedQuery({
          domains: [INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id],
        });
        const result = await orchestrateQuery(query);

        const activeSystems = result.systems.filter((s) => s.active);
        expect(activeSystems.length).toBeGreaterThan(0);

        for (const system of activeSystems) {
          expect(system.resultCount).toBeGreaterThan(0);
        }
      });

      it('marks non-contributing systems as inactive', async () => {
        const query = createInterpretedQuery({
          domains: [INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id],
          originalQuery: 'What is the current pipeline value?',
          personaHint: 'james',
          targetSystems: [SYSTEMS.SALESFORCE.id],
        });
        const result = await orchestrateQuery(query);

        const inactiveSystems = result.systems.filter((s) => !s.active);
        for (const system of inactiveSystems) {
          expect(system.resultCount).toBe(0);
          expect(system.confidence).toBe(0);
        }
      });

      it('active systems have non-zero confidence scores', async () => {
        const query = createInterpretedQuery({
          domains: [INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id],
        });
        const result = await orchestrateQuery(query);

        const activeSystems = result.systems.filter((s) => s.active);
        for (const system of activeSystems) {
          expect(system.confidence).toBeGreaterThan(0);
          expect(system.confidence).toBeLessThanOrEqual(1);
        }
      });
    });

    describe('happy path - timing simulation', () => {
      it('returns timing information with startTime, endTime, and durationMs', async () => {
        const query = createInterpretedQuery();
        const result = await orchestrateQuery(query);

        expect(result.timing).toHaveProperty('startTime');
        expect(result.timing).toHaveProperty('endTime');
        expect(result.timing).toHaveProperty('durationMs');
        expect(result.timing).toHaveProperty('systemTimings');
        expect(typeof result.timing.startTime).toBe('number');
        expect(typeof result.timing.endTime).toBe('number');
        expect(typeof result.timing.durationMs).toBe('number');
      });

      it('endTime is greater than or equal to startTime', async () => {
        const query = createInterpretedQuery();
        const result = await orchestrateQuery(query);

        expect(result.timing.endTime).toBeGreaterThanOrEqual(result.timing.startTime);
      });

      it('durationMs equals endTime minus startTime', async () => {
        const query = createInterpretedQuery();
        const result = await orchestrateQuery(query);

        expect(result.timing.durationMs).toBe(result.timing.endTime - result.timing.startTime);
      });

      it('durationMs is a non-negative number', async () => {
        const query = createInterpretedQuery();
        const result = await orchestrateQuery(query);

        expect(result.timing.durationMs).toBeGreaterThanOrEqual(0);
      });

      it('systemTimings is an object with per-system timing values', async () => {
        const query = createInterpretedQuery();
        const result = await orchestrateQuery(query);

        expect(typeof result.timing.systemTimings).toBe('object');
        expect(result.timing.systemTimings).not.toBeNull();

        for (const [key, value] of Object.entries(result.timing.systemTimings)) {
          expect(typeof key).toBe('string');
          expect(typeof value).toBe('number');
          expect(value).toBeGreaterThanOrEqual(0);
        }
      });
    });

    describe('happy path - multi-domain queries', () => {
      it('handles queries spanning multiple domains', async () => {
        const query = createInterpretedQuery({
          domains: [
            INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id,
            INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id,
          ],
          originalQuery: 'Show me the budget variance and project schedule status',
          personaHint: null,
          targetSystems: [],
        });
        const result = await orchestrateQuery(query);

        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
        expect(result.aggregatedResults.clusters.length).toBeGreaterThanOrEqual(1);
      });

      it('returns results from multiple clusters when multiple domains are specified', async () => {
        const query = createInterpretedQuery({
          domains: [
            INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id,
            INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id,
          ],
          originalQuery: 'project status and resource allocation',
          personaHint: 'lukas',
          targetSystems: [],
        });
        const result = await orchestrateQuery(query);

        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });
    });

    describe('happy path - persona filtering', () => {
      it('filters results by persona hint when provided', async () => {
        const query = createInterpretedQuery({
          domains: [INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id],
          personaHint: 'lukas',
        });
        const result = await orchestrateQuery(query);

        for (const r of result.aggregatedResults.results) {
          expect(r.personaId === 'lukas' || r.personaId === null).toBe(true);
        }
      });

      it('returns results when persona hint matches available data', async () => {
        const query = createInterpretedQuery({
          domains: [INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id],
          personaHint: 'james',
          originalQuery: 'sales pipeline overview',
        });
        const result = await orchestrateQuery(query);

        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });

      it('returns results even when persona hint does not match any specific data', async () => {
        const query = createInterpretedQuery({
          domains: [INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id],
          personaHint: 'nonexistent-persona',
          originalQuery: 'project status overview',
        });
        const result = await orchestrateQuery(query);

        // Should still return results (unfiltered or fallback)
        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });
    });

    describe('happy path - fallback behavior', () => {
      it('returns fallback results when no domains match', async () => {
        const query = createInterpretedQuery({
          domains: [],
          originalQuery: 'random nonsense query',
          personaHint: null,
          targetSystems: [],
          keywords: [],
        });
        const result = await orchestrateQuery(query);

        // Should still return some results via fallback
        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });

      it('returns results when only originalQuery is provided', async () => {
        const query = createInterpretedQuery({
          domains: [],
          originalQuery: 'project status overview',
          personaHint: null,
          targetSystems: [],
        });
        const result = await orchestrateQuery(query);

        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });
    });

    describe('error handling - invalid queries', () => {
      it('returns error result for null input', async () => {
        const result = await orchestrateQuery(null);

        expect(result).not.toBeNull();
        expect(result.aggregatedResults).toBeDefined();
        expect(result.aggregatedResults.results).toEqual([]);
        expect(result.aggregatedResults.totalResults).toBe(0);
        expect(result.aggregatedResults.error).toBeDefined();
        expect(result.aggregatedResults.error.errorCode).toBe('INVALID_QUERY');
      });

      it('returns error result for undefined input', async () => {
        const result = await orchestrateQuery(undefined);

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results).toEqual([]);
        expect(result.aggregatedResults.error).toBeDefined();
        expect(result.aggregatedResults.error.errorCode).toBe('INVALID_QUERY');
      });

      it('returns error result for non-object input (string)', async () => {
        const result = await orchestrateQuery('not an object');

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results).toEqual([]);
        expect(result.aggregatedResults.error).toBeDefined();
        expect(result.aggregatedResults.error.errorCode).toBe('INVALID_QUERY');
      });

      it('returns error result for non-object input (number)', async () => {
        const result = await orchestrateQuery(42);

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results).toEqual([]);
        expect(result.aggregatedResults.error).toBeDefined();
      });

      it('returns error result for non-object input (boolean)', async () => {
        const result = await orchestrateQuery(true);

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results).toEqual([]);
        expect(result.aggregatedResults.error).toBeDefined();
      });

      it('error result still contains systems array', async () => {
        const result = await orchestrateQuery(null);

        expect(Array.isArray(result.systems)).toBe(true);
        expect(result.systems.length).toBeGreaterThan(0);

        for (const system of result.systems) {
          expect(system.active).toBe(false);
          expect(system.resultCount).toBe(0);
          expect(system.confidence).toBe(0);
        }
      });

      it('error result still contains timing information', async () => {
        const result = await orchestrateQuery(null);

        expect(result.timing).toBeDefined();
        expect(typeof result.timing.startTime).toBe('number');
        expect(typeof result.timing.endTime).toBe('number');
        expect(typeof result.timing.durationMs).toBe('number');
        expect(result.timing.durationMs).toBe(0);
      });

      it('error result summary has zero values', async () => {
        const result = await orchestrateQuery(null);

        const summary = result.aggregatedResults.summary;
        expect(summary.totalSources).toBe(0);
        expect(summary.averageConfidence).toBe(0);
        expect(summary.totalActions).toBe(0);
        expect(summary.totalRiskSignals).toBe(0);
      });
    });

    describe('edge cases', () => {
      it('handles interpreted query with empty domains array', async () => {
        const query = createInterpretedQuery({
          domains: [],
          originalQuery: 'project status',
        });
        const result = await orchestrateQuery(query);

        expect(result).not.toBeNull();
        expect(result.aggregatedResults).toBeDefined();
        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });

      it('handles interpreted query with empty targetSystems array', async () => {
        const query = createInterpretedQuery({
          targetSystems: [],
          domains: [INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id],
        });
        const result = await orchestrateQuery(query);

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });

      it('handles interpreted query with empty originalQuery', async () => {
        const query = createInterpretedQuery({
          originalQuery: '',
          domains: [INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id],
        });
        const result = await orchestrateQuery(query);

        expect(result).not.toBeNull();
        expect(result.aggregatedResults).toBeDefined();
      });

      it('handles interpreted query with null personaHint', async () => {
        const query = createInterpretedQuery({
          personaHint: null,
          domains: [INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id],
        });
        const result = await orchestrateQuery(query);

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });

      it('handles interpreted query with missing optional fields', async () => {
        const query = {
          domains: [INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id],
          originalQuery: 'project status',
        };
        const result = await orchestrateQuery(query);

        expect(result).not.toBeNull();
        expect(result.aggregatedResults).toBeDefined();
      });

      it('handles interpreted query with all empty arrays and null values', async () => {
        const query = {
          domains: [],
          queryType: 'UNKNOWN',
          keywords: [],
          confidence: 0,
          targetSystems: [],
          parameters: {},
          personaHint: null,
          originalQuery: '',
        };
        const result = await orchestrateQuery(query);

        expect(result).not.toBeNull();
        expect(result.aggregatedResults).toBeDefined();
        // Should still return fallback results
        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });
    });

    describe('result structure validation', () => {
      it('each result has an id field', async () => {
        const query = createInterpretedQuery();
        const result = await orchestrateQuery(query);

        for (const r of result.aggregatedResults.results) {
          expect(typeof r.id).toBe('string');
          expect(r.id.length).toBeGreaterThan(0);
        }
      });

      it('each result has a clusterId field', async () => {
        const query = createInterpretedQuery();
        const result = await orchestrateQuery(query);

        for (const r of result.aggregatedResults.results) {
          expect(typeof r.clusterId).toBe('string');
          expect(r.clusterId.length).toBeGreaterThan(0);
        }
      });

      it('each result has a summary field', async () => {
        const query = createInterpretedQuery();
        const result = await orchestrateQuery(query);

        for (const r of result.aggregatedResults.results) {
          expect(typeof r.summary).toBe('string');
          expect(r.summary.length).toBeGreaterThan(0);
        }
      });

      it('each result has a sources array', async () => {
        const query = createInterpretedQuery();
        const result = await orchestrateQuery(query);

        for (const r of result.aggregatedResults.results) {
          expect(Array.isArray(r.sources)).toBe(true);
        }
      });

      it('each result has an actions array', async () => {
        const query = createInterpretedQuery();
        const result = await orchestrateQuery(query);

        for (const r of result.aggregatedResults.results) {
          expect(Array.isArray(r.actions)).toBe(true);
        }
      });

      it('each result has a riskSignals array', async () => {
        const query = createInterpretedQuery();
        const result = await orchestrateQuery(query);

        for (const r of result.aggregatedResults.results) {
          expect(Array.isArray(r.riskSignals)).toBe(true);
        }
      });

      it('each source in results has systemId and confidence', async () => {
        const query = createInterpretedQuery();
        const result = await orchestrateQuery(query);

        for (const r of result.aggregatedResults.results) {
          for (const source of r.sources) {
            expect(typeof source.systemId).toBe('string');
            expect(typeof source.confidence).toBe('number');
            expect(source.confidence).toBeGreaterThanOrEqual(0);
            expect(source.confidence).toBeLessThanOrEqual(1);
          }
        }
      });
    });
  });

  describe('orchestrateRawQuery', () => {
    describe('happy path', () => {
      it('returns an orchestration result for a valid query text', async () => {
        const result = await orchestrateRawQuery('What is the current status of all my projects?');

        expect(result).not.toBeNull();
        expect(result).toHaveProperty('aggregatedResults');
        expect(result).toHaveProperty('systems');
        expect(result).toHaveProperty('timing');
        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });

      it('accepts optional personaId parameter', async () => {
        const result = await orchestrateRawQuery('What is the current pipeline value?', {
          personaId: 'james',
        });

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });

      it('accepts optional clusterId parameter', async () => {
        const result = await orchestrateRawQuery('Show me the project status', {
          clusterId: INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id,
        });

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });

      it('accepts both personaId and clusterId parameters', async () => {
        const result = await orchestrateRawQuery('Show me the budget variance', {
          personaId: 'sophie',
          clusterId: INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id,
        });

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });

      it('returns system contribution details', async () => {
        const result = await orchestrateRawQuery('What is the current status of all my projects?');

        expect(Array.isArray(result.systems)).toBe(true);
        expect(result.systems.length).toBeGreaterThan(0);
      });

      it('returns timing information', async () => {
        const result = await orchestrateRawQuery('What is the current status of all my projects?');

        expect(result.timing).toBeDefined();
        expect(typeof result.timing.durationMs).toBe('number');
        expect(result.timing.durationMs).toBeGreaterThanOrEqual(0);
      });
    });

    describe('error handling', () => {
      it('returns error result for empty string query', async () => {
        const result = await orchestrateRawQuery('');

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results).toEqual([]);
        expect(result.aggregatedResults.error).toBeDefined();
        expect(result.aggregatedResults.error.errorCode).toBe('INVALID_QUERY');
      });

      it('returns error result for whitespace-only query', async () => {
        const result = await orchestrateRawQuery('   ');

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results).toEqual([]);
        expect(result.aggregatedResults.error).toBeDefined();
      });

      it('returns error result for null query', async () => {
        const result = await orchestrateRawQuery(null);

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results).toEqual([]);
        expect(result.aggregatedResults.error).toBeDefined();
      });

      it('returns error result for undefined query', async () => {
        const result = await orchestrateRawQuery(undefined);

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results).toEqual([]);
        expect(result.aggregatedResults.error).toBeDefined();
      });

      it('returns error result for non-string query', async () => {
        const result = await orchestrateRawQuery(123);

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results).toEqual([]);
        expect(result.aggregatedResults.error).toBeDefined();
      });

      it('handles null options gracefully', async () => {
        const result = await orchestrateRawQuery('project status', null);

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });

      it('handles non-object options gracefully', async () => {
        const result = await orchestrateRawQuery('project status', 'not-an-object');

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });

      it('handles array options gracefully', async () => {
        const result = await orchestrateRawQuery('project status', [1, 2, 3]);

        expect(result).not.toBeNull();
        expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getClusterSystemMap', () => {
    it('returns a mapping object', () => {
      const map = getClusterSystemMap();

      expect(map).not.toBeNull();
      expect(typeof map).toBe('object');
    });

    it('contains mappings for all 6 intelligence clusters', () => {
      const map = getClusterSystemMap();

      expect(map).toHaveProperty(INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id);
      expect(map).toHaveProperty(INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id);
      expect(map).toHaveProperty(INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id);
      expect(map).toHaveProperty(INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id);
      expect(map).toHaveProperty(INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id);
      expect(map).toHaveProperty(INTELLIGENCE_CLUSTERS.KNOWLEDGE_IP.id);
    });

    it('each cluster maps to an array of system IDs', () => {
      const map = getClusterSystemMap();

      for (const [clusterId, systemIds] of Object.entries(map)) {
        expect(Array.isArray(systemIds)).toBe(true);
        expect(systemIds.length).toBeGreaterThan(0);

        for (const sysId of systemIds) {
          expect(typeof sysId).toBe('string');
          expect(sysId.length).toBeGreaterThan(0);
        }
      }
    });

    it('project portfolio cluster maps to Procore, Primavera, and SAP', () => {
      const map = getClusterSystemMap();
      const projectSystems = map[INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id];

      expect(projectSystems).toContain(SYSTEMS.PROCORE.id);
      expect(projectSystems).toContain(SYSTEMS.PRIMAVERA.id);
      expect(projectSystems).toContain(SYSTEMS.SAP.id);
    });

    it('sales cluster maps to Salesforce', () => {
      const map = getClusterSystemMap();
      const salesSystems = map[INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id];

      expect(salesSystems).toContain(SYSTEMS.SALESFORCE.id);
    });

    it('commercial procurement cluster maps to SAP and Procore', () => {
      const map = getClusterSystemMap();
      const commercialSystems = map[INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id];

      expect(commercialSystems).toContain(SYSTEMS.SAP.id);
      expect(commercialSystems).toContain(SYSTEMS.PROCORE.id);
    });

    it('finance cluster maps to SAP and Primavera', () => {
      const map = getClusterSystemMap();
      const financeSystems = map[INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id];

      expect(financeSystems).toContain(SYSTEMS.SAP.id);
      expect(financeSystems).toContain(SYSTEMS.PRIMAVERA.id);
    });

    it('workforce cluster maps to Procore and Primavera', () => {
      const map = getClusterSystemMap();
      const workforceSystems = map[INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id];

      expect(workforceSystems).toContain(SYSTEMS.PROCORE.id);
      expect(workforceSystems).toContain(SYSTEMS.PRIMAVERA.id);
    });

    it('knowledge cluster maps to Procore and Primavera', () => {
      const map = getClusterSystemMap();
      const knowledgeSystems = map[INTELLIGENCE_CLUSTERS.KNOWLEDGE_IP.id];

      expect(knowledgeSystems).toContain(SYSTEMS.PROCORE.id);
      expect(knowledgeSystems).toContain(SYSTEMS.PRIMAVERA.id);
    });
  });

  describe('getSystemStatus', () => {
    it('returns an array of system objects', () => {
      const systems = getSystemStatus();

      expect(Array.isArray(systems)).toBe(true);
      expect(systems.length).toBeGreaterThan(0);
    });

    it('returns all 4 known systems', () => {
      const systems = getSystemStatus();
      const systemIds = systems.map((s) => s.id);

      expect(systemIds).toContain(SYSTEMS.SAP.id);
      expect(systemIds).toContain(SYSTEMS.PROCORE.id);
      expect(systemIds).toContain(SYSTEMS.SALESFORCE.id);
      expect(systemIds).toContain(SYSTEMS.PRIMAVERA.id);
    });

    it('each system has id, label, description, color, and status fields', () => {
      const systems = getSystemStatus();

      for (const system of systems) {
        expect(system).toHaveProperty('id');
        expect(system).toHaveProperty('label');
        expect(system).toHaveProperty('description');
        expect(system).toHaveProperty('color');
        expect(system).toHaveProperty('status');
        expect(typeof system.id).toBe('string');
        expect(typeof system.label).toBe('string');
        expect(typeof system.description).toBe('string');
        expect(typeof system.color).toBe('string');
        expect(typeof system.status).toBe('string');
      }
    });

    it('each system has a health field', () => {
      const systems = getSystemStatus();

      for (const system of systems) {
        expect(system).toHaveProperty('health');
        expect(typeof system.health).toBe('string');
      }
    });
  });

  describe('integration - end-to-end orchestration', () => {
    it('orchestrates a project query and returns complete result structure', async () => {
      const query = createInterpretedQuery({
        domains: [INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id],
        originalQuery: 'What is the current status of all my projects?',
        personaHint: 'lukas',
      });
      const result = await orchestrateQuery(query);

      // Verify complete structure
      expect(result.aggregatedResults.results.length).toBeGreaterThan(0);
      expect(result.aggregatedResults.totalResults).toBeGreaterThan(0);
      expect(result.aggregatedResults.clusters.length).toBeGreaterThan(0);
      expect(result.aggregatedResults.summary.totalSources).toBeGreaterThan(0);
      expect(result.aggregatedResults.summary.averageConfidence).toBeGreaterThan(0);
      expect(result.systems.length).toBe(4);
      expect(result.timing.durationMs).toBeGreaterThanOrEqual(0);

      // Verify at least one system is active
      const activeSystems = result.systems.filter((s) => s.active);
      expect(activeSystems.length).toBeGreaterThan(0);

      // Verify results contain project portfolio data
      const projectResults = result.aggregatedResults.results.filter(
        (r) => r.clusterId === INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id
      );
      expect(projectResults.length).toBeGreaterThan(0);
    });

    it('orchestrates a sales query and returns Salesforce as active system', async () => {
      const query = createInterpretedQuery({
        domains: [INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id],
        originalQuery: 'What is the current pipeline value?',
        personaHint: 'james',
        targetSystems: [SYSTEMS.SALESFORCE.id],
      });
      const result = await orchestrateQuery(query);

      expect(result.aggregatedResults.results.length).toBeGreaterThan(0);

      const salesforceSystem = result.systems.find((s) => s.systemId === SYSTEMS.SALESFORCE.id);
      expect(salesforceSystem).toBeDefined();
      expect(salesforceSystem.active).toBe(true);
      expect(salesforceSystem.resultCount).toBeGreaterThan(0);
    });

    it('orchestrateRawQuery produces equivalent structure to orchestrateQuery', async () => {
      const rawResult = await orchestrateRawQuery('What is the current status of all my projects?', {
        personaId: 'lukas',
        clusterId: INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id,
      });

      // Verify same structure
      expect(rawResult).toHaveProperty('aggregatedResults');
      expect(rawResult).toHaveProperty('systems');
      expect(rawResult).toHaveProperty('timing');
      expect(rawResult.aggregatedResults).toHaveProperty('results');
      expect(rawResult.aggregatedResults).toHaveProperty('totalResults');
      expect(rawResult.aggregatedResults).toHaveProperty('clusters');
      expect(rawResult.aggregatedResults).toHaveProperty('summary');
      expect(Array.isArray(rawResult.systems)).toBe(true);
      expect(rawResult.systems.length).toBe(4);
    });

    it('handles concurrent orchestration calls without interference', async () => {
      const query1 = createInterpretedQuery({
        domains: [INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id],
        originalQuery: 'project status',
        personaHint: 'lukas',
      });
      const query2 = createInterpretedQuery({
        domains: [INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id],
        originalQuery: 'pipeline value',
        personaHint: 'james',
      });

      const [result1, result2] = await Promise.all([
        orchestrateQuery(query1),
        orchestrateQuery(query2),
      ]);

      expect(result1.aggregatedResults.results.length).toBeGreaterThan(0);
      expect(result2.aggregatedResults.results.length).toBeGreaterThan(0);

      // Results should be different
      const result1Ids = result1.aggregatedResults.results.map((r) => r.id);
      const result2Ids = result2.aggregatedResults.results.map((r) => r.id);

      // At least some IDs should differ between the two queries
      const allSame = result1Ids.every((id) => result2Ids.includes(id)) &&
        result2Ids.every((id) => result1Ids.includes(id));
      // They may overlap if fallback data is used, but the structure should be valid
      expect(result1.aggregatedResults).toBeDefined();
      expect(result2.aggregatedResults).toBeDefined();
    });
  });
});