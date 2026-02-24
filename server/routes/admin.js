const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Donor = require('../models/Donor');
const BloodRequest = require('../models/BloodRequest');
const DonationCamp = require('../models/DonationCamp');
const Notification = require('../models/Notification');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin)
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const [
      totalUsers,
      totalDonors,
      totalRequests,
      activeRequests,
      completedRequests,
      totalCamps,
      upcomingCamps,
      recentRequests,
      recentDonors
    ] = await Promise.all([
      User.countDocuments(),
      Donor.countDocuments(),
      BloodRequest.countDocuments(),
      BloodRequest.countDocuments({ status: { $in: ['pending', 'matched', 'in_progress'] } }),
      BloodRequest.countDocuments({ status: 'completed' }),
      DonationCamp.countDocuments(),
      DonationCamp.countDocuments({ status: 'scheduled' }),
      BloodRequest.find()
        .populate('requester', 'name email')
        .sort({ createdAt: -1 })
        .limit(5),
      Donor.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    // Blood group distribution
    const bloodGroupStats = await BloodRequest.aggregate([
      { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Urgency distribution
    const urgencyStats = await BloodRequest.aggregate([
      { $group: { _id: '$urgency', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Monthly request trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await BloodRequest.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      stats: {
        totalUsers,
        totalDonors,
        totalRequests,
        activeRequests,
        completedRequests,
        totalCamps,
        upcomingCamps
      },
      bloodGroupStats,
      urgencyStats,
      monthlyTrends,
      recentRequests,
      recentDonors
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Private (Admin)
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search, isActive } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { department: new RegExp(search, 'i') }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Update user status (activate/deactivate)
// @access  Private (Admin)
router.put('/users/:id/status', adminAuth, [
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/donors
// @desc    Get all donors with pagination
// @access  Private (Admin)
router.get('/donors', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, bloodGroup, city, isVerified, isAvailable } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (isVerified !== undefined) query.isVerified = isVerified === 'true';
    if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';

    const donors = await Donor.find(query)
      .populate('user', 'name email phone department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Donor.countDocuments(query);

    res.json({
      donors,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get donors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/donors/:id/verify
// @desc    Verify donor profile
// @access  Private (Admin)
router.put('/donors/:id/verify', adminAuth, [
  body('isVerified').isBoolean().withMessage('isVerified must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isVerified } = req.body;

    const donor = await Donor.findByIdAndUpdate(
      req.params.id,
      { 
        isVerified,
        verificationDate: isVerified ? new Date() : null
      },
      { new: true }
    ).populate('user', 'name email');

    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    // Notify donor about verification status
    await Notification.createNotification(
      donor.user._id,
      'system_alert',
      'Profile Verification',
      `Your donor profile has been ${isVerified ? 'verified' : 'unverified'}`,
      { donorId: donor._id },
      'medium'
    );

    res.json({
      message: `Donor ${isVerified ? 'verified' : 'unverified'} successfully`,
      donor
    });
  } catch (error) {
    console.error('Verify donor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/requests
// @desc    Get all blood requests with pagination
// @access  Private (Admin)
router.get('/requests', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, bloodGroup, urgency, city } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (urgency) query.urgency = urgency;
    if (city) query.city = new RegExp(city, 'i');
    // Allow filtering by verification status (true/false)
    if (req.query.isVerified !== undefined) {
      query.isVerified = req.query.isVerified === 'true';
    }

    const requests = await BloodRequest.find(query)
      .populate('requester', 'name email phone')
      .populate('matchedDonors.donor', 'bloodGroup user')
      .populate('matchedDonors.donor.user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BloodRequest.countDocuments(query);

    res.json({
      requests,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/requests/:id/verify
// @desc    Verify blood request
// @access  Private (Admin)
router.put('/requests/:id/verify', adminAuth, [
  body('isVerified').isBoolean().withMessage('isVerified must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isVerified } = req.body;

    const request = await BloodRequest.findByIdAndUpdate(
      req.params.id,
      { 
        isVerified,
        verifiedBy: req.user.id,
        verificationDate: isVerified ? new Date() : null
      },
      { new: true }
    ).populate('requester', 'name email');

    if (!request) {
      return res.status(404).json({ message: 'Blood request not found' });
    }

    // Notify requester about verification status
    await Notification.createNotification(
      request.requester._id,
      'request_status_update',
      'Request Verification',
      `Your blood request has been ${isVerified ? 'verified' : 'unverified'}`,
      { requestId: request._id },
      'medium'
    );

    res.json({
      message: `Blood request ${isVerified ? 'verified' : 'unverified'} successfully`,
      request
    });
  } catch (error) {
    console.error('Verify request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/announcement
// @desc    Send system-wide announcement
// @access  Private (Admin)
router.post('/announcement', adminAuth, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('targetRole').optional().isIn(['donor', 'recipient', 'all']).withMessage('Invalid target role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, message, priority = 'medium', targetRole = 'all' } = req.body;

    let targetUsers;
    if (targetRole === 'all') {
      targetUsers = await User.find({ isActive: true });
    } else {
      targetUsers = await User.find({ role: targetRole, isActive: true });
    }

    // Create notifications for all target users
    const notifications = targetUsers.map(user => ({
      recipient: user._id,
      type: 'system_alert',
      title,
      message,
      priority,
      data: { announcement: true }
    }));

    await Notification.insertMany(notifications);

    res.json({
      message: `Announcement sent to ${targetUsers.length} users`,
      recipients: targetUsers.length
    });
  } catch (error) {
    console.error('Send announcement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get detailed analytics
// @access  Private (Admin)
router.get('/analytics', adminAuth, async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // User registration trends
    const userTrends = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            role: '$role'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Blood request trends
    const requestTrends = await BloodRequest.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Top blood groups requested
    const topBloodGroups = await BloodRequest.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Success rate by blood group
    const successRates = await BloodRequest.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$bloodGroup',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          successRate: { $multiply: [{ $divide: ['$completed', '$total'] }, 100] }
        }
      },
      { $sort: { successRate: -1 } }
    ]);

    res.json({
      userTrends,
      requestTrends,
      topBloodGroups,
      successRates,
      period: parseInt(period)
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
