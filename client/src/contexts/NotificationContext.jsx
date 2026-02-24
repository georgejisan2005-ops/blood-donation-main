import { createContext, useContext, useReducer, useEffect } from 'react'
import { notificationService } from '../services/notification.service'
import { useAuth } from './AuthContext'

const NotificationContext = createContext()

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false
}

function notificationReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload.notifications,
        unreadCount: action.payload.unreadCount
      }
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1
      }
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification._id === action.payload
            ? { ...notification, isRead: true, readAt: new Date() }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }
    case 'MARK_ALL_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification => ({
          ...notification,
          isRead: true,
          readAt: new Date()
        })),
        unreadCount: 0
      }
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification._id !== action.payload
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }
    default:
      return state
  }
}

export function NotificationProvider({ children }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications()
    }
  }, [isAuthenticated])

  const fetchNotifications = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const data = await notificationService.getNotifications()
      dispatch({
        type: 'SET_NOTIFICATIONS',
        payload: {
          notifications: data.notifications,
          unreadCount: data.unreadCount
        }
      })
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId)
      dispatch({ type: 'MARK_AS_READ', payload: notificationId })
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      dispatch({ type: 'MARK_ALL_READ' })
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const removeNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId)
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: notificationId })
    } catch (error) {
      console.error('Failed to remove notification:', error)
    }
  }

  const addNotification = (notification) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification })
  }

  const value = {
    ...state,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    addNotification
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
