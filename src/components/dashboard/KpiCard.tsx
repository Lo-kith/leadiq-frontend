import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface KpiCardProps {
  label: string
  value: ReactNode
  hint?: string
  icon: ReactNode
  tone?: 'teal' | 'blue' | 'amber' | 'rose' | 'violet'
}

const TONES = {
  teal: 'bg-accent-500/15 text-accent-400',
  blue: 'bg-sky-500/15 text-sky-300',
  amber: 'bg-amber-500/15 text-amber-300',
  rose: 'bg-rose-500/15 text-rose-300',
  violet: 'bg-violet-500/15 text-violet-300',
}

export function KpiCard({ label, value, hint, icon, tone = 'teal' }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-ink-700 bg-ink-850/80 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium tracking-wide text-mist-400 uppercase">{label}</p>
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', TONES[tone])}>{icon}</div>
      </div>
      <p className="mt-3 text-2xl font-semibold text-mist-100">{value}</p>
      {hint && <p className="mt-1 text-xs text-mist-500">{hint}</p>}
    </div>
  )
}
