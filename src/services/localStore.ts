import type { DataService, ImportOptions } from '@/services/types'
import type {
  Analytics,
  Lead,
  LeadInput,
  LeadListResponse,
  LeadPriority,
  LeadQuery,
  LeadStatus,
  ScoringConfig,
} from '@/types/lead'
import { DEFAULT_SCORING_CONFIG, computeScore, type ScorableLead } from '@/utils/scoring'
import { classifyImport } from '@/utils/importCsv'
import { leadsToCsv } from '@/utils/csv'
import { extractDomain, normalizeEmail, normalizeUrl, toTrimmedString } from '@/utils/normalize'

const LEADS_KEY = 'leadiq.leads.v1'
const SETTINGS_KEY = 'leadiq.settings.v1'
const LAST_IMPORT_KEY = 'leadiq.lastImport.v1'

function uid(): string {
  return `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value))
}

function loadLeads(): Lead[] {
  return read<Lead[]>(LEADS_KEY, [])
}

function saveLeads(leads: Lead[]): void {
  write(LEADS_KEY, leads)
}

function loadConfig(): ScoringConfig {
  return read<ScoringConfig>(SETTINGS_KEY, DEFAULT_SCORING_CONFIG)
}

function normalizeInput(input: Partial<LeadInput>): ScorableLead {
  const website = normalizeUrl(input.website ?? null)
  return {
    companyName: toTrimmedString(input.companyName) ?? '',
    website,
    industry: toTrimmedString(input.industry),
    location: toTrimmedString(input.location),
    employeeCount: input.employeeCount ?? null,
    revenue: input.revenue ?? null,
    contactName: toTrimmedString(input.contactName),
    jobTitle: toTrimmedString(input.jobTitle),
    email: normalizeEmail(input.email ?? null),
    linkedinUrl: toTrimmedString(input.linkedinUrl),
    leadSource: toTrimmedString(input.leadSource),
    status: (input.status ?? 'New') as LeadStatus,
  }
}

function buildLead(input: Partial<LeadInput>, config: ScoringConfig, base?: Lead): Lead {
  const normalized = normalizeInput(input)
  const { score, priority, completeness, breakdown } = computeScore(normalized, config)
  const now = new Date().toISOString()
  const website = normalized.website ?? null
  return {
    id: base?.id ?? uid(),
    companyName: normalized.companyName ?? '',
    website,
    websiteDomain: extractDomain(website) ?? extractDomain(normalized.companyName),
    industry: normalized.industry ?? null,
    location: normalized.location ?? null,
    employeeCount: normalized.employeeCount ?? null,
    revenue: normalized.revenue ?? null,
    contactName: normalized.contactName ?? null,
    jobTitle: normalized.jobTitle ?? null,
    email: normalized.email ?? null,
    linkedinUrl: normalized.linkedinUrl ?? null,
    leadSource: normalized.leadSource ?? null,
    status: (normalized.status as LeadStatus) ?? 'New',
    priority,
    score,
    completeness,
    nextAction: toTrimmedString(input.nextAction) ?? breakdown.nextAction,
    notes: toTrimmedString(input.notes),
    breakdown,
    createdAt: base?.createdAt ?? now,
    updatedAt: now,
  }
}

function matchesQuery(lead: Lead, query: LeadQuery): boolean {
  if (query.ids) {
    const ids = query.ids.split(',').map((id) => id.trim())
    if (!ids.includes(lead.id)) return false
  }
  if (query.q) {
    const needle = query.q.toLowerCase()
    const haystack = [lead.companyName, lead.contactName, lead.email, lead.websiteDomain]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    if (!haystack.includes(needle)) return false
  }
  if (query.industry && !(lead.industry ?? '').toLowerCase().includes(query.industry.toLowerCase())) return false
  if (query.location && !(lead.location ?? '').toLowerCase().includes(query.location.toLowerCase())) return false
  if (query.status && lead.status !== query.status) return false
  if (query.priority && lead.priority !== query.priority) return false
  if (query.minScore !== undefined && lead.score < query.minScore) return false
  if (query.maxScore !== undefined && lead.score > query.maxScore) return false
  if (query.minCompleteness !== undefined && lead.completeness < query.minCompleteness) return false
  if (query.maxCompleteness !== undefined && lead.completeness > query.maxCompleteness) return false
  return true
}

function sortLeads(leads: Lead[], query: LeadQuery): Lead[] {
  const field = query.sort ?? 'score'
  const dir = query.order === 'asc' ? 1 : -1
  return [...leads].sort((a, b) => {
    let av: string | number = 0
    let bv: string | number = 0
    if (field === 'companyName') {
      av = a.companyName.toLowerCase()
      bv = b.companyName.toLowerCase()
    } else if (field === 'createdAt') {
      av = a.createdAt
      bv = b.createdAt
    } else {
      av = (a[field] as number) ?? 0
      bv = (b[field] as number) ?? 0
    }
    if (av < bv) return -1 * dir
    if (av > bv) return 1 * dir
    return 0
  })
}

function computeAnalytics(leads: Lead[]): Analytics {
  const byIndustryMap = new Map<string, number>()
  const byPriorityMap = new Map<string, number>()
  const byStatusMap = new Map<string, number>()
  leads.forEach((lead) => {
    byIndustryMap.set(lead.industry ?? 'Unknown', (byIndustryMap.get(lead.industry ?? 'Unknown') ?? 0) + 1)
    byPriorityMap.set(lead.priority, (byPriorityMap.get(lead.priority) ?? 0) + 1)
    byStatusMap.set(lead.status, (byStatusMap.get(lead.status) ?? 0) + 1)
  })
  const avg = (values: number[]) =>
    values.length ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length) : 0

  return {
    totalLeads: leads.length,
    qualifiedLeads: leads.filter((l) => l.status === 'Qualified').length,
    highPriorityLeads: leads.filter((l) => l.priority === 'High').length,
    incompleteRecords: leads.filter((l) => l.completeness < 60).length,
    duplicatesDetected: read<number>(LAST_IMPORT_KEY, 0),
    averageScore: avg(leads.map((l) => l.score)),
    averageCompleteness: avg(leads.map((l) => l.completeness)),
    byIndustry: [...byIndustryMap.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10),
    byPriority: (['High', 'Medium', 'Low'] as LeadPriority[]).map((name) => ({
      name,
      value: byPriorityMap.get(name) ?? 0,
    })),
    byStatus: (['New', 'Contacted', 'Qualified', 'Disqualified'] as LeadStatus[]).map((name) => ({
      name,
      value: byStatusMap.get(name) ?? 0,
    })),
  }
}

export const localService: DataService = {
  mode: 'local',

  async listLeads(query) {
    const all = loadLeads()
    const filtered = sortLeads(all.filter((lead) => matchesQuery(lead, query)), query)
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    const start = (page - 1) * limit
    const pageItems = filtered.slice(start, start + limit)
    const industries = [...new Set(all.map((l) => l.industry).filter(Boolean))] as string[]
    const locations = [...new Set(all.map((l) => l.location).filter(Boolean))] as string[]
    return {
      data: pageItems,
      page,
      limit,
      total: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
      facets: { industries: industries.sort(), locations: locations.sort() },
    } satisfies LeadListResponse
  },

  async getLead(id) {
    const lead = loadLeads().find((l) => l.id === id)
    if (!lead) throw new Error('Lead not found')
    return lead
  },

  async createLead(input) {
    const config = loadConfig()
    const lead = buildLead(input, config)
    if (!lead.companyName) throw new Error('Company name is required')
    const leads = loadLeads()
    leads.unshift(lead)
    saveLeads(leads)
    return lead
  },

  async updateLead(id, input) {
    const leads = loadLeads()
    const index = leads.findIndex((l) => l.id === id)
    if (index === -1) throw new Error('Lead not found')
    const config = loadConfig()
    const merged: Partial<LeadInput> = { ...leads[index], ...input }
    const updated = buildLead(merged, config, leads[index])
    leads[index] = updated
    saveLeads(leads)
    return updated
  },

  async deleteLead(id) {
    saveLeads(loadLeads().filter((l) => l.id !== id))
  },

  async importCsv(file, options: ImportOptions) {
    const text = await file.text()
    const existing = loadLeads()
    const { result, validRows } = classifyImport(text, existing, options)
    if (options.commit && validRows.length) {
      const config = loadConfig()
      const created = validRows.map((row) => buildLead(row.input, config))
      saveLeads([...created, ...existing])
      write(LAST_IMPORT_KEY, result.summary.duplicates)
    }
    return result
  },

  async exportLeads(query) {
    const leads = sortLeads(loadLeads().filter((lead) => matchesQuery(lead, query)), query)
    return new Blob([leadsToCsv(leads)], { type: 'text/csv;charset=utf-8;' })
  },

  async getAnalytics() {
    return computeAnalytics(loadLeads())
  },

  async getSettings() {
    return { scoringConfig: loadConfig() }
  },

  async updateSettings(config) {
    write(SETTINGS_KEY, config)
    return { scoringConfig: config }
  },

  async rescoreAll() {
    const config = loadConfig()
    const leads = loadLeads().map((lead) => buildLead(lead, config, lead))
    saveLeads(leads)
    return { updated: leads.length }
  },

  async askLeads() {
    throw new Error(
      'Ask Your Leads requires the backend API and a running Ollama model. It is not available in local demo mode.',
    )
  },

  async getAskStatus() {
    return {
      provider: 'ollama',
      url: '',
      model: '',
      available: false,
      modelAvailable: false,
    }
  },

  async enrichLead(): Promise<import('@/types/lead').Lead> {
    throw new Error('Enrichment requires the backend API.')
  },

  async enrichLeads(): Promise<import('@/types/lead').Lead[]> {
    throw new Error('Enrichment requires the backend API.')
  },
}
