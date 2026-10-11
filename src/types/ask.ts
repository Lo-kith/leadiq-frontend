import type { LeadQuery } from '@/types/lead'

export interface AskHistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AskRequest {
  question: string
  leadId?: string
  history?: AskHistoryMessage[]
  filters?: Partial<LeadQuery>
}

export interface AskContextLead {
  id: string
  companyName: string
}

export interface AskContext {
  mode: 'single' | 'list'
  leadCount: number
  totalMatched: number
  truncated: boolean
  notes: string[]
  leads: AskContextLead[]
}

export interface AskResponse {
  answer: string
  model: string
  context: AskContext
}

export interface AskStatus {
  provider: string
  url: string
  model: string
  available: boolean
  modelAvailable: boolean
  loaded?: boolean
}
