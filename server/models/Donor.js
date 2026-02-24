const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  weight: {
    type: Number,
    required: true,
    min: 45 // Minimum weight for blood donation
  },
  height: {
    type: Number,
    required: true
  },
  medicalHistory: {
    hasDiabetes: { type: Boolean, default: false },
    hasHypertension: { type: Boolean, default: false },
    hasHeartDisease: { type: Boolean, default: false },
    hasHepatitis: { type: Boolean, default: false },
    hasHIV: { type: Boolean, default: false },
    otherConditions: { type: String, default: '' }
  },
  lastDonationDate: {
    type: Date
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  availabilityNotes: {
    type: String,
    default: ''
  },
  emergencyContact: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    relationship: { type: String, required: true }
  },
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDate: {
    type: Date
  },
  totalDonations: {
    type: Number,
    default: 0
  },
  badges: [{
    type: String,
    enum: ['first_donation', 'regular_donor', 'emergency_hero', 'lifesaver']
  }]
}, {
  timestamps: true
});

// Calculate age
donorSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Check if donor is eligible
donorSchema.virtual('isEligible').get(function() {
  const age = this.age;
  const lastDonation = this.lastDonationDate;
  const today = new Date();
  
  // Age eligibility (18-65)
  if (age < 18 || age > 65) return false;
  
  // Weight eligibility
  if (this.weight < 45) return false;
  
  // Time since last donation (minimum 3 months / 90 days)
  if (lastDonation) {
    const daysSinceLastDonation = Math.floor((today - lastDonation) / (1000 * 60 * 60 * 24));
    if (daysSinceLastDonation < 90) return false;
  }
  
  // Medical conditions
  const medical = this.medicalHistory;
  if (medical.hasDiabetes || medical.hasHypertension || 
      medical.hasHeartDisease || medical.hasHepatitis || medical.hasHIV) {
    return false;
  }
  
  return true;
});

module.exports = mongoose.model('Donor', donorSchema);
