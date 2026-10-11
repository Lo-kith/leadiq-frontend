export const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Disqualified'] as const
export type LeadStatus = (typeof LEAD_STATUSES)[number]

export const LEAD_PRIORITIES = ['High', 'Medium', 'Low'] as const
export type LeadPriority = (typeof LEAD_PRIORITIES)[number]

export interface ScoringFactor {
  label: string
  points: number
  detail: string
  kind: 'positive' | 'negative' | 'neutral'
}

export interface ScoreBreakdown {
  factors: ScoringFactor[]
  missing: string[]
  reasons: string[]
  nextAction: string | null
}

export interface Lead {
  id: string
  companyName: string
  website: string | null
  websiteDomain: string | null
  industry: string | null
  location: string | null
  employeeCount: number | null
  revenue: number | null
  contactName: string | null
  jobTitle: string | null
  email: string | null
  linkedinUrl: string | null
  leadSource: string | null
  status: LeadStatus
  priority: LeadPriority
  score: number
  completeness: number
  nextAction: string | null
  notes: string | null
  breakdown: ScoreBreakdown
  createdAt: string
  updatedAt: string
}

export interface LeadInput {
  companyName: string
  website?: string | null
  industry?: string | null
  location?: string | null
  employeeCount?: number | null
  revenue?: number | null
  contactName?: string | null
  jobTitle?: string | null
  email?: string | null
  linkedinUrl?: string | null
  leadSource?: string | null
  status?: LeadStatus
  nextAction?: string | null
  notes?: string | null
}

export interface LeadListResponse {
  data: Lead[]
  page: number
  limit: number
  total: number
  totalPages: number
  facets: {
    industries: string[]
    locations: string[]
  }
}

export interface LeadQuery {
  q?: string
  ids?: string
  industry?: string
  location?: string
  status?: LeadStatus | ''
  priority?: LeadPriority | ''
  minScore?: number
  maxScore?: number
  minCompleteness?: number
  maxCompleteness?: number
  sort?: 'score' | 'companyName' | 'employeeCount' | 'createdAt' | 'completeness'
  order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface ScoringConfig {
  targetIndustries: string[]
  minEmployees: number
  maxEmployees: number
  minRevenue: number
  weights: {
    industry: number
    companySize: number
    revenue: number
    website: number
    contact: number
    persona: number
    completeness: number
  }
  priorityThresholds: {
    high: number
    medium: number
  }
}

export interface Analytics {
  totalLeads: number
  qualifiedLeads: number
  highPriorityLeads: number
  incompleteRecords: number
  duplicatesDetected: number
  averageScore: number
  averageCompleteness: number
  byIndustry: Array<{ name: string; value: number }>
  byPriority: Array<{ name: string; value: number }>
  byStatus: Array<{ name: string; value: number }>
}

export type ImportRowStatus = 'valid' | 'invalid' | 'duplicate'

export interface ImportPreviewRecord {
  rowNumber: number
  companyName: string
  status: ImportRowStatus
  issues: string[]
  duplicateOf: string | null
  lead: Partial<Lead>
}

export interface ImportSummary {
  total: number
  valid: number
  invalid: number
  duplicates: number
  skippedDuplicates: number
  saved: number
}

export interface ImportResult {
  committed: boolean
  summary: ImportSummary
  records: ImportPreviewRecord[]
}
