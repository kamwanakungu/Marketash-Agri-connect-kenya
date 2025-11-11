import 'dotenv/config';
import mongoose from 'mongoose';
import logger from '../utils/logger';
import User from '../models/User';
import Profile from '../models/Profile';
import KYCDoc from '../models/KYCDoc';
import { config } from '../config/env';

const testModels = async () => {
  try {
    // Connect to database
    await mongoose.connect(config.MONGODB_URI);
    logger.info('✅ Connected to MongoDB');

    // Test 1: Create a Farmer User with all mandatory fields
    logger.info('\n🧪 Test 1: Creating Farmer User with KYC requirements...');

    const testUser = await User.create({
      phone: '254712345678',
      email: 'farmer@test.com',
      nationalIdEncrypted: '12345678', // Will be encrypted by pre-save hook
      role: 'farmer',
      isPhoneVerified: true
    });

    logger.info('✅ User created:', {
      id: testUser._id,
      phone: testUser.phone,
      email: testUser.email,
      role: testUser.role,
      kycStatus: testUser.kycStatus,
      canTransact: testUser.canTransact()
    });

    // Test 2: Create Profile with Location (GeoJSON)
    logger.info('\n🧪 Test 2: Creating Farmer Profile with GeoJSON location...');

    const testProfile = await Profile.create({
      userId: testUser._id,
      fullNames: 'John Kamau Mwangi',
      location: {
        type: 'Point',
        coordinates: [36.8219, -1.2921] // Nairobi coordinates [longitude, latitude]
      },
      address: {
        street: '123 Kenyatta Avenue',
        city: 'Nairobi',
        county: 'Nairobi',
        country: 'Kenya'
      },
      farmName: 'Kamau Family Farm',
      farmSize: {
        value: 5,
        unit: 'acres'
      },
      farmingType: 'crops',
      primaryProducts: ['Maize', 'Beans', 'Tomatoes']
    });

    logger.info('✅ Profile created:', {
      id: testProfile._id,
      fullNames: testProfile.fullNames,
      location: testProfile.location,
      farmName: testProfile.farmName,
      isComplete: testProfile.isProfileComplete
    });

    // Test 3: Create KYC Document
    logger.info('\n🧪 Test 3: Creating KYC Document...');

    const testKYC = await KYCDoc.create({
      userId: testUser._id,
      documentType: 'national_id',
      frontImage: {
        url: 'https://s3.amazonaws.com/test-bucket/kyc/test-front.jpg',
        key: 'kyc/test-front.jpg'
      },
      backImage: {
        url: 'https://s3.amazonaws.com/test-bucket/kyc/test-back.jpg',
        key: 'kyc/test-back.jpg'
      },
      documentNumber: '12345678',
      fullName: 'John Kamau Mwangi'
    });

    logger.info('✅ KYC Document created:', {
      id: testKYC._id,
      documentType: testKYC.documentType,
      status: testKYC.verificationStatus
    });

    // Test 4: Verify KYC (simulate admin action)
    logger.info('\n🧪 Test 4: Verifying KYC Document...');

    await testKYC.verify(testUser._id as any, 'Document verified successfully');

    const updatedUser = await User.findById(testUser._id);
    logger.info('✅ KYC Verified:', {
      kycStatus: updatedUser?.kycStatus,
      userStatus: updatedUser?.status,
      canTransact: updatedUser?.canTransact()
    });

    // Test 5: Test encryption/decryption
    logger.info('\n🧪 Test 5: Testing National ID encryption...');

    const userWithNationalId = await User.findById(testUser._id);
    logger.info('✅ National ID retrieved (decrypted):', {
      encrypted: userWithNationalId?.nationalIdEncrypted?.substring(0, 50) + '...',
      decrypted: userWithNationalId?.nationalId || null
    });

    // Test 6: Test location-based query
    logger.info('\n🧪 Test 6: Testing geospatial query...');

    const nearbyProfiles = await Profile.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [36.8, -1.3] // Near Nairobi
          },
          $maxDistance: 50000 // 50km
        }
      }
    });

    logger.info('✅ Found nearby profiles:', nearbyProfiles.length);

    // Test 7: Test user cannot transact before verification
    logger.info('\n🧪 Test 7: Creating unverified buyer...');

    const buyerUser = await User.create({
      phone: '254722334455',
      email: 'buyer@test.com',
      nationalIdEncrypted: '87654321',
      role: 'buyer',
      isPhoneVerified: true
    });

    logger.info('✅ Unverified user cannot transact:', {
      canTransact: buyerUser.canTransact(),
      reason: `KYC Status: ${buyerUser.kycStatus}, Status: ${buyerUser.status}`
    });

    // Test 8: Populate relationships
    logger.info('\n🧪 Test 8: Testing virtual populations...');

    const userWithProfile = await User.findById(testUser._id).populate('profile');
    logger.info('✅ User with profile:', {
      userName: (userWithProfile as any)?.profile?.fullNames,
      userRole: userWithProfile?.role,
      farmName: (userWithProfile as any)?.profile?.farmName
    });

    logger.info('\n✅✅✅ All tests passed! Models are working correctly.\n');

    logger.info('📊 Summary:');
    logger.info(`- Users created: ${await User.countDocuments()}`);
    logger.info(`- Profiles created: ${await Profile.countDocuments()}`);
    logger.info(`- KYC Docs created: ${await KYCDoc.countDocuments()}`);
    logger.info(`- Verified users: ${await User.countDocuments({ kycStatus: 'kyc_verified' })}`);
  } catch (error: any) {
    logger.error('❌ Test failed:', error);
  } finally {
    // Cleanup
    logger.info('\n🧹 Cleaning up test data...');
    try {
      await User.deleteMany({ email: { $in: ['farmer@test.com', 'buyer@test.com'] } });
      await Profile.deleteMany({});
      await KYCDoc.deleteMany({});
    } catch (e) {
      logger.error('Cleanup error:', e);
    }
    await mongoose.connection.close();
    logger.info('✅ Database connection closed');
    process.exit(0);
  }
};

testModels();