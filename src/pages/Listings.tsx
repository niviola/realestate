import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Listing } from '../lib/listings'
import {
  STATUS_LABEL,
  formatPrice,
  formatSpecs,
  locationLine,
  sortedPhotos,
} from '../lib/listings'
import './listings.css'

export default function Listings() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    supabase
      .from('listings')
      .select('*, listing_photos(url, sort_order)')
      .neq('status', 'draft')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          console.error(error)
          setError('Listings could not be loaded. Refresh the page to try again.')
        } else {
          setListings((data ?? []) as Listing[])
        }
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <main className="lx-page">
      <header className="lx-intro">
        <h1>Florida homes for Midwest buyers</h1>
        <p>
          New construction and select properties in Fort Lauderdale. Ask about
          any home and we'll follow up with details, pricing, and tour times.
        </p>
      </header>

      {loading && <p className="lx-note">Loading listings…</p>}

      {error && (
        <p className="lx-note lx-error" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && listings.length === 0 && (
        <p className="lx-note">
          No homes are listed right now.{' '}
          <Link to="/contact">Tell us what you're looking for</Link> and we'll
          reach out when something fits.
        </p>
      )}

      <ul className="lx-grid">
        {listings.map((l) => {
          const cover = sortedPhotos(l.listing_photos)[0]
          const statusLabel = STATUS_LABEL[l.status]

          return (
            <li key={l.id}>
              <Link to={`/listings/${l.id}`} className="lx-card-link">
                <div className="lx-photo">
                  {cover ? (
                    <img src={cover.url} alt={l.title} loading="lazy" />
                  ) : (
                    <span>Photos coming soon</span>
                  )}
                  {statusLabel && <span className="lx-status">{statusLabel}</span>}
                </div>
                <div className="lx-card-body">
                  <p className="lx-price">{formatPrice(l.price)}</p>
                  <h2>{l.title}</h2>
                  <p className="lx-meta">{locationLine(l.neighborhood, l.city)}</p>
                  <p className="lx-meta">{formatSpecs(l)}</p>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </main>
  )
}