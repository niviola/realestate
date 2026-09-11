import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import './admin.css'

type Inquiry = {
  id: string
  name: string
  email: string
  phone: string | null
  message: string | null
  status: 'new' | 'contacted' | 'closed'
  created_at: string
  listing_id: string | null
  listings: { title: string } | null
}

const NEXT_STATUS: Record<Inquiry['status'], Inquiry['status']> = {
  new: 'contacted',
  contacted: 'closed',
  closed: 'new',
}

const ACTION_LABEL: Record<Inquiry['status'], string> = {
  new: 'Mark contacted',
  contacted: 'Mark closed',
  closed: 'Reopen',
}

export default function AdminInquiries() {
  const [rows, setRows] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data, error } = await supabase
      .from('inquiries')
      .select('*, listings(title)')
      .order('created_at', { ascending: false })

    if (error) console.error(error)
    setRows((data ?? []) as Inquiry[])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function advance(row: Inquiry) {
    const next = NEXT_STATUS[row.status]
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, status: next } : r)))

    const { error } = await supabase
      .from('inquiries')
      .update({ status: next })
      .eq('id', row.id)

    if (error) {
      console.error(error)
      load()
    }
  }

  if (loading) return <main><p>Loading inquiries…</p></main>

  return (
    <main>
      <div className="ad-head">
        <h1>Inquiries</h1>
      </div>

      {rows.length === 0 && <p>No inquiries yet.</p>}

      <ul className="ad-inquiries">
        {rows.map((r) => (
          <li key={r.id} className={r.status === 'new' ? 'ad-unread' : undefined}>
            <div className="ad-inquiry-head">
              <div>
                <strong>{r.name}</strong>{' '}
                <a href={`mailto:${r.email}`}>{r.email}</a>
                {r.phone && <> · <a href={`tel:${r.phone}`}>{r.phone}</a></>}
              </div>
              <span className={`ad-pill ad-pill-${r.status}`}>{r.status}</span>
            </div>

            <p className="ad-hint">
              {new Date(r.created_at).toLocaleString('en-US')}
              {r.listings?.title && <> · {r.listings.title}</>}
            </p>

            {r.message && <p className="ad-message">{r.message}</p>}

            <div className="ad-actions">
              <a className="ad-linkish" href={`mailto:${r.email}`}>
                Reply by email
              </a>
              <button type="button" onClick={() => advance(r)}>
                {ACTION_LABEL[r.status]}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
