import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { sortedPhotos } from '../../lib/listings'
import './admin.css'

const BUCKET = 'listing-photos'

type Photo = { id: string; url: string; sort_order: number }

type Form = {
  title: string
  address: string
  city: string
  neighborhood: string
  price: string
  beds: string
  baths: string
  sqft: string
  property_type: string
  status: string
  description: string
}

const EMPTY: Form = {
  title: '',
  address: '',
  city: '',
  neighborhood: '',
  price: '',
  beds: '',
  baths: '',
  sqft: '',
  property_type: '',
  status: 'draft',
  description: '',
}

const num = (v: string) => (v.trim() === '' ? null : Number(v))
const text = (v: string) => (v.trim() === '' ? null : v.trim())

export default function AdminListingEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileInput = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<Form>(EMPTY)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadPhotos() {
    const { data } = await supabase
      .from('listing_photos')
      .select('id, url, sort_order')
      .eq('listing_id', id)
    setPhotos(sortedPhotos((data ?? []) as Photo[]) as Photo[])
  }

  useEffect(() => {
    if (!id) return

    async function load() {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (error || !data) {
        setError('This listing could not be loaded.')
        setLoading(false)
        return
      }

      setForm({
        title: data.title ?? '',
        address: data.address ?? '',
        city: data.city ?? '',
        neighborhood: data.neighborhood ?? '',
        price: data.price?.toString() ?? '',
        beds: data.beds?.toString() ?? '',
        baths: data.baths?.toString() ?? '',
        sqft: data.sqft?.toString() ?? '',
        property_type: data.property_type ?? '',
        status: data.status ?? 'draft',
        description: data.description ?? '',
      })
      await loadPhotos()
      setLoading(false)
    }

    load()
  }, [id])

  function update(field: keyof Form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setSaved(false)
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { error } = await supabase
      .from('listings')
      .update({
        title: form.title.trim(),
        address: text(form.address),
        city: form.city.trim(),
        neighborhood: text(form.neighborhood),
        price: num(form.price),
        beds: num(form.beds),
        baths: num(form.baths),
        sqft: num(form.sqft),
        property_type: text(form.property_type),
        status: form.status,
        description: text(form.description),
      })
      .eq('id', id)

    setSaving(false)
    if (error) {
      console.error(error)
      setError('Changes could not be saved.')
    } else {
      setSaved(true)
    }
  }

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    setUploading(true)
    setError(null)
    let next = photos.length

    for (const file of files) {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${id}/${crypto.randomUUID()}.${ext}`

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type })

      if (upErr) {
        console.error(upErr)
        setError(`${file.name} could not be uploaded.`)
        continue
      }

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
      const { error: rowErr } = await supabase
        .from('listing_photos')
        .insert({ listing_id: id, url: pub.publicUrl, sort_order: next })

      if (rowErr) {
        console.error(rowErr)
        setError(`${file.name} uploaded but could not be linked to the listing.`)
        continue
      }
      next += 1
    }

    await loadPhotos()
    setUploading(false)
    if (fileInput.current) fileInput.current.value = ''
  }

  async function removePhoto(photo: Photo) {
    if (!confirm('Remove this photo?')) return

    // Turn the public URL back into the storage path
    const marker = `/${BUCKET}/`
    const path = photo.url.slice(photo.url.indexOf(marker) + marker.length)

    await supabase.storage.from(BUCKET).remove([path])
    const { error } = await supabase.from('listing_photos').delete().eq('id', photo.id)
    if (error) console.error(error)
    await loadPhotos()
  }

  async function movePhoto(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= photos.length) return

    const a = photos[index]
    const b = photos[target]
    await supabase.from('listing_photos').update({ sort_order: b.sort_order }).eq('id', a.id)
    await supabase.from('listing_photos').update({ sort_order: a.sort_order }).eq('id', b.id)
    await loadPhotos()
  }

  async function deleteListing() {
    if (!confirm('Delete this listing and its photos? This cannot be undone.')) return

    const paths = photos.map((p) => {
      const marker = `/${BUCKET}/`
      return p.url.slice(p.url.indexOf(marker) + marker.length)
    })
    if (paths.length > 0) await supabase.storage.from(BUCKET).remove(paths)

    const { error } = await supabase.from('listings').delete().eq('id', id)
    if (error) {
      console.error(error)
      setError('This listing could not be deleted.')
      return
    }
    navigate('/admin/listings')
  }

  if (loading) return <main><p>Loading listing…</p></main>

  return (
    <main>
      <Link to="/admin/listings" className="ad-back">
        All listings
      </Link>

      <div className="ad-head">
        <h1>{form.title || 'Untitled listing'}</h1>
        {form.status !== 'draft' && (
          <Link to={`/listings/${id}`} target="_blank" rel="noreferrer">
            View on site
          </Link>
        )}
      </div>

      {error && (
        <p className="ad-error" role="alert">
          {error}
        </p>
      )}

      <form className="ad-form" onSubmit={handleSave}>
        <label>
          Title
          <input value={form.title} onChange={(e) => update('title', e.target.value)} required />
        </label>

        <div className="ad-row">
          <label>
            Address
            <input value={form.address} onChange={(e) => update('address', e.target.value)} />
          </label>
          <label>
            Neighborhood
            <input
              value={form.neighborhood}
              onChange={(e) => update('neighborhood', e.target.value)}
            />
          </label>
          <label>
            City
            <input value={form.city} onChange={(e) => update('city', e.target.value)} required />
          </label>
        </div>

        <div className="ad-row">
          <label>
            Price (USD)
            <input
              type="number"
              value={form.price}
              onChange={(e) => update('price', e.target.value)}
            />
          </label>
          <label>
            Beds
            <input type="number" value={form.beds} onChange={(e) => update('beds', e.target.value)} />
          </label>
          <label>
            Baths
            <input
              type="number"
              step="0.5"
              value={form.baths}
              onChange={(e) => update('baths', e.target.value)}
            />
          </label>
          <label>
            Square feet
            <input type="number" value={form.sqft} onChange={(e) => update('sqft', e.target.value)} />
          </label>
        </div>

        <div className="ad-row">
          <label>
            Property type
            <input
              value={form.property_type}
              onChange={(e) => update('property_type', e.target.value)}
              placeholder="townhouse"
            />
          </label>
          <label>
            Status
            <select value={form.status} onChange={(e) => update('status', e.target.value)}>
              <option value="draft">Draft (hidden from the site)</option>
              <option value="available">Available</option>
              <option value="pending">Under contract</option>
              <option value="sold">Sold</option>
            </select>
          </label>
        </div>

        <label>
          Description
          <textarea
            rows={8}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </label>

        <div className="ad-actions">
          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {saved && <span className="ad-saved">Saved</span>}
          <button type="button" className="ad-danger" onClick={deleteListing}>
            Delete listing
          </button>
        </div>
      </form>

      <section className="ad-photos">
        <h2>Photos</h2>
        <p className="ad-hint">The first photo is used as the cover image.</p>

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          onChange={handleUpload}
          disabled={uploading}
        />
        {uploading && <p>Uploading…</p>}

        {photos.length === 0 && !uploading && <p>No photos yet.</p>}

        <ul className="ad-photo-grid">
          {photos.map((p, i) => (
            <li key={p.id}>
              <img src={p.url} alt="" />
              <div className="ad-photo-actions">
                <button type="button" onClick={() => movePhoto(i, -1)} disabled={i === 0}>
                  ← Earlier
                </button>
                <button
                  type="button"
                  onClick={() => movePhoto(i, 1)}
                  disabled={i === photos.length - 1}
                >
                  Later →
                </button>
                <button type="button" className="ad-danger" onClick={() => removePhoto(p)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
