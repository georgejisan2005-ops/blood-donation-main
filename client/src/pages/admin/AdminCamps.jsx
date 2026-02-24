import { useEffect, useState } from 'react'
import { campService } from '../../services/camp.service'
import toast from 'react-hot-toast'
import { 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Calendar, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  AlertCircle,
  X,
  Droplet,
  Clock
} from 'lucide-react'
import '../../styles/admin.css'

const initialForm = {
  title: '', description: '',
  location: { name: '', address: '', city: '', state: '', pincode: '' },
  startDate: '', endDate: '', startTime: '', endTime: '',
  maxDonors: 50, contactInfo: { coordinatorName: '', phone: '', email: '' },
  specialInstructions: '', targetBloodGroups: []
}

function AdminCamps() {
  const [camps, setCamps] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedCamp, setSelectedCamp] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showDonors, setShowDonors] = useState(false)
  const [selectedCampForDonors, setSelectedCampForDonors] = useState(null)

  const fetchCamps = async () => {
    try {
      setLoading(true)
      const data = await campService.getCamps({ limit: 50 })
      setCamps(data.camps)
    } catch {
      toast.error('Failed to load camps')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id, status) => {
    try {
      // Optimistically update local state for instant feedback
      setCamps(prevCamps => 
        prevCamps.map(camp => 
          camp._id === id ? { ...camp, status } : camp
        )
      )
      
      await campService.updateCamp(id, { status })
      toast.success(`Camp status updated to ${status}`)
      
      // Refresh from server to ensure consistency
      fetchCamps()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update camp status')
      // Revert on error
      fetchCamps()
    }
  }

  useEffect(() => { fetchCamps() }, [])

  const fillDemoData = () => {
    const today = new Date()
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const toISODate = (d) => d.toISOString().slice(0, 10)

    setForm({
      title: 'University Blood Donation Drive',
      description: 'Join our campus-wide blood donation drive to support local hospitals. Free health check-up and refreshments provided.',
      location: {
        name: 'Main Auditorium, Block A',
        address: '123 College Road',
        city: 'Chennai',
        state: 'TN',
        pincode: '600001'
      },
      startDate: toISODate(today),
      endDate: toISODate(tomorrow),
      startTime: '10:00',
      endTime: '16:00',
      maxDonors: 100,
      contactInfo: {
        coordinatorName: 'Rahul Sharma',
        phone: '9876543210',
        email: 'rahul.sharma@example.com'
      },
      specialInstructions: 'Please have a light meal before donating and bring a valid ID card.',
      targetBloodGroups: ['O+', 'A+']
    })
  }

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await campService.updateCamp(editingId, form)
        toast.success('Camp updated successfully')
      } else {
        await campService.createCamp(form)
        toast.success('Camp scheduled successfully')
      }
      setForm(initialForm)
      setEditingId(null)
      setShowForm(false)
      fetchCamps()
    } catch (e) {
      toast.error(e.response?.data?.message || `Failed to ${editingId ? 'update' : 'create'} camp`)
    }
  }

  const handleEdit = (camp) => {
    setEditingId(camp._id)
    setShowForm(true)
    setForm({
      title: camp.title,
      description: camp.description,
      location: { ...camp.location },
      startDate: new Date(camp.startDate).toISOString().slice(0, 10),
      endDate: new Date(camp.endDate).toISOString().slice(0, 10),
      startTime: camp.startTime,
      endTime: camp.endTime,
      maxDonors: camp.maxDonors,
      contactInfo: { ...camp.contactInfo },
      specialInstructions: camp.specialInstructions,
      targetBloodGroups: camp.targetBloodGroups || []
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancel = () => {
    setForm(initialForm)
    setEditingId(null)
    setShowForm(false)
  }

  const deleteCamp = async (id) => {
    if (!window.confirm('Are you sure you want to delete this camp?')) return
    try {
      await campService.deleteCamp(id)
      toast.success('Camp deleted')
      fetchCamps()
    } catch {
      toast.error('Failed to delete camp')
    }
  }

  return (
    <div className="container admin-page">
      <div className="admin-header flex justify-between items-center">
        <h2 className="admin-title">Manage Donation Camps</h2>
        {!showForm && (
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setEditingId(null)
              setForm(initialForm)
              setShowForm(true)
            }}
          >
            Create Camp
          </button>
        )}
      </div>

      {showForm && (
        <div className="card mb-8">
          <div className="card-header bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingId ? '✏️ Edit Camp' : '➕ Create New Camp'}
            </h3>
          </div>
        <div className="card-body">
          <div className="admin-form-grid">
            <input className="admin-form-input" placeholder="Title" value={form.title} onChange={e => setForm(v => ({ ...v, title: e.target.value }))} />
            <input className="admin-form-input" placeholder="Coordinator" value={form.contactInfo.coordinatorName} onChange={e => setForm(v => ({ ...v, contactInfo: { ...v.contactInfo, coordinatorName: e.target.value } }))} />
            <input className="admin-form-input" placeholder="Phone" value={form.contactInfo.phone} onChange={e => setForm(v => ({ ...v, contactInfo: { ...v.contactInfo, phone: e.target.value } }))} />
            <input className="admin-form-input" placeholder="Email" value={form.contactInfo.email} onChange={e => setForm(v => ({ ...v, contactInfo: { ...v.contactInfo, email: e.target.value } }))} />
            <input className="admin-form-input" placeholder="Location name" value={form.location.name} onChange={e => setForm(v => ({ ...v, location: { ...v.location, name: e.target.value } }))} />
            <input className="admin-form-input" placeholder="Address" value={form.location.address} onChange={e => setForm(v => ({ ...v, location: { ...v.location, address: e.target.value } }))} />
            <input className="admin-form-input" placeholder="City" value={form.location.city} onChange={e => setForm(v => ({ ...v, location: { ...v.location, city: e.target.value } }))} />
            <input className="admin-form-input" placeholder="State" value={form.location.state} onChange={e => setForm(v => ({ ...v, location: { ...v.location, state: e.target.value } }))} />
            <input className="admin-form-input" placeholder="Pincode" value={form.location.pincode} onChange={e => setForm(v => ({ ...v, location: { ...v.location, pincode: e.target.value } }))} />
            <input className="admin-form-input" type="date" value={form.startDate} onChange={e => setForm(v => ({ ...v, startDate: e.target.value }))} />
            <input className="admin-form-input" type="date" value={form.endDate} onChange={e => setForm(v => ({ ...v, endDate: e.target.value }))} />
            <input className="admin-form-input" placeholder="Start time" value={form.startTime} onChange={e => setForm(v => ({ ...v, startTime: e.target.value }))} />
            <input className="admin-form-input" placeholder="End time" value={form.endTime} onChange={e => setForm(v => ({ ...v, endTime: e.target.value }))} />
            <input className="admin-form-input" type="number" min="1" value={form.maxDonors} onChange={e => setForm(v => ({ ...v, maxDonors: Number(e.target.value) }))} />
          </div>
          <textarea className="admin-form-textarea" placeholder="Description" value={form.description} onChange={e => setForm(v => ({ ...v, description: e.target.value }))} />
          <textarea className="admin-form-textarea" placeholder="Special Instructions" value={form.specialInstructions} onChange={e => setForm(v => ({ ...v, specialInstructions: e.target.value }))} />

          <div className="actions-row">
            {!editingId && <button className="btn" onClick={fillDemoData}>Fill Demo Data</button>}
            {editingId && <button className="btn btn-secondary" onClick={handleCancel}>Cancel Edit</button>}
            <button className="btn btn-success" onClick={handleSubmit}>
              {editingId ? 'Update Camp' : 'Create Camp'}
            </button>
          </div>
        </div>
      </div>
    )}

      {/* Camps Listing - Only show when form is hidden */}
      {!showForm && (
        <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : camps.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Camps Yet</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first donation camp</p>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setEditingId(null)
                  setForm(initialForm)
                  setShowForm(true)
                }}
              >
                Create Your First Camp
              </button>
            </div>
          </div>
        ) : (
          camps.map(c => (
            <div key={c._id} className="card hover:shadow-lg transition-shadow duration-200">
              <div className="card-body">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left Section - Camp Info */}
                  <div className="flex-1 space-y-3">
                    {/* Title and Status */}
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-xl font-bold text-gray-900">{c.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase whitespace-nowrap ${
                        c.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                        c.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                        c.status === 'paused' ? 'bg-blue-100 text-blue-800' :
                        c.status === 'completed' ? 'bg-gray-100 text-gray-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {c.status}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm line-clamp-2">{c.description}</p>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="p-1.5 bg-red-50 rounded">
                          <MapPin className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <div className="font-medium">{c.location?.city}, {c.location?.state}</div>
                          <div className="text-xs text-gray-500">{c.location?.name}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="p-1.5 bg-blue-50 rounded">
                          <Calendar className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{new Date(c.startDate).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">{c.startTime} - {c.endTime}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="p-1.5 bg-green-50 rounded">
                          <User className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">{c.contactInfo?.coordinatorName}</div>
                          <div className="text-xs text-gray-500">Coordinator</div>
                        </div>
                      </div>

                      <div 
                        className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-purple-50 p-2 rounded transition-colors"
                        onClick={() => {
                          setSelectedCampForDonors(c)
                          setShowDonors(true)
                        }}
                        title="Click to view registered donors"
                      >
                        <div className="p-1.5 bg-purple-50 rounded">
                          <AlertCircle className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium">{c.registeredDonors?.length || 0} / {c.maxDonors}</div>
                          <div className="text-xs text-gray-500">Registered Donors</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Actions */}
                  <div className="flex flex-col gap-2 lg:w-48">
                    <div className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Actions</div>
                    
                    {/* View Donors Button */}
                    <button 
                      className="btn btn-sm !bg-purple-600 hover:!bg-purple-700 !text-white !border-2 !border-purple-700 flex items-center justify-center gap-2"
                      onClick={() => {
                        setSelectedCampForDonors(c)
                        setShowDonors(true)
                      }}
                    >
                      <User className="w-4 h-4" /> View Donors ({c.registeredDonors?.length || 0})
                    </button>
                    
                    {/* Status Control Buttons */}
                    {c.status === 'scheduled' && (
                      <button 
                        className="btn btn-sm !bg-green-600 hover:!bg-green-700 !text-white !border-2 !border-green-700 flex items-center justify-center gap-2"
                        onClick={() => handleUpdateStatus(c._id, 'ongoing')}
                      >
                        <Play className="w-4 h-4" /> Start Camp
                      </button>
                    )}
                    {c.status === 'ongoing' && (
                      <button 
                        className="btn btn-sm !bg-blue-600 hover:!bg-blue-700 !text-white !border-2 !border-blue-700 flex items-center justify-center gap-2"
                        onClick={() => handleUpdateStatus(c._id, 'paused')}
                      >
                        <Pause className="w-4 h-4" /> Pause Camp
                      </button>
                    )}
                    {c.status === 'paused' && (
                      <button 
                        className="btn btn-sm !bg-green-600 hover:!bg-green-700 !text-white !border-2 !border-green-700 flex items-center justify-center gap-2"
                        onClick={() => handleUpdateStatus(c._id, 'ongoing')}
                      >
                        <Play className="w-4 h-4" /> Start Camp
                      </button>
                    )}
                    {(c.status === 'ongoing' || c.status === 'paused') && (
                      <button 
                        className="btn btn-sm !bg-red-600 hover:!bg-red-700 !text-white !border-2 !border-red-700 flex items-center justify-center gap-2"
                        onClick={() => handleUpdateStatus(c._id, 'completed')}
                      >
                        <CheckCircle className="w-4 h-4" /> End Camp
                      </button>
                    )}
                    
                    {/* Divider */}
                    <div className="border-t border-gray-200 my-1"></div>
                    
                    {/* Management Buttons */}
                    <button 
                      className="btn btn-sm !bg-white !border-2 !border-indigo-600 !text-indigo-700 hover:!bg-indigo-50 font-semibold flex items-center justify-center gap-2" 
                      onClick={() => {
                        setSelectedCamp(c)
                        setShowDetails(true)
                      }}
                    >
                      <Eye className="w-4 h-4" /> View Details
                    </button>
                    <button 
                      className="btn btn-sm !bg-white !border-2 !border-gray-600 !text-gray-700 hover:!bg-gray-50 font-semibold flex items-center justify-center gap-2" 
                      onClick={() => handleEdit(c)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-sm !bg-white !border-2 !border-red-600 !text-red-700 hover:!bg-red-50 font-semibold flex items-center justify-center gap-2" 
                      onClick={() => deleteCamp(c._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      )}

      {/* Camp Details Modal */}
      {showDetails && selectedCamp && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="modal-content bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-2xl font-bold text-gray-900">{selectedCamp.title}</h3>
              <button 
                onClick={() => setShowDetails(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Status Section */}
              <div className="flex items-center gap-3">
                 <span className={`px-4 py-1 rounded-full text-sm font-semibold ${
                    selectedCamp.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                    selectedCamp.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                    selectedCamp.status === 'paused' ? 'bg-blue-100 text-blue-800' :
                    selectedCamp.status === 'completed' ? 'bg-gray-100 text-gray-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedCamp.status.toUpperCase()}
                  </span>
                  <span className="text-gray-500 text-sm">Created {new Date(selectedCamp.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Location</h4>
                      <p className="text-gray-600">{selectedCamp.location.name}</p>
                      <p className="text-gray-600">{selectedCamp.location.address}</p>
                      <p className="text-gray-600">{selectedCamp.location.city}, {selectedCamp.location.state} - {selectedCamp.location.pincode}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Date & Time</h4>
                      <p className="text-gray-600">
                        {new Date(selectedCamp.startDate).toLocaleDateString()} - {new Date(selectedCamp.endDate).toLocaleDateString()}
                      </p>
                      <p className="text-gray-600">{selectedCamp.startTime} - {selectedCamp.endTime}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Coordinator</h4>
                      <p className="text-gray-600">{selectedCamp.contactInfo.coordinatorName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{selectedCamp.contactInfo.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{selectedCamp.contactInfo.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Capacity</h4>
                      <p className="text-gray-600">Max Donors: {selectedCamp.maxDonors}</p>
                      <p className="text-gray-600">Registered: {selectedCamp.registeredDonors?.length || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600 leading-relaxed">{selectedCamp.description}</p>
              </div>

              {/* Target Blood Groups */}
              {selectedCamp.targetBloodGroups?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Target Blood Groups</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCamp.targetBloodGroups.map(bg => (
                      <span key={bg} className="px-3 py-1 bg-red-600 text-white rounded-md text-sm font-medium">
                        {bg}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              {selectedCamp.specialInstructions && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                  <h4 className="text-yellow-900 font-semibold flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5" /> Special Instructions
                  </h4>
                  <p className="text-yellow-800 text-sm italic">{selectedCamp.specialInstructions}</p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button 
                onClick={() => setShowDetails(false)}
                className="btn btn-secondary px-8"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registered Donors Modal */}
      {showDonors && selectedCampForDonors && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="modal-content bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Registered Donors</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedCampForDonors.title}</p>
              </div>
              <button 
                onClick={() => setShowDonors(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-purple-600 text-sm font-semibold">Total Registered</div>
                  <div className="text-3xl font-bold text-purple-900">{selectedCampForDonors.registeredDonors?.length || 0}</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-blue-600 text-sm font-semibold">Available Slots</div>
                  <div className="text-3xl font-bold text-blue-900">{selectedCampForDonors.maxDonors - (selectedCampForDonors.registeredDonors?.length || 0)}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-green-600 text-sm font-semibold">Capacity</div>
                  <div className="text-3xl font-bold text-green-900">{selectedCampForDonors.maxDonors}</div>
                </div>
              </div>

              {/* Donors List */}
              {selectedCampForDonors.registeredDonors?.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 mb-3">Donor Details</h4>
                  {selectedCampForDonors.registeredDonors.map((registration, index) => {
                    const donor = registration.donor;
                    const user = donor?.user;
                    
                    // Calculate age from dateOfBirth
                    const calculateAge = (dateOfBirth) => {
                      if (!dateOfBirth) return 'N/A';
                      const today = new Date();
                      const birthDate = new Date(dateOfBirth);
                      let age = today.getFullYear() - birthDate.getFullYear();
                      const monthDiff = today.getMonth() - birthDate.getMonth();
                      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                      }
                      return age;
                    };
                    
                    return (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                              <User className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-gray-900 text-lg">{user?.name || 'Unknown Donor'}</div>
                              <div className="text-sm text-gray-500">
                                Registered: {new Date(registration.registeredAt).toLocaleDateString()} at {new Date(registration.registeredAt).toLocaleTimeString()}
                              </div>
                            </div>
                            {donor?.bloodGroup && (
                              <div className="px-3 py-1.5 bg-red-600 text-white rounded-lg font-bold flex items-center gap-1.5">
                                <Droplet className="w-4 h-4" />
                                {donor.bloodGroup}
                              </div>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 pl-15">
                            {user?.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-700">{user.phone}</span>
                              </div>
                            )}
                            {donor?.dateOfBirth && (
                              <div className="flex items-center gap-2 text-sm">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-700">Age: <strong>{calculateAge(donor.dateOfBirth)}</strong></span>
                              </div>
                            )}
                            {registration.slotTime && (
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-700">Slot: <strong>{registration.slotTime}</strong></span>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-3 pl-15">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              registration.status === 'donated' ? 'bg-green-100 text-green-800' :
                              registration.status === 'checked_in' ? 'bg-blue-100 text-blue-800' :
                              registration.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {registration.status || 'registered'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Donors Registered Yet</h3>
                  <p className="text-gray-600">This camp doesn't have any registered donors at the moment.</p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button 
                onClick={() => setShowDonors(false)}
                className="btn btn-secondary px-8"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCamps


