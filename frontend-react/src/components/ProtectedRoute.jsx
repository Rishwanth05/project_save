import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, authReady } = useAuth()
  if (!authReady) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0f172a',color:'#fff',fontSize:'18px'}}>Loading...</div>
  return user ? children : <Navigate to="/login" replace />
}
