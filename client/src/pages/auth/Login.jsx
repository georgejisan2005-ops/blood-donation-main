import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { Droplets, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/home'

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm()

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const result = await login(data.email, data.password)
      if (result.success) {
        toast.success('Login successful!')
        navigate(from, { replace: true })
      } else if (result.requireVerification) {
        toast.error(result.message)
        navigate('/verify-email', { state: { email: result.email } })
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
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <div className="login-logo-icon">
              <Droplets className="login-logo-svg" />
            </div>
          </div>
          <h2 className="login-title">
            Sign in to your account
          </h2>

        </div>

        <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="login-form-fields">
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
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="login-password-field">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input login-password-input ${errors.password ? 'form-input-error' : ''}`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="login-password-icon" />
                  ) : (
                    <Eye className="login-password-icon" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="form-error">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div className="login-options">
            <div className="login-remember">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="login-checkbox"
              />
              <label htmlFor="remember-me" className="login-checkbox-label">
                Remember me
              </label>
            </div>

            <div className="login-forgot">
              <a href="#" className="login-forgot-link">
                Forgot your password?
              </a>
            </div>
          </div>

          <div className="login-submit">
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary login-submit-btn"
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <div className="login-footer">
            <p className="login-footer-text">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="login-footer-link"
              >
                Register here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login
