import { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { Mail, Lock, LogIn, Briefcase, AlertCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import './Auth.css'

export default function Login() {
  const { login, BASE } = useContext(AuthContext)
  const navigate = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    if (!form.email.trim() || !form.password.trim()) { setError('Please fill in all fields.'); return }
    setLoading(true); setError('')
    try {
      const res  = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password })
      })
      const data = await res.json()
      if (!res.ok) { 
        setError(data.error || 'Login failed.')
        toast.error(data.error || 'Login failed.')
        return 
      }
      login(data.token, data.user)
      toast.success(`Welcome back, ${data.user?.name?.split(' ')[0] || ''}!`)
      navigate('/')
    } catch { 
      setError('Cannot connect to server.') 
      toast.error('Cannot connect to server.')
    }
    finally  { setLoading(false) }
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-icon"><Briefcase size={32} /></div>
          <h1>FreelanceTracker</h1>
          <p>Sign in to your account</p>
        </div>
        {error && <div className="auth-error"><AlertCircle size={16} /> {error}</div>}
        <div className="auth-fields">
          <div className="field">
            <label>Email</label>
            <div className="input-with-icon">
              <input type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handle()} />
              <Mail className="input-icon" size={18} />
            </div>
          </div>
          <div className="field">
            <label>Password</label>
            <div className="input-with-icon">
              <input type="password" placeholder="••••••••" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handle()} />
              <Lock className="input-icon" size={18} />
            </div>
          </div>
        </div>
        <button className="btn-auth" onClick={handle} disabled={loading}>
          {loading ? 'Signing in…' : <><LogIn size={18} /> Sign In</>}
        </button>
        <p className="auth-switch">Don't have an account? <Link to="/signup">Sign up</Link></p>
      </div>
    </div>
  )
}
