import { Router } from 'express';
import { 
  createOrder, 
  getUserOrders, 
  getOrderDetails, 
  initiatePayment 
} from '../controllers/orderController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Create a new order
router.post('/', authenticate, createOrder);

// Get all orders for the authenticated user
router.get('/', authenticate, getUserOrders);

// Get details of a specific order
router.get('/:id', authenticate, getOrderDetails);

// Initiate payment for an order
router.post('/initiate-payment', authenticate, initiatePayment);

export default router;