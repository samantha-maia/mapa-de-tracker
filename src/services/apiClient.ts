const API_BASE_URL = 'https://x4t7-ilri-ywed.n7d.xano.io'

const FIELDS_BASE_PATH = '/api:6L6t8cws/fields'

export const API_ROUTES = {
  fields: (companyId: string | number) => `${FIELDS_BASE_PATH}?company_id=${encodeURIComponent(String(companyId))}`,
  fieldsBase: FIELDS_BASE_PATH,
  fieldName: '/api:6L6t8cws/field_name',
  trackersMap: '/api:6L6t8cws/trackers-map',
  trackersCatalog: '/api:T9-pCDOs/trackers_0',
} as const

type QueryValue = string | number | boolean | null | undefined

export type QueryParams = Record<string, QueryValue>

export interface ApiRequestOptions {
  method?: string
  query?: QueryParams
  body?: any
  headers?: HeadersInit
  authToken?: string | null
}

const defaultHeaders: HeadersInit = {
  'Content-Type': 'application/json',
  'X-data-source': 'dev',
}

const toStringValue = (value: Exclude<QueryValue, null | undefined>) => {
  return typeof value === 'boolean' ? String(value) : String(value)
}

const buildUrl = (path: string, query?: QueryParams) => {
  const basePath = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`
  const url = new URL(basePath)

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, toStringValue(value))
      }
    })
  }

  return url.toString()
}

export class ApiError extends Error {
  status: number
  statusText: string
  payload: unknown

  constructor(response: Response, payload: unknown) {
    super(`API request failed: ${response.status} ${response.statusText}`)
    this.name = 'ApiError'
    this.status = response.status
    this.statusText = response.statusText
    this.payload = payload
  }
}

export async function apiRequest<T = any>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, headers, authToken } = options
  const url = buildUrl(path, query)

  const finalHeaders = new Headers(defaultHeaders)
  if (headers) {
    const extraHeaders = new Headers(headers)
    extraHeaders.forEach((value, key) => finalHeaders.set(key, value))
  }

  if (authToken) {
    finalHeaders.set('Authorization', `Bearer ${authToken}`)
  }

  const fetchOptions: RequestInit = {
    method,
    headers: finalHeaders,
  }

  if (body !== undefined) {
    fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body)
  }

  const response = await fetch(url, fetchOptions)
  const text = await response.text()
  const isJson = response.headers.get('content-type')?.includes('application/json')
  const payload = text ? (isJson ? JSON.parse(text) : text) : null

  if (!response.ok) {
    throw new ApiError(response, payload)
  }

  return payload as T
}

