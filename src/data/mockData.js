/**
 * Mock data provider for all query and action simulations
 * Contains predefined JSON for all query types across all intelligence clusters and personas.
 *
 * @module mockData
 * @see SCRUM-7888
 * @see SCRUM-7886
 * @see SCRUM-7887
 * @see SCRUM-7889
 * @see SCRUM-7890
 * @see SCRUM-7891
 * @see SCRUM-7892
 * @see SCRUM-7893
 * @see SCRUM-7897
 */

import { PERSONAS, INTELLIGENCE_CLUSTERS, SYSTEMS } from '../constants';

/**
 * @typedef {Object} SystemSource
 * @property {string} systemId - System identifier
 * @property {string} label - Display label for the system
 * @property {string} dataType - Type of data retrieved
 * @property {string} lastSynced - ISO timestamp of last sync
 * @property {number} confidence - Confidence score 0-1
 */

/**
 * @typedef {Object} MockQueryResult
 * @property {string} id - Unique result identifier
 * @property {string} queryPattern - Query pattern this result matches
 * @property {string} clusterId - Intelligence cluster ID
 * @property {string|null} personaId - Associated persona ID or null
 * @property {string} summary - Short summary of the result
 * @property {Object} data - Structured result data
 * @property {SystemSource[]} sources - System sources that contributed to this result
 * @property {Object[]} actions - Available follow-up actions
 * @property {Object[]} riskSignals - Associated risk signals
 * @property {string} generatedAt - ISO timestamp
 */

/**
 * System source attribution templates
 * @type {Object.<string, SystemSource>}
 */
const SOURCE_TEMPLATES = Object.freeze({
  SAP_FINANCE: {
    systemId: SYSTEMS.SAP.id,
    label: SYSTEMS.SAP.label,
    dataType: 'Financial Records',
    lastSynced: '2024-11-15T08:30:00Z',
    confidence: 0.95,
  },
  SAP_PROCUREMENT: {
    systemId: SYSTEMS.SAP.id,
    label: SYSTEMS.SAP.label,
    dataType: 'Procurement Data',
    lastSynced: '2024-11-15T08:30:00Z',
    confidence: 0.92,
  },
  PROCORE_PROJECT: {
    systemId: SYSTEMS.PROCORE.id,
    label: SYSTEMS.PROCORE.label,
    dataType: 'Project Management',
    lastSynced: '2024-11-15T09:00:00Z',
    confidence: 0.97,
  },
  PROCORE_WORKFORCE: {
    systemId: SYSTEMS.PROCORE.id,
    label: SYSTEMS.PROCORE.label,
    dataType: 'Workforce Records',
    lastSynced: '2024-11-15T09:00:00Z',
    confidence: 0.93,
  },
  SALESFORCE_CRM: {
    systemId: SYSTEMS.SALESFORCE.id,
    label: SYSTEMS.SALESFORCE.label,
    dataType: 'CRM Pipeline',
    lastSynced: '2024-11-15T07:45:00Z',
    confidence: 0.94,
  },
  SALESFORCE_LEADS: {
    systemId: SYSTEMS.SALESFORCE.id,
    label: SYSTEMS.SALESFORCE.label,
    dataType: 'Lead Management',
    lastSynced: '2024-11-15T07:45:00Z',
    confidence: 0.91,
  },
  PRIMAVERA_SCHEDULE: {
    systemId: SYSTEMS.PRIMAVERA.id,
    label: SYSTEMS.PRIMAVERA.label,
    dataType: 'Project Scheduling',
    lastSynced: '2024-11-15T06:15:00Z',
    confidence: 0.96,
  },
  PRIMAVERA_PORTFOLIO: {
    systemId: SYSTEMS.PRIMAVERA.id,
    label: SYSTEMS.PRIMAVERA.label,
    dataType: 'Portfolio Analytics',
    lastSynced: '2024-11-15T06:15:00Z',
    confidence: 0.90,
  },
});

/**
 * Project portfolio mock data
 * @type {MockQueryResult[]}
 */
export const PROJECT_PORTFOLIO_DATA = Object.freeze([
  {
    id: 'pp-001',
    queryPattern: 'project status overview',
    clusterId: INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id,
    personaId: PERSONAS.LUKAS.id,
    summary: 'Portfolio contains 12 active projects. 8 are on track, 3 have schedule risks, and 1 is flagged critical due to resource constraints on the Munich Highway Extension.',
    data: {
      totalProjects: 12,
      onTrack: 8,
      atRisk: 3,
      critical: 1,
      totalBudget: 245000000,
      budgetUtilized: 167000000,
      budgetUtilizationPercent: 68.2,
      projects: [
        {
          id: 'proj-101',
          name: 'Munich Highway Extension',
          status: 'critical',
          completion: 42,
          budget: 85000000,
          spent: 62000000,
          dueDate: '2025-06-30',
          manager: 'Lukas Bauer',
          riskLevel: 'high',
          milestones: {
            total: 18,
            completed: 7,
            overdue: 3,
          },
        },
        {
          id: 'proj-102',
          name: 'Berlin Office Complex',
          status: 'on-track',
          completion: 78,
          budget: 42000000,
          spent: 31500000,
          dueDate: '2025-03-15',
          manager: 'Anna Schmidt',
          riskLevel: 'low',
          milestones: {
            total: 14,
            completed: 11,
            overdue: 0,
          },
        },
        {
          id: 'proj-103',
          name: 'Hamburg Port Facility',
          status: 'at-risk',
          completion: 55,
          budget: 38000000,
          spent: 24700000,
          dueDate: '2025-08-20',
          manager: 'Thomas Weber',
          riskLevel: 'medium',
          milestones: {
            total: 22,
            completed: 12,
            overdue: 2,
          },
        },
        {
          id: 'proj-104',
          name: 'Frankfurt Data Center',
          status: 'on-track',
          completion: 91,
          budget: 28000000,
          spent: 25200000,
          dueDate: '2025-01-31',
          manager: 'Maria Fischer',
          riskLevel: 'low',
          milestones: {
            total: 10,
            completed: 9,
            overdue: 0,
          },
        },
        {
          id: 'proj-105',
          name: 'Stuttgart Rail Station Renovation',
          status: 'at-risk',
          completion: 33,
          budget: 52000000,
          spent: 23400000,
          dueDate: '2025-12-01',
          manager: 'Lukas Bauer',
          riskLevel: 'medium',
          milestones: {
            total: 20,
            completed: 6,
            overdue: 1,
          },
        },
      ],
    },
    sources: [
      SOURCE_TEMPLATES.PROCORE_PROJECT,
      SOURCE_TEMPLATES.PRIMAVERA_SCHEDULE,
      SOURCE_TEMPLATES.SAP_FINANCE,
    ],
    actions: [
      {
        id: 'act-pp-001',
        label: 'View Critical Project Details',
        type: 'navigate',
        target: 'proj-101',
        priority: 'high',
      },
      {
        id: 'act-pp-002',
        label: 'Generate Portfolio Risk Report',
        type: 'generate-report',
        target: 'portfolio-risk',
        priority: 'medium',
      },
      {
        id: 'act-pp-003',
        label: 'Schedule Resource Reallocation Meeting',
        type: 'schedule',
        target: 'resource-meeting',
        priority: 'high',
      },
    ],
    riskSignals: [
      {
        id: 'risk-pp-001',
        severity: 'high',
        category: 'resource',
        message: 'Munich Highway Extension is 15% behind schedule due to steel subcontractor delays.',
        projectId: 'proj-101',
        detectedAt: '2024-11-14T14:22:00Z',
      },
      {
        id: 'risk-pp-002',
        severity: 'medium',
        category: 'schedule',
        message: 'Hamburg Port Facility has 2 overdue milestones affecting critical path.',
        projectId: 'proj-103',
        detectedAt: '2024-11-13T10:05:00Z',
      },
    ],
    generatedAt: '2024-11-15T09:15:00Z',
  },
  {
    id: 'pp-002',
    queryPattern: 'project timeline milestones',
    clusterId: INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id,
    personaId: PERSONAS.LUKAS.id,
    summary: 'Across all active projects, 45 of 84 milestones are completed. 6 milestones are overdue, with the most critical being the structural inspection for Munich Highway Extension.',
    data: {
      totalMilestones: 84,
      completed: 45,
      upcoming: 33,
      overdue: 6,
      overdueMilestones: [
        {
          id: 'ms-001',
          projectId: 'proj-101',
          projectName: 'Munich Highway Extension',
          name: 'Structural Inspection Phase 2',
          dueDate: '2024-10-31',
          daysOverdue: 15,
          impact: 'critical-path',
          assignee: 'Lukas Bauer',
        },
        {
          id: 'ms-002',
          projectId: 'proj-101',
          projectName: 'Munich Highway Extension',
          name: 'Steel Delivery Completion',
          dueDate: '2024-11-05',
          daysOverdue: 10,
          impact: 'critical-path',
          assignee: 'Thomas Weber',
        },
        {
          id: 'ms-003',
          projectId: 'proj-101',
          projectName: 'Munich Highway Extension',
          name: 'Environmental Compliance Report',
          dueDate: '2024-11-10',
          daysOverdue: 5,
          impact: 'non-critical',
          assignee: 'Maria Fischer',
        },
        {
          id: 'ms-004',
          projectId: 'proj-103',
          projectName: 'Hamburg Port Facility',
          name: 'Foundation Waterproofing',
          dueDate: '2024-11-01',
          daysOverdue: 14,
          impact: 'critical-path',
          assignee: 'Thomas Weber',
        },
        {
          id: 'ms-005',
          projectId: 'proj-103',
          projectName: 'Hamburg Port Facility',
          name: 'Crane Installation Permit',
          dueDate: '2024-11-08',
          daysOverdue: 7,
          impact: 'non-critical',
          assignee: 'Anna Schmidt',
        },
        {
          id: 'ms-006',
          projectId: 'proj-105',
          projectName: 'Stuttgart Rail Station Renovation',
          name: 'Heritage Assessment Approval',
          dueDate: '2024-11-12',
          daysOverdue: 3,
          impact: 'critical-path',
          assignee: 'Lukas Bauer',
        },
      ],
      upcomingMilestones: [
        {
          id: 'ms-007',
          projectId: 'proj-102',
          projectName: 'Berlin Office Complex',
          name: 'Interior Fit-out Completion',
          dueDate: '2024-12-15',
          daysUntilDue: 30,
          status: 'on-track',
        },
        {
          id: 'ms-008',
          projectId: 'proj-104',
          projectName: 'Frankfurt Data Center',
          name: 'Final Systems Testing',
          dueDate: '2025-01-10',
          daysUntilDue: 56,
          status: 'on-track',
        },
      ],
    },
    sources: [
      SOURCE_TEMPLATES.PRIMAVERA_SCHEDULE,
      SOURCE_TEMPLATES.PROCORE_PROJECT,
    ],
    actions: [
      {
        id: 'act-pp-004',
        label: 'Escalate Overdue Milestones',
        type: 'escalate',
        target: 'overdue-milestones',
        priority: 'high',
      },
      {
        id: 'act-pp-005',
        label: 'Update Project Schedule',
        type: 'update',
        target: 'schedule',
        priority: 'medium',
      },
    ],
    riskSignals: [
      {
        id: 'risk-pp-003',
        severity: 'high',
        category: 'schedule',
        message: '3 critical-path milestones overdue on Munich Highway Extension. Projected 4-week delay if unresolved.',
        projectId: 'proj-101',
        detectedAt: '2024-11-15T06:00:00Z',
      },
    ],
    generatedAt: '2024-11-15T09:20:00Z',
  },
]);

/**
 * Sales and business development mock data
 * @type {MockQueryResult[]}
 */
export const SALES_PIPELINE_DATA = Object.freeze([
  {
    id: 'sp-001',
    queryPattern: 'sales pipeline overview',
    clusterId: INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id,
    personaId: PERSONAS.JAMES.id,
    summary: 'Current pipeline value is €127M across 34 active opportunities. Win rate trending at 38%, up 4% from last quarter. 3 deals worth €42M are in final negotiation stage.',
    data: {
      pipelineValue: 127000000,
      activeOpportunities: 34,
      winRate: 0.38,
      winRateTrend: 0.04,
      averageDealSize: 3735000,
      averageSalesCycle: 94,
      stages: [
        { name: 'Prospecting', count: 12, value: 28000000 },
        { name: 'Qualification', count: 8, value: 22000000 },
        { name: 'Proposal', count: 6, value: 19000000 },
        { name: 'Negotiation', count: 5, value: 35000000 },
        { name: 'Final Review', count: 3, value: 23000000 },
      ],
      topOpportunities: [
        {
          id: 'opp-001',
          name: 'Düsseldorf Airport Terminal Expansion',
          value: 18000000,
          stage: 'Final Review',
          probability: 85,
          expectedClose: '2024-12-20',
          contact: 'Klaus Richter',
          company: 'Flughafen Düsseldorf GmbH',
        },
        {
          id: 'opp-002',
          name: 'Cologne Residential Development',
          value: 14000000,
          stage: 'Final Review',
          probability: 75,
          expectedClose: '2025-01-15',
          contact: 'Petra Hoffmann',
          company: 'Rheinland Wohnbau AG',
        },
        {
          id: 'opp-003',
          name: 'Leipzig Logistics Hub',
          value: 10000000,
          stage: 'Final Review',
          probability: 70,
          expectedClose: '2025-01-30',
          contact: 'Stefan Braun',
          company: 'DHL Logistics',
        },
        {
          id: 'opp-004',
          name: 'Dresden Tech Campus',
          value: 22000000,
          stage: 'Negotiation',
          probability: 55,
          expectedClose: '2025-03-15',
          contact: 'Ingrid Müller',
          company: 'Infineon Technologies',
        },
        {
          id: 'opp-005',
          name: 'Nuremberg Hospital Wing',
          value: 13000000,
          stage: 'Negotiation',
          probability: 50,
          expectedClose: '2025-04-01',
          contact: 'Dr. Hans Keller',
          company: 'Klinikum Nürnberg',
        },
      ],
      quarterlyTrend: [
        { quarter: 'Q1 2024', won: 3, lost: 5, value: 18000000 },
        { quarter: 'Q2 2024', won: 5, lost: 4, value: 29000000 },
        { quarter: 'Q3 2024', won: 4, lost: 3, value: 24000000 },
        { quarter: 'Q4 2024', won: 2, lost: 1, value: 32000000 },
      ],
    },
    sources: [
      SOURCE_TEMPLATES.SALESFORCE_CRM,
      SOURCE_TEMPLATES.SALESFORCE_LEADS,
    ],
    actions: [
      {
        id: 'act-sp-001',
        label: 'Review Final Stage Deals',
        type: 'navigate',
        target: 'final-review-deals',
        priority: 'high',
      },
      {
        id: 'act-sp-002',
        label: 'Generate Win/Loss Analysis',
        type: 'generate-report',
        target: 'win-loss-report',
        priority: 'medium',
      },
      {
        id: 'act-sp-003',
        label: 'Schedule Deal Review Meeting',
        type: 'schedule',
        target: 'deal-review',
        priority: 'medium',
      },
    ],
    riskSignals: [
      {
        id: 'risk-sp-001',
        severity: 'medium',
        category: 'pipeline',
        message: 'Düsseldorf Airport deal has been in Final Review for 45 days. Average stage duration is 21 days.',
        opportunityId: 'opp-001',
        detectedAt: '2024-11-14T11:30:00Z',
      },
      {
        id: 'risk-sp-002',
        severity: 'low',
        category: 'competition',
        message: 'Competitor Hochtief has submitted a revised bid for Leipzig Logistics Hub.',
        opportunityId: 'opp-003',
        detectedAt: '2024-11-13T16:00:00Z',
      },
    ],
    generatedAt: '2024-11-15T09:30:00Z',
  },
  {
    id: 'sp-002',
    queryPattern: 'lead conversion analysis',
    clusterId: INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id,
    personaId: PERSONAS.JAMES.id,
    summary: 'Lead conversion rate is 22% this quarter, with infrastructure sector leads converting at 31%. Average time from lead to qualified opportunity is 18 days.',
    data: {
      totalLeads: 156,
      qualifiedLeads: 67,
      convertedLeads: 34,
      conversionRate: 0.22,
      averageConversionTime: 18,
      leadsBySource: [
        { source: 'Referral', count: 42, conversionRate: 0.35 },
        { source: 'Website', count: 38, conversionRate: 0.18 },
        { source: 'Trade Shows', count: 28, conversionRate: 0.25 },
        { source: 'Cold Outreach', count: 25, conversionRate: 0.12 },
        { source: 'Partner Network', count: 23, conversionRate: 0.28 },
      ],
      leadsBySector: [
        { sector: 'Infrastructure', count: 45, conversionRate: 0.31 },
        { sector: 'Commercial Real Estate', count: 38, conversionRate: 0.24 },
        { sector: 'Industrial', count: 32, conversionRate: 0.19 },
        { sector: 'Residential', count: 24, conversionRate: 0.17 },
        { sector: 'Public Sector', count: 17, conversionRate: 0.15 },
      ],
    },
    sources: [
      SOURCE_TEMPLATES.SALESFORCE_LEADS,
      SOURCE_TEMPLATES.SALESFORCE_CRM,
    ],
    actions: [
      {
        id: 'act-sp-004',
        label: 'Focus on High-Converting Sectors',
        type: 'recommendation',
        target: 'sector-focus',
        priority: 'medium',
      },
      {
        id: 'act-sp-005',
        label: 'Optimize Cold Outreach Strategy',
        type: 'recommendation',
        target: 'outreach-optimization',
        priority: 'low',
      },
    ],
    riskSignals: [
      {
        id: 'risk-sp-003',
        severity: 'low',
        category: 'performance',
        message: 'Cold outreach conversion rate dropped 3% compared to last quarter.',
        detectedAt: '2024-11-12T09:00:00Z',
      },
    ],
    generatedAt: '2024-11-15T09:35:00Z',
  },
]);

/**
 * Commercial and procurement mock data
 * @type {MockQueryResult[]}
 */
export const PROCUREMENT_DATA = Object.freeze([
  {
    id: 'cm-001',
    queryPattern: 'contract status overview',
    clusterId: INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id,
    personaId: PERSONAS.ELENA.id,
    summary: 'Managing 47 active contracts with a total value of €189M. 5 contracts are pending renewal within 60 days. 2 vendor performance issues flagged requiring attention.',
    data: {
      totalContracts: 47,
      totalValue: 189000000,
      activeContracts: 38,
      pendingRenewal: 5,
      expiringSoon: 3,
      disputesOpen: 1,
      contractsByType: [
        { type: 'Subcontractor', count: 22, value: 78000000 },
        { type: 'Material Supply', count: 12, value: 52000000 },
        { type: 'Equipment Lease', count: 8, value: 34000000 },
        { type: 'Professional Services', count: 5, value: 25000000 },
      ],
      pendingRenewals: [
        {
          id: 'con-001',
          name: 'Structural Steel Supply Agreement',
          vendor: 'ThyssenKrupp Steel',
          value: 12000000,
          expiryDate: '2025-01-15',
          daysUntilExpiry: 61,
          performanceRating: 4.2,
          recommendation: 'renew',
        },
        {
          id: 'con-002',
          name: 'Concrete Delivery Contract',
          vendor: 'HeidelbergCement',
          value: 8500000,
          expiryDate: '2025-01-05',
          daysUntilExpiry: 51,
          performanceRating: 4.5,
          recommendation: 'renew',
        },
        {
          id: 'con-003',
          name: 'Crane Rental Agreement',
          vendor: 'Liebherr Rental',
          value: 4200000,
          expiryDate: '2024-12-31',
          daysUntilExpiry: 46,
          performanceRating: 3.8,
          recommendation: 'renegotiate',
        },
        {
          id: 'con-004',
          name: 'Electrical Subcontractor',
          vendor: 'Siemens Building Tech',
          value: 6800000,
          expiryDate: '2025-01-10',
          daysUntilExpiry: 56,
          performanceRating: 4.0,
          recommendation: 'renew',
        },
        {
          id: 'con-005',
          name: 'Safety Equipment Supply',
          vendor: 'Dräger Safety',
          value: 1200000,
          expiryDate: '2024-12-28',
          daysUntilExpiry: 43,
          performanceRating: 4.7,
          recommendation: 'renew',
        },
      ],
      vendorIssues: [
        {
          vendorId: 'v-012',
          vendorName: 'BauStahl GmbH',
          issue: 'Repeated delivery delays (3 incidents in 60 days)',
          severity: 'high',
          contractId: 'con-018',
          impactedProject: 'Munich Highway Extension',
        },
        {
          vendorId: 'v-025',
          vendorName: 'Elektro Meier',
          issue: 'Quality non-conformance on wiring installation',
          severity: 'medium',
          contractId: 'con-031',
          impactedProject: 'Hamburg Port Facility',
        },
      ],
    },
    sources: [
      SOURCE_TEMPLATES.SAP_PROCUREMENT,
      SOURCE_TEMPLATES.PROCORE_PROJECT,
    ],
    actions: [
      {
        id: 'act-cm-001',
        label: 'Initiate Contract Renewals',
        type: 'workflow',
        target: 'contract-renewal-batch',
        priority: 'high',
      },
      {
        id: 'act-cm-002',
        label: 'Review Vendor Performance Issues',
        type: 'navigate',
        target: 'vendor-issues',
        priority: 'high',
      },
      {
        id: 'act-cm-003',
        label: 'Generate Procurement Savings Report',
        type: 'generate-report',
        target: 'procurement-savings',
        priority: 'medium',
      },
    ],
    riskSignals: [
      {
        id: 'risk-cm-001',
        severity: 'high',
        category: 'vendor',
        message: 'BauStahl GmbH delivery delays are directly impacting Munich Highway Extension critical path.',
        vendorId: 'v-012',
        detectedAt: '2024-11-14T15:00:00Z',
      },
      {
        id: 'risk-cm-002',
        severity: 'medium',
        category: 'contract',
        message: '5 contracts worth €32.7M expiring within 60 days. Renewal process should begin immediately.',
        detectedAt: '2024-11-15T07:00:00Z',
      },
    ],
    generatedAt: '2024-11-15T09:40:00Z',
  },
  {
    id: 'cm-002',
    queryPattern: 'procurement spend analysis',
    clusterId: INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id,
    personaId: PERSONAS.ELENA.id,
    summary: 'Year-to-date procurement spend is €94M against a budget of €108M (87% utilized). Material costs have increased 6.2% compared to initial estimates, primarily driven by steel and concrete price escalation.',
    data: {
      ytdSpend: 94000000,
      budget: 108000000,
      utilizationPercent: 87,
      savingsAchieved: 3200000,
      costEscalation: 0.062,
      spendByCategory: [
        { category: 'Raw Materials', spend: 38000000, budget: 42000000, variance: -4000000 },
        { category: 'Subcontractors', spend: 28000000, budget: 30000000, variance: -2000000 },
        { category: 'Equipment', spend: 15000000, budget: 18000000, variance: 3000000 },
        { category: 'Professional Services', spend: 8000000, budget: 10000000, variance: 2000000 },
        { category: 'Other', spend: 5000000, budget: 8000000, variance: 3000000 },
      ],
      priceIndexTrend: [
        { month: 'Jun 2024', steelIndex: 102, concreteIndex: 101, laborIndex: 103 },
        { month: 'Jul 2024', steelIndex: 104, concreteIndex: 102, laborIndex: 103 },
        { month: 'Aug 2024', steelIndex: 106, concreteIndex: 103, laborIndex: 104 },
        { month: 'Sep 2024', steelIndex: 108, concreteIndex: 105, laborIndex: 104 },
        { month: 'Oct 2024', steelIndex: 109, concreteIndex: 106, laborIndex: 105 },
        { month: 'Nov 2024', steelIndex: 110, concreteIndex: 107, laborIndex: 105 },
      ],
    },
    sources: [
      SOURCE_TEMPLATES.SAP_PROCUREMENT,
      SOURCE_TEMPLATES.SAP_FINANCE,
    ],
    actions: [
      {
        id: 'act-cm-004',
        label: 'Review Material Cost Escalation',
        type: 'navigate',
        target: 'cost-escalation-detail',
        priority: 'high',
      },
      {
        id: 'act-cm-005',
        label: 'Explore Alternative Suppliers',
        type: 'recommendation',
        target: 'supplier-alternatives',
        priority: 'medium',
      },
    ],
    riskSignals: [
      {
        id: 'risk-cm-003',
        severity: 'medium',
        category: 'cost',
        message: 'Steel prices have risen 10% since project budgets were set. Consider hedging or renegotiating supply contracts.',
        detectedAt: '2024-11-15T08:00:00Z',
      },
    ],
    generatedAt: '2024-11-15T09:45:00Z',
  },
]);

/**
 * Finance and cash flow mock data
 * @type {MockQueryResult[]}
 */
export const FINANCE_CASH_FLOW_DATA = Object.freeze([
  {
    id: 'fc-001',
    queryPattern: 'cash flow forecast',
    clusterId: INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id,
    personaId: PERSONAS.SOPHIE.id,
    summary: 'Projected cash position for Q1 2025 is €18.4M. Cash inflows expected at €52M with outflows of €47M. Two projects have payment milestones at risk of delay, potentially impacting €8.2M in receivables.',
    data: {
      currentCashPosition: 13600000,
      projectedQ1Position: 18400000,
      projectedInflows: 52000000,
      projectedOutflows: 47000000,
      netCashFlow: 5000000,
      monthlyForecast: [
        {
          month: 'December 2024',
          inflows: 16000000,
          outflows: 14500000,
          netFlow: 1500000,
          closingBalance: 15100000,
        },
        {
          month: 'January 2025',
          inflows: 18000000,
          outflows: 16200000,
          netFlow: 1800000,
          closingBalance: 16900000,
        },
        {
          month: 'February 2025',
          inflows: 14000000,
          outflows: 15800000,
          netFlow: -1800000,
          closingBalance: 15100000,
        },
        {
          month: 'March 2025',
          inflows: 20000000,
          outflows: 16700000,
          netFlow: 3300000,
          closingBalance: 18400000,
        },
      ],
      atRiskReceivables: [
        {
          projectId: 'proj-101',
          projectName: 'Munich Highway Extension',
          amount: 5200000,
          dueDate: '2025-01-15',
          risk: 'Milestone completion delayed — payment trigger not met',
          probability: 0.4,
        },
        {
          projectId: 'proj-103',
          projectName: 'Hamburg Port Facility',
          amount: 3000000,
          dueDate: '2025-02-01',
          risk: 'Client requesting scope change review before payment',
          probability: 0.6,
        },
      ],
      payablesSchedule: [
        { vendor: 'ThyssenKrupp Steel', amount: 3200000, dueDate: '2024-12-15' },
        { vendor: 'HeidelbergCement', amount: 2100000, dueDate: '2024-12-20' },
        { vendor: 'Liebherr Rental', amount: 1400000, dueDate: '2025-01-05' },
        { vendor: 'Siemens Building Tech', amount: 2800000, dueDate: '2025-01-10' },
      ],
    },
    sources: [
      SOURCE_TEMPLATES.SAP_FINANCE,
      SOURCE_TEMPLATES.PRIMAVERA_SCHEDULE,
    ],
    actions: [
      {
        id: 'act-fc-001',
        label: 'Review At-Risk Receivables',
        type: 'navigate',
        target: 'at-risk-receivables',
        priority: 'high',
      },
      {
        id: 'act-fc-002',
        label: 'Generate Cash Flow Report',
        type: 'generate-report',
        target: 'cash-flow-q1',
        priority: 'medium',
      },
      {
        id: 'act-fc-003',
        label: 'Optimize Payment Schedule',
        type: 'recommendation',
        target: 'payment-optimization',
        priority: 'medium',
      },
    ],
    riskSignals: [
      {
        id: 'risk-fc-001',
        severity: 'high',
        category: 'cash-flow',
        message: 'February 2025 shows negative net cash flow of -€1.8M. Ensure credit facility is available.',
        detectedAt: '2024-11-15T07:30:00Z',
      },
      {
        id: 'risk-fc-002',
        severity: 'medium',
        category: 'receivables',
        message: '€8.2M in receivables at risk due to project milestone delays.',
        detectedAt: '2024-11-14T16:00:00Z',
      },
    ],
    generatedAt: '2024-11-15T09:50:00Z',
  },
  {
    id: 'fc-002',
    queryPattern: 'budget variance analysis',
    clusterId: INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id,
    personaId: PERSONAS.SOPHIE.id,
    summary: 'Overall portfolio budget variance is -3.2% (€7.8M over budget). Primary drivers are material cost escalation (+€4.1M) and labor overtime (+€2.3M). Frankfurt Data Center is the only project under budget.',
    data: {
      totalBudget: 245000000,
      totalActual: 252800000,
      totalVariance: -7800000,
      variancePercent: -3.2,
      projectVariances: [
        {
          projectId: 'proj-101',
          projectName: 'Munich Highway Extension',
          budget: 85000000,
          actual: 89200000,
          variance: -4200000,
          variancePercent: -4.9,
          drivers: ['Steel price escalation', 'Schedule acceleration costs'],
        },
        {
          projectId: 'proj-102',
          projectName: 'Berlin Office Complex',
          budget: 42000000,
          actual: 42800000,
          variance: -800000,
          variancePercent: -1.9,
          drivers: ['Minor scope additions'],
        },
        {
          projectId: 'proj-103',
          projectName: 'Hamburg Port Facility',
          budget: 38000000,
          actual: 40100000,
          variance: -2100000,
          variancePercent: -5.5,
          drivers: ['Foundation rework', 'Weather delays'],
        },
        {
          projectId: 'proj-104',
          projectName: 'Frankfurt Data Center',
          budget: 28000000,
          actual: 26700000,
          variance: 1300000,
          variancePercent: 4.6,
          drivers: ['Efficient procurement', 'Ahead of schedule'],
        },
        {
          projectId: 'proj-105',
          projectName: 'Stuttgart Rail Station Renovation',
          budget: 52000000,
          actual: 54000000,
          variance: -2000000,
          variancePercent: -3.8,
          drivers: ['Heritage compliance requirements', 'Labor overtime'],
        },
      ],
      varianceByCategory: [
        { category: 'Materials', variance: -4100000 },
        { category: 'Labor', variance: -2300000 },
        { category: 'Equipment', variance: -800000 },
        { category: 'Subcontractors', variance: -1200000 },
        { category: 'Contingency', variance: 600000 },
      ],
    },
    sources: [
      SOURCE_TEMPLATES.SAP_FINANCE,
      SOURCE_TEMPLATES.PROCORE_PROJECT,
    ],
    actions: [
      {
        id: 'act-fc-004',
        label: 'Review Cost Overrun Details',
        type: 'navigate',
        target: 'cost-overrun-detail',
        priority: 'high',
      },
      {
        id: 'act-fc-005',
        label: 'Request Budget Revision',
        type: 'workflow',
        target: 'budget-revision',
        priority: 'high',
      },
      {
        id: 'act-fc-006',
        label: 'Apply Frankfurt Best Practices',
        type: 'recommendation',
        target: 'best-practices',
        priority: 'low',
      },
    ],
    riskSignals: [
      {
        id: 'risk-fc-003',
        severity: 'high',
        category: 'budget',
        message: 'Hamburg Port Facility is 5.5% over budget with only 55% completion. Projected final overrun could reach €5.8M.',
        projectId: 'proj-103',
        detectedAt: '2024-11-15T08:15:00Z',
      },
    ],
    generatedAt: '2024-11-15T09:55:00Z',
  },
]);

/**
 * Workforce planning mock data
 * @type {MockQueryResult[]}
 */
export const WORKFORCE_DATA = Object.freeze([
  {
    id: 'wf-001',
    queryPattern: 'workforce allocation overview',
    clusterId: INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id,
    personaId: PERSONAS.LUKAS.id,
    summary: 'Total workforce of 342 across all projects. Current utilization rate is 87%. 3 projects are understaffed, with Munich Highway Extension requiring 18 additional workers. 12 workers available for reallocation from Frankfurt Data Center as it nears completion.',
    data: {
      totalWorkforce: 342,
      utilizationRate: 0.87,
      availableForReallocation: 12,
      understaffedProjects: 3,
      allocationByProject: [
        {
          projectId: 'proj-101',
          projectName: 'Munich Highway Extension',
          allocated: 95,
          required: 113,
          gap: -18,
          utilizationRate: 0.94,
          criticalRoles: ['Structural Engineers', 'Steel Workers', 'Safety Officers'],
        },
        {
          projectId: 'proj-102',
          projectName: 'Berlin Office Complex',
          allocated: 68,
          required: 65,
          gap: 3,
          utilizationRate: 0.91,
          criticalRoles: [],
        },
        {
          projectId: 'proj-103',
          projectName: 'Hamburg Port Facility',
          allocated: 72,
          required: 80,
          gap: -8,
          utilizationRate: 0.89,
          criticalRoles: ['Marine Engineers', 'Crane Operators'],
        },
        {
          projectId: 'proj-104',
          projectName: 'Frankfurt Data Center',
          allocated: 45,
          required: 33,
          gap: 12,
          utilizationRate: 0.73,
          criticalRoles: [],
        },
        {
          projectId: 'proj-105',
          projectName: 'Stuttgart Rail Station Renovation',
          allocated: 62,
          required: 68,
          gap: -6,
          utilizationRate: 0.85,
          criticalRoles: ['Heritage Specialists', 'Electricians'],
        },
      ],
      skillDistribution: [
        { skill: 'Civil Engineering', count: 78, demand: 85 },
        { skill: 'Structural Engineering', count: 45, demand: 52 },
        { skill: 'Electrical', count: 38, demand: 40 },
        { skill: 'Mechanical', count: 32, demand: 30 },
        { skill: 'Project Management', count: 24, demand: 22 },
        { skill: 'Safety & Compliance', count: 18, demand: 22 },
        { skill: 'Specialized Trades', count: 42, demand: 48 },
        { skill: 'General Labor', count: 65, demand: 60 },
      ],
      upcomingChanges: [
        {
          type: 'release',
          projectId: 'proj-104',
          projectName: 'Frankfurt Data Center',
          count: 12,
          date: '2025-02-01',
          skills: ['Electrical', 'Mechanical', 'General Labor'],
        },
        {
          type: 'onboarding',
          count: 8,
          date: '2025-01-15',
          skills: ['Structural Engineering', 'Safety & Compliance'],
        },
      ],
    },
    sources: [
      SOURCE_TEMPLATES.PROCORE_WORKFORCE,
      SOURCE_TEMPLATES.PROCORE_PROJECT,
      SOURCE_TEMPLATES.PRIMAVERA_SCHEDULE,
    ],
    actions: [
      {
        id: 'act-wf-001',
        label: 'Reallocate Frankfurt Resources',
        type: 'workflow',
        target: 'resource-reallocation',
        priority: 'high',
      },
      {
        id: 'act-wf-002',
        label: 'Request Additional Staffing',
        type: 'workflow',
        target: 'staffing-request',
        priority: 'high',
      },
      {
        id: 'act-wf-003',
        label: 'View Capacity Forecast',
        type: 'navigate',
        target: 'capacity-forecast',
        priority: 'medium',
      },
    ],
    riskSignals: [
      {
        id: 'risk-wf-001',
        severity: 'high',
        category: 'staffing',
        message: 'Munich Highway Extension is short 18 workers including critical structural engineers. This is contributing to schedule delays.',
        projectId: 'proj-101',
        detectedAt: '2024-11-15T06:30:00Z',
      },
      {
        id: 'risk-wf-002',
        severity: 'medium',
        category: 'skills',
        message: 'Safety & Compliance staff shortage across portfolio. 4 additional safety officers needed.',
        detectedAt: '2024-11-14T12:00:00Z',
      },
    ],
    generatedAt: '2024-11-15T10:00:00Z',
  },
]);

/**
 * Knowledge and IP mock data
 * @type {MockQueryResult[]}
 */
export const KNOWLEDGE_IP_DATA = Object.freeze([
  {
    id: 'ki-001',
    queryPattern: 'lessons learned search',
    clusterId: INTELLIGENCE_CLUSTERS.KNOWLEDGE_IP.id,
    personaId: null,
    summary: 'Found 23 relevant lessons learned entries matching your query. Top results relate to foundation work in coastal environments, steel procurement strategies, and schedule recovery techniques.',
    data: {
      totalResults: 23,
      topResults: [
        {
          id: 'lesson-001',
          title: 'Coastal Foundation Waterproofing Best Practices',
          project: 'Bremerhaven Dock Extension (2023)',
          category: 'Technical',
          relevanceScore: 0.94,
          summary: 'Marine-grade waterproofing membranes combined with cathodic protection reduced foundation maintenance costs by 35% over projected lifecycle.',
          applicableTo: ['Hamburg Port Facility'],
          author: 'Thomas Weber',
          dateCreated: '2023-09-15',
          tags: ['foundation', 'waterproofing', 'coastal', 'marine'],
        },
        {
          id: 'lesson-002',
          title: 'Steel Procurement Hedging Strategy',
          project: 'Essen Bridge Reconstruction (2023)',
          category: 'Commercial',
          relevanceScore: 0.89,
          summary: 'Forward contracts for steel at 6-month intervals reduced price volatility exposure by 22%. Recommended for projects with >€5M steel requirements.',
          applicableTo: ['Munich Highway Extension', 'Stuttgart Rail Station Renovation'],
          author: 'Elena Vasquez',
          dateCreated: '2023-11-20',
          tags: ['steel', 'procurement', 'hedging', 'cost-management'],
        },
        {
          id: 'lesson-003',
          title: 'Schedule Recovery Through Parallel Workstreams',
          project: 'Hannover Convention Center (2022)',
          category: 'Project Management',
          relevanceScore: 0.85,
          summary: 'Implementing parallel workstreams for non-dependent activities recovered 3 weeks of schedule delay with only 8% cost increase.',
          applicableTo: ['Munich Highway Extension'],
          author: 'Lukas Bauer',
          dateCreated: '2022-12-05',
          tags: ['schedule', 'recovery', 'parallel-work', 'acceleration'],
        },
        {
          id: 'lesson-004',
          title: 'Heritage Building Renovation Compliance Framework',
          project: 'Potsdam Palace Restoration (2023)',
          category: 'Regulatory',
          relevanceScore: 0.82,
          summary: 'Early engagement with heritage authorities and pre-approved material lists reduced approval delays by 60%.',
          applicableTo: ['Stuttgart Rail Station Renovation'],
          author: 'Maria Fischer',
          dateCreated: '2023-07-10',
          tags: ['heritage', 'compliance', 'renovation', 'regulatory'],
        },
        {
          id: 'lesson-005',
          title: 'Data Center Cooling System Optimization',
          project: 'Karlsruhe IT Campus (2023)',
          category: 'Technical',
          relevanceScore: 0.78,
          summary: 'Liquid cooling systems reduced energy consumption by 40% compared to traditional HVAC. ROI achieved within 18 months.',
          applicableTo: ['Frankfurt Data Center'],
          author: 'Anna Schmidt',
          dateCreated: '2023-04-22',
          tags: ['data-center', 'cooling', 'energy-efficiency', 'sustainability'],
        },
      ],
      documentAssets: [
        {
          id: 'doc-001',
          title: 'Foundation Engineering Standards v3.2',
          type: 'Standard',
          lastUpdated: '2024-08-15',
          downloads: 156,
        },
        {
          id: 'doc-002',
          title: 'Procurement Best Practices Guide',
          type: 'Guide',
          lastUpdated: '2024-06-20',
          downloads: 89,
        },
        {
          id: 'doc-003',
          title: 'Schedule Recovery Playbook',
          type: 'Playbook',
          lastUpdated: '2024-09-01',
          downloads: 234,
        },
      ],
    },
    sources: [
      SOURCE_TEMPLATES.PROCORE_PROJECT,
      SOURCE_TEMPLATES.PRIMAVERA_PORTFOLIO,
    ],
    actions: [
      {
        id: 'act-ki-001',
        label: 'Apply Lesson to Current Project',
        type: 'workflow',
        target: 'apply-lesson',
        priority: 'medium',
      },
      {
        id: 'act-ki-002',
        label: 'Share with Project Team',
        type: 'share',
        target: 'team-share',
        priority: 'low',
      },
      {
        id: 'act-ki-003',
        label: 'Create New Lesson Entry',
        type: 'create',
        target: 'new-lesson',
        priority: 'low',
      },
    ],
    riskSignals: [],
    generatedAt: '2024-11-15T10:05:00Z',
  },
]);

/**
 * Forecast model mock data
 * @type {Object[]}
 */
export const FORECAST_MODELS = Object.freeze([
  {
    id: 'forecast-001',
    name: 'Portfolio Revenue Forecast',
    type: 'revenue',
    personaId: PERSONAS.SOPHIE.id,
    lastUpdated: '2024-11-15T06:00:00Z',
    confidence: 0.88,
    data: {
      currentYear: {
        projected: 198000000,
        actual: 167000000,
        remaining: 31000000,
        onTrackPercent: 84,
      },
      nextYear: {
        projected: 225000000,
        bestCase: 248000000,
        worstCase: 195000000,
        pipelineContribution: 42000000,
      },
      quarterlyProjection: [
        { quarter: 'Q4 2024', projected: 31000000, confidence: 0.92 },
        { quarter: 'Q1 2025', projected: 52000000, confidence: 0.85 },
        { quarter: 'Q2 2025', projected: 58000000, confidence: 0.78 },
        { quarter: 'Q3 2025', projected: 62000000, confidence: 0.72 },
        { quarter: 'Q4 2025', projected: 53000000, confidence: 0.65 },
      ],
    },
    sources: [SOURCE_TEMPLATES.SAP_FINANCE, SOURCE_TEMPLATES.SALESFORCE_CRM],
  },
  {
    id: 'forecast-002',
    name: 'Resource Demand Forecast',
    type: 'workforce',
    personaId: PERSONAS.LUKAS.id,
    lastUpdated: '2024-11-15T06:00:00Z',
    confidence: 0.82,
    data: {
      currentHeadcount: 342,
      projectedQ1: 358,
      projectedQ2: 375,
      peakDemand: {
        month: 'May 2025',
        headcount: 410,
        criticalSkills: ['Structural Engineering', 'Marine Engineering', 'Safety Officers'],
      },
      hiringNeeds: [
        { role: 'Structural Engineer', count: 7, urgency: 'high', byDate: '2025-01-15' },
        { role: 'Safety Officer', count: 4, urgency: 'high', byDate: '2025-02-01' },
        { role: 'Marine Engineer', count: 3, urgency: 'medium', byDate: '2025-03-01' },
        { role: 'Electrician', count: 5, urgency: 'medium', byDate: '2025-02-15' },
        { role: 'Project Coordinator', count: 2, urgency: 'low', byDate: '2025-04-01' },
      ],
    },
    sources: [SOURCE_TEMPLATES.PROCORE_WORKFORCE, SOURCE_TEMPLATES.PRIMAVERA_SCHEDULE],
  },
  {
    id: 'forecast-003',
    name: 'Material Cost Forecast',
    type: 'procurement',
    personaId: PERSONAS.ELENA.id,
    lastUpdated: '2024-11-15T06:00:00Z',
    confidence: 0.76,
    data: {
      currentSpend: 94000000,
      projectedYearEnd: 112000000,
      budgetedYearEnd: 108000000,
      overrunProjected: 4000000,
      materialTrends: [
        { material: 'Structural Steel', currentPrice: 1150, unit: '€/ton', trend: 'rising', changePercent: 8.2 },
        { material: 'Ready-Mix Concrete', currentPrice: 125, unit: '€/m³', trend: 'rising', changePercent: 5.1 },
        { material: 'Rebar', currentPrice: 980, unit: '€/ton', trend: 'stable', changePercent: 1.2 },
        { material: 'Timber', currentPrice: 420, unit: '€/m³', trend: 'declining', changePercent: -3.5 },
        { material: 'Copper Wiring', currentPrice: 8900, unit: '€/ton', trend: 'rising', changePercent: 12.4 },
      ],
    },
    sources: [SOURCE_TEMPLATES.SAP_PROCUREMENT, SOURCE_TEMPLATES.SAP_FINANCE],
  },
]);

/**
 * Action execution result mock data
 * @type {Object[]}
 */
export const ACTION_RESULTS = Object.freeze([
  {
    id: 'result-001',
    actionId: 'act-pp-003',
    actionLabel: 'Schedule Resource Reallocation Meeting',
    status: 'success',
    message: 'Meeting scheduled for November 18, 2024 at 10:00 AM with all project directors.',
    details: {
      meetingDate: '2024-11-18T10:00:00Z',
      attendees: ['Lukas Bauer', 'Anna Schmidt', 'Thomas Weber', 'Maria Fischer'],
      location: 'Virtual - Teams',
      agenda: [
        'Frankfurt Data Center resource release timeline',
        'Munich Highway Extension staffing gaps',
        'Hamburg Port Facility marine engineer needs',
        'Q1 2025 hiring plan review',
      ],
    },
    executedAt: '2024-11-15T10:15:00Z',
    executedBy: PERSONAS.LUKAS.id,
  },
  {
    id: 'result-002',
    actionId: 'act-cm-001',
    actionLabel: 'Initiate Contract Renewals',
    status: 'success',
    message: 'Renewal workflows initiated for 5 contracts. Notifications sent to vendors and internal stakeholders.',
    details: {
      contractsInitiated: 5,
      totalValue: 32700000,
      expectedCompletionDate: '2024-12-15',
      notifications: [
        { recipient: 'ThyssenKrupp Steel', type: 'vendor', sentAt: '2024-11-15T10:20:00Z' },
        { recipient: 'HeidelbergCement', type: 'vendor', sentAt: '2024-11-15T10:20:00Z' },
        { recipient: 'Liebherr Rental', type: 'vendor', sentAt: '2024-11-15T10:20:00Z' },
        { recipient: 'Siemens Building Tech', type: 'vendor', sentAt: '2024-11-15T10:20:00Z' },
        { recipient: 'Dräger Safety', type: 'vendor', sentAt: '2024-11-15T10:20:00Z' },
        { recipient: 'Elena Vasquez', type: 'internal', sentAt: '2024-11-15T10:20:00Z' },
        { recipient: 'Sophie Laurent', type: 'internal', sentAt: '2024-11-15T10:20:00Z' },
      ],
    },
    executedAt: '2024-11-15T10:20:00Z',
    executedBy: PERSONAS.ELENA.id,
  },
  {
    id: 'result-003',
    actionId: 'act-fc-002',
    actionLabel: 'Generate Cash Flow Report',
    status: 'success',
    message: 'Q1 2025 Cash Flow Report generated successfully. Available for download and sharing.',
    details: {
      reportName: 'Q1_2025_Cash_Flow_Forecast_v1.pdf',
      generatedAt: '2024-11-15T10:25:00Z',
      pages: 12,
      sections: ['Executive Summary', 'Monthly Projections', 'Risk Analysis', 'Receivables Status', 'Recommendations'],
      sharedWith: ['Sophie Laurent', 'CFO Office', 'Project Directors'],
    },
    executedAt: '2024-11-15T10:25:00Z',
    executedBy: PERSONAS.SOPHIE.id,
  },
  {
    id: 'result-004',
    actionId: 'act-wf-001',
    actionLabel: 'Reallocate Frankfurt Resources',
    status: 'pending',
    message: 'Resource reallocation request submitted. Awaiting approval from Frankfurt Data Center project manager.',
    details: {
      requestedResources: 12,
      fromProject: 'Frankfurt Data Center',
      toProject: 'Munich Highway Extension',
      proposedDate: '2025-02-01',
      approvalRequired: ['Maria Fischer', 'Lukas Bauer'],
      approvalStatus: [
        { approver: 'Maria Fischer', status: 'pending' },
        { approver: 'Lukas Bauer', status: 'approved' },
      ],
    },
    executedAt: '2024-11-15T10:30:00Z',
    executedBy: PERSONAS.LUKAS.id,
  },
  {
    id: 'result-005',
    actionId: 'act-sp-002',
    actionLabel: 'Generate Win/Loss Analysis',
    status: 'success',
    message: 'Win/Loss Analysis for Q3 2024 generated. Key insight: referral-sourced deals have 3x higher win rate than cold outreach.',
    details: {
      reportName: 'Q3_2024_Win_Loss_Analysis.pdf',
      generatedAt: '2024-11-15T10:35:00Z',
      keyFindings: [
        'Referral deals close 40% faster than average',
        'Infrastructure sector has highest win rate at 31%',
        'Average deal size increased 12% YoY',
        'Competitor Hochtief won 3 deals we lost — pricing was primary factor',
      ],
      sharedWith: ['James Morrison', 'Sales Team', 'Executive Board'],
    },
    executedAt: '2024-11-15T10:35:00Z',
    executedBy: PERSONAS.JAMES.id,
  },
]);

/**
 * Risk signals aggregated across all clusters
 * @type {Object[]}
 */
export const RISK_SIGNALS = Object.freeze([
  {
    id: 'risk-agg-001',
    severity: 'critical',
    category: 'cross-functional',
    title: 'Munich Highway Extension Compound Risk',
    message: 'Munich Highway Extension faces compounding risks: steel delivery delays (vendor), staffing shortages (workforce), and budget overrun (finance). Combined impact could result in 6-week schedule delay and €6.2M additional cost.',
    affectedClusters: [
      INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id,
      INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id,
      INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id,
      INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id,
    ],
    affectedSystems: [SYSTEMS.PROCORE.id, SYSTEMS.SAP.id, SYSTEMS.PRIMAVERA.id],
    projectId: 'proj-101',
    detectedAt: '2024-11-15T05:00:00Z',
    recommendedActions: ['act-pp-003', 'act-wf-001', 'act-cm-002'],
  },
  {
    id: 'risk-agg-002',
    severity: 'high',
    category: 'financial',
    title: 'Q1 2025 Cash Flow Pressure',
    message: 'February 2025 projects negative cash flow of -€1.8M. Combined with €8.2M at-risk receivables, liquidity position could become strained.',
    affectedClusters: [
      INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id,
      INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id,
    ],
    affectedSystems: [SYSTEMS.SAP.id],
    projectId: null,
    detectedAt: '2024-11-15T07:30:00Z',
    recommendedActions: ['act-fc-001', 'act-fc-003'],
  },
  {
    id: 'risk-agg-003',
    severity: 'medium',
    category: 'market',
    title: 'Material Cost Escalation Trend',
    message: 'Steel and copper prices continue upward trend. Portfolio-wide material cost overrun projected at €4M by year-end if current trends persist.',
    affectedClusters: [
      INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id,
      INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id,
    ],
    affectedSystems: [SYSTEMS.SAP.id],
    projectId: null,
    detectedAt: '2024-11-15T08:00:00Z',
    recommendedActions: ['act-cm-004', 'act-cm-005'],
  },
  {
    id: 'risk-agg-004',
    severity: 'medium',
    category: 'competitive',
    title: 'Increased Competitive Pressure',
    message: 'Competitor Hochtief has been actively bidding on 4 opportunities in our pipeline. Their revised bid on Leipzig Logistics Hub is 8% below our proposal.',
    affectedClusters: [
      INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id,
    ],
    affectedSystems: [SYSTEMS.SALESFORCE.id],
    projectId: null,
    detectedAt: '2024-11-13T16:00:00Z',
    recommendedActions: ['act-sp-001'],
  },
  {
    id: 'risk-agg-005',
    severity: 'low',
    category: 'workforce',
    title: 'Specialized Skills Gap Widening',
    message: 'Market shortage of marine engineers and heritage specialists may impact recruitment timelines for Hamburg Port and Stuttgart Rail projects.',
    affectedClusters: [
      INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id,
    ],
    affectedSystems: [SYSTEMS.PROCORE.id],
    projectId: null,
    detectedAt: '2024-11-14T12:00:00Z',
    recommendedActions: ['act-wf-002'],
  },
]);

/**
 * Query suggestion templates organized by persona
 * @type {Object.<string, string[]>}
 */
export const QUERY_SUGGESTIONS = Object.freeze({
  [PERSONAS.LUKAS.id]: [
    'What is the current status of all my projects?',
    'Which milestones are overdue this month?',
    'Show me the resource allocation across projects',
    'What are the top risks in my portfolio?',
    'How is the Munich Highway Extension progressing?',
    'Which projects need additional staffing?',
    'Show me the schedule forecast for Q1 2025',
    'What lessons learned apply to my current projects?',
  ],
  [PERSONAS.ELENA.id]: [
    'Which contracts are expiring in the next 60 days?',
    'Show me vendor performance issues',
    'What is our procurement spend vs budget?',
    'Are there any contract disputes open?',
    'How have material costs changed this quarter?',
    'Which vendors should we renegotiate with?',
    'Show me the procurement savings report',
    'What alternative suppliers are available for steel?',
  ],
  [PERSONAS.SOPHIE.id]: [
    'What is our cash flow forecast for Q1 2025?',
    'Show me the budget variance across all projects',
    'Which receivables are at risk?',
    'What is the revenue forecast for next year?',
    'How does our actual spend compare to budget?',
    'Which projects are over budget?',
    'Show me the monthly cash flow projection',
    'What is our current cash position?',
  ],
  [PERSONAS.JAMES.id]: [
    'What is the current pipeline value?',
    'Which deals are in final negotiation?',
    'Show me the lead conversion analysis',
    'What is our win rate trend?',
    'Which opportunities are at risk?',
    'How does our pipeline compare to last quarter?',
    'Show me the top opportunities by value',
    'What is the competitive landscape for open bids?',
  ],
});

/**
 * Dashboard summary data for the main overview
 * @type {Object}
 */
export const DASHBOARD_SUMMARY = Object.freeze({
  lastUpdated: '2024-11-15T10:00:00Z',
  kpis: [
    {
      id: 'kpi-001',
      label: 'Active Projects',
      value: 12,
      unit: '',
      trend: 'stable',
      changePercent: 0,
      icon: '📊',
    },
    {
      id: 'kpi-002',
      label: 'Portfolio Value',
      value: 245,
      unit: 'M€',
      trend: 'up',
      changePercent: 8.5,
      icon: '💰',
    },
    {
      id: 'kpi-003',
      label: 'Pipeline Value',
      value: 127,
      unit: 'M€',
      trend: 'up',
      changePercent: 12.3,
      icon: '📈',
    },
    {
      id: 'kpi-004',
      label: 'Workforce',
      value: 342,
      unit: 'people',
      trend: 'up',
      changePercent: 3.2,
      icon: '👥',
    },
    {
      id: 'kpi-005',
      label: 'Budget Utilization',
      value: 68.2,
      unit: '%',
      trend: 'stable',
      changePercent: 1.1,
      icon: '📋',
    },
    {
      id: 'kpi-006',
      label: 'Risk Alerts',
      value: 5,
      unit: '',
      trend: 'up',
      changePercent: 25,
      icon: '⚠️',
    },
  ],
  recentActivity: [
    {
      id: 'activity-001',
      type: 'alert',
      message: 'Munich Highway Extension flagged as critical',
      timestamp: '2024-11-15T09:00:00Z',
      severity: 'high',
    },
    {
      id: 'activity-002',
      type: 'update',
      message: 'Frankfurt Data Center reached 91% completion',
      timestamp: '2024-11-15T08:30:00Z',
      severity: 'low',
    },
    {
      id: 'activity-003',
      type: 'action',
      message: 'Contract renewal workflows initiated for 5 vendors',
      timestamp: '2024-11-15T08:00:00Z',
      severity: 'medium',
    },
    {
      id: 'activity-004',
      type: 'insight',
      message: 'Steel prices up 10% — hedging strategy recommended',
      timestamp: '2024-11-14T16:00:00Z',
      severity: 'medium',
    },
    {
      id: 'activity-005',
      type: 'update',
      message: 'Düsseldorf Airport deal moved to Final Review',
      timestamp: '2024-11-14T14:00:00Z',
      severity: 'low',
    },
  ],
  systemStatus: [
    { systemId: SYSTEMS.SAP.id, label: SYSTEMS.SAP.label, status: 'connected', lastSync: '2024-11-15T08:30:00Z', health: 'healthy' },
    { systemId: SYSTEMS.PROCORE.id, label: SYSTEMS.PROCORE.label, status: 'connected', lastSync: '2024-11-15T09:00:00Z', health: 'healthy' },
    { systemId: SYSTEMS.SALESFORCE.id, label: SYSTEMS.SALESFORCE.label, status: 'connected', lastSync: '2024-11-15T07:45:00Z', health: 'healthy' },
    { systemId: SYSTEMS.PRIMAVERA.id, label: SYSTEMS.PRIMAVERA.label, status: 'connected', lastSync: '2024-11-15T06:15:00Z', health: 'degraded' },
  ],
});

/**
 * All mock query results indexed by cluster ID for easy lookup
 * @type {Object.<string, MockQueryResult[]>}
 */
export const MOCK_DATA_BY_CLUSTER = Object.freeze({
  [INTELLIGENCE_CLUSTERS.PROJECT_PORTFOLIO.id]: PROJECT_PORTFOLIO_DATA,
  [INTELLIGENCE_CLUSTERS.SALES_BUSINESS_DEV.id]: SALES_PIPELINE_DATA,
  [INTELLIGENCE_CLUSTERS.COMMERCIAL_PROCUREMENT.id]: PROCUREMENT_DATA,
  [INTELLIGENCE_CLUSTERS.FINANCE_CASH_FLOW.id]: FINANCE_CASH_FLOW_DATA,
  [INTELLIGENCE_CLUSTERS.WORKFORCE_PLANNING.id]: WORKFORCE_DATA,
  [INTELLIGENCE_CLUSTERS.KNOWLEDGE_IP.id]: KNOWLEDGE_IP_DATA,
});

/**
 * All mock query results indexed by persona ID for easy lookup
 * @type {Object.<string, MockQueryResult[]>}
 */
export const MOCK_DATA_BY_PERSONA = Object.freeze({
  [PERSONAS.LUKAS.id]: [...PROJECT_PORTFOLIO_DATA, ...WORKFORCE_DATA],
  [PERSONAS.ELENA.id]: [...PROCUREMENT_DATA],
  [PERSONAS.SOPHIE.id]: [...FINANCE_CASH_FLOW_DATA],
  [PERSONAS.JAMES.id]: [...SALES_PIPELINE_DATA],
});

/**
 * Finds mock query results matching a query pattern
 * @param {string} queryPattern - The query pattern to search for
 * @returns {MockQueryResult[]} Matching query results
 */
export function findByQueryPattern(queryPattern) {
  const normalizedQuery = queryPattern.toLowerCase().trim();
  const allData = [
    ...PROJECT_PORTFOLIO_DATA,
    ...SALES_PIPELINE_DATA,
    ...PROCUREMENT_DATA,
    ...FINANCE_CASH_FLOW_DATA,
    ...WORKFORCE_DATA,
    ...KNOWLEDGE_IP_DATA,
  ];

  return allData.filter((entry) => {
    const pattern = entry.queryPattern.toLowerCase();
    return pattern.includes(normalizedQuery) || normalizedQuery.includes(pattern);
  });
}

/**
 * Finds mock query results by cluster ID
 * @param {string} clusterId - The intelligence cluster ID
 * @returns {MockQueryResult[]} Query results for the cluster
 */
export function findByCluster(clusterId) {
  return MOCK_DATA_BY_CLUSTER[clusterId] || [];
}

/**
 * Finds mock query results by persona ID
 * @param {string} personaId - The persona ID
 * @returns {MockQueryResult[]} Query results for the persona
 */
export function findByPersona(personaId) {
  return MOCK_DATA_BY_PERSONA[personaId] || [];
}

/**
 * Gets an action result by action ID
 * @param {string} actionId - The action ID
 * @returns {Object|undefined} The action result or undefined
 */
export function getActionResult(actionId) {
  return ACTION_RESULTS.find((result) => result.actionId === actionId);
}

/**
 * Gets risk signals filtered by severity
 * @param {string} [severity] - Optional severity filter ('critical', 'high', 'medium', 'low')
 * @returns {Object[]} Filtered risk signals
 */
export function getRiskSignals(severity) {
  if (!severity) {
    return RISK_SIGNALS;
  }
  return RISK_SIGNALS.filter((signal) => signal.severity === severity);
}

/**
 * Gets query suggestions for a given persona
 * @param {string} personaId - The persona ID
 * @returns {string[]} Array of suggested queries
 */
export function getQuerySuggestions(personaId) {
  return QUERY_SUGGESTIONS[personaId] || [];
}

/**
 * Gets forecast model data by type
 * @param {string} type - Forecast type ('revenue', 'workforce', 'procurement')
 * @returns {Object|undefined} The forecast model or undefined
 */
export function getForecastByType(type) {
  return FORECAST_MODELS.find((model) => model.type === type);
}

/**
 * Simulates a query execution with mock delay
 * @param {string} queryPattern - The query pattern to execute
 * @param {Object} [options] - Query options
 * @param {string} [options.personaId] - Filter by persona
 * @param {string} [options.clusterId] - Filter by cluster
 * @returns {Promise<MockQueryResult[]>} Promise resolving to query results
 */
export async function executeQuery(queryPattern, options = {}) {
  const delay = parseInt(import.meta.env.VITE_MOCK_DELAY_MS, 10) || 500;

  await new Promise((resolve) => setTimeout(resolve, delay));

  let results = findByQueryPattern(queryPattern);

  if (options.personaId) {
    results = results.filter(
      (r) => r.personaId === options.personaId || r.personaId === null
    );
  }

  if (options.clusterId) {
    results = results.filter((r) => r.clusterId === options.clusterId);
  }

  if (results.length === 0) {
    const fallback = options.personaId
      ? findByPersona(options.personaId)
      : options.clusterId
        ? findByCluster(options.clusterId)
        : [];

    return fallback.length > 0 ? fallback : getAllMockResults().slice(0, 3);
  }

  return results;
}

/**
 * Simulates an action execution with mock delay
 * @param {string} actionId - The action ID to execute
 * @returns {Promise<Object>} Promise resolving to the action result
 */
export async function executeAction(actionId) {
  const delay = parseInt(import.meta.env.VITE_MOCK_DELAY_MS, 10) || 500;

  await new Promise((resolve) => setTimeout(resolve, delay));

  const result = getActionResult(actionId);

  if (result) {
    return result;
  }

  return {
    id: `result-${Date.now()}`,
    actionId,
    actionLabel: 'Action Executed',
    status: 'success',
    message: 'Action completed successfully.',
    details: {},
    executedAt: new Date().toISOString(),
    executedBy: null,
  };
}

/**
 * Returns all mock query results as a flat array
 * @returns {MockQueryResult[]} All mock query results
 */
export function getAllMockResults() {
  return [
    ...PROJECT_PORTFOLIO_DATA,
    ...SALES_PIPELINE_DATA,
    ...PROCUREMENT_DATA,
    ...FINANCE_CASH_FLOW_DATA,
    ...WORKFORCE_DATA,
    ...KNOWLEDGE_IP_DATA,
  ];
}