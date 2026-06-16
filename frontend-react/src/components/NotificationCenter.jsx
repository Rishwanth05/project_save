import { useState, useEffect, useRef } from 'react'
import client from '../api/client'

const severityStyle = {
  low:      { bg: '#f0fdf4', border: '#86efac', dot: '#16a34a', label: 'INFO'     },
  medium:   { bg: '#fffbeb', border: '#fcd34d', dot: '#d97706', label: 'ALERT'    },
  high:     { bg: '#fff1f2', border: '#fda4af', dot: '#dc2626', label: 'HIGH'     },
  critical: { bg: '#300',    border: '#dc2626', dot: '#ef4444', label: 'CRITICAL' },
}

/*
 * Props (both optional — component works standalone without Navbar passing them):
 *   unreadCount  — number controlled by Navbar; if provided, used for badge display
 *   onMarkRead   — callback Navbar uses to reset its unread count when panel opens
 */
export default function NotificationCenter({ unreadCount: externalCount, onMarkRead }) {
  const [open, setOpen]                 = useState(false)
  const [notifications, setNotifications] = useState([])
  const [internalUnread, setInternalUnread] = useState(0)
  const [loading, setLoading]           = useState(false)
  const [toast, setToast]               = useState(null)
  const [isMobile, setIsMobile]         = useState(
    typeof window !== 'undefined' && window.innerWidth < 768
  )

  const panelRef   = useRef(null)
  const toastTimer = useRef(null)
  const prevUnread = useRef(0)

  // Badge count: use Navbar-supplied count if available, else internal
  const displayCount = externalCount !== undefined ? externalCount : internalUnread

  // Track viewport width for responsive panel
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  // Poll unread count every 20s + show toast on new arrivals
  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, 20000)
    return () => {
      clearInterval(interval)
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, []) // [] — mounts once, no stale loop

  // Close panel when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function fetchUnread() {
    try {
      const { data } = await client.get('/notifications/unread-count')
      const count = data.count ?? 0
      // Show amber toast if count increased (standalone mode only)
      if (externalCount === undefined && count > prevUnread.current && prevUnread.current !== null) {
        const { data: notifs } = await client.get('/notifications')
        if (notifs.length > 0) showToast(notifs[0])
      }
      prevUnread.current = count
      setInternalUnread(count)
    } catch {}
  }

  async function fetchNotifications() {
    setLoading(true)
    try {
      const { data } = await client.get('/notifications')
      setNotifications(data)
    } catch {}
    finally { setLoading(false) }
  }

  function showToast(notification) {
    setToast(notification)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 6000)
  }

  async function handleOpen() {
    const opening = !open
    setOpen(opening)
    if (opening) {
      await fetchNotifications()
    } else {
      await client.put('/notifications/read-all').catch(() => {})
      setInternalUnread(0)
      prevUnread.current = 0
      if (onMarkRead) onMarkRead()
    }
  }

  // X button — delete single notification
  async function handleDelete(id, e) {
    e.stopPropagation()
    try {
      await client.delete(`/notifications/${id}`)
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch {} // fail silently
  }

  // Clear All — window.confirm then DELETE /clear-all
  async function handleClearAll() {
    if (!window.confirm('Delete all notifications?')) return
    try {
      await client.delete('/notifications/clear-all')
      setNotifications([])
    } catch {}
  }

  function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr)) / 1000
    if (diff < 60)    return 'just now'
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  // Panel position: full-width fixed on mobile, dropdown on desktop
  const panelStyle = isMobile
    ? {
        position: 'fixed',
        left: 0,
        right: 0,
        top: 'var(--navbar-h)',
        width: '100%',
        maxHeight: '80vh',
        borderRadius: '0 0 16px 16px',
      }
    : {
        position: 'absolute',
        right: 0,
        top: 'calc(100% + 8px)',
        width: '360px',
        maxHeight: '480px',
        borderRadius: '14px',
      }

  return (
    <>
      {/* ── Amber alert toast ──────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', top: '72px', left: '50%',
          transform: 'translateX(-50%)', zIndex: 99999,
          width: 'min(520px, 95vw)',
          background: toast.severity === 'critical' ? '#7f1d1d' : '#78350f',
          border: `2px solid ${toast.severity === 'critical' ? '#ef4444' : '#f59e0b'}`,
          borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          overflow: 'hidden', animation: 'ncToastIn 0.3s ease',
        }}>
          <div style={{
            background: toast.severity === 'critical' ? '#ef4444' : '#f59e0b',
            padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ fontSize: '16px' }}>{toast.severity === 'critical' ? '🚨' : '⚠️'}</span>
            <span style={{ color: '#fff', fontWeight: '800', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {toast.severity === 'critical' ? 'Emergency Alert' : 'Hazard Alert'} — Project SAVE
            </span>
            <button
              onClick={() => { clearTimeout(toastTimer.current); setToast(null) }}
              style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', padding: '2px 8px', fontSize: '14px', minHeight: '28px', minWidth: '28px' }}
            >✕</button>
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '28px', flexShrink: 0 }}>
              {toast.severity === 'critical' ? '🔴' : toast.severity === 'high' ? '🟠' : '🟡'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: '800', fontSize: '15px', marginBottom: '4px' }}>{toast.title}</div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', lineHeight: '1.5' }}>{toast.message}</div>
            </div>
          </div>
          <div style={{ height: '3px', background: 'rgba(255,255,255,0.15)' }}>
            <div style={{ height: '100%', background: toast.severity === 'critical' ? '#ef4444' : '#f59e0b', animation: 'ncDrainBar 6s linear forwards' }} />
          </div>
        </div>
      )}

      {/* ── Bell button + panel ────────────────────────────────────────── */}
      <div style={{ position: 'relative' }} ref={panelRef}>

        {/* Bell button */}
        <button
          onClick={handleOpen}
          aria-label={`Notifications${displayCount > 0 ? `, ${displayCount} unread` : ''}`}
          aria-expanded={open}
          style={{
            position: 'relative',
            background: open ? '#f0fdf4' : 'transparent',
            border: '1.5px solid #e2e8f0',
            borderRadius: '10px',
            width: '44px', height: '44px',
            minWidth: '44px', minHeight: '44px',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', transition: 'all 0.15s',
          }}
        >
          🔔
          {displayCount > 0 && (
            <span style={{
              position: 'absolute', top: '-4px', right: '-4px',
              background: '#dc2626', color: '#fff',
              borderRadius: '10px', fontSize: '10px', fontWeight: '800',
              padding: '1px 5px', minWidth: '16px', textAlign: 'center',
              border: '2px solid #fff', animation: 'ncPulse 1.5s infinite',
            }}>
              {displayCount > 9 ? '9+' : displayCount}
            </span>
          )}
        </button>

        {/* Dropdown / fixed panel */}
        {open && (
          <div style={{
            ...panelStyle,
            background: '#fff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
            zIndex: 1000,
            overflow: 'hidden',
            animation: 'ncSlideDown 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
          }}>

            {/* Panel header */}
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>
                🔔 Notifications
                {notifications.length > 0 && (
                  <span style={{ marginLeft: '6px', fontSize: '12px', color: '#94a3b8', fontWeight: '400' }}>
                    ({notifications.length})
                  </span>
                )}
              </span>

              {/* Clear All button */}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  style={{
                    background: 'transparent',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    fontSize: '12px',
                    color: '#64748b',
                    cursor: 'pointer',
                    minHeight: '32px',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fecaca' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0' }}
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Notification list */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {loading ? (
                <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                  Loading…
                </div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
                  <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>You're all caught up!</p>
                </div>
              ) : (
                notifications.map(n => {
                  const s = severityStyle[n.severity] || severityStyle.medium
                  const isCritical = n.severity === 'critical'
                  return (
                    <div
                      key={n.id}
                      style={{
                        background: s.bg,
                        borderLeft: `3px solid ${s.border}`,
                        borderBottom: '1px solid rgba(0,0,0,0.04)',
                        // Larger padding on mobile for finger tapping
                        padding: isMobile ? '14px 12px 14px 14px' : '11px 12px 11px 14px',
                      }}
                    >
                      {/*
                       * Layout:
                       * ┌─ dot ─ content ─────────────────────── X ─┐
                       * │  ●   Title (bold)       SEVERITY BADGE   ✕ │
                       * │      Message body                           │
                       * │      2h ago                                 │
                       * └────────────────────────────────────────────┘
                       */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>

                        {/* Severity dot */}
                        <div style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          background: s.dot, flexShrink: 0, marginTop: '5px',
                        }} />

                        {/* Main text content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Title row + badge */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px', marginBottom: '3px' }}>
                            <p style={{
                              fontWeight: '700',
                              color: isCritical ? '#fca5a5' : '#0f172a',
                              fontSize: '13px', margin: 0, lineHeight: '1.4',
                            }}>
                              {n.title}
                            </p>
                            <span style={{
                              fontSize: '10px', fontWeight: '700',
                              color: s.dot,
                              background: 'rgba(255,255,255,0.55)',
                              border: `1px solid ${s.border}`,
                              borderRadius: '4px', padding: '1px 5px',
                              textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0,
                            }}>
                              {s.label}
                            </span>
                          </div>
                          {/* Message */}
                          <p style={{
                            color: isCritical ? 'rgba(255,200,200,0.9)' : '#475569',
                            fontSize: '12px', margin: '0 0 4px', lineHeight: '1.45',
                          }}>
                            {n.message}
                          </p>
                          {/* Time */}
                          <p style={{
                            color: isCritical ? 'rgba(255,255,255,0.45)' : '#94a3b8',
                            fontSize: '11px', margin: 0,
                          }}>
                            {timeAgo(n.created_at)}
                          </p>
                        </div>

                        {/*
                         * X delete button
                         * — ALWAYS VISIBLE (no hover-only, no opacity tricks)
                         * — min 44×44px touch target for mobile
                         */}
                        <button
                          onClick={(e) => handleDelete(n.id, e)}
                          aria-label="Delete notification"
                          title="Delete"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '44px',
                            height: '44px',
                            minWidth: '44px',
                            minHeight: '44px',
                            flexShrink: 0,
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: isCritical ? 'rgba(255,255,255,0.45)' : '#94a3b8',
                            fontSize: '14px',
                            borderRadius: '8px',
                            // Negative margins keep the 44px tap zone without pushing card height
                            marginTop: '-10px',
                            marginBottom: '-10px',
                            marginRight: '-8px',
                            transition: 'color 0.15s, background 0.15s',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = '#dc2626'
                            e.currentTarget.style.background = 'rgba(220,38,38,0.1)'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = isCritical ? 'rgba(255,255,255,0.45)' : '#94a3b8'
                            e.currentTarget.style.background = 'transparent'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Mobile-only close bar */}
            {isMobile && (
              <div style={{ padding: '10px 16px', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    width: '100%', padding: '12px',
                    background: '#f8fafc', border: '1px solid #e2e8f0',
                    borderRadius: '10px', color: '#64748b',
                    fontSize: '14px', fontWeight: '600',
                    cursor: 'pointer', minHeight: '44px',
                  }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes ncSlideDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ncToastIn   { from{opacity:0;transform:translateX(-50%) translateY(-12px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes ncDrainBar  { from{width:100%} to{width:0%} }
        @keyframes ncPulse     { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
      `}</style>
    </>
  )
}
