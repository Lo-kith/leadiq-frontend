import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'
import { formatCurrency, formatNumber, initials } from '@/utils/format'
import type { Lead, LeadQuery } from '@/types/lead'

interface LeadsTableProps {
  leads: Lead[]
  sort: NonNullable<LeadQuery['sort']>
  order: 'asc' | 'desc'
  selectedIds: Set<string>
  onSort: (field: NonNullable<LeadQuery['sort']>) => void
  onToggle: (id: string) => void
  onToggleAll: () => void
  onOpen: (lead: Lead) => void
}

function ScoreBar({ score }: { score: number }) {
  const tone = score >= 70 ? 'bg-accent-400' : score >= 45 ? 'bg-amber-400' : 'bg-rose-400'
  return (
    <div className="flex items-center gap-2">
      <span className="w-7 text-right text-sm font-semibold text-mist-100">{score}</span>
      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-ink-700">
        <div className={cn('h-full rounded-full', tone)} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

function CompletenessIndicator({ value }: { value: number }) {
  const tone = value >= 80 ? 'text-accent-400' : value >= 50 ? 'text-amber-300' : 'text-rose-300'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-ink-700">
        <div className="h-full rounded-full bg-mist-400" style={{ width: `${value}%` }} />
      </div>
      <span className={cn('text-xs font-medium', tone)}>{value}%</span>
    </div>
  )
}

function SortHeader({
  label,
  field,
  sort,
  order,
  onSort,
  align = 'left',
}: {
  label: string
  field: NonNullable<LeadQuery['sort']>
  sort: NonNullable<LeadQuery['sort']>
  order: 'asc' | 'desc'
  onSort: (field: NonNullable<LeadQuery['sort']>) => void
  align?: 'left' | 'right'
}) {
  const active = sort === field
  return (
    <button
      onClick={() => onSort(field)}
      className={cn(
        'inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors',
        active ? 'text-accent-400' : 'text-mist-400 hover:text-mist-200',
        align === 'right' && 'flex-row-reverse',
      )}
    >
      {label}
      {active ? (
        order === 'asc' ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      ) : (
        <ChevronsUpDown className="h-3 w-3 opacity-60" />
      )}
    </button>
  )
}

export function LeadsTable({
  leads,
  sort,
  order,
  selectedIds,
  onSort,
  onToggle,
  onToggleAll,
  onOpen,
}: LeadsTableProps) {
  const allSelected = leads.length > 0 && leads.every((lead) => selectedIds.has(lead.id))

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-ink-700 text-left">
            <th className="w-10 px-4 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                aria-label="Select all rows"
                className="h-4 w-4 rounded border-ink-600 bg-ink-900 accent-accent-500"
              />
            </th>
            <th className="px-4 py-3">
              <SortHeader label="Company" field="companyName" sort={sort} order={order} onSort={onSort} />
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-mist-400">Industry</th>
            <th className="px-4 py-3">
              <SortHeader
                label="Employees"
                field="employeeCount"
                sort={sort}
                order={order}
                onSort={onSort}
                align="right"
              />
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-mist-400">
              Revenue
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-mist-400">Contact</th>
            <th className="px-4 py-3">
              <SortHeader label="Score" field="score" sort={sort} order={order} onSort={onSort} />
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-mist-400">Priority</th>
            <th className="px-4 py-3">
              <SortHeader
                label="Complete"
                field="completeness"
                sort={sort}
                order={order}
                onSort={onSort}
              />
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-mist-400">Status</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr
              key={lead.id}
              className="cursor-pointer border-b border-ink-800 transition-colors hover:bg-ink-800/60"
              onClick={() => onOpen(lead)}
            >
              <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(lead.id)}
                  onChange={() => onToggle(lead.id)}
                  aria-label={`Select ${lead.companyName}`}
                  className="h-4 w-4 rounded border-ink-600 bg-ink-900 accent-accent-500"
                />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-700 text-xs font-semibold text-mist-200">
                    {initials(lead.companyName)}
                  </div>
                  <div className="min-w-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpen(lead)
                      }}
                      className="truncate font-medium text-mist-100 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 rounded"
                    >
                      {lead.companyName}
                    </button>
                    <p className="truncate text-xs text-mist-500">{lead.location ?? 'Location unknown'}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-mist-200">{lead.industry ?? '—'}</td>
              <td className="px-4 py-3 text-right text-mist-200">
                {lead.employeeCount !== null ? formatNumber(lead.employeeCount) : '—'}
              </td>
              <td className="px-4 py-3 text-right text-mist-200">{formatCurrency(lead.revenue)}</td>
              <td className="px-4 py-3">
                {lead.contactName || lead.email || lead.jobTitle ? (
                  <div>
                    <p className="text-mist-200">{lead.contactName ?? '—'}</p>
                    <p className="truncate text-xs text-mist-500">{lead.jobTitle ?? (lead.email ?? 'No email')}</p>
                    {lead.jobTitle && lead.email && <p className="truncate text-xs text-mist-500">{lead.email}</p>}
                  </div>
                ) : (
                  <span className="text-xs text-mist-500">No contact</span>
                )}
              </td>
              <td className="px-4 py-3">
                <ScoreBar score={lead.score} />
              </td>
              <td className="px-4 py-3">
                <PriorityBadge priority={lead.priority} />
              </td>
              <td className="px-4 py-3">
                <CompletenessIndicator value={lead.completeness} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={lead.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
