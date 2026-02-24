import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { adminService } from '../../services/admin.service'
import {
  Users,
  Heart,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react'
import toast from 'react-hot-toast'

function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const data = await adminService.getDashboardStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch admin dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard-page">
      <div className="container">
        {/* Header */}
        <div className="admin-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="admin-title">
              Admin Dashboard
            </h1>
            <p className="admin-subtitle">
              Welcome back, {user?.name}! Here's an overview of the platform.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => navigate('/admin/users')} 
              className="btn bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Manage Users
            </button>
            <button 
              onClick={() => navigate('/admin/requests')} 
              className="btn bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
            >
              <Heart className="w-4 h-4" />
              Manage Requests
            </button>
            <button 
              onClick={() => navigate('/admin/camps')} 
              className="btn bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Manage Camps
            </button>
            <button 
              onClick={() => navigate('/admin/verification')} 
              className="btn bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Verify Donations
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-content">
              <div className="admin-stat-icon admin-stat-icon-blue">
                <Users className="admin-stat-icon-svg" />
              </div>
              <div className="admin-stat-text">
                <p className="admin-stat-label">Total Users</p>
                <p className="admin-stat-value">{stats.stats?.totalUsers || 0}</p>
              </div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-content">
              <div className="admin-stat-icon admin-stat-icon-red">
                <Heart className="admin-stat-icon-svg" />
              </div>
              <div className="admin-stat-text">
                <p className="admin-stat-label">Total Donors</p>
                <p className="admin-stat-value">{stats.stats?.totalDonors || 0}</p>
              </div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-content">
              <div className="admin-stat-icon admin-stat-icon-green">
                <CheckCircle className="admin-stat-icon-svg" />
              </div>
              <div className="admin-stat-text">
                <p className="admin-stat-label">Active Requests</p>
                <p className="admin-stat-value">{stats.stats?.activeRequests || 0}</p>
              </div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-content">
              <div className="admin-stat-icon admin-stat-icon-yellow">
                <Calendar className="admin-stat-icon-svg" />
              </div>
              <div className="admin-stat-text">
                <p className="admin-stat-label">Upcoming Camps</p>
                <p className="admin-stat-value">{stats.stats?.upcomingCamps || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Blood Group Distribution */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Blood Group Distribution</h2>
            </div>
            <div className="card-body">
              {stats.bloodGroupStats && stats.bloodGroupStats.length > 0 ? (
                <div className="space-y-3">
                  {stats.bloodGroupStats.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{item._id}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-600 h-2 rounded-full"
                            style={{ width: `${(item.count / Math.max(...stats.bloodGroupStats.map(s => s.count))) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No data available</p>
              )}
            </div>
          </div>

          {/* Urgency Distribution */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Request Urgency</h2>
            </div>
            <div className="card-body">
              {stats.urgencyStats && stats.urgencyStats.length > 0 ? (
                <div className="space-y-3">
                  {stats.urgencyStats.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 capitalize">{item._id}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${item._id === 'critical' ? 'bg-red-600' :
                                item._id === 'high' ? 'bg-orange-500' :
                                  item._id === 'medium' ? 'bg-yellow-500' :
                                    'bg-blue-500'
                              }`}
                            style={{ width: `${(item.count / Math.max(...stats.urgencyStats.map(s => s.count))) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Recent Blood Requests</h2>
            </div>
            <div className="card-body">
              {stats.recentRequests && stats.recentRequests.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentRequests.map((request) => (
                    <div key={request._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <Heart className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{request.patientName}</h4>
                          <p className="text-sm text-gray-600">
                            {request.bloodGroup} • {request.city} • {request.requester?.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`badge ${request.status === 'completed' ? 'badge-success' :
                            request.status === 'pending' ? 'badge-warning' :
                              'badge-error'
                          }`}>
                          {request.status}
                        </span>
                        <span className={`badge ${request.urgency === 'critical' ? 'badge-error' :
                            request.urgency === 'high' ? 'badge-warning' :
                              'badge-info'
                          }`}>
                          {request.urgency}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No recent requests</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}

      </div>
    </div>
  )
}

export default AdminDashboard
