import { Job } from 'bull';
import { EscrowService } from '../services/escrowService';
import { Order } from '../models/Order';

const escrowService = new EscrowService();

export const escrowReleaseJob = async (job: Job) => {
  const { orderId } = job.data;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Check if the order is eligible for escrow release
    if (order.status !== 'completed') {
      throw new Error('Order is not completed yet');
    }

    // Release the escrow
    await escrowService.releaseEscrow(orderId);
    console.log(`Escrow released for order ID: ${orderId}`);
  } catch (error) {
    console.error(`Failed to release escrow for order ID: ${orderId}`, error);
    throw error; // Rethrow the error to mark the job as failed
  }
};