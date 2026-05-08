import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState('credentials') // 'credentials' | 'otp'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const startCooldown = () => {
    setResendCooldown(60)
    const t = setInterval(() => {
      setResendCooldown(s => { if (s <= 1) { clearInterval(t); return 0; } return s - 1; })
    }, 1000)
  }

  const handleCredentials = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await client.post('/auth/login', { email, password })
      setStep('otp')
      startCooldown()
    } catch (err) {
      const data = err.response?.data
      if (data?.needsVerification) {
        setError('Please verify your email first. Check your inbox.')
      } else {
        setError(data?.message || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOTP = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await client.post('/auth/verify-login', { email, otp })
      login(data.user, data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    try {
      await client.post('/auth/resend-otp', { email, purpose: 'login' })
      startCooldown()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend')
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <svg width="40" height="40" viewBox="0 0 56 56" fill="none">
            <rect width="56" height="56" rx="16" fill="#16a34a"/>
            <path d="M28 10L14 16V28C14 36.4 20.2 44.2 28 46C35.8 44.2 42 36.4 42 28V16L28 10Z" fill="white"/>
            <path d="M22 28L26 32L34 24" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={styles.logoText}>Project SAVE</span>
        </div>

        {step === 'credentials' ? (
          <>
            <h2 style={styles.title}>Welcome back</h2>
            <p style={styles.sub}>Sign in to your account</p>
            <form onSubmit={handleCredentials} style={styles.form}>
              <input style={styles.input} type="email" placeholder="Email address"
                value={email} onChange={e => setEmail(e.target.value)} required />
              <input style={styles.input} type="password" placeholder="Password"
                value={password} onChange={e => setPassword(e.target.value)} required />
              {error && <p style={styles.error}>{error}</p>}
              <button style={styles.btn} type="submit" disabled={loading}>
                {loading ? 'Sending OTP…' : 'Continue →'}
              </button>
            </form>
            <p style={styles.switch}>Don't have an account? <Link to="/signup" style={styles.link}>Sign up</Link></p>
          </>
        ) : (
          <>
            <h2 style={styles.title}>Check your email</h2>
            <p style={styles.sub}>We sent a 6-digit code to <strong>{email}</strong></p>
            <form onSubmit={handleOTP} style={styles.form}>
              <input style={{ ...styles.input, textAlign: 'center', fontSize: '28px', letterSpacing: '8px', fontWeight: '700' }}
                type="text" placeholder="000000" maxLength={6}
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} required />
              {error && <p style={styles.error}>{error}</p>}
              <button style={styles.btn} type="submit" disabled={loading}>
                {loading ? 'Verifying…' : 'Verify & Sign In'}
              </button>
              <button type="button" onClick={handleResend} disabled={resendCooldown > 0}
                style={{ ...styles.btn, background: '#f1f5f9', color: '#64748b', marginTop: '8px' }}>
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
              </button>
              <button type="button" onClick={() => { setStep('credentials'); setOtp(''); setError('') }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginTop: '4px', fontSize: '13px' }}>
                ← Change email
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' },
  card: { background: '#fff', borderRadius: '16px', padding: '36px 32px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' },
  logo: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' },
  logoText: { fontWeight: '800', fontSize: '20px', color: '#0f172a' },
  title: { fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' },
  sub: { color: '#64748b', fontSize: '14px', margin: '0 0 20px' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: { padding: '12px 14px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '15px', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' },
  error: { color: '#dc2626', fontSize: '13px', margin: '0', background: '#fef2f2', padding: '8px 12px', borderRadius: '6px' },
  btn: { background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', width: '100%' },
  switch: { textAlign: 'center', color: '#64748b', fontSize: '14px', marginTop: '16px' },
  link: { color: '#16a34a', fontWeight: '600', textDecoration: 'none' },
}