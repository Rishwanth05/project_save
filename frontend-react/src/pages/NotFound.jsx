import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ textAlign: 'center', maxWidth: '480px' }}>

        <div style={{ fontSize: '80px', marginBottom: '16px' }}>🛡️</div>

        <h1 style={{ fontSize: '96px', fontWeight: '800', color: '#16a34a', margin: '0 0 8px', lineHeight: 1 }}>404</h1>

        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: '0 0 12px' }}>
          Page Not Found
        </h2>

        <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '32px', lineHeight: 1.6 }}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ padding: '12px 24px', background: '#fff', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}
          >
            ← Go Back
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ padding: '12px 24px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}