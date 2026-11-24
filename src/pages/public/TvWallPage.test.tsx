import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ tvwall: vi.fn() }))
vi.mock('../../lib/api', () => ({ api: { tvwall: mocks.tvwall } }))
vi.mock('../../components/Marca', () => ({ Marca: () => null }))

import { TvWallPage } from './TvWallPage'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('TV Wall', () => {
  it('exibe traço para média geral nula', async () => {
    mocks.tvwall.mockResolvedValue({
      nps_geral: 0,
      media_geral: null,
      setores: [],
      elogios_gerais: 0,
      cache_seconds: 30,
    })

    render(<TvWallPage />)

    expect(await screen.findByText('—')).toBeInTheDocument()
    expect(screen.queryByText('null')).not.toBeInTheDocument()
  })
})
