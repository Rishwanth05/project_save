import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

const severityColor = {
  low: { bg: '#dcfce7', text: '#16a34a' },
  medium: { bg: '#fef9c3', text: '#ca8a04' },
  high: { bg: '#fee2e2', text: '#dc2626' },
  critical: { bg: '#f3e8ff', text: '#9333ea' },
}

export default function Profile() {
  const { user, login } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [myReports, setMyReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // Edit name
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [nameLoading, setNameLoading] = useState(false)
  const [nameMsg, setNameMsg] = useState('')

  // Change password
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg] = useState('')
  const [pwError, setPwError] = useState('')

  // Emergency contacts (shared with Emergency page)
  const [contacts, setContacts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('emergency_contacts')) || [] }
    catch { return [] }
  })
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', phone: '', relation: '' })

  useEffect(() => {
    Promise.all([
      client.get('/auth/me'),
      client.get('/auth/my-reports'),
    ]).then(([profileRes, reportsRes]) => {
      setProfile(profileRes.data)
      setMyReports(reportsRes.data)
      setNewName(profileRes.data.name)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleUpdateName = async () => {
    if (!newName.trim()) return
    setNameLoading(true)
    setNameMsg('')
    try {
      const { data } = await client.put('/auth/update-name', { name: newName })
      const token = localStorage.getItem('token')
      login(data.user, token)
      setProfile(p => ({ ...p, name: data.user.name }))
      setNameMsg('✅ Name updated!')
      setEditingName(false)
    } catch (err) {
      setNameMsg('❌ ' + (err.response?.data?.message || 'Failed'))
    } finally {
      setNameLoading(false)
    }
  }

  const handleChangePassword = async () => {
    setPwError('')
    setPwMsg('')
    if (!pwForm.old_password || !pwForm.new_password || !pwForm.confirm) {
      setPwError('All fields are required'); return
    }
    if (pwForm.new_password !== pwForm.confirm) {
      setPwError('New passwords do not match'); return
    }
    if (pwForm.new_password.length < 6) {
      setPwError('Password must be at least 6 characters'); return
    }
    setPwLoading(true)
    try {
      await client.put('/auth/change-password', {
        old_password: pwForm.old_password,
        new_password: pwForm.new_password,
      })
      setPwMsg('✅ Password changed successfully!')
      setPwForm({ old_password: '', new_password: '', confirm: '' })
    } catch (err) {
      setPwError('❌ ' + (err.response?.data?.message || 'Failed'))
    } finally {
      setPwLoading(false)
    }
  }

  const saveContact = () => {
    if (!newContact.name || !newContact.phone) return
    const updated = [...contacts, { ...newContact, id: Date.now() }]
    setContacts(updated)
    localStorage.setItem('emergency_contacts', JSON.stringify(updated))
    setNewContact({ name: '', phone: '', relation: '' })
    setShowAddContact(false)
  }

  const deleteContact = (id) => {
    const updated = contacts.filter(c => c.id !== id)
    setContacts(updated)
    localStorage.setItem('emergency_contacts', JSON.stringify(updated))
  }

  const initials = (profile?.name || user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const totalReports = myReports.length
  const resolvedReports = myReports.filter(r => r.status === 'resolved').length
  const activeReports = myReports.filter(r => r.status !== 'resolved').length

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    border: '1.5px solid #e2e8f0', borderRadius: '10px',
    fontSize: '14px', outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  }

  const tabs = [
    { id: 'overview', label: '👤 Overview' },
    { id: 'reports', label: '📋 My Reports' },
    { id: 'security', label: '🔒 Security' },
    { id: 'emergency', label: '🚨 Emergency Contacts' },
  ]

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <p style={{ color: '#64748b' }}>Loading profile…</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>

      {/* Navbar */}
      <nav style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        padding: '0 32px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="32" height="32" viewBox="0 0 56 56" fill="none">
            <rect width="56" height="56" rx="16" fill="#16a34a"/>
            <path d="M28 10L14 16V28C14 36.4 20.2 44.2 28 46C35.8 44.2 42 36.4 42 28V16L28 10Z" fill="white"/>
            <path d="M22 28L26 32L34 24" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontWeight: '700', fontSize: '18px', color: '#0f172a' }}>Project SAVE</span>
        </div>
        <button onClick={() => navigate('/dashboard')} style={{ background: 'transparent', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', cursor: 'pointer' }}>
          ← Back to Dashboard
        </button>
      </nav>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', padding: '40px 24px 80px', color: '#fff' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '24px',
            background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', fontWeight: '800', color: '#fff', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>{profile?.name}</h1>
            <p style={{ opacity: 0.85, fontSize: '15px' }}>{profile?.email}</p>
            <p style={{ opacity: 0.7, fontSize: '13px', marginTop: '4px' }}>
              Member since {new Date(profile?.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ maxWidth: '900px', margin: '-40px auto 0', padding: '0 24px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[
            { label: 'Total Reports', value: totalReports, color: '#0f172a', icon: '📋' },
            { label: 'Resolved', value: resolvedReports, color: '#16a34a', icon: '✅' },
            { label: 'Active', value: activeReports, color: '#dc2626', icon: '🔴' },
          ].map(({ label, value, color, icon }) => (
            <div key={label} style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>{icon}</div>
              <p style={{ fontSize: '28px', fontWeight: '800', color }}>{value}</p>
              <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', borderRadius: '12px', padding: '4px', marginBottom: '24px' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                flex: 1, padding: '10px 8px', borderRadius: '8px', fontSize: '13px',
                fontWeight: '600', cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                background: activeTab === t.id ? '#fff' : 'transparent',
                color: activeTab === t.id ? '#0f172a' : '#64748b',
                boxShadow: activeTab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '20px' }}>Profile Information</h2>

            {/* Name */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Display Name</label>
              {editingName ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                    onFocus={e => e.target.style.borderColor = '#16a34a'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    autoFocus
                  />
                  <button onClick={handleUpdateName} disabled={nameLoading} style={{ padding: '11px 20px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                    {nameLoading ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={() => { setEditingName(false); setNewName(profile?.name) }} style={{ padding: '11px 16px', background: '#fff', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '15px', color: '#0f172a', fontWeight: '500' }}>{profile?.name}</span>
                  <button onClick={() => setEditingName(true)} style={{ background: 'transparent', border: 'none', color: '#16a34a', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Edit ✏️</button>
                </div>
              )}
              {nameMsg && <p style={{ fontSize: '13px', marginTop: '6px', color: nameMsg.startsWith('✅') ? '#16a34a' : '#dc2626' }}>{nameMsg}</p>}
            </div>

            {/* Email */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '15px', color: '#0f172a' }}>{profile?.email}</span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Cannot be changed</span>
              </div>
            </div>

            {/* Role */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Role</label>
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#dcfce7', color: '#16a34a', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize' }}>
                  {profile?.role || 'user'}
                </span>
              </div>
            </div>

            {/* Joined */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Member Since</label>
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '15px', color: '#0f172a' }}>
                  {new Date(profile?.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* My Reports Tab */}
        {activeTab === 'reports' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>My Reports ({myReports.length})</h2>
              <button onClick={() => navigate('/report')} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                + New Report
              </button>
            </div>

            {myReports.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                <p style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>No reports yet</p>
                <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px', marginBottom: '20px' }}>Start contributing to community safety</p>
                <button onClick={() => navigate('/report')} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  Report First Hazard
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {myReports.map(r => {
                  const s = severityColor[r.severity] || severityColor.low
                  const isResolved = r.status === 'resolved'
                  return (
                    <div key={r.id} style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: isResolved ? '1px solid #bbf7d0' : '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {r.image_url ? (
                        <img src={r.image_url} alt="hazard" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '60px', height: '60px', background: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>🚧</div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '15px', color: '#0f172a' }}>{r.hazard_type}</strong>
                          <span style={{ background: s.bg, color: s.text, padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', textTransform: 'capitalize' }}>{r.severity}</span>
                          {isResolved && <span style={{ background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>✅ Resolved</span>}
                        </div>
                        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '4px' }}>{r.description?.slice(0, 80)}{r.description?.length > 80 ? '…' : ''}</p>
                        <p style={{ color: '#94a3b8', fontSize: '12px' }}>{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ fontSize: '12px', color: isResolved ? '#16a34a' : '#f59e0b', fontWeight: '600', background: isResolved ? '#f0fdf4' : '#fffbeb', padding: '4px 10px', borderRadius: '20px', border: `1px solid ${isResolved ? '#bbf7d0' : '#fde68a'}` }}>
                          {isResolved ? 'Resolved' : 'Active'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>Change Password</h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>Make sure your new password is at least 6 characters</p>

            {[
              { label: 'Current Password', key: 'old_password', placeholder: '••••••••' },
              { label: 'New Password', key: 'new_password', placeholder: 'Min 6 characters' },
              { label: 'Confirm New Password', key: 'confirm', placeholder: 'Repeat new password' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>{f.label}</label>
                <input
                  type="password"
                  placeholder={f.placeholder}
                  value={pwForm[f.key]}
                  onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#16a34a'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            ))}

            {pwError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>{pwError}</div>}
            {pwMsg && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', color: '#16a34a', fontSize: '14px', marginBottom: '16px' }}>{pwMsg}</div>}

            <button onClick={handleChangePassword} disabled={pwLoading} style={{ width: '100%', padding: '13px', background: pwLoading ? '#86efac' : '#16a34a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: pwLoading ? 'not-allowed' : 'pointer' }}>
              {pwLoading ? 'Changing…' : '🔒 Change Password'}
            </button>
          </div>
        )}

        {/* Emergency Contacts Tab */}
        {activeTab === 'emergency' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Emergency Contacts</h2>
                <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>These are shared with the Emergency page</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => navigate('/emergency')} style={{ background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fecaca', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  🚨 Emergency Page
                </button>
                <button onClick={() => setShowAddContact(true)} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  + Add Contact
                </button>
              </div>
            </div>

            {showAddContact && (
              <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '16px', border: '1.5px solid #16a34a', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>Add Emergency Contact</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  {[
                    { label: 'Full Name', key: 'name', type: 'text', placeholder: 'e.g. Mom' },
                    { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '+1 234 567 8900' },
                    { label: 'Relation', key: 'relation', type: 'text', placeholder: 'e.g. Mother' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>{f.label}</label>
                      <input type={f.type} placeholder={f.placeholder} value={newContact[f.key]}
                        onChange={e => setNewContact(p => ({ ...p, [f.key]: e.target.value }))}
                        style={inputStyle}
                        onFocus={e => e.target.style.borderColor = '#16a34a'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setShowAddContact(false)} style={{ padding: '10px 20px', background: '#fff', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={saveContact} style={{ padding: '10px 20px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Save Contact</button>
                </div>
              </div>
            )}

            {contacts.length === 0 && !showAddContact ? (
              <div style={{ background: '#fff', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                <p style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>No emergency contacts yet</p>
                <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px', marginBottom: '20px' }}>Add people to reach in case of emergency</p>
                <button onClick={() => setShowAddContact(true)} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  + Add First Contact
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {contacts.map(c => (
                  <div key={c.id} style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>👤</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>{c.name}</p>
                      <p style={{ color: '#16a34a', fontSize: '14px', fontWeight: '600' }}>{c.phone}</p>
                      {c.relation && <p style={{ color: '#94a3b8', fontSize: '12px' }}>{c.relation}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a href={`tel:${c.phone}`} style={{ background: '#16a34a', color: '#fff', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>📞 Call</a>
                      <button onClick={() => deleteContact(c.id)} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer' }}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}