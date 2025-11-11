require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async (retries = 3, retryDelayMs = 3000) => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('FATAL: MONGODB_URI not set in environment (check .env)');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error(`MongoDB connection error: ${err && err.message ? err.message : err}`);
    if (err && err.name) console.error('Error name:', err.name);
    if (err && err.reason) console.error('Error reason:', err.reason);
    if (err && err.stack) console.error(err.stack.split('\n').slice(0,5).join('\n'));

    if (retries > 0) {
      console.log(`Retrying connection in ${retryDelayMs}ms... (${retries} retries left)`);
      await new Promise(r => setTimeout(r, retryDelayMs));
      return connectDB(retries - 1, retryDelayMs);
    } else {
      console.error('Exhausted MongoDB connection retries. Exiting process.');
      process.exit(1);
    }
  }
};

module.exports = connectDB;