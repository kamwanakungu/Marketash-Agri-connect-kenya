import { Router } from 'express';
import { 
  registerInit, 
  registerVerify, 
  registerComplete, 
  loginInit, 
  loginVerify, 
  refreshToken, 
  logout 
} from '../controllers/authController';

const router = Router();

// Authentication Routes
router.post('/register/init', registerInit);
router.post('/register/verify', registerVerify);
router.post('/register/complete', registerComplete);
router.post('/login/init', loginInit);
router.post('/login/verify', loginVerify);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

export default router;