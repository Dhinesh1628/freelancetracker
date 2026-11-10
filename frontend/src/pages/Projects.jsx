import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Projects.css'

const EMPTY = { clientName: '', projectTitle: '', budget: '', deadline: '', isCompleted: false }

export default function Projects() {
  const { authFetch } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)
  const [form, setForm]         = useState(EMPTY)
  const [editId, setEditId]     = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError]       = useState('')
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('all')

  const load = useCallback(() => {
    let isMounted = true
    authFetch('/projects')
      .then(r => r.json())
      .then(d => {
        if (isMounted) setProjects(Array.isArray(d) ? d : [])
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [authFetch])

  useEffect(() => {
    const cleanup = load()
    return cleanup
  }, [load])

  const openAdd = () => { setForm(EMPTY); setEditId(null); setError(''); setShowForm(true) }
  const openEdit = (p) => {
    setForm({
      clientName: p.clientName,
      projectTitle: p.projectTitle,
      budget: p.budget,
      deadline: p.deadline?.slice(0, 10) || '',
      isCompleted: p.isCompleted
    })
    setEditId(p._id); setError(''); setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditId(null); setForm(EMPTY) }

  const handleSave = async () => {
    if (!form.clientName.trim() || !form.projectTitle.trim()) { setError('Client name and project title are required.'); return }
    setError('')
    try {
      const res = await authFetch(editId ? `/projects/${editId}` : '/projects', {
        method: editId ? 'PUT' : 'POST',
        body: JSON.stringify({
          clientName: form.clientName,
          projectTitle: form.projectTitle,
          budget: Number(form.budget) || 0,
          deadline: form.deadline || null,
          isCompleted: form.isCompleted
        })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to save project.'); return }
      closeForm()
      load()
    } catch { setError('Server error occurred.') }
  }

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return
    try {
      const res = await authFetch(`/projects/${id}`, { method: 'DELETE' })
      if (res.ok) load()
    } catch {
      // ignore
    }
  }

  const toggleComplete = async (p) => {
    try {
      const res = await authFetch(`/projects/${p._id}`, {
        method: 'PUT',
        body: JSON.stringify({ isCompleted: !p.isCompleted })
      })
      if (res.ok) load()
    } catch {
      // ignore
    }
  }

  const filtered = projects.filter(p => {
    const matchSearch =
      p.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      p.projectTitle?.toLowerCase().includes(search.toLowerCase()) ||
      p._id?.toLowerCase().includes(search.toLowerCase())
    if (!matchSearch) return false
    if (filter === 'active')    return !p.isCompleted
    if (filter === 'completed') return p.isCompleted
    return true
  })

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Projects</h2>
          <p className="page-sub">Manage and track all your client engagements</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={18} /> New Project
        </button>
      </div>

      {/* Search & Filters */}
      <div className="toolbar">
        <div className="search-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by client, project, or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {['all', 'active', 'completed'].map(f => (
            <button
              key={f}
              className={`tab-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Table / List */}
      {loading ? (
        <div className="loading-state">Loading projects…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>{search || filter !== 'all' ? 'No projects match your filter.' : 'No projects yet. Create your first one!'}</p>
        </div>
      ) : (
        <div className="table-card">
          <table className="projects-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Client</th>
                <th>Project Title</th>
                <th>Budget</th>
                <th>Deadline</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p._id} onClick={() => navigate(`/projects/${p._id}`)} className="clickable-row">
                  <td onClick={e => { e.stopPropagation(); toggleComplete(p) }}>
                    <span className={`status-dot ${p.isCompleted ? 'done' : 'pending'}`} title={p.isCompleted ? 'Mark Active' : 'Mark Completed'} />
                  </td>
                  <td className="td-client">{p.clientName}</td>
                  <td className="td-title">{p.projectTitle}</td>
                  <td className="td-budget">${(p.budget || 0).toLocaleString()}</td>
                  <td className="td-deadline">{p.deadline ? new Date(p.deadline).toLocaleDateString() : '—'}</td>
                  <td><span className={`role-pill role-${p.yourRole || 'admin'}`}>{p.yourRole || 'admin'}</span></td>
                  <td className="td-actions" onClick={e => e.stopPropagation()}>
                    <button className="btn-table-edit" onClick={() => openEdit(p)}>Edit</button>
                    {p.yourRole === 'admin' && (
                      <button className="btn-table-del" onClick={() => handleDelete(p._id, p.projectTitle)}>Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={closeForm}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Edit Project' : 'New Project'}</h3>
              <button className="btn-close" onClick={closeForm}>✕</button>
            </div>
            {error && <div className="form-error">{error}</div>}
            <div className="modal-body">
              <div className="field">
                <label>Client Name *</label>
                <input
                  type="text"
                  placeholder="Acme Corp"
                  value={form.clientName}
                  onChange={e => setForm({ ...form, clientName: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Project Title *</label>
                <input
                  type="text"
                  placeholder="Website Redesign"
                  value={form.projectTitle}
                  onChange={e => setForm({ ...form, projectTitle: e.target.value })}
                />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Budget ($)</label>
                  <input
                    type="number"
                    placeholder="5000"
                    value={form.budget}
                    onChange={e => setForm({ ...form, budget: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Deadline</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={e => setForm({ ...form, deadline: e.target.value })}
                  />
                </div>
              </div>
              {editId && (
                <div className="checkbox-field">
                  <label>
                    <input
                      type="checkbox"
                      checked={form.isCompleted}
                      onChange={e => setForm({ ...form, isCompleted: e.target.checked })}
                    />
                    Mark as Completed
                  </label>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeForm}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}>
                {editId ? 'Save Changes' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
