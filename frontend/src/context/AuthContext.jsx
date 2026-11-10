import { createContext, useState, useContext, useCallback } from 'react'

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext()
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)
  const [user, setUser]   = useState(() => {
    const u = localStorage.getItem('user')
    return u ? JSON.parse(u) : null
  })

  const login = (token, userData) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setToken(token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  const authFetch = useCallback((path, options = {}) =>
    fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    }), [token])

  return (
    <AuthContext.Provider value={{ token, user, setUser, login, logout, authFetch, BASE }}>
      {children}
    </AuthContext.Provider>
  )
}
