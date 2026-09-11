import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatPrice } from '../../lib/listings'
import './admin.css'

type Row = {
  id: string
  title: string
  city: string
  price: number | null
  status: string
}

export default function AdminListings() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()

  async function load() {
    const { data, error } = await supabase
      .from('listings')
      .select('id, title, city, price, status')
      .order('created_at', { ascending: false })

    if (error) console.error(error)
    setRows((data ?? []) as Row[])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function addListing() {
    setCreating(true)
    const { data, error } = await supabase
      .from('listings')
      .insert({ title: 'Untitled listing', city: 'Fort Lauderdale', status: 'draft' })
      .select('id')
      .single()

    setCreating(false)
    if (error) {
      console.error(error)
      alert('The listing could not be created. Check the console for details.')
      return
    }
    navigate(`/admin/listings/${data.id}`)
  }

  return (
    <main>
      <div className="ad-head">
        <h1>Listings</h1>
        <button type="button" onClick={addListing} disabled={creating}>
          {creating ? 'Adding…' : 'Add listing'}
        </button>
      </div>

      {loading && <p>Loading listings…</p>}

      {!loading && rows.length === 0 && (
        <p>No listings yet. Add one to get started.</p>
      )}

      {rows.length > 0 && (
        <table className="ad-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>City</th>
              <th>Price</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link to={`/admin/listings/${r.id}`}>{r.title}</Link>
                </td>
                <td>{r.city}</td>
                <td>{formatPrice(r.price)}</td>
                <td>
                  <span className={`ad-pill ad-pill-${r.status}`}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
