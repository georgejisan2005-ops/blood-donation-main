import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import RateLimitIndicator from './components/RateLimitIndicator'
import Home from './pages/public/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import VerifyEmail from './pages/public/VerifyEmail'
import Dashboard from './pages/dashboard/Dashboard'
import Profile from './pages/dashboard/Profile'
import BloodRequests from './pages/dashboard/BloodRequests'

import CreateRequest from './pages/dashboard/CreateRequest'
import RequestDetails from './pages/dashboard/RequestDetails'
import EditRequest from './pages/dashboard/EditRequest'
import DonationCamps from './pages/public/DonationCamps'
import CampDetails from './pages/public/CampDetails'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminDonors from './pages/admin/AdminDonors'
import AdminRequests from './pages/admin/AdminRequests'
import AdminCamps from './pages/admin/AdminCamps'
import AdminAnnouncements from './pages/admin/AdminAnnouncements'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import DonationHistory from './pages/dashboard/DonationHistory'
import AdminDonationVerification from './pages/admin/AdminDonationVerification'
import NotFound from './pages/public/NotFound'

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <RateLimitIndicator />
        <Routes>
          {/* Redirect root to login */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          {/* Auth Routes - No Layout */}
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Public Routes with Layout */}
          <Route element={<Layout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/camps" element={<DonationCamps />} />
            <Route path="/camps/:id" element={<CampDetails />} />
          </Route>

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="requests" element={<BloodRequests />} />
            <Route path="available-requests" element={<BloodRequests role="donor" />} />
            <Route path="my-requests" element={<BloodRequests role="recipient" />} />

            <Route path="requests/create" element={<CreateRequest />} />
            <Route path="requests/edit/:id" element={<EditRequest />} />
            <Route path="requests/:id" element={<RequestDetails />} />
            <Route path="camps" element={<DonationCamps />} />
            <Route path="donations" element={<DonationHistory />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="donors" element={<AdminDonors />} />
            <Route path="requests" element={<AdminRequests />} />
            <Route path="verification" element={<AdminDonationVerification />} />
            <Route path="camps" element={<AdminCamps />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="analytics" element={<AdminAnalytics />} />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App
