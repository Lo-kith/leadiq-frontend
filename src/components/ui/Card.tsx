import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('rounded-xl border border-ink-700 bg-ink-850/80 shadow-sm', className)}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink-700 px-5 py-4">
      <div>
        <h3 className="text-sm font-semibold text-mist-100">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-mist-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
