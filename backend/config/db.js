const mongoose = require('mongoose');

const connectDB = async (uri = process.env.MONGO_URI) => {
  if (!uri) {
    console.warn('⚠️ No MONGO_URI provided in environment variables.');
    return false;
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    return false;
  }
};

module.exports = connectDB;
