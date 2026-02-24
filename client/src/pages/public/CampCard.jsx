import { memo } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Clock, Building2, CheckCircle } from 'lucide-react'

const CampCard = memo(({ camp, index, onRegister, isAuthenticated, userRoles }) => {
  const percentage = camp.maxDonors > 0 
    ? Math.min(100, Math.round(((camp.registeredDonors?.length || 0) / camp.maxDonors) * 100))
    : 0

  const getStatusConfig = (status) => {
    const configs = {
      scheduled: { className: 'badge-scheduled', label: 'Scheduled', icon: '📅' },
      ongoing: { className: 'badge-ongoing', label: 'Ongoing', icon: '🔴' },
      completed: { className: 'badge-completed', label: 'Completed', icon: '✅' },
      cancelled: { className: 'badge-cancelled', label: 'Cancelled', icon: '❌' }
    }
    return configs[status] || configs.scheduled
  }

  const statusConfig = getStatusConfig(camp.status)
  const isFull = percentage >= 100
  const canRegister = camp.status === 'scheduled' && 
                      camp.isRegistrationOpen && 
                      isAuthenticated && 
                      userRoles?.includes('donor') &&
                      !isFull

  return (
    <div 
      className="camps-card"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Status Badge Overlay */}
      <div className="card-header-overlay">
        <span className={`camps-status-badge ${statusConfig.className}`}>
          <span className="badge-icon">{statusConfig.icon}</span>
          {statusConfig.label}
        </span>
        {isFull && (
          <span className="camps-full-badge">
            <CheckCircle size={14} />
            Full
          </span>
        )}
      </div>

      <div className="camps-card-content">
        <div className="camps-card-main">
          <h3 className="camps-card-title">{camp.title}</h3>
          <p className="camps-card-description">{camp.description}</p>

          {/* Camp Details */}
          <div className="camps-details-compact">
            <div className="detail-row">
              <Calendar size={16} className="detail-icon" />
              <span>
                {camp.startDate 
                  ? new Date(camp.startDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })
                  : 'TBD'
                }
              </span>
            </div>
            
            <div className="detail-row">
              <Clock size={16} className="detail-icon" />
              <span>{camp.startTime} - {camp.endTime}</span>
            </div>
            
            <div className="detail-row">
              <MapPin size={16} className="detail-icon" />
              <span>{camp.location?.city}, {camp.location?.state}</span>
            </div>
          </div>

          {/* Progress Section */}
          <div className="camps-progress-section">
            <div className="progress-header">
              <span className="progress-label">Registration Progress</span>
              <span className="progress-count">
                <strong>{camp.registeredDonors?.length || 0}</strong> / {camp.maxDonors}
              </span>
            </div>
            <div className="camps-progress-bar">
              <div 
                className={`camps-progress-fill ${isFull ? 'progress-full' : ''}`}
                style={{ width: `${percentage}%` }}
                role="progressbar"
                aria-valuenow={percentage}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <span className="progress-shimmer"></span>
              </div>
            </div>
            <span className="progress-percentage">{percentage}% Filled</span>
          </div>
        </div>

        {/* Card Footer */}
        <div className="camps-card-footer">
          <div className="camps-organizer">
            <Building2 size={16} />
            <span>{camp.organizer?.name || 'Organizer'}</span>
          </div>

          <div className="camps-actions">
            <Link
              to={`/camps/${camp._id}`}
              className="camps-btn camps-btn-outline"
            >
              View Details
            </Link>

            {canRegister && (
              <button
                onClick={() => onRegister(camp._id)}
                className="camps-btn camps-btn-primary"
              >
                Register Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

CampCard.displayName = 'CampCard'

export default CampCard
