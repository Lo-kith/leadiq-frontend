import { useState, type FormEvent } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { BarChart3, LayoutDashboard, Search, Settings, Sparkles, Target, Upload, UserRound } from 'lucide-react'
import { cn } from '@/utils/cn'

const MOBILE_NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/leads', label: 'Leads', icon: Target, end: false },
  { to: '/ask', label: 'Ask', icon: Sparkles, end: false },
  { to: '/import', label: 'Import', icon: Upload, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
]

interface TopbarProps {
  title: string
  subtitle?: string
  initialQuery?: string
}

export function Topbar({ title, subtitle, initialQuery = '' }: TopbarProps) {
  const navigate = useNavigate()
  const [term, setTerm] = useState(initialQuery)

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (term.trim()) params.set('q', term.trim())
    navigate(`/leads${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <header className="sticky top-0 z-30 border-b border-ink-700 bg-ink-900/90 backdrop-blur">
      <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/15 text-accent-400">
            <BarChart3 className="h-5 w-5" />
          </div>
          <span className="text-sm font-semibold text-mist-100">LeadIQ</span>
        </div>

        <div className="hidden min-w-0 lg:block">
          <h1 className="truncate text-lg font-semibold text-mist-100">{title}</h1>
          {subtitle && <p className="truncate text-xs text-mist-400">{subtitle}</p>}
        </div>

        <form onSubmit={onSubmit} className="ml-auto hidden max-w-xs flex-1 md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-mist-500" />
            <input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search leads…"
              className="w-full rounded-lg border border-ink-600 bg-ink-850 py-2 pr-3 pl-9 text-sm text-mist-100 placeholder:text-mist-500 focus:border-accent-500 focus:outline-none"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-3 md:ml-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-600 bg-ink-800 text-mist-300">
            <UserRound className="h-4 w-4" />
          </div>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-ink-700 px-2 py-2 lg:hidden">
        {MOBILE_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap',
                isActive ? 'bg-accent-500/12 text-accent-400' : 'text-mist-300 hover:bg-ink-800',
              )
            }
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
