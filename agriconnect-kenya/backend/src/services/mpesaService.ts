import axios from 'axios';

class MPesaService {
  private baseUrl: string;
  private consumerKey: string;
  private consumerSecret: string;
  private shortcode: string;
  private passkey: string;
  private callbackUrl: string;

  constructor() {
    this.baseUrl = process.env.MPESA_ENVIRONMENT === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke'
      : 'https://api.safaricom.co.ke';
    this.consumerKey = process.env.MPESA_CONSUMER_KEY!;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET!;
    this.shortcode = process.env.MPESA_SHORTCODE!;
    this.passkey = process.env.MPESA_PASSKEY!;
    this.callbackUrl = process.env.MPESA_CALLBACK_URL!;
  }

  async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
    const response = await axios.get(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    return response.data.access_token;
  }

  async initiateSTKPush(phoneNumber: string, amount: number, accountRef: string, orderId: string): Promise<any> {
    const token = await this.getAccessToken();
    const payload = {
      businessShortCode: this.shortcode,
      password: this.generatePassword(),
      timestamp: this.getTimestamp(),
      transactionType: 'CustomerPayBillOnline',
      amount,
      partyA: phoneNumber,
      partyB: this.shortcode,
      phoneNumber,
      callbackUrl: this.callbackUrl,
      accountReference: accountRef,
      transactionDesc: `Payment for order ${orderId}`,
    };

    const response = await axios.post(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  async querySTKPushStatus(checkoutRequestId: string): Promise<any> {
    const token = await this.getAccessToken();
    const response = await axios.get(`${this.baseUrl}/mpesa/stkpushquery/v1/query`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        shortcode: this.shortcode,
        checkoutRequestId,
      },
    });
    return response.data;
  }

  async initiateB2CPayout(phoneNumber: string, amount: number, remarks: string): Promise<any> {
    const token = await this.getAccessToken();
    const payload = {
      initiatorName: process.env.MPESA_B2C_INITIATOR!,
      securityCredential: process.env.MPESA_B2C_SECURITY_CREDENTIAL!,
      commandId: 'BusinessPayment',
      amount,
      partyA: process.env.MPESA_B2C_SHORTCODE!,
      partyB: phoneNumber,
      remarks,
      queueTimeOutURL: this.callbackUrl,
      resultURL: this.callbackUrl,
    };

    const response = await axios.post(`${this.baseUrl}/mpesa/b2c/v1/paymentrequest`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  async handleSTKCallback(callbackData: any): Promise<void> {
    // Handle the STK Push callback data
  }

  async handleB2CCallback(callbackData: any): Promise<void> {
    // Handle the B2C callback data
  }

  private generatePassword(): string {
    const timestamp = this.getTimestamp();
    return Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');
  }

  private getTimestamp(): string {
    const date = new Date();
    return `${date.getFullYear()}${this.pad(date.getMonth() + 1)}${this.pad(date.getDate())}${this.pad(date.getHours())}${this.pad(date.getMinutes())}${this.pad(date.getSeconds())}`;
  }

  private pad(number: number): string {
    return number < 10 ? `0${number}` : `${number}`;
  }
}

export default new MPesaService();