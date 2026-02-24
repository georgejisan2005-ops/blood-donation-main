import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { format, addDays } from 'date-fns'
import { useNotifications } from '../../contexts/NotificationContext'
import { donorService } from '../../services/donor.service'
import { campService } from '../../services/camp.service'
import {
  Droplets,
  Heart,
  Users,
  Calendar,
  Bell,
  Clock,
  AlertCircle
} from 'lucide-react'
import RequestsList from '../../components/RequestsList'
import './DonorDashboard.css'

function DonorDashboard({ user }) {
  const { unreadCount } = useNotifications()
  const [stats, setStats] = useState({})
  const [upcomingCamps, setUpcomingCamps] = useState([])
  const [loading, setLoading] = useState(true)
  const [profileIncomplete, setProfileIncomplete] = useState(false)

  useEffect(() => {
    fetchDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)

    try {
      // Fetch donor profile
      const statsRes = await donorService.getProfile().catch(err => {
        if (err.response?.status === 404) return { donor: null }
        throw err
      })

      // Fetch camps
      const campsRes = await campService.getUpcomingCamps(3).catch(err => ({ camps: [] }))

      // Handle stats
      if (statsRes && statsRes.donor) {
        const donor = statsRes.donor
        setStats({
          totalDonations: donor.totalDonations || 0,
          lastDonation: donor.lastDonationDate,
          isEligible: donor.isEligible,
          isAvailable: donor.isAvailable
        })
      } else {
        setProfileIncomplete(true)
        setStats({
          totalDonations: 0,
          lastDonation: null,
          isEligible: false,
          isAvailable: false
        })
      }

      // Handle camps
      setUpcomingCamps(campsRes.camps || [])

    } catch (error) {
      console.error("Dashboard data fetch error", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
        {/* Profile Incomplete Alert */}
        {/* Profile Incomplete Alert */}
        {profileIncomplete && (
           <div className="profile-alert-card">
             <div className="profile-alert-icon">
               <AlertCircle className="h-6 w-6" />
             </div>
             <div className="profile-alert-content">
               <h3>
                 Complete Your Donor Profile
               </h3>
               <p>
                 You need to complete your donor profile before you can view blood requests and participate in donations.
                 Please provide your blood group, medical information, and other required details.
               </p>
               <Link
                 to="/dashboard/profile"
                 className="profile-alert-btn"
               >
                 Complete Profile Now
               </Link>
             </div>
           </div>
        )}

        {/* Stats Grid */}
        <div className="dashboard-stats-grid">
          <div className="dashboard-stat-card stat-red">
            <div className="dashboard-stat-content">
              <div className="dashboard-stat-icon">
                <Droplets className="dashboard-stat-icon-svg" />
              </div>
              <div className="dashboard-stat-text">
                <p className="dashboard-stat-label">Total Donations</p>
                <p className="dashboard-stat-value">{stats.totalDonations || 0}</p>
              </div>
            </div>
          </div>

          <div className="dashboard-stat-card stat-green">
            <div className="dashboard-stat-content">
              <div className="dashboard-stat-icon">
                <Clock className="dashboard-stat-icon-svg" />
              </div>
              <div className="dashboard-stat-text">
                <p className="dashboard-stat-label">Next Eligibility</p>
                {stats.isEligible ? (
                  <p className="dashboard-stat-value available">Available Now</p>
                ) : (
                  <div className="flex flex-col items-start mt-1">
                    <span className="dashboard-stat-date-my">
                       {stats.lastDonation && format(addDays(new Date(stats.lastDonation), 90), 'MMM yyyy')}
                    </span>
                    <span className="dashboard-stat-value text-xl">
                      {stats.lastDonation && format(addDays(new Date(stats.lastDonation), 90), 'd')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="dashboard-stat-card stat-blue">
            <div className="dashboard-stat-content">
              <div className="dashboard-stat-icon">
                <Bell className="dashboard-stat-icon-svg" />
              </div>
              <div className="dashboard-stat-text">
                <p className="dashboard-stat-label">Notifications</p>
                <p className="dashboard-stat-value">{unreadCount}</p>
              </div>
            </div>
          </div>

          <div className="dashboard-stat-card stat-yellow">
            <div className="dashboard-stat-content">
              <div className="dashboard-stat-icon">
                <Calendar className="dashboard-stat-icon-svg" />
              </div>
              <div className="dashboard-stat-text">
                <p className="dashboard-stat-label">Upcoming Camps</p>
                <p className="dashboard-stat-value">{upcomingCamps.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <div className="card h-fit">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Donor Actions</h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                  <Link
                    to="/dashboard/profile"
                    className="donor-action-card"
                  >
                    <div className="donor-action-icon red">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="donor-action-info">
                      <h3>Update Profile</h3>
                      <p>Manage your donor information</p>
                    </div>
                  </Link>

                  <Link
                    to="/dashboard/available-requests"
                    className="donor-action-card"
                  >
                    <div className="donor-action-icon blue">
                      <Heart className="w-5 h-5" />
                    </div>
                    <div className="donor-action-info">
                      <h3>View Blood Requests</h3>
                      <p>See requests matching your blood type</p>
                    </div>
                  </Link>

                  <Link
                    to="/dashboard/donations"
                    className="donor-action-card"
                  >
                    <div className="donor-action-icon green">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="donor-action-info">
                      <h3>Donation History</h3>
                      <p>Track and verify your donations</p>
                    </div>
                  </Link>
                  
                  <Link
                    to="/camps"
                    className="donor-action-card"
                  >
                    <div className="donor-action-icon green">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="donor-action-info">
                      <h3>Donation Camps</h3>
                    </div>
                  </Link>
              </div>
            </div>
          </div>

          {/* Blood Requests List */}
          <div className="card h-fit">
             <RequestsList 
                limit={5} 
                showHeader={true} 
                showFilters={false} 
                showViewAll={true}
                role="donor"
             />
          </div>
        </div>

        {/* Upcoming Donation Camps */}
        {upcomingCamps.length > 0 && (
          <div className="mt-8">
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900">Upcoming Donation Camps</h2>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingCamps.map((camp) => (
                    <div key={camp._id} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">{camp.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{camp.description}</p>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(camp.startDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          {camp.location.city}
                        </div>
                      </div>
                      <div className="mt-4">
                        <Link
                          to={`/camps/${camp._id}`}
                          className="btn btn-sm btn-primary"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}

export default DonorDashboard
