import type { Usuario } from '../types'

const TOKEN_KEY = 'sgep.jwt'
const USER_KEY = 'sgep.usuario'
export const auth = {
  getToken: () => sessionStorage.getItem(TOKEN_KEY),
  getUser: (): Usuario | null => { const raw = sessionStorage.getItem(USER_KEY); return raw ? JSON.parse(raw) as Usuario : null },
  save: (token: string, usuario: Usuario) => { sessionStorage.setItem(TOKEN_KEY, token); sessionStorage.setItem(USER_KEY, JSON.stringify(usuario)) },
  clear: () => { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(USER_KEY) }
}
