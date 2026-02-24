const mongoose = require('mongoose');

const donationCampSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  maxDonors: {
    type: Number,
    default: 100
  },
  registeredDonors: [{
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donor'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'checked_in', 'donated', 'cancelled'],
      default: 'registered'
    },
    slotTime: {
      type: String
    }
  }],
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'paused', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  requirements: {
    minAge: { type: Number, default: 18 },
    maxAge: { type: Number, default: 65 },
    minWeight: { type: Number, default: 45 },
    requiredDocuments: [String]
  },
  contactInfo: {
    coordinatorName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true }
  },
  specialInstructions: {
    type: String,
    default: ''
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  targetBloodGroups: [{
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  }],
  totalDonations: {
    type: Number,
    default: 0
  },
  totalUnits: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient queries
donationCampSchema.index({ startDate: 1, status: 1 });
donationCampSchema.index({ 'location.city': 1, status: 1 });
donationCampSchema.index({ status: 1, isPublic: 1 });

// Virtual for available slots
donationCampSchema.virtual('availableSlots').get(function() {
  return Math.max(0, this.maxDonors - this.registeredDonors.length);
});

// Virtual for registration status
donationCampSchema.virtual('isRegistrationOpen').get(function() {
  const now = new Date();
  
  // Allow registration if:
  // 1. Camp hasn't ended yet
  // 2. Camp is either scheduled or ongoing (not completed or cancelled)
  // 3. There are available slots
  return now < this.endDate && 
         (this.status === 'scheduled' || this.status === 'ongoing') && 
         this.availableSlots > 0;
});

// Check if camp is ongoing
donationCampSchema.virtual('isOngoing').get(function() {
  const now = new Date();
  return now >= this.startDate && now <= this.endDate && this.status === 'ongoing';
});

// Update status based on dates
donationCampSchema.pre('save', function(next) {
  const now = new Date();
  
  if (now >= this.startDate && now <= this.endDate && this.status === 'scheduled') {
    this.status = 'ongoing';
  } else if (now > this.endDate && this.status === 'ongoing') {
    this.status = 'completed';
  }
  
  next();
});

module.exports = mongoose.model('DonationCamp', donationCampSchema);
