import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { Droplets, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm()

  const password = watch('password')

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const result = await registerUser(data)
      if (result.success) {
        if (result.requireVerification) {
           toast.success('Registration successful! Please verify your email.')
           navigate('/verify-email', { state: { email: result.email } })
        } else {
           toast.success('Registration successful!')
           navigate('/home')
        }
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <div className="register-logo">
            <div className="register-logo-icon">
              <Droplets className="register-logo-svg" />
            </div>
          </div>
          <h2 className="register-title">
            Create your account
          </h2>

        </div>

        <form className="register-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="register-form-fields">
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Full Name
              </label>
              <input
                {...register('name', {
                  required: 'Name is required',
                  minLength: {
                    value: 2,
                    message: 'Name must be at least 2 characters'
                  }
                })}
                type="text"
                className={`form-input ${errors.name ? 'form-input-error' : ''}`}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="form-error">{errors.name.message}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
                className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                Phone Number
              </label>
              <input
                {...register('phone', {
                  required: 'Phone number is required',
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: 'Please enter a valid 10-digit phone number'
                  }
                })}
                type="tel"
                className={`form-input ${errors.phone ? 'form-input-error' : ''}`}
                placeholder="Enter your phone number"
              />
              {errors.phone && (
                <p className="form-error">{errors.phone.message}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="department" className="form-label">
                Department
              </label>
              <input
                {...register('department', {
                  required: 'Department is required'
                })}
                type="text"
                className={`form-input ${errors.department ? 'form-input-error' : ''}`}
                placeholder="e.g., Computer Science, Biology"
              />
              {errors.department && (
                <p className="form-error">{errors.department.message}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="year" className="form-label">
                Year (Optional)
              </label>
              <select
                {...register('year')}
                className="form-select"
              >
                <option value="">Select year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Faculty">Faculty</option>
                <option value="Alumni">Alumini </option>
              </select>
                
            </div>

            <div className="form-group">
              <label htmlFor="role" className="form-label">
                I want to
              </label>
              <select
                {...register('role', {
                  required: 'Please select your role'
                })}
                className={`form-select ${errors.role ? 'form-input-error' : ''}`}
              >
                <option value="">Select role</option>
                <option value="donor">Donate Blood</option>
                <option value="recipient">Request Blood</option>
              </select>
              {errors.role && (
                <p className="form-error">{errors.role.message}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="register-password-field">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input register-password-input ${errors.password ? 'form-input-error' : ''}`}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  className="register-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="register-password-icon" />
                  ) : (
                    <Eye className="register-password-icon" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="form-error">{errors.password.message}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <input
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match'
                })}
                type="password"
                className={`form-input ${errors.confirmPassword ? 'form-input-error' : ''}`}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="form-error">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div className="register-terms">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="register-checkbox"
            />
            <label htmlFor="terms" className="register-checkbox-label">
              I agree to the{' '}
              <a href="#" className="register-terms-link">
                Terms and Conditions
              </a>{' '}
              and{' '}
              <a href="#" className="register-terms-link">
                Privacy Policy
              </a>
            </label>
          </div>

          <div className="register-submit">
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary register-submit-btn"
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </div>

          <div className="register-footer">
            <p className="register-footer-text">
              Already have an account?{' '}
              <Link
                to="/login"
                className="register-footer-link"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register
