const express = require('express');
const { body, validationResult } = require('express-validator');
const DonationCamp = require('../models/DonationCamp');
const Donor = require('../models/Donor');
const Notification = require('../models/Notification');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/camps
// @desc    Get all donation camps
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, city, isPublic } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (isPublic !== undefined) query.isPublic = isPublic === 'true';

    // Update statuses before fetching
    // Get all camps that might need updating (e.g. not cancelled or completed yet)
    // Note: Ideally this should be a background job, but for now we do it lazily on fetch or limited scope
    // A better approach for lazy update is to update specific ones or running a bulk update based on dates
    
    const today = new Date();
    
    // 1. Mark as completed if endDate has passed
    await DonationCamp.updateMany(
      { endDate: { $lt: today }, status: { $ne: 'completed' }, status: { $ne: 'cancelled' } },
      { $set: { status: 'completed' } }
    );

    // 2. Mark as ongoing if startDate has passed and endDate is in future
    await DonationCamp.updateMany(
      { startDate: { $lte: today }, endDate: { $gte: today }, status: 'scheduled' },
      { $set: { status: 'ongoing' } }
    );

    const camps = await DonationCamp.find(query)
      .populate('organizer', 'name email phone')
      .populate({
        path: 'registeredDonors.donor',
        select: 'bloodGroup dateOfBirth user',
        populate: {
          path: 'user',
          select: 'name email phone'
        }
      })
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await DonationCamp.countDocuments(query);

    res.json({
      camps,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get camps error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/camps/upcoming
// @desc    Get upcoming donation camps
// @access  Public
router.get('/upcoming', async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const camps = await DonationCamp.find({
      status: 'scheduled',
      startDate: { $gte: new Date() },
      isPublic: true
    })
      .populate('organizer', 'name email')
      .sort({ startDate: 1 })
      .limit(parseInt(limit));

    res.json({ camps });
  } catch (error) {
    console.error('Get upcoming camps error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/camps/:id
// @desc    Get specific donation camp
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    // Auto-update status for this specific camp if needed
    let campToCheck = await DonationCamp.findById(req.params.id);
    if (campToCheck) {
      const today = new Date();
      if (campToCheck.status !== 'cancelled' && campToCheck.status !== 'completed') {
        if (campToCheck.endDate < today) {
          campToCheck.status = 'completed';
          await campToCheck.save();
        } else if (campToCheck.startDate <= today && campToCheck.endDate >= today && campToCheck.status === 'scheduled') {
          campToCheck.status = 'ongoing';
          await campToCheck.save();
        }
      }
    }

    const camp = await DonationCamp.findById(req.params.id)
      .populate('organizer', 'name email phone')
      .populate('registeredDonors.donor', 'bloodGroup user')
      .populate('registeredDonors.donor.user', 'name email phone');

    if (!camp) {
      return res.status(404).json({ message: 'Donation camp not found' });
    }

    res.json({ camp });
  } catch (error) {
    console.error('Get camp error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/camps
// @desc    Create new donation camp
// @access  Private (Admin)
router.post('/', adminAuth, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('location.name').trim().notEmpty().withMessage('Location name is required'),
  body('location.address').trim().notEmpty().withMessage('Location address is required'),
  body('location.city').trim().notEmpty().withMessage('City is required'),
  body('location.state').trim().notEmpty().withMessage('State is required'),
  body('location.pincode').isPostalCode('IN').withMessage('Invalid pincode'),
  body('startDate').isISO8601().withMessage('Invalid start date'),
  body('endDate').isISO8601().withMessage('Invalid end date'),
  body('startTime').trim().notEmpty().withMessage('Start time is required'),
  body('endTime').trim().notEmpty().withMessage('End time is required'),
  body('maxDonors').isInt({ min: 1 }).withMessage('Max donors must be at least 1'),
  body('contactInfo.coordinatorName').trim().notEmpty().withMessage('Coordinator name is required'),
  body('contactInfo.phone').isMobilePhone().withMessage('Invalid phone number'),
  body('contactInfo.email').isEmail().withMessage('Invalid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      location,
      startDate,
      endDate,
      startTime,
      endTime,
      maxDonors,
      requirements,
      contactInfo,
      specialInstructions,
      targetBloodGroups
    } = req.body;

    const camp = new DonationCamp({
      title,
      description,
      organizer: req.user.id,
      location,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      startTime,
      endTime,
      maxDonors,
      requirements: requirements || {},
      contactInfo,
      specialInstructions: specialInstructions || '',
      targetBloodGroups: targetBloodGroups || [],
      createdBy: req.user.id
    });

    await camp.save();

    // Send notification to all donors about new camp
    const donors = await Donor.find({ isVerified: true }).populate('user');
    for (const donor of donors) {
      await Notification.createNotification(
        donor.user._id,
        'camp_announcement',
        'New Donation Camp',
        `New donation camp: ${title} on ${new Date(startDate).toLocaleDateString()}`,
        { campId: camp._id },
        'medium'
      );
    }

    res.status(201).json({
      message: 'Donation camp created successfully',
      camp
    });
  } catch (error) {
    console.error('Create camp error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/camps/:id
// @desc    Update donation camp
// @access  Private (Admin)
router.patch('/:id', adminAuth, [
  body('title').optional().trim().notEmpty(),
  body('description').optional().trim().notEmpty(),
  body('location.name').optional().trim().notEmpty(),
  body('location.address').optional().trim().notEmpty(),
  body('location.city').optional().trim().notEmpty(),
  body('location.state').optional().trim().notEmpty(),
  body('location.pincode').optional().isPostalCode('IN'),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('startTime').optional().trim().notEmpty(),
  body('endTime').optional().trim().notEmpty(),
  body('maxDonors').optional().isInt({ min: 1 }),
  body('contactInfo.coordinatorName').optional().trim().notEmpty(),
  body('contactInfo.phone').optional().isMobilePhone(),
  body('contactInfo.email').optional().isEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const camp = await DonationCamp.findById(req.params.id);
    if (!camp) {
      return res.status(404).json({ message: 'Donation camp not found' });
    }

    // Update allowed fields
    const allowedUpdates = [
      'title', 'description', 'location', 'startDate', 'endDate',
      'startTime', 'endTime', 'maxDonors', 'requirements',
      'contactInfo', 'specialInstructions', 'targetBloodGroups', 'isPublic', 'status'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        camp[field] = req.body[field];
      }
    });

    camp.updatedBy = req.user.id;

    await camp.save();

    res.json({
      message: 'Donation camp updated successfully',
      camp
    });
  } catch (error) {
    console.error('Update camp error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/camps/:id
// @desc    Delete donation camp
// @access  Private (Admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const camp = await DonationCamp.findById(req.params.id)
      .populate({
        path: 'registeredDonors.donor',
        populate: {
          path: 'user',
          select: '_id'
        }
      });
      
    if (!camp) {
      return res.status(404).json({ message: 'Donation camp not found' });
    }

    // Notify registered donors about cancellation
    for (const registration of camp.registeredDonors) {
      try {
        // Only send notification if donor and user exist
        if (registration.donor && registration.donor.user) {
          await Notification.createNotification(
            registration.donor.user._id || registration.donor.user,
            'camp_announcement',
            'Camp Cancelled',
            `The donation camp "${camp.title}" has been cancelled`,
            { campId: camp._id },
            'medium'
          );
        }
      } catch (notifError) {
        // Log notification error but don't fail the deletion
        console.error('Failed to send notification to donor:', notifError);
      }
    }

    await DonationCamp.findByIdAndDelete(req.params.id);

    res.json({ message: 'Donation camp deleted successfully' });
  } catch (error) {
    console.error('Delete camp error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/camps/:id/register
// @desc    Register for donation camp
// @access  Private (Donor)
router.post('/:id/register', auth, [
  body('slotTime').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { slotTime } = req.body;

    const camp = await DonationCamp.findById(req.params.id);
    if (!camp) {
      return res.status(404).json({ message: 'Donation camp not found' });
    }

    if (!camp.isRegistrationOpen) {
      return res.status(400).json({ message: 'Registration is not open for this camp' });
    }

    // Check if user is a donor
    const donor = await Donor.findOne({ user: req.user.id });
    if (!donor) {
      return res.status(400).json({ message: 'Donor profile not found' });
    }

    // Check if already registered
    const existingRegistration = camp.registeredDonors.find(
      reg => reg.donor.toString() === donor._id.toString()
    );

    if (existingRegistration) {
      return res.status(400).json({ message: 'Already registered for this camp' });
    }

    // Check if donor is eligible
    if (!donor.isEligible) {
      return res.status(400).json({ message: 'You are not currently eligible to donate blood' });
    }

    // Add registration
    camp.registeredDonors.push({
      donor: donor._id,
      slotTime: slotTime || null
    });

    await camp.save();

    // Notify organizer
    await Notification.createNotification(
      camp.organizer,
      'donation_reminder',
      'New Camp Registration',
      `${req.user.name} has registered for the camp "${camp.title}"`,
      { campId: camp._id, donorId: donor._id },
      'medium'
    );

    res.json({
      message: 'Successfully registered for donation camp',
      registration: {
        campId: camp._id,
        campTitle: camp.title,
        slotTime: slotTime || null
      }
    });
  } catch (error) {
    console.error('Register for camp error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/camps/:id/register
// @desc    Unregister from donation camp
// @access  Private (Donor)
router.delete('/:id/register', auth, async (req, res) => {
  try {
    const camp = await DonationCamp.findById(req.params.id);
    if (!camp) {
      return res.status(404).json({ message: 'Donation camp not found' });
    }

    const donor = await Donor.findOne({ user: req.user.id });
    if (!donor) {
      return res.status(400).json({ message: 'Donor profile not found' });
    }

    // Find and remove registration
    const registrationIndex = camp.registeredDonors.findIndex(
      reg => reg.donor.toString() === donor._id.toString()
    );

    if (registrationIndex === -1) {
      return res.status(400).json({ message: 'Not registered for this camp' });
    }

    camp.registeredDonors.splice(registrationIndex, 1);
    await camp.save();

    res.json({ message: 'Successfully unregistered from donation camp' });
  } catch (error) {
    console.error('Unregister from camp error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/camps/upcoming
// @desc    Get upcoming donation camps
// @access  Public
router.get('/upcoming', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const currentDate = new Date();
    
    const camps = await DonationCamp.find({
      startDate: { $gte: currentDate },
      status: 'active'
    })
    .sort({ startDate: 1 })
    .limit(parseInt(limit))
    .populate('organizer', 'name email');

    res.json({ camps });
  } catch (error) {
    console.error('Get upcoming camps error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
