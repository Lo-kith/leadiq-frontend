import { ReactNode, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
  widthClassName?: string
}

export function Drawer({ open, onClose, title, subtitle, children, footer, wide, widthClassName = 'max-w-xl' }: DrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const prevFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    prevFocus.current = document.activeElement as HTMLElement
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key === 'Tab') {
        const focusable = drawerRef.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        if (!focusable || focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey) {
          if (document.activeElement === first) { event.preventDefault(); last.focus() }
        } else {
          if (document.activeElement === last) { event.preventDefault(); first.focus() }
        }
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    setTimeout(() => closeRef.current?.focus(), 0)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      prevFocus.current?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  const width = wide ? 'max-w-4xl' : widthClassName || 'max-w-xl'

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={drawerRef}
        className={cn('relative ml-auto flex h-full w-full flex-col bg-ink-900 shadow-xl transition-transform', width)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <div className="flex items-start justify-between border-b border-ink-700 px-6 py-4">
          <div>
            <h2 id="drawer-title" className="text-lg font-semibold text-mist-100">{title}</h2>
            {subtitle && <p className="text-sm text-mist-500">{subtitle}</p>}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-mist-400 transition-colors hover:bg-ink-800 hover:text-mist-100"
            aria-label="Close drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="border-t border-ink-700 px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
