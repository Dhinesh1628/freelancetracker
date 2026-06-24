import { useNavigate } from 'react-router-dom'
import { ShieldX, ArrowLeft } from 'lucide-react'
import './AccessDenied.css'

export default function AccessDenied() {
  const navigate = useNavigate()
  return (
    <div className="denied-bg">
      <div className="denied-card">
        <div className="denied-icon"><ShieldX size={40} strokeWidth={1.5} /></div>
        <h1>Access Denied</h1>
        <p>You don't have permission to view this page or project.</p>
        <button className="btn-primary" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>
    </div>
  )
}
