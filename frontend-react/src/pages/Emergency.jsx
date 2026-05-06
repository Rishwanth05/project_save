import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const SAFETY_TIPS = [
  {
    type: 'Gas Leak', icon: '💨', color: '#dc2626', bg: '#fef2f2', border: '#fecaca',
    steps: ['Do NOT turn on/off any electrical switches', 'Evacuate everyone immediately', 'Leave doors open as you exit', 'Call gas emergency number from outside', 'Do not re-enter until cleared by authorities'],
  },
  {
    type: 'Flooding', icon: '🌊', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe',
    steps: ['Move to higher ground immediately', 'Do not walk through moving water', 'Avoid driving through flooded roads', 'Disconnect electrical appliances', 'Call emergency services if trapped'],
  },
  {
    type: 'Fire', icon: '🔥', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa',
    steps: ['Activate the nearest fire alarm', 'Call fire emergency number immediately', 'Evacuate using stairs, not elevators', 'Stay low to avoid smoke inhalation', 'Meet at designated assembly point'],
  },
  {
    type: 'Fallen Tree / Road Damage', icon: '🌳', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0',
    steps: ['Do not attempt to move large debris', 'Set up warning signals if safe', 'Report via Project SAVE immediately', 'Reroute traffic if possible', 'Call local municipality'],
  },
  {
    type: 'Exposed Wire', icon: '⚡', color: '#ca8a04', bg: '#fefce8', border: '#fde68a',
    steps: ['Stay at least 30 feet away', 'Do not touch with any object', 'Warn others to keep clear', 'Call electric company and emergency services', 'Never drive over downed power lines'],
  },
  {
    type: 'Pothole / Road Hazard', icon: '🚧', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe',
    steps: ['Slow down and navigate carefully', 'Turn on hazard lights if stopping', 'Report via Project SAVE', 'Call local road maintenance', 'Document with photo if safe'],
  },
]

// Emergency numbers by country code
const EMERGENCY_BY_COUNTRY = {
  IN: {
    name: 'India',
    flag: '🇮🇳',
    numbers: [
      { label: 'Police', number: '100', icon: '👮', color: '#dc2626', bg: '#fef2f2' },
      { label: 'Fire', number: '101', icon: '🔥', color: '#ea580c', bg: '#fff7ed' },
      { label: 'Ambulance', number: '102', icon: '🚑', color: '#2563eb', bg: '#eff6ff' },
      { label: 'Disaster Management', number: '108', icon: '🚨', color: '#7c3aed', bg: '#f5f3ff' },
      { label: 'Women Helpline', number: '1091', icon: '👩', color: '#db2777', bg: '#fdf2f8' },
      { label: 'Child Helpline', number: '1098', icon: '👶', color: '#16a34a', bg: '#f0fdf4' },
    ],
  },
  US: {
    name: 'United States',
    flag: '🇺🇸',
    numbers: [
      { label: 'Police / Fire / Medical', number: '911', icon: '🚨', color: '#dc2626', bg: '#fef2f2' },
      { label: 'Non-Emergency Police', number: '311', icon: '👮', color: '#2563eb', bg: '#eff6ff' },
      { label: 'Poison Control', number: '1-800-222-1222', icon: '☠️', color: '#7c3aed', bg: '#f5f3ff' },
      { label: 'Gas Emergency', number: '1-800-427-2200', icon: '💨', color: '#ea580c', bg: '#fff7ed' },
      { label: 'Red Cross Disaster', number: '1-800-733-2767', icon: '🏥', color: '#dc2626', bg: '#fef2f2' },
      { label: 'Electric Emergency', number: '1-800-375-7117', icon: '⚡', color: '#ca8a04', bg: '#fefce8' },
    ],
  },
  GB: {
    name: 'United Kingdom',
    flag: '🇬🇧',
    numbers: [
      { label: 'Emergency Services', number: '999', icon: '🚨', color: '#dc2626', bg: '#fef2f2' },
      { label: 'Non-Emergency Police', number: '101', icon: '👮', color: '#2563eb', bg: '#eff6ff' },
      { label: 'NHS Non-Emergency', number: '111', icon: '🏥', color: '#16a34a', bg: '#f0fdf4' },
      { label: 'Gas Emergency', number: '0800 111 999', icon: '💨', color: '#ea580c', bg: '#fff7ed' },
      { label: 'Electric Emergency', number: '105', icon: '⚡', color: '#ca8a04', bg: '#fefce8' },
      { label: 'Crimestoppers', number: '0800 555 111', icon: '🔍', color: '#7c3aed', bg: '#f5f3ff' },
    ],
  },
  AU: {
    name: 'Australia',
    flag: '🇦🇺',
    numbers: [
      { label: 'Emergency Services', number: '000', icon: '🚨', color: '#dc2626', bg: '#fef2f2' },
      { label: 'Police Non-Emergency', number: '131 444', icon: '👮', color: '#2563eb', bg: '#eff6ff' },
      { label: 'Nurse On Call', number: '1300 60 60 24', icon: '🏥', color: '#16a34a', bg: '#f0fdf4' },
      { label: 'SES Emergency', number: '132 500', icon: '🆘', color: '#ea580c', bg: '#fff7ed' },
      { label: 'Poisons Info', number: '13 11 26', icon: '☠️', color: '#7c3aed', bg: '#f5f3ff' },
      { label: 'Lifeline', number: '13 11 14', icon: '💙', color: '#0ea5e9', bg: '#f0f9ff' },
    ],
  },
  TH: {
    name: 'Thailand',
    flag: '🇹🇭',
    numbers: [
      { label: 'Emergency', number: '191', icon: '🚨', color: '#dc2626', bg: '#fef2f2' },
      { label: 'Fire', number: '199', icon: '🔥', color: '#ea580c', bg: '#fff7ed' },
      { label: 'Ambulance', number: '1669', icon: '🚑', color: '#2563eb', bg: '#eff6ff' },
      { label: 'Tourist Police', number: '1155', icon: '👮', color: '#16a34a', bg: '#f0fdf4' },
      { label: 'Electricity', number: '1129', icon: '⚡', color: '#ca8a04', bg: '#fefce8' },
      { label: 'Highway Police', number: '1193', icon: '🚗', color: '#7c3aed', bg: '#f5f3ff' },
    ],
  },
  CA: {
    name: 'Canada',
    flag: '🇨🇦',
    numbers: [
      { label: 'Emergency Services', number: '911', icon: '🚨', color: '#dc2626', bg: '#fef2f2' },
      { label: 'Non-Emergency Police', number: '311', icon: '👮', color: '#2563eb', bg: '#eff6ff' },
      { label: 'Poison Control', number: '1-800-268-9017', icon: '☠️', color: '#7c3aed', bg: '#f5f3ff' },
      { label: 'Crisis Hotline', number: '1-833-456-4566', icon: '💙', color: '#0ea5e9', bg: '#f0f9ff' },
      { label: 'Gas Emergency', number: '1-800-400-2255', icon: '💨', color: '#ea580c', bg: '#fff7ed' },
      { label: 'Red Cross', number: '1-800-418-1111', icon: '🏥', color: '#dc2626', bg: '#fef2f2' },
    ],
  },
  DE: {
    name: 'Germany',
    flag: '🇩🇪',
    numbers: [
      { label: 'Police', number: '110', icon: '👮', color: '#2563eb', bg: '#eff6ff' },
      { label: 'Fire / Ambulance', number: '112', icon: '🚨', color: '#dc2626', bg: '#fef2f2' },
      { label: 'Medical On-Call', number: '116 117', icon: '🏥', color: '#16a34a', bg: '#f0fdf4' },
      { label: 'Poison Control', number: '030 19240', icon: '☠️', color: '#7c3aed', bg: '#f5f3ff' },
      { label: 'Gas Emergency', number: '0800 0100 100', icon: '💨', color: '#ea580c', bg: '#fff7ed' },
      { label: 'Electric Emergency', number: '0800 3629477', icon: '⚡', color: '#ca8a04', bg: '#fefce8' },
    ],
  },
  DEFAULT: {
    name: 'International',
    flag: '🌍',
    numbers: [
      { label: 'Global Emergency (GSM)', number: '112', icon: '🚨', color: '#dc2626', bg: '#fef2f2' },
      { label: 'International SOS', number: '+1-215-942-8226', icon: '🆘', color: '#ea580c', bg: '#fff7ed' },
      { label: 'WHO Emergency', number: '+41-22-791-2111', icon: '🏥', color: '#2563eb', bg: '#eff6ff' },
      { label: 'Red Cross', number: '+41-22-730-3600', icon: '➕', color: '#dc2626', bg: '#fef2f2' },
      { label: 'UNHCR Emergency', number: '+41-22-739-8111', icon: '🌐', color: '#7c3aed', bg: '#f5f3ff' },
      { label: 'Interpol', number: '+33-4-7244-7444', icon: '👮', color: '#0ea5e9', bg: '#f0f9ff' },
    ],
  },
}

export default function Emergency() {
  const navigate = useNavigate()
  const [contacts, setContacts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('emergency_contacts')) || [] }
    catch { return [] }
  })
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', phone: '', relation: '' })
  const [expandedTip, setExpandedTip] = useState(null)
  const [sosActive, setSosActive] = useState(false)
  const [locationSearch, setLocationSearch] = useState('')
  const [locationSearching, setLocationSearching] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [detecting, setDetecting] = useState(true)

  // Auto detect country on load
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`)
          const data = await res.json()
          const code = data.address?.country_code?.toUpperCase()
          setSelectedCountry(EMERGENCY_BY_COUNTRY[code] || { ...EMERGENCY_BY_COUNTRY.DEFAULT, name: data.address?.country || 'Your Region' })
        } catch {
          setSelectedCountry(EMERGENCY_BY_COUNTRY.DEFAULT)
        } finally {
          setDetecting(false)
        }
      },
      () => {
        setSelectedCountry(EMERGENCY_BY_COUNTRY.DEFAULT)
        setDetecting(false)
      }
    )
  }, [])

  const handleLocationSearch = async () => {
    if (!locationSearch.trim()) return
    setLocationSearching(true)
    setLocationError('')
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationSearch)}&format=json&limit=1`)
      const data = await res.json()
      if (!data.length) { setLocationError('Location not found'); setLocationSearching(false); return }

      const revRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${data[0].lat}&lon=${data[0].lon}&format=json`)
      const revData = await revRes.json()
      const code = revData.address?.country_code?.toUpperCase()
      const country = EMERGENCY_BY_COUNTRY[code] || {
        ...EMERGENCY_BY_COUNTRY.DEFAULT,
        name: revData.address?.country || locationSearch,
        flag: '🌍',
      }
      setSelectedCountry(country)
    } catch {
      setLocationError('Failed to find location. Try again.')
    } finally {
      setLocationSearching(false)
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

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    border: '1.5px solid #e2e8f0', borderRadius: '8px',
    fontSize: '14px', outline: 'none', fontFamily: 'inherit',
  }

  const emergencyNumbers = selectedCountry?.numbers || EMERGENCY_BY_COUNTRY.DEFAULT.numbers
  const sosNumber = emergencyNumbers[0]?.number || '911'

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
      <div style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)', padding: '40px 24px', textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚨</div>
        <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>Emergency Center</h1>
        <p style={{ opacity: 0.85, fontSize: '16px', marginBottom: '24px' }}>
          {detecting ? 'Detecting your location…' : `Showing numbers for ${selectedCountry?.flag} ${selectedCountry?.name}`}
        </p>

        {/* SOS Button */}
        <button
          onClick={() => { setSosActive(true); setTimeout(() => setSosActive(false), 3000); window.location.href = `tel:${sosNumber}` }}
          style={{
            background: sosActive ? '#fff' : 'rgba(255,255,255,0.15)',
            color: sosActive ? '#dc2626' : '#fff',
            border: '3px solid #fff', borderRadius: '50px',
            padding: '16px 48px', fontSize: '22px', fontWeight: '800',
            cursor: 'pointer', letterSpacing: '0.1em',
            boxShadow: '0 0 0 6px rgba(255,255,255,0.2)',
            transition: 'all 0.2s',
          }}
        >
          {sosActive ? `📞 Calling ${sosNumber}…` : `🆘 SOS — Call ${sosNumber}`}
        </button>
        <p style={{ opacity: 0.7, fontSize: '13px', marginTop: '12px' }}>Tap to call local emergency services</p>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Location search */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '32px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <p style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a', marginBottom: '6px' }}>📍 Change Location</p>
          <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '14px' }}>Search any city or country to see their local emergency numbers</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="e.g. Mumbai, Thailand, London, Sydney…"
              value={locationSearch}
              onChange={e => setLocationSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLocationSearch()}
              style={{ ...inputStyle, flex: 1 }}
              onFocus={e => e.target.style.borderColor = '#dc2626'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
            <button
              onClick={handleLocationSearch}
              disabled={locationSearching}
              style={{ padding: '10px 20px', background: locationSearching ? '#fecaca' : '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {locationSearching ? 'Searching…' : '🔍 Search'}
            </button>
            <button
              onClick={() => {
                setDetecting(true)
                navigator.geolocation.getCurrentPosition(
                  async ({ coords }) => {
                    try {
                      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`)
                      const data = await res.json()
                      const code = data.address?.country_code?.toUpperCase()
                      setSelectedCountry(EMERGENCY_BY_COUNTRY[code] || { ...EMERGENCY_BY_COUNTRY.DEFAULT, name: data.address?.country || 'Your Region' })
                    } catch {
                      setSelectedCountry(EMERGENCY_BY_COUNTRY.DEFAULT)
                    } finally { setDetecting(false) }
                  },
                  () => { setSelectedCountry(EMERGENCY_BY_COUNTRY.DEFAULT); setDetecting(false) }
                )
              }}
              style={{ padding: '10px 16px', background: '#f0fdf4', color: '#16a34a', border: '1.5px solid #16a34a', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              📡 My Location
            </button>
          </div>
          {locationError && <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '8px' }}>{locationError}</p>}

          {/* Quick country buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '14px' }}>
            {Object.entries(EMERGENCY_BY_COUNTRY).filter(([k]) => k !== 'DEFAULT').map(([code, c]) => (
              <button
                key={code}
                onClick={() => setSelectedCountry(c)}
                style={{
                  padding: '6px 14px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer',
                  border: selectedCountry?.name === c.name ? '2px solid #dc2626' : '1.5px solid #e2e8f0',
                  background: selectedCountry?.name === c.name ? '#fef2f2' : '#fff',
                  color: selectedCountry?.name === c.name ? '#dc2626' : '#374151',
                  fontWeight: selectedCountry?.name === c.name ? '600' : '400',
                  transition: 'all 0.15s',
                }}
              >
                {c.flag} {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Emergency Numbers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>📞 Emergency Numbers</h2>
          {selectedCountry && (
            <span style={{ background: '#fef2f2', color: '#dc2626', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
              {selectedCountry.flag} {selectedCountry.name}
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', marginBottom: '40px' }}>
          {emergencyNumbers.map(e => (
            <a key={e.label} href={`tel:${e.number}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#fff', borderRadius: '12px', padding: '16px 20px',
                border: `1.5px solid ${e.bg}`, display: 'flex', alignItems: 'center', gap: '14px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'all 0.2s', cursor: 'pointer',
              }}
                onMouseEnter={e2 => { e2.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; e2.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e2 => { e2.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; e2.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: e.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                  {e.icon}
                </div>
                <div>
                  <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '2px' }}>{e.label}</p>
                  <p style={{ fontSize: '20px', fontWeight: '700', color: e.color }}>{e.number}</p>
                </div>
                <div style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: '18px' }}>📞</div>
              </div>
            </a>
          ))}
        </div>

        {/* Personal Emergency Contacts */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>👥 My Emergency Contacts</h2>
          <button onClick={() => setShowAddContact(true)} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            + Add Contact
          </button>
        </div>

        {showAddContact && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '16px', border: '1.5px solid #16a34a', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>Add Emergency Contact</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              {[
                { label: 'Full Name', key: 'name', type: 'text', placeholder: 'e.g. Mom' },
                { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: 'e.g. +1 234 567 8900' },
                { label: 'Relation', key: 'relation', type: 'text', placeholder: 'e.g. Mother, Doctor' },
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
          <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', textAlign: 'center', border: '1px solid #e2e8f0', marginBottom: '40px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>👥</div>
            <p style={{ fontWeight: '600', color: '#0f172a', fontSize: '16px' }}>No emergency contacts yet</p>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px' }}>Add people to contact in case of emergency</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', marginBottom: '40px' }}>
            {contacts.map(c => (
              <div key={c.id} style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>👤</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>{c.name}</p>
                  <p style={{ color: '#16a34a', fontSize: '14px', fontWeight: '600' }}>{c.phone}</p>
                  {c.relation && <p style={{ color: '#94a3b8', fontSize: '12px' }}>{c.relation}</p>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <a href={`tel:${c.phone}`} style={{ background: '#16a34a', color: '#fff', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none', textAlign: 'center' }}>📞 Call</a>
                  <button onClick={() => deleteContact(c.id)} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Safety Manual */}
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>📖 Safety Manual</h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>What to do in each type of hazard situation</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
          {SAFETY_TIPS.map((tip, i) => (
            <div key={tip.type} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', border: expandedTip === i ? `1.5px solid ${tip.color}` : '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'all 0.2s' }}>
              <button
                onClick={() => setExpandedTip(expandedTip === i ? null : i)}
                style={{ width: '100%', padding: '16px 20px', background: expandedTip === i ? tip.bg : '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', transition: 'background 0.2s' }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: tip.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, border: `1px solid ${tip.border}` }}>
                  {tip.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>{tip.type}</p>
                  <p style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>{tip.steps.length} safety steps</p>
                </div>
                <span style={{ color: '#94a3b8', fontSize: '18px', transform: expandedTip === i ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', display: 'inline-block' }}>↓</span>
              </button>

              {expandedTip === i && (
                <div style={{ padding: '0 20px 20px' }}>
                  <div style={{ height: '1px', background: tip.border, marginBottom: '16px' }} />
                  {tip.steps.map((step, si) => (
                    <div key={si} style={{ display: 'flex', gap: '12px', marginBottom: '10px', alignItems: 'flex-start' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: tip.bg, border: `1.5px solid ${tip.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: tip.color, flexShrink: 0 }}>
                        {si + 1}
                      </div>
                      <p style={{ color: '#374151', fontSize: '14px', lineHeight: '1.5', paddingTop: '2px' }}>{step}</p>
                    </div>
                  ))}
                  <button onClick={() => navigate('/report')} style={{ marginTop: '12px', width: '100%', padding: '10px', background: tip.bg, color: tip.color, border: `1.5px solid ${tip.color}`, borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    🚨 Report this hazard →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}