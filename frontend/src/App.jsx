import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useAuth } from './context/AuthContext'
import Login         from './pages/Login'
import Signup        from './pages/Signup'
import Dashboard      from './pages/Dashboard'
import Projects       from './pages/Projects'
import ProjectDetail  from './pages/ProjectDetail'
import Profile        from './pages/Profile'
import AccessDenied   from './pages/AccessDenied'
import Layout          from './components/Layout'

function Private({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar
        theme="dark"
        toastStyle={{
          background: 'var(--surface)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow)',
          fontSize: '14px',
        }}
      />
      <Routes>
        <Route path="/login"          element={<Login />} />
        <Route path="/signup"         element={<Signup />} />
        <Route path="/access-denied"  element={<Private><AccessDenied /></Private>} />

        <Route path="/" element={<Private><Layout /></Private>}>
          <Route index               element={<Dashboard />} />
          <Route path="projects"     element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="profile"      element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
