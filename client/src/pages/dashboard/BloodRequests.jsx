import { useSearchParams } from 'react-router-dom'
import { Activity } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import RequestsList from '../../components/RequestsList'
import '../../styles/dashboard.css'
import './BloodRequests.css'

function BloodRequests({ role }) {
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  
  // Determine role from Prop, URL or fallback
  const getRole = () => {
    if (role) return role;
    const paramRole = searchParams.get('role');
    if (paramRole && user?.roles?.includes(paramRole)) return paramRole;
    if (user?.roles?.includes('donor')) return 'donor';
    return 'recipient';
  }
  
  const currentRole = getRole();

  return (
    <div className="dashboard-page">
      <div className="container animate-fade-in">
        <div className="requests-page-card">
          <div className="page-header-container">
            <div className="page-header-icon animate-slide-up">
              <Activity size={32} />
            </div>
            <div>
              <h1 className="page-title">
                {currentRole === 'recipient' ? 'My Requests' : 'Blood Requests'}
              </h1>
              <p className="page-description">
                {currentRole === 'recipient' 
                  ? 'Manage your blood creation requests' 
                  : 'Browse and respond to blood donation requests'}
              </p>
            </div>
          </div>
          
          <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <RequestsList 
              showHeader={false} 
              showFilters={true} 
              role={currentRole}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default BloodRequests
