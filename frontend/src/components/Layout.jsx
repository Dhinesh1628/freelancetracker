import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, User, Briefcase, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Layout.css'

const nav = [
  { to: '/',         label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects',  icon: FolderKanban },
  { to: '/profile',  label: 'Profile',   icon: User },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon"><Briefcase size={18} strokeWidth={2.25} /></div>
          <div className="brand-text">
            <span className="brand-name">FreelanceTracker</span>
            <span className="brand-tag">Project hub</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {nav.map(n => {
            const Icon = n.icon
            return (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon"><Icon size={18} strokeWidth={2} /></span>
                {n.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="s-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
            <div className="s-info">
              <div className="s-name">{user?.name || 'User'}</div>
              <div className="s-email">{user?.email || ''}</div>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={15} strokeWidth={2} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="page-area">
        <Outlet />
      </main>
    </div>
  )
}
