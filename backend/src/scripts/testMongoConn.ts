import 'dotenv/config';
import mongoose from 'mongoose';

(async () => {
  const MONGO_URI = process.env.MONGODB_URI;
  console.log('Using MONGODB_URI:', MONGO_URI ? MONGO_URI.replace(/:[^:@]+@/, ':<REDACTED>@') : 'MISSING');

  if (!MONGO_URI) {
    console.error('❌ MONGODB_URI is not defined. Ensure backend/.env exists and contains MONGODB_URI');
    process.exit(1);
  }

  try {
    // Safe: MONGO_URI is a definite string here
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB successfully');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error('❌ MongoDB connection failed:', err?.message || err);
    console.error(err);
    process.exit(1);
  }
})();
