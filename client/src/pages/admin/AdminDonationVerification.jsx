import { useState, useEffect } from 'react'
import DonationRequestService from '../../services/donationRequest.service'
import { Calendar, User, MapPin, Check, X, Search } from 'lucide-react'
import toast from 'react-hot-toast'

function AdminDonationVerification() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  
  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const data = await DonationRequestService.getPendingRequests()
      setRequests(data.requests)
    } catch (error) {
      console.error('Failed to fetch pending requests:', error)
      toast.error('Failed to load pending requests')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (id) => {
    if (!window.confirm('Are you sure you want to verify this donation? This will update the donor\'s last donation date.')) return

    try {
      setProcessingId(id)
      await DonationRequestService.verifyRequest(id)
      toast.success('Donation verified successfully')
      fetchRequests()
    } catch (error) {
      console.error('Failed to verify request:', error)
      toast.error('Failed to verify request')
    } finally {
      setProcessingId(null)
    }
  }

  const openRejectModal = (request) => {
    setSelectedRequest(request)
    setRejectionReason('')
    setShowRejectModal(true)
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    try {
      setProcessingId(selectedRequest._id)
      await DonationRequestService.rejectRequest(selectedRequest._id, rejectionReason)
      toast.success('Request rejected')
      setShowRejectModal(false)
      fetchRequests()
    } catch (error) {
      console.error('Failed to reject request:', error)
      toast.error('Failed to reject request')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Donation Verification</h1>
        <p className="text-gray-600">Review and verify donor donation claims</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="spinner"></div>
        </div>
      ) : requests.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Donor</th>
                  <th>Donation Date</th>
                  <th>Location / Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50 border-b border-gray-100 last:border-0 transform transition-colors">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {request.donor?.bloodGroup || '?'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{request.user?.name}</div>
                          <div className="text-sm text-gray-500">{request.user?.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar size={16} className="text-gray-400" />
                        {new Date(request.donationDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div className="max-w-xs">
                        {request.location && (
                          <div className="flex items-center gap-1 text-sm text-gray-700 mb-1">
                            <MapPin size={14} className="text-gray-400" />
                            {request.location}
                          </div>
                        )}
                        {request.notes ? (
                          <p className="text-sm text-gray-600 italic">"{request.notes}"</p>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVerify(request._id)}
                          disabled={processingId === request._id}
                          className="btn btn-sm btn-success text-white"
                          title="Verify Donation"
                        >
                          {processingId === request._id ? '...' : <Check size={16} />}
                        </button>
                        <button
                          onClick={() => openRejectModal(request)}
                          disabled={processingId === request._id}
                          className="btn btn-sm btn-error text-white"
                          title="Reject Request"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-gray-400">
            <Check size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900">All Caught Up!</h3>
          <p className="text-gray-500 mt-2">There are no pending donation verifications.</p>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-scale-in">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Reject Request</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting the donation request from <strong>{selectedRequest?.user?.name}</strong>.
            </p>
            <textarea
              className="textarea w-full mb-4"
              rows="3"
              placeholder="Reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              autoFocus
            ></textarea>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="btn btn-error text-white"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDonationVerification
