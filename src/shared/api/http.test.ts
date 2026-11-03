import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiRequest, ApiError } from './http.ts'

afterEach(() => vi.unstubAllGlobals())

describe('API error handling', () => {
  it('translates HTTP authentication failures while keeping their status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Authentication required' }), { status: 401 })))
    await expect(apiRequest('/example')).rejects.toMatchObject({ status: 401, code: 'SESION_REQUERIDA' })
  })
  it('handles null error bodies without exposing a JavaScript exception', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('null', { status: 503 })))
    await expect(apiRequest('/example')).rejects.toMatchObject({ status: 503, code: 'SERVIDOR_NO_DISPONIBLE' })
  })
  it('translates connection failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const error = await apiRequest('/example').catch((cause: unknown) => cause)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ code: 'SIN_CONEXION', status: 0 })
  })
})
