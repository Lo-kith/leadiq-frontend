import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlertTriangle,
  Copy,
  Crown,
  Database,
  Gauge,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PriorityBadge } from '@/components/ui/Badge'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { service } from '@/services/dataService'
import type { Analytics, Lead } from '@/types/lead'

const PRIORITY_COLORS: Record<string, string> = {
  High: '#2dd4bf',
  Medium: '#fbbf24',
  Low: '#475569',
}

const STATUS_COLORS: Record<string, string> = {
  New: '#38bdf8',
  Contacted: '#a78bfa',
  Qualified: '#2dd4bf',
  Disqualified: '#fb7185',
}

const INDUSTRY_COLOR = '#38bdf8'

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-ink-600 bg-ink-850 px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-mist-100">{label}</p>
      <p className="text-mist-400">{payload[0].value} leads</p>
    </div>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [topLeads, setTopLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    Promise.all([service.getAnalytics(), service.listLeads({ sort: 'score', order: 'desc', limit: 5, page: 1 })])
      .then(([analyticsResult, leadResult]) => {
        if (!active) return
        setAnalytics(analyticsResult)
        setTopLeads(leadResult.data)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [nonce])

  if (loading && !analytics) return <LoadingState label="Crunching your pipeline…" />
  if (error) return <ErrorState message={error} onRetry={() => setNonce((n) => n + 1)} />
  if (!analytics) return <EmptyState title="No analytics available" />

  if (analytics.totalLeads === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Database className="h-6 w-6" />}
          title="Your pipeline is empty"
          description="Import a CSV of leads to see qualification scores, priorities and analytics here."
          action={
            <Button variant="primary" icon={<Upload className="h-4 w-4" />} onClick={() => navigate('/import')}>
              Import leads
            </Button>
          }
        />
      </Card>
    )
  }

  const industryData = analytics.byIndustry.filter((item) => item.value > 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard label="Total leads" value={analytics.totalLeads} icon={<Gauge className="h-4 w-4" />} tone="blue" />
        <KpiCard
          label="Qualified"
          value={analytics.qualifiedLeads}
          hint={`${analytics.totalLeads ? Math.round((analytics.qualifiedLeads / analytics.totalLeads) * 100) : 0}% of pipeline`}
          icon={<ShieldCheck className="h-4 w-4" />}
          tone="teal"
        />
        <KpiCard
          label="High priority"
          value={analytics.highPriorityLeads}
          icon={<Crown className="h-4 w-4" />}
          tone="violet"
        />
        <KpiCard
          label="Incomplete"
          value={analytics.incompleteRecords}
          hint="Below 60% data completeness"
          icon={<AlertTriangle className="h-4 w-4" />}
          tone="amber"
        />
        <KpiCard
          label="Duplicates caught"
          value={analytics.duplicatesDetected}
          hint="Last import"
          icon={<Copy className="h-4 w-4" />}
          tone="rose"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Leads by industry" subtitle="Distribution across your stored leads" />
          <div className="p-4">
            {industryData.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={industryData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <XAxis type="number" allowDecimals={false} stroke="#6b7f9f" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    stroke="#8fa3c4"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip cursor={{ fill: '#121d33' }} content={<ChartTooltip />} />
                  <Bar dataKey="value" fill={INDUSTRY_COLOR} radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No industry data yet" />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Priority mix" />
          <div className="p-4">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={analytics.byPriority}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  stroke="none"
                >
                  {analytics.byPriority.map((entry) => (
                    <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] ?? '#475569'} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex justify-center gap-4">
              {analytics.byPriority.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs text-mist-400">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: PRIORITY_COLORS[entry.name] }} />
                  {entry.name} ({entry.value})
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Pipeline by status" />
          <div className="p-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={analytics.byStatus} margin={{ left: -16, right: 8 }}>
                <XAxis dataKey="name" stroke="#8fa3c4" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} stroke="#6b7f9f" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#121d33' }} content={<ChartTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={36}>
                  {analytics.byStatus.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#475569'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Leads that deserve attention"
            subtitle="Highest scored leads in your pipeline"
            action={
              <Link to="/leads" className="text-xs font-medium text-accent-400 hover:underline">
                View all
              </Link>
            }
          />
          <div className="divide-y divide-ink-800">
            {topLeads.map((lead) => (
              <Link
                key={lead.id}
                to={`/leads?q=${encodeURIComponent(lead.companyName)}`}
                className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-ink-800/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-mist-100">{lead.companyName}</p>
                    <PriorityBadge priority={lead.priority} />
                  </div>
                  {lead.nextAction && (
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-mist-500">
                      <Sparkles className="h-3 w-3 text-accent-400" />
                      {lead.nextAction}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-accent-400">{lead.score}</p>
                  <p className="text-[10px] text-mist-500">score</p>
                </div>
              </Link>
            ))}
            {topLeads.length === 0 && <EmptyState title="No leads to show" />}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-ink-700 bg-ink-850/60 px-4 py-3">
          <Gauge className="h-5 w-5 text-accent-400" />
          <div>
            <p className="text-sm text-mist-200">
              Average score <span className="font-semibold text-mist-100">{analytics.averageScore}</span>
            </p>
            <p className="text-xs text-mist-500">Across all stored leads</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-ink-700 bg-ink-850/60 px-4 py-3">
          <ShieldCheck className="h-5 w-5 text-sky-300" />
          <div>
            <p className="text-sm text-mist-200">
              Average completeness{' '}
              <span className="font-semibold text-mist-100">{analytics.averageCompleteness}%</span>
            </p>
            <p className="text-xs text-mist-500">Higher completeness improves score confidence</p>
          </div>
        </div>
      </div>
    </div>
  )
}
