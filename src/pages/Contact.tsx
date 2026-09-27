import { useState, type FormEvent } from 'react';
import PageHero from '../components/PageHero';
import Breadcrumbs from '../components/Breadcrumbs';
import Button from '../components/Button';
import LocationMap from '../components/LocationMap';
import { useToast } from '../context/ToastContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Contact() {
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !EMAIL_RE.test(form.email.trim()) || !form.message.trim()) {
      showToast('Please fill in all required fields');
      return;
    }
    setSubmitted(true);
  }

  return (
    <>
      <PageHero title="Contact Us" subtitle="Questions, custom orders, or feedback — we read every message." />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="container">
          <Breadcrumbs items={[{ label: 'Contact' }]} />
          <div className="contact-grid">
            <div>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 26, marginBottom: 18, color: 'var(--ink)' }}>
                Send us a message
              </h2>
              {submitted ? (
                <div className="surface" style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>✓</div>
                  <h3 style={{ fontFamily: 'Fraunces, serif', color: 'var(--ink)', marginBottom: 8 }}>Message sent</h3>
                  <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>Thanks for reaching out — we typically reply within one business day.</p>
                </div>
              ) : (
                <form className="surface" onSubmit={handleSubmit}>
                  <div className="field-row">
                    <div className="field">
                      <label>Full Name</label>
                      <input maxLength={60} autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="field">
                      <label>Email</label>
                      <input type="email" maxLength={254} autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                  </div>
                  <div className="field">
                    <label>Subject</label>
                    <input maxLength={80} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                  </div>
                  <div className="field">
                    <label>Message</label>
                    <textarea maxLength={2000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                  </div>
                  <Button block type="submit">
                    Send Message
                  </Button>
                </form>
              )}
            </div>
            <div>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 26, marginBottom: 18, color: 'var(--ink)' }}>
                Get in touch directly
              </h2>
              <div className="surface" style={{ display: 'grid', gap: 18 }}>
                <div>
                  <div className="eyebrow">Address</div>
                  <div style={{ color: 'var(--ink)', fontWeight: 600 }}>14 Rue de Miel, Cairo</div>
                </div>
                <div>
                  <div className="eyebrow">Phone</div>
                  <div style={{ color: 'var(--ink)', fontWeight: 600 }}>+20 100 555 0134</div>
                </div>
                <div>
                  <div className="eyebrow">Email</div>
                  <div style={{ color: 'var(--ink)', fontWeight: 600 }}>hello@sucre.bakery</div>
                </div>
                <div>
                  <div className="eyebrow">Hours</div>
                  <div style={{ color: 'var(--ink)', fontWeight: 600 }}>Tue–Sun, 8am – 6pm</div>
                </div>
              </div>
            </div>
          </div>
          <LocationMap />
        </div>
      </section>
    </>
  );
}
