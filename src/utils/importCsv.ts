import Papa from 'papaparse'
import type { ImportPreviewRecord, ImportResult, Lead, LeadStatus } from '@/types/lead'
import {
  extractDomain,
  isValidEmail,
  normalizeCompanyName,
  parseNumber,
} from '@/utils/normalize'

const HEADER_ALIASES: Record<string, string[]> = {
  companyName: ['companyname', 'company', 'name', 'organization', 'organisation', 'account', 'accountname', 'businessname'],
  website: ['website', 'url', 'web', 'domain', 'companywebsite', 'site'],
  industry: ['industry', 'sector', 'vertical', 'category'],
  location: ['location', 'city', 'country', 'region', 'hq', 'headquarters', 'address'],
  employeeCount: ['employeecount', 'employees', 'employeecount', 'headcount', 'size', 'companysize', 'numberofemployees', 'numemployees', 'staff'],
  revenue: ['revenue', 'annualrevenue', 'arr', 'mrr', 'annualrevenue', 'turnover'],
  contactName: ['contactname', 'contact', 'contactname', 'fullname', 'fullname', 'person', 'leadname', 'primarycontact'],
  email: ['email', 'emailaddress', 'emailaddress', 'workemail', 'contactemail'],
  linkedinUrl: ['linkedin', 'linkedinurl', 'linkedinurl', 'linkedinprofile', 'linkedinprofile'],
  leadSource: ['leadsource', 'leadsource', 'source', 'channel'],
  status: ['status', 'leadstatus', 'stage'],
  notes: ['notes', 'note', 'comments', 'remarks'],
}

function canonicalHeader(header: string): string | null {
  const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, '')
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.some((alias) => alias.replace(/[^a-z0-9]/g, '') === normalized)) {
      return field
    }
  }
  return null
}

export interface ParsedRow {
  rowNumber: number
  input: Partial<Lead>
  companyName: string
  websiteDomain: string | null
}

export function parseCsvText(text: string): ParsedRow[] {
  const clean = text.replace(/^\uFEFF/, '')
  const result = Papa.parse<Record<string, unknown>>(clean, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.trim(),
  })

  const rows: ParsedRow[] = []
  result.data.forEach((rawRow, index) => {
    const input: Record<string, unknown> = {}
    for (const [header, value] of Object.entries(rawRow)) {
      const field = canonicalHeader(header)
      if (!field) continue
      if (field === 'employeeCount' || field === 'revenue') {
        input[field] = parseNumber(value)
      } else if (value !== null && value !== undefined && String(value).trim() !== '') {
        input[field] = String(value).trim()
      }
    }
    const companyName = String(input.companyName ?? '').trim()
    if (!companyName && Object.keys(input).length === 0) return
    rows.push({
      rowNumber: index + 2,
      input: input as Partial<Lead>,
      companyName,
      websiteDomain: extractDomain(input.website as string | undefined),
    })
  })
  return rows
}

function classify(
  row: ParsedRow,
  existing: Array<{ companyName: string; websiteDomain: string | null; label: string }>,
): ImportPreviewRecord {
  const issues: string[] = []
  if (!row.companyName) issues.push('Missing company name')
  if (row.input.email && !isValidEmail(String(row.input.email))) issues.push('Invalid email format')
  if (row.input.status && !['New', 'Contacted', 'Qualified', 'Disqualified'].includes(String(row.input.status))) {
    issues.push(`Unknown status "${row.input.status}" (defaulted to New)`)
  }

  const normalizedName = normalizeCompanyName(row.companyName)
  const domain = row.websiteDomain
  let duplicateOf: string | null = null
  for (const key of existing) {
    if (domain && key.websiteDomain && domain === key.websiteDomain.toLowerCase()) {
      duplicateOf = key.label
      break
    }
    if (normalizedName && normalizeCompanyName(key.companyName) === normalizedName) {
      duplicateOf = key.label
      break
    }
  }

  const status: ImportPreviewRecord['status'] = !row.companyName
    ? 'invalid'
    : duplicateOf
      ? 'duplicate'
      : 'valid'

  return {
    rowNumber: row.rowNumber,
    companyName: row.companyName || '(missing)',
    status,
    issues,
    duplicateOf,
    lead: row.input,
  }
}

export interface ClientImportOptions {
  commit: boolean
  skipDuplicates: boolean
}

export function classifyImport(
  text: string,
  existingLeads: Lead[],
  options: ClientImportOptions,
): { result: ImportResult; validRows: ParsedRow[] } {
  const rows = parseCsvText(text)
  const existing = existingLeads.map((lead) => ({
    companyName: lead.companyName,
    websiteDomain: lead.websiteDomain,
    label: lead.companyName,
  }))

  const records = rows.map((row) => classify(row, existing))

  // Mark duplicates that only repeat within the same file.
  const seen = new Map<string, string>()
  rows.forEach((row, index) => {
    const record = records[index]
    if (!record || record.status === 'invalid') return
    const key = normalizeCompanyName(row.companyName)
    if (!key) return
    if (seen.has(key)) {
      if (record.status !== 'duplicate') {
        record.status = 'duplicate'
        record.duplicateOf = `${seen.get(key)} (row in this file)`
        record.issues = [...record.issues, 'Duplicate company name within this file']
      }
    } else {
      seen.set(key, row.companyName)
    }
  })

  const duplicateCount = records.filter((r) => r.status === 'duplicate').length
  const invalidCount = records.filter((r) => r.status === 'invalid').length
  const validCount = records.filter((r) => r.status === 'valid').length

  const validRows = options.commit
    ? rows.filter((_, index) => {
        const record = records[index]
        return (
          record &&
          (record.status === 'valid' || (record.status === 'duplicate' && !options.skipDuplicates))
        )
      })
    : []

  const result: ImportResult = {
    committed: options.commit,
    summary: {
      total: rows.length,
      valid: validCount,
      invalid: invalidCount,
      duplicates: duplicateCount,
      skippedDuplicates: options.commit && options.skipDuplicates ? duplicateCount : 0,
      saved: validRows.length,
    },
    records: records.map((record) => ({
      ...record,
      lead: {
        ...record.lead,
        status: (['New', 'Contacted', 'Qualified', 'Disqualified'].includes(String(record.lead.status))
          ? record.lead.status
          : 'New') as LeadStatus,
      },
    })),
  }

  return { result, validRows }
}
