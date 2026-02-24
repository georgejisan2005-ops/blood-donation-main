import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { recipientService } from '../../services/recipient.service'
import { donorService } from '../../services/donor.service'
import toast from 'react-hot-toast'
import { 
    CheckCircle, 
    XCircle, 
    User, 
    Phone, 
    Mail, 
    MapPin, 
    Calendar, 
    Clock, 
    Heart, 
    Activity,
    AlertTriangle,
    ArrowLeft
} from 'lucide-react'

import './RequestDetails.css'

function RequestDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [request, setRequest] = useState(null)
    const [loading, setLoading] = useState(true)
    const [responding, setResponding] = useState(false)

    const [searchParams] = useSearchParams()
    
    // Determine context role
    const getContextRole = () => {
        const paramRole = searchParams.get('role');
        if (paramRole && user?.roles?.includes(paramRole)) return paramRole;
        // Fallback heuristics
        if (user?.roles?.includes('donor')) return 'donor';
        return 'recipient';
    }
    const role = getContextRole();

    const fetchRequest = async () => {
        try {
            setLoading(true)
            let data
            if (role === 'donor') {
                data = await donorService.getRequest(id)
            } else {
                data = await recipientService.getRequest(id)
            }
            setRequest(data.request)
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to load request details')
            navigate('/dashboard/requests')
        } finally {
            setLoading(false)
        }
    }

    const handleRespond = async (action) => {
        if (action === 'accept' && !window.confirm('Are you sure you want to accept this request? Your contact details will be shared with the requester.')) {
            return;
        }

        try {
            setResponding(true)
            await donorService.respondToRequest({
                requestId: id,
                action: action
            })
            toast.success(`Request ${action}ed successfully!`)
            // Refresh the request data
            await fetchRequest()
        } catch (e) {
            toast.error(e.response?.data?.message || `Failed to ${action} request`)
        } finally {
            setResponding(false)
        }
    }

    useEffect(() => { fetchRequest() }, [id])

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner" />
            </div>
        )
    }

    if (!request) return null

    // Check if current donor has already responded
    const hasResponded = role === 'donor' && request.matchedDonors?.some(
        match => match.donor?._id === user?.donorProfile?._id ||
            match.donor?.user?._id === user?.id
    )

    const urgencyColors = {
        critical: 'urgency-critical',
        high: 'urgency-high',
        medium: 'urgency-medium',
        low: 'urgency-low'
    }

    const statusColors = {
        pending: 'status-pending',
        matched: 'status-matched',
        completed: 'status-completed',
        cancelled: 'status-cancelled',
        in_progress: 'status-in-progress'
    }

    return (
        <div className="container">
            {/* Navigation */}
            <div className="navigation">
                <Link
                    to={role === 'donor' ? '/dashboard/available-requests' : '/dashboard/my-requests'}
                    className="back-link"
                >
                    <ArrowLeft className="icon-small" />
                    Back to Requests
                </Link>
            </div>

            <div className="card-main">
                {/* Hero Header */}
                <div className="hero-header">
                    <div className="hero-bg-1"></div>
                    
                    <div className="hero-content">
                        <div className="status-badges">
                            <span className={`status-badge ${statusColors[request.status] || 'status-default'}`}>
                                {request.status.replace('_', ' ')}
                            </span>
                            <span className={`urgency-badge ${urgencyColors[request.urgency] || 'urgency-low'}`}>
                                {request.urgency} Urgency
                            </span>
                        </div>
                        
                        <h1 className="hero-title">Blood Request</h1>
                        <div className="hero-meta">
                            <span className="meta-item">
                                <Clock className="icon-tiny" />
                                Posted {new Date(request.createdAt).toLocaleDateString()}
                            </span>
                            <span className="meta-dot"></span>
                            <span className="meta-item urgent">
                                <AlertTriangle className="icon-tiny" />
                                Expires {new Date(request.expiresAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    <div className="blood-group-card">
                        <span className="blood-group-label">Blood Group</span>
                        <span className="blood-group">{request.bloodGroup}</span>
                    </div>
                </div>

                <div className="card-content">
                    <div className="content-grid">
                        
                        {/* Left Column: Patient & Request Info */}
                        <div className="left-column">
                            
                            {/* Patient Info Section */}
                            <section className="info-section">
                                <h2 className="section-title">
                                    <div className="section-icon patient-icon">
                                        <User className="icon-medium" />
                                    </div>
                                    Patient Information
                                </h2>
                                <div className="info-grid">
                                    <div>
                                        <p className="label-small">Patient Name</p>
                                        <p className="value-large">{request.patientName}</p>
                                    </div>
                                    <div>
                                        <p className="label-small">Units Required</p>
                                        <div className="units-row">
                                            <p className="value-large">{request.unitsRequired} Units</p>
                                            <div className="progress-bar">
                                                <div 
                                                    className="progress-fill"
                                                    style={{ width: `${Math.min((request.totalUnitsReceived / request.unitsRequired) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="label-small">Required Date</p>
                                        <p className="value-large date">
                                            <Calendar className="icon-small" />
                                            {new Date(request.requiredDate).toLocaleDateString(undefined, {
                                                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <div className="full-width">
                                        <p className="label-small">Reason / Description</p>
                                        <p className="description">{request.description || 'No additional details provided.'}</p>
                                    </div>
                                </div>
                            </section>

                            {/* Hospital Info Section */}
                            <section className="info-section">
                                <h2 className="section-title">
                                    <div className="section-icon hospital-icon">
                                        <Activity className="icon-medium" />
                                    </div>
                                    Hospital Details
                                </h2>
                                <div className="hospital-card">
                                    <div className="hospital-content">
                                        <h3 className="hospital-name">{request.hospitalName}</h3>
                                        <div className="hospital-address">
                                            <MapPin className="icon-small address-icon" />
                                            <p>
                                                {request.hospitalAddress}<br />
                                                {request.city}, {request.state} - {request.pincode}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                            
                            {/* Matched Donors Section (Recipient Only) */}
                            {role === 'recipient' && request.matchedDonors && request.matchedDonors.length > 0 && (
                                <section className="info-section">
                                    <h2 className="section-title">
                                        <div className="section-icon donors-icon">
                                            <Heart className="icon-medium" />
                                        </div>
                                        Matched Donors
                                    </h2>
                                    <div className="donors-list">
                                        {request.matchedDonors.map((match, idx) => (
                                            <div key={idx} className="donor-item">
                                                <div className="donor-info">
                                                    <div className="donor-avatar">
                                                        {match.donor?.user?.name ? match.donor.user.name.charAt(0) : '?'}
                                                    </div>
                                                    <div>
                                                        <p className="donor-name">{match.donor?.user?.name || 'Anonymous'}</p>
                                                        <div className="donor-details">
                                                            <span>{match.donor?.bloodGroup}</span>
                                                            {match.donor?.user?.phone && (
                                                                <>
                                                                    <span className="detail-separator"></span>
                                                                    <span>{match.donor.user.phone}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`donor-status ${match.status}`}>
                                                    {match.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                        </div>

                        {/* Right Column: Contact & Actions */}
                        <div className="right-column">
                            
                            {/* Contact Person Card */}
                            <div className="contact-card">
                                <h3 className="card-subtitle">Contact Person</h3>
                                
                                <div className="contact-info">
                                    <div className="contact-item">
                                        <div className="contact-icon">
                                            <User className="icon-medium" />
                                        </div>
                                        <div>
                                            <p className="contact-label">Name</p>
                                            <p className="contact-value">{request.contactPerson?.name || 'Not provided'}</p>
                                            {request.contactPerson?.relationship && (
                                                <p className="contact-relationship">{request.contactPerson.relationship}</p>
                                            )}
                                        </div>
                                    </div>

                                    {request.contactPerson?.phone && (
                                        <div className="contact-item">
                                            <div className="contact-icon">
                                                <Phone className="icon-medium" />
                                            </div>
                                            <div>
                                                <p className="contact-label">Phone Number</p>
                                                <a href={`tel:${request.contactPerson.phone}`} className="contact-phone">
                                                    {request.contactPerson.phone}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons (Donor) */}
                            {role === 'donor' && request.status === 'pending' && (
                                <div className="action-card sticky">
                                    <h3 className="card-subtitle">Take Action</h3>
                                    
                                    {!hasResponded ? (
                                        <div className="action-section">
                                            <p className="action-description">
                                                Can you donate blood for this request? Your help can save a life.
                                            </p>
                                            <button
                                                onClick={() => handleRespond('accept')}
                                                disabled={responding}
                                                className="action-btn primary"
                                            >
                                                {responding ? (
                                                    <span className="spinner-small" />
                                                ) : (
                                                    <>
                                                        <CheckCircle className="icon-small" />
                                                        Accept Request
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleRespond('decline')}
                                                disabled={responding}
                                                className="action-btn secondary"
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="response-sent">
                                            <div className="success-icon">
                                                <CheckCircle className="icon-large" />
                                            </div>
                                            <p className="success-title">Response Sent</p>
                                            <p className="success-message">Thank you for responding to this request.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Action Buttons (Recipient) */}
                            {role === 'recipient' && request.status !== 'completed' && request.status !== 'cancelled' && (
                                <div className="action-card">
                                    <h3 className="card-subtitle">Manage Request</h3>
                                    <div className="action-section">
                                        <Link 
                                            to={`/dashboard/requests/edit/${request._id}`}
                                            className="action-btn secondary full-width"
                                        >
                                            Edit Request
                                        </Link>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RequestDetails
