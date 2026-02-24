import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { recipientService } from '../../services/recipient.service'
import { handleApiError, handleApiSuccess } from '../../utils/errorHandler'
import { Heart, Plus, ArrowLeft } from 'lucide-react'
import './CreateRequest.css'



function CreateRequest() {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm()

  const onSubmit = async (data) => {
    try {
      setIsLoading(true)
      await recipientService.createRequest(data)
      handleApiSuccess('Blood request created successfully!')
      navigate('/dashboard/my-requests')
    } catch (error) {
      handleApiError(error, 'Failed to create blood request')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="dashboard-page overflow-x-hidden">
      <div className="container animate-fade-in">
        <div className="requests-page-card">
          {/* Header */}
          <div className="page-header-container">
            <div className="page-header-icon animate-slide-up">
              <Plus size={32} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="page-title">Create Blood Request</h1>
                  <p className="page-description">Submit a request for blood donation</p>
                </div>
                <button
                  onClick={() => navigate('/dashboard/requests')}
                  className="create-request-back-btn"
                >
                  <ArrowLeft size={18} />
                  Back to Requests
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="create-request-new-form animate-slide-up">
            {/* Patient Information */}
            <div className="create-request-section-new">
              <div className="create-request-section-header-new">
                <Heart className="section-icon-new" />
                <h2 className="create-request-section-title-new">Patient Information</h2>
              </div>
              <div className="create-request-section-body-new">
                <div>
                  <label className="form-label-new">Patient Name *</label>
                  <input
                    {...register('patientName', { required: 'Patient name is required' })}
                    type="text"
                    className={`form-input-new ${errors.patientName ? 'form-input-error-new' : ''}`}
                    placeholder="Enter patient's full name"
                  />
                  {errors.patientName && (
                    <p className="form-error-new">{errors.patientName.message}</p>
                  )}
                </div>

                <div className="create-request-grid-new">
                  <div>
                    <label className="form-label-new">Blood Group Required *</label>
                    <select
                      {...register('bloodGroup', { required: 'Blood group is required' })}
                      className={`form-select-new ${errors.bloodGroup ? 'form-input-error-new' : ''}`}
                    >
                      <option value="">Select blood group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                    {errors.bloodGroup && (
                      <p className="form-error-new">{errors.bloodGroup.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="form-label-new">Units Required *</label>
                    <select
                      {...register('unitsRequired', { required: 'Units required is required' })}
                      className={`form-select-new ${errors.unitsRequired ? 'form-input-error-new' : ''}`}
                    >
                      <option value="">Select units</option>
                      <option value="1">1 Unit</option>
                      <option value="2">2 Units</option>
                      <option value="3">3 Units</option>
                      <option value="4">4 Units</option>
                      <option value="5">5 Units</option>
                    </select>
                    {errors.unitsRequired && (
                      <p className="form-error-new">{errors.unitsRequired.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="form-label-new">Urgency Level *</label>
                  <select
                    {...register('urgency', { required: 'Urgency level is required' })}
                    className={`form-select-new ${errors.urgency ? 'form-input-error-new' : ''}`}
                  >
                    <option value="">Select urgency</option>
                    <option value="low">Low - Can wait a few days</option>
                    <option value="medium">Medium - Needed within 24-48 hours</option>
                    <option value="high">High - Needed within 12-24 hours</option>
                    <option value="critical">Critical - Needed immediately</option>
                  </select>
                  {errors.urgency && (
                    <p className="form-error-new">{errors.urgency.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Hospital Information */}
            <div className="create-request-section-new">
              <div className="create-request-section-header-new">
                <Plus className="section-icon-new" />
                <h2 className="create-request-section-title-new">Hospital Information</h2>
              </div>
              <div className="create-request-section-body-new">
                <div>
                  <label className="form-label-new">Hospital Name *</label>
                  <input
                    {...register('hospitalName', { required: 'Hospital name is required' })}
                    type="text"
                    className={`form-input-new ${errors.hospitalName ? 'form-input-error-new' : ''}`}
                    placeholder="Enter hospital name"
                  />
                  {errors.hospitalName && (
                    <p className="form-error-new">{errors.hospitalName.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label-new">Hospital Address *</label>
                  <textarea
                    {...register('hospitalAddress', { required: 'Hospital address is required' })}
                    className={`form-textarea-new ${errors.hospitalAddress ? 'form-input-error-new' : ''}`}
                    placeholder="Enter complete hospital address"
                    rows={3}
                  />
                  {errors.hospitalAddress && (
                    <p className="form-error-new">{errors.hospitalAddress.message}</p>
                  )}
                </div>

                <div className="create-request-grid-3-new">
                  <div>
                    <label className="form-label-new">City *</label>
                    <input
                      {...register('city', { required: 'City is required' })}
                      type="text"
                      className={`form-input-new ${errors.city ? 'form-input-error-new' : ''}`}
                      placeholder="Enter city"
                    />
                    {errors.city && (
                      <p className="form-error-new">{errors.city.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="form-label-new">State *</label>
                    <input
                      {...register('state', { required: 'State is required' })}
                      type="text"
                      className={`form-input-new ${errors.state ? 'form-input-error-new' : ''}`}
                      placeholder="Enter state"
                    />
                    {errors.state && (
                      <p className="form-error-new">{errors.state.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="form-label-new">Pincode *</label>
                    <input
                      {...register('pincode', {
                        required: 'Pincode is required',
                        pattern: {
                          value: /^[0-9]{6}$/,
                          message: 'Please enter a valid 6-digit pincode'
                        }
                      })}
                      type="text"
                      className={`form-input-new ${errors.pincode ? 'form-input-error-new' : ''}`}
                      placeholder="Enter pincode"
                    />
                    {errors.pincode && (
                      <p className="form-error-new">{errors.pincode.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="create-request-section-new">
              <div className="create-request-section-header-new">
                 <Heart className="section-icon-new" />
                <h2 className="create-request-section-title-new">Contact Information</h2>
              </div>
              <div className="create-request-section-body-new">
                <div className="create-request-grid-new">
                  <div>
                    <label className="form-label-new">Contact Person Name *</label>
                    <input
                      {...register('contactPerson.name', { required: 'Contact person name is required' })}
                      type="text"
                      className={`form-input-new ${errors.contactPerson?.name ? 'form-input-error-new' : ''}`}
                      placeholder="Enter contact person name"
                    />
                    {errors.contactPerson?.name && (
                      <p className="form-error-new">{errors.contactPerson.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="form-label-new">Phone Number *</label>
                    <input
                      {...register('contactPerson.phone', {
                        required: 'Phone number is required',
                        pattern: {
                          value: /^[0-9]{10}$/,
                          message: 'Please enter a valid 10-digit phone number'
                        }
                      })}
                      type="tel"
                      className={`form-input-new ${errors.contactPerson?.phone ? 'form-input-error-new' : ''}`}
                      placeholder="Enter phone number"
                    />
                    {errors.contactPerson?.phone && (
                      <p className="form-error-new">{errors.contactPerson.phone.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="form-label-new">Relationship to Patient *</label>
                  <input
                    {...register('contactPerson.relationship', { required: 'Relationship is required' })}
                    type="text"
                    className={`form-input-new ${errors.contactPerson?.relationship ? 'form-input-error-new' : ''}`}
                    placeholder="e.g., Son, Daughter, Spouse, Friend"
                  />
                  {errors.contactPerson?.relationship && (
                    <p className="form-error-new">{errors.contactPerson.relationship.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="create-request-section-new">
              <div className="create-request-section-header-new">
                <Plus className="section-icon-new" />
                <h2 className="create-request-section-title-new">Additional Information</h2>
              </div>
              <div className="create-request-section-body-new">
                <div>
                  <label className="form-label-new">Required Date *</label>
                  <input
                    {...register('requiredDate', { required: 'Required date is required' })}
                    type="datetime-local"
                    className={`form-input-new ${errors.requiredDate ? 'form-input-error-new' : ''}`}
                  />
                  {errors.requiredDate && (
                    <p className="form-error-new">{errors.requiredDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label-new">Description (Optional)</label>
                  <textarea
                    {...register('description')}
                    className="form-textarea-new"
                    placeholder="Any additional information about the patient or situation"
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="create-request-actions-new">
              <button
                type="button"
                onClick={() => navigate('/dashboard/requests')}
                className="create-request-cancel-btn-new"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="create-request-submit-btn-new"
              >
                {isLoading ? (
                  <>
                    <div className="spinner-new"></div>
                    Creating Request...
                  </>
                ) : (
                  <>
                    <Heart size={20} />
                    Create Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateRequest
