import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

const RANK_MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function Leaderboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [leaders, setLeaders] = useState([])
  const [myBadges, setMyBadges] = useState({ stats: null, badges: [] })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('leaderboard')

  useEffect(() => {
    Promise.all([
      client.get('/badges/leaderboard'),
      client.get('/badges/me'),
    ]).then(([lRes, bRes]) => {
      setLeaders(lRes.data)
      setMyBadges(bRes.data)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }
  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        padding: '0 24px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
          <svg width="32" height="32" viewBox="0 0 56 56" fill="none">
            <rect width="56" height="56" rx="16" fill="#16a34a"/>
            <path d="M28 10L14 16V28C14 36.4 20.2 44.2 28 46C35.8 44.2 42 36.4 42 28V16L28 10Z" fill="white"/>
            <path d="M22 28L26 32L34 24" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontWeight: '700', fontSize: '18px', color: '#0f172a' }}>Project SAVE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'transparent', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '7px 14px', fontSize: '14px', cursor: 'pointer' }}>← Dashboard</button>
          <button onClick={() => navigate('/profile')} style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#16a34a', color: '#fff', border: 'none', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>{initials}</button>
          <button onClick={handleLogout} style={{ background: 'transparent', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '7px 14px', fontSize: '14px', cursor: 'pointer' }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 16px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
          🏆 Community Rankings
        </h1>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>Points: 10 per report submitted · 25 per report resolved</p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {['leaderboard', 'badges'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 20px', borderRadius: '8px', border: 'none',
              fontWeight: '600', fontSize: '14px', cursor: 'pointer',
              background: tab === t ? '#16a34a' : '#f1f5f9',
              color: tab === t ? '#fff' : '#475569',
            }}>
              {t === 'leaderboard' ? '🏆 Leaderboard' : '🏅 My Badges'}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>Loading…</div>
        ) : tab === 'leaderboard' ? (
          <LeaderboardTab leaders={leaders} userId={user?.id} />
        ) : (
          <BadgesTab myBadges={myBadges} />
        )}
      </div>
    </div>
  )
}

function LeaderboardTab({ leaders, userId }) {
  if (!leaders.length) {
    return <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>No reports yet — be the first! 🚀</div>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {leaders.map((row, i) => {
        const rank = i + 1
        const isMe = row.id === userId
        return (
          <div key={row.id} style={{
            background: isMe ? '#f0fdf4' : '#fff',
            border: isMe ? '2px solid #16a34a' : '1px solid #e2e8f0',
            borderRadius: '12px', padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <div style={{ width: '36px', textAlign: 'center', fontSize: rank <= 3 ? '24px' : '16px', fontWeight: '700', color: '#64748b' }}>
              {RANK_MEDAL[rank] || `#${rank}`}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>
                {row.name} {isMe && <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>(you)</span>}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                {row.reports_submitted} submitted · {row.reports_resolved} resolved · {row.badge_count} badge{row.badge_count !== 1 ? 's' : ''}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {row.top_badge && <div style={{ fontSize: '20px', marginBottom: '2px' }}>{row.top_badge}</div>}
              <div style={{ fontWeight: '800', fontSize: '18px', color: '#16a34a' }}>{row.score}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>pts</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BadgesTab({ myBadges }) {
  const { stats, badges } = myBadges
  const earned = badges.filter(b => b.earned)
  return (
    <div>
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Reports Submitted', value: stats.reports_submitted, color: '#16a34a' },
            { label: 'Reports Resolved', value: stats.reports_resolved, color: '#0284c7' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: '800', color }}>{value}</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{label}</div>
            </div>
          ))}
        </div>
      )}
      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>
        {earned.length} of {badges.length} badges earned
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
        {badges.map(b => (
          <div key={b.id} style={{
            background: b.earned ? '#fff' : '#f8fafc',
            border: b.earned ? '2px solid #16a34a' : '1px solid #e2e8f0',
            borderRadius: '16px', padding: '24px 16px', textAlign: 'center',
            opacity: b.earned ? 1 : 0.5,
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px', filter: b.earned ? 'none' : 'grayscale(100%)' }}>{b.emoji}</div>
            <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px', marginBottom: '6px' }}>{b.name}</div>
            <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>{b.description}</div>
            {b.earned && <div style={{ marginTop: '10px', fontSize: '11px', fontWeight: '700', color: '#16a34a' }}>✓ EARNED</div>}
          </div>
        ))}
      </div>
    </div>
  )
}