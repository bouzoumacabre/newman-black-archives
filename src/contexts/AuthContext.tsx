import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, hasSupabaseConfig } from '../lib/supabase'
import { normalizeUsername, toInternalEmail } from '../lib/auth'
import type { Profile } from '../types'

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  configured: boolean
  signIn: (username: string, password: string) => Promise<void>
  signUp: (username: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfileFor = useCallback(async (userId: string) => {
    if (!hasSupabaseConfig) {
      setProfile(null)
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('user_id,username,role,created_at')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error
    setProfile(data as Profile | null)
  }, [])

  useEffect(() => {
    let active = true

    if (!hasSupabaseConfig) {
      setLoading(false)
      return
    }

    const hydrate = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        if (!active) return
        setSession(data.session)
        if (data.session?.user.id) await loadProfileFor(data.session.user.id)
        else setProfile(null)
      } catch (error) {
        console.error('[auth] session hydrate failed', error)
        if (active) {
          setSession(null)
          setProfile(null)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void hydrate()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      if (!nextSession) {
        setProfile(null)
        setLoading(false)
        return
      }

      setLoading(true)
      window.setTimeout(() => {
        void loadProfileFor(nextSession.user.id)
          .catch((error) => {
            console.error('[auth] profile load failed', error)
            setProfile(null)
          })
          .finally(() => {
            if (active) setLoading(false)
          })
      }, 0)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [loadProfileFor])

  const signIn = useCallback(async (username: string, password: string) => {
    if (!hasSupabaseConfig) throw new Error('SUPABASE NOT CONFIGURED')
    const email = toInternalEmail(username)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signUp = useCallback(async (username: string, password: string) => {
    if (!hasSupabaseConfig) throw new Error('SUPABASE NOT CONFIGURED')
    const clean = normalizeUsername(username)
    const email = toInternalEmail(clean)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: clean } },
    })
    if (error) throw error
    return Boolean(data.session)
  }, [])

  const signOut = useCallback(async () => {
    if (!hasSupabaseConfig) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    // Session-only visual state must not leak between two players sharing a browser.
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index)
      if (key?.startsWith('nba_')) sessionStorage.removeItem(key)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    const id = session?.user.id
    if (!id) {
      setProfile(null)
      return
    }
    await loadProfileFor(id)
  }, [loadProfileFor, session?.user.id])

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    profile,
    loading,
    configured: hasSupabaseConfig,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }), [session, profile, loading, signIn, signUp, signOut, refreshProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
