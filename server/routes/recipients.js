const express = require('express');
const { body, validationResult } = require('express-validator');
const BloodRequest = require('../models/BloodRequest');
const Donor = require('../models/Donor');
const Notification = require('../models/Notification');
const { auth, recipientAuth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/recipients/request
// @desc    Create a new blood request
// @access  Private (Recipient)
router.post('/request', recipientAuth, [
  body('patientName').trim().isLength({ min: 2 }).withMessage('Patient name must be at least 2 characters'),
  body('bloodGroup').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
  body('unitsRequired').isInt({ min: 1, max: 10 }).withMessage('Units required must be between 1 and 10'),
  body('urgency').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid urgency level'),
  body('hospitalName').trim().notEmpty().withMessage('Hospital name is required'),
  body('hospitalAddress').trim().notEmpty().withMessage('Hospital address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('pincode').isPostalCode('IN').withMessage('Invalid pincode'),
  body('contactPerson.name').trim().notEmpty().withMessage('Contact person name is required'),
  body('contactPerson.phone').isMobilePhone().withMessage('Invalid contact person phone'),
  body('contactPerson.relationship').trim().notEmpty().withMessage('Contact person relationship is required'),
  body('requiredDate').isISO8601().withMessage('Invalid required date'),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      patientName,
      bloodGroup,
      unitsRequired,
      urgency,
      hospitalName,
      hospitalAddress,
      city,
      state,
      pincode,
      contactPerson,
      requiredDate,
      description
    } = req.body;

    // Create blood request
    const bloodRequest = new BloodRequest({
      requester: req.user.id,
      patientName,
      bloodGroup,
      unitsRequired,
      urgency,
      hospitalName,
      hospitalAddress,
      city,
      state,
      pincode,
      contactPerson,
      contactPerson,
      requiredDate: new Date(requiredDate),
      description,
      createdBy: req.user.id
    });

    await bloodRequest.save();

    // Find matching donors and send notifications
    const matchingDonors = await Donor.find({
      bloodGroup,
      isAvailable: true,
      isVerified: true,
      'location.city': new RegExp(city, 'i')
    }).populate('user', 'name email phone');

    // Send notifications to matching donors
    for (const donor of matchingDonors) {
      if (donor.isEligible) {
        await Notification.createNotification(
          donor.user._id,
          'blood_request',
          'Blood Request Alert',
          `Urgent blood request for ${bloodGroup} in ${city}. Patient: ${patientName}`,
          { requestId: bloodRequest._id, urgency },
          urgency === 'critical' ? 'urgent' : 'high'
        );
      }
    }

    res.status(201).json({
      message: 'Blood request created successfully',
      request: bloodRequest,
      matchingDonors: matchingDonors.length
    });
  } catch (error) {
    console.error('Create blood request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/recipients/requests
// @desc    Get user's blood requests
// @access  Private (Recipient)
router.get('/requests', recipientAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const query = { requester: req.user.id };
    if (status) {
      query.status = status;
    }

    const requests = await BloodRequest.find(query)
      .populate({
        path: 'matchedDonors.donor',
        select: 'bloodGroup user',
        populate: {
          path: 'user',
          select: 'name email phone'
        }
      })
      .populate({
        path: 'completedDonors.donor',
        select: 'bloodGroup user',
        populate: {
          path: 'user',
          select: 'name email phone'
        }
      })
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
    console.error('Get blood requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/recipients/requests/:id
// @desc    Get specific blood request details
// @access  Private (Recipient)
router.get('/requests/:id', recipientAuth, async (req, res) => {
  try {
    const request = await BloodRequest.findOne({
      _id: req.params.id,
      requester: req.user.id
    })
      .populate({
        path: 'matchedDonors.donor',
        select: 'bloodGroup user isEligible',
        populate: {
          path: 'user',
          select: 'name email phone department'
        }
      })
      .populate({
        path: 'completedDonors.donor',
        select: 'bloodGroup user',
        populate: {
          path: 'user',
          select: 'name email phone'
        }
      });

    if (!request) {
      return res.status(404).json({ message: 'Blood request not found' });
    }

    res.json({ request });
  } catch (error) {
    console.error('Get blood request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/recipients/requests/:id
// @desc    Update blood request
// @access  Private (Recipient)
router.put('/requests/:id', recipientAuth, [
  body('patientName').optional().trim().isLength({ min: 2 }),
  body('unitsRequired').optional().isInt({ min: 1, max: 10 }),
  body('urgency').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('hospitalName').optional().trim().notEmpty(),
  body('hospitalAddress').optional().trim().notEmpty(),
  body('city').optional().trim().notEmpty(),
  body('state').optional().trim().notEmpty(),
  body('pincode').optional().isPostalCode('IN'),
  body('contactPerson.name').optional().trim().notEmpty(),
  body('contactPerson.phone').optional().isMobilePhone(),
  body('contactPerson.relationship').optional().trim().notEmpty(),
  body('requiredDate').optional().isISO8601(),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const request = await BloodRequest.findOne({
      _id: req.params.id,
      requester: req.user.id
    });

    if (!request) {
      return res.status(404).json({ message: 'Blood request not found' });
    }

    if (request.status === 'completed' || request.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot update completed or cancelled request' });
    }

    // Update allowed fields
    const allowedUpdates = [
      'patientName', 'unitsRequired', 'urgency', 'hospitalName',
      'hospitalAddress', 'city', 'state', 'pincode', 'contactPerson',
      'requiredDate', 'description'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        request[field] = req.body[field];
      }
    });

    request.updatedBy = req.user.id;

    await request.save();

    res.json({
      message: 'Blood request updated successfully',
      request
    });
  } catch (error) {
    console.error('Update blood request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/recipients/requests/:id
// @desc    Cancel blood request
// @access  Private (Recipient)
router.delete('/requests/:id', recipientAuth, async (req, res) => {
  try {
    const request = await BloodRequest.findOne({
      _id: req.params.id,
      requester: req.user.id
    });

    if (!request) {
      return res.status(404).json({ message: 'Blood request not found' });
    }

    if (request.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed request' });
    }

    request.status = 'cancelled';
    await request.save();

    // Notify matched donors about cancellation
    for (const match of request.matchedDonors) {
      if (match.status === 'accepted') {
        await Notification.createNotification(
          match.donor.user,
          'request_status_update',
          'Request Cancelled',
          'The blood request you accepted has been cancelled',
          { requestId: request._id },
          'medium'
        );
      }
    }

    res.json({ message: 'Blood request cancelled successfully' });
  } catch (error) {
    console.error('Cancel blood request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/recipients/available-donors
// @desc    Get available donors for a blood group
// @access  Private (Recipient)
router.get('/available-donors', recipientAuth, async (req, res) => {
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
    console.error('Get available donors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/recipients/complete-donation
// @desc    Mark donation as completed
// @access  Private (Recipient)
router.post('/complete-donation', recipientAuth, [
  body('requestId').isMongoId().withMessage('Invalid request ID'),
  body('donorId').isMongoId().withMessage('Invalid donor ID'),
  body('unitsDonated').isInt({ min: 1 }).withMessage('Units donated must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { requestId, donorId, unitsDonated } = req.body;

    const request = await BloodRequest.findOne({
      _id: requestId,
      requester: req.user.id
    });

    if (!request) {
      return res.status(404).json({ message: 'Blood request not found' });
    }

    // Check if donor was matched and accepted
    const match = request.matchedDonors.find(
      m => m.donor.toString() === donorId && m.status === 'accepted'
    );

    if (!match) {
      return res.status(400).json({ message: 'Donor was not matched or did not accept' });
    }

    // Add to completed donors
    request.completedDonors.push({
      donor: donorId,
      unitsDonated,
      donatedAt: new Date()
    });

    // Update total units received
    request.totalUnitsReceived += unitsDonated;

    // Update donor's donation count
    const donor = await Donor.findById(donorId);
    if (donor) {
      donor.totalDonations += 1;
      donor.lastDonationDate = new Date();
      await donor.save();
    }

    // Check if request is fully completed
    if (request.totalUnitsReceived >= request.unitsRequired) {
      request.status = 'completed';
    } else {
      request.status = 'in_progress';
    }

    await request.save();

    // Notify donor about completion
    await Notification.createNotification(
      donor.user,
      'donation_completed',
      'Thank You!',
      `Your donation of ${unitsDonated} unit(s) has been completed successfully`,
      { requestId: request._id },
      'medium'
    );

    res.json({
      message: 'Donation marked as completed',
      request: {
        status: request.status,
        totalUnitsReceived: request.totalUnitsReceived,
        unitsRequired: request.unitsRequired
      }
    });
  } catch (error) {
    console.error('Complete donation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
