import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

type AuthState = {
  session: Session | null
  isAdmin: boolean
  loading: boolean
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function check(next: Session | null) {
      if (!active) return
      setSession(next)

      if (!next) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      // The admins table is readable by nobody, so ask the database instead.
      const { data, error } = await supabase.rpc('is_admin')
      if (!active) return
      if (error) console.error(error)
      setIsAdmin(data === true)
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => check(data.session))

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setLoading(true)
      check(next)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return { session, isAdmin, loading }
}