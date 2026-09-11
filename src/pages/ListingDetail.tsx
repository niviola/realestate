import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Listing } from '../lib/listings'
import {
  STATUS_LABEL,
  formatPrice,
  formatSpecs,
  locationLine,
  sortedPhotos,
} from '../lib/listings'
import InquiryForm from '../components/InquiryForm'
import './listings.css'

type LoadState = 'loading' | 'ready' | 'missing' | 'error'

export default function ListingDetail() {
  const { id } = useParams()
  const [listing, setListing] = useState<Listing | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const [activePhoto, setActivePhoto] = useState(0)

  useEffect(() => {
    if (!id) return
    let active = true
    setState('loading')
    setActivePhoto(0)

    supabase
      .from('listings')
      .select('*, listing_photos(url, sort_order)')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        // 22P02 = the id in the URL isn't a valid UUID, so treat it as not found
        if (error && error.code !== '22P02') {
          console.error(error)
          setState('error')
        } else if (!data) {
          setState('missing')
        } else {
          setListing(data as Listing)
          setState('ready')
        }
      })

    return () => {
      active = false
    }
  }, [id])

  if (state === 'loading') {
    return (
      <main className="lx-page">
        <p className="lx-note">Loading this home…</p>
      </main>
    )
  }

  if (state === 'missing' || state === 'error' || !listing) {
    return (
      <main className="lx-page">
        <h1>
          {state === 'error' ? 'This home could not be loaded' : 'This home is no longer listed'}
        </h1>
        <p className="lx-note">
          {state === 'error'
            ? 'Refresh the page to try again, or '
            : 'It may have sold or been taken off the market. '}
          <Link to="/listings">browse all listings</Link>.
        </p>
      </main>
    )
  }

  const photos = sortedPhotos(listing.listing_photos)
  const mainPhoto = photos[activePhoto]
  const statusLabel = STATUS_LABEL[listing.status]

    return (
    <main className="lx-page">
      <Link to="/listings" className="lx-back">
        All listings
      </Link>

      <div className="lx-detail">
        <section>
          <div className="lx-photo lx-photo-large">
            {mainPhoto ? (
              <img
                src={mainPhoto.url}
                alt={`${listing.title}, photo ${activePhoto + 1} of ${photos.length}`}
              />
            ) : (
              <span>Photos coming soon</span>
            )}
            {statusLabel && <span className="lx-status">{statusLabel}</span>}
          </div>

          {photos.length > 1 && (
            <div className="lx-thumbs">
              {photos.map((p, i) => (
                <button
                  key={p.url}
                  type="button"
                  onClick={() => setActivePhoto(i)}
                  aria-label={`Show photo ${i + 1}`}
                  aria-current={i === activePhoto}
                >
                  <img src={p.url} alt="" />
                </button>
              ))}
            </div>
          )}

          <h1>{listing.title}</h1>
          <p className="lx-meta">
            {locationLine(listing.address, listing.neighborhood, listing.city)}
          </p>
          <p className="lx-price lx-price-large">{formatPrice(listing.price)}</p>
          <p className="lx-meta">{formatSpecs(listing)}</p>

          {listing.description && (
            <p className="lx-description">{listing.description}</p>
          )}
        </section>

        <aside className="lx-aside">
          <h2>Ask about this home</h2>
          <p>
            Questions about pricing, taxes, or touring from out of state? Send a
            note and we'll follow up by email.
          </p>
          <InquiryForm listingId={listing.id} />
        </aside>
      </div>
    </main>
  )
}