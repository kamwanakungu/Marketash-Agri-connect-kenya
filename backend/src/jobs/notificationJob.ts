import { Job } from 'bull';
import { notificationService } from '../services/notificationService';

export const notificationJob = async (job: Job) => {
  const { userId, message } = job.data;

  try {
    // Send notification to the user
    await notificationService.sendNotification(userId, message);
    console.log(`Notification sent to user ${userId}: ${message}`);
  } catch (error) {
    console.error(`Failed to send notification to user ${userId}:`, error);
    throw error; // Rethrow error to let Bull handle retries
  }
};