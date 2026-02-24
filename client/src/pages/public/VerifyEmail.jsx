import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { authService } from '../../services/auth.service'
import toast from 'react-hot-toast'
import { Mail, RefreshCw, Key } from 'lucide-react'
import './VerifyEmail.css'

function VerifyEmail() {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { loginWithToken } = useAuth()
  
  const email = location.state?.email

  useEffect(() => {
    if (!email) {
      toast.error("Email not found. Please register or login again.")
      navigate('/login')
    }
  }, [email, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!otp || otp.length !== 6) {
        return toast.error("Please enter a valid 6-digit OTP")
    }

    setLoading(true)
    try {
      const response = await authService.verifyOtp({ email, otp })
      toast.success(response.message)
      
      // Auto login
      if (response.token && response.user) {
         loginWithToken(response.user, response.token)
         navigate('/dashboard')
      } else {
         navigate('/login')
      }

    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
      setResending(true)
      try {
          await authService.resendOtp({ email })
          toast.success("OTP resent successfully")
      } catch (error) {
          toast.error(error.response?.data?.message || "Failed to resend OTP")
      } finally {
          setResending(false)
      }
  }

  if (!email) return null;

  return (
    <div className="verify-container">
      <div className="verify-card">
        <div className="verify-header">
            <div className="verify-icon-wrapper">
                <Mail className="verify-icon" />
            </div>
            <h2 className="verify-title">Verify your Email</h2>
            <p className="verify-subtitle">
                We've sent a verification code to <span className="verify-email-highlight">{email}</span>
            </p>
        </div>

        <form className="verify-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="otp" className="form-label">
                One Time Password (OTP)
            </label>
            <div className="otp-input-wrapper">
                <Key className="input-icon" />
                <input
                  type="text"
                  id="otp"
                  maxLength="6"
                  className="otp-input"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  required
                />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="verify-btn"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="verify-footer">
             <button 
                onClick={handleResend}
                disabled={resending}
                className="resend-btn"
             >
                <RefreshCw className={`refresh-icon ${resending ? 'spinning' : ''}`} />
                Resend Verification Code
             </button>

             <Link to="/register" className="secondary-link">
                Result incorrect email? Register again
             </Link>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail
