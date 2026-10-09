import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  MinusCircle,
  Pencil,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { service } from '@/services/dataService'
import { LEAD_STATUSES, type Lead, type LeadInput, type LeadStatus } from '@/types/lead'
import { cn } from '@/utils/cn'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'

interface LeadDrawerProps {
  lead: Lead | null
  open: boolean
  onClose: () => void
  onSaved: (lead: Lead) => void
  onDeleted: (id: string) => void
}

interface FormState {
  companyName: string
  website: string
  industry: string
  location: string
  employeeCount: string
  revenue: string
  contactName: string
  email: string
  linkedinUrl: string
  leadSource: string
  status: LeadStatus
  nextAction: string
  notes: string
}

function toForm(lead: Lead): FormState {
  return {
    companyName: lead.companyName,
    website: lead.website ?? '',
    industry: lead.industry ?? '',
    location: lead.location ?? '',
    employeeCount: lead.employeeCount !== null ? String(lead.employeeCount) : '',
    revenue: lead.revenue !== null ? String(lead.revenue) : '',
    contactName: lead.contactName ?? '',
    email: lead.email ?? '',
    linkedinUrl: lead.linkedinUrl ?? '',
    leadSource: lead.leadSource ?? '',
    status: lead.status,
    nextAction: lead.nextAction ?? '',
    notes: lead.notes ?? '',
  }
}

function FactorIcon({ kind }: { kind: 'positive' | 'negative' | 'neutral' }) {
  if (kind === 'positive') return <CheckCircle2 className="h-4 w-4 text-accent-400" />
  if (kind === 'negative') return <AlertCircle className="h-4 w-4 text-rose-300" />
  return <MinusCircle className="h-4 w-4 text-mist-500" />
}

export function LeadDrawer({ lead, open, onClose, onSaved, onDeleted }: LeadDrawerProps) {
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState<FormState | null>(null)

  useEffect(() => {
    if (lead) {
      setForm(toForm(lead))
      setEditing(false)
    }
  }, [lead])

  const scoreTone = useMemo(() => {
    if (!lead) return 'text-mist-100'
    if (lead.score >= 70) return 'text-accent-400'
    if (lead.score >= 45) return 'text-amber-300'
    return 'text-rose-300'
  }, [lead])

  if (!lead || !form) return null

  const patch = (update: Partial<FormState>) => setForm((current) => (current ? { ...current, ...update } : current))

  const handleSave = async () => {
    setSaving(true)
    try {
      const input: Partial<LeadInput> = {
        companyName: form.companyName.trim(),
        website: form.website.trim() || null,
        industry: form.industry.trim() || null,
        location: form.location.trim() || null,
        employeeCount: form.employeeCount.trim() === '' ? null : Number(form.employeeCount),
        revenue: form.revenue.trim() === '' ? null : Number(form.revenue),
        contactName: form.contactName.trim() || null,
        email: form.email.trim() || null,
        linkedinUrl: form.linkedinUrl.trim() || null,
        leadSource: form.leadSource.trim() || null,
        status: form.status,
        nextAction: form.nextAction.trim() || null,
        notes: form.notes.trim() || null,
      }
      const updated = await service.updateLead(lead.id, input)
      toast.push('Lead updated. Score recalculated.', 'success')
      setEditing(false)
      onSaved(updated)
    } catch (error) {
      toast.push(error instanceof Error ? error.message : 'Failed to update lead', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${lead.companyName}? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await service.deleteLead(lead.id)
      toast.push('Lead deleted.', 'success')
      onDeleted(lead.id)
    } catch (error) {
      toast.push(error instanceof Error ? error.message : 'Failed to delete lead', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={lead.companyName}
      subtitle={lead.website ?? 'No website'}
      footer={
        editing ? (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setForm(toForm(lead)); setEditing(false) }} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving || !form.companyName.trim()}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <Button variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
            <Button variant="primary" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditing(true)}>
              Edit lead
            </Button>
          </div>
        )
      }
    >
      {!editing ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-xl border border-ink-700 bg-ink-900 p-4">
            <div>
              <p className="text-xs text-mist-400">Qualification score</p>
              <p className={cn('text-3xl font-semibold', scoreTone)}>{lead.score}<span className="text-base text-mist-500">/100</span></p>
              <div className="mt-2 flex items-center gap-2">
                <PriorityBadge priority={lead.priority} />
                <StatusBadge status={lead.status} />
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-mist-400">Data completeness</p>
              <p className="text-2xl font-semibold text-mist-100">{lead.completeness}%</p>
              <p className="text-xs text-mist-500">Updated {formatDate(lead.updatedAt)}</p>
            </div>
          </div>

          {lead.breakdown.nextAction && (
            <div className="flex items-start gap-2 rounded-lg border border-accent-500/25 bg-accent-500/8 p-3 text-sm">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
              <p className="text-mist-200">
                <span className="font-medium text-accent-400">Suggested next action: </span>
                {lead.breakdown.nextAction}
              </p>
            </div>
          )}

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-mist-400">Company & contact</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <Detail label="Website" value={lead.website} link={lead.website} />
              <Detail label="Industry" value={lead.industry} />
              <Detail label="Location" value={lead.location} />
              <Detail label="Employees" value={lead.employeeCount !== null ? formatNumber(lead.employeeCount) : null} />
              <Detail label="Revenue" value={lead.revenue !== null ? formatCurrency(lead.revenue) : null} />
              <Detail label="Lead source" value={lead.leadSource} />
              <Detail label="Contact" value={lead.contactName} />
              <Detail label="Email" value={lead.email} />
              <Detail label="LinkedIn" value={lead.linkedinUrl} link={lead.linkedinUrl} />
            </dl>
          </section>

          {lead.notes && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-mist-400">Notes</h3>
              <p className="rounded-lg border border-ink-700 bg-ink-900 p-3 text-sm text-mist-200 whitespace-pre-wrap">
                {lead.notes}
              </p>
            </section>
          )}

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-mist-400">
              Score breakdown
            </h3>
            <div className="space-y-2">
              {lead.breakdown.factors.map((factor) => (
                <div
                  key={factor.label}
                  className="flex items-start gap-2.5 rounded-lg border border-ink-700 bg-ink-900 p-3"
                >
                  <FactorIcon kind={factor.kind} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-mist-100">{factor.label}</p>
                      <span
                        className={cn(
                          'text-xs font-semibold',
                          factor.points > 0 ? 'text-accent-400' : 'text-mist-500',
                        )}
                      >
                        {factor.points > 0 ? `+${factor.points}` : '0'}
                      </span>
                    </div>
                    <p className="text-xs text-mist-500">{factor.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {lead.breakdown.missing.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-mist-400">
                Missing information (treated as unknown)
              </h3>
              <ul className="space-y-1.5">
                {lead.breakdown.missing.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-amber-200/90">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="rounded-lg border border-ink-700 bg-ink-900/60 p-3 text-xs text-mist-500">
            Scores are estimates based on the data on file (deterministic, rule-based). They are not a
            guarantee of buying intent or conversion.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <Field label="Company name" htmlFor="companyName">
            <Input
              id="companyName"
              value={form.companyName}
              onChange={(event) => patch({ companyName: event.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Website" htmlFor="website">
              <Input id="website" value={form.website} onChange={(event) => patch({ website: event.target.value })} />
            </Field>
            <Field label="Industry" htmlFor="industry">
              <Input id="industry" value={form.industry} onChange={(event) => patch({ industry: event.target.value })} />
            </Field>
            <Field label="Location" htmlFor="location">
              <Input id="location" value={form.location} onChange={(event) => patch({ location: event.target.value })} />
            </Field>
            <Field label="Employees" htmlFor="employeeCount">
              <Input
                id="employeeCount"
                type="number"
                min={0}
                value={form.employeeCount}
                onChange={(event) => patch({ employeeCount: event.target.value })}
              />
            </Field>
            <Field label="Revenue (USD)" htmlFor="revenue">
              <Input
                id="revenue"
                type="number"
                min={0}
                value={form.revenue}
                onChange={(event) => patch({ revenue: event.target.value })}
              />
            </Field>
            <Field label="Lead source" htmlFor="leadSource">
              <Input id="leadSource" value={form.leadSource} onChange={(event) => patch({ leadSource: event.target.value })} />
            </Field>
            <Field label="Contact name" htmlFor="contactName">
              <Input id="contactName" value={form.contactName} onChange={(event) => patch({ contactName: event.target.value })} />
            </Field>
            <Field label="Email" htmlFor="email">
              <Input id="email" type="email" value={form.email} onChange={(event) => patch({ email: event.target.value })} />
            </Field>
          </div>
          <Field label="LinkedIn URL" htmlFor="linkedinUrl">
            <Input id="linkedinUrl" value={form.linkedinUrl} onChange={(event) => patch({ linkedinUrl: event.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Status" htmlFor="status">
              <Select
                id="status"
                value={form.status}
                onChange={(event) => patch({ status: event.target.value as LeadStatus })}
              >
                {LEAD_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Next action" htmlFor="nextAction">
              <Input id="nextAction" value={form.nextAction} onChange={(event) => patch({ nextAction: event.target.value })} />
            </Field>
          </div>
          <Field label="Notes" htmlFor="notes">
            <Textarea id="notes" value={form.notes} onChange={(event) => patch({ notes: event.target.value })} />
          </Field>
        </div>
      )}
    </Drawer>
  )
}

function Detail({ label, value, link }: { label: string; value: string | null; link?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-mist-500">{label}</dt>
      <dd className="mt-0.5 text-mist-200">
        {value ? (
          link ? (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-accent-400 hover:underline"
            >
              <span className="truncate">{value}</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          ) : (
            <span className="break-words">{value}</span>
          )
        ) : (
          <span className="text-mist-500">Unknown</span>
        )}
      </dd>
    </div>
  )
}
