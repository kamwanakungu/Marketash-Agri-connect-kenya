import { Router } from 'express';
import { initiatePayment, handleSTKCallback, handleB2CCallback } from '../controllers/paymentController';
import { validatePayment } from '../middleware/validation';

const router = Router();

// Initiate payment
router.post('/initiate', validatePayment, initiatePayment);

// M-Pesa STK callback
router.post('/stk', handleSTKCallback);

// M-Pesa B2C callback
router.post('/b2c', handleB2CCallback);

export default router;