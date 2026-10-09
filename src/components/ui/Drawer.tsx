import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  widthClassName?: string
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  widthClassName = 'max-w-xl',
}: DrawerProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'animate-fade-in relative flex h-full w-full flex-col border-l border-ink-700 bg-ink-850 shadow-2xl',
          widthClassName,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink-700 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-mist-100">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-mist-400">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-mist-400 hover:bg-ink-800 hover:text-mist-100"
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="border-t border-ink-700 px-5 py-4">{footer}</div>}
      </div>
    </div>
  )
}
