import { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { User, Mail, Lock, UserPlus, Briefcase, AlertCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import './Auth.css'

export default function Signup() {
  const { registerUser } = useContext(AuthContext)
  const navigate = useNavigate()
  const [form, setForm]     = useState({ name: '', email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) { setError('Please fill in all fields.'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true); setError('')
    try {
      const { data, error: err } = await registerUser(form.name, form.email, form.password)
      if (err) {
        setError(err)
        toast.error(err)
        return
      }
      toast.success(`Welcome, ${data.user?.name?.split(' ')[0] || ''}! Account created successfully.`)
      navigate('/')
    } catch {
      setError('An error occurred during account creation.')
      toast.error('An error occurred during account creation.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-icon"><Briefcase size={32} /></div>
          <h1>FreelanceTracker</h1>
          <p>Create your account</p>
        </div>
        {error && <div className="auth-error"><AlertCircle size={16} /> {error}</div>}
        <div className="auth-fields">
          <div className="field">
            <label>Full Name</label>
            <div className="input-with-icon">
              <input type="text" placeholder="John Doe" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handle()} />
              <User className="input-icon" size={18} />
            </div>
          </div>
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
              <input type="password" placeholder="Min. 6 characters" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handle()} />
              <Lock className="input-icon" size={18} />
            </div>
          </div>
        </div>
        <button className="btn-auth" onClick={handle} disabled={loading}>
          {loading ? 'Creating account…' : <><UserPlus size={18} /> Create Account</>}
        </button>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  )
}
