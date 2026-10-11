import { useCallback, useEffect, useRef, useState } from 'react'
import { service } from '@/services/dataService'
import type { AskContext, AskHistoryMessage, AskStatus } from '@/types/ask'

export interface AskChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  context?: AskContext
  error?: boolean
}

const HISTORY_LIMIT = 10

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `m_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

function toHistory(messages: AskChatMessage[]): AskHistoryMessage[] {
  return messages
    .filter((message) => !message.error)
    .slice(-HISTORY_LIMIT)
    .map((message) => ({ role: message.role, content: message.content }))
}

const UNAVAILABLE_STATUS: AskStatus = {
  provider: 'ollama',
  url: '',
  model: '',
  available: false,
  modelAvailable: false,
}

export function useAskChat() {
  const [messages, setMessages] = useState<AskChatMessage[]>([])
  const [pending, setPending] = useState(false)
  const [status, setStatus] = useState<AskStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const lastAttempt = useRef<{ question: string; leadId?: string; history: AskChatMessage[] } | null>(null)

  const refreshStatus = useCallback(async () => {
    setStatusLoading(true)
    try {
      setStatus(await service.getAskStatus())
    } catch {
      setStatus(UNAVAILABLE_STATUS)
    } finally {
      setStatusLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshStatus()
  }, [refreshStatus])

  const request = useCallback(
    async (question: string, leadId: string | undefined, history: AskChatMessage[], appendUser: boolean) => {
      setPending(true)
      if (appendUser) {
        setMessages((current) => [...current, { id: uid(), role: 'user', content: question }])
      }
      try {
        const response = await service.askLeads({
          question,
          leadId,
          history: toHistory(history),
        })
        setMessages((current) => [
          ...current,
          { id: uid(), role: 'assistant', content: response.answer, context: response.context },
        ])
      } catch (error) {
        setMessages((current) => [
          ...current,
          {
            id: uid(),
            role: 'assistant',
            content: error instanceof Error ? error.message : 'The assistant could not answer.',
            error: true,
          },
        ])
      } finally {
        setPending(false)
      }
    },
    [],
  )

  const send = useCallback(
    async (raw: string, leadId?: string) => {
      const question = raw.trim()
      if (!question || pending) return
      lastAttempt.current = { question, leadId, history: messages }
      await request(question, leadId, messages, true)
    },
    [messages, pending, request],
  )

  const retry = useCallback(async () => {
    const attempt = lastAttempt.current
    if (pending || !attempt) return
    setMessages((current) => {
      const next = [...current]
      while (next.length && next[next.length - 1].role === 'assistant' && next[next.length - 1].error) {
        next.pop()
      }
      return next
    })
    await request(attempt.question, attempt.leadId, attempt.history, false)
  }, [pending, request])

  const clear = useCallback(() => {
    if (pending) return
    lastAttempt.current = null
    setMessages([])
  }, [pending])

  return { messages, pending, status, statusLoading, send, retry, clear, refreshStatus }
}
