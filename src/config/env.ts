const rawBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined

export const API_BASE_URL = (rawBaseUrl ?? 'http://localhost:3000/api').replace(/\/$/, '')

/**
 * Data mode:
 *  - "api"   always use the backend
 *  - "local" always use the browser-storage demo repository
 *  - "auto"  try the backend and fall back to local storage if it is unreachable
 */
export type DataMode = 'api' | 'local' | 'auto'

const configuredMode = (import.meta.env.VITE_DATA_MODE as DataMode | undefined) ?? 'auto'

export const DATA_MODE: DataMode = ['api', 'local', 'auto'].includes(configuredMode)
  ? configuredMode
  : 'auto'
