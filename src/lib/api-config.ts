export function getApiBaseUrl(value: string | undefined): string {
  const configuredUrl = value?.trim()
  if (!configuredUrl) {
    throw new Error('Configure VITE_API_URL com a URL da API do backend, incluindo /api.')
  }

  let url: URL
  try {
    url = new URL(configuredUrl)
  } catch {
    throw new Error('VITE_API_URL deve ser uma URL absoluta, como https://sgep-api.onrender.com/api.')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('VITE_API_URL deve usar o protocolo http ou https.')
  }
  if (url.search || url.hash) {
    throw new Error('VITE_API_URL não deve conter parâmetros de consulta nem fragmento.')
  }

  return url.toString().replace(/\/+$/, '')
}
