import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { useApp } from '@/context/AppContext'

const TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Pipeline health and lead quality at a glance' },
  '/leads': { title: 'Leads', subtitle: 'Search, filter, qualify and export your leads' },
  '/ask': { title: 'Ask Your Leads', subtitle: 'Chat with your lead data using a local AI model' },
  '/import': { title: 'Import Data', subtitle: 'Upload a CSV, review, then save clean records' },
  '/settings': { title: 'Settings', subtitle: 'Scoring criteria and data quality rules' },
}

export function AppLayout() {
  const location = useLocation()
  const { mode } = useApp()
  const meta = TITLES[location.pathname] ?? TITLES['/']

  return (
    <div className="flex h-screen overflow-hidden bg-ink-950">
      <Sidebar mode={mode} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={meta.title} subtitle={meta.subtitle} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
