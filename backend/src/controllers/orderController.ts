import { Request, Response } from 'express';
import Order from '../models/Order';
import { EscrowService } from '../services/escrowService';
import { NotificationService } from '../services/notificationService';

const escrowService = new EscrowService();
const notificationService = new NotificationService();

// Create a new order
export const createOrder = async (req: Request, res: Response) => {
    try {
        const { listingId, buyerId, amount } = req.body;

        const newOrder = new Order({
            listingId,
            buyerId,
            amount,
            status: 'pending',
        });

        await newOrder.save();

        // Notify buyer and seller
        await notificationService.sendOrderNotification(buyerId, newOrder._id);

        res.status(201).json(newOrder);
    } catch (error) {
        res.status(500).json({ message: 'Error creating order', error });
    }
};

// Get all orders for a user
export const getUserOrders = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id; // Assuming user ID is stored in req.user
        const orders = await Order.find({ buyerId: userId }).populate('listingId');

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error });
    }
};

// Get order details
export const getOrderDetails = async (req: Request, res: Response) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId).populate('listingId');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching order details', error });
    }
};

// Update order status
export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;

        const updatedOrder = await Order.findByIdAndUpdate(orderId, { status }, { new: true });

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: 'Error updating order status', error });
    }
};

// Release escrow upon proof of delivery
export const releaseEscrow = async (req: Request, res: Response) => {
    try {
        const orderId = req.params.id;

        await escrowService.releaseEscrow(orderId);

        res.status(200).json({ message: 'Escrow released successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error releasing escrow', error });
    }
};