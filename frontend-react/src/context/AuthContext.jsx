import { createContext, useContext, useState, useEffect } from 'react'
import { requestNotificationPermission } from '../firebase'
import client, { setAccessToken, getAccessToken, initializeAuth } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) }
    catch { return null }
  })

  // On mount: if a refreshToken exists, silently get a new accessToken
  useEffect(() => {
    if (localStorage.getItem('refreshToken')) {
      initializeAuth().catch(() => {
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        setUser(null)
      })
    }
  }, [])

  const login = async (userData, accessToken, refreshToken) => {
    setAccessToken(accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)

    try {
      const fcmToken = await requestNotificationPermission()
      if (fcmToken) {
        await client.post('/auth/fcm-token', { token: fcmToken })
      }
    } catch (err) {
      console.warn('FCM registration skipped:', err.message)
    }
  }

  const logout = () => {
    const savedRefreshToken = localStorage.getItem('refreshToken')
    const savedAccessToken = getAccessToken()

    // Clear local state immediately so the UI reflects logged-out status
    setAccessToken(null)
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setUser(null)

    // Fire-and-forget server invalidation.
    // Pre-set Authorization header here because accessToken is already null in
    // memory by the time the async request interceptor runs — without this the
    // interceptor would skip the header and verifyToken would reject the request.
    if (savedRefreshToken || savedAccessToken) {
      client.post(
        '/auth/logout',
        { refreshToken: savedRefreshToken },
        { headers: savedAccessToken ? { Authorization: `Bearer ${savedAccessToken}` } : {} }
      ).catch(() => {})
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
