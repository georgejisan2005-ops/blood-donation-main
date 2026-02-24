import { useState, useEffect } from 'react'
import { AlertCircle, Clock, CheckCircle } from 'lucide-react'

const RateLimitIndicator = () => {
  const [rateLimitInfo, setRateLimitInfo] = useState(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Listen for rate limit events
    const handleRateLimit = (event) => {
      const { remaining, resetTime, limit } = event.detail
      setRateLimitInfo({ remaining, resetTime, limit })
      setIsVisible(true)

      // Auto-hide after 5 seconds
      setTimeout(() => setIsVisible(false), 5000)
    }

    // Listen for successful requests
    const handleSuccess = () => {
      setIsVisible(false)
    }

    window.addEventListener('rateLimitWarning', handleRateLimit)
    window.addEventListener('apiSuccess', handleSuccess)

    return () => {
      window.removeEventListener('rateLimitWarning', handleRateLimit)
      window.removeEventListener('apiSuccess', handleSuccess)
    }
  }, [])

  if (!isVisible || !rateLimitInfo) return null

  const { remaining, resetTime, limit } = rateLimitInfo
  const percentage = (remaining / limit) * 100
  const isLow = percentage < 20
  const isCritical = percentage < 10

  const getStatusIcon = () => {
    if (isCritical) return <AlertCircle className="w-4 h-4 text-red-500" />
    if (isLow) return <Clock className="w-4 h-4 text-yellow-500" />
    return <CheckCircle className="w-4 h-4 text-green-500" />
  }

  const getStatusColor = () => {
    if (isCritical) return 'bg-red-50 border-red-200 text-red-800'
    if (isLow) return 'bg-yellow-50 border-yellow-200 text-yellow-800'
    return 'bg-green-50 border-green-200 text-green-800'
  }

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
      <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border shadow-lg ${getStatusColor()}`}>
        {getStatusIcon()}
        <div className="text-sm">
          <div className="font-medium">
            {isCritical ? 'Rate limit critical' : isLow ? 'Rate limit low' : 'Rate limit OK'}
          </div>
          <div className="text-xs opacity-75">
            {remaining} of {limit} requests remaining
          </div>
        </div>
        <div className="w-8 h-8 relative">
          <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-gray-300"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={isCritical ? 'text-red-500' : isLow ? 'text-yellow-500' : 'text-green-500'}
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeDasharray={`${percentage}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium">{Math.round(percentage)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RateLimitIndicator
