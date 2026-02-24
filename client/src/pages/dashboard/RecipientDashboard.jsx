import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import RequestsList from '../../components/RequestsList'
import './RecipientDashboard.css'

function RecipientDashboard({ user }) {
  return (
    <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <div className="card h-fit">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Recipient Actions</h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                  <Link
                    to="/dashboard/requests/create"
                    className="recipient-action-card"
                  >
                    <div className="recipient-action-icon red">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div className="recipient-action-info">
                      <h3>Create Blood Request</h3>
                      <p>Submit a new blood request</p>
                    </div>
                  </Link>
                  
                  <Link
                    to="/dashboard/my-requests"
                    className="recipient-action-card"
                  >
                    <div className="recipient-action-icon blue">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
                    </div>
                    <div className="recipient-action-info">
                      <h3>My Requests</h3>
                      <p>View and manage your requests</p>
                    </div>
                  </Link>
              </div>
            </div>
          </div>

          {/* Blood Requests List */}
          <div className="card h-fit w-full">
            <div className="requests-container">
               <RequestsList 
                  limit={5} 
                  showHeader={true} 
                  showFilters={false} 
                  showViewAll={true}
                  showCreateButton={false}
                  role="recipient"
               />
            </div>
          </div>
        </div>
    </div>
  )
}

export default RecipientDashboard
