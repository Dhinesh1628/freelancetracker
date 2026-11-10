import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Briefcase, FolderGit2, CheckCircle2, DollarSign, Plus, ArrowRight, LayoutDashboard } from 'lucide-react'
import './Dashboard.css'

export default function Dashboard() {
  const { user, authFetch } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
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

  const total     = projects.length
  const active    = projects.filter(p => !p.isCompleted).length
  const completed = projects.filter(p => p.isCompleted).length
  const budget    = projects.reduce((s, p) => s + (p.budget || 0), 0)
  const recent    = [...projects].slice(0, 5)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Welcome back, {user?.name?.split(' ')[0] || 'there'}</h2>
          <p className="page-sub">Here's what's happening with your projects today.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/projects')}>
          <Plus size={18} /> New Project
        </button>
      </div>

      <div className="stat-grid">
        <div className="stat-card c-purple">
          <Briefcase className="stat-card-icon" size={48} color="#d946ef" />
          <div className="stat-label">Total Projects</div>
          <div className="stat-val">{loading ? '—' : total}</div>
        </div>
        <div className="stat-card c-cyan">
          <FolderGit2 className="stat-card-icon" size={48} color="#06b6d4" />
          <div className="stat-label">Active</div>
          <div className="stat-val">{loading ? '—' : active}</div>
        </div>
        <div className="stat-card c-green">
          <CheckCircle2 className="stat-card-icon" size={48} color="#10b981" />
          <div className="stat-label">Completed</div>
          <div className="stat-val">{loading ? '—' : completed}</div>
        </div>
        <div className="stat-card c-amber">
          <DollarSign className="stat-card-icon" size={48} color="#f59e0b" />
          <div className="stat-label">Total Budget</div>
          <div className="stat-val">{loading ? '—' : `$${budget.toLocaleString()}`}</div>
        </div>
      </div>

      <div className="dash-section">
        <div className="section-header">
          <h3>Recent Projects</h3>
          <button className="btn-link" onClick={() => navigate('/projects')}>View all <ArrowRight size={14}/></button>
        </div>
        {loading ? (
          <div className="loading-state">Loading…</div>
        ) : recent.length === 0 ? (
          <div className="empty-state">
            <LayoutDashboard className="empty-icon" size={48} />
            <p>No projects yet. <button className="btn-link" onClick={() => navigate('/projects')}>Create one <ArrowRight size={14}/></button></p>
          </div>
        ) : (
          <div className="recent-list">
            {recent.map(p => (
              <div className="recent-item" key={p._id}>
                <div className="recent-left">
                  <div className="r-init">{p.clientName?.[0]?.toUpperCase() || 'P'}</div>
                  <div>
                    <div className="r-title">{p.projectTitle}</div>
                    <div className="r-client">{p.clientName}</div>
                  </div>
                </div>
                <div className="recent-right">
                  <span className="r-budget">${(p.budget || 0).toLocaleString()}</span>
                  <span className={`badge ${p.isCompleted ? 'completed' : 'active'}`}>
                    {p.isCompleted ? 'Completed' : 'Active'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
