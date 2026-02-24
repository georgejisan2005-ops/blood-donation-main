import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  retryStatusCodes: [429, 500, 502, 503, 504]
}

// Exponential backoff retry function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const retryRequest = async (config, retryCount = 0) => {
  try {
    return await axios(config)
  } catch (error) {
    const shouldRetry =
      retryCount < RETRY_CONFIG.maxRetries &&
      RETRY_CONFIG.retryStatusCodes.includes(error.response?.status)

    if (shouldRetry) {
      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(2, retryCount),
        RETRY_CONFIG.maxDelay
      )

      console.log(`Request failed with status ${error.response?.status}. Retrying in ${delay}ms... (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries})`)

      await sleep(delay)
      return retryRequest(config, retryCount + 1)
    }

    throw error
  }
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors and rate limiting
api.interceptors.response.use(
  (response) => {
    // Check for rate limit headers and dispatch event
    const remaining = response.headers['ratelimit-remaining']
    const limit = response.headers['ratelimit-limit']
    const resetTime = response.headers['ratelimit-reset']

    if (remaining !== undefined && limit !== undefined) {
      const remainingNum = parseInt(remaining)
      const limitNum = parseInt(limit)

      // Dispatch rate limit info event
      if (remainingNum < limitNum * 0.2) { // Less than 20% remaining
        window.dispatchEvent(new CustomEvent('rateLimitWarning', {
          detail: {
            remaining: remainingNum,
            limit: limitNum,
            resetTime: resetTime
          }
        }))
      }
    }

    return response
  },
  async (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/'
      return Promise.reject(error)
    }

    // Handle rate limiting (429) with retry
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after']
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : RETRY_CONFIG.baseDelay

      console.log(`Rate limited. Retrying after ${delay}ms...`)
      await sleep(delay)

      // Retry the original request
      try {
        return await retryRequest(error.config)
      } catch (retryError) {
        // If retry also fails, show user-friendly message
        if (retryError.response?.status === 429) {
          error.userMessage = 'Too many requests. Please wait a moment and try again.'
        }
        return Promise.reject(retryError)
      }
    }

    return Promise.reject(error)
  }
)

export { api }
