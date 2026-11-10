import { createContext, useState, useContext, useCallback } from 'react'
import { localRegister, localLogin, handleLocalStoreDispatch } from '../services/localStore'

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext()
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)

const BASE = import.meta.env.VITE_API_URL || ''

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)
  const [user, setUser]   = useState(() => {
    const u = localStorage.getItem('user')
    return u ? JSON.parse(u) : null
  })

  const login = (authToken, userData) => {
    localStorage.setItem('token', authToken)
    localStorage.setItem('user', JSON.stringify(userData))
    setToken(authToken)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  const registerUser = async (name, email, password) => {
    if (BASE) {
      try {
        const res = await fetch(`${BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        })
        const data = await res.json()
        if (res.ok) {
          login(data.token, data.user)
          return { data, error: null }
        }
        return { data: null, error: data.error || 'Signup failed' }
      } catch (err) {
        console.warn('[Register] Remote API failed, initializing local persistent profile:', err)
      }
    }

    // Local persistent registration
    const result = localRegister(name, email, password)
    login(result.token, result.user)
    return { data: result, error: null }
  }

  const loginUser = async (email, password) => {
    if (BASE) {
      try {
        const res = await fetch(`${BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })
        const data = await res.json()
        if (res.ok) {
          login(data.token, data.user)
          return { data, error: null }
        }
        return { data: null, error: data.error || 'Login failed' }
      } catch (err) {
        console.warn('[Login] Remote API failed, validating against local store:', err)
      }
    }

    // Local persistent login
    const result = localLogin(email, password)
    login(result.token, result.user)
    return { data: result, error: null }
  }

  const authFetch = useCallback(async (path, options = {}) => {
    if (BASE) {
      try {
        const res = await fetch(`${BASE}${path}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...(options.headers || {})
          }
        })
        if (res.status !== 404 && res.status !== 502 && res.status !== 503) {
          return res
        }
      } catch (e) {
        console.warn(`[API] Remote call to ${path} failed, falling back to local persistent store:`, e)
      }
    }

    // Local Persistent Storage Dispatch
    return handleLocalStoreDispatch(path, options, user)
  }, [token, user])

  return (
    <AuthContext.Provider value={{ token, user, setUser, login, logout, registerUser, loginUser, authFetch, BASE }}>
      {children}
    </AuthContext.Provider>
  )
}
