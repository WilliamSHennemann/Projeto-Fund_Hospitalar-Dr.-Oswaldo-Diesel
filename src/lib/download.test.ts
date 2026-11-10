import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { baixarArquivo } from './download'
import { mockApi } from './mock/api'

function lerBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onload = () => resolve(String(leitor.result))
    leitor.onerror = () => reject(leitor.error)
    leitor.readAsText(blob)
  })
}

describe('download de arquivo', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('cria um link temporário e revoga a URL após iniciar o download', () => {
    vi.useFakeTimers()
    const criarUrl = vi.fn(() => 'blob:teste')
    const revogarUrl = vi.fn()
    vi.stubGlobal('URL', { createObjectURL: criarUrl, revokeObjectURL: revogarUrl })
    let nomeBaixado = ''
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { nomeBaixado = this.download })

    baixarArquivo(new Blob(['conteúdo']), 'relatorio.xlsx')

    expect(criarUrl).toHaveBeenCalledOnce()
    expect(click).toHaveBeenCalledOnce()
    expect(nomeBaixado).toBe('relatorio.xlsx')
    expect(document.querySelector('a[download="relatorio.xlsx"]')).not.toBeInTheDocument()
    vi.advanceTimersByTime(1000)
    expect(revogarUrl).toHaveBeenCalledWith('blob:teste')
  })

  it('mock fornece arquivos Blob para Excel e PDF', async () => {
    const excel = await mockApi.exportacoes.excel({ setor_id: 1 })
    const pdf = await mockApi.exportacoes.pdf({ setor_id: 1 })

    expect(excel).toBeInstanceOf(Blob)
    expect(excel.type).toContain('text/csv')
    expect(await lerBlob(excel)).toContain('Total de pesquisas')
    expect(pdf.type).toBe('application/pdf')
    expect(await lerBlob(pdf)).toMatch(/^%PDF-1\.4/)
  })
})
