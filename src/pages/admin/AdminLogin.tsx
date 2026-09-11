import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'
import './admin.css'

export default function AdminLogin() {
  const { session, isAdmin, loading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (loading) {
    return (
      <main className="ad-page">
        <p>Checking your sign-in…</p>
      </main>
    )
  }

  if (session && isAdmin) {
    return <Navigate to="/admin/listings" replace />
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setBusy(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get('email') ?? '').trim(),
      password: String(form.get('password') ?? ''),
    })

    setBusy(false)
    if (error) setError('That email and password combination did not work.')
  }

  return (
    <main className="ad-page ad-narrow">
      <h1>Sign in</h1>

      {session && !isAdmin && (
        <p className="ad-error" role="alert">
          This account does not have admin access.{' '}
          <button
            type="button"
            className="ad-linkish"
            onClick={() => supabase.auth.signOut()}
          >
            Sign out
          </button>
        </p>
      )}

      <form className="ad-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>

        <label>
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </label>

        {error && (
          <p className="ad-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}
