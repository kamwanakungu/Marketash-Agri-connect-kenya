import axios from 'axios';

class SMSService {
  private apiUrl: string;
  private username: string;
  private apiKey: string;
  private senderId: string;

  constructor() {
    this.apiUrl = 'https://api.africastalking.com/version1/messaging';
    this.username = process.env.AT_USERNAME || '';
    this.apiKey = process.env.AT_API_KEY || '';
    this.senderId = process.env.AT_SENDER_ID || 'AGRICONNECT';
  }

  async sendSMS(to: string, message: string): Promise<any> {
    try {
      const response = await axios.post(this.apiUrl, {
        to,
        message,
        from: this.senderId,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${this.username}:${this.apiKey}`).toString('base64')}`,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }
}

export default new SMSService();