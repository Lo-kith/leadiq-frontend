import { Filter, Search, X } from 'lucide-react'
import { Select } from '@/components/ui/Field'
import { LEAD_PRIORITIES, LEAD_STATUSES } from '@/types/lead'

export interface FilterState {
  search: string
  industry: string
  location: string
  status: string
  priority: string
  completeness: string
}

interface FiltersBarProps {
  filters: FilterState
  facets: { industries: string[]; locations: string[] }
  onChange: (patch: Partial<FilterState>) => void
  onClear: () => void
}

export function FiltersBar({ filters, facets, onChange, onClear }: FiltersBarProps) {
  const hasActive =
    filters.search || filters.industry || filters.location || filters.status || filters.priority || filters.completeness

  return (
    <div className="flex flex-col gap-3 border-b border-ink-700 p-4 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-mist-500" />
        <input
          value={filters.search}
          onChange={(event) => onChange({ search: event.target.value })}
          placeholder="Search company, contact, email or domain…"
          className="w-full rounded-lg border border-ink-600 bg-ink-900 py-2 pr-3 pl-9 text-sm text-mist-100 placeholder:text-mist-500 focus:border-accent-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:items-center">
        <Select
          value={filters.industry}
          onChange={(event) => onChange({ industry: event.target.value })}
          className="min-w-[130px]"
          aria-label="Filter by industry"
        >
          <option value="">All industries</option>
          {facets.industries.map((industry) => (
            <option key={industry} value={industry}>
              {industry}
            </option>
          ))}
        </Select>

        <Select
          value={filters.location}
          onChange={(event) => onChange({ location: event.target.value })}
          className="min-w-[130px]"
          aria-label="Filter by location"
        >
          <option value="">All locations</option>
          {facets.locations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </Select>

        <Select
          value={filters.status}
          onChange={(event) => onChange({ status: event.target.value })}
          className="min-w-[120px]"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {LEAD_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>

        <Select
          value={filters.priority}
          onChange={(event) => onChange({ priority: event.target.value })}
          className="min-w-[120px]"
          aria-label="Filter by priority"
        >
          <option value="">All priorities</option>
          {LEAD_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </Select>

        <Select
          value={filters.completeness}
          onChange={(event) => onChange({ completeness: event.target.value })}
          className="min-w-[140px]"
          aria-label="Filter by completeness"
        >
          <option value="">Any completeness</option>
          <option value="high">Complete (80%+)</option>
          <option value="medium">Partial (50–79%)</option>
          <option value="low">Incomplete (&lt;50%)</option>
        </Select>

        {hasActive && (
          <button
            onClick={onClear}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-ink-600 px-3 py-2 text-sm text-mist-300 hover:bg-ink-800"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>

      {!hasActive && (
        <div className="hidden items-center gap-2 text-xs text-mist-500 lg:flex">
          <Filter className="h-3.5 w-3.5" />
          Filters
        </div>
      )}
    </div>
  )
}
