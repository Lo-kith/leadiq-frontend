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

export interface ImportOptions {
  commit: boolean
  skipDuplicates: boolean
}

export interface DataService {
  readonly mode: 'api' | 'local'
  listLeads(query: LeadQuery): Promise<LeadListResponse>
  getLead(id: string): Promise<Lead>
  createLead(input: LeadInput): Promise<Lead>
  updateLead(id: string, input: Partial<LeadInput>): Promise<Lead>
  deleteLead(id: string): Promise<void>
  importCsv(file: File, options: ImportOptions): Promise<ImportResult>
  exportLeads(query: LeadQuery): Promise<Blob>
  getAnalytics(): Promise<Analytics>
  getSettings(): Promise<{ scoringConfig: ScoringConfig }>
  updateSettings(config: ScoringConfig): Promise<{ scoringConfig: ScoringConfig }>
  rescoreAll(): Promise<{ updated: number }>
  askLeads(input: AskRequest): Promise<AskResponse>
  getAskStatus(): Promise<AskStatus>
}
