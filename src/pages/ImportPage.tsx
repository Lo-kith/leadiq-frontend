import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  RefreshCw,
  UploadCloud,
  XCircle,
} from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import { service } from '@/services/dataService'
import type { ImportResult, ImportRowStatus } from '@/types/lead'
import { cn } from '@/utils/cn'
import { downloadSampleCsv } from '@/utils/csv'

const MAX_MB = 20

const STATUS_TONES: Record<ImportRowStatus, 'teal' | 'rose' | 'amber'> = {
  valid: 'teal',
  invalid: 'rose',
  duplicate: 'amber',
}

export function ImportPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportResult | null>(null)
  const [committed, setCommitted] = useState<ImportResult | null>(null)
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [loading, setLoading] = useState(false)
  const [committing, setCommitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const runPreview = async (selected: File, skip: boolean) => {
    setLoading(true)
    setError(null)
    setCommitted(null)
    try {
      const result = await service.importCsv(selected, { commit: false, skipDuplicates: skip })
      setPreview(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read CSV')
      setPreview(null)
    } finally {
      setLoading(false)
    }
  }

  const handleFile = (selected: File | undefined | null) => {
    if (!selected) return
    if (!selected.name.toLowerCase().endsWith('.csv')) {
      toast.push('Please choose a .csv file.', 'error')
      return
    }
    if (selected.size > MAX_MB * 1024 * 1024) {
      toast.push(`File exceeds the ${MAX_MB}MB limit.`, 'error')
      return
    }
    setFile(selected)
    void runPreview(selected, skipDuplicates)
  }

  const handleCommit = async () => {
    if (!file) return
    setCommitting(true)
    try {
      const result = await service.importCsv(file, { commit: true, skipDuplicates })
      setCommitted(result)
      setPreview(result)
      toast.push(`Imported ${result.summary.saved} lead(s).`, 'success')
    } catch (err) {
      toast.push(err instanceof Error ? err.message : 'Import failed', 'error')
    } finally {
      setCommitting(false)
    }
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setCommitted(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const summary = preview?.summary

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Upload a CSV"
          subtitle="Drag and drop or browse. We validate, flag duplicates and preview before saving."
          action={
            <Button variant="ghost" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={downloadSampleCsv}>
              Sample CSV
            </Button>
          }
        />
        <div className="p-5">
          <div
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault()
              setDragging(false)
              handleFile(event.dataTransfer.files?.[0])
            }}
            className={cn(
              'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors',
              dragging ? 'border-accent-500 bg-accent-500/8' : 'border-ink-600 bg-ink-900/50',
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-800 text-accent-400">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-mist-100">Drop your CSV here</p>
              <p className="mt-1 text-xs text-mist-500">Max {MAX_MB}MB · .csv files only</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
            <Button variant="secondary" onClick={() => inputRef.current?.click()}>
              Browse files
            </Button>
            {file && (
              <p className="flex items-center gap-1.5 text-xs text-mist-400">
                <FileSpreadsheet className="h-3.5 w-3.5 text-accent-400" />
                {file.name} · {(file.size / 1024).toFixed(0)} KB
              </p>
            )}
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm text-mist-300">
            <input
              type="checkbox"
              checked={skipDuplicates}
              onChange={(event) => {
                setSkipDuplicates(event.target.checked)
                if (file) void runPreview(file, event.target.checked)
              }}
              className="h-4 w-4 rounded border-ink-600 bg-ink-900 accent-accent-500"
            />
            Skip duplicate records on import
          </label>
        </div>
      </Card>

      {loading && (
        <Card>
          <div className="flex items-center justify-center gap-3 py-12 text-mist-400">
            <RefreshCw className="h-5 w-5 animate-spin-slow text-accent-400" />
            <span className="text-sm">Validating your file…</span>
          </div>
        </Card>
      )}

      {error && !loading && (
        <Card>
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <XCircle className="h-6 w-6 text-rose-300" />
            <p className="text-sm text-mist-200">{error}</p>
            {file && (
              <Button variant="secondary" size="sm" onClick={() => runPreview(file, skipDuplicates)}>
                Try again
              </Button>
            )}
          </div>
        </Card>
      )}

      {preview && summary && !loading && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <SummaryTile label="Total rows" value={summary.total} tone="blue" />
            <SummaryTile label="Valid" value={summary.valid} tone="teal" />
            <SummaryTile label="Duplicates" value={summary.duplicates} tone="amber" />
            <SummaryTile label="Invalid" value={summary.invalid} tone="rose" />
          </div>

          <Card>
            <CardHeader
              title={committed ? 'Import complete' : 'Import preview'}
              subtitle={
                committed
                  ? `${summary.saved} lead(s) saved.`
                  : `${summary.valid} valid · ${summary.duplicates} duplicates · ${summary.invalid} invalid`
              }
              action={
                committed ? (
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={reset}>
                      Import another
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<ArrowRight className="h-3.5 w-3.5" />}
                      onClick={() => navigate('/leads')}
                    >
                      View leads
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={reset} disabled={committing}>
                      Clear
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                      onClick={handleCommit}
                      disabled={committing || summary.valid === 0}
                    >
                      {committing ? 'Saving…' : `Import ${summary.valid} lead(s)`}
                    </Button>
                  </div>
                )
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-ink-700 text-left text-xs font-semibold uppercase tracking-wide text-mist-400">
                    <th className="px-4 py-3">Row</th>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.records.map((record) => (
                    <tr key={record.rowNumber} className="border-b border-ink-800">
                      <td className="px-4 py-2.5 text-mist-500">{record.rowNumber}</td>
                      <td className="px-4 py-2.5 text-mist-100">{record.companyName}</td>
                      <td className="px-4 py-2.5">
                        <Badge tone={STATUS_TONES[record.status]}>{record.status}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-mist-400">
                        {record.duplicateOf && <span className="text-amber-300">Duplicate of {record.duplicateOf}. </span>}
                        {record.issues.length > 0 ? record.issues.join(' · ') : 'Looks good'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'teal' | 'blue' | 'amber' | 'rose'
}) {
  const tones = {
    teal: 'border-accent-500/30 text-accent-400',
    blue: 'border-sky-500/30 text-sky-300',
    amber: 'border-amber-500/30 text-amber-300',
    rose: 'border-rose-500/30 text-rose-300',
  }
  return (
    <div className={cn('rounded-xl border bg-ink-850/70 p-4', tones[tone])}>
      <p className="text-xs font-medium uppercase tracking-wide text-mist-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-mist-100">{value}</p>
    </div>
  )
}
