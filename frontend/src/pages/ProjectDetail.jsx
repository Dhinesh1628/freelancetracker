import { useEffect, useState, useCallback } from 'react'
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

  const loadProject = useCallback(() => {
    authFetch(`/projects/${id}`)
      .then(async r => {
        if (r.status === 403 || r.status === 404) { setForbidden(true); return null }
        return r.json()
      })
      .then(d => { if (d) setProject(d) })
      .finally(() => setLoading(false))
  }, [authFetch, id])

  const loadMembers = useCallback(() => {
    authFetch(`/projects/${id}/members`)
      .then(r => r.json())
      .then(d => setMembers(d.members || []))
      .catch(() => {})
  }, [authFetch, id])

  useEffect(() => { 
    loadProject()
    loadMembers() 
  }, [loadProject, loadMembers])

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

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await authFetch(`/projects/${id}/members/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      })
      if (res.ok) loadMembers()
    } catch {
      // ignore
    }
  }

  const handleRemove = async (userId) => {
    if (!window.confirm('Remove this member from the project?')) return
    try {
      const res = await authFetch(`/projects/${id}/members/${userId}`, { method: 'DELETE' })
      if (res.ok) loadMembers()
    } catch {
      // ignore
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${project.projectTitle}"? This cannot be undone.`)) return
    try {
      const res = await authFetch(`/projects/${id}`, { method: 'DELETE' })
      if (res.ok) navigate('/projects')
    } catch {
      // ignore
    }
  }

  if (forbidden) return <Navigate to="/access-denied" replace />
  if (loading)   return <div className="page"><p style={{color:'var(--muted)'}}>Loading project…</p></div>
  if (!project)   return <div className="page"><p style={{color:'var(--muted)'}}>Project not found.</p></div>

  const role = project.yourRole || 'viewer'

  return (
    <div className="page">
      <button className="btn-back" onClick={() => navigate('/projects')}>
        <ArrowLeft size={16} /> Back to Projects
      </button>

      {/* Main card */}
      <div className="detail-card">
        <div className="detail-header">
          <div>
            <div className="detail-client">{project.clientName}</div>
            <h2 className="detail-title">{project.projectTitle}</h2>
          </div>
          <div className="detail-badges">
            <span className={`badge ${project.isCompleted ? 'completed' : 'active'}`}>
              {project.isCompleted ? 'Completed' : 'Active'}
            </span>
            <span className={`role-badge role-${role}`}>
              <Shield size={12} /> {role.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="detail-meta-grid">
          <div className="d-meta-item">
            <DollarSign className="d-meta-icon" size={24} />
            <div>
              <div className="d-meta-label">Budget</div>
              <div className="d-meta-val">${(project.budget || 0).toLocaleString()}</div>
            </div>
          </div>
          <div className="d-meta-item">
            <Activity className="d-meta-icon" size={24} />
            <div>
              <div className="d-meta-label">Deadline</div>
              <div className="d-meta-val">
                {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'None'}
              </div>
            </div>
          </div>
          <div className="d-meta-item">
            <User className="d-meta-icon" size={24} />
            <div>
              <div className="d-meta-label">Your Role</div>
              <div className="d-meta-val capitalize">{role}</div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="detail-actions">
          {perm.canEditProject && (
            <button className="btn-secondary" onClick={() => navigate('/projects')}>
              <Edit3 size={15} /> Edit in Projects list
            </button>
          )}
          {perm.canDeleteProject && (
            <button className="btn-danger" onClick={handleDelete}>
              <Trash2 size={15} /> Delete Project
            </button>
          )}
        </div>
      </div>

      {/* Team / Members card */}
      <div className="team-card">
        <div className="team-header">
          <div className="team-header-left">
            <Users size={20} />
            <h3>Project Team</h3>
            <span className="member-count">{members.length}</span>
          </div>
        </div>

        {/* Invite form — admin only */}
        {perm.canManageMembers && (
          <div className="invite-box">
            <h4>Add Team Member</h4>
            {inviteError && <div className="invite-error">{inviteError}</div>}
            <div className="invite-row">
              <div className="invite-input-wrap">
                <Mail size={15} className="mail-icon" />
                <input
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleInvite()}
                />
              </div>
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button className="btn-primary" onClick={handleInvite} disabled={inviteLoading}>
                <Plus size={16} /> {inviteLoading ? 'Adding…' : 'Add'}
              </button>
            </div>
          </div>
        )}

        {/* Member list */}
        <div className="member-list">
          {members.map(m => {
            const isOwner = String(m.userId) === String(project.userId)
            return (
              <div className="member-item" key={m.userId}>
                <div className="m-left">
                  <div className="m-avatar">{m.name?.[0]?.toUpperCase() || 'U'}</div>
                  <div>
                    <div className="m-name">
                      {m.name} {isOwner && <span className="owner-tag">Owner</span>}
                    </div>
                    <div className="m-email">{m.email}</div>
                  </div>
                </div>

                <div className="m-right">
                  {/* Role picker or static badge */}
                  {perm.canManageMembers && !isOwner ? (
                    <select
                      className="role-select"
                      value={m.role}
                      onChange={e => handleRoleChange(m.userId, e.target.value)}
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  ) : (
                    <span className={`role-pill role-${m.role}`}>{m.role}</span>
                  )}

                  {/* Remove button */}
                  {perm.canManageMembers && !isOwner && (
                    <button
                      className="btn-icon danger"
                      title="Remove member"
                      onClick={() => handleRemove(m.userId)}
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
