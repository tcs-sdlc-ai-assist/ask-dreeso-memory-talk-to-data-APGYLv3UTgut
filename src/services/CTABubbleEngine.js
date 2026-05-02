/**
 * Contextual CTA bubble generator for Ask Dreeso Memory.
 * Generates contextual follow-up query suggestions based on the current
 * query result and persona context. Returns arrays of 3-4 CTA bubbles
 * with labels, icons, and target actions.
 *
 * @module CTABubbleEngine
 * @see SCRUM-7889
 */

import { PERSONAS, INTELLIGENCE_CLUSTERS } from '../constants';

/**
 * @typedef {Object} CTABubble
 * @property {string} id - Unique bubble identifier
 * @property {string} label - Display label for the CTA bubble
 * @property {string} icon - Emoji or icon identifier
 * @property {string} query - Follow-up query text to execute
 * @property {string} type - CTA type ('query', 'action', 'navigate', 'report')
 * @property {string} priority - Priority level ('high', 'medium', 'low')
 * @property {string|null} actionId - Associated action ID if type is 'action', or null
 * @property {string|null} clusterId - Target intelligence cluster ID, or null
 */

/**
 * Maximum number of CTA bubbles to return
 * @type {number}
 */
const MAX_BUBBLES = 4;

/**
 * Minimum number of CTA bubbles to return
 * @type {number}
 */
const MIN_BUBBLES = 3;

/**
 * CTA templates organized by intelligence cluster ID.
 * Each cluster has a set of contextual follow-up suggestions.
 * @type {Object.<string, Array<{ label: string, icon: string, query: string, type: string, priority: string, actionId: string|null }>>}
 */
const CLUSTER_CTA_TEMPLATES = Object.freeze({
  [INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id]: [
    {
      label: 'View Critical Project Details',
      icon: '🔍',
      query: 'Show me details for the most critical project',
      type: 'query',
      priority: 'high',
      actionId: null,
    },
    {
      label: 'Generate Portfolio Risk Report',
      icon: '📊',
      query: 'Generate a portfolio risk report',
      type: 'report',
      priority: 'medium',
      actionId: 'act-pp-002',
    },
    {
      label: 'Show Overdue Milestones',
      icon: '⏰',
      query: 'Which milestones are overdue this month?',
      type: 'query',
      priority: 'high',
      actionId: null,
    },
    {
      label: 'Schedule Resource Meeting',
      icon: '📅',
      query: 'Schedule a resource reallocation meeting',
      type: 'action',
      priority: 'medium',
      actionId: 'act-pp-003',
    },
    {
      label: 'View Resource Allocation',
      icon: '👥',
      query: 'Show me the resource allocation across projects',
      type: 'query',
      priority: 'medium',
      actionId: null,
    },
    {
      label: 'Update Project Schedule',
      icon: '🔄',
      query: 'Update the project schedule for overdue items',
      type: 'action',
      priority: 'medium',
      actionId: 'act-pp-005',
    },
  ],
  [INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id]: [
    {
      label: 'Review Final Stage Deals',
      icon: '💼',
      query: 'Which deals are in final negotiation?',
      type: 'query',
      priority: 'high',
      actionId: null,
    },
    {
      label: 'Generate Win/Loss Analysis',
      icon: '📈',
      query: 'Generate a win/loss analysis report',
      type: 'report',
      priority: 'medium',
      actionId: 'act-sp-002',
    },
    {
      label: 'View Lead Conversion Rates',
      icon: '🎯',
      query: 'Show me the lead conversion analysis',
      type: 'query',
      priority: 'medium',
      actionId: null,
    },
    {
      label: 'Schedule Deal Review',
      icon: '📅',
      query: 'Schedule a deal review meeting',
      type: 'action',
      priority: 'medium',
      actionId: 'act-sp-003',
    },
    {
      label: 'Check Competitive Landscape',
      icon: '🏢',
      query: 'What is the competitive landscape for open bids?',
      type: 'query',
      priority: 'low',
      actionId: null,
    },
  ],
  [INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id]: [
    {
      label: 'Initiate Contract Renewals',
      icon: '📝',
      query: 'Initiate renewal workflows for expiring contracts',
      type: 'action',
      priority: 'high',
      actionId: 'act-cm-001',
    },
    {
      label: 'Review Vendor Issues',
      icon: '⚠️',
      query: 'Show me vendor performance issues',
      type: 'query',
      priority: 'high',
      actionId: null,
    },
    {
      label: 'Procurement Savings Report',
      icon: '💰',
      query: 'Generate a procurement savings report',
      type: 'report',
      priority: 'medium',
      actionId: 'act-cm-003',
    },
    {
      label: 'Review Material Costs',
      icon: '📋',
      query: 'How have material costs changed this quarter?',
      type: 'query',
      priority: 'medium',
      actionId: null,
    },
    {
      label: 'Explore Alternative Suppliers',
      icon: '🔎',
      query: 'What alternative suppliers are available for steel?',
      type: 'query',
      priority: 'low',
      actionId: null,
    },
  ],
  [INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id]: [
    {
      label: 'Review At-Risk Receivables',
      icon: '💳',
      query: 'Which receivables are at risk?',
      type: 'query',
      priority: 'high',
      actionId: null,
    },
    {
      label: 'Generate Cash Flow Report',
      icon: '📊',
      query: 'Generate a cash flow report for Q1 2025',
      type: 'report',
      priority: 'medium',
      actionId: 'act-fc-002',
    },
    {
      label: 'View Budget Variance',
      icon: '📉',
      query: 'Show me the budget variance across all projects',
      type: 'query',
      priority: 'medium',
      actionId: null,
    },
    {
      label: 'Optimize Payment Schedule',
      icon: '🔄',
      query: 'Optimize the payment schedule for upcoming payables',
      type: 'action',
      priority: 'medium',
      actionId: 'act-fc-003',
    },
    {
      label: 'Request Budget Revision',
      icon: '📝',
      query: 'Request a budget revision for over-budget projects',
      type: 'action',
      priority: 'high',
      actionId: 'act-fc-005',
    },
  ],
  [INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id]: [
    {
      label: 'Reallocate Resources',
      icon: '🔄',
      query: 'Reallocate resources from Frankfurt Data Center',
      type: 'action',
      priority: 'high',
      actionId: 'act-wf-001',
    },
    {
      label: 'Request Additional Staffing',
      icon: '👤',
      query: 'Request additional staffing for understaffed projects',
      type: 'action',
      priority: 'high',
      actionId: 'act-wf-002',
    },
    {
      label: 'View Capacity Forecast',
      icon: '📊',
      query: 'Show me the capacity forecast for next quarter',
      type: 'query',
      priority: 'medium',
      actionId: null,
    },
    {
      label: 'Check Skill Gaps',
      icon: '🎓',
      query: 'Which projects need additional staffing?',
      type: 'query',
      priority: 'medium',
      actionId: null,
    },
  ],
  [INTELLIGENCE_CLUSTERS.KNOWLEDGE_IP.id]: [
    {
      label: 'Apply Lesson to Project',
      icon: '✅',
      query: 'Apply this lesson to the current project',
      type: 'action',
      priority: 'medium',
      actionId: 'act-ki-001',
    },
    {
      label: 'Share with Team',
      icon: '📤',
      query: 'Share these findings with the project team',
      type: 'action',
      priority: 'low',
      actionId: 'act-ki-002',
    },
    {
      label: 'Create New Lesson',
      icon: '📝',
      query: 'Create a new lessons learned entry',
      type: 'action',
      priority: 'low',
      actionId: 'act-ki-003',
    },
    {
      label: 'Search Related Documents',
      icon: '🔍',
      query: 'What lessons learned apply to my current projects?',
      type: 'query',
      priority: 'medium',
      actionId: null,
    },
  ],
});

/**
 * Persona-specific CTA templates that supplement cluster-based CTAs.
 * @type {Object.<string, Array<{ label: string, icon: string, query: string, type: string, priority: string, actionId: string|null }>>}
 */
const PERSONA_CTA_TEMPLATES = Object.freeze({
  [PERSONAS.LUKAS.id]: [
    {
      label: 'Portfolio Overview',
      icon: '📊',
      query: 'What is the current status of all my projects?',
      type: 'query',
      priority: 'medium',
      actionId: null,
    },
    {
      label: 'Top Portfolio Risks',
      icon: '⚠️',
      query: 'What are the top risks in my portfolio?',
      type: 'query',
      priority: 'high',
      actionId: null,
    },
    {
      label: 'Schedule Forecast',
      icon: '📅',
      query: 'Show me the schedule forecast for Q1 2025',
      type: 'query',
      priority: 'medium',
      actionId: null,
    },
  ],
  [PERSONAS.ELENA.id]: [
    {
      label: 'Expiring Contracts',
      icon: '📋',
      query: 'Which contracts are expiring in the next 60 days?',
      type: 'query',
      priority: 'high',
      actionId: null,
    },
    {
      label: 'Spend vs Budget',
      icon: '💰',
      query: 'What is our procurement spend vs budget?',
      type: 'query',
      priority: 'medium',
      actionId: null,
    },
    {
      label: 'Vendor Renegotiation',
      icon: '🤝',
      query: 'Which vendors should we renegotiate with?',
      type: 'query',
      priority: 'medium',
      actionId: null,
    },
  ],
  [PERSONAS.SOPHIE.id]: [
    {
      label: 'Cash Flow Forecast',
      icon: '💰',
      query: 'What is our cash flow forecast for Q1 2025?',
      type: 'query',
      priority: 'high',
      actionId: null,
    },
    {
      label: 'Revenue Forecast',
      icon: '📈',
      query: 'What is the revenue forecast for next year?',
      type: 'query',
      priority: 'medium',
      actionId: null,
    },
    {
      label: 'Over-Budget Projects',
      icon: '🚨',
      query: 'Which projects are over budget?',
      type: 'query',
      priority: 'high',
      actionId: null,
    },
  ],
  [PERSONAS.JAMES.id]: [
    {
      label: 'Pipeline Value',
      icon: '📈',
      query: 'What is the current pipeline value?',
      type: 'query',
      priority: 'high',
      actionId: null,
    },
    {
      label: 'Win Rate Trend',
      icon: '🏆',
      query: 'What is our win rate trend?',
      type: 'query',
      priority: 'medium',
      actionId: null,
    },
    {
      label: 'At-Risk Opportunities',
      icon: '⚠️',
      query: 'Which opportunities are at risk?',
      type: 'query',
      priority: 'high',
      actionId: null,
    },
  ],
});

/**
 * Generic fallback CTA templates used when no cluster or persona match is found.
 * @type {Array<{ label: string, icon: string, query: string, type: string, priority: string, actionId: string|null }>}
 */
const FALLBACK_CTA_TEMPLATES = Object.freeze([
  {
    label: 'View Dashboard',
    icon: '📊',
    query: 'Show me the dashboard overview',
    type: 'navigate',
    priority: 'medium',
    actionId: null,
  },
  {
    label: 'Check Risk Alerts',
    icon: '⚠️',
    query: 'What are the top risks across all projects?',
    type: 'query',
    priority: 'high',
    actionId: null,
  },
  {
    label: 'Search Knowledge Base',
    icon: '🔍',
    query: 'What lessons learned apply to my current projects?',
    type: 'query',
    priority: 'medium',
    actionId: null,
  },
  {
    label: 'View System Status',
    icon: '🖥️',
    query: 'Show me the status of all connected systems',
    type: 'navigate',
    priority: 'low',
    actionId: null,
  },
]);

/**
 * Generates a unique identifier for a CTA bubble
 * @returns {string} A unique CTA bubble ID
 */
function generateBubbleId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `cta-${timestamp}-${random}`;
}

/**
 * Resolves a persona key to a valid persona ID.
 * Accepts persona IDs (e.g., 'lukas'), PERSONAS constant keys (e.g., 'LUKAS'),
 * or persona names (e.g., 'Lukas').
 *
 * @param {string} persona - The persona key, ID, or name
 * @returns {string|null} The resolved persona ID, or null if not found
 */
function resolvePersonaId(persona) {
  if (typeof persona !== 'string' || persona.trim().length === 0) {
    return null;
  }

  const trimmed = persona.trim();

  // Check direct persona IDs (e.g., 'lukas')
  const personaValues = Object.values(PERSONAS);
  const directMatch = personaValues.find((p) => p.id === trimmed);
  if (directMatch) {
    return directMatch.id;
  }

  // Check PERSONAS constant keys (e.g., 'LUKAS')
  const upperKey = trimmed.toUpperCase();
  if (PERSONAS[upperKey] && PERSONAS[upperKey].id) {
    return PERSONAS[upperKey].id;
  }

  // Check persona names (e.g., 'Lukas')
  const nameMatch = personaValues.find(
    (p) => p.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (nameMatch) {
    return nameMatch.id;
  }

  return null;
}

/**
 * Extracts the cluster ID from a query result object.
 * Handles both single results and arrays of results.
 *
 * @param {Object|Object[]} queryResult - The query result or array of results
 * @returns {string|null} The cluster ID, or null if not found
 */
function extractClusterId(queryResult) {
  if (!queryResult) {
    return null;
  }

  // If it's an array, use the first result
  if (Array.isArray(queryResult)) {
    if (queryResult.length === 0) {
      return null;
    }
    const first = queryResult[0];
    return typeof first.clusterId === 'string' ? first.clusterId : null;
  }

  // If it's an orchestration result with aggregatedResults
  if (queryResult.aggregatedResults && Array.isArray(queryResult.aggregatedResults.results)) {
    const results = queryResult.aggregatedResults.results;
    if (results.length > 0 && typeof results[0].clusterId === 'string') {
      return results[0].clusterId;
    }
    // Check clusters array
    if (Array.isArray(queryResult.aggregatedResults.clusters) && queryResult.aggregatedResults.clusters.length > 0) {
      return queryResult.aggregatedResults.clusters[0];
    }
    return null;
  }

  // Direct result object
  if (typeof queryResult.clusterId === 'string') {
    return queryResult.clusterId;
  }

  return null;
}

/**
 * Extracts all cluster IDs from a query result object.
 *
 * @param {Object|Object[]} queryResult - The query result or array of results
 * @returns {string[]} Array of unique cluster IDs
 */
function extractAllClusterIds(queryResult) {
  if (!queryResult) {
    return [];
  }

  const clusterIds = new Set();

  if (Array.isArray(queryResult)) {
    for (const result of queryResult) {
      if (result && typeof result.clusterId === 'string') {
        clusterIds.add(result.clusterId);
      }
    }
    return [...clusterIds];
  }

  if (queryResult.aggregatedResults) {
    if (Array.isArray(queryResult.aggregatedResults.clusters)) {
      for (const cid of queryResult.aggregatedResults.clusters) {
        clusterIds.add(cid);
      }
    }
    if (Array.isArray(queryResult.aggregatedResults.results)) {
      for (const result of queryResult.aggregatedResults.results) {
        if (result && typeof result.clusterId === 'string') {
          clusterIds.add(result.clusterId);
        }
      }
    }
    return [...clusterIds];
  }

  if (typeof queryResult.clusterId === 'string') {
    clusterIds.add(queryResult.clusterId);
  }

  return [...clusterIds];
}

/**
 * Extracts action IDs from a query result to avoid suggesting already-available actions.
 *
 * @param {Object|Object[]} queryResult - The query result or array of results
 * @returns {string[]} Array of action IDs present in the result
 */
function extractExistingActionIds(queryResult) {
  if (!queryResult) {
    return [];
  }

  const actionIds = new Set();

  const processResult = (result) => {
    if (result && Array.isArray(result.actions)) {
      for (const action of result.actions) {
        if (action && typeof action.id === 'string') {
          actionIds.add(action.id);
        }
      }
    }
  };

  if (Array.isArray(queryResult)) {
    for (const result of queryResult) {
      processResult(result);
    }
  } else if (queryResult.aggregatedResults && Array.isArray(queryResult.aggregatedResults.results)) {
    for (const result of queryResult.aggregatedResults.results) {
      processResult(result);
    }
  } else {
    processResult(queryResult);
  }

  return [...actionIds];
}

/**
 * Checks whether a query result contains risk signals.
 *
 * @param {Object|Object[]} queryResult - The query result or array of results
 * @returns {boolean} True if risk signals are present
 */
function hasRiskSignals(queryResult) {
  if (!queryResult) {
    return false;
  }

  const checkResult = (result) => {
    return result && Array.isArray(result.riskSignals) && result.riskSignals.length > 0;
  };

  if (Array.isArray(queryResult)) {
    return queryResult.some(checkResult);
  }

  if (queryResult.aggregatedResults && Array.isArray(queryResult.aggregatedResults.results)) {
    return queryResult.aggregatedResults.results.some(checkResult);
  }

  return checkResult(queryResult);
}

/**
 * Generates risk-specific CTA bubbles when risk signals are detected.
 *
 * @param {Object|Object[]} queryResult - The query result or array of results
 * @returns {Array<{ label: string, icon: string, query: string, type: string, priority: string, actionId: string|null }>} Risk-related CTA templates
 */
function generateRiskCTAs(queryResult) {
  if (!hasRiskSignals(queryResult)) {
    return [];
  }

  return [
    {
      label: 'View Risk Details',
      icon: '🚨',
      query: 'Show me detailed risk analysis for flagged items',
      type: 'query',
      priority: 'high',
      actionId: null,
    },
    {
      label: 'Escalate Critical Risks',
      icon: '📢',
      query: 'Escalate critical risk items to stakeholders',
      type: 'action',
      priority: 'high',
      actionId: null,
    },
  ];
}

/**
 * Deduplicates CTA templates by label to avoid showing duplicate suggestions.
 *
 * @param {Array<Object>} templates - Array of CTA template objects
 * @returns {Array<Object>} Deduplicated array of CTA templates
 */
function deduplicateTemplates(templates) {
  if (!Array.isArray(templates)) {
    return [];
  }

  const seen = new Set();
  const unique = [];

  for (const template of templates) {
    if (template && typeof template.label === 'string') {
      const key = template.label.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(template);
      }
    }
  }

  return unique;
}

/**
 * Sorts CTA templates by priority (high > medium > low).
 *
 * @param {Array<Object>} templates - Array of CTA template objects
 * @returns {Array<Object>} Sorted array of CTA templates
 */
function sortByPriority(templates) {
  if (!Array.isArray(templates)) {
    return [];
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 };

  return [...templates].sort((a, b) => {
    const aPriority = priorityOrder[a.priority] !== undefined ? priorityOrder[a.priority] : 3;
    const bPriority = priorityOrder[b.priority] !== undefined ? priorityOrder[b.priority] : 3;
    return aPriority - bPriority;
  });
}

/**
 * Converts a CTA template into a full CTABubble object with a unique ID and cluster context.
 *
 * @param {Object} template - The CTA template object
 * @param {string|null} clusterId - The target cluster ID, or null
 * @returns {CTABubble} The complete CTA bubble object
 */
function templateToBubble(template, clusterId) {
  return {
    id: generateBubbleId(),
    label: template.label,
    icon: template.icon,
    query: template.query,
    type: template.type,
    priority: template.priority,
    actionId: template.actionId || null,
    clusterId: clusterId || null,
  };
}

/**
 * Generates contextual CTA bubbles based on a query result and persona context.
 * Returns an array of 3-4 follow-up query suggestions with labels, icons,
 * and target actions. Prioritizes cluster-specific CTAs, supplements with
 * persona-specific CTAs, and falls back to generic CTAs when needed.
 *
 * @param {Object|Object[]} queryResult - The query result object or array of results
 * @param {string} [persona] - The persona key, ID, or name (optional)
 * @returns {CTABubble[]} Array of 3-4 CTA bubble objects
 */
export function getCTABubbles(queryResult, persona) {
  const candidateTemplates = [];

  // Extract cluster context from the query result
  const primaryClusterId = extractClusterId(queryResult);
  const allClusterIds = extractAllClusterIds(queryResult);

  // Resolve persona ID
  const personaId = typeof persona === 'string' ? resolvePersonaId(persona) : null;

  // Step 1: Add risk-specific CTAs if risk signals are present
  const riskCTAs = generateRiskCTAs(queryResult);
  for (const cta of riskCTAs) {
    candidateTemplates.push(cta);
  }

  // Step 2: Add cluster-specific CTAs for the primary cluster
  if (primaryClusterId && CLUSTER_CTA_TEMPLATES[primaryClusterId]) {
    const clusterTemplates = CLUSTER_CTA_TEMPLATES[primaryClusterId];
    for (const template of clusterTemplates) {
      candidateTemplates.push(template);
    }
  }

  // Step 3: Add cluster-specific CTAs for secondary clusters
  for (const clusterId of allClusterIds) {
    if (clusterId !== primaryClusterId && CLUSTER_CTA_TEMPLATES[clusterId]) {
      const secondaryTemplates = CLUSTER_CTA_TEMPLATES[clusterId];
      // Add only the top 2 from secondary clusters
      const topSecondary = secondaryTemplates.slice(0, 2);
      for (const template of topSecondary) {
        candidateTemplates.push(template);
      }
    }
  }

  // Step 4: Add persona-specific CTAs
  if (personaId && PERSONA_CTA_TEMPLATES[personaId]) {
    const personaTemplates = PERSONA_CTA_TEMPLATES[personaId];
    for (const template of personaTemplates) {
      candidateTemplates.push(template);
    }
  }

  // Step 5: Add fallback CTAs if we don't have enough candidates
  if (candidateTemplates.length < MIN_BUBBLES) {
    for (const template of FALLBACK_CTA_TEMPLATES) {
      candidateTemplates.push(template);
    }
  }

  // Deduplicate and sort by priority
  const deduplicated = deduplicateTemplates(candidateTemplates);
  const sorted = sortByPriority(deduplicated);

  // Select the top MAX_BUBBLES, ensuring at least MIN_BUBBLES
  const selected = sorted.slice(0, MAX_BUBBLES);

  // If we still don't have enough, pad with fallback CTAs
  if (selected.length < MIN_BUBBLES) {
    const fallbackDeduped = deduplicateTemplates([...selected, ...FALLBACK_CTA_TEMPLATES]);
    const fallbackSorted = sortByPriority(fallbackDeduped);
    const padded = fallbackSorted.slice(0, MAX_BUBBLES);
    return padded.map((template) => templateToBubble(template, primaryClusterId));
  }

  // Convert templates to full CTABubble objects
  return selected.map((template) => templateToBubble(template, primaryClusterId));
}

/**
 * Generates CTA bubbles for a specific intelligence cluster without a query result.
 * Useful for pre-populating CTAs on cluster detail screens.
 *
 * @param {string} clusterId - The intelligence cluster ID
 * @param {string} [persona] - The persona key, ID, or name (optional)
 * @returns {CTABubble[]} Array of 3-4 CTA bubble objects
 */
export function getCTABubblesForCluster(clusterId, persona) {
  if (typeof clusterId !== 'string' || clusterId.trim().length === 0) {
    return getCTABubbles(null, persona);
  }

  const trimmedClusterId = clusterId.trim();
  const candidateTemplates = [];

  // Add cluster-specific CTAs
  if (CLUSTER_CTA_TEMPLATES[trimmedClusterId]) {
    const clusterTemplates = CLUSTER_CTA_TEMPLATES[trimmedClusterId];
    for (const template of clusterTemplates) {
      candidateTemplates.push(template);
    }
  }

  // Add persona-specific CTAs
  const personaId = typeof persona === 'string' ? resolvePersonaId(persona) : null;
  if (personaId && PERSONA_CTA_TEMPLATES[personaId]) {
    const personaTemplates = PERSONA_CTA_TEMPLATES[personaId];
    for (const template of personaTemplates) {
      candidateTemplates.push(template);
    }
  }

  // Add fallback CTAs if needed
  if (candidateTemplates.length < MIN_BUBBLES) {
    for (const template of FALLBACK_CTA_TEMPLATES) {
      candidateTemplates.push(template);
    }
  }

  const deduplicated = deduplicateTemplates(candidateTemplates);
  const sorted = sortByPriority(deduplicated);
  const selected = sorted.slice(0, MAX_BUBBLES);

  return selected.map((template) => templateToBubble(template, trimmedClusterId));
}

/**
 * Generates CTA bubbles for a specific persona without a query result.
 * Useful for pre-populating CTAs on persona dashboards.
 *
 * @param {string} persona - The persona key, ID, or name
 * @returns {CTABubble[]} Array of 3-4 CTA bubble objects
 */
export function getCTABubblesForPersona(persona) {
  if (typeof persona !== 'string' || persona.trim().length === 0) {
    return FALLBACK_CTA_TEMPLATES.slice(0, MAX_BUBBLES).map(
      (template) => templateToBubble(template, null)
    );
  }

  const personaId = resolvePersonaId(persona);

  if (!personaId) {
    return FALLBACK_CTA_TEMPLATES.slice(0, MAX_BUBBLES).map(
      (template) => templateToBubble(template, null)
    );
  }

  const candidateTemplates = [];

  // Add persona-specific CTAs
  if (PERSONA_CTA_TEMPLATES[personaId]) {
    const personaTemplates = PERSONA_CTA_TEMPLATES[personaId];
    for (const template of personaTemplates) {
      candidateTemplates.push(template);
    }
  }

  // Determine primary clusters for the persona and add their CTAs
  const personaClusterMap = {
    [PERSONAS.LUKAS.id]: [
      INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id,
      INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id,
    ],
    [PERSONAS.ELENA.id]: [
      INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id,
    ],
    [PERSONAS.SOPHIE.id]: [
      INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id,
    ],
    [PERSONAS.JAMES.id]: [
      INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id,
    ],
  };

  const primaryClusters = personaClusterMap[personaId] || [];
  for (const clusterId of primaryClusters) {
    if (CLUSTER_CTA_TEMPLATES[clusterId]) {
      const clusterTemplates = CLUSTER_CTA_TEMPLATES[clusterId];
      // Add top 2 from each primary cluster
      const topCluster = clusterTemplates.slice(0, 2);
      for (const template of topCluster) {
        candidateTemplates.push(template);
      }
    }
  }

  // Add fallback CTAs if needed
  if (candidateTemplates.length < MIN_BUBBLES) {
    for (const template of FALLBACK_CTA_TEMPLATES) {
      candidateTemplates.push(template);
    }
  }

  const deduplicated = deduplicateTemplates(candidateTemplates);
  const sorted = sortByPriority(deduplicated);
  const selected = sorted.slice(0, MAX_BUBBLES);

  const primaryClusterId = primaryClusters.length > 0 ? primaryClusters[0] : null;
  return selected.map((template) => templateToBubble(template, primaryClusterId));
}

/**
 * Returns all available CTA templates for a given cluster ID.
 * Useful for testing and inspection.
 *
 * @param {string} clusterId - The intelligence cluster ID
 * @returns {Array<Object>} Array of CTA template objects for the cluster
 */
export function getClusterCTATemplates(clusterId) {
  if (typeof clusterId !== 'string' || clusterId.trim().length === 0) {
    return [];
  }

  const templates = CLUSTER_CTA_TEMPLATES[clusterId.trim()];
  return templates ? [...templates] : [];
}

/**
 * Returns all available CTA templates for a given persona ID.
 * Useful for testing and inspection.
 *
 * @param {string} persona - The persona key, ID, or name
 * @returns {Array<Object>} Array of CTA template objects for the persona
 */
export function getPersonaCTATemplates(persona) {
  if (typeof persona !== 'string' || persona.trim().length === 0) {
    return [];
  }

  const personaId = resolvePersonaId(persona);
  if (!personaId) {
    return [];
  }

  const templates = PERSONA_CTA_TEMPLATES[personaId];
  return templates ? [...templates] : [];
}

/**
 * Returns the fallback CTA templates.
 * Useful for testing and inspection.
 *
 * @returns {Array<Object>} Array of fallback CTA template objects
 */
export function getFallbackCTATemplates() {
  return [...FALLBACK_CTA_TEMPLATES];
}