import { createContext, useContext, useReducer, useEffect } from 'react'
import { authService } from '../services/auth.service'

const AuthContext = createContext()

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true
}

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false
      }
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      }
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      }
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const data = await authService.getCurrentUser()
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: data.user,
              token
            }
          })
        } catch (error) {
          localStorage.removeItem('token')
          dispatch({ type: 'LOGOUT' })
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    initAuth()
  }, [])

  const login = async (email, password) => {
    try {
      const data = await authService.login({ email, password })
      const { token, user } = data

      localStorage.setItem('token', token)
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token }
      })

      return { success: true }
    } catch (error) {
      const responseData = error.response?.data
      return {
        success: false,
        message: responseData?.message || 'Login failed',
        requireVerification: responseData?.requireVerification,
        email: responseData?.email
      }
    }
  }

  const loginWithToken = (user, token) => {
    localStorage.setItem('token', token)
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: { user, token }
    })
  }

  const register = async (userData) => {
    try {
      const data = await authService.register(userData)
      
      // If verification required, do not login yet
      if (data.requireVerification) {
         return { 
           success: true, 
           requireVerification: true,
           email: data.email 
         }
      }

      const { token, user } = data

      localStorage.setItem('token', token)
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token }
      })

      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    dispatch({ type: 'LOGOUT' })
  }

  const updateUser = (userData) => {
    dispatch({
      type: 'UPDATE_USER',
      payload: userData
    })
  }

  const value = {
    ...state,
    login,
    loginWithToken,
    register,
    logout,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
