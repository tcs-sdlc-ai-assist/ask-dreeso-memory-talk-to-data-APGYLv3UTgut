/**
 * Natural language query parser and domain mapping service for Ask Dreeso Memory.
 * Maps user input to business domains, query types, keywords, and confidence scores
 * using keyword matching and domain mapping against known patterns in mock data.
 *
 * @module QueryInterpreter
 * @see SCRUM-7888
 * @see SCRUM-7887
 */

import { INTELLIGENCE_CLUSTERS, PERSONAS, SYSTEMS } from '../constants';

/**
 * Query type identifiers for categorizing user intent
 * @type {Object.<string, string>}
 */
export const QUERY_TYPES = Object.freeze({
  STATUS_OVERVIEW: 'STATUS_OVERVIEW',
  DETAIL_LOOKUP: 'DETAIL_LOOKUP',
  TREND_ANALYSIS: 'TREND_ANALYSIS',
  RISK_ASSESSMENT: 'RISK_ASSESSMENT',
  FORECAST: 'FORECAST',
  COMPARISON: 'COMPARISON',
  ACTION_REQUEST: 'ACTION_REQUEST',
  SEARCH: 'SEARCH',
  UNKNOWN: 'UNKNOWN',
});

/**
 * @typedef {Object} QueryIntent
 * @property {string[]} domains - Matched intelligence cluster IDs
 * @property {string} queryType - The classified query type (from QUERY_TYPES)
 * @property {string[]} keywords - Extracted keywords from the query
 * @property {number} confidence - Confidence score between 0 and 1
 * @property {string[]} targetSystems - System IDs relevant to the query
 * @property {Object} parameters - Extracted parameters from the query
 * @property {string|null} personaHint - Suggested persona ID if detectable, or null
 * @property {string} originalQuery - The original query text
 */

/**
 * Domain keyword mapping for intelligence cluster identification.
 * Each entry maps a cluster ID to an array of keywords and a weight.
 * @type {Array<{ clusterId: string, keywords: string[], weight: number }>}
 */
const DOMAIN_KEYWORD_MAP = Object.freeze([
  {
    clusterId: INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id,
    keywords: [
      'project', 'portfolio', 'milestone', 'schedule', 'timeline',
      'completion', 'progress', 'on track', 'critical', 'overdue',
      'delay', 'deadline', 'phase', 'deliverable', 'status',
    ],
    weight: 1.0,
  },
  {
    clusterId: INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id,
    keywords: [
      'sales', 'pipeline', 'opportunity', 'deal', 'lead', 'conversion',
      'win rate', 'prospect', 'bid', 'proposal', 'client', 'customer',
      'revenue target', 'close', 'negotiation', 'competitive',
    ],
    weight: 1.0,
  },
  {
    clusterId: INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id,
    keywords: [
      'contract', 'procurement', 'vendor', 'supplier', 'commercial',
      'renewal', 'tender', 'purchase', 'sourcing', 'compliance',
      'subcontractor', 'material supply', 'equipment lease',
    ],
    weight: 1.0,
  },
  {
    clusterId: INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id,
    keywords: [
      'finance', 'cash flow', 'budget', 'revenue', 'cost', 'spend',
      'receivable', 'payable', 'variance', 'forecast', 'invoice',
      'profit', 'loss', 'margin', 'expense', 'financial',
    ],
    weight: 1.0,
  },
  {
    clusterId: INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id,
    keywords: [
      'workforce', 'resource', 'staffing', 'allocation', 'capacity',
      'team', 'headcount', 'hiring', 'utilization', 'worker',
      'personnel', 'skill', 'availability', 'reallocation',
    ],
    weight: 1.0,
  },
  {
    clusterId: INTELLIGENCE_CLUSTERS.KNOWLEDGE_IP.id,
    keywords: [
      'knowledge', 'lesson', 'learned', 'document', 'ip',
      'best practice', 'template', 'standard', 'guideline',
      'institutional', 'playbook', 'reference',
    ],
    weight: 0.9,
  },
]);

/**
 * Query type keyword mapping for intent classification.
 * Each entry maps a query type to trigger keywords and phrases.
 * @type {Array<{ queryType: string, keywords: string[], weight: number }>}
 */
const QUERY_TYPE_MAP = Object.freeze([
  {
    queryType: QUERY_TYPES.STATUS_OVERVIEW,
    keywords: [
      'status', 'overview', 'summary', 'current', 'show me',
      'what is', 'how is', 'dashboard', 'snapshot', 'all',
    ],
    weight: 1.0,
  },
  {
    queryType: QUERY_TYPES.DETAIL_LOOKUP,
    keywords: [
      'detail', 'specific', 'particular', 'which', 'who',
      'where', 'when', 'find', 'lookup', 'get',
    ],
    weight: 1.0,
  },
  {
    queryType: QUERY_TYPES.TREND_ANALYSIS,
    keywords: [
      'trend', 'analysis', 'compare', 'over time', 'historical',
      'change', 'growth', 'decline', 'pattern', 'quarter',
    ],
    weight: 1.0,
  },
  {
    queryType: QUERY_TYPES.RISK_ASSESSMENT,
    keywords: [
      'risk', 'alert', 'warning', 'critical', 'issue',
      'problem', 'concern', 'threat', 'flag', 'overdue',
    ],
    weight: 1.0,
  },
  {
    queryType: QUERY_TYPES.FORECAST,
    keywords: [
      'forecast', 'predict', 'projection', 'estimate', 'expected',
      'future', 'next quarter', 'next year', 'projected', 'outlook',
    ],
    weight: 1.0,
  },
  {
    queryType: QUERY_TYPES.COMPARISON,
    keywords: [
      'compare', 'versus', 'vs', 'difference', 'between',
      'against', 'benchmark', 'relative', 'better', 'worse',
    ],
    weight: 1.0,
  },
  {
    queryType: QUERY_TYPES.ACTION_REQUEST,
    keywords: [
      'schedule', 'create', 'generate', 'send', 'update',
      'initiate', 'execute', 'approve', 'export', 'share',
      'escalate', 'assign', 'request',
    ],
    weight: 1.0,
  },
  {
    queryType: QUERY_TYPES.SEARCH,
    keywords: [
      'search', 'find', 'look for', 'locate', 'where is',
      'any', 'list', 'show', 'display',
    ],
    weight: 0.8,
  },
]);

/**
 * System keyword mapping for target system identification.
 * @type {Array<{ systemId: string, keywords: string[] }>}
 */
const SYSTEM_KEYWORD_MAP = Object.freeze([
  {
    systemId: SYSTEMS.SAP.id,
    keywords: ['sap', 'erp', 'financial', 'finance', 'invoice', 'procurement', 'budget', 'payable', 'receivable'],
  },
  {
    systemId: SYSTEMS.PROCORE.id,
    keywords: ['procore', 'construction', 'project management', 'workforce', 'site', 'field'],
  },
  {
    systemId: SYSTEMS.SALESFORCE.id,
    keywords: ['salesforce', 'crm', 'pipeline', 'lead', 'opportunity', 'deal', 'sales', 'client'],
  },
  {
    systemId: SYSTEMS.PRIMAVERA.id,
    keywords: ['primavera', 'scheduling', 'schedule', 'timeline', 'milestone', 'gantt', 'critical path'],
  },
]);

/**
 * Persona hint keyword mapping for persona detection from query text.
 * @type {Array<{ personaId: string, keywords: string[] }>}
 */
const PERSONA_HINT_MAP = Object.freeze([
  {
    personaId: PERSONAS.LUKAS.id,
    keywords: ['project', 'portfolio', 'milestone', 'schedule', 'resource', 'workforce', 'staffing'],
  },
  {
    personaId: PERSONAS.ELENA.id,
    keywords: ['contract', 'procurement', 'vendor', 'supplier', 'commercial', 'tender'],
  },
  {
    personaId: PERSONAS.SOPHIE.id,
    keywords: ['finance', 'cash flow', 'budget', 'revenue', 'cost', 'invoice', 'forecast'],
  },
  {
    personaId: PERSONAS.JAMES.id,
    keywords: ['sales', 'pipeline', 'lead', 'opportunity', 'deal', 'business development', 'client'],
  },
]);

/**
 * Known project name patterns for parameter extraction.
 * @type {string[]}
 */
const KNOWN_PROJECT_NAMES = Object.freeze([
  'munich highway extension',
  'berlin office complex',
  'hamburg port facility',
  'frankfurt data center',
  'stuttgart rail station renovation',
  'düsseldorf airport terminal expansion',
  'cologne residential development',
  'leipzig logistics hub',
  'dresden tech campus',
  'nuremberg hospital wing',
]);

/**
 * Maximum allowed query length in characters
 * @type {number}
 */
const MAX_QUERY_LENGTH = 512;

/**
 * Normalizes a string for comparison by trimming and lowercasing
 * @param {string} value - The string to normalize
 * @returns {string} The normalized string, or empty string if invalid
 */
function normalize(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().toLowerCase();
}

/**
 * Extracts meaningful keywords from a query string by removing stop words
 * @param {string} queryText - The normalized query text
 * @returns {string[]} Array of extracted keywords
 */
function extractKeywords(queryText) {
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over',
    'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
    'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
    'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
    'same', 'so', 'than', 'too', 'very', 'just', 'because', 'but', 'and',
    'or', 'if', 'while', 'about', 'up', 'it', 'its', 'i', 'me', 'my',
    'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'they',
    'them', 'their', 'this', 'that', 'these', 'those', 'am', 'what',
  ]);

  const words = queryText
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1 && !stopWords.has(word));

  return [...new Set(words)];
}

/**
 * Scores keyword matches between a query and a keyword list.
 * Supports both single-word and multi-word phrase matching.
 * @param {string} normalizedQuery - The normalized query text
 * @param {string[]} keywords - The keyword list to match against
 * @returns {{ matchCount: number, matchedKeywords: string[] }} Match results
 */
function scoreKeywordMatches(normalizedQuery, keywords) {
  let matchCount = 0;
  const matchedKeywords = [];

  for (const keyword of keywords) {
    if (normalizedQuery.includes(keyword)) {
      matchCount += 1;
      matchedKeywords.push(keyword);
    }
  }

  return { matchCount, matchedKeywords };
}

/**
 * Identifies matching intelligence cluster domains from query text
 * @param {string} normalizedQuery - The normalized query text
 * @returns {Array<{ clusterId: string, score: number, matchedKeywords: string[] }>} Scored domain matches
 */
function identifyDomains(normalizedQuery) {
  const results = [];

  for (const mapping of DOMAIN_KEYWORD_MAP) {
    const { matchCount, matchedKeywords } = scoreKeywordMatches(normalizedQuery, mapping.keywords);

    if (matchCount > 0) {
      const score = (matchCount / mapping.keywords.length) * mapping.weight;
      results.push({
        clusterId: mapping.clusterId,
        score,
        matchedKeywords,
      });
    }
  }

  results.sort((a, b) => b.score - a.score);

  return results;
}

/**
 * Classifies the query type based on keyword matching
 * @param {string} normalizedQuery - The normalized query text
 * @returns {{ queryType: string, score: number }} The classified query type and confidence
 */
function classifyQueryType(normalizedQuery) {
  let bestMatch = { queryType: QUERY_TYPES.UNKNOWN, score: 0 };

  for (const mapping of QUERY_TYPE_MAP) {
    const { matchCount } = scoreKeywordMatches(normalizedQuery, mapping.keywords);

    if (matchCount > 0) {
      const score = (matchCount / mapping.keywords.length) * mapping.weight;
      if (score > bestMatch.score) {
        bestMatch = { queryType: mapping.queryType, score };
      }
    }
  }

  return bestMatch;
}

/**
 * Identifies target systems from query text
 * @param {string} normalizedQuery - The normalized query text
 * @param {string[]} domainIds - Matched domain cluster IDs for system inference
 * @returns {string[]} Array of matched system IDs
 */
function identifyTargetSystems(normalizedQuery, domainIds) {
  const systemIds = new Set();

  // Direct keyword matching
  for (const mapping of SYSTEM_KEYWORD_MAP) {
    const { matchCount } = scoreKeywordMatches(normalizedQuery, mapping.keywords);
    if (matchCount > 0) {
      systemIds.add(mapping.systemId);
    }
  }

  // Infer systems from matched domains
  if (systemIds.size === 0 && domainIds.length > 0) {
    const domainToSystems = {
      [INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id]: [SYSTEMS.PROCORE.id, SYSTEMS.PRIMAVERA.id, SYSTEMS.SAP.id],
      [INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id]: [SYSTEMS.SALESFORCE.id],
      [INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id]: [SYSTEMS.SAP.id, SYSTEMS.PROCORE.id],
      [INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id]: [SYSTEMS.SAP.id, SYSTEMS.PRIMAVERA.id],
      [INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id]: [SYSTEMS.PROCORE.id, SYSTEMS.PRIMAVERA.id],
      [INTELLIGENCE_CLUSTERS.KNOWLEDGE_IP.id]: [SYSTEMS.PROCORE.id, SYSTEMS.PRIMAVERA.id],
    };

    for (const domainId of domainIds) {
      const systems = domainToSystems[domainId];
      if (systems) {
        for (const sysId of systems) {
          systemIds.add(sysId);
        }
      }
    }
  }

  return [...systemIds];
}

/**
 * Detects a persona hint from the query text
 * @param {string} normalizedQuery - The normalized query text
 * @returns {string|null} The suggested persona ID, or null if not detectable
 */
function detectPersonaHint(normalizedQuery) {
  let bestMatch = null;
  let bestScore = 0;

  // Check for explicit persona name mentions
  const personaValues = Object.values(PERSONAS);
  for (const persona of personaValues) {
    if (normalizedQuery.includes(persona.name.toLowerCase())) {
      return persona.id;
    }
  }

  // Keyword-based persona detection
  for (const mapping of PERSONA_HINT_MAP) {
    const { matchCount } = scoreKeywordMatches(normalizedQuery, mapping.keywords);
    if (matchCount > bestScore) {
      bestScore = matchCount;
      bestMatch = mapping.personaId;
    }
  }

  return bestScore >= 2 ? bestMatch : null;
}

/**
 * Extracts structured parameters from the query text
 * @param {string} normalizedQuery - The normalized query text
 * @returns {Object} Extracted parameters
 */
function extractParameters(normalizedQuery) {
  const parameters = {};

  // Extract project name references
  for (const projectName of KNOWN_PROJECT_NAMES) {
    if (normalizedQuery.includes(projectName)) {
      parameters.project = projectName;
      break;
    }
  }

  // Extract time references
  const timePatterns = [
    { pattern: /q[1-4]\s*20\d{2}/i, key: 'quarter' },
    { pattern: /next\s+quarter/i, key: 'timeframe', value: 'next_quarter' },
    { pattern: /this\s+quarter/i, key: 'timeframe', value: 'current_quarter' },
    { pattern: /next\s+year/i, key: 'timeframe', value: 'next_year' },
    { pattern: /this\s+year/i, key: 'timeframe', value: 'current_year' },
    { pattern: /last\s+quarter/i, key: 'timeframe', value: 'last_quarter' },
    { pattern: /last\s+year/i, key: 'timeframe', value: 'last_year' },
    { pattern: /(\d+)\s+days?/i, key: 'days' },
    { pattern: /(\d+)\s+months?/i, key: 'months' },
  ];

  for (const tp of timePatterns) {
    const match = normalizedQuery.match(tp.pattern);
    if (match) {
      if (tp.value) {
        parameters[tp.key] = tp.value;
      } else if (match[1]) {
        parameters[tp.key] = match[1];
      } else {
        parameters[tp.key] = match[0];
      }
    }
  }

  // Extract severity/priority references
  const severityKeywords = ['critical', 'high', 'medium', 'low'];
  for (const severity of severityKeywords) {
    if (normalizedQuery.includes(severity)) {
      parameters.severity = severity;
      break;
    }
  }

  // Extract system name references
  const systemValues = Object.values(SYSTEMS);
  for (const system of systemValues) {
    if (normalizedQuery.includes(system.label.toLowerCase())) {
      parameters.system = system.id;
      break;
    }
  }

  return parameters;
}

/**
 * Calculates overall confidence score based on domain matches, query type, and keyword density
 * @param {Array<{ clusterId: string, score: number }>} domainMatches - Domain match results
 * @param {{ queryType: string, score: number }} queryTypeResult - Query type classification result
 * @param {string[]} keywords - Extracted keywords
 * @param {string} normalizedQuery - The normalized query text
 * @returns {number} Confidence score between 0 and 1
 */
function calculateConfidence(domainMatches, queryTypeResult, keywords, normalizedQuery) {
  if (normalizedQuery.length === 0) {
    return 0;
  }

  let confidence = 0;

  // Domain match contribution (up to 0.4)
  if (domainMatches.length > 0) {
    const topDomainScore = Math.min(domainMatches[0].score * 4, 0.4);
    confidence += topDomainScore;
  }

  // Query type contribution (up to 0.3)
  if (queryTypeResult.queryType !== QUERY_TYPES.UNKNOWN) {
    const typeScore = Math.min(queryTypeResult.score * 3, 0.3);
    confidence += typeScore;
  }

  // Keyword density contribution (up to 0.2)
  const wordCount = normalizedQuery.split(/\s+/).length;
  if (wordCount > 0 && keywords.length > 0) {
    const density = Math.min(keywords.length / wordCount, 1);
    confidence += density * 0.2;
  }

  // Query length contribution (up to 0.1) — longer queries tend to be more specific
  if (normalizedQuery.length >= 10) {
    confidence += 0.05;
  }
  if (normalizedQuery.length >= 30) {
    confidence += 0.05;
  }

  return Math.min(Math.round(confidence * 100) / 100, 1);
}

/**
 * Interprets a natural language query and maps it to business domains, query types,
 * keywords, target systems, and a confidence score.
 *
 * @param {string} queryText - The natural language query text from the user
 * @returns {QueryIntent} The interpreted query intent object
 */
export function interpretQuery(queryText) {
  // Validate input
  if (typeof queryText !== 'string' || queryText.trim().length === 0) {
    return {
      domains: [],
      queryType: QUERY_TYPES.UNKNOWN,
      keywords: [],
      confidence: 0,
      targetSystems: [],
      parameters: {},
      personaHint: null,
      originalQuery: typeof queryText === 'string' ? queryText : '',
    };
  }

  // Truncate to max length
  const trimmedQuery = queryText.trim().substring(0, MAX_QUERY_LENGTH);
  const normalizedQuery = normalize(trimmedQuery);

  // Extract keywords
  const keywords = extractKeywords(normalizedQuery);

  // Identify domains
  const domainMatches = identifyDomains(normalizedQuery);
  const domains = domainMatches.map((match) => match.clusterId);

  // Classify query type
  const queryTypeResult = classifyQueryType(normalizedQuery);

  // Identify target systems
  const targetSystems = identifyTargetSystems(normalizedQuery, domains);

  // Detect persona hint
  const personaHint = detectPersonaHint(normalizedQuery);

  // Extract parameters
  const parameters = extractParameters(normalizedQuery);

  // Calculate confidence
  const confidence = calculateConfidence(domainMatches, queryTypeResult, keywords, normalizedQuery);

  return {
    domains,
    queryType: queryTypeResult.queryType,
    keywords,
    confidence,
    targetSystems,
    parameters,
    personaHint,
    originalQuery: trimmedQuery,
  };
}

/**
 * Returns all supported query types.
 *
 * @returns {Object.<string, string>} The QUERY_TYPES constant object
 */
export function getSupportedQueryTypes() {
  return QUERY_TYPES;
}

/**
 * Returns all domain keyword mappings for external inspection or testing.
 *
 * @returns {Array<{ clusterId: string, keywords: string[] }>} Domain keyword mappings
 */
export function getDomainKeywordMap() {
  return DOMAIN_KEYWORD_MAP.map((mapping) => ({
    clusterId: mapping.clusterId,
    keywords: [...mapping.keywords],
  }));
}

/**
 * Validates whether a query text is suitable for interpretation.
 * Checks for minimum length, non-empty content, and maximum length.
 *
 * @param {string} queryText - The query text to validate
 * @returns {{ valid: boolean, message: string }} Validation result
 */
export function validateQuery(queryText) {
  if (typeof queryText !== 'string') {
    return { valid: false, message: 'Query must be a string.' };
  }

  const trimmed = queryText.trim();

  if (trimmed.length === 0) {
    return { valid: false, message: 'Query cannot be empty.' };
  }

  if (trimmed.length < 3) {
    return { valid: false, message: 'Query must be at least 3 characters long.' };
  }

  if (trimmed.length > MAX_QUERY_LENGTH) {
    return { valid: false, message: `Query must not exceed ${MAX_QUERY_LENGTH} characters.` };
  }

  return { valid: true, message: '' };
}