const mongoose = require('mongoose');
const Donor = require('../models/Donor');
const User = require('../models/User');
require('dotenv').config({ path: '../.env' });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blood-donation', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected');
        
        const donors = await Donor.find().populate('user', 'name email');
        console.log('Total Donors:', donors.length);
        console.log('Donors:', JSON.stringify(donors.map(d => ({
            name: d.user?.name,
            email: d.user?.email,
            bloodGroup: d.bloodGroup,
            dateOfBirth: d.dateOfBirth,
            weight: d.weight,
            isAvailable: d.isAvailable,
            lastDonationDate: d.lastDonationDate,
            medicalHistory: d.medicalHistory,
            isEligible: d.isEligible, // Access virtual check
            isVerified: d.isVerified,
            city: d.location?.city
        })), null, 2));

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

connectDB();
