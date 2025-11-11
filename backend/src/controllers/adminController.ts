import { Request, Response } from 'express';
import User from '../models/User';
import Order from '../models/Order';
import AuditLog from '../models/AuditLog';

class AdminController {
  // Get all users
  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await User.find();
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching users', error });
    }
  }

  // Verify KYC for a user
  async verifyKYC(req: Request, res: Response) {
    const { userId } = req.params;
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      user.kycStatus = 'kyc_verified';
      await user.save();

      // Log the action
      await AuditLog.create({ action: 'KYC Verified', userId });

      res.status(200).json({ message: 'KYC verified successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error verifying KYC', error });
    }
  }

  // Update user status
  async updateUserStatus(req: Request, res: Response) {
    const { userId } = req.params;
    const { status } = req.body;
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      user.status = status;
      await user.save();

      // Log the action
      await AuditLog.create({ action: 'User status updated', userId, status });

      res.status(200).json({ message: 'User status updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error updating user status', error });
    }
  }

  // Get all orders
  async getAllOrders(req: Request, res: Response) {
    try {
      const orders = await Order.find().populate('userId');
      res.status(200).json(orders);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching orders', error });
    }
  }

  // Get financial reports
  async getFinancialReports(req: Request, res: Response) {
    // Placeholder for financial report logic
    res.status(200).json({ message: 'Financial reports will be implemented' });
  }

  // Get audit logs
  async getAuditLogs(req: Request, res: Response) {
    try {
      const logs = await AuditLog.find();
      res.status(200).json(logs);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching audit logs', error });
    }
  }
}

export default new AdminController();