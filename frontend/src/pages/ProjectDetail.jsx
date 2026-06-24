import { useEffect, useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import usePermission from '../hooks/usePermission'
import { ArrowLeft, Edit3, Trash2, DollarSign, Activity, User, Users, Plus, X, Shield, Mail } from 'lucide-react'
import './ProjectDetail.css'

const ROLES = ['admin', 'member', 'viewer']

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { authFetch } = useAuth()

  const [project, setProject] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole]   = useState('viewer')
  const [inviteError, setInviteError] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)

  const perm = usePermission(project)

  const loadProject = () => {
    authFetch(`/projects/${id}`)
      .then(async r => {
        if (r.status === 403 || r.status === 404) { setForbidden(true); return null }
        return r.json()
      })
      .then(d => { if (d) setProject(d) })
      .finally(() => setLoading(false))
  }

  const loadMembers = () => {
    authFetch(`/projects/${id}/members`)
      .then(r => r.json())
      .then(d => setMembers(d.members || []))
      .catch(() => {})
  }

  useEffect(() => { loadProject(); loadMembers() }, [id])

  const handleInvite = async () => {
    if (!inviteEmail.trim()) { setInviteError('Enter an email address.'); return }
    setInviteLoading(true); setInviteError('')
    try {
      const res = await authFetch(`/projects/${id}/members`, {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole })
      })
      const data = await res.json()
      if (!res.ok) { setInviteError(data.error || 'Failed to invite user.'); return }
      setInviteEmail(''); setInviteRole('viewer')
      loadMembers()
    } catch { setInviteError('Server error occurred.') }
    finally { setInviteLoading(false) }
  }

  const handleRoleChange = async (userId, role) => {
    await authFetch(`/projects/${id}/members/${userId}`, { method: 'PUT', body: JSON.stringify({ role }) })
    loadMembers()
  }

  const handleRemove = async (userId) => {
    if (!window.confirm('Remove this member from the project?')) return
    await authFetch(`/projects/${id}/members/${userId}`, { method: 'DELETE' })
    loadMembers()
  }

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this entire project? This action cannot be undone.')) return
    await authFetch(`/projects/${id}`, { method: 'DELETE' })
    navigate('/projects')
  }

  if (forbidden) return <Navigate to="/access-denied" replace />
  if (loading) return <div className="page animate-fade-in"><p style={{ color: 'var(--muted)' }}>Loading project data…</p></div>
  if (!project) return null

  return (
    <div className="page animate-fade-in">
      <button className="back-link" onClick={() => navigate('/projects')}>
        <ArrowLeft size={16} /> Back to Projects
      </button>

      <div className="page-header hero">
        <div>
          <h2>{project.projectTitle}</h2>
          <p className="page-sub inline"><User size={14} /> Client: {project.clientName}</p>
        </div>
        <div className="header-actions">
          {perm.canEdit && <button className="btn-secondary"><Edit3 size={16} /> Edit Project</button>}
          {perm.canDelete && <button className="btn-danger" onClick={handleDeleteProject}><Trash2 size={16} /> Delete Project</button>}
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <div className="detail-label"><DollarSign size={14} /> Budget</div>
          <div className="detail-val">${(project.budget || 0).toLocaleString()}</div>
        </div>
        <div className="detail-card">
          <div className="detail-label"><Activity size={14} /> Status</div>
          <div className="detail-val"><span className={`badge ${project.isCompleted ? 'completed' : 'active'}`}>{project.isCompleted ? 'Completed' : 'Active'}</span></div>
        </div>
        <div className="detail-card">
          <div className="detail-label"><Shield size={14} /> Your Role</div>
          <div className="detail-val"><span className={`role-badge ${perm.role}`}>{perm.role}</span></div>
        </div>
      </div>

      {/* MANAGE MEMBERS */}
      <div className="members-section">
        <div className="section-header">
          <h3><Users size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Manage Members</h3>
        </div>

        {perm.canManageMembers && (
          <div className="invite-row">
            {inviteError && <div className="form-error full"><X size={14} /> {inviteError}</div>}
            <input
              type="email"
              placeholder="Invite by email address…"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
            />
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
            <button className="btn-primary" onClick={handleInvite} disabled={inviteLoading}>
              <Plus size={16} /> {inviteLoading ? 'Inviting…' : 'Invite'}
            </button>
          </div>
        )}

        <div className="members-list">
          {members.map(m => (
            <div className="member-row" key={m.userId}>
              <div className="member-left">
                <div className="m-init">{m.name?.[0]?.toUpperCase() || '?'}</div>
                <div>
                  <div className="m-name">{m.name}</div>
                  <div className="m-email"><Mail size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }}/>{m.email}</div>
                </div>
              </div>
              <div className="member-right">
                {perm.canManageMembers && String(m.userId) !== String(project.userId) ? (
                  <>
                    <select value={m.role} onChange={e => handleRoleChange(m.userId, e.target.value)}>
                      {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                    </select>
                    <button className="act-btn del" onClick={() => handleRemove(m.userId)} title="Remove Member">
                      <Trash2 size={16} />
                    </button>
                  </>
                ) : (
                  <span className={`role-badge ${m.role}`}>
                    {m.role}{String(m.userId) === String(project.userId) ? ' (Owner)' : ''}
                  </span>
                )}
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <div className="empty-note">
              <Users size={32} opacity={0.3} />
              No team members yet. Invite someone above.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
