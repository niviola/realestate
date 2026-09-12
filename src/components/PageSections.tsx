import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import '../pages/home.css'

export type Block = {
  id: string
  layout: 'hero' | 'text' | 'image' | 'text_image'
  heading: string | null
  body: string | null
  image_url: string | null
  cta_label: string | null
  cta_url: string | null
}

function Cta({ block }: { block: Block }) {
  if (!block.cta_label || !block.cta_url) return null
  const external = /^https?:\/\//.test(block.cta_url)

  if (external) {
    return (
      <a className="hm-cta" href={block.cta_url}>
        {block.cta_label}
      </a>
    )
  }
  return (
    <Link className="hm-cta" to={block.cta_url}>
      {block.cta_label}
    </Link>
  )
}

export function BlockView({ block, headingLevel }: { block: Block; headingLevel?: 1 | 2 }) {
  const body = block.body && <p className="hm-body">{block.body}</p>
  const image = block.image_url && (
    <img className="hm-image" src={block.image_url} alt={block.heading ?? ''} />
  )

  if (block.layout === 'hero') {
    return (
      <section className="hm-hero">
        {image}
        <div className="hm-hero-text">
          {block.heading &&
            (headingLevel === 2 ? <h2>{block.heading}</h2> : <h1>{block.heading}</h1>)}
          {body}
          <Cta block={block} />
        </div>
      </section>
    )
  }

  if (block.layout === 'image') {
    return <section className="hm-section hm-image-only">{image}</section>
  }

  if (block.layout === 'text_image') {
    return (
      <section className="hm-section hm-split">
        <div>
          {block.heading && <h2>{block.heading}</h2>}
          {body}
          <Cta block={block} />
        </div>
        {image}
      </section>
    )
  }

  return (
    <section className="hm-section">
      {block.heading && <h2>{block.heading}</h2>}
      {body}
      <Cta block={block} />
    </section>
  )
}

export default function PageSections({ slug }: { slug: string }) {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)

    supabase
      .from('page_blocks')
      .select('id, layout, heading, body, image_url, cta_label, cta_url')
      .eq('page_slug', slug)
      .eq('visible', true)
      .order('sort_order')
      .then(({ data, error }) => {
        if (!active) return
        if (error) console.error(error)
        setBlocks((data ?? []) as Block[])
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [slug])

  if (loading) return <main className="hm-page" />

  return (
    <main className="hm-page">
      {blocks.map((b) => (
        <BlockView key={b.id} block={b} />
      ))}
    </main>
  )
}
