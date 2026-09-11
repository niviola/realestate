import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'

type Props = {
  listingId: string
}

type SendState = 'idle' | 'sending' | 'sent' | 'error'

export default function InquiryForm({ listingId }: Props) {
  const [state, setState] = useState<SendState>('idle')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)

    // Hidden field that only bots fill in. Pretend it worked and save nothing.
    if (form.get('company')) {
      setState('sent')
      return
    }

    setState('sending')

    // No .select() here: visitors can add inquiries but aren't allowed to read them back.
    const { error } = await supabase.from('inquiries').insert({
      listing_id: listingId,
      name: String(form.get('name') ?? '').trim(),
      email: String(form.get('email') ?? '').trim(),
      phone: String(form.get('phone') ?? '').trim() || null,
      message: String(form.get('message') ?? '').trim() || null,
    })

    if (error) {
      console.error(error)
      setState('error')
    } else {
      setState('sent')
    }
  }

  if (state === 'sent') {
    return (
      <p className="lx-confirm" role="status">
        Inquiry sent. We'll follow up by email soon.
      </p>
    )
  }

  return (
    <form className="lx-form" onSubmit={handleSubmit}>
      <label>
        Name
        <input name="name" required autoComplete="name" />
      </label>

      <label>
        Email
        <input name="email" type="email" required autoComplete="email" />
      </label>

      <label>
        <span>
          Phone <span className="lx-optional">(optional)</span>
        </span>
        <input name="phone" type="tel" autoComplete="tel" />
      </label>

      <label>
        <span>
          Message <span className="lx-optional">(optional)</span>
        </span>
        <textarea
          name="message"
          rows={4}
          placeholder="I'm in Ohio and considering a second home. Is a video tour possible?"
        />
      </label>

      <input
        className="lx-hp"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      {state === 'error' && (
        <p className="lx-error" role="alert">
          Your inquiry didn't go through. Check your connection and send it again.
        </p>
      )}

      <button type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Send inquiry'}
      </button>
    </form>
  )
}