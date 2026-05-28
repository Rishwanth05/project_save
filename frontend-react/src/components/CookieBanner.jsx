import { useState, useEffect } from 'react'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('cookie_consent')
    if (!stored) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem('cookie_consent', 'accepted')
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem('cookie_consent', 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, width: 'calc(100% - 40px)', maxWidth: '640px',
      background: 'rgba(15,23,42,0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '16px',
      padding: '18px 22px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '16px', flexWrap: 'wrap',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      animation: 'slideUp 0.3s ease',
    }}>
      <style>{`@keyframes slideUp { from{opacity:0;transform:translateX(-50%) translateY(16px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }`}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: '200px' }}>
        <span style={{ fontSize: '20px', flexShrink: 0, marginTop: '1px' }}>🍪</span>
        <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
          We use analytics cookies to improve your experience.{' '}
          <a href="/privacy" style={{ color: '#4ade80', textDecoration: 'none', fontWeight: '600' }}>Privacy Policy</a>
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button onClick={decline} style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '8px', padding: '8px 16px',
          color: '#64748b', fontSize: '13px', fontWeight: '500',
          cursor: 'pointer', fontFamily: 'inherit',
          transition: 'background 150ms',
        }}
          onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
        >
          Decline
        </button>
        <button onClick={accept} style={{
          background: '#16a34a',
          border: 'none',
          borderRadius: '8px', padding: '8px 16px',
          color: '#fff', fontSize: '13px', fontWeight: '600',
          cursor: 'pointer', fontFamily: 'inherit',
          transition: 'background 150ms',
        }}
          onMouseEnter={e => e.target.style.background = '#15803d'}
          onMouseLeave={e => e.target.style.background = '#16a34a'}
        >
          Accept
        </button>
      </div>
    </div>
  )
}
