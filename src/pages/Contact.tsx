import InquiryForm from '../components/InquiryForm'
import './listings.css'

export default function Contact() {
  return (
    <main className="lx-page lx-contact">
      <header className="lx-intro">
        <h1>Get in touch</h1>
        <p>
          Questions about a property, the neighborhood, or what buying in Florida
          looks like from out of state? Send a note and we'll reply by email.
        </p>
      </header>

      <div className="lx-contact-grid">
        <section className="lx-aside">
          <h2>Send a message</h2>
          <InquiryForm placeholder="I'm in Cincinnati and looking for a second home near the water. What's available?" />
        </section>

        <section>
          <h2>Other ways to reach us</h2>
          <p className="lx-meta">
            Email: <a href="mailto:viktor@niviol.com">viktor@niviol.com</a>
          </p>
          <p className="lx-note">
            We usually reply within a day. If you'd rather talk through the
            details, say so in your message and we'll set up a call.
          </p>
        </section>
      </div>
    </main>
  )
}
