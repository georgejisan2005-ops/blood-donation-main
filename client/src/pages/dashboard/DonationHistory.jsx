import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DonationRequestService from '../../services/donationRequest.service'
import { Calendar, MapPin, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import '../../styles/DonationHistory.css'

function DonationHistory() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    donationDate: '',
    location: '',
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const data = await DonationRequestService.getMyRequests()
      setRequests(data.requests)
    } catch (error) {
      console.error('Failed to fetch donation requests:', error)
      toast.error('Failed to load donation history')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      await DonationRequestService.createRequest(formData)
      toast.success('Donation verification request submitted!')
      setShowForm(false)
      setFormData({ donationDate: '', location: '', notes: '' })
      fetchRequests()
    } catch (error) {
      console.error('Failed to submit request:', error)
      toast.error(error.response?.data?.message || 'Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="badge badge-success flex items-center gap-1"><CheckCircle size={14} /> Verified</span>
      case 'rejected':
        return <span className="badge badge-error flex items-center gap-1"><XCircle size={14} /> Rejected</span>
      default:
        return <span className="badge badge-warning flex items-center gap-1"><Clock size={14} /> Pending</span>
    }
  }

  return (
    <div className="donation-history-page">
      <div className="donation-history-header">
        <div>
          <h1 className="donation-history-title">Donation History</h1>
          <p className="donation-history-subtitle">Track and verify your blood donations</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary flex items-center gap-2"
        >
          {showForm ? <XCircle size={18} /> : <Calendar size={18} />}
          {showForm ? 'Cancel' : 'Report New Donation'}
        </button>
      </div>

      {showForm && (
        <div className="report-donation-card">
          <div className="report-donation-header">
            <h2 className="report-donation-title">
              <Calendar size={20} className="text-red-600" />
              Report a Donation
            </h2>
          </div>
          <div className="report-donation-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Date of Donation</label>
                <input
                  type="date"
                  name="donationDate"
                  value={formData.donationDate}
                  onChange={handleChange}
                  className="form-input"
                  required
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Location / Camp Name</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g. City Hospital or Red Cross Camp"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="form-textarea"
                  placeholder="Any additional details..."
                  rows="3"
                ></textarea>
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="spinner"></div>
        </div>
      ) : requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request._id} className="card p-4">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full ${
                    request.status === 'approved' ? 'bg-green-100 text-green-600' : 
                    request.status === 'rejected' ? 'bg-red-100 text-red-600' : 
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      Donation on {new Date(request.donationDate).toLocaleDateString()}
                    </h3>
                    {request.location && (
                      <p className="text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin size={14} /> {request.location}
                      </p>
                    )}
                    {request.notes && (
                      <p className="text-gray-500 text-sm mt-2">{request.notes}</p>
                    )}
                    {request.rejectionReason && (
                      <div className="mt-2 p-2 bg-red-50 text-red-700 text-sm rounded border border-red-100">
                        <strong>Reason for rejection:</strong> {request.rejectionReason}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                   {getStatusBadge(request.status)}
                   <span className="text-xs text-gray-500">
                     Requested on {new Date(request.createdAt).toLocaleDateString()}
                   </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-gray-400">
            <Calendar size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No Donation History</h3>
          <p className="text-gray-500 mt-2">You haven't submitted any donation verification requests yet.</p>
        </div>
      )}
    </div>
  )
}

export default DonationHistory
