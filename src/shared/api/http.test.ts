import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiRequest, ApiError } from './http.ts'
import { environment, resolveApiUrl } from '../config/environment.ts'

afterEach(() => vi.unstubAllGlobals())

describe('API error handling', () => {
  it('blocks authentication before fetch when the API uses public HTTP', async () => {
    const previousUrl = environment.apiUrl
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    environment.apiUrl = 'http://api.example.test/api'
    try {
      await expect(apiRequest('/auth/login', { method: 'POST', body: '{}' }))
        .rejects.toMatchObject({ code: 'CONEXION_NO_SEGURA' })
      expect(fetchMock).not.toHaveBeenCalled()
    } finally {
      environment.apiUrl = previousUrl
    }
  })

  it('requires an HTTPS page and API except for loopback development', () => {
    expect(resolveApiUrl('/api', new URL('https://game.example.test')).protocol).toBe('https:')
    expect(resolveApiUrl('http://localhost:3000/api', new URL('http://127.0.0.1:5173')).protocol).toBe('http:')
    expect(() => resolveApiUrl('https://api.example.test/api', new URL('http://game.example.test'))).toThrow()
    expect(() => resolveApiUrl('http://api.example.test/api', new URL('https://game.example.test'))).toThrow()
  })

  it('translates HTTP authentication failures while keeping their status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Authentication required' }), { status: 401 })))
    await expect(apiRequest('/example')).rejects.toMatchObject({ status: 401, code: 'SESION_REQUERIDA' })
  })
  it('handles null error bodies without exposing a JavaScript exception', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('null', { status: 503 })))
    await expect(apiRequest('/example')).rejects.toMatchObject({ status: 503, code: 'SERVIDOR_NO_DISPONIBLE' })
  })
  it('does not show unknown server text even if it starts with a Spanish UI phrase', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'No se pudo consultar el detalle interno' }), { status: 418 })))
    await expect(apiRequest('/example')).rejects.not.toThrow('detalle interno')
  })
  it('translates connection failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const error = await apiRequest('/example').catch((cause: unknown) => cause)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ code: 'SIN_CONEXION', status: 0 })
  })
})
