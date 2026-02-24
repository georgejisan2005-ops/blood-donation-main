import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { authService } from '../../services/auth.service'
import { donorService } from '../../services/donor.service'
import { useForm } from 'react-hook-form'
import { Save, User, Heart, Shield, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

function Profile() {
  const { user, login } = useAuth()
  const [loading, setLoading] = useState(false)
  
  // Basic Info Form
  const {
    register: registerBasic,
    handleSubmit: handleSubmitBasic,
    formState: { errors: errorsBasic },
    setValue: setValueBasic
  } = useForm()

  // Password Change Form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: errorsPassword },
    reset: resetPassword
  } = useForm()

  // Donor Info Form
  const {
    register: registerDonor,
    handleSubmit: handleSubmitDonor,
    formState: { errors: errorsDonor },
    setValue: setValueDonor
  } = useForm()

  const [donorProfile, setDonorProfile] = useState(null)
  const [savingBasic, setSavingBasic] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [savingDonor, setSavingDonor] = useState(false)

  useEffect(() => {
    if (user) {
      setValueBasic('name', user.name)
      setValueBasic('phone', user.phone)
      setValueBasic('department', user.department)
      setValueBasic('year', user.year || '')
      
      const isDonor = user.roles && user.roles.includes('donor');
      if (isDonor) {
        fetchDonorProfile()
      }
    }
  }, [user, setValueBasic])

  const fetchDonorProfile = async () => {
    try {
      const data = await donorService.getProfile()
      const profile = data.donor
      setDonorProfile(profile)
      
      if (profile) {
        Object.keys(profile).forEach(key => {
          if (profile[key] !== null && profile[key] !== undefined) {
             if (key === 'dateOfBirth') {
              const date = new Date(profile[key])
              const formattedDate = date.toISOString().split('T')[0]
              setValueDonor(key, formattedDate)
            } else if (key === 'location') {
              setValueDonor('location.address', profile.location.address)
              setValueDonor('location.city', profile.location.city)
              setValueDonor('location.state', profile.location.state)
              setValueDonor('location.pincode', profile.location.pincode)
            } else if (key === 'emergencyContact') {
              setValueDonor('emergencyContact.name', profile.emergencyContact.name)
              setValueDonor('emergencyContact.phone', profile.emergencyContact.phone)
              setValueDonor('emergencyContact.relationship', profile.emergencyContact.relationship)
            } else {
              setValueDonor(key, profile[key])
            }
          }
        })
      }
    } catch (error) {
      console.error('Failed to fetch donor profile:', error)
      toast.error('Failed to load donor profile')
    }
  }

  const onUpdateBasic = async (data) => {
    try {
      setSavingBasic(true)
      const response = await authService.updateProfile(data)
      // Update local user context if possible, or just rely on response
      // Assuming updateProfile returns updated user, we might want to update context
      // For now, simpler to just toast
      toast.success('Basic profile updated successfully')
      // Optionally reload window or re-fetch user if context doesn't auto-update
    } catch (error) {
       console.error(error);
       toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setSavingBasic(false)
    }
  }

  const onChangePassword = async (data) => {
    try {
        setSavingPassword(true)
        if (data.newPassword !== data.confirmPassword) {
            toast.error("New passwords do not match")
            return
        }
        await authService.changePassword({
            currentPassword: data.currentPassword,
            newPassword: data.newPassword
        })
        toast.success('Password changed successfully')
        resetPassword()
    } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to change password')
    } finally {
        setSavingPassword(false)
    }
  }

  const onUpdateDonor = async (data) => {
    try {
      setSavingDonor(true)
      await donorService.updateProfile(data)
      toast.success('Donor profile updated successfully')
      fetchDonorProfile()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update donor profile')
    } finally {
      setSavingDonor(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-2">Manage your profile and account preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card">
              <div className="card-body text-center">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    user?.roles?.includes('admin') ? 'bg-purple-100' : 'bg-red-100'
                }`}>
                  {user?.roles?.includes('admin') ? (
                      <Shield className={`w-12 h-12 ${user?.roles?.includes('admin') ? 'text-purple-600' : 'text-red-600'}`} />
                  ) : (
                      <User className="w-12 h-12 text-red-600" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {user?.name}
                </h3>
                <div className="flex flex-wrap justify-center gap-2 mb-2">
                  {user?.roles?.map(role => (
                    <span key={role} className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                      role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      role === 'donor' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {role}
                    </span>
                  ))}
                  {!user?.roles && <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">User</span>}
                </div>
                
                {/* Become a Donor Button */}
                {user && (!user.roles?.includes('donor')) && !user.roles?.includes('admin') && (
                  <button 
                    onClick={async () => {
                      if(!confirm('Are you sure you want to become a donor? Using this feature will create a donor profile for you.')) return;
                      try {
                        setLoading(true);
                        await authService.addRole('donor');
                        toast.success('You represent now a Donor! Please update your profile.');
                        window.location.reload(); 
                      } catch(e) {
                        toast.error('Failed to update role');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="mt-4 w-full py-2 px-4 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Heart size={16} />
                    Become a Donor
                  </button>
                )}
                
                {/* Become a Recipient Button */}
                {user && (!user.roles?.includes('recipient')) && !user.roles?.includes('admin') && (
                  <button 
                    onClick={async () => {
                      if(!confirm('Do you want to enable Blood Request features?')) return;
                      try {
                        setLoading(true);
                        await authService.addRole('recipient');
                        toast.success('You are now a Recipient! You can create blood requests.');
                        window.location.reload(); 
                      } catch(e) {
                        toast.error('Failed to update role');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="mt-4 w-full py-2 px-4 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <User size={16} />
                    Become a Recipient
                  </button>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100 text-left text-sm space-y-2">
                     <p><span className="font-semibold">Email:</span> {user?.email}</p>
                     <p><span className="font-semibold">Department:</span> {user?.department}</p>
                     {user?.year && <p><span className="font-semibold">Year:</span> {user?.year}</p>}
                </div>
              </div>
            </div>
            
            {/* Password Change Card */}
             <div className="card">
                <div className="card-header border-b border-gray-100 pb-3">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        Change Password
                    </h2>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-4">
                        <div>
                            <label className="form-label text-sm">Current Password</label>
                            <input 
                                {...registerPassword('currentPassword', { required: 'Required' })}
                                type="password" 
                                className="form-input text-sm" 
                            />
                            {errorsPassword.currentPassword && <span className="text-xs text-red-500">{errorsPassword.currentPassword.message}</span>}
                        </div>
                        <div>
                            <label className="form-label text-sm">New Password</label>
                            <input 
                                {...registerPassword('newPassword', { required: 'Required', minLength: { value: 6, message: 'Min 6 chars'} })}
                                type="password" 
                                className="form-input text-sm" 
                            />
                             {errorsPassword.newPassword && <span className="text-xs text-red-500">{errorsPassword.newPassword.message}</span>}
                        </div>
                         <div>
                            <label className="form-label text-sm">Confirm Password</label>
                            <input 
                                {...registerPassword('confirmPassword', { required: 'Required' })}
                                type="password" 
                                className="form-input text-sm" 
                            />
                             {errorsPassword.confirmPassword && <span className="text-xs text-red-500">{errorsPassword.confirmPassword.message}</span>}
                        </div>
                        <button type="submit" disabled={savingPassword} className="btn btn-outline w-full text-sm">
                            {savingPassword ? 'Changing...' : 'Update Password'}
                        </button>
                    </form>
                </div>
             </div>
          </div>

          {/* Forms Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Basic Info */}
            <form onSubmit={handleSubmitBasic(onUpdateBasic)} className="card">
              <div className="card-header border-b border-gray-100 pb-3">
                 <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Basic Information
                 </h2>
              </div>
              <div className="card-body space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="form-label">Full Name</label>
                        <input
                            {...registerBasic('name', { required: 'Name is required' })}
                            className={`form-input ${errorsBasic.name ? 'border-red-500' : ''}`}
                        />
                        {errorsBasic.name && <p className="form-error">{errorsBasic.name.message}</p>}
                     </div>
                     <div>
                        <label className="form-label">Phone</label>
                        <input
                            {...registerBasic('phone', { required: 'Phone is required' })}
                            className={`form-input ${errorsBasic.phone ? 'border-red-500' : ''}`}
                        />
                        {errorsBasic.phone && <p className="form-error">{errorsBasic.phone.message}</p>}
                     </div>
                     <div>
                        <label className="form-label">Department</label>
                         <input
                            {...registerBasic('department', { required: 'Department is required' })}
                            className={`form-input ${errorsBasic.department ? 'border-red-500' : ''}`}
                        />
                         {errorsBasic.department && <p className="form-error">{errorsBasic.department.message}</p>}
                     </div>
                     <div>
                        <label className="form-label">Year (Optional)</label>
                         <input
                            {...registerBasic('year')}
                            className="form-input"
                            placeholder="e.g. 3rd Year"
                        />
                     </div>
                 </div>
                 <div className="flex justify-end pt-2">
                    <button type="submit" disabled={savingBasic} className="btn btn-primary">
                        {savingBasic ? 'Saving...' : 'Save Changes'}
                    </button>
                 </div>
              </div>
            </form>

            {/* Donor Specific Info */}
            {(user?.roles?.includes('donor')) && (
               <form onSubmit={handleSubmitDonor(onUpdateDonor)} className="card">
                  <div className="card-header border-b border-gray-100 pb-3">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Heart className="w-5 h-5 text-red-500" />
                        Donor Information
                    </h2>
                  </div>
                  <div className="card-body space-y-6">
                    {/* Health Stats */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-gray-700">Physical stats</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div>
                                <label className="form-label">Blood Group</label>
                                <select
                                    {...registerDonor('bloodGroup', { required: 'Required' })}
                                    className="form-select"
                                >
                                    <option value="">Select</option>
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
                             <div>
                                <label className="form-label">Weight (kg)</label>
                                <input
                                    {...registerDonor('weight', { required: 'Required', min: 45 })}
                                    type="number"
                                    className="form-input"
                                />
                             </div>
                             <div>
                                <label className="form-label">Date of Birth</label>
                                <input
                                    {...registerDonor('dateOfBirth', { required: 'Required' })}
                                    type="date"
                                    className="form-input"
                                />
                             </div>
                              <div>
                                <label className="form-label">Height (cm)</label>
                                <input
                                    {...registerDonor('height', { required: 'Required', min: 100 })}
                                    type="number"
                                    className="form-input"
                                />
                             </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-4 border-t border-gray-100 pt-4">
                        <h3 className="font-medium text-gray-700">Location</h3>
                        <div className="grid grid-cols-1 gap-4">
                             <div>
                                <label className="form-label">Address</label>
                                <textarea
                                    {...registerDonor('location.address', { required: 'Required' })}
                                    className="form-textarea"
                                    rows="2"
                                />
                             </div>
                             <div className="grid grid-cols-3 gap-4">
                                 <div>
                                    <label className="form-label">City</label>
                                    <input {...registerDonor('location.city', { required: 'Required' })} className="form-input" />
                                 </div>
                                 <div>
                                    <label className="form-label">State</label>
                                    <input {...registerDonor('location.state', { required: 'Required' })} className="form-input" />
                                 </div>
                                 <div>
                                    <label className="form-label">Pincode</label>
                                    <input {...registerDonor('location.pincode', { required: 'Required' })} className="form-input" />
                                 </div>
                             </div>
                        </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="space-y-4 border-t border-gray-100 pt-4">
                        <h3 className="font-medium text-gray-700">Emergency Contact</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="form-label">Name</label>
                                <input
                                    {...registerDonor('emergencyContact.name', { required: 'Required' })}
                                    className="form-input"
                                />
                             </div>
                             <div>
                                <label className="form-label">Phone</label>
                                <input
                                    {...registerDonor('emergencyContact.phone', { required: 'Required' })}
                                    className="form-input"
                                />
                             </div>
                             <div className="md:col-span-2">
                                <label className="form-label">Relationship</label>
                                <input
                                    {...registerDonor('emergencyContact.relationship', { required: 'Required' })}
                                    className="form-input"
                                    placeholder="e.g. Parent"
                                />
                             </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button type="submit" disabled={savingDonor} className="btn btn-primary">
                            {savingDonor ? 'Saving...' : 'Save Donor Details'}
                        </button>
                    </div>
                  </div>
               </form>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
