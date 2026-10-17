import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import type { Acao } from '../types'
import { auth } from '../lib/auth'
import { pode } from '../lib/permissions'

export function Protegido({ acao, children }: { acao: Acao; children: ReactNode }) { const usuario = auth.getUser(); if (!usuario) return <Navigate to="/admin/login" replace />; return pode(usuario, acao) ? <>{children}</> : <Navigate to="/admin" replace /> }
