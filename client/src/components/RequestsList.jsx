import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { donorService } from '../services/donor.service'
import { recipientService } from '../services/recipient.service'
import {
  Heart,
  Plus,
  MapPin,
  Clock,
  User,
  Users,
  Phone,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

import '../styles/dashboard.css'

function RequestsList({ limit = null, showFilters = true, showHeader = true, showViewAll = false, showCreateButton = true, role }) {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    bloodGroup: '',
    urgency: '',
    city: ''
  })
  
  // Determine active mode if not passed
  const activeRole = role || (user?.roles?.includes('donor') ? 'donor' : 'recipient');

  // Create cancel request handler
  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this request? This action cannot be undone.')) {
      return
    }

    try {
      await recipientService.cancelRequest(requestId)
      toast.success('Request cancelled successfully')
      // Refresh requests list
      fetchRequests()
    } catch (error) {
      console.error('Error cancelling request:', error)
      toast.error(error.response?.data?.message || 'Failed to cancel request')
    }
  }
  const [profileIncomplete, setProfileIncomplete] = useState(false)
  const [totalRequests, setTotalRequests] = useState(0)

  useEffect(() => {
    fetchRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, limit, activeRole])

  const fetchRequests = async () => {
    setLoading(true)
    const params = {}
    if (filters.bloodGroup) params.bloodGroup = filters.bloodGroup
    if (filters.urgency) params.urgency = filters.urgency
    if (filters.city) params.city = filters.city
    if (limit) params.limit = limit

    try {
      let data
      let total = 0
      if (activeRole === 'donor') {
        const response = await donorService.getRequests(params)
        data = response.requests
        total = response.pagination?.total || 0
      } else {
        const response = await recipientService.getMyRequests(params)
        data = response.requests
        total = response.pagination?.total || 0
      }
      setRequests(data || [])
      setTotalRequests(total)
      setProfileIncomplete(false)
    } catch (error) {
      console.error('Failed to fetch requests:', error)
      // Check if it's a 404 error for donor profile
      if (activeRole === 'donor' && error.response?.status === 404) {
        setProfileIncomplete(true)
      }
      setRequests([])
      if (!(activeRole === 'donor' && error.response?.status === 404)) {
        toast.error('Failed to load blood requests')
      }
    } finally {
      setLoading(false)
    }
  }



  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="requests-list">
      {showHeader && (
        <div className="requests-header">
          <div className="requests-title">
            <h2>Blood Requests</h2>
            <p>
              {activeRole === 'donor'
                ? 'View and respond to blood requests matching your profile'
                : 'Manage your blood creation requests and track their status'
              }
            </p>
          </div>

          <div className="flex items-center gap-3">
            {showViewAll && (
              <Link
                to={activeRole === 'recipient' ? '/dashboard/my-requests' : '/dashboard/available-requests'}
                className="btn btn-secondary view-all-btn"
              >
                View All ({totalRequests})
              </Link>
            )}
            {activeRole === 'recipient' && showCreateButton && (
              <Link
                to="/dashboard/requests/create"
                className="btn btn-primary create-req-btn"
              >
                <Plus size={20} />
                <span>Create Request</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="requests-filters-card">
          <div className="requests-filters-grid">
            <div className="filter-group">
              <label className="filter-label">Blood Group</label>
              <div className="filter-input-wrapper">
                <select
                  value={filters.bloodGroup}
                  onChange={(e) => setFilters({ ...filters, bloodGroup: e.target.value })}
                  className="filter-select"
                >
                  <option value="">All Blood Groups</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">Urgency</label>
              <div className="filter-input-wrapper">
                <select
                  value={filters.urgency}
                  onChange={(e) => setFilters({ ...filters, urgency: e.target.value })}
                  className="filter-select"
                >
                  <option value="">All Urgency Levels</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">City</label>
              <div className="filter-input-wrapper">
                <input
                  type="text"
                  placeholder="Search by city..."
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  className="filter-input"
                />
              </div>
            </div>

            <div className="filter-group" style={{ justifyContent: 'flex-end' }}>
              <button
                onClick={() => setFilters({ bloodGroup: '', urgency: '', city: '' })}
                className="filter-clear-btn"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Requests List */}
      {profileIncomplete && activeRole === 'donor' ? (
        <div className="profile-incomplete-card">
          <div className="empty-state-icon">
             <AlertCircle size={48} />
          </div>
          <h3 className="empty-title">
            Complete Your Donor Profile
          </h3>
          <p className="empty-description">
            You need to complete your donor profile before you can view blood requests.
            Please provide your blood group, medical information, and location details.
          </p>
          <Link
            to="/dashboard/profile"
            className="btn btn-primary"
          >
            Complete Profile Now
          </Link>
        </div>
      ) : requests.length === 0 ? (
        <div className="no-requests-card">
          <div className="empty-state-icon-bg">
            <Heart />
          </div>
          <h3 className="empty-title">
            No requests found
          </h3>
          <p className="empty-description">
            {activeRole === 'donor'
              ? 'No blood requests match your current filters'
              : 'You haven\'t created any blood requests yet'
            }
          </p>
          {activeRole === 'recipient' && (
            <Link
              to="/dashboard/requests/create"
              className="btn btn-primary create-req-btn"
              style={{ display: 'inline-flex', margin: '0 auto' }}
            >
              <Plus size={18} />
              Create Your First Request
            </Link>
          )}
        </div>
      ) : (
        <div className="requests-grid">
          {requests.map((request) => (
            <div key={request._id} className="request-card">
              
              <div className="request-content-wrapper">
                <div className="request-main-info">
                  <div className="request-header-row">
                    <div>
                      <h3 className="request-patient-name">
                        {request.patientName}
                      </h3>
                      <div className="request-meta-row">
                        <span className="blood-group-badge">
                          {request.bloodGroup}
                        </span>
                        <span className="meta-separator">•</span>
                        <span>
                          {request.unitsRequired} unit{request.unitsRequired > 1 ? 's' : ''} required
                        </span>
                        <span className="meta-separator">•</span>
                        <span className="hospital-name">
                          {request.hospitalName}
                        </span>
                      </div>
                    </div>
                    
                    <div className="status-badges">
                      <span className={`status-check urgency-${request.urgency}`}>
                        {request.urgency}
                      </span>
                      <span className={`status-check status-${request.status}`}>
                        {request.status}
                      </span>
                    </div>
                  </div>

                  <div className="request-details-grid">
                    <div className="detail-item">
                      <div className="detail-icon"><MapPin size={18} /></div>
                      <div className="detail-text">
                        <h4>Location</h4>
                        <p>{request.hospitalAddress}, {request.city}</p>
                      </div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-icon"><Clock size={18} /></div>
                      <div className="detail-text">
                        <h4>Required By</h4>
                        <p>{new Date(request.requiredDate).toLocaleDateString(undefined, {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long', 
                            day: 'numeric'
                          })}</p>
                      </div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-icon"><User size={18} /></div>
                      <div className="detail-text">
                        <h4>Contact Person</h4>
                        <p>{request.contactPerson.name}</p>
                      </div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-icon"><Phone size={18} /></div>
                      <div className="detail-text">
                        <h4>Phone</h4>
                        <p>{request.contactPerson.phone}</p>
                      </div>
                    </div>
                  </div>

                  {request.description && (
                    <div className="request-description">
                      <p className="description-text">
                        <span className="description-label">Additional Details:</span>
                        {request.description}
                      </p>
                    </div>
                  )}

                  {activeRole === 'recipient' && request.matchedDonors && request.matchedDonors.length > 0 && (
                    <div className="matched-donors-section">
                      <h4 className="matched-donors-title">
                        <Users size={16} />
                        Matched Donors ({request.matchedDonors.length})
                      </h4>
                      <div className="matched-donors-grid">
                        {request.matchedDonors.map((match, index) => (
                          <div
                            key={index}
                            className={`donor-card status-${match.status}`}
                          >
                            <div className="donor-header">
                              <span className="donor-name">
                                {match.donor?.user?.name || 'Anonymous Donor'}
                              </span>
                              <span className={`donor-status status-${match.status === 'accepted' ? 'completed' : match.status === 'declined' ? 'cancelled' : 'pending'}`}>
                                {match.status}
                              </span>
                            </div>
                            
                            {match.status === 'accepted' && match.donor?.user && (
                              <div className="donor-details">
                                {match.donor.user.phone && (
                                  <a href={`tel:${match.donor.user.phone}`} className="donor-contact">
                                    <Phone size={14} />
                                    {match.donor.user.phone}
                                  </a>
                                )}
                                {match.donor.bloodGroup && (
                                  <div className="donor-contact" style={{ color: 'var(--error-600)' }}>
                                    <Heart size={14} />
                                    Blood Group: {match.donor.bloodGroup}
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="donor-meta">
                              <span>Response time</span>
                              <span>{new Date(match.responseAt || match.matchedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="request-actions">
                  <Link
                    to={`/dashboard/requests/${request._id}?role=${activeRole}`}
                    className="action-btn btn-view"
                  >
                    View Details
                  </Link>

                  {activeRole === 'donor' && request.status === 'pending' && (
                    <Link 
                      to={`/dashboard/requests/${request._id}?role=${activeRole}`}
                      className="action-btn btn-respond"
                    >
                      Respond
                    </Link>
                  )}

                  {activeRole === 'recipient' && request.status === 'pending' && (
                    <>
                      <Link
                        to={`/dashboard/requests/edit/${request._id}`}
                        className="action-btn btn-edit"
                      >
                        Edit
                      </Link>
                      <button 
                        onClick={() => handleCancelRequest(request._id)}
                        className="action-btn btn-cancel"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RequestsList
