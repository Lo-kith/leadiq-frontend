import type { LeadPriority, LeadStatus } from '@/types/lead'
import { cn } from '@/utils/cn'

type Tone = 'teal' | 'blue' | 'amber' | 'rose' | 'slate' | 'violet'

const TONES: Record<Tone, string> = {
  teal: 'bg-accent-500/15 text-accent-400 border-accent-500/30',
  blue: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  slate: 'bg-ink-700/60 text-mist-300 border-ink-600',
  violet: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
}

interface BadgeProps {
  tone?: Tone
  children: React.ReactNode
  className?: string
}

export function Badge({ tone = 'slate', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

const PRIORITY_TONES: Record<LeadPriority, Tone> = {
  High: 'teal',
  Medium: 'amber',
  Low: 'slate',
}

export function PriorityBadge({ priority }: { priority: LeadPriority }) {
  return <Badge tone={PRIORITY_TONES[priority]}>{priority}</Badge>
}

const STATUS_TONES: Record<LeadStatus, Tone> = {
  New: 'blue',
  Contacted: 'violet',
  Qualified: 'teal',
  Disqualified: 'rose',
}

export function StatusBadge({ status }: { status: LeadStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{status}</Badge>
}
