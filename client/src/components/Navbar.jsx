import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { 
  Menu, 
  X, 
  Bell, 
  User, 
  LogOut, 
  Settings,
  Droplets,
  Calendar,
  FileText,
  Shield
} from 'lucide-react'
import './Navbar.css'

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const { notifications, unreadCount, markAsRead } = useNotifications()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id)
    setIsNotificationOpen(false)
    
    // Navigate based on notification type
    if (notification.data?.requestId) {
      navigate('/dashboard/requests')
    } else if (notification.data?.campId) {
      navigate('/camps')
    }
  }

  const isActive = (path) => location.pathname === path
  
  const hasRole = (role) => {
    return user?.roles && user.roles.includes(role)
  }

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          {/* Logo */}
          <Link to="/home" className="navbar-logo">
            <div className="navbar-logo-icon">
              <Droplets className="navbar-logo-icon-svg" />
            </div>
            <span className="navbar-logo-text">EDUDONOR</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="navbar-desktop">
            <Link
              to="/home"
              className={`nav-link ${isActive('/home') ? 'active' : ''}`}
            >
              Home
            </Link>
            {(!isAuthenticated || !hasRole('admin')) && (
              <Link
                to="/camps"
                className={`nav-link ${isActive('/camps') ? 'active' : ''}`}
              >
                Donation Camps
              </Link>
            )}
            
            {isAuthenticated ? (
              <>
                {!hasRole('admin') && (
                  <Link
                    to="/dashboard"
                    className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                  >
                    Dashboard
                  </Link>
                )}
                
                {hasRole('admin') && (
                  <Link
                    to="/admin"
                    className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                  >
                    Admin Dashboard
                  </Link>
                )}

                {/* Notifications */}
                <div className="navbar-notifications">
                  <button
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="navbar-notification-btn"
                  >
                    <Bell className="navbar-notification-icon" />
                    {unreadCount > 0 && (
                      <span className="navbar-notification-badge">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {isNotificationOpen && (
                    <div className="navbar-notification-dropdown">
                      <div className="navbar-notification-header">
                        <h3 className="navbar-notification-title">Notifications</h3>
                      </div>
                      <div className="navbar-notification-content">
                        {notifications.length === 0 ? (
                          <div className="navbar-notification-empty">
                            No notifications
                          </div>
                        ) : (
                          notifications.slice(0, 5).map((notification) => (
                            <div
                              key={notification._id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`navbar-notification-item ${
                                !notification.isRead ? 'unread' : ''
                              }`}
                            >
                              <div className="navbar-notification-item-content">
                                <div className={`navbar-notification-dot ${
                                  !notification.isRead ? 'unread' : ''
                                }`} />
                                <div className="navbar-notification-item-text">
                                  <h4 className="navbar-notification-item-title">
                                    {notification.title}
                                  </h4>
                                  <p className="navbar-notification-item-message">
                                    {notification.message}
                                  </p>
                                  <p className="navbar-notification-item-time">
                                    {new Date(notification.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="navbar-user">
                  <Link 
                    to={hasRole('admin') ? '/admin/profile' : '/dashboard/profile'} 
                    className="navbar-user-btn"
                    style={{ textDecoration: 'none' }}
                  >
                    <User className="navbar-user-icon" />
                    <span className="navbar-user-name">{user?.name}</span>
                  </Link>
                </div>

                <button
                  onClick={handleLogout}
                  className="navbar-logout-btn"
                >
                  <LogOut className="navbar-logout-icon" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="navbar-auth">
                <Link
                  to="/login"
                  className="navbar-auth-link"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="navbar-mobile-toggle">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="navbar-mobile-btn"
            >
              {isMenuOpen ? <X className="navbar-mobile-icon" /> : <Menu className="navbar-mobile-icon" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="navbar-mobile">
            <div className="navbar-mobile-content">
              <Link
                to="/home"
                className={`navbar-mobile-link ${isActive('/home') ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              {(!isAuthenticated || !hasRole('admin')) && (
                <Link
                  to="/camps"
                  className={`navbar-mobile-link ${isActive('/camps') ? 'active' : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Donation Camps
                </Link>
              )}
              
              {isAuthenticated ? (
                <>
                  {!hasRole('admin') && (
                    <Link
                      to="/dashboard"
                      className={`navbar-mobile-link ${isActive('/dashboard') ? 'active' : ''}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                  
                  {hasRole('admin') && (
                    <Link
                      to="/admin"
                      className={`navbar-mobile-link ${isActive('/admin') ? 'active' : ''}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}

                  <div className="navbar-mobile-user">
                    <Link 
                      to={hasRole('admin') ? '/admin/profile' : '/dashboard/profile'}
                      className="navbar-mobile-user-info"
                      onClick={() => setIsMenuOpen(false)}
                      style={{ textDecoration: 'none' }}
                    >
                      <User className="navbar-mobile-user-icon" />
                      <span className="navbar-mobile-user-name">{user?.name}</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="navbar-mobile-logout"
                    >
                      <LogOut className="navbar-mobile-logout-icon" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="navbar-mobile-auth">
                  <Link
                    to="/login"
                    className="navbar-mobile-auth-link"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-primary navbar-mobile-register"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
