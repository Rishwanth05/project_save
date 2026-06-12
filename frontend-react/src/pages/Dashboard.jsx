import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Map from '../components/Map'
import client from '../api/client'
import NotificationCenter from '../components/NotificationCenter'
import { io } from 'socket.io-client'

const severityColor = {
  low: { bg: '#dcfce7', text: '#16a34a' },
  medium: { bg: '#fef9c3', text: '#ca8a04' },
  high: { bg: '#fee2e2', text: '#dc2626' },
  critical: { bg: '#f3e8ff', text: '#9333ea' },
}

const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [newReportFlash, setNewReportFlash] = useState(null)
  const socketRef = useRef(null)

  // MAP4 — Radius filter
  const [radiusKm, setRadiusKm] = useState(null)
  const [userLocation, setUserLocation] = useState(null)

  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    client.get('/reports/all')
      .then(({ data }) => {
        const sorted = [...data].sort((a, b) =>
          (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4)
        )
        setReports(sorted)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // RT-2 — Socket.io real-time listener
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    socketRef.current = io(API_URL, { withCredentials: true })

    socketRef.current.on('connect', () => {
      console.log('🔌 Socket connected')
    })

    socketRef.current.on('new-report', (report) => {
      setReports(prev => {
        // avoid duplicates
        if (prev.find(r => r.id === report.id)) return prev
        const updated = [report, ...prev].sort((a, b) =>
          (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4)
        )
        return updated
      })
      // RT-2 — Flash notification for new report
      setNewReportFlash(report)
      setTimeout(() => setNewReportFlash(null), 5000)
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // MAP4 — Haversine distance
  const getDistanceKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  const filteredReports = radiusKm && userLocation
    ? reports.filter(r =>
        getDistanceKm(userLocation.lat, userLocation.lng, parseFloat(r.latitude), parseFloat(r.longitude)) <= radiusKm
      )
    : reports

  const tableReports = filteredReports
    .filter(r => filterStatus === 'all' || r.status === filterStatus)
    .filter(r => filterSeverity === 'all' || r.severity === filterSeverity)
    .filter(r => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        r.hazard_type?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
      )
    })

  const handleRadiusChange = (km) => {
    setRadiusKm(km)
    if (km && !userLocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => setUserLocation({ lat: coords.latitude, lng: coords.longitude }),
        () => alert('Enable location access to use radius filter')
      )
    }
  }

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const [menuOpen, setMenuOpen] = useState(false)
  const navMenuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const close = (e) => {
      if (navMenuRef.current && !navMenuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>

      {/* RT-2 — New report flash toast */}
      {newReportFlash && (
        <div style={{
          position: 'fixed', top: '80px', right: '24px', zIndex: 9999,
          background: '#fff', borderRadius: '12px', padding: '14px 18px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1.5px solid #bbf7d0',
          display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '320px',
          animation: 'slideIn 0.3s ease',
        }}>
          <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:translateX(0) } }`}</style>
          <div style={{ fontSize: '24px' }}>🚨</div>
          <div>
            <p style={{ fontWeight: '700', color: '#0f172a', fontSize: '13px', margin: '0 0 2px' }}>New report added</p>
            <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>
              {newReportFlash.hazard_type} — {newReportFlash.severity}
            </p>
          </div>
          <button onClick={() => setNewReportFlash(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px', marginLeft: 'auto' }}>×</button>
        </div>
      )}

      {/* Navbar */}
      <nav style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        padding: '0 32px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <style>{`
          @media (max-width: 767px) { .save-nav-desktop { display: none !important; } }
          @media (min-width: 768px) { .save-nav-hamburger { display: none !important; } }
        `}</style>

        {/* Logo — always visible */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="32" height="32" viewBox="0 0 56 56" fill="none">
            <rect width="56" height="56" rx="16" fill="#16a34a"/>
            <path d="M28 10L14 16V28C14 36.4 20.2 44.2 28 46C35.8 44.2 42 36.4 42 28V16L28 10Z" fill="white"/>
            <path d="M22 28L26 32L34 24" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontWeight: '700', fontSize: '18px', color: '#0f172a' }}>Project SAVE</span>
        </div>

        {/* Desktop nav buttons — hidden below 768px */}
        <div className="save-nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/report')} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            + Report Hazard
          </button>
          <button onClick={() => navigate('/results')} style={{ background: '#f0fdf4', color: '#16a34a', border: '1.5px solid #16a34a', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            View Reports
          </button>
          <button onClick={() => navigate('/emergency')} style={{ background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fecaca', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            🚨 Emergency
          </button>
          <button onClick={() => navigate('/leaderboard')} style={{ background: '#faf5ff', color: '#7c3aed', border: '1.5px solid #e9d5ff', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            🏆
          </button>
          <button onClick={() => navigate('/contact')} style={{ background: 'transparent', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', cursor: 'pointer' }}>
            Contact
          </button>

          <NotificationCenter />

          <button
            onClick={() => navigate('/profile')}
            style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#16a34a', color: '#fff', border: 'none', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(22,163,74,0.3)', transition: 'transform 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            title={`${user?.name} — View Profile`}
          >
            {initials}
          </button>

          {user?.role === 'admin' && (
            <button onClick={() => navigate('/admin')} style={{ background: '#1e293b', color: '#4ade80', border: '1.5px solid #334155', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
              ⚙️ Admin
            </button>
          )}

          <button onClick={handleLogout} style={{ background: 'transparent', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>

        {/* Hamburger — visible only below 768px */}
        <div ref={navMenuRef} className="save-nav-hamburger" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <NotificationCenter />
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle navigation menu"
            style={{ background: 'none', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontSize: '20px', lineHeight: 1, color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>

          {menuOpen && (
            <div style={{
              position: 'fixed', top: '64px', left: 0, right: 0,
              background: '#fff', borderBottom: '1px solid #e2e8f0',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              zIndex: 99, display: 'flex', flexDirection: 'column',
            }}>
              {[
                { label: '📊 Dashboard',      path: '/dashboard',  color: '#0f172a', weight: '500' },
                { label: '+ Report Hazard',   path: '/report',     color: '#16a34a', weight: '700' },
                { label: '📋 View Reports',   path: '/results',    color: '#0f172a', weight: '500' },
                { label: '🚨 Emergency',      path: '/emergency',  color: '#dc2626', weight: '600' },
                { label: '🏆 Leaderboard',    path: '/leaderboard',color: '#7c3aed', weight: '500' },
                { label: '📞 Contact',        path: '/contact',    color: '#64748b', weight: '500' },
                { label: '👤 Profile',        path: '/profile',    color: '#0f172a', weight: '500' },
                ...(user?.role === 'admin'
                  ? [{ label: '⚙️ Admin', path: '/admin', color: '#16a34a', weight: '700' }]
                  : []),
              ].map(({ label, path, color, weight }) => (
                <button
                  key={path}
                  onClick={() => { navigate(path); setMenuOpen(false) }}
                  style={{ background: 'none', border: 'none', borderBottom: '1px solid #f1f5f9', padding: '16px 24px', fontSize: '15px', fontWeight: weight, color, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}
                >
                  {label}
                </button>
              ))}
              <button
                onClick={() => { handleLogout(); setMenuOpen(false) }}
                style={{ background: '#fef2f2', border: 'none', padding: '16px 24px', fontSize: '15px', fontWeight: '600', color: '#dc2626', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Map — MAP1 clustering + MAP2 heatmap toggle */}
      <div style={{ height: '480px', width: '100%' }}>
        {loading ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ color: '#64748b' }}>Loading map…</p>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : (
          <Map reports={filteredReports} zoom={5} showHeatmapToggle={true} />
        )}
      </div>

      {/* MAP4 — Radius filter bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>📍 Show reports within:</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[null, 1, 5, 10, 25].map(km => (
            <button
              key={km}
              onClick={() => handleRadiusChange(km)}
              style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '13px',
                fontWeight: '600', cursor: 'pointer', border: 'none',
                background: radiusKm === km ? '#16a34a' : '#f1f5f9',
                color: radiusKm === km ? '#fff' : '#64748b',
                transition: 'all 0.15s',
              }}
            >
              {km ? `${km}km` : 'All'}
            </button>
          ))}
        </div>
        {radiusKm && (
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Showing {filteredReports.length} of {reports.length} reports
          </span>
        )}
      </div>

      {/* Stats */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Total Reports', value: filteredReports.length, color: '#0f172a' },
            { label: 'Critical', value: filteredReports.filter(r => r.severity === 'critical').length, color: '#9333ea' },
            { label: 'High', value: filteredReports.filter(r => r.severity === 'high').length, color: '#dc2626' },
            { label: 'Medium', value: filteredReports.filter(r => r.severity === 'medium').length, color: '#ca8a04' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', textAlign: 'center' }}>
              <p style={{ fontSize: '32px', fontWeight: '700', color }}>{value}</p>
              <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>{label}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
            Recent Reports <span style={{ color: '#64748b', fontWeight: '400' }}>({filteredReports.length})</span>
          </h2>
          <button onClick={() => navigate('/results')} style={{ background: 'transparent', color: '#16a34a', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}>
            View all →
          </button>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', color: '#374151', cursor: 'pointer', outline: 'none' }}
            >
              <option value="all">All</option>
              <option value="active">active</option>
              <option value="resolved">resolved</option>
            </select>
            <select
              value={filterSeverity}
              onChange={e => setFilterSeverity(e.target.value)}
              style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', color: '#374151', cursor: 'pointer', outline: 'none' }}
            >
              <option value="all">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="Search type or description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', color: '#374151', outline: 'none', width: '240px' }}
          />
        </div>

        {/* Reports table */}
        <div style={{ overflowX: 'auto', paddingBottom: '32px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Status', 'Type', 'ID', 'Date', 'Description', 'Reported By', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableReports.map(r => {
                const badge = {
                  critical: { bg: '#7c3aed', color: '#fff' },
                  high:     { bg: '#fee2e2', color: '#dc2626' },
                  medium:   { bg: '#fef3c7', color: '#d97706' },
                  low:      { bg: '#dcfce7', color: '#16a34a' },
                }[r.severity] || { bg: '#f3f4f6', color: '#6b7280' }
                return (
                  <tr key={r.id}
                    style={{ borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600', background: badge.bg, color: badge.color }}>
                        {r.severity.charAt(0).toUpperCase() + r.severity.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#111827', fontWeight: '500' }}>{r.hazard_type}</td>
                    <td style={{ padding: '14px 16px', color: '#6b7280', whiteSpace: 'nowrap' }}>{'RS' + String(r.id).padStart(3, '0')}</td>
                    <td style={{ padding: '14px 16px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                      {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#374151', maxWidth: '240px' }}>
                      {r.description ? (r.description.length > 40 ? r.description.slice(0, 40) + '...' : r.description) : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#6b7280' }}>{r.name || '—'}</td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => navigate('/results')}
                        style={{ background: 'none', border: 'none', color: '#16a34a', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}