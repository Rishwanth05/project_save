import { createContext, useContext, useState } from 'react'
import { requestNotificationPermission } from '../firebase'
import client from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) }
    catch { return null }
  })

  const login = async (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', token)
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
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
