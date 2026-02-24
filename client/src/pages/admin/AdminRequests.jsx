import { useEffect, useState } from 'react'
import { adminService } from '../../services/admin.service'
import toast from 'react-hot-toast'
import { 
  Search, 
  MapPin, 
  Calendar, 
  User, 
  Phone, 
  CheckCircle, 
  XCircle, 
  ShieldCheck,
  Eye,
  X
} from 'lucide-react'
import './AdminRequests.css'

function AdminRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [filters, setFilters] = useState({ 
    status: '', 
    bloodGroup: '', 
    urgency: '', 
    city: '',
    isVerified: ''
  })
  const [selectedRequest, setSelectedRequest] = useState(null)

  const fetchRequests = async (nextPage = page) => {
    try {
      setLoading(true)
      const params = { page: nextPage, limit: 10 }
      Object.entries(filters).forEach(([k, v]) => { if (v !== '') params[k] = v })
      const data = await adminService.getRequests(params)
      setRequests(data.requests)
      setPages(data.pagination.pages)
      setPage(data.pagination.current)
    } catch (error) {
      toast.error('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRequests(1) }, [])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({ status: '', bloodGroup: '', urgency: '', city: '', isVerified: '' })
  }

  const setVerified = async (requestId, isVerified) => {
    try {
      await adminService.verifyRequest(requestId, !isVerified)
      toast.success(`Request ${!isVerified ? 'verified' : 'unverified'}`)
      fetchRequests(page)
      if (selectedRequest?._id === requestId) {
         setSelectedRequest(prev => ({ ...prev, isVerified: !isVerified }))
      }
    } catch {
      toast.error('Failed to update request verification')
    }
  }

  return (
    <div className="requests-container">
      {/* Header */}
      <div className="requests-header">
        <div className="requests-title">
          <h2>Verify Blood Requests</h2>
          <p>Review and verify blood donation requests to ensure safety</p>
        </div>
      </div>

      {/* Filters */}
      <div className="requests-filters-card">
        <div className="requests-filters-grid">
          
          <div className="filter-group">
            <label className="filter-label">Verification Status</label>
            <div className="filter-input-wrapper">
              <select 
                className="filter-select"
                value={filters.isVerified}
                onChange={(e) => handleFilterChange('isVerified', e.target.value)}
              >
                <option value="">All Requests</option>
                <option value="true">Verified Only</option>
                <option value="false">Unverified Only</option>
              </select>
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Urgency</label>
            <div className="filter-input-wrapper">
              <select 
                className="filter-select"
                value={filters.urgency}
                onChange={(e) => handleFilterChange('urgency', e.target.value)}
              >
                <option value="">All Urgency Levels</option>
                {['low', 'medium', 'high', 'critical'].map(u => (
                  <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Blood Group</label>
            <div className="filter-input-wrapper">
              <select 
                className="filter-select"
                value={filters.bloodGroup}
                onChange={(e) => handleFilterChange('bloodGroup', e.target.value)}
              >
                <option value="">All Groups</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">City Search</label>
            <div className="filter-input-wrapper">
              <input 
                className="filter-input"
                placeholder="Search city..."
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
              />
              <MapPin className="filter-icon" />
            </div>
          </div>

          <div className="filter-actions">
            <button className="filter-clear-btn" onClick={clearFilters}>
              Clear Filters
            </button>
            <button className="btn btn-primary" onClick={() => fetchRequests(1)}>
              <Search className="w-4 h-4 mr-2" />
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="spinner-container"><div className="spinner"></div></div>
      ) : requests.length === 0 ? (
        <div className="no-requests-card">
          <div className="empty-state-icon-bg">
            <ShieldCheck size={32} />
          </div>
          <h3 className="empty-title">No requests found</h3>
          <p className="empty-description">Try adjusting your filters to find requests.</p>
        </div>
      ) : (
        <div className="requests-grid">
          {requests.map(request => (
            <div key={request._id} className="request-card">
              <div className="request-content-wrapper">
                <div className="request-main-info">
                  <div className="request-header-row">
                    <div>
                      <h3 className="request-patient-name">{request.patientName || 'Unknown Patient'}</h3>
                      <div className="request-meta-row">
                        <span className="blood-group-badge">{request.bloodGroup}</span>
                        <span className="meta-separator">•</span>
                        <span>{request.unitsRequired} unit{request.unitsRequired > 1 ? 's' : ''}</span>
                        <span className="meta-separator">•</span>
                        <span className="hospital-name">{request.hospitalName}</span>
                      </div>
                    </div>
                    <div className="status-badges">
                      <span className={`status-check urgency-${request.urgency}`}>
                        {request.urgency}
                      </span>
                      <span className={`status-check status-${request.status}`}>
                        {request.status}
                      </span>
                      <span className={`status-check ${request.isVerified ? 'status-completed' : 'status-pending'}`}>
                        {request.isVerified ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {request.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                  </div>

                  <div className="request-details-grid">
                    <div className="detail-item">
                      <div className="detail-icon"><MapPin size={18} /></div>
                      <div className="detail-text">
                        <h4>Location</h4>
                        <p>{request.city}, {request.state}</p>
                      </div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-icon"><Calendar size={18} /></div>
                      <div className="detail-text">
                        <h4>Required Date</h4>
                        <p>{new Date(request.requiredDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                      </div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-icon"><User size={18} /></div>
                      <div className="detail-text">
                        <h4>Contact</h4>
                        <p>{request.contactPerson?.name} ({request.contactPerson?.relationship})</p>
                      </div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-icon"><Phone size={18} /></div>
                      <div className="detail-text">
                        <h4>Phone</h4>
                        <p>{request.contactPerson?.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="request-actions">
                  <button 
                    className="action-btn btn-view"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </button>
                  <button 
                    className={`action-btn ${request.isVerified ? 'btn-unverify' : 'btn-verify'}`}
                    onClick={() => setVerified(request._id, request.isVerified)}
                  >
                    {request.isVerified ? (
                      <>
                        <XCircle className="w-4 h-4 mr-2" />
                        Unverify
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Verify
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && requests.length > 0 && (
         <div className="pagination">
            <button className="btn btn-secondary" disabled={page <= 1} onClick={() => fetchRequests(page - 1)}>Previous</button>
            <span className="page-info">Page {page} of {pages}</span>
            <button className="btn btn-secondary" disabled={page >= pages} onClick={() => fetchRequests(page + 1)}>Next</button>
         </div>
      )}

      {/* Details Modal */}
      {selectedRequest && (
        <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Request Details</h3>
              <button className="modal-close-btn" onClick={() => setSelectedRequest(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-section">
                <div className="request-header-row">
                    <div>
                      <h3 className="request-patient-name">{selectedRequest.patientName}</h3>
                      <div className="request-meta-row">
                        <span className="blood-group-badge">{selectedRequest.bloodGroup}</span>
                        <span className="meta-separator">•</span>
                        <span>{selectedRequest.unitsRequired} unit{selectedRequest.unitsRequired > 1 ? 's' : ''}</span>
                        <span className="meta-separator">•</span>
                        <span className="hospital-name">{selectedRequest.hospitalName}</span>
                      </div>
                    </div>
                     <div className="status-badges">
                      <span className={`status-check urgency-${selectedRequest.urgency}`}>
                        {selectedRequest.urgency}
                      </span>
                      <span className={`status-check status-${selectedRequest.status}`}>
                        {selectedRequest.status}
                      </span>
                      <span className={`status-check ${selectedRequest.isVerified ? 'status-completed' : 'status-pending'}`}>
                        {selectedRequest.isVerified ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {selectedRequest.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                </div>
              </div>

               <div className="modal-section">
                <h4 className="modal-section-title">Description</h4>
                <div className="modal-description">
                  {selectedRequest.description || 'No additional description provided.'}
                </div>
              </div>

              <div className="modal-section">
                <h4 className="modal-section-title">Patient & Hospital</h4>
                <div className="modal-grid">
                  <div className="modal-field">
                     <label>Patient Name</label>
                     <span>{selectedRequest.patientName}</span>
                  </div>
                   <div className="modal-field">
                     <label>Hospital Name</label>
                     <span>{selectedRequest.hospitalName}</span>
                  </div>
                  <div className="modal-field">
                     <label>Full Address</label>
                     <span>{selectedRequest.hospitalAddress}</span>
                  </div>
                  <div className="modal-field">
                     <label>City/State</label>
                     <span>{selectedRequest.city}, {selectedRequest.state}</span>
                  </div>
                </div>
              </div>

              <div className="modal-section">
                <h4 className="modal-section-title">Contact Information</h4>
                 <div className="modal-grid">
                  <div className="modal-field">
                     <label>Contact Person</label>
                     <span>{selectedRequest.contactPerson?.name}</span>
                  </div>
                   <div className="modal-field">
                     <label>Relationship</label>
                     <span>{selectedRequest.contactPerson?.relationship}</span>
                  </div>
                  <div className="modal-field">
                     <label>Phone Number</label>
                     <span>{selectedRequest.contactPerson?.phone}</span>
                  </div>
                   <div className="modal-field">
                     <label>Email</label>
                     <span>{selectedRequest.contactPerson?.email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="modal-section">
                <h4 className="modal-section-title">Request Info</h4>
                <div className="modal-grid">
                   <div className="modal-field">
                     <label>Required Date</label>
                     <span>{new Date(selectedRequest.requiredDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                  </div>
                  <div className="modal-field">
                     <label>Request Created</label>
                     <span>{new Date(selectedRequest.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminRequests


