import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { campService } from '../../services/camp.service'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import './CampDetails.css'

function CampDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [camp, setCamp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)

  const fetchCamp = async () => {
    try {
      setLoading(true)
      const data = await campService.getCamp(id)
      setCamp(data.camp)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load camp')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to register for this camp')
      navigate('/login', { state: { from: `/camps/${id}` } })
      return
    }

    if (!user?.roles?.includes('donor')) {
      toast.error('Only donors can register for camps')
      return
    }

    try {
      setRegistering(true)
      await campService.registerForCamp(id, {})
      toast.success('Successfully registered for the camp!')
      await fetchCamp()
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to register for camp'
      toast.error(message)
    } finally {
      setRegistering(false)
    }
  }

  const isUserRegistered = () => {
    if (!camp || !user) return false
    return camp.registeredDonors?.some(reg => 
      reg.donor?.user?._id === user.id || reg.donor?.user === user.id
    )
  }

  const getRegistrationStatus = () => {
    if (!camp) return { canRegister: false, message: 'Loading...' }
    
    const now = new Date()
    const endDate = new Date(camp.endDate)
    
    if (isUserRegistered()) {
      return { canRegister: false, message: 'Already Registered', isRegistered: true }
    }
    
    if (camp.status === 'completed' || camp.status === 'cancelled') {
      return { canRegister: false, message: `Camp is ${camp.status}` }
    }
    
    if (now >= endDate) {
      return { canRegister: false, message: 'Camp has ended' }
    }
    
    const availableSlots = camp.maxDonors - (camp.registeredDonors?.length || 0)
    if (availableSlots <= 0) {
      return { canRegister: false, message: 'Camp is Full' }
    }
    
    return { canRegister: true, message: 'Register Now' }
  }

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'upcoming': 'status-upcoming',
      'ongoing': 'status-ongoing',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled'
    }
    return statusMap[status] || 'status-upcoming'
  }

  useEffect(() => { 
    fetchCamp() 
  }, [id])

  if (loading) {
    return (
      <div className="camps-loading">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!camp) {
    return (
      <div className="container page">
        <div className="empty-state fade-in">
          <div className="empty-emoji">😕</div>
          <p className="empty-title">Camp not found</p>
          <p className="empty-subtitle">The camp you are looking for may have been removed.</p>
          <div className="actions-row">
            <Link className="btn" to="/camps">Back to Camps</Link>
          </div>
        </div>
      </div>
    )
  }

  const startDate = new Date(camp.startDate)
  const endDate = new Date(camp.endDate)
  const regStatus = getRegistrationStatus()
  const isDisabled = !regStatus.canRegister || registering
  const registeredCount = camp.registeredDonors?.length || 0
  const availableSlots = Math.max(0, camp.maxDonors - registeredCount)
  const registrationPercentage = Math.round((registeredCount / camp.maxDonors) * 100)

  return (
    <div className="camp-details-page">
      <div className="camp-container">
        {/* Back Button */}
        <Link to="/camps" className="back-button">
          <svg className="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Camps
        </Link>

        <div className="camp-card fade-in">
          {/* Hero Section */}
          <div className="hero-section">
            <div className="hero-decoration">
              <svg className="hero-icon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>

            <div className="hero-content">
              <div className="hero-header">
                <div className="hero-info">
                  <div className="title-with-badge">
                    <h1 className="hero-title slide-up">{camp.title}</h1>
                    <span className={`status-badge ${getStatusBadgeClass(camp.status)} slide-up`}>
                      {camp.status.charAt(0).toUpperCase() + camp.status.slice(1)}
                    </span>
                  </div>
                  <div className="hero-meta">
                    <div className="meta-item slide-up" style={{animationDelay: '0.1s'}}>
                      <svg className="meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {camp.location?.city}, {camp.location?.state}
                    </div>
                    <div className="meta-item slide-up" style={{animationDelay: '0.2s'}}>
                      <svg className="meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                    </div>
                    <div className="meta-item slide-up" style={{animationDelay: '0.3s'}}>
                      <svg className="meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {camp.startTime} - {camp.endTime}
                    </div>
                  </div>
                </div>
                
                {/* Statistics Cards */}
                <div className="stats-grid scale-in">
                  <div className="stat-card">
                    <div className="stat-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="stat-label">Registered</div>
                    <div className="stat-value">{registeredCount}</div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon stat-icon-green">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="stat-label">Available</div>
                    <div className="stat-value">{availableSlots}</div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon stat-icon-purple">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div className="stat-label">Target</div>
                    <div className="stat-value">{camp.maxDonors}</div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="progress-section slide-up" style={{animationDelay: '0.4s'}}>
                <div className="progress-header">
                  <span className="progress-label">Registration Progress</span>
                  <span className="progress-percentage">{registrationPercentage}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{width: `${registrationPercentage}%`}}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="content-grid">
            {/* Main Content */}
            <div className="main-content">
              {/* About Section */}
              <section className="content-section fade-in-up">
                <h2 className="section-title">
                  <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  About the Camp
                </h2>
                <p className="section-text">
                  {camp.description || 'No description provided.'}
                </p>
              </section>

              {/* Eligibility Requirements */}
              {camp.requirements && (
                <section className="eligibility-card fade-in-up" style={{animationDelay: '0.1s'}}>
                  <h3 className="eligibility-title">
                    <svg className="eligibility-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Eligibility Requirements
                  </h3>
                  <div className="eligibility-grid">
                    <div className="eligibility-item">
                      <div className="eligibility-icon-wrapper">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="eligibility-label">Age Requirement</div>
                        <div className="eligibility-value">
                          {camp.requirements.minAge} - {camp.requirements.maxAge} years
                        </div>
                      </div>
                    </div>

                    <div className="eligibility-item">
                      <div className="eligibility-icon-wrapper">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                        </svg>
                      </div>
                      <div>
                        <div className="eligibility-label">Minimum Weight</div>
                        <div className="eligibility-value">
                          {camp.requirements.minWeight} kg or above
                        </div>
                      </div>
                    </div>

                    <div className="eligibility-item">
                      <div className="eligibility-icon-wrapper">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="eligibility-label">Required Documents</div>
                        <div className="eligibility-value">
                          {camp.requirements.requiredDocuments?.length > 0 
                            ? camp.requirements.requiredDocuments.join(', ')
                            : 'Valid ID Card'}
                        </div>
                      </div>
                    </div>

                    <div className="eligibility-item">
                      <div className="eligibility-icon-wrapper">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="eligibility-label">Health Status</div>
                        <div className="eligibility-value">
                          Must be in good health
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Camp Details Grid */}
              <section className="details-card fade-in-up" style={{animationDelay: '0.2s'}}>
                <h3 className="details-title">Camp Details</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <div className="detail-icon-wrapper">
                      <svg className="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="detail-label">Time</p>
                      <p className="detail-value">{camp.startTime} - {camp.endTime}</p>
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-icon-wrapper">
                      <svg className="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="detail-label">Venue</p>
                      <p className="detail-value">{camp.location?.name}</p>
                      <p className="detail-subtext">{camp.location?.address}</p>
                      <p className="detail-subtext">{camp.location?.city}, {camp.location?.pincode}</p>
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-icon-wrapper">
                      <svg className="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="detail-label">Target Blood Groups</p>
                      <div className="blood-groups">
                        {(camp.targetBloodGroups && camp.targetBloodGroups.length > 0) ? (
                          camp.targetBloodGroups.map(group => (
                            <span key={group} className="blood-group-badge pulse">
                              {group}
                            </span>
                          ))
                        ) : (
                          <span className="detail-value">All Blood Groups</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-icon-wrapper">
                      <svg className="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="detail-label">Visibility</p>
                      <p className="detail-value">
                        {camp.isPublic ? (
                          <span className="visibility-badge public">
                            <svg className="badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Public
                          </span>
                        ) : (
                          <span className="visibility-badge private">
                            <svg className="badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Private
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Special Instructions */}
              {camp.specialInstructions && (
                <section className="instructions-card fade-in-up" style={{animationDelay: '0.3s'}}>
                  <h3 className="instructions-title">
                    <svg className="instructions-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Special Instructions
                  </h3>
                  <p className="instructions-text">{camp.specialInstructions}</p>
                </section>
              )}

              {/* Organizer Information */}
              {camp.organizer && (
                <section className="organizer-card fade-in-up" style={{animationDelay: '0.4s'}}>
                  <h3 className="organizer-title">
                    <svg className="organizer-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Organized By
                  </h3>
                  <div className="organizer-content">
                    <div className="organizer-avatar">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="organizer-details">
                      <div className="organizer-name">{camp.organizer.name}</div>
                      <div className="organizer-info-grid">
                        <div className="organizer-info-item">
                          <svg className="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {camp.organizer.email}
                        </div>
                        <div className="organizer-info-item">
                          <svg className="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {camp.organizer.phone}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="sidebar">
              {/* Coordinator Card */}
              <div className="coordinator-card fade-in-up" style={{animationDelay: '0.3s'}}>
                <h3 className="coordinator-title">Contact Coordinator</h3>
                <div className="coordinator-info">
                  <div className="coordinator-item">
                    <div className="coordinator-icon-wrapper">
                      <svg className="coordinator-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="coordinator-label">Name</p>
                      <p className="coordinator-value">{camp.contactInfo?.coordinatorName}</p>
                    </div>
                  </div>

                  <div className="coordinator-item">
                    <div className="coordinator-icon-wrapper">
                      <svg className="coordinator-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="coordinator-label">Phone</p>
                      <p className="coordinator-value">{camp.contactInfo?.phone}</p>
                    </div>
                  </div>

                  <div className="coordinator-item">
                    <div className="coordinator-icon-wrapper">
                      <svg className="coordinator-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="coordinator-label">Email</p>
                      <p className="coordinator-value">{camp.contactInfo?.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Registration Section */}
              <div className="registration-section fade-in-up" style={{animationDelay: '0.4s'}}>
                {/* Available Slots */}
                <div className="slots-card">
                  <div className="slots-label">Available Slots</div>
                  <div className="slots-value">
                    {availableSlots} / {camp.maxDonors}
                  </div>
                  <div className="slots-subtext">
                    {registeredCount} donors registered
                  </div>
                </div>
                
                {/* Register Button */}
                <button 
                  onClick={handleRegister}
                  disabled={isDisabled}
                  className={`register-button ${
                    regStatus.isRegistered 
                      ? 'registered' 
                      : regStatus.canRegister 
                        ? 'available' 
                        : 'disabled'
                  }`}
                >
                  {registering ? (
                    <>
                      <span className="spinner-small"></span>
                      Registering...
                    </>
                  ) : (
                    <>
                      {regStatus.canRegister && (
                        <svg className="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {regStatus.message}
                    </>
                  )}
                </button>
                
                {/* Status Message */}
                {!regStatus.canRegister && !regStatus.isRegistered && (
                  <div className="status-message">
                    <svg className="status-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p>
                      {(camp.status === 'completed' || camp.status === 'cancelled') && 
                        `This camp is ${camp.status}.`}
                      {new Date() >= new Date(camp.endDate) && 
                        'This camp has ended.'}
                      {(camp.maxDonors - (camp.registeredDonors?.length || 0)) <= 0 && 
                        'This camp has reached maximum capacity.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CampDetails
