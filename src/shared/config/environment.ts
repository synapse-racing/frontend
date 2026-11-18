import { z } from 'zod'

const localHosts = new Set(['localhost', '127.0.0.1', '[::1]'])

export function resolveApiUrl(value: string, page: URL): URL {
  const api = new URL(value, page)
  const isLocalHttp = page.protocol === 'http:' && api.protocol === 'http:' &&
    localHosts.has(page.hostname) && localHosts.has(api.hostname)

  if (!isLocalHttp && (page.protocol !== 'https:' || api.protocol !== 'https:')) {
    throw new Error('Secure connection required')
  }

  return api
}

const environmentSchema = z.object({
  VITE_API_URL: z.string().refine(
    (value) => {
      if (!/^(?:\/(?![\\/])|https?:\/\/)/i.test(value)) return false
      const url = URL.parse(value, 'https://localhost')
      return !!url && !url.username && !url.password && !url.search && !url.hash
    },
    'VITE_API_URL must be an HTTP(S) URL or root-relative path without credentials, query or fragment',
  ),
})

const parsedEnvironment = environmentSchema.parse({
  VITE_API_URL: import.meta.env.VITE_API_URL ?? '/api',
})

export const environment = {
  apiUrl: parsedEnvironment.VITE_API_URL.replace(/\/+$/, ''),
}
