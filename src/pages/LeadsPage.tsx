import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Plus, Trash2, UserCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States'
import { Select } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { FiltersBar, type FilterState } from '@/components/leads/FiltersBar'
import { LeadsTable } from '@/components/leads/LeadsTable'
import { Pagination } from '@/components/leads/Pagination'
import { LeadDrawer } from '@/components/leads/LeadDrawer'
import { CreateLeadDrawer } from '@/components/leads/CreateLeadDrawer'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useLeads } from '@/hooks/useLeads'
import { service } from '@/services/dataService'
import { LEAD_STATUSES, type Lead, type LeadQuery, type LeadStatus } from '@/types/lead'
import { downloadBlob } from '@/utils/csv'

const EMPTY_FILTERS: FilterState = {
  search: '',
  industry: '',
  location: '',
  status: '',
  priority: '',
  completeness: '',
}

function completenessRange(value: string): Pick<LeadQuery, 'minCompleteness' | 'maxCompleteness'> {
  if (value === 'high') return { minCompleteness: 80 }
  if (value === 'medium') return { minCompleteness: 50, maxCompleteness: 79 }
  if (value === 'low') return { maxCompleteness: 49 }
  return {}
}

export function LeadsPage() {
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState<FilterState>({
    ...EMPTY_FILTERS,
    search: searchParams.get('q') ?? '',
  })
  const debouncedSearch = useDebouncedValue(filters.search, 350)

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [sort, setSort] = useState<NonNullable<LeadQuery['sort']>>('score')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [activeLead, setActiveLead] = useState<Lead | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const query = useMemo<LeadQuery>(
    () => ({
      q: debouncedSearch || undefined,
      industry: filters.industry || undefined,
      location: filters.location || undefined,
      status: (filters.status as LeadStatus) || undefined,
      priority: (filters.priority as LeadQuery['priority']) || undefined,
      ...completenessRange(filters.completeness),
      sort,
      order,
      page,
      limit,
    }),
    [debouncedSearch, filters, sort, order, page, limit],
  )

  const { data, loading, error, refetch } = useLeads(query)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filters.industry, filters.location, filters.status, filters.priority, filters.completeness, limit])

  const handleSort = (field: NonNullable<LeadQuery['sort']>) => {
    if (sort === field) {
      setOrder((current) => (current === 'asc' ? 'desc' : 'asc'))
    } else {
      setSort(field)
      setOrder(field === 'companyName' ? 'asc' : 'desc')
    }
  }

  const toggleRow = (id: string) =>
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const toggleAll = () => {
    if (!data) return
    setSelected((current) => {
      const allSelected = data.data.every((lead) => current.has(lead.id))
      if (allSelected) return new Set()
      return new Set(data.data.map((lead) => lead.id))
    })
  }

  const handleExportSelected = async () => {
    if (selected.size === 0) return
    try {
      const blob = await service.exportLeads({ ids: [...selected].join(',') })
      downloadBlob(blob, `leadiq-selected-${new Date().toISOString().slice(0, 10)}.csv`)
      toast.push(`Exported ${selected.size} lead(s).`, 'success')
    } catch (err) {
      toast.push(err instanceof Error ? err.message : 'Export failed', 'error')
    }
  }

  const handleExportFiltered = async () => {
    try {
      const exportQuery: LeadQuery = { ...query, page: undefined, limit: undefined }
      const blob = await service.exportLeads(exportQuery)
      downloadBlob(blob, `leadiq-filtered-${new Date().toISOString().slice(0, 10)}.csv`)
      toast.push('Filtered leads exported.', 'success')
    } catch (err) {
      toast.push(err instanceof Error ? err.message : 'Export failed', 'error')
    }
  }

  const handleBulkStatus = async (status: LeadStatus) => {
    if (selected.size === 0) return
    try {
      await Promise.all([...selected].map((id) => service.updateLead(id, { status })))
      toast.push(`Updated ${selected.size} lead(s) to ${status}.`, 'success')
      setSelected(new Set())
      refetch()
    } catch (err) {
      toast.push(err instanceof Error ? err.message : 'Bulk update failed', 'error')
    }
  }

  const handleBulkDelete = async () => {
    if (selected.size === 0) return
    if (!window.confirm(`Delete ${selected.size} selected lead(s)?`)) return
    try {
      await Promise.all([...selected].map((id) => service.deleteLead(id)))
      toast.push(`Deleted ${selected.size} lead(s).`, 'success')
      setSelected(new Set())
      refetch()
    } catch (err) {
      toast.push(err instanceof Error ? err.message : 'Bulk delete failed', 'error')
    }
  }

  const total = data?.total ?? 0

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-mist-100">Lead pipeline</h2>
          <p className="text-sm text-mist-400">
            {loading ? 'Loading…' : `${total} lead${total === 1 ? '' : 's'} match your filters`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={handleExportFiltered}>
            Export filtered
          </Button>
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>
            Add lead
          </Button>
        </div>
      </div>

      <Card>
        <FiltersBar
          filters={filters}
          facets={data?.facets ?? { industries: [], locations: [] }}
          onChange={(patch) => setFilters((current) => ({ ...current, ...patch }))}
          onClear={() => setFilters(EMPTY_FILTERS)}
        />

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-b border-ink-700 bg-accent-500/8 px-4 py-2.5">
            <span className="text-sm font-medium text-accent-400">{selected.size} selected</span>
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-mist-400" />
              <Select
                value=""
                onChange={(event) => {
                  if (event.target.value) void handleBulkStatus(event.target.value as LeadStatus)
                }}
                className="h-8 py-0 text-xs"
                aria-label="Set status for selected leads"
              >
                <option value="">Set status…</option>
                {LEAD_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </div>
            <Button size="sm" variant="secondary" icon={<Download className="h-3.5 w-3.5" />} onClick={handleExportSelected}>
              Export selected
            </Button>
            <Button size="sm" variant="danger" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={handleBulkDelete}>
              Delete
            </Button>
            <button
              onClick={() => setSelected(new Set())}
              className="ml-auto inline-flex items-center gap-1 text-xs text-mist-400 hover:text-mist-200"
            >
              <X className="h-3.5 w-3.5" /> Clear selection
            </button>
          </div>
        )}

        {loading && !data ? (
          <LoadingState label="Loading leads…" />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : total === 0 ? (
          <EmptyState
            title="No leads found"
            description="Try adjusting your filters, or import a CSV to get started."
            action={
              <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>
                Add lead
              </Button>
            }
          />
        ) : (
          <>
            <LeadsTable
              leads={data?.data ?? []}
              sort={sort}
              order={order}
              selectedIds={selected}
              onSort={handleSort}
              onToggle={toggleRow}
              onToggleAll={toggleAll}
              onOpen={(lead) => setActiveLead(lead)}
            />
            <Pagination
              page={data?.page ?? 1}
              limit={data?.limit ?? limit}
              total={total}
              totalPages={data?.totalPages ?? 1}
              onPage={setPage}
              onLimit={setLimit}
            />
          </>
        )}
      </Card>

      <LeadDrawer
        lead={activeLead}
        open={Boolean(activeLead)}
        onClose={() => setActiveLead(null)}
        onSaved={(updated) => {
          setActiveLead(updated)
          refetch()
        }}
        onDeleted={() => {
          setActiveLead(null)
          setSelected(new Set())
          refetch()
        }}
      />

      <CreateLeadDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => refetch()}
      />
    </div>
  )
}
