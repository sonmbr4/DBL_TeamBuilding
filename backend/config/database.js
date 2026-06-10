const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/db-legends-teams')
        console.log(`MongoDB connected`)
    } catch (error) {
        console.error('Error connecting to MongoDB:', error)
        process.exit(1)
    }
};

module.exports = connectDB;

