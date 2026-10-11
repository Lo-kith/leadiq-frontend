import { downloadCsv, http } from '@/services/http'
import type { DataService, ImportOptions } from '@/services/types'
import type {
  Analytics,
  ImportResult,
  Lead,
  LeadInput,
  LeadListResponse,
  LeadQuery,
  ScoringConfig,
} from '@/types/lead'
import type { AskRequest, AskResponse, AskStatus } from '@/types/ask'

function toQueryString(query: LeadQuery): string {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    params.set(key, String(value))
  })
  const str = params.toString()
  return str ? `?${str}` : ''
}

async function importCsv(file: File, options: ImportOptions): Promise<ImportResult> {
  const form = new FormData()
  form.append('file', file)
  form.append('commit', String(options.commit))
  form.append('skipDuplicates', String(options.skipDuplicates))
  const response = await http<{ data: ImportResult }>('/leads/import', { method: 'POST', body: form })
  return response.data
}

export const apiService: DataService = {
  mode: 'api',

  async listLeads(query) {
    return http<LeadListResponse>(`/leads${toQueryString(query)}`)
  },

  async getLead(id) {
    const response = await http<{ data: Lead }>(`/leads/${id}`)
    return response.data
  },

  async createLead(input: LeadInput) {
    const response = await http<{ data: Lead }>('/leads', { method: 'POST', body: input })
    return response.data
  },

  async updateLead(id: string, input: Partial<LeadInput>) {
    const response = await http<{ data: Lead }>(`/leads/${id}`, { method: 'PATCH', body: input })
    return response.data
  },

  async deleteLead(id: string) {
    await http(`/leads/${id}`, { method: 'DELETE' })
  },

  importCsv,

  async exportLeads(query) {
    return downloadCsv(`/leads/export${toQueryString(query)}`)
  },

  async getAnalytics() {
    const response = await http<{ data: Analytics }>('/analytics')
    return response.data
  },

  async getSettings() {
    const response = await http<{ data: { scoringConfig: ScoringConfig } }>('/settings')
    return response.data
  },

  async updateSettings(config: ScoringConfig) {
    const response = await http<{ data: { scoringConfig: ScoringConfig } }>('/settings', {
      method: 'PUT',
      body: config,
    })
    return response.data
  },

  async rescoreAll() {
    const response = await http<{ data: { updated: number } }>('/leads/rescore', { method: 'POST' })
    return response.data
  },

  async askLeads(input: AskRequest) {
    const response = await http<{ data: AskResponse }>('/ask', { method: 'POST', body: input })
    return response.data
  },

  async getAskStatus() {
    const response = await http<{ data: AskStatus }>('/ask/status')
    return response.data
  },

  async enrichLead(id: string) {
    const response = await http<{ data: Lead }>(`/leads/${id}/enrich`, { method: 'POST' })
    return response.data
  },

  async enrichLeads(ids: string[]) {
    const response = await http<{ data: Lead[] }>('/leads/enrich', { method: 'POST', body: { ids } })
    return response.data
  },
}
