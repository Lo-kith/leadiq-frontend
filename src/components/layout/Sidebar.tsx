import { NavLink } from 'react-router-dom'
import { BarChart3, Database, LayoutDashboard, Settings, Target, Upload } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { DataMode } from '@/config/env'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/leads', label: 'Leads', icon: Target, end: false },
  { to: '/import', label: 'Import Data', icon: Upload, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
]

interface SidebarProps {
  mode: DataMode | 'api' | 'local'
}

export function Sidebar({ mode }: SidebarProps) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-ink-700 bg-ink-900 lg:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-ink-700 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/15 text-accent-400">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight text-mist-100">LeadIQ</p>
          <p className="text-[10px] text-mist-500">Lead Intelligence</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent-500/12 text-accent-400'
                  : 'text-mist-300 hover:bg-ink-800 hover:text-mist-100',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-ink-700 p-3">
        <div className="flex items-center gap-2 rounded-lg bg-ink-850 px-3 py-2.5 text-xs">
          <Database className={cn('h-4 w-4', mode === 'api' ? 'text-accent-400' : 'text-amber-300')} />
          <div>
            <p className="font-medium text-mist-200">
              {mode === 'api' ? 'API + MongoDB' : 'Local demo mode'}
            </p>
            <p className="text-[10px] text-mist-500">
              {mode === 'api' ? 'Connected to backend' : 'Browser storage fallback'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
