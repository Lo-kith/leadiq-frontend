import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, RefreshCw, Send, Sparkles, Trash2, X } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Textarea } from '@/components/ui/Field'
import { Spinner } from '@/components/ui/States'
import { useAskChat, type AskChatMessage } from '@/hooks/useAskChat'
import { service } from '@/services/dataService'
import type { AskContext } from '@/types/ask'
import { cn } from '@/utils/cn'

const MAX_QUESTION = 2000

const SUGGESTIONS = [
  'Which leads should I prioritize today?',
  'Show me leads with high potential.',
  'Summarize my lead pipeline.',
  'What follow-up actions should I take next?',
]

function ContextSummary({ context }: { context: AskContext }) {
  if (!context.leads.length) {
    return (
      <p className="mt-2 text-xs text-mist-500">
        No leads were in scope for this answer.
      </p>
    )
  }
  return (
    <div className="mt-2 border-t border-ink-700 pt-2">
      <p className="text-[11px] text-mist-500">
        Based on {context.leadCount}
        {context.truncated ? ` of ${context.totalMatched}` : ''} lead{context.leadCount === 1 ? '' : 's'}
        {context.mode === 'single' ? ' (selected lead)' : ''}:
      </p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {context.leads.slice(0, 6).map((lead) => (
          <Link
            key={lead.id}
            to={`/leads?q=${encodeURIComponent(lead.companyName)}`}
            className="rounded-full border border-ink-600 px-2 py-0.5 text-[11px] text-mist-300 hover:border-accent-500/40 hover:text-accent-400"
          >
            {lead.companyName}
          </Link>
        ))}
        {context.leads.length > 6 && (
          <span className="px-1 py-0.5 text-[11px] text-mist-500">+{context.leads.length - 6} more</span>
        )}
      </div>
    </div>
  )
}

function MessageBubble({ message, onRetry }: { message: AskChatMessage; onRetry: () => void }) {
  const isUser = message.role === 'user'
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-xl border px-3.5 py-2.5 text-sm whitespace-pre-wrap',
          isUser
            ? 'border-accent-500/30 bg-accent-500/15 text-mist-100'
            : message.error
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
              : 'border-ink-700 bg-ink-900 text-mist-200',
        )}
      >
        {message.error && (
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-rose-300">
            <AlertTriangle className="h-3.5 w-3.5" /> AI unavailable
          </div>
        )}
        {message.content}
        {message.context && <ContextSummary context={message.context} />}
        {message.error && (
          <button
            onClick={onRetry}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-rose-200 hover:text-rose-100"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        )}
      </div>
    </div>
  )
}

export function AskPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const leadId = searchParams.get('leadId') ?? undefined
  const companyParam = searchParams.get('company') ?? undefined

  const { messages, pending, status, statusLoading, send, retry, clear, refreshStatus } = useAskChat()
  const [input, setInput] = useState('')
  const [fetchedName, setFetchedName] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (companyParam || !leadId) return
    let active = true
    service
      .getLead(leadId)
      .then((lead) => {
        if (active) setFetchedName(lead.companyName)
      })
      .catch(() => {
        if (active) setFetchedName(null)
      })
    return () => {
      active = false
    }
  }, [leadId, companyParam])

  const leadName = companyParam ?? (leadId ? fetchedName : null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, pending])

  const aiReady = Boolean(status?.available && status.modelAvailable)
  const canSend = input.trim().length > 0 && !pending && aiReady

  const handleSend = useCallback(() => {
    if (!canSend) return
    const question = input
    setInput('')
    void send(question, leadId)
  }, [canSend, input, leadId, send])

  const handleClearContext = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('leadId')
    next.delete('company')
    setSearchParams(next, { replace: true })
  }

  const statusBadge = useMemo(() => {
    if (statusLoading) {
      return (
        <Badge tone="slate">
          <Spinner className="h-3 w-3" /> Checking AI…
        </Badge>
      )
    }
    if (aiReady) {
      return <Badge tone="teal">AI ready · {status?.model}</Badge>
    }
    return <Badge tone="amber">AI unavailable</Badge>
  }, [statusLoading, aiReady, status?.model])

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-3xl flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/15 text-accent-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-mist-100">Ask Your Leads</h2>
            {/* <p className="text-xs text-mist-400">Ask questions about your pipeline using your local AI model</p> */}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge}
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={clear}
            disabled={messages.length === 0 || pending}
          >
            Clear
          </Button>
        </div>
      </div>

      {!statusLoading && !aiReady && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <div className="flex-1 text-sm text-mist-200">
            <p className="font-medium text-amber-200">The AI assistant is not available.</p>
            <p className="mt-0.5 text-xs text-mist-400">
              Start Ollama locally and make sure the model
              {status?.model ? ` "${status.model}"` : ''} is pulled
              (<span className="font-mono">ollama pull qwen3:4b</span>). Then retry.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={() => void refreshStatus()}
          >
            Retry
          </Button>
        </div>
      )}

      <Card className="flex min-h-0 flex-1 flex-col">
        <CardHeader
          title="Conversation"
          subtitle={
            leadId
              ? `Focused on ${leadName ?? 'the selected lead'}`
              : 'Answers use only your stored leads'
          }
          action={
            leadId ? (
              <button
                onClick={handleClearContext}
                className="inline-flex items-center gap-1 rounded-full border border-ink-600 px-2.5 py-1 text-xs text-mist-300 hover:border-ink-500 hover:text-mist-100"
              >
                {leadName ?? 'Selected lead'} <X className="h-3 w-3" />
              </button>
            ) : undefined
          }
        />

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4" role="log" aria-live="polite">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-800 text-accent-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-mist-100">Ask about your leads</p>
                <p className="mt-1 max-w-sm text-sm text-mist-400">
                  {leadId
                    ? 'Ask for a summary, risks, or suggested next steps for this lead.'
                    : 'Try one of these questions to get started.'}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => void send(suggestion, leadId)}
                    disabled={!aiReady || pending}
                    className="rounded-full border border-ink-600 bg-ink-900 px-3 py-1.5 text-xs text-mist-300 transition-colors hover:border-accent-500/40 hover:text-accent-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} onRetry={() => void retry()} />
            ))
          )}

          {pending && (
            <div className="flex items-center gap-2 text-sm text-mist-400">
              <Spinner className="h-4 w-4" /> Thinking….
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <div className="border-t border-ink-700 p-4">
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value.slice(0, MAX_QUESTION))}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  handleSend()
                }
              }}
              placeholder={aiReady ? 'Ask a question… (Enter to send, Shift+Enter for a new line)' : 'AI unavailable'}
              disabled={!aiReady || pending}
              rows={2}
              className="min-h-11 flex-1"
              aria-label="Ask your leads"
            />
            <Button
              variant="primary"
              icon={pending ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              onClick={handleSend}
              disabled={!canSend}
              aria-label="Send question"
            >
              Send
            </Button>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-mist-500">
            <span>Answers are generated from your stored leads and may be incomplete.</span>
            <span>
              {input.length}/{MAX_QUESTION}
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}
