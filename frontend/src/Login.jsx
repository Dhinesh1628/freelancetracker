import { useState, useContext } from 'react'
import { AuthContext } from './context/AuthContext'
import './Login.css'

export default function Login() {
  const { login } = useContext(AuthContext)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!form.email.trim() || !form.password.trim()) {
      setError('Please enter email and password.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed.')
      } else {
        login(data.token, data.user)
      }
    } catch (err) {
      setError('Cannot connect to server. Make sure backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-icon">💼</div>
          <h1>FreelanceTracker</h1>
          <p>Sign in to manage your projects</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <div className="login-fields">
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>
        </div>

        <button className="btn-login" onClick={handleLogin} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </div>
    </div>
  )
}
