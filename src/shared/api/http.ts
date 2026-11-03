import { environment } from '../config/environment.ts'
import { getUserError } from '../errors/user-errors.ts'

interface ApiRequestOptions extends RequestInit {
  token?: string | null
}

interface ErrorBody {
  message?: string | string[]
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status: number) {
    const detail = getUserError({ message, status })
    super(detail.message)
    this.name = 'ApiError'
    this.status = status
    this.code = detail.code
  }
}

export async function apiRequest<T>(
  path: string,
  { token, headers, ...options }: ApiRequestOptions = {},
): Promise<T> {
  const requestHeaders = new Headers(headers)
  if (options.body) {
    requestHeaders.set('Content-Type', 'application/json')
  }
  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${environment.apiUrl}${path}`, {
    ...options,
    credentials: 'include',
    headers: requestHeaders,
  }).catch(() => {
    throw new ApiError('Failed to fetch', 0)
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ErrorBody | null
    const message = Array.isArray(body?.message)
      ? body.message.filter((item) => typeof item === 'string').join('. ')
      : typeof body?.message === 'string'
        ? body.message
        : 'No se pudo completar la solicitud'
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
