import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Select } from '@/components/ui/Field'

interface PaginationProps {
  page: number
  limit: number
  total: number
  totalPages: number
  onPage: (page: number) => void
  onLimit: (limit: number) => void
}

export function Pagination({ page, limit, total, totalPages, onPage, onLimit }: PaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-ink-700 px-4 py-3 text-sm text-mist-400 sm:flex-row">
      <p>
        Showing <span className="text-mist-200">{start}</span>–<span className="text-mist-200">{end}</span> of{' '}
        <span className="text-mist-200">{total}</span> leads
      </p>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs">Rows</span>
          <Select
            value={String(limit)}
            onChange={(event) => onLimit(Number(event.target.value))}
            className="h-8 w-20 py-0 text-xs"
            aria-label="Rows per page"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-ink-600 text-mist-300 hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 text-xs">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPage(page + 1)}
            disabled={page >= totalPages}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-ink-600 text-mist-300 hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
