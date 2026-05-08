import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Map from '../components/Map'
import client from '../api/client'
import NotificationCenter from '../components/NotificationCenter'

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

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>

      {/* Navbar */}
      <nav style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        padding: '0 32px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/report')}
            style={{
              background: '#16a34a', color: '#fff', border: 'none',
              borderRadius: '8px', padding: '8px 16px',
              fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            + Report Hazard
          </button>
          <button
            onClick={() => navigate('/results')}
            style={{
              background: '#f0fdf4', color: '#16a34a',
              border: '1.5px solid #16a34a', borderRadius: '8px',
              padding: '8px 16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            View Reports
          </button>
          <button
            onClick={() => navigate('/emergency')}
            style={{
              background: '#fef2f2', color: '#dc2626',
              border: '1.5px solid #fecaca', borderRadius: '8px',
              padding: '8px 16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            🚨 Emergency
          </button>
          <button
            onClick={() => navigate('/leaderboard')}
            style={{
              background: '#faf5ff', color: '#7c3aed',
              border: '1.5px solid #e9d5ff', borderRadius: '8px',
              padding: '8px 16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            🏆
          </button>
          <button
            onClick={() => navigate('/contact')}
            style={{
              background: 'transparent', color: '#64748b',
              border: '1.5px solid #e2e8f0', borderRadius: '8px',
              padding: '8px 16px', fontSize: '14px', cursor: 'pointer',
            }}
          >
            Contact
          </button>

          {/* Notification bell */}
          <NotificationCenter />

          {/* Profile avatar button */}
          <button
            onClick={() => navigate('/profile')}
            style={{
              width: '38px', height: '38px', borderRadius: '12px',
              background: '#16a34a', color: '#fff', border: 'none',
              fontSize: '14px', fontWeight: '700', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(22,163,74,0.3)',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            title={`${user?.name} — View Profile`}
          >
            {initials}
          </button>

          {/* Admin link — only shows if user is admin */}
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              style={{
                background: '#1e293b', color: '#4ade80',
                border: '1.5px solid #334155', borderRadius: '8px',
                padding: '8px 16px', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
              }}
            >
              ⚙️ Admin
            </button>
          )}

          <button
            onClick={handleLogout}
            style={{
              background: 'transparent', color: '#64748b',
              border: '1.5px solid #e2e8f0', borderRadius: '8px',
              padding: '8px 16px', fontSize: '14px', cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Map */}
      <div style={{ height: '480px', width: '100%' }}>
        {loading ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
            <p style={{ color: '#64748b' }}>Loading map…</p>
          </div>
        ) : (
          <Map reports={reports} zoom={5} />
        )}
      </div>

      {/* Stats */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Total Reports', value: reports.length, color: '#0f172a' },
            { label: 'Critical', value: reports.filter(r => r.severity === 'critical').length, color: '#9333ea' },
            { label: 'High', value: reports.filter(r => r.severity === 'high').length, color: '#dc2626' },
            { label: 'Medium', value: reports.filter(r => r.severity === 'medium').length, color: '#ca8a04' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: '#fff', borderRadius: '12px', padding: '20px',
              border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '32px', fontWeight: '700', color }}>{value}</p>
              <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Reports */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
            Recent Reports <span style={{ color: '#64748b', fontWeight: '400' }}>({reports.length})</span>
          </h2>
          <button
            onClick={() => navigate('/results')}
            style={{
              background: 'transparent', color: '#16a34a',
              border: 'none', fontSize: '14px', fontWeight: '600',
              cursor: 'pointer', textDecoration: 'underline',
            }}
          >
            View all →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', paddingBottom: '32px' }}>
          {reports.slice(0, 6).map(r => {
            const s = severityColor[r.severity] || severityColor.low
            return (
              <div key={r.id} style={{
                background: '#fff', borderRadius: '12px',
                border: '1px solid #e2e8f0', padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                transition: 'box-shadow 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <strong style={{ fontSize: '16px', color: '#0f172a' }}>{r.hazard_type}</strong>
                  <span style={{
                    background: s.bg, color: s.text,
                    padding: '3px 10px', borderRadius: '20px',
                    fontSize: '12px', fontWeight: '600', textTransform: 'capitalize',
                  }}>
                    {r.severity}
                  </span>
                </div>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '12px', lineHeight: '1.5' }}>
                  {r.description?.slice(0, 100)}{r.description?.length > 100 ? '…' : ''}
                </p>
                <p style={{ color: '#94a3b8', fontSize: '12px' }}>
                  {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}