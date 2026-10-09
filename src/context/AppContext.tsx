import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { initDataService } from '@/services/dataService'

interface AppContextValue {
  mode: 'api' | 'local'
  refreshKey: number
  bumpRefresh: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'api' | 'local' | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    initDataService().then((resolved) => {
      if (active) setMode(resolved)
    })
    return () => {
      active = false
    }
  }, [])

  const value = useMemo<AppContextValue | null>(
    () => (mode ? { mode, refreshKey, bumpRefresh: () => setRefreshKey((k) => k + 1) } : null),
    [mode, refreshKey],
  )

  if (!mode) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-ink-950 text-mist-400">
        <Loader2 className="h-7 w-7 animate-spin-slow text-accent-400" />
        <p className="text-sm">Connecting to LeadIQ service…</p>
      </div>
    )
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
