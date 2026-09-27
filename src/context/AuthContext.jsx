/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'
import api from '../api'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)
const SESSION_KEY = 'marketlink_session'

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY))?.user || null } catch { return null }
  })
  const [loading, setLoading] = useState(false)

  const persist = (session) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    localStorage.setItem('marketlink_token', session.token)
    setUser(session.user)
    return session.user
  }

  const login = async (email, password) => {
    setLoading(true)
    try { return persist(await api.auth.login(email, password)) } finally { setLoading(false) }
  }

  const register = async (payload) => {
    setLoading(true)
    try { return persist(await api.auth.register(payload)) } finally { setLoading(false) }
  }

  const logout = () => {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem('marketlink_token')
    setUser(null)
    navigate('/', { replace: true })
  }

  const toggleFavorite = async (itemId) => {
    if (!user) throw new Error('Sign in to save favorites.')
    const updated = await api.users.toggleFavorite(user.id, itemId)
    const session = JSON.parse(localStorage.getItem(SESSION_KEY))
    if (session?.user?.id === user.id) persist({ ...session, user: updated })
    return updated.favorites.includes(itemId)
  }

  const value = { user, loading, login, register, logout, toggleFavorite, isAuthenticated: Boolean(user) }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
