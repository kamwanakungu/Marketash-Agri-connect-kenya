import { Router } from 'express';
import { getUserProfile, updateUserProfile, uploadKYC } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Get user profile
router.get('/profile', authMiddleware, getUserProfile);

// Update user profile
router.put('/profile', authMiddleware, updateUserProfile);

// Upload KYC document
router.post('/kyc/upload', authMiddleware, uploadKYC);

export default router;