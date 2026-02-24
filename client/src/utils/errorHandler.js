import toast from 'react-hot-toast'

// Error handling utility for consistent error messages
export const handleApiError = (error, customMessage = null) => {
  console.error('API Error:', error)

  // If there's a custom message, use it
  if (customMessage) {
    toast.error(customMessage)
    return
  }

  // Handle different error types
  if (error.response) {
    // Server responded with error status
    const status = error.response.status
    const data = error.response.data

    switch (status) {
      case 400:
        // Bad request - validation errors
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map(err => err.msg || err.message).join(', ')
          toast.error(errorMessages)
        } else {
          toast.error(data.message || 'Please check your input and try again.')
        }
        break

      case 401:
        // Unauthorized - handled by interceptor
        toast.error('Please log in to continue.')
        break

      case 403:
        // Forbidden
        toast.error('You do not have permission to perform this action.')
        break

      case 404:
        // Not found
        toast.error('The requested resource was not found.')
        break

      case 429:
        // Rate limited
        const retryAfter = error.response.headers['retry-after']
        if (retryAfter) {
          toast.error(`Too many requests. Please wait ${retryAfter} seconds and try again.`)
        } else {
          toast.error('Too many requests. Please wait a moment and try again.')
        }
        break

      case 500:
        // Internal server error
        toast.error('Server error. Please try again later.')
        break

      case 502:
      case 503:
      case 504:
        // Gateway/Bad Gateway errors
        toast.error('Service temporarily unavailable. Please try again later.')
        break

      default:
        // Other server errors
        toast.error(data.message || 'An unexpected error occurred. Please try again.')
    }
  } else if (error.request) {
    // Network error - no response received
    toast.error('Network error. Please check your connection and try again.')
  } else {
    // Other errors
    toast.error(error.message || 'An unexpected error occurred. Please try again.')
  }
}

// Success message handler
export const handleApiSuccess = (message) => {
  toast.success(message)
}

// Loading state handler
export const showLoadingToast = (message = 'Loading...') => {
  return toast.loading(message)
}

// Dismiss loading toast
export const dismissLoadingToast = (toastId) => {
  toast.dismiss(toastId)
}
