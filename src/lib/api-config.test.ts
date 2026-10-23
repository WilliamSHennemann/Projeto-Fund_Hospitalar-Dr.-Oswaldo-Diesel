import { describe, expect, it } from 'vitest'
import { getApiBaseUrl } from './api-config'

describe('URL base da API', () => {
  it('remove barras finais para evitar caminhos duplicados', () => {
    expect(getApiBaseUrl(' https://sgep-api.onrender.com/api/ ')).toBe('https://sgep-api.onrender.com/api')
  })

  it('informa quando a URL não foi configurada', () => {
    expect(() => getApiBaseUrl(undefined)).toThrow('Configure VITE_API_URL')
  })

  it('recusa URLs relativas ou inválidas', () => {
    expect(() => getApiBaseUrl('/api')).toThrow('URL absoluta')
  })

  it('aceita apenas HTTP ou HTTPS', () => {
    expect(() => getApiBaseUrl('ftp://sgep-api.onrender.com/api')).toThrow('http ou https')
  })
})
