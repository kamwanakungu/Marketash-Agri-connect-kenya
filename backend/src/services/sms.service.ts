import axios from 'axios';
import logger from '../utils/logger';

type OrderDetails = {
  orderId: string | number;
  amount?: number;
};

class SMSService {
  private username: string | undefined;
  private apiKey: string | undefined;
  private senderId: string;
  private baseUrl: string;

  constructor() {
    this.username = process.env.AT_USERNAME;
    this.apiKey = process.env.AT_API_KEY;
    this.senderId = process.env.AT_SENDER_ID || 'AGRICONNECT';
    this.baseUrl = 'https://api.sandbox.africastalking.com/version1';

    if (this.username && this.username !== 'sandbox') {
      this.baseUrl = 'https://api.africastalking.com/version1';
    }
  }

  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private validatePhone(phoneNumber: string) {
    if (!/^254[0-9]{9}$/.test(phoneNumber)) {
      throw new Error('Invalid phone number format. Must be E.164 without + (e.g., 2547XXXXXXXX)');
    }
  }

  async sendSMS(phoneNumber: string, message: string): Promise<any> {
    try {
      this.validatePhone(phoneNumber);

      // Dev mode: log instead of calling external API when API key missing
      if (process.env.NODE_ENV === 'development' && !this.apiKey) {
        logger.warn('SMS Service in DEV mode - not sending actual SMS');
        logger.info(`[DEV SMS] To: ${phoneNumber}, Message: ${message}`);
        return {
          success: true,
          message: 'DEV mode - SMS logged',
          data: { Recipients: [{ status: 'Success' }] }
        };
      }

      const params = new URLSearchParams({
        username: this.username || '',
        to: phoneNumber,
        message,
        from: this.senderId
      });

      const response = await axios.post(
        `${this.baseUrl}/messaging`,
        params.toString(),
        {
          headers: {
            apiKey: this.apiKey || '',
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json'
          },
          timeout: 10000
        }
      );

      const recipient = response.data?.SMSMessageData?.Recipients?.[0];
      logger.info('SMS sent', { phoneNumber, status: recipient?.status ?? 'unknown' });

      return {
        success: true,
        message: 'SMS sent successfully',
        data: response.data?.SMSMessageData
      };
    } catch (error: any) {
      logger.error('SMS sending failed', {
        phoneNumber,
        error: error?.message,
        response: error?.response?.data
      });
      return {
        success: false,
        message: 'Failed to send SMS',
        error: error?.message
      };
    }
  }

  async sendOTP(phoneNumber: string, otp: string): Promise<any> {
    const message = `Your AgriConnect Kenya verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`;
    return this.sendSMS(phoneNumber, message);
  }

  async sendOrderNotification(phoneNumber: string, orderDetails: OrderDetails): Promise<any> {
    const message = `AgriConnect: New order #${orderDetails.orderId}. Amount: KES ${orderDetails.amount ?? 'N/A'}. Check your app for details.`;
    return this.sendSMS(phoneNumber, message);
  }

  async sendPaymentConfirmation(phoneNumber: string, amount: number, orderId: string | number): Promise<any> {
    const message = `AgriConnect: Payment of KES ${amount} received for order #${orderId}. Thank you!`;
    return this.sendSMS(phoneNumber, message);
  }

  async sendDeliveryNotification(phoneNumber: string, status: string, orderId: string | number): Promise<any> {
    let message = `AgriConnect: Order #${orderId} status updated to ${status}.`;
    if (status === 'assigned') message = `AgriConnect: Driver assigned to order #${orderId}. Track in app.`;
    if (status === 'picked_up') message = `AgriConnect: Order #${orderId} picked up. Delivery in progress.`;
    if (status === 'delivered') message = `AgriConnect: Order #${orderId} delivered successfully. Please confirm receipt.`;
    return this.sendSMS(phoneNumber, message);
  }

  async sendPayoutNotification(phoneNumber: string, amount: number, orderId: string | number): Promise<any> {
    const message = `AgriConnect: You've received KES ${amount} for order #${orderId}. Check your M-Pesa.`;
    return this.sendSMS(phoneNumber, message);
  }

  async sendKYCStatusNotification(phoneNumber: string, status: 'kyc_verified' | 'rejected', reason = ''): Promise<any> {
    let message = '';
    if (status === 'kyc_verified') {
      message = 'AgriConnect: Your KYC verification is complete! You can now start transacting on the platform.';
    } else if (status === 'rejected') {
      message = `AgriConnect: Your KYC was not approved. Reason: ${reason}. Please resubmit correct documents.`;
    }
    return this.sendSMS(phoneNumber, message);
  }
}

export default new SMSService();