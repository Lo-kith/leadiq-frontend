import { useEffect, useState } from 'react'
import { Database, GitMerge, RefreshCw, Save, Sparkles } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { useApp } from '@/context/AppContext'
import { service } from '@/services/dataService'
import type { ScoringConfig } from '@/types/lead'
import { DEFAULT_SCORING_CONFIG } from '@/utils/scoring'

const WEIGHT_FIELDS: Array<{ key: keyof ScoringConfig['weights']; label: string }> = [
  { key: 'industry', label: 'Industry fit' },
  { key: 'companySize', label: 'Company size' },
  { key: 'revenue', label: 'Revenue threshold' },
  { key: 'website', label: 'Website present' },
  { key: 'contact', label: 'Contact info' },
  { key: 'persona', label: 'Decision-maker persona' },
  { key: 'completeness', label: 'Data completeness' },
]

export function SettingsPage() {
  const toast = useToast()
  const { mode, bumpRefresh } = useApp()
  const [config, setConfig] = useState<ScoringConfig>(DEFAULT_SCORING_CONFIG)
  const [industriesText, setIndustriesText] = useState(DEFAULT_SCORING_CONFIG.targetIndustries.join(', '))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [rescoring, setRescoring] = useState(false)

  useEffect(() => {
    let active = true
    service
      .getSettings()
      .then((result) => {
        if (!active) return
        setConfig(result.scoringConfig)
        setIndustriesText(result.scoringConfig.targetIndustries.join(', '))
      })
      .catch(() => toast.push('Could not load scoring settings.', 'error'))
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalWeight = Object.values(config.weights).reduce((sum, value) => sum + value, 0)

  const handleSave = async () => {
    setSaving(true)
    try {
      const next: ScoringConfig = {
        ...config,
        targetIndustries: industriesText
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      }
      const result = await service.updateSettings(next)
      setConfig(result.scoringConfig)
      toast.push('Scoring criteria saved. Run "Rescore all" to apply.', 'success')
    } catch (error) {
      toast.push(error instanceof Error ? error.message : 'Failed to save settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleRescore = async () => {
    setRescoring(true)
    try {
      const result = await service.rescoreAll()
      toast.push(`Rescored ${result.updated} lead(s).`, 'success')
      bumpRefresh()
    } catch (error) {
      toast.push(error instanceof Error ? error.message : 'Rescore failed', 'error')
    } finally {
      setRescoring(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Scoring criteria"
          subtitle="Deterministic, rule-based scoring. Changes apply to new and re-scored leads."
          action={
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={handleRescore} disabled={rescoring}>
                {rescoring ? 'Rescoring…' : 'Rescore all leads'}
              </Button>
              <Button variant="primary" size="sm" icon={<Save className="h-3.5 w-3.5" />} onClick={handleSave} disabled={saving || loading}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          }
        />
        <div className="space-y-5 p-5">
          <Field label="Target industries (comma separated)" htmlFor="industries">
            <Input
              id="industries"
              value={industriesText}
              onChange={(event) => setIndustriesText(event.target.value)}
              placeholder="SaaS, Fintech, Healthcare"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Minimum employees" htmlFor="minEmployees">
              <Input
                id="minEmployees"
                type="number"
                min={0}
                value={config.minEmployees}
                onChange={(event) => setConfig({ ...config, minEmployees: Number(event.target.value) })}
              />
            </Field>
            <Field label="Maximum employees" htmlFor="maxEmployees">
              <Input
                id="maxEmployees"
                type="number"
                min={0}
                value={config.maxEmployees}
                onChange={(event) => setConfig({ ...config, maxEmployees: Number(event.target.value) })}
              />
            </Field>
            <Field label="Minimum revenue (USD)" htmlFor="minRevenue">
              <Input
                id="minRevenue"
                type="number"
                min={0}
                value={config.minRevenue}
                onChange={(event) => setConfig({ ...config, minRevenue: Number(event.target.value) })}
              />
            </Field>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-mist-300">Weights (points, total should be 100)</p>
              <span className={totalWeight === 100 ? 'text-xs text-accent-400' : 'text-xs text-amber-300'}>
                Total: {totalWeight}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {WEIGHT_FIELDS.map((field) => (
                <Field key={field.key} label={field.label} htmlFor={`weight-${field.key}`}>
                  <Input
                    id={`weight-${field.key}`}
                    type="number"
                    min={0}
                    max={100}
                    value={config.weights[field.key]}
                    onChange={(event) =>
                      setConfig({
                        ...config,
                        weights: { ...config.weights, [field.key]: Number(event.target.value) },
                      })
                    }
                  />
                </Field>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="High priority threshold" htmlFor="highThreshold">
              <Input
                id="highThreshold"
                type="number"
                min={0}
                max={100}
                value={config.priorityThresholds.high}
                onChange={(event) =>
                  setConfig({
                    ...config,
                    priorityThresholds: { ...config.priorityThresholds, high: Number(event.target.value) },
                  })
                }
              />
            </Field>
            <Field label="Medium priority threshold" htmlFor="mediumThreshold">
              <Input
                id="mediumThreshold"
                type="number"
                min={0}
                max={100}
                value={config.priorityThresholds.medium}
                onChange={(event) =>
                  setConfig({
                    ...config,
                    priorityThresholds: { ...config.priorityThresholds, medium: Number(event.target.value) },
                  })
                }
              />
            </Field>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Deduplication rules" />
          <ul className="space-y-3 p-5 text-sm text-mist-300">
            <li className="flex gap-2">
              <GitMerge className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
              <span>
                <strong className="text-mist-100">Company name:</strong> lowercased, punctuation removed,
                common suffixes (inc, llc, ltd, corp, gmbh…) stripped before comparing.
              </span>
            </li>
            <li className="flex gap-2">
              <GitMerge className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
              <span>
                <strong className="text-mist-100">Website domain:</strong> hostname extracted from the URL,
                www removed and lowercased.
              </span>
            </li>
            <li className="text-mist-400">
              A record is a duplicate if either key matches an existing lead or an earlier row in the same
              file. Duplicates are shown in the preview and skipped by default.
            </li>
          </ul>
        </Card>

        <Card>
          <CardHeader title="How scoring works" />
          <div className="space-y-3 p-5 text-sm text-mist-300">
            <p className="flex gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
              Each lead earns points from industry fit, company size, revenue, website presence, contact
              info and data completeness, then is normalised to 0–100.
            </p>
            <p className="text-mist-400">
              Missing information is reported as <strong className="text-mist-200">unknown</strong> and is
              not treated as evidence a company is unsuitable. Known-but-outside-target values simply earn
              no points.
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-900 p-3 text-xs text-mist-400">
              <Database className="h-4 w-4 text-accent-400" />
              Storage mode: <span className="font-medium text-mist-200">{mode === 'api' ? 'API + MongoDB' : 'Local browser storage (demo)'}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
