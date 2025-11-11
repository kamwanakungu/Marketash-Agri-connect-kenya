import { Request, Response } from 'express';
import Payment from '../models/Payment';
import Order from '../models/Order';
import EscrowService from '../services/escrowService';
import MPesaService from '../services/mpesaService';

const escrowService = new EscrowService();
const mpesaService = new MPesaService();

// Initiate payment
export const initiatePayment = async (req: Request, res: Response) => {
    const { orderId, amount, phoneNumber } = req.body;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const payment = await mpesaService.initiateSTKPush(phoneNumber, amount, order._id.toString(), orderId);
        res.status(200).json(payment);
    } catch (error) {
        res.status(500).json({ message: 'Payment initiation failed', error: error.message });
    }
};

// Handle M-Pesa STK callback
export const handleSTKCallback = async (req: Request, res: Response) => {
    const callbackData = req.body;

    try {
        await mpesaService.handleSTKCallback(callbackData);
        res.status(200).send('Callback processed');
    } catch (error) {
        res.status(500).json({ message: 'Error processing callback', error: error.message });
    }
};

// Handle M-Pesa B2C callback
export const handleB2CCallback = async (req: Request, res: Response) => {
    const callbackData = req.body;

    try {
        await mpesaService.handleB2CCallback(callbackData);
        res.status(200).send('B2C Callback processed');
    } catch (error) {
        res.status(500).json({ message: 'Error processing B2C callback', error: error.message });
    }
};

// Release escrow upon successful payment
export const releaseEscrow = async (req: Request, res: Response) => {
    const { orderId } = req.body;

    try {
        await escrowService.releaseEscrow(orderId);
        res.status(200).json({ message: 'Escrow released successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error releasing escrow', error: error.message });
    }
};