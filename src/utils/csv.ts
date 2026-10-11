import Papa from 'papaparse'
import type { Lead } from '@/types/lead'

export const EXPORT_COLUMNS = [
  'id',
  'companyName',
  'website',
  'industry',
  'location',
  'employeeCount',
  'revenue',
  'contactName',
  'jobTitle',
  'email',
  'linkedinUrl',
  'leadSource',
  'status',
  'priority',
  'score',
  'completeness',
  'nextAction',
  'notes',
  'createdAt',
  'updatedAt',
] as const

export const SAMPLE_CSV = `company_name,website,industry,location,employee_count,revenue,contact_name,job_title,email,linkedin_url,lead_source,status
Northwind Analytics,https://northwind-analytics.example,SaaS,"Boston, MA",180,4500000,Priya Raman,VP of Sales,priya.raman@northwind-analytics.example,https://linkedin.com/in/example-priya,Webinar,New
Lumen Fintech,https://lumenfintech.example,Fintech,"London, UK",420,12000000,Daniel Okafor,CTO,daniel.okafor@lumenfintech.example,https://linkedin.com/in/example-daniel,Referral,Contacted
BrightPath Health,https://brightpathhealth.example,Healthcare,"Austin, TX",950,22000000,Sofia Marchetti,Head of Operations,sofia.marchetti@brightpathhealth.example,,Trade Show,New
Cobalt Manufacturing,https://cobaltmfg.example,Manufacturing,"Detroit, MI",1500,85000000,,,,Cold Outreach,New
Quartz Software,https://quartzsoftware.example,Software,"Toronto, CA",60,2000000,Wei Zhang,CEO,wei.zhang@quartzsoftware.example,https://linkedin.com/in/example-wei,Inbound,Qualified
Northwind Analytics,https://northwind-analytics.example,SaaS,"Boston, MA",180,4500000,Priya Raman,VP of Sales,priya.raman@northwind-analytics.example,,Webinar,New
HyperScale Retail,https://hyperscaleretail.example,Retail,"Seattle, WA",8000,500000000,Amara Nwosu,COO,amara@hyperscaleretail.example,,Webinar,New
Delta Law Partners,,Legal,"Chicago, IL",45,,Marcus Bell,Partner,not-an-email,,Import,New
Vertex Cloud,https://vertexcloud.example,Information Technology,"Denver, CO",300,9000000,Elena Petrova,Director,elena.petrova@vertexcloud.example,https://linkedin.com/in/example-elena,Referral,New
Falcon Media,https://falconmedia.example,Marketing,"New York, NY",75,3000000,,,,Inbound,New
GreenGrid Energy,https://greengrid.example,Energy,"Oslo, NO",520,18000000,Johan Berg,CFO,johan.berg@greengrid.example,,Inbound,New
,https://noname.example,SaaS,Remote,25,500000,No Company,Engineer,nobody@noname.example,,Import,New
`

function sanitizeCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  return /^[=+\-@\t\r]/.test(str) ? `'${str}` : str
}

export function leadsToCsv(leads: Lead[]): string {
  const rows = leads.map((lead) => {
    const row: Record<string, string> = {}
    for (const column of EXPORT_COLUMNS) {
      row[column] = sanitizeCell((lead as unknown as Record<string, unknown>)[column])
    }
    return row
  })
  return Papa.unparse(rows, { columns: [...EXPORT_COLUMNS] })
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function downloadCsvText(csv: string, filename: string): void {
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename)
}

export function downloadSampleCsv(): void {
  downloadCsvText(SAMPLE_CSV, 'leadiq-sample-leads.csv')
}
