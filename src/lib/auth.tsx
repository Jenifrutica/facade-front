import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from './api'
import type { AuthResponse, UserView } from './api'

interface AuthState {
  token: string | null
  user: UserView | null
  ready: boolean
  signIn: (response: AuthResponse) => void
  signOut: () => void
}

const AuthContext = createContext<AuthState | null>(null)
const TOKEN_KEY = 'aurum.token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<UserView | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function restore() {
      if (!token) {
        setReady(true)
        return
      }
      try {
        const profile = await api.me(token)
        if (!cancelled) setUser(profile)
      } catch {
        if (!cancelled) {
          setToken(null)
          localStorage.removeItem(TOKEN_KEY)
        }
      } finally {
        if (!cancelled) setReady(true)
      }
    }
    restore()
    return () => {
      cancelled = true
    }
  }, [token])

  const signIn = useCallback((response: AuthResponse) => {
    localStorage.setItem(TOKEN_KEY, response.token)
    setToken(response.token)
    setUser(response.user)
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo<AuthState>(
    () => ({ token, user, ready, signIn, signOut }),
    [token, user, ready, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
