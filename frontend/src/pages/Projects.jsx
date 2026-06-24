import { useEffect, useState } from 'react'
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

  const load = () => {
    setLoading(true)
    authFetch('/projects')
      .then(r => r.json())
      .then(d => setProjects(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

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
        body: JSON.stringify({ ...form, budget: parseFloat(form.budget) || 0 })
      })
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed to save.'); return }
      closeForm(); load()
    } catch { setError('Server error.') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return
    await authFetch(`/projects/${id}`, { method: 'DELETE' })
    load()
  }

  const fmtDate = (d) => {
    if (!d) return '—'
    const [y, m, day] = d.slice(0, 10).split('-')
    return `${parseInt(m)}/${parseInt(day)}/${y}`
  }

  const filtered = projects.filter(p => {
    if (filter === 'active' && p.isCompleted) return false
    if (filter === 'completed' && !p.isCompleted) return false
    const q = search.toLowerCase()
    return p.clientName?.toLowerCase().includes(q) || p.projectTitle?.toLowerCase().includes(q)
  })

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Projects</h2>
          <p className="page-sub">{projects.length} total project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><Plus size={18} /> New Project</button>
      </div>

      {/* MODAL */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Edit Project' : 'New Project'}</h3>
              <button className="modal-close" onClick={closeForm}>✕</button>
            </div>
            {error && <div className="form-error">{error}</div>}
            <div className="modal-fields">
              <div className="field">
                <label>Client Name</label>
                <input type="text" placeholder="e.g. Acme Corp" value={form.clientName}
                  onChange={e => setForm({ ...form, clientName: e.target.value })} />
              </div>
              <div className="field">
                <label>Project Title</label>
                <input type="text" placeholder="e.g. Website Redesign" value={form.projectTitle}
                  onChange={e => setForm({ ...form, projectTitle: e.target.value })} />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Budget ($)</label>
                  <input type="number" placeholder="5000" min="0" value={form.budget}
                    onChange={e => setForm({ ...form, budget: e.target.value })} />
                </div>
                <div className="field">
                  <label>Deadline</label>
                  <input type="date" value={form.deadline}
                    onChange={e => setForm({ ...form, deadline: e.target.value })} />
                </div>
              </div>
              <div className="field">
                <label>Status</label>
                <select value={form.isCompleted ? 'completed' : 'active'}
                  onChange={e => setForm({ ...form, isCompleted: e.target.value === 'completed' })}>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={closeForm}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}>{editId ? 'Save Changes' : 'Add Project'}</button>
            </div>
          </div>
        </div>
      )}

      {/* TOOLBAR */}
      <div className="proj-toolbar">
        <div className="search-wrap">
          <Search size={15} strokeWidth={2.25} />
          <input type="text" placeholder="Search client or project…" value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-tabs">
          {['all', 'active', 'completed'].map(f => (
            <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE */}
      <div className="proj-table-wrap">
        <table className="proj-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Project Title</th>
              <th>Budget</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="td-center">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="6" className="td-center">No projects found.</td></tr>
            ) : filtered.map(p => (
              <tr key={p._id} className="clickable-row" onClick={() => navigate(`/projects/${p._id}`)}>
                <td>
                  <div className="client-cell">
                    <span className="c-init">{p.clientName?.[0]?.toUpperCase()}</span>
                    {p.clientName}
                  </div>
                </td>
                <td className="title-cell">{p.projectTitle}</td>
                <td className="budget-cell">${(p.budget || 0).toLocaleString()}</td>
                <td className="muted-cell">{fmtDate(p.deadline)}</td>
                <td><span className={`badge ${p.isCompleted ? 'completed' : 'active'}`}>{p.isCompleted ? 'Completed' : 'Active'}</span></td>
                <td onClick={e => e.stopPropagation()}>
                  <div className="row-actions">
                    {(p.yourRole === 'admin' || p.yourRole === 'member') && (
                      <button className="act-btn edit" onClick={() => openEdit(p)}>Edit</button>
                    )}
                    {p.yourRole === 'admin' && (
                      <button className="act-btn del" onClick={() => handleDelete(p._id)}>Delete</button>
                    )}
                    {p.yourRole === 'viewer' && (
                      <span className="role-tag">View only</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
