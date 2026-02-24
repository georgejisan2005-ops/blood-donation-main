const mongoose = require('mongoose');
const BloodRequest = require('../models/BloodRequest');
require('dotenv').config({ path: '../.env' });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blood-donation', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected');
        
        const requests = await BloodRequest.find();
        console.log('Total Requests:', requests.length);
        console.log('Pending Requests:', JSON.stringify(requests.filter(r => r.status === 'pending'), null, 2));

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

connectDB();
