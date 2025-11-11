import 'dotenv/config';
import mongoose from 'mongoose';
import logger from '../utils/logger';
import User from '../models/User';
import Profile from '../models/Profile';
import KYCDoc from '../models/KYCDoc';
import { config } from '../config/env';

const uri = process.env.MONGODB_URI || config.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI is not defined. Please set it in backend/.env');
}

const testModels = async () => {
  try {
    await mongoose.connect(uri);
    logger.info('✅ Connected to MongoDB');

    // Test 1: Create Farmer User
    logger.info('🧪 Test 1: Creating Farmer User...');
    const testUser = await User.create({
      phone: '254712345678',
      email: 'farmer@test.com',
      nationalIdEncrypted: '12345678',
      role: 'farmer',
      isPhoneVerified: true
    });
    logger.info('✅ User created', { id: testUser._id, kycStatus: testUser.kycStatus });

    // Test 2: Profile with GeoJSON
    logger.info('🧪 Test 2: Creating Profile...');
    const testProfile = await Profile.create({
      userId: testUser._id,
      fullNames: 'John Kamau Mwangi',
      location: { type: 'Point', coordinates: [36.8219, -1.2921] },
      farmName: 'Kamau Family Farm',
      farmSize: { value: 5, unit: 'acres' },
      farmingType: 'crops',
      primaryProducts: ['Maize', 'Beans', 'Tomatoes']
    });
    logger.info('✅ Profile created', { id: testProfile._id, isComplete: testProfile.isProfileComplete });

    // Test 3: KYC Doc creation
    logger.info('🧪 Test 3: Creating KYC Document...');
    const testKYC = await KYCDoc.create({
      userId: testUser._id,
      documentType: 'national_id',
      frontImage: { url: 'https://s3.amazonaws.com/test/kyc-front.jpg', key: 'kyc/test-front.jpg' },
      backImage: { url: 'https://s3.amazonaws.com/test/kyc-back.jpg', key: 'kyc/test-back.jpg' },
      documentNumber: '12345678',
      fullName: 'John Kamau Mwangi'
    });
    logger.info('✅ KYC created', { id: testKYC._id, status: testKYC.verificationStatus });

    // Test 4: Verify KYC (admin simulation)
    logger.info('🧪 Test 4: Verifying KYC...');
    await testKYC.verify(testUser._id as any, 'Verified in tests');
    const updatedUser = await User.findById(testUser._id);
    logger.info('✅ KYC Verified', { kycStatus: updatedUser?.kycStatus, canTransact: updatedUser?.canTransact() });

    // Test 5: Encryption check
    logger.info('🧪 Test 5: Encryption check...');
    const userWithNid = await User.findById(testUser._id);
    logger.info('✅ National ID (decrypted)', { decrypted: userWithNid?.nationalId });

    // Test 6: Geospatial query
    logger.info('🧪 Test 6: Geospatial query...');
    const nearby = await Profile.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [36.8, -1.3] },
          $maxDistance: 50000
        }
      }
    });
    logger.info('✅ Nearby profiles found', nearby.length);

    // Test 7: Unverified buyer cannot transact
    logger.info('🧪 Test 7: Unverified buyer...');
    const buyer = await User.create({
      phone: '254722334455',
      email: 'buyer@test.com',
      nationalIdEncrypted: '87654321',
      role: 'buyer',
      isPhoneVerified: true
    });
    logger.info('✅ Buyer created', { canTransact: buyer.canTransact(), kycStatus: buyer.kycStatus });

    // Test 8: Populate profile
    logger.info('🧪 Test 8: Populate user->profile...');
    const populated = await User.findById(testUser._id).populate('profile');
    logger.info('✅ Populated', {
      profileName: (populated as any)?.profile?.fullNames,
      farmName: (populated as any)?.profile?.farmName
    });

    logger.info('✅✅✅ All tests completed.');
    logger.info('Summary:', {
      users: await User.countDocuments(),
      profiles: await Profile.countDocuments(),
      kycdocs: await KYCDoc.countDocuments(),
      verified: await User.countDocuments({ kycStatus: 'kyc_verified' })
    });
  } catch (err: any) {
    logger.error('❌ Test failed:', err);
  } finally {
    logger.info('🧹 Cleaning up test data...');
    try {
      await User.deleteMany({ email: { $in: ['farmer@test.com', 'buyer@test.com'] } });
      await Profile.deleteMany({});
      await KYCDoc.deleteMany({});
    } catch (e) {
      logger.error('Cleanup error:', e);
    }
    await mongoose.connection.close();
    logger.info('🔌 DB connection closed');
    process.exit(0);
  }
};

testModels();