import { DATA_MODE } from '@/config/env'
import { apiService } from '@/services/api'
import { localService } from '@/services/localStore'
import { checkHealth } from '@/services/http'
import type { DataService } from '@/services/types'

let current: DataService = apiService
let resolved = false

export const service: DataService = {
  get mode() {
    return current.mode
  },
  listLeads: (query) => current.listLeads(query),
  getLead: (id) => current.getLead(id),
  createLead: (input) => current.createLead(input),
  updateLead: (id, input) => current.updateLead(id, input),
  deleteLead: (id) => current.deleteLead(id),
  importCsv: (file, options) => current.importCsv(file, options),
  exportLeads: (query) => current.exportLeads(query),
  getAnalytics: () => current.getAnalytics(),
  getSettings: () => current.getSettings(),
  updateSettings: (config) => current.updateSettings(config),
  rescoreAll: () => current.rescoreAll(),
  askLeads: (input) => current.askLeads(input),
  getAskStatus: () => current.getAskStatus(),
}

export async function initDataService(): Promise<'api' | 'local'> {
  if (resolved) return current.mode
  if (DATA_MODE === 'local') {
    current = localService
  } else if (DATA_MODE === 'api') {
    current = apiService
  } else {
    const healthy = await checkHealth()
    current = healthy ? apiService : localService
  }
  resolved = true
  return current.mode
}
