const express = require('express');
const { body, validationResult } = require('express-validator');
const Donor = require('../models/Donor');
const BloodRequest = require('../models/BloodRequest');
const Notification = require('../models/Notification');
const { auth, donorAuth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/donors/profile
// @desc    Create or update donor profile
// @access  Private (Donor)
router.post('/profile', donorAuth, [
  body('bloodGroup').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
  body('dateOfBirth').isISO8601().withMessage('Invalid date of birth'),
  body('weight').isNumeric().isFloat({ min: 45 }).withMessage('Weight must be at least 45 kg'),
  body('height').isNumeric().isFloat({ min: 100 }).withMessage('Height must be at least 100 cm'),
  body('emergencyContact.name').trim().notEmpty().withMessage('Emergency contact name is required'),
  body('emergencyContact.phone').isMobilePhone().withMessage('Invalid emergency contact phone'),
  body('emergencyContact.relationship').trim().notEmpty().withMessage('Emergency contact relationship is required'),
  body('location.address').trim().notEmpty().withMessage('Address is required'),
  body('location.city').trim().notEmpty().withMessage('City is required'),
  body('location.state').trim().notEmpty().withMessage('State is required'),
  body('location.pincode').isPostalCode('IN').withMessage('Invalid pincode')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      bloodGroup,
      dateOfBirth,
      weight,
      height,
      medicalHistory,
      emergencyContact,
      location,
      availabilityNotes
    } = req.body;

    // Check if donor profile already exists
    let donor = await Donor.findOne({ user: req.user.id });

    if (donor) {
      // Update existing profile
      Object.assign(donor, {
        bloodGroup,
        dateOfBirth,
        weight,
        height,
        medicalHistory: medicalHistory || {},
        emergencyContact,
        location,
        availabilityNotes: availabilityNotes || ''
      });
      await donor.save();
    } else {
      // Create new profile
      donor = new Donor({
        user: req.user.id,
        bloodGroup,
        dateOfBirth,
        weight,
        height,
        medicalHistory: medicalHistory || {},
        emergencyContact,
        location,
        availabilityNotes: availabilityNotes || ''
      });
      await donor.save();
    }

    res.json({
      message: 'Donor profile updated successfully',
      donor
    });
  } catch (error) {
    console.error('Donor profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/donors/profile
// @desc    Get donor profile
// @access  Private (Donor)
router.get('/profile', donorAuth, async (req, res) => {
  try {
    const donor = await Donor.findOne({ user: req.user.id });

    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }

    res.json({ donor });
  } catch (error) {
    console.error('Get donor profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/donors/availability
// @desc    Update donor availability
// @access  Private (Donor)
router.put('/availability', donorAuth, [
  body('isAvailable').isBoolean().withMessage('isAvailable must be a boolean'),
  body('availabilityNotes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isAvailable, availabilityNotes } = req.body;

    const donor = await Donor.findOne({ user: req.user.id });
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }

    donor.isAvailable = isAvailable;
    if (availabilityNotes !== undefined) {
      donor.availabilityNotes = availabilityNotes;
    }

    await donor.save();

    res.json({
      message: 'Availability updated successfully',
      donor: {
        isAvailable: donor.isAvailable,
        availabilityNotes: donor.availabilityNotes
      }
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/donors/requests
// @desc    Get blood requests matching donor's blood group
// @access  Private (Donor)
router.get('/requests', donorAuth, async (req, res) => {
  try {
    const donor = await Donor.findOne({ user: req.user.id });
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }

    const { page = 1, limit = 10, urgency, city } = req.query;
    const skip = (page - 1) * limit;

    // Blood group compatibility matrix (Donor -> Recipients)
    const compatibility = {
      'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], // Universal donor
      'O+': ['O+', 'A+', 'B+', 'AB+'],
      'A-': ['A-', 'A+', 'AB-', 'AB+'],
      'A+': ['A+', 'AB+'],
      'B-': ['B-', 'B+', 'AB-', 'AB+'],
      'B+': ['B+', 'AB+'],
      'AB-': ['AB-', 'AB+'],
      'AB+': ['AB+'] // Universal recipient (can only donate to AB+)
    };

    const compatibleGroups = compatibility[donor.bloodGroup] || [donor.bloodGroup];

    // Build query
    const query = {
      bloodGroup: { $in: compatibleGroups },
      status: { $in: ['pending', 'matched'] },
      expiresAt: { $gt: new Date() },
      isVerified: true // Only show verified requests
    };

    if (urgency) {
      query.urgency = urgency;
    }

    if (city) {
      query.city = new RegExp(city, 'i');
    }

    const requests = await BloodRequest.find(query)
      .populate('requester', 'name email phone')
      .sort({ urgency: -1, createdAt: -1 })
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

// @route   GET /api/donors/requests/:id
// @desc    Get specific blood request details for donors
// @access  Private (Donor)
router.get('/requests/:id', donorAuth, async (req, res) => {
  try {
    const donor = await Donor.findOne({ user: req.user.id });
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }

    const request = await BloodRequest.findById(req.params.id)
      .populate('requester', 'name email phone')
      .populate('matchedDonors.donor', 'bloodGroup user')
      .populate('matchedDonors.donor.user', 'name email phone');

    if (!request) {
      return res.status(404).json({ message: 'Blood request not found' });
    }

    res.json({ request });
  } catch (error) {
    console.error('Get blood request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/donors/respond-request
// @desc    Respond to a blood request
// @access  Private (Donor)
router.post('/respond-request', donorAuth, [
  body('requestId').isMongoId().withMessage('Invalid request ID'),
  body('action').isIn(['accept', 'decline']).withMessage('Action must be accept or decline')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { requestId, action } = req.body;

    const donor = await Donor.findOne({ user: req.user.id });
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }

    const bloodRequest = await BloodRequest.findById(requestId);
    if (!bloodRequest) {
      return res.status(404).json({ message: 'Blood request not found' });
    }

    // Check if donor is eligible
    if (!donor.isEligible) {
      return res.status(400).json({ message: 'You are not currently eligible to donate blood' });
    }

    // Check if donor is available
    if (!donor.isAvailable) {
      return res.status(400).json({ message: 'You are not currently available for donation' });
    }

    // Find existing match
    const existingMatch = bloodRequest.matchedDonors.find(
      match => match.donor.toString() === donor._id.toString()
    );

    if (existingMatch) {
      return res.status(400).json({ message: 'You have already responded to this request' });
    }

    if (action === 'accept') {
      // Add donor to matched donors
      bloodRequest.matchedDonors.push({
        donor: donor._id,
        status: 'accepted',
        matchedAt: new Date(),
        responseAt: new Date()
      });

      // Update request status if it was pending
      if (bloodRequest.status === 'pending') {
        bloodRequest.status = 'matched';
      }

      // Create notification for requester
      await Notification.createNotification(
        bloodRequest.requester,
        'donor_match',
        'Donor Found!',
        `${donor.user.name} has accepted your blood request`,
        { requestId: bloodRequest._id, donorId: donor._id },
        'high'
      );
    } else {
      // Add declined response
      bloodRequest.matchedDonors.push({
        donor: donor._id,
        status: 'declined',
        matchedAt: new Date(),
        responseAt: new Date()
      });
    }

    await bloodRequest.save();

    res.json({
      message: `Request ${action}ed successfully`,
      action
    });
  } catch (error) {
    console.error('Respond to request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/donors/history
// @desc    Get donor's donation history
// @access  Private (Donor)
router.get('/history', donorAuth, async (req, res) => {
  try {
    const donor = await Donor.findOne({ user: req.user.id });
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Get blood requests where donor has completed donation
    const requests = await BloodRequest.find({
      'completedDonors.donor': donor._id
    })
      .populate('requester', 'name email')
      .sort({ 'completedDonors.donatedAt': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BloodRequest.countDocuments({
      'completedDonors.donor': donor._id
    });

    res.json({
      history: requests,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      },
      stats: {
        totalDonations: donor.totalDonations,
        lastDonation: donor.lastDonationDate,
        badges: donor.badges
      }
    });
  } catch (error) {
    console.error('Get donation history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/donors/eligible
// @desc    Get eligible donors for a blood group
// @access  Public
router.get('/eligible', async (req, res) => {
  try {
    const { bloodGroup, city, limit = 20 } = req.query;

    if (!bloodGroup) {
      return res.status(400).json({ message: 'Blood group is required' });
    }

    const query = {
      bloodGroup,
      isAvailable: true,
      isVerified: true
    };

    if (city) {
      query['location.city'] = new RegExp(city, 'i');
    }

    const donors = await Donor.find(query)
      .populate('user', 'name email phone department')
      .select('-medicalHistory -emergencyContact')
      .limit(parseInt(limit));

    // Filter eligible donors
    const eligibleDonors = donors.filter(donor => donor.isEligible);

    res.json({ donors: eligibleDonors });
  } catch (error) {
    console.error('Get eligible donors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
