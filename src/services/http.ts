import { API_BASE_URL } from '@/config/env'

export class ApiError extends Error {
  code: string
  status: number
  details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

interface RequestOptions {
  method?: string
  body?: unknown
  signal?: AbortSignal
}

async function parseError(response: Response): Promise<ApiError> {
  let code = 'REQUEST_FAILED'
  let message = `Request failed with status ${response.status}`
  let details: unknown
  try {
    const payload = (await response.json()) as { error?: { code?: string; message?: string; details?: unknown } }
    if (payload?.error) {
      code = payload.error.code ?? code
      message = payload.error.message ?? message
      details = payload.error.details
    }
  } catch {
    // response was not JSON
  }
  return new ApiError(response.status, code, message, details)
}

export async function http<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options
  const headers: Record<string, string> = {}
  let payload: BodyInit | undefined

  if (body instanceof FormData) {
    payload = body
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: payload,
    signal,
  })

  if (!response.ok) {
    throw await parseError(response)
  }

  if (response.status === 204) return undefined as T
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export async function downloadCsv(path: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}${path}`)
  if (!response.ok) {
    throw await parseError(response)
  }
  return response.blob()
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { method: 'GET' })
    return response.ok
  } catch {
    return false
  }
}
