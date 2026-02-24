import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { campService } from '../../services/camp.service'
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Search,
  Building2
} from 'lucide-react'
import toast from 'react-hot-toast'
import '../../styles/camps.css'

function DonationCamps() {
  const { isAuthenticated, user } = useAuth()
  const [camps, setCamps] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    city: '',
    status: ''
  })

  useEffect(() => {
    fetchCamps()
  }, [filters])

  const fetchCamps = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filters.city) params.city = filters.city
      if (filters.status) params.status = filters.status

      const data = await campService.getCamps(params)
      setCamps(data.camps)
    } catch (error) {
      console.error('Failed to fetch camps:', error)
      toast.error('Failed to load donation camps')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (campId) => {
    if (!isAuthenticated) {
      toast.error('Please login to register for camps')
      return
    }

    try {
      await campService.registerForCamp(campId)
      toast.success('Successfully registered for the camp!')
      fetchCamps() // Refresh the list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register for camp')
    }
  }

  const getStatusBadge = (status) => {
    const statusClasses = {
      scheduled: 'badge-scheduled',
      ongoing: 'badge-ongoing',
      completed: 'badge-completed',
      cancelled: 'badge-cancelled'
    }
    return statusClasses[status] || 'badge-scheduled'
  }

  if (loading) {
    return (
      <div className="camps-loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="camps-page">
      <div className="container">
        {/* Header with Filters */}
        <div className="camps-header">
          <div className="camps-header-left">
            <h1 className="camps-title">
              Donation Camps
            </h1>
            <p className="camps-subtitle">
            Join our community blood donation camps. Your participation can help save lives and strengthen our community.            </p>
          </div>
          
          <div className="camps-header-right">
            <div className="camps-search-wrapper">
              <Search className="camps-search-icon" size={18} />
              <input
                type="text"
                placeholder="Search city..."
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                className="camps-search-input"
              />
              {filters.city && (
                <button
                  onClick={() => setFilters({ ...filters, city: '' })}
                  className="camps-search-clear"
                  type="button"
                >
                  ×
                </button>
              )}
            </div>
            
            <div className="camps-filter-wrapper">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="camps-status-select"
              >
                <option value="">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Camps Grid */}
        {camps.length === 0 ? (
          <div className="camps-empty">
            <Calendar className="camps-empty-icon" />
            <h3 className="camps-empty-title">
              No camps found
            </h3>
            <p className="camps-empty-description">
              We couldn't find any donation camps matching your criteria. Try adjusting your filters.
            </p>
            <button 
              onClick={() => setFilters({ city: '', status: '' })}
              className="camps-action-btn camps-btn-outline"
              style={{ marginTop: '1rem', maxWidth: '200px' }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="camps-grid">
            {camps.map((camp, index) => {
               const percentage = camp.maxDonors > 0 
                  ? Math.min(100, Math.round(((camp.registeredDonors?.length || 0) / camp.maxDonors) * 100))
                  : 0;
               
               return (
                <div 
                  key={camp._id} 
                  className="camps-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="camps-card-content">
                    <div className="camps-card-header">
                      <h3 className="camps-card-title">
                        {camp.title}
                      </h3>
                      <span className={`camps-status-badge ${getStatusBadge(camp.status)}`}>
                        {camp.status}
                      </span>
                    </div>

                    <p className="camps-card-description">
                      {camp.description}
                    </p>

                    <div className="camps-card-details">
                      <div className="camps-detail-item">
                        <Calendar className="camps-detail-icon" />
                        <span className="camps-detail-text">
                          {camp.startDate 
                            ? new Date(camp.startDate).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                            : 'TBD'
                          }
                        </span>
                      </div>

                      <div className="camps-detail-item">
                        <Clock className="camps-detail-icon" />
                        <span className="camps-detail-text">
                          {camp.startTime} - {camp.endTime}
                        </span>
                      </div>

                      <div className="camps-detail-item">
                        <MapPin className="camps-detail-icon" />
                        <span className="camps-detail-text">
                          {camp.location?.city}, {camp.location?.state}
                        </span>
                      </div>
                    </div>
                    
                    <div className="camps-progress-container">
                      <div className="camps-progress-labels">
                        <span>Donors Registered</span>
                        <strong>{camp.registeredDonors?.length || 0} / {camp.maxDonors}</strong>
                      </div>
                      <div className="camps-progress-bar">
                        <div 
                          className="camps-progress-fill" 
                          style={{ width: `${percentage}%`, backgroundColor: percentage >= 100 ? 'var(--green-500)' : 'var(--primary-600)' }}
                        ></div>
                      </div>
                    </div>

                    <div className="camps-card-footer">
                      <div className="camps-organizer">
                        <Building2 size={16} />
                        <span>By {camp.organizer?.name || 'Organizer'}</span>
                      </div>

                      <div className="camps-actions">
                        <Link
                          to={`/camps/${camp._id}`}
                          className="camps-action-btn camps-btn-outline"
                        >
                          View
                        </Link>

                        {camp.status === 'scheduled' && camp.isRegistrationOpen && isAuthenticated && user?.roles?.includes('donor') ? (
                          <button
                            onClick={() => handleRegister(camp._id)}
                            className="camps-action-btn camps-btn-primary"
                          >
                            Register Now
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default DonationCamps
