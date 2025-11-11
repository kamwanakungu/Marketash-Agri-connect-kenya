import express from 'express';
import { body } from 'express-validator';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { registrationValidation, otpValidation, loginValidation } from '../middleware/validation';

const router = express.Router();

/**
 * POST /api/v1/auth/register/init
 * Initiate registration - Send OTP
 */
router.post(
  '/register/init',
  [
    body('phone')
      .matches(/^254[71]\d{8}$/)
      .withMessage('Invalid Safaricom phone number format')
  ],
  authController.initiateRegistration
);

/**
 * POST /api/v1/auth/register/complete
 * Complete registration with mandatory fields
 */
router.post(
  '/register/complete',
  [
    body('phone').matches(/^254[71]\d{8}$/),
    body('otp').isLength({ min: 6, max: 6 }),
    body('email').isEmail().normalizeEmail(),
    body('fullNames').trim().isLength({ min: 3, max: 100 }),
    body('nationalId').trim().isLength({ min: 7, max: 9 }).matches(/^\d+$/),
    body('role').isIn(['farmer', 'buyer', 'driver', 'cooperative_manager']),
    body('location').isObject(),
    body('location.coordinates').isArray({ min: 2, max: 2 }),
    body('location.coordinates.0').isFloat({ min: -180, max: 180 }),
    body('location.coordinates.1').isFloat({ min: -90, max: 90 })
  ],
  authController.completeRegistration
);

/**
 * POST /api/v1/auth/login/init
 * Initiate login - Send OTP
 */
router.post(
  '/login/init',
  loginValidation,
  authController.initiateLogin
);

/**
 * POST /api/v1/auth/login/verify
 * Verify OTP and complete login
 */
router.post(
  '/login/verify',
  otpValidation,
  authController.verifyLogin
);

/**
 * POST /api/v1/auth/refresh
 * Refresh access token
 */
router.post(
  '/refresh',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required')
  ],
  authController.refreshToken
);

/**
 * POST /api/v1/auth/logout
 * Logout user (private)
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

/**
 * GET /api/v1/auth/me
 * Get current user (private)
 */
router.get(
  '/me',
  authenticate,
  authController.getCurrentUser
);

export default router;