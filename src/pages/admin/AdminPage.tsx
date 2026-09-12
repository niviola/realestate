import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { NavLink, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import './admin.css'

const BUCKET = 'listing-photos'

const PAGES: { slug: string; label: string }[] = [
  { slug: 'home', label: 'Home' },
  { slug: 'about', label: 'About' },
]

type Block = {
  id: string
  sort_order: number
  layout: 'hero' | 'text' | 'image' | 'text_image'
  heading: string | null
  body: string | null
  image_url: string | null
  cta_label: string | null
  cta_url: string | null
  visible: boolean
}

const LAYOUTS: { value: Block['layout']; label: string }[] = [
  { value: 'hero', label: 'Hero (big heading at the top)' },
  { value: 'text', label: 'Text' },
  { value: 'text_image', label: 'Text beside an image' },
  { value: 'image', label: 'Image only' },
]

export default function AdminPage() {
  const { slug = 'home' } = useParams()
  const page = PAGES.find((p) => p.slug === slug) ?? PAGES[0]
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const { data, error } = await supabase
      .from('page_blocks')
      .select('*')
      .eq('page_slug', page.slug)
      .order('sort_order')

    if (error) console.error(error)
    setBlocks((data ?? []) as Block[])
    setLoading(false)
  }

  useEffect(() => {
    setLoading(true)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.slug])

  function edit(id: string, field: keyof Block, value: unknown) {
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, [field]: value } : b)))
  }

  async function save(block: Block) {
    setSavingId(block.id)
    setError(null)

    const { error } = await supabase
      .from('page_blocks')
      .update({
        layout: block.layout,
        heading: block.heading,
        body: block.body,
        image_url: block.image_url,
        cta_label: block.cta_label,
        cta_url: block.cta_url,
        visible: block.visible,
      })
      .eq('id', block.id)

    setSavingId(null)
    if (error) {
      console.error(error)
      setError('That section could not be saved.')
    }
  }

  async function addBlock() {
    const nextOrder =
      blocks.length === 0 ? 0 : Math.max(...blocks.map((b) => b.sort_order)) + 1

    const { error } = await supabase.from('page_blocks').insert({
      page_slug: page.slug,
      sort_order: nextOrder,
      layout: 'text',
      heading: 'New section',
      visible: false,
    })

    if (error) {
      console.error(error)
      setError('The section could not be added.')
      return
    }
    load()
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= blocks.length) return

    const a = blocks[index]
    const b = blocks[target]
    await supabase.from('page_blocks').update({ sort_order: b.sort_order }).eq('id', a.id)
    await supabase.from('page_blocks').update({ sort_order: a.sort_order }).eq('id', b.id)
    load()
  }

  async function remove(block: Block) {
    if (!confirm('Delete this section?')) return
    const { error } = await supabase.from('page_blocks').delete().eq('id', block.id)
    if (error) console.error(error)
    load()
  }

  async function upload(block: Block, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `pages/${page.slug}/${crypto.randomUUID()}.${ext}`

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type })

    if (upErr) {
      console.error(upErr)
      setError('That image could not be uploaded.')
      return
    }

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
    edit(block.id, 'image_url', pub.publicUrl)
    await save({ ...block, image_url: pub.publicUrl })
    e.target.value = ''
  }

  if (loading) return <main><p>Loading page…</p></main>

  return (
    <main>
      <div className="ad-head">
        <h1>{page.label} page</h1>
        <button type="button" onClick={addBlock}>
          Add section
        </button>
      </div>

      <nav className="ad-subtabs">
        {PAGES.map((p) => (
          <NavLink key={p.slug} to={`/admin/pages/${p.slug}`}>
            {p.label}
          </NavLink>
        ))}
      </nav>

      <p className="ad-hint">
        Sections appear on the page in this order. Hidden sections stay off the
        live site until you show them.
      </p>

      {error && (
        <p className="ad-error" role="alert">
          {error}
        </p>
      )}

      <ul className="ad-blocks">
        {blocks.map((b, i) => (
          <li key={b.id}>
            <div className="ad-block-bar">
              <select
                value={b.layout}
                onChange={(e) => edit(b.id, 'layout', e.target.value)}
              >
                {LAYOUTS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>

              <label className="ad-check">
                <input
                  type="checkbox"
                  checked={b.visible}
                  onChange={(e) => edit(b.id, 'visible', e.target.checked)}
                />
                Show on the site
              </label>

              <button type="button" onClick={() => move(i, -1)} disabled={i === 0}>
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === blocks.length - 1}
              >
                ↓
              </button>
            </div>

            <div className="ad-form">
              {b.layout !== 'image' && (
                <>
                  <label>
                    Heading
                    <input
                      value={b.heading ?? ''}
                      onChange={(e) => edit(b.id, 'heading', e.target.value)}
                    />
                  </label>

                  <label>
                    Text
                    <textarea
                      rows={5}
                      value={b.body ?? ''}
                      onChange={(e) => edit(b.id, 'body', e.target.value)}
                    />
                  </label>

                  <div className="ad-row">
                    <label>
                      Button text
                      <input
                        value={b.cta_label ?? ''}
                        onChange={(e) => edit(b.id, 'cta_label', e.target.value)}
                        placeholder="See available homes"
                      />
                    </label>
                    <label>
                      Button link
                      <input
                        value={b.cta_url ?? ''}
                        onChange={(e) => edit(b.id, 'cta_url', e.target.value)}
                        placeholder="/listings"
                      />
                    </label>
                  </div>
                </>
              )}

              {b.layout !== 'text' && (
                <div className="ad-block-image">
                  {b.image_url ? (
                    <>
                      <img src={b.image_url} alt="" />
                      <button
                        type="button"
                        className="ad-danger"
                        onClick={() => {
                          edit(b.id, 'image_url', null)
                          save({ ...b, image_url: null })
                        }}
                      >
                        Remove image
                      </button>
                    </>
                  ) : (
                    <label>
                      Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => upload(b, e)}
                      />
                    </label>
                  )}
                </div>
              )}

              <div className="ad-actions">
                <button
                  type="button"
                  onClick={() => save(b)}
                  disabled={savingId === b.id}
                >
                  {savingId === b.id ? 'Saving…' : 'Save section'}
                </button>
                <button type="button" className="ad-danger" onClick={() => remove(b)}>
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
