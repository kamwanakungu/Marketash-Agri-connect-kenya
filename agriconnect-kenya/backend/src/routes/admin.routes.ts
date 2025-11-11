import { Router } from 'express';
import { 
  getAllUsers, 
  updateUserStatus, 
  verifyKYC, 
  getAllOrders, 
  getFinancialReports, 
  getAuditLogs 
} from '../controllers/adminController';
import { auth } from '../middleware/auth';
import { rbac } from '../middleware/rbac';

const router = Router();

// Admin Routes
router.get('/users', auth, rbac('admin'), getAllUsers);
router.put('/users/:id/status', auth, rbac('admin'), updateUserStatus);
router.put('/users/:id/kyc', auth, rbac('admin'), verifyKYC);
router.get('/orders', auth, rbac('admin'), getAllOrders);
router.get('/financials', auth, rbac('admin'), getFinancialReports);
router.get('/audit-logs', auth, rbac('admin'), getAuditLogs);

export default router;