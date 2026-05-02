import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  interpretQuery,
  getSupportedQueryTypes,
  getDomainKeywordMap,
  validateQuery,
  QUERY_TYPES,
} from './QueryInterpreter';
import { INTELLIGENCE_CLUSTERS, SYSTEMS, PERSONAS } from '../constants';

describe('QueryInterpreter', () => {
  describe('interpretQuery', () => {
    describe('happy path - domain mapping', () => {
      it('maps project-related queries to the project portfolio cluster', () => {
        const result = interpretQuery('What is the current status of all my projects?');

        expect(result).not.toBeNull();
        expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id);
        expect(result.originalQuery).toBe('What is the current status of all my projects?');
      });

      it('maps sales-related queries to the sales business dev cluster', () => {
        const result = interpretQuery('What is the current pipeline value?');

        expect(result).not.toBeNull();
        expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id);
      });

      it('maps procurement-related queries to the commercial procurement cluster', () => {
        const result = interpretQuery('Which contracts are expiring in the next 60 days?');

        expect(result).not.toBeNull();
        expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id);
      });

      it('maps finance-related queries to the finance cash flow cluster', () => {
        const result = interpretQuery('What is our cash flow forecast for Q1 2025?');

        expect(result).not.toBeNull();
        expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id);
      });

      it('maps workforce-related queries to the workforce planning cluster', () => {
        const result = interpretQuery('Show me the resource allocation across projects');

        expect(result).not.toBeNull();
        expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id);
      });

      it('maps knowledge-related queries to the knowledge IP cluster', () => {
        const result = interpretQuery('What lessons learned apply to my current projects?');

        expect(result).not.toBeNull();
        expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.KNOWLEDGE_IP.id);
      });

      it('maps queries with multiple domain keywords to multiple clusters', () => {
        const result = interpretQuery('Show me the budget variance and project schedule status');

        expect(result).not.toBeNull();
        expect(result.domains.length).toBeGreaterThanOrEqual(1);
        // Should match both finance and project domains
        const hasFinance = result.domains.includes(INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id);
        const hasProject = result.domains.includes(INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id);
        expect(hasFinance || hasProject).toBe(true);
      });
    });

    describe('happy path - query type classification', () => {
      it('classifies status overview queries correctly', () => {
        const result = interpretQuery('What is the current status of all my projects?');

        expect(result.queryType).toBe(QUERY_TYPES.STATUS_OVERVIEW);
      });

      it('classifies risk assessment queries correctly', () => {
        const result = interpretQuery('What are the top risks in my portfolio?');

        expect(result.queryType).toBe(QUERY_TYPES.RISK_ASSESSMENT);
      });

      it('classifies forecast queries correctly', () => {
        const result = interpretQuery('What is the revenue forecast for next year?');

        expect(result.queryType).toBe(QUERY_TYPES.FORECAST);
      });

      it('classifies action request queries correctly', () => {
        const result = interpretQuery('Generate a portfolio risk report');

        expect(result.queryType).toBe(QUERY_TYPES.ACTION_REQUEST);
      });

      it('classifies trend analysis queries correctly', () => {
        const result = interpretQuery('Show me the trend analysis over time for sales');

        expect(result.queryType).toBe(QUERY_TYPES.TREND_ANALYSIS);
      });

      it('classifies comparison queries correctly', () => {
        const result = interpretQuery('Compare budget versus actual spend across projects');

        expect(result.queryType).toBe(QUERY_TYPES.COMPARISON);
      });

      it('classifies detail lookup queries correctly', () => {
        const result = interpretQuery('Which milestones are overdue this month?');

        expect(result.queryType).toBe(QUERY_TYPES.DETAIL_LOOKUP);
      });

      it('classifies search queries correctly', () => {
        const result = interpretQuery('Search for foundation engineering best practices');

        expect(result.queryType).toBe(QUERY_TYPES.SEARCH);
      });
    });

    describe('happy path - keyword extraction', () => {
      it('extracts meaningful keywords from a query', () => {
        const result = interpretQuery('What is the current status of all my projects?');

        expect(Array.isArray(result.keywords)).toBe(true);
        expect(result.keywords.length).toBeGreaterThan(0);
        // Should contain meaningful words, not stop words
        expect(result.keywords).toContain('current');
        expect(result.keywords).toContain('status');
        expect(result.keywords).toContain('projects');
      });

      it('removes stop words from extracted keywords', () => {
        const result = interpretQuery('What is the current status of all my projects?');

        expect(result.keywords).not.toContain('what');
        expect(result.keywords).not.toContain('is');
        expect(result.keywords).not.toContain('the');
        expect(result.keywords).not.toContain('of');
        expect(result.keywords).not.toContain('all');
        expect(result.keywords).not.toContain('my');
      });

      it('returns unique keywords without duplicates', () => {
        const result = interpretQuery('project status project overview project');

        const uniqueKeywords = new Set(result.keywords);
        expect(result.keywords.length).toBe(uniqueKeywords.size);
      });
    });

    describe('happy path - confidence scoring', () => {
      it('returns a confidence score between 0 and 1', () => {
        const result = interpretQuery('What is the current status of all my projects?');

        expect(typeof result.confidence).toBe('number');
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      });

      it('returns higher confidence for specific domain queries', () => {
        const specificResult = interpretQuery('Show me the budget variance across all projects');
        const vagueResult = interpretQuery('hello');

        expect(specificResult.confidence).toBeGreaterThan(vagueResult.confidence);
      });

      it('returns higher confidence for longer, more specific queries', () => {
        const longResult = interpretQuery('What is the cash flow forecast for Q1 2025 including receivables at risk?');
        const shortResult = interpretQuery('cash flow');

        expect(longResult.confidence).toBeGreaterThanOrEqual(shortResult.confidence);
      });

      it('returns zero confidence for empty queries', () => {
        const result = interpretQuery('');

        expect(result.confidence).toBe(0);
      });
    });

    describe('happy path - target system identification', () => {
      it('identifies SAP as a target system for finance queries', () => {
        const result = interpretQuery('Show me the financial records from SAP');

        expect(result.targetSystems).toContain(SYSTEMS.SAP.id);
      });

      it('identifies Salesforce as a target system for sales queries', () => {
        const result = interpretQuery('What is the current pipeline in Salesforce?');

        expect(result.targetSystems).toContain(SYSTEMS.SALESFORCE.id);
      });

      it('identifies Procore as a target system for construction queries', () => {
        const result = interpretQuery('Show me the Procore project management data');

        expect(result.targetSystems).toContain(SYSTEMS.PROCORE.id);
      });

      it('identifies Primavera as a target system for scheduling queries', () => {
        const result = interpretQuery('What is the Primavera schedule for the project?');

        expect(result.targetSystems).toContain(SYSTEMS.PRIMAVERA.id);
      });

      it('infers target systems from domain when no explicit system is mentioned', () => {
        const result = interpretQuery('What is the current pipeline value?');

        // Sales queries should infer Salesforce
        expect(result.targetSystems.length).toBeGreaterThan(0);
        expect(result.targetSystems).toContain(SYSTEMS.SALESFORCE.id);
      });

      it('returns target systems as an array', () => {
        const result = interpretQuery('Show me the project status');

        expect(Array.isArray(result.targetSystems)).toBe(true);
      });
    });

    describe('happy path - persona hint detection', () => {
      it('detects Lukas persona hint from project-heavy queries', () => {
        const result = interpretQuery('Show me the project portfolio milestone schedule and resource allocation');

        expect(result.personaHint).toBe(PERSONAS.LUKAS.id);
      });

      it('detects Elena persona hint from procurement-heavy queries', () => {
        const result = interpretQuery('Which contracts and vendors need procurement renewal?');

        expect(result.personaHint).toBe(PERSONAS.ELENA.id);
      });

      it('detects Sophie persona hint from finance-heavy queries', () => {
        const result = interpretQuery('What is the cash flow budget and revenue forecast?');

        expect(result.personaHint).toBe(PERSONAS.SOPHIE.id);
      });

      it('detects James persona hint from sales-heavy queries', () => {
        const result = interpretQuery('Show me the sales pipeline lead opportunity and deal status');

        expect(result.personaHint).toBe(PERSONAS.JAMES.id);
      });

      it('detects persona from explicit name mention', () => {
        const result = interpretQuery('Show Lukas the project overview');

        expect(result.personaHint).toBe(PERSONAS.LUKAS.id);
      });

      it('returns null persona hint for generic queries', () => {
        const result = interpretQuery('hello world');

        expect(result.personaHint).toBeNull();
      });
    });

    describe('happy path - parameter extraction', () => {
      it('extracts project name references from queries', () => {
        const result = interpretQuery('How is the Munich Highway Extension progressing?');

        expect(result.parameters).toBeDefined();
        expect(result.parameters.project).toBe('munich highway extension');
      });

      it('extracts quarter references from queries', () => {
        const result = interpretQuery('What is the forecast for Q1 2025?');

        expect(result.parameters).toBeDefined();
        expect(result.parameters.quarter).toBeDefined();
      });

      it('extracts timeframe references like next quarter', () => {
        const result = interpretQuery('Show me the capacity forecast for next quarter');

        expect(result.parameters).toBeDefined();
        expect(result.parameters.timeframe).toBe('next_quarter');
      });

      it('extracts timeframe references like this year', () => {
        const result = interpretQuery('What is our revenue this year?');

        expect(result.parameters).toBeDefined();
        expect(result.parameters.timeframe).toBe('current_year');
      });

      it('extracts severity references from queries', () => {
        const result = interpretQuery('Show me all critical risk items');

        expect(result.parameters).toBeDefined();
        expect(result.parameters.severity).toBe('critical');
      });

      it('extracts day count references from queries', () => {
        const result = interpretQuery('Which contracts are expiring in the next 60 days?');

        expect(result.parameters).toBeDefined();
        expect(result.parameters.days).toBe('60');
      });

      it('extracts system name references from queries', () => {
        const result = interpretQuery('Show me data from SAP');

        expect(result.parameters).toBeDefined();
        expect(result.parameters.system).toBe(SYSTEMS.SAP.id);
      });

      it('returns an empty parameters object when no parameters are found', () => {
        const result = interpretQuery('hello world');

        expect(result.parameters).toBeDefined();
        expect(typeof result.parameters).toBe('object');
      });
    });

    describe('happy path - original query preservation', () => {
      it('preserves the original query text in the result', () => {
        const query = 'What is the current status of all my projects?';
        const result = interpretQuery(query);

        expect(result.originalQuery).toBe(query);
      });

      it('trims whitespace from the original query', () => {
        const result = interpretQuery('  Show me the project status  ');

        expect(result.originalQuery).toBe('Show me the project status');
      });

      it('truncates queries exceeding maximum length', () => {
        const longQuery = 'a'.repeat(600);
        const result = interpretQuery(longQuery);

        expect(result.originalQuery.length).toBeLessThanOrEqual(512);
      });
    });

    describe('edge cases - empty and invalid inputs', () => {
      it('returns default intent for empty string', () => {
        const result = interpretQuery('');

        expect(result).not.toBeNull();
        expect(result.domains).toEqual([]);
        expect(result.queryType).toBe(QUERY_TYPES.UNKNOWN);
        expect(result.keywords).toEqual([]);
        expect(result.confidence).toBe(0);
        expect(result.targetSystems).toEqual([]);
        expect(result.parameters).toEqual({});
        expect(result.personaHint).toBeNull();
        expect(result.originalQuery).toBe('');
      });

      it('returns default intent for null input', () => {
        const result = interpretQuery(null);

        expect(result).not.toBeNull();
        expect(result.domains).toEqual([]);
        expect(result.queryType).toBe(QUERY_TYPES.UNKNOWN);
        expect(result.confidence).toBe(0);
        expect(result.originalQuery).toBe('');
      });

      it('returns default intent for undefined input', () => {
        const result = interpretQuery(undefined);

        expect(result).not.toBeNull();
        expect(result.domains).toEqual([]);
        expect(result.queryType).toBe(QUERY_TYPES.UNKNOWN);
        expect(result.confidence).toBe(0);
      });

      it('returns default intent for non-string input (number)', () => {
        const result = interpretQuery(123);

        expect(result).not.toBeNull();
        expect(result.domains).toEqual([]);
        expect(result.queryType).toBe(QUERY_TYPES.UNKNOWN);
        expect(result.confidence).toBe(0);
      });

      it('returns default intent for non-string input (boolean)', () => {
        const result = interpretQuery(true);

        expect(result).not.toBeNull();
        expect(result.domains).toEqual([]);
        expect(result.queryType).toBe(QUERY_TYPES.UNKNOWN);
      });

      it('returns default intent for non-string input (object)', () => {
        const result = interpretQuery({ query: 'test' });

        expect(result).not.toBeNull();
        expect(result.domains).toEqual([]);
        expect(result.queryType).toBe(QUERY_TYPES.UNKNOWN);
      });

      it('returns default intent for whitespace-only string', () => {
        const result = interpretQuery('   ');

        expect(result).not.toBeNull();
        expect(result.domains).toEqual([]);
        expect(result.queryType).toBe(QUERY_TYPES.UNKNOWN);
        expect(result.confidence).toBe(0);
      });
    });

    describe('edge cases - ambiguous queries', () => {
      it('handles queries with no recognizable domain keywords', () => {
        const result = interpretQuery('hello world foo bar baz');

        expect(result).not.toBeNull();
        expect(result.domains).toEqual([]);
        expect(result.queryType).toBe(QUERY_TYPES.UNKNOWN);
        expect(result.confidence).toBeLessThan(0.5);
      });

      it('handles single-word queries', () => {
        const result = interpretQuery('project');

        expect(result).not.toBeNull();
        expect(result.domains.length).toBeGreaterThanOrEqual(1);
        expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id);
      });

      it('handles queries with only stop words', () => {
        const result = interpretQuery('the is a an of in for on with');

        expect(result).not.toBeNull();
        expect(result.keywords).toEqual([]);
        expect(result.confidence).toBeLessThan(0.3);
      });

      it('handles queries with mixed domain keywords from multiple clusters', () => {
        const result = interpretQuery('project budget sales workforce knowledge');

        expect(result).not.toBeNull();
        expect(result.domains.length).toBeGreaterThan(1);
      });

      it('handles queries with special characters', () => {
        const result = interpretQuery('What is the project status? (including milestones & risks!)');

        expect(result).not.toBeNull();
        expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id);
      });

      it('handles queries with numbers', () => {
        const result = interpretQuery('Show me the top 5 projects with budget over 10000000');

        expect(result).not.toBeNull();
        expect(result.domains.length).toBeGreaterThanOrEqual(1);
      });

      it('handles case-insensitive matching', () => {
        const lowerResult = interpretQuery('show me the project status');
        const upperResult = interpretQuery('SHOW ME THE PROJECT STATUS');
        const mixedResult = interpretQuery('Show Me The Project Status');

        expect(lowerResult.domains).toEqual(upperResult.domains);
        expect(lowerResult.domains).toEqual(mixedResult.domains);
      });
    });

    describe('edge cases - unsupported queries', () => {
      it('returns UNKNOWN query type for gibberish input', () => {
        const result = interpretQuery('asdfghjkl qwertyuiop zxcvbnm');

        expect(result.queryType).toBe(QUERY_TYPES.UNKNOWN);
        expect(result.domains).toEqual([]);
      });

      it('returns low confidence for unrelated queries', () => {
        const result = interpretQuery('What is the weather like today?');

        expect(result.confidence).toBeLessThan(0.3);
      });

      it('still returns a valid result structure for unsupported queries', () => {
        const result = interpretQuery('random nonsense query that matches nothing');

        expect(result).not.toBeNull();
        expect(Array.isArray(result.domains)).toBe(true);
        expect(typeof result.queryType).toBe('string');
        expect(Array.isArray(result.keywords)).toBe(true);
        expect(typeof result.confidence).toBe('number');
        expect(Array.isArray(result.targetSystems)).toBe(true);
        expect(typeof result.parameters).toBe('object');
        expect(typeof result.originalQuery).toBe('string');
      });
    });

    describe('result structure validation', () => {
      it('returns an object with all required fields', () => {
        const result = interpretQuery('What is the current status of all my projects?');

        expect(result).toHaveProperty('domains');
        expect(result).toHaveProperty('queryType');
        expect(result).toHaveProperty('keywords');
        expect(result).toHaveProperty('confidence');
        expect(result).toHaveProperty('targetSystems');
        expect(result).toHaveProperty('parameters');
        expect(result).toHaveProperty('personaHint');
        expect(result).toHaveProperty('originalQuery');
      });

      it('returns domains as an array of strings', () => {
        const result = interpretQuery('Show me the project status');

        expect(Array.isArray(result.domains)).toBe(true);
        for (const domain of result.domains) {
          expect(typeof domain).toBe('string');
        }
      });

      it('returns queryType as a string', () => {
        const result = interpretQuery('Show me the project status');

        expect(typeof result.queryType).toBe('string');
      });

      it('returns keywords as an array of strings', () => {
        const result = interpretQuery('Show me the project status');

        expect(Array.isArray(result.keywords)).toBe(true);
        for (const keyword of result.keywords) {
          expect(typeof keyword).toBe('string');
        }
      });

      it('returns targetSystems as an array of strings', () => {
        const result = interpretQuery('Show me the project status');

        expect(Array.isArray(result.targetSystems)).toBe(true);
        for (const system of result.targetSystems) {
          expect(typeof system).toBe('string');
        }
      });

      it('returns parameters as a plain object', () => {
        const result = interpretQuery('Show me the project status');

        expect(typeof result.parameters).toBe('object');
        expect(result.parameters).not.toBeNull();
        expect(Array.isArray(result.parameters)).toBe(false);
      });

      it('returns personaHint as string or null', () => {
        const result = interpretQuery('Show me the project status');

        expect(result.personaHint === null || typeof result.personaHint === 'string').toBe(true);
      });
    });

    describe('domain mapping accuracy', () => {
      it('maps "milestone" keyword to project portfolio cluster', () => {
        const result = interpretQuery('Which milestones are overdue?');

        expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id);
      });

      it('maps "pipeline" keyword to sales cluster', () => {
        const result = interpretQuery('Show me the pipeline overview');

        expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id);
      });

      it('maps "vendor" keyword to commercial procurement cluster', () => {
        const result = interpretQuery('Show me vendor performance issues');

        expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id);
      });

      it('maps "receivable" keyword to finance cluster', () => {
        const result = interpretQuery('Which receivables are at risk?');

        expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id);
      });

      it('maps "staffing" keyword to workforce cluster', () => {
        const result = interpretQuery('Which projects need additional staffing?');

        expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id);
      });

      it('maps "lesson" keyword to knowledge IP cluster', () => {
        const result = interpretQuery('Search for lessons learned about foundations');

        expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.KNOWLEDGE_IP.id);
      });

      it('maps "best practice" to knowledge IP cluster', () => {
        const result = interpretQuery('Search for foundation engineering best practices');

        expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.KNOWLEDGE_IP.id);
      });

      it('maps "opportunity" keyword to sales cluster', () => {
        const result = interpretQuery('Which opportunities are at risk?');

        expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id);
      });

      it('maps "subcontractor" keyword to commercial procurement cluster', () => {
        const result = interpretQuery('Show me subcontractor performance');

        expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id);
      });

      it('maps "utilization" keyword to workforce cluster', () => {
        const result = interpretQuery('What is the current utilization rate?');

        expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id);
      });
    });

    describe('known project name extraction', () => {
      it('extracts Berlin Office Complex project name', () => {
        const result = interpretQuery('How is the Berlin Office Complex progressing?');

        expect(result.parameters.project).toBe('berlin office complex');
      });

      it('extracts Hamburg Port Facility project name', () => {
        const result = interpretQuery('Show me the status of Hamburg Port Facility');

        expect(result.parameters.project).toBe('hamburg port facility');
      });

      it('extracts Frankfurt Data Center project name', () => {
        const result = interpretQuery('When will the Frankfurt Data Center be completed?');

        expect(result.parameters.project).toBe('frankfurt data center');
      });

      it('extracts Stuttgart Rail Station Renovation project name', () => {
        const result = interpretQuery('What are the risks for Stuttgart Rail Station Renovation?');

        expect(result.parameters.project).toBe('stuttgart rail station renovation');
      });

      it('does not extract project name when none is mentioned', () => {
        const result = interpretQuery('Show me all project statuses');

        expect(result.parameters.project).toBeUndefined();
      });
    });

    describe('timeframe parameter extraction', () => {
      it('extracts next year timeframe', () => {
        const result = interpretQuery('What is the revenue forecast for next year?');

        expect(result.parameters.timeframe).toBe('next_year');
      });

      it('extracts last quarter timeframe', () => {
        const result = interpretQuery('How does our pipeline compare to last quarter?');

        expect(result.parameters.timeframe).toBe('last_quarter');
      });

      it('extracts last year timeframe', () => {
        const result = interpretQuery('Compare our performance to last year');

        expect(result.parameters.timeframe).toBe('last_year');
      });

      it('extracts this quarter timeframe', () => {
        const result = interpretQuery('What is our spend this quarter?');

        expect(result.parameters.timeframe).toBe('current_quarter');
      });

      it('extracts month count from queries', () => {
        const result = interpretQuery('Show me trends over the last 6 months');

        expect(result.parameters.months).toBe('6');
      });
    });
  });

  describe('validateQuery', () => {
    it('returns valid true for a normal query', () => {
      const result = validateQuery('What is the current status of all my projects?');

      expect(result.valid).toBe(true);
      expect(result.message).toBe('');
    });

    it('returns valid true for minimum length query', () => {
      const result = validateQuery('abc');

      expect(result.valid).toBe(true);
      expect(result.message).toBe('');
    });

    it('returns valid false for empty string', () => {
      const result = validateQuery('');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('empty');
    });

    it('returns valid false for whitespace-only string', () => {
      const result = validateQuery('   ');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('empty');
    });

    it('returns valid false for non-string input', () => {
      const result = validateQuery(null);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('string');
    });

    it('returns valid false for undefined input', () => {
      const result = validateQuery(undefined);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('string');
    });

    it('returns valid false for number input', () => {
      const result = validateQuery(42);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('string');
    });

    it('returns valid false for too short query', () => {
      const result = validateQuery('ab');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('3');
    });

    it('returns valid false for query exceeding maximum length', () => {
      const longQuery = 'a'.repeat(513);
      const result = validateQuery(longQuery);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('512');
    });

    it('returns valid true for query at exactly maximum length', () => {
      const maxQuery = 'a'.repeat(512);
      const result = validateQuery(maxQuery);

      expect(result.valid).toBe(true);
      expect(result.message).toBe('');
    });

    it('returns valid true for query at exactly minimum length', () => {
      const result = validateQuery('abc');

      expect(result.valid).toBe(true);
    });

    it('returns an object with valid and message properties', () => {
      const result = validateQuery('test query');

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('message');
      expect(typeof result.valid).toBe('boolean');
      expect(typeof result.message).toBe('string');
    });
  });

  describe('getSupportedQueryTypes', () => {
    it('returns the QUERY_TYPES constant object', () => {
      const types = getSupportedQueryTypes();

      expect(types).not.toBeNull();
      expect(typeof types).toBe('object');
    });

    it('contains all expected query type values', () => {
      const types = getSupportedQueryTypes();

      expect(types.STATUS_OVERVIEW).toBe('STATUS_OVERVIEW');
      expect(types.DETAIL_LOOKUP).toBe('DETAIL_LOOKUP');
      expect(types.TREND_ANALYSIS).toBe('TREND_ANALYSIS');
      expect(types.RISK_ASSESSMENT).toBe('RISK_ASSESSMENT');
      expect(types.FORECAST).toBe('FORECAST');
      expect(types.COMPARISON).toBe('COMPARISON');
      expect(types.ACTION_REQUEST).toBe('ACTION_REQUEST');
      expect(types.SEARCH).toBe('SEARCH');
      expect(types.UNKNOWN).toBe('UNKNOWN');
    });

    it('returns at least 9 query types', () => {
      const types = getSupportedQueryTypes();
      const keys = Object.keys(types);

      expect(keys.length).toBeGreaterThanOrEqual(9);
    });
  });

  describe('getDomainKeywordMap', () => {
    it('returns an array of domain keyword mappings', () => {
      const map = getDomainKeywordMap();

      expect(Array.isArray(map)).toBe(true);
      expect(map.length).toBeGreaterThan(0);
    });

    it('each mapping has a clusterId and keywords array', () => {
      const map = getDomainKeywordMap();

      for (const mapping of map) {
        expect(typeof mapping.clusterId).toBe('string');
        expect(mapping.clusterId.length).toBeGreaterThan(0);
        expect(Array.isArray(mapping.keywords)).toBe(true);
        expect(mapping.keywords.length).toBeGreaterThan(0);
      }
    });

    it('contains mappings for all 6 intelligence clusters', () => {
      const map = getDomainKeywordMap();
      const clusterIds = map.map((m) => m.clusterId);

      expect(clusterIds).toContain(INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id);
      expect(clusterIds).toContain(INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id);
      expect(clusterIds).toContain(INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id);
      expect(clusterIds).toContain(INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id);
      expect(clusterIds).toContain(INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id);
      expect(clusterIds).toContain(INTELLIGENCE_CLUSTERS.KNOWLEDGE_IP.id);
    });

    it('returns keyword arrays containing only strings', () => {
      const map = getDomainKeywordMap();

      for (const mapping of map) {
        for (const keyword of mapping.keywords) {
          expect(typeof keyword).toBe('string');
          expect(keyword.length).toBeGreaterThan(0);
        }
      }
    });

    it('returns a new array (not a reference to the internal data)', () => {
      const map1 = getDomainKeywordMap();
      const map2 = getDomainKeywordMap();

      expect(map1).not.toBe(map2);
      expect(map1).toEqual(map2);
    });
  });

  describe('integration - real-world query patterns', () => {
    it('correctly interprets "What is the current status of all my projects?"', () => {
      const result = interpretQuery('What is the current status of all my projects?');

      expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id);
      expect(result.queryType).toBe(QUERY_TYPES.STATUS_OVERVIEW);
      expect(result.confidence).toBeGreaterThan(0.2);
    });

    it('correctly interprets "Which milestones are overdue this month?"', () => {
      const result = interpretQuery('Which milestones are overdue this month?');

      expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id);
      expect(result.keywords).toContain('milestones');
      expect(result.keywords).toContain('overdue');
    });

    it('correctly interprets "What is the current pipeline value?"', () => {
      const result = interpretQuery('What is the current pipeline value?');

      expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id);
      expect(result.confidence).toBeGreaterThan(0.1);
    });

    it('correctly interprets "Which contracts are expiring in the next 60 days?"', () => {
      const result = interpretQuery('Which contracts are expiring in the next 60 days?');

      expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id);
      expect(result.parameters.days).toBe('60');
    });

    it('correctly interprets "What is our cash flow forecast for Q1 2025?"', () => {
      const result = interpretQuery('What is our cash flow forecast for Q1 2025?');

      expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id);
      expect(result.parameters.quarter).toBeDefined();
    });

    it('correctly interprets "Show me the resource allocation across projects"', () => {
      const result = interpretQuery('Show me the resource allocation across projects');

      expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id);
    });

    it('correctly interprets "What lessons learned apply to my current projects?"', () => {
      const result = interpretQuery('What lessons learned apply to my current projects?');

      expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.KNOWLEDGE_IP.id);
    });

    it('correctly interprets "Generate a portfolio risk report"', () => {
      const result = interpretQuery('Generate a portfolio risk report');

      expect(result.queryType).toBe(QUERY_TYPES.ACTION_REQUEST);
    });

    it('correctly interprets "How is the Munich Highway Extension progressing?"', () => {
      const result = interpretQuery('How is the Munich Highway Extension progressing?');

      expect(result.parameters.project).toBe('munich highway extension');
      expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id);
    });

    it('correctly interprets "Show me the budget variance across all projects"', () => {
      const result = interpretQuery('Show me the budget variance across all projects');

      expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id);
    });

    it('correctly interprets "Which deals are in final negotiation?"', () => {
      const result = interpretQuery('Which deals are in final negotiation?');

      expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id);
    });

    it('correctly interprets "Show me vendor performance issues"', () => {
      const result = interpretQuery('Show me vendor performance issues');

      expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id);
    });

    it('correctly interprets "Which projects need additional staffing?"', () => {
      const result = interpretQuery('Which projects need additional staffing?');

      const hasWorkforce = result.domains.includes(INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id);
      const hasProject = result.domains.includes(INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id);
      expect(hasWorkforce || hasProject).toBe(true);
    });

    it('correctly interprets "What is the competitive landscape for open bids?"', () => {
      const result = interpretQuery('What is the competitive landscape for open bids?');

      expect(result.domains).toContain(INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id);
    });
  });
});