import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import '../../styles/dashboard.css'
import DonorDashboard from './DonorDashboard'
import RecipientDashboard from './RecipientDashboard'
import { Check, Heart, User } from 'lucide-react'
import { authService } from '../../services/auth.service'
import toast from 'react-hot-toast'

function Dashboard() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Determine initial view based on roles and query param
  // Determine active view based on roles and query param
  const hasRole = (role) => user?.roles && user.roles.includes(role)
  
  const getActiveRole = () => {
    const requestedRole = searchParams.get('role')
    if (requestedRole && hasRole(requestedRole)) return requestedRole;
    
    // Default priority
    if (hasRole('donor')) return 'donor';
    if (hasRole('recipient')) return 'recipient';
    return 'donor'; // Fallback
  }

  const currentRole = getActiveRole();

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Header */}
        {/* Header */}
        <div className="dashboard-header-container">
           <div className="dashboard-welcome">
             <h1>
               {getGreeting()}, <span className="highlight">{user?.name}</span>!
             </h1>
             <p>
               Welcome to your EDUDONOR dashboard 
             </p>
           </div>
           
           {/* Role Switcher */}
           {hasRole('donor') && hasRole('recipient') && (
               <div className="dashboard-tabs">
                   <button 
                    onClick={() => setSearchParams({ role: 'donor' })}
                    className={`tab-btn ${currentRole === 'donor' ? 'active' : ''}`}
                   >
                       Donor View
                   </button>
                   <button 
                    onClick={() => setSearchParams({ role: 'recipient' })}
                    className={`tab-btn ${currentRole === 'recipient' ? 'active' : ''}`}
                   >
                       Recipient View
                   </button>
               </div>
           )}
           
           {/* Single Role Badge (if not switcher) */}
            {!(hasRole('donor') && hasRole('recipient')) && (
               <div className="flex flex-wrap items-center gap-4 border-t border-gray-100 pt-4">
                   <span className="role-badge">
                       {currentRole === 'donor' ? 'Donor Portal' : 'Recipient Portal'}
                   </span>
                   
                   {!hasRole('recipient') && (
                       <button
                           onClick={async () => {
                               if(!confirm('Do you want to become a Recipient? This will allow you to request blood.')) return;
                               try {
                                   await authService.addRole('recipient');
                                   toast.success('You are now a Recipient! Reloading...');
                                   window.location.reload();
                               } catch (error) {
                                   toast.error('Failed to add role');
                               }
                           }}
                           className="px-4 py-2 rounded-lg text-sm font-semibold border border-blue-600 text-blue-600 hover:bg-blue-50 transition-all flex items-center gap-2 shadow-sm ml-auto"
                       >
                           <User size={16} />
                           Become a Recipient
                       </button>
                   )}

                   {!hasRole('donor') && (
                       <button
                           onClick={async () => {
                               if(!confirm('Do you want to become a Donor? This will allow you to access the donor portal.')) return;
                               try {
                                   await authService.addRole('donor');
                                   toast.success('You are now a Donor! Reloading...');
                                   window.location.reload();
                               } catch (error) {
                                   toast.error('Failed to add role');
                               }
                           }}
                           className="px-4 py-2 rounded-lg text-sm font-semibold border border-red-600 text-red-600 hover:bg-red-50 transition-all flex items-center gap-2 shadow-sm ml-auto"
                       >
                           <Heart size={16} />
                           Become a Donor
                       </button>
                   )}
               </div>
           )}
        </div>

        {currentRole === 'donor' ? <DonorDashboard user={user} /> : <RecipientDashboard user={user} />}
      </div>
    </div>
  )
}

export default Dashboard
