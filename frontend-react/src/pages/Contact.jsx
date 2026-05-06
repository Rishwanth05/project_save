import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

export default function Contact() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: user?.name || '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus('')
    try {
      await client.post('/contact/send', form)
      setStatus('success')
      setForm(f => ({ ...f, subject: '', message: '' }))
    } catch {
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px',
    border: '1.5px solid #e2e8f0', borderRadius: '10px',
    fontSize: '15px', outline: 'none', background: '#fff',
    transition: 'border-color 0.2s', fontFamily: 'inherit',
  }

  const labelStyle = {
    display: 'block', fontSize: '13px',
    fontWeight: '600', color: '#374151', marginBottom: '6px',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>

      {/* Navbar */}
      <nav style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        padding: '0 32px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="32" height="32" viewBox="0 0 56 56" fill="none">
            <rect width="56" height="56" rx="16" fill="#16a34a"/>
            <path d="M28 10L14 16V28C14 36.4 20.2 44.2 28 46C35.8 44.2 42 36.4 42 28V16L28 10Z" fill="white"/>
            <path d="M22 28L26 32L34 24" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontWeight: '700', fontSize: '18px', color: '#0f172a' }}>Project SAVE</span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'transparent', color: '#64748b',
            border: '1.5px solid #e2e8f0', borderRadius: '8px',
            padding: '8px 16px', fontSize: '14px', cursor: 'pointer',
          }}
        >
          ← Back to Dashboard
        </button>
      </nav>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #16a34a, #15803d)',
        padding: '40px 24px', textAlign: 'center', color: '#fff',
      }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>Contact Us</h1>
        <p style={{ opacity: 0.85, fontSize: '16px' }}>Have a question or feedback? We'd love to hear from you.</p>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>

          {status === 'success' && (
            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: '10px', padding: '16px 20px',
              color: '#16a34a', fontSize: '15px', marginBottom: '24px',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              ✅ Message sent! We'll get back to you soon.
            </div>
          )}

          {status === 'error' && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '10px', padding: '16px 20px',
              color: '#dc2626', fontSize: '15px', marginBottom: '24px',
            }}>
              ❌ Something went wrong. Please try again.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Your Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#16a34a'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#16a34a'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Subject</label>
              <input
                type="text"
                placeholder="What is this about?"
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                required
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Message</label>
              <textarea
                placeholder="Tell us what's on your mind…"
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                required
                rows={6}
                style={{ ...inputStyle, resize: 'vertical' }}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading ? '#86efac' : '#16a34a',
                color: '#fff', border: 'none', borderRadius: '10px',
                fontSize: '15px', fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Sending…' : '✉️ Send Message'}
            </button>
          </form>
        </div>

        {/* Info cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px' }}>
          {[
            { icon: '📧', title: 'Email Us', desc: 'arishwanthreddy@gmail.com' },
            { icon: '⏱️', title: 'Response Time', desc: 'Within 24 hours' },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{
              background: '#fff', borderRadius: '12px', padding: '20px',
              border: '1px solid #e2e8f0', textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
              <p style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>{title}</p>
              <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}