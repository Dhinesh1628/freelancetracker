import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './Profile.css'

export default function Profile() {
  const { user, setUser, authFetch } = useAuth()
  const [form, setForm]     = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError]     = useState('')

  useEffect(() => {
    let isMounted = true
    authFetch('/auth/me')
      .then(r => r.json())
      .then(d => {
        if (!isMounted) return
        const u = d.user || d
        setForm({ name: u.name || '', email: u.email || '', password: '' })
      })
      .catch(() => {
        if (!isMounted) return
        // fallback to cached user
        setForm({ name: user?.name || '', email: user?.email || '', password: '' })
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [authFetch, user?.name, user?.email])

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required.'); return }
    setSaving(true); setError(''); setSuccess('')
    try {
      const body = { name: form.name, email: form.email }
      if (form.password.trim()) body.password = form.password

      const res  = await authFetch('/auth/me', { method: 'PUT', body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Update failed.'); return }

      const updated = data.user || data
      setUser(updated)
      localStorage.setItem('user', JSON.stringify(updated))
      setForm(f => ({ ...f, password: '' }))
      setSuccess('Profile updated successfully.')
    } catch { setError('Server error.') }
    finally  { setSaving(false) }
  }

  if (loading) return <div className="page"><p style={{color:'var(--muted)'}}>Loading profile…</p></div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Profile</h2>
          <p className="page-sub">Manage your account details</p>
        </div>
      </div>

      <div className="profile-layout">
        {/* Avatar card */}
        <div className="profile-avatar-card">
          <div className="big-avatar">{form.name?.[0]?.toUpperCase() || 'U'}</div>
          <div className="profile-name">{form.name}</div>
          <div className="profile-email">{form.email}</div>
        </div>

        {/* Edit form */}
        <div className="profile-form-card">
          <h3 className="form-title">Edit Details</h3>

          {error   && <div className="form-msg error">{error}</div>}
          {success && <div className="form-msg success">{success}</div>}

          <div className="profile-fields">
            <div className="field">
              <label>Full Name</label>
              <input type="text" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field">
              <label>New Password <span className="optional">(leave blank to keep current)</span></label>
              <input type="password" placeholder="••••••••" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
          </div>

          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
