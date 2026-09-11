import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'
import './admin.css'

export default function AdminLayout() {
  const { session, isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <main className="ad-page">
        <p>Checking your sign-in…</p>
      </main>
    )
  }

  if (!session || !isAdmin) {
    return <Navigate to="/admin" replace />
  }

  return (
    <div className="ad-page">
      <header className="ad-bar">
        <nav className="ad-tabs">
          <NavLink to="/admin/listings">Listings</NavLink>
          <NavLink to="/admin/inquiries">Inquiries</NavLink>
        </nav>
        <button
          type="button"
          className="ad-linkish"
          onClick={() => supabase.auth.signOut()}
        >
          Sign out
        </button>
      </header>

      <Outlet />
    </div>
  )
}
