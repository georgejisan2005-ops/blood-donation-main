const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientName: {
    type: String,
    required: true,
    trim: true
  },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  unitsRequired: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  hospitalName: {
    type: String,
    required: true,
    trim: true
  },
  hospitalAddress: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  pincode: {
    type: String,
    required: true,
    trim: true
  },
  contactPerson: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    relationship: { type: String, required: true }
  },
  requiredDate: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'matched', 'in_progress', 'completed', 'cancelled', 'expired'],
    default: 'pending'
  },
  matchedDonors: [{
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donor'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'completed'],
      default: 'pending'
    },
    matchedAt: {
      type: Date,
      default: Date.now
    },
    responseAt: {
      type: Date
    }
  }],
  completedDonors: [{
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donor'
    },
    unitsDonated: {
      type: Number,
      required: true
    },
    donatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalUnitsReceived: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verificationDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
bloodRequestSchema.index({ bloodGroup: 1, status: 1, city: 1 });
bloodRequestSchema.index({ urgency: 1, status: 1 });
bloodRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for urgency score (higher is more urgent)
bloodRequestSchema.virtual('urgencyScore').get(function() {
  const urgencyScores = {
    'low': 1,
    'medium': 2,
    'high': 3,
    'critical': 4
  };
  return urgencyScores[this.urgency] || 2;
});

// Check if request is expired
bloodRequestSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt;
});

// Update status if expired
bloodRequestSchema.pre('save', function(next) {
  if (this.isExpired && this.status === 'pending') {
    this.status = 'expired';
  }
  next();
});

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
