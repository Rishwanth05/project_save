import { useState, useEffect, useRef } from 'react'
import client from '../api/client'

const severityStyle = {
  low:      { bg: '#f0fdf4', border: '#86efac', dot: '#16a34a', label: 'INFO' },
  medium:   { bg: '#fffbeb', border: '#fcd34d', dot: '#d97706', label: 'ALERT' },
  high:     { bg: '#fff1f2', border: '#fda4af', dot: '#dc2626', label: 'HIGH' },
  critical: { bg: '#1a0000', border: '#dc2626', dot: '#ef4444', label: 'CRITICAL' },
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const panelRef = useRef(null)
  const prevUnread = useRef(0)

  const fetchUnread = async () => {
    try {
      const { data } = await client.get('/notifications/unread-count')
      // Show toast if new notification arrived
      if (data.count > prevUnread.current && prevUnread.current !== null) {
        const { data: notifs } = await client.get('/notifications')
        if (notifs.length > 0) showToast(notifs[0])
      }
      prevUnread.current = data.count
      setUnread(data.count)
    } catch {}
  }

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const { data } = await client.get('/notifications')
      setNotifications(data)
    } catch {} finally {
      setLoading(false)
    }
  }

  const showToast = (notification) => {
    setToast(notification)
    setTimeout(() => setToast(null), 6000)
  }

  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, 20000)
    return () => clearInterval(interval)
  }, [])

  const handleOpen = async () => {
    setOpen(o => !o)
    if (!open) {
      await fetchNotifications()
      if (unread > 0) {
        await client.put('/notifications/read-all').catch(() => {})
        setUnread(0)
        prevUnread.current = 0
      }
    }
  }

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr)) / 1000
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <>
      {/* ── Amber-alert style toast ── */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '72px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999,
          width: 'min(520px, 95vw)',
          background: toast.severity === 'critical' ? '#7f1d1d' : '#78350f',
          border: `2px solid ${toast.severity === 'critical' ? '#ef4444' : '#f59e0b'}`,
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          animation: 'toastIn 0.3s ease',
        }}>
          {/* Flashing top bar */}
          <div style={{
            background: toast.severity === 'critical' ? '#ef4444' : '#f59e0b',
            padding: '6px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'flashBar 1s infinite',
          }}>
            <span style={{ fontSize: '16px' }}>
              {toast.severity === 'critical' ? '🚨' : '⚠️'}
            </span>
            <span style={{
              color: '#fff',
              fontWeight: '800',
              fontSize: '12px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              {toast.severity === 'critical' ? 'Emergency Alert' : 'Hazard Alert'} — Project SAVE
            </span>
            <button
              onClick={() => setToast(null)}
              style={{
                marginLeft: 'auto',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                padding: '2px 8px',
                fontSize: '14px',
              }}
            >✕</button>
          </div>

          {/* Alert body */}
          <div style={{ padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '28px', flexShrink: 0 }}>
              {toast.severity === 'critical' ? '🔴' : toast.severity === 'high' ? '🟠' : '🟡'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: '800', fontSize: '15px', marginBottom: '4px' }}>
                {toast.title}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', lineHeight: '1.5' }}>
                {toast.message}
              </div>
            </div>
          </div>

          {/* Progress bar — drains over 6 seconds */}
          <div style={{ height: '3px', background: 'rgba(255,255,255,0.15)' }}>
            <div style={{
              height: '100%',
              background: toast.severity === 'critical' ? '#ef4444' : '#f59e0b',
              animation: 'drainBar 6s linear forwards',
            }} />
          </div>
        </div>
      )}

      {/* ── Bell button ── */}
      <div style={{ position: 'relative' }} ref={panelRef}>
        <button
          onClick={handleOpen}
          style={{
            position: 'relative',
            background: open ? '#f0fdf4' : 'transparent',
            border: '1.5px solid #e2e8f0',
            borderRadius: '10px',
            width: '38px', height: '38px',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', transition: 'all 0.15s',
          }}
          title="Notifications"
        >
          🔔
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: '-4px', right: '-4px',
              background: '#dc2626', color: '#fff',
              borderRadius: '10px', fontSize: '10px', fontWeight: '800',
              padding: '1px 5px', minWidth: '16px', textAlign: 'center',
              border: '2px solid #fff',
              animation: 'pulse 1.5s infinite',
            }}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {/* ── Dropdown panel ── */}
        {open && (
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 8px)',
            width: 'min(360px, 90vw)', background: '#fff',
            border: '1px solid #e2e8f0', borderRadius: '14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            zIndex: 1000, overflow: 'hidden',
            animation: 'slideDown 0.15s ease',
          }}>
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>🔔 Notifications</span>
              {notifications.length > 0 && (
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{notifications.length} alerts</span>
              )}
            </div>

            <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>Loading…</div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>✅</div>
                  <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>You're all caught up!</p>
                </div>
              ) : notifications.map(n => {
                const s = severityStyle[n.severity] || severityStyle.medium
                return (
                  <div key={n.id} style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f8fafc',
                    background: s.bg,
                    borderLeft: `3px solid ${s.border}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: s.dot, marginTop: '5px', flexShrink: 0,
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <p style={{ fontWeight: '700', color: '#0f172a', fontSize: '13px', margin: 0 }}>{n.title}</p>
                          <span style={{
                            fontSize: '10px', fontWeight: '700',
                            color: s.dot, background: s.bg,
                            border: `1px solid ${s.border}`,
                            borderRadius: '4px', padding: '1px 5px',
                            textTransform: 'uppercase',
                          }}>{s.label}</span>
                        </div>
                        <p style={{ color: '#475569', fontSize: '12px', margin: '0 0 4px', lineHeight: '1.4' }}>{n.message}</p>
                        <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>{timeAgo(n.created_at)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes drainBar {
          from { width: 100%; }
          to   { width: 0%; }
        }
        @keyframes flashBar {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.7; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.2); }
        }
      `}</style>
    </>
  )
}