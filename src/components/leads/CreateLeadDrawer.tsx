import { useEffect, useState } from 'react'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { service } from '@/services/dataService'
import { LEAD_STATUSES, type Lead, type LeadInput, type LeadStatus } from '@/types/lead'

interface CreateLeadDrawerProps {
  open: boolean
  onClose: () => void
  onCreated: (lead: Lead) => void
}

const EMPTY = {
  companyName: '',
  website: '',
  industry: '',
  location: '',
  employeeCount: '',
  revenue: '',
  contactName: '',
  jobTitle: '',
  email: '',
  linkedinUrl: '',
  leadSource: '',
  status: 'New' as LeadStatus,
  notes: '',
}

export function CreateLeadDrawer({ open, onClose, onCreated }: CreateLeadDrawerProps) {
  const toast = useToast()
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setForm({ ...EMPTY })
  }, [open])

  const patch = (update: Partial<typeof EMPTY>) => setForm((current) => ({ ...current, ...update }))

  const handleCreate = async () => {
    if (!form.companyName.trim()) {
      toast.push('Company name is required.', 'error')
      return
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
      toast.push('Please enter a valid email address.', 'error')
      return
    }
    setSaving(true)
    try {
      const input: LeadInput = {
        companyName: form.companyName.trim(),
        website: form.website.trim() || null,
        industry: form.industry.trim() || null,
        location: form.location.trim() || null,
        employeeCount: form.employeeCount.trim() === '' ? null : Number(form.employeeCount),
        revenue: form.revenue.trim() === '' ? null : Number(form.revenue),
        contactName: form.contactName.trim() || null,
        jobTitle: form.jobTitle.trim() || null,
        email: form.email.trim() || null,
        linkedinUrl: form.linkedinUrl.trim() || null,
        leadSource: form.leadSource.trim() || null,
        status: form.status,
        notes: form.notes.trim() || null,
      }
      const created = await service.createLead(input)
      toast.push('Lead created and scored.', 'success')
      onCreated(created)
      onClose()
    } catch (error) {
      toast.push(error instanceof Error ? error.message : 'Failed to create lead', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Add lead"
      subtitle="Manually capture a lead. The score is calculated on save."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreate} disabled={saving}>
            {saving ? 'Saving…' : 'Create lead'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Company name *" htmlFor="new-company">
          <Input id="new-company" value={form.companyName} onChange={(e) => patch({ companyName: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Website" htmlFor="new-website">
            <Input id="new-website" value={form.website} onChange={(e) => patch({ website: e.target.value })} />
          </Field>
          <Field label="Industry" htmlFor="new-industry">
            <Input id="new-industry" value={form.industry} onChange={(e) => patch({ industry: e.target.value })} />
          </Field>
          <Field label="Location" htmlFor="new-location">
            <Input id="new-location" value={form.location} onChange={(e) => patch({ location: e.target.value })} />
          </Field>
          <Field label="Employees" htmlFor="new-employees">
            <Input id="new-employees" type="number" min={0} value={form.employeeCount} onChange={(e) => patch({ employeeCount: e.target.value })} />
          </Field>
          <Field label="Revenue (USD)" htmlFor="new-revenue">
            <Input id="new-revenue" type="number" min={0} value={form.revenue} onChange={(e) => patch({ revenue: e.target.value })} />
          </Field>
          <Field label="Lead source" htmlFor="new-source">
            <Input id="new-source" value={form.leadSource} onChange={(e) => patch({ leadSource: e.target.value })} />
          </Field>
          <Field label="Contact name" htmlFor="new-contact">
            <Input id="new-contact" value={form.contactName} onChange={(e) => patch({ contactName: e.target.value })} />
          </Field>
          <Field label="Job title" htmlFor="new-jobtitle">
            <Input id="new-jobtitle" value={form.jobTitle} onChange={(e) => patch({ jobTitle: e.target.value })} />
          </Field>
          <Field label="Email" htmlFor="new-email">
            <Input id="new-email" type="email" value={form.email} onChange={(e) => patch({ email: e.target.value })} />
          </Field>
        </div>
        <Field label="LinkedIn URL" htmlFor="new-linkedin">
          <Input id="new-linkedin" value={form.linkedinUrl} onChange={(e) => patch({ linkedinUrl: e.target.value })} />
        </Field>
        <Field label="Status" htmlFor="new-status">
          <Select id="new-status" value={form.status} onChange={(e) => patch({ status: e.target.value as LeadStatus })}>
            {LEAD_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Notes" htmlFor="new-notes">
          <Textarea id="new-notes" value={form.notes} onChange={(e) => patch({ notes: e.target.value })} />
        </Field>
      </div>
    </Drawer>
  )
}
