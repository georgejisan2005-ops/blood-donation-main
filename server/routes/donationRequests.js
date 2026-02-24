const express = require('express');
const { body, validationResult } = require('express-validator');
const DonationRequest = require('../models/DonationRequest');
const Donor = require('../models/Donor');
const { auth, donorAuth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/donation-requests
// @desc    Create a new donation verification request
// @access  Private (Donor)
router.post('/', donorAuth, [
  body('donationDate').isISO8601().withMessage('Valid donation date is required'),
  body('location').optional().trim(),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { donationDate, location, notes, campId } = req.body;

    const donor = await Donor.findOne({ user: req.user.id });
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }

    const donationRequest = new DonationRequest({
      donor: donor._id,
      user: req.user.id,
      donationDate,
      location,
      notes,
      camp: campId || null
    });

    await donationRequest.save();

    res.status(201).json({
      message: 'Donation verification request submitted successfully',
      donationRequest
    });
  } catch (error) {
    console.error('Create donation request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/donation-requests/my-requests
// @desc    Get logged-in donor's requests
// @access  Private (Donor)
router.get('/my-requests', donorAuth, async (req, res) => {
  try {
    const donor = await Donor.findOne({ user: req.user.id });
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }

    const requests = await DonationRequest.find({ donor: donor._id })
      .populate('camp', 'name location')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/donation-requests/pending
// @desc    Get all pending requests (Admin only)
// @access  Private (Admin)
router.get('/pending', adminAuth, async (req, res) => {
  try {
    const requests = await DonationRequest.find({ status: 'pending' })
      .populate('user', 'name email phone')
      .populate('donor', 'bloodGroup')
      .populate('camp', 'name')
      .sort({ createdAt: 1 });

    res.json({ requests });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/donation-requests/:id/verify
// @desc    Approve a donation request
// @access  Private (Admin)
router.put('/:id/verify', adminAuth, async (req, res) => {
  try {
    const request = await DonationRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is already processed' });
    }

    request.status = 'approved';
    request.verifiedBy = req.user.id;
    request.verifiedAt = new Date();
    await request.save();

    // Update Donor profile
    const donor = await Donor.findById(request.donor);
    if (donor) {
      donor.lastDonationDate = request.donationDate;
      donor.totalDonations = (donor.totalDonations || 0) + 1;
      
      // Assign badges based on total donations
      if (donor.totalDonations === 1 && !donor.badges.includes('first_donation')) {
        donor.badges.push('first_donation');
      } else if (donor.totalDonations >= 5 && !donor.badges.includes('regular_donor')) {
        donor.badges.push('regular_donor');
      } else if (donor.totalDonations >= 10 && !donor.badges.includes('lifesaver')) {
        donor.badges.push('lifesaver');
      }

      await donor.save();
    }

    res.json({ message: 'Request approved successfully', request });
  } catch (error) {
    console.error('Verify request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/donation-requests/:id/reject
// @desc    Reject a donation request
// @access  Private (Admin)
router.put('/:id/reject', adminAuth, [
  body('rejectionReason').trim().notEmpty().withMessage('Rejection reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rejectionReason } = req.body;

    const request = await DonationRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is already processed' });
    }

    request.status = 'rejected';
    request.rejectionReason = rejectionReason;
    request.verifiedBy = req.user.id;
    request.verifiedAt = new Date();
    await request.save();

    res.json({ message: 'Request rejected', request });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
