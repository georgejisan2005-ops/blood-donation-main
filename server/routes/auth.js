const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Donor = require('../models/Donor');
const { auth } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').isMobilePhone().withMessage('Please provide a valid phone number'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('role').isIn(['donor', 'recipient']).withMessage('Role must be either donor or recipient')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, department, year, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = new User({
      name,
      email,
      password,
      phone,
      department,
      year,
      role,
      isEmailVerified: false,
      otp: {
        code: otpCode,
        expiresAt: otpExpires
      }
    });

    await user.save();

    // Send Verification Email
    await sendEmail({
      email: user.email,
      subject: 'EduDonor Account Verification',
      text: `Your verification code is: ${otpCode}. It expires in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Verify Your EduDonor Account</h2>
          <p>Thank you for registering. Please use the following OTP to verify your email address:</p>
          <h1 style="color: #e11d48; letter-spacing: 5px;">${otpCode}</h1>
          <p>This code expires in 10 minutes.</p>
        </div>
      `
    });

    // Do NOT return token immediately, force verification
    res.status(201).json({
      message: 'Registration successful! Please verify your email.',
      requireVerification: true,
      email: user.email
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify user email OTP
// @access  Public
router.post('/verify-otp', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 })
], async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
      return res.status(400).json({ message: 'Invalid OTP request' });
    }

    if (user.otp.code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.otp.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    // Success
    user.isEmailVerified = true;
    user.otp = undefined; // Clear OTP
    await user.save();

    // Auto login
    const token = generateToken(user._id);

    res.json({
      message: 'Email verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roles: user.roles,
        department: user.department
      }
    });
  } catch (error) {
    console.error('OTP Verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP
// @access  Public
router.post('/resend-otp', [
    body('email').isEmail().normalizeEmail()
], async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
             return res.status(400).json({ message: 'User not found' });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ message: 'Email already verified' });
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); 

        user.otp = {
            code: otpCode,
            expiresAt: otpExpires
        };
        await user.save();

        await sendEmail({
            email: user.email,
            subject: 'EduDonor OTP Resend',
            text: `Your new verification code is: ${otpCode}. It expires in 10 minutes.`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Verify Your EduDonor Account</h2>
                <p>Here is your new OTP:</p>
                <h1 style="color: #e11d48; letter-spacing: 5px;">${otpCode}</h1>
                <p>This code expires in 10 minutes.</p>
              </div>
            `
        });

        res.json({ message: 'OTP resent successfully' });

    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    if (!user.isEmailVerified) {
       return res.status(400).json({ 
         message: 'Email not verified. Please verify your email to login.',
         requireVerification: true,
         email: user.email 
       });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roles: user.roles, // Add roles array
        department: user.department,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    // Get additional profile data based on role
    let profileData = {};
    
    if (user.roles.includes('donor')) {
      const donorProfile = await Donor.findOne({ user: user._id });
      // Only include if found
      if (donorProfile) {
        profileData.donor = donorProfile;
      }
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roles: user.roles,
        department: user.department,
        year: user.year,
        phone: user.phone,
        profileImage: user.profileImage,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      },
      profile: profileData
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
  body('department').optional().trim().notEmpty().withMessage('Department cannot be empty'),
  body('year').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, department, year } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (department) updateData.department = department;
    if (year) updateData.year = year;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        year: user.year,
        phone: user.phone,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/add-role
// @desc    Add a new role to current user (e.g. become a donor)
// @access  Private
router.post('/add-role', auth, [
  body('role').isIn(['donor', 'recipient']).withMessage('Role must be either donor or recipient')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.roles.includes(role)) {
      return res.status(400).json({ message: 'User already has this role' });
    }

    user.roles.push(role);
    await user.save();

    // If adding donor role, create empty donor profile if not exists
    if (role === 'donor') {
      const existingProfile = await Donor.findOne({ user: user._id });
      if (!existingProfile) {
        // Create basic profile
        await new Donor({
          user: user._id,
          phone: user.phone,
          bloodGroup: 'Unknown',
          dateOfBirth: new Date(), // Default to today (ineligible due to age)
          weight: 0, // Ineligible
          height: 0,
          emergencyContact: {
            name: 'Update Me',
            phone: '0000000000',
            relationship: 'None'
          },
          location: {
            address: 'Update your address',
            city: 'Chennai', // Default
            state: 'TN',
            pincode: '000000'
          }
        }).save();
      }
    }

    res.json({
      message: `Role ${role} added successfully`,
      roles: user.roles
    });

  } catch (error) {
    console.error('Add role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
