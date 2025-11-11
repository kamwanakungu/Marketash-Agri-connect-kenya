class EscrowService {
  // Calculate all financial components
  calculateOrderFinancials(orderTotal: number, deliveryFee: number = 0) {
    const platformCommission = orderTotal * 0.08; // 8%
    const fixedFee = 50; // KES 50
    const grossPlatformRevenue = platformCommission + fixedFee;
    const vatOnFees = grossPlatformRevenue * 0.16; // 16% VAT
    const netPlatformRevenue = grossPlatformRevenue - vatOnFees;
    const netToSeller = orderTotal - grossPlatformRevenue - deliveryFee;

    return {
      platformCommission,
      fixedFee,
      grossPlatformRevenue,
      vatOnFees,
      netPlatformRevenue,
      netToSeller,
      deliveryFee
    };
  }

  // Release escrow upon POD
  async releaseEscrow(orderId: string) {
    // Logic to release escrow payment
  }
}

export default new EscrowService();