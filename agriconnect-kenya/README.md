# AgriConnect Kenya

AgriConnect Kenya is a full-stack MERN application designed to facilitate an agricultural marketplace. The platform integrates M-Pesa for payments, implements KYC verification for user authentication, and utilizes an escrow system to ensure secure transactions between buyers and sellers.

## Features

- **User Authentication**: Secure registration and login processes with OTP verification.
- **KYC Verification**: Upload and verification of user identification documents.
- **Marketplace Listings**: Farmers can create, update, and delete their product listings.
- **Bidding System**: Buyers can place bids on listings or purchase items directly.
- **Order Management**: Users can view and manage their orders.
- **Payment Integration**: Seamless payment processing through M-Pesa.
- **Escrow Payments**: Funds are held in escrow until the delivery is confirmed.
- **Delivery Tracking**: Drivers can manage deliveries and submit proof of delivery (POD).
- **Admin Dashboard**: Admins can manage users, verify KYC documents, and generate financial reports.

## Technology Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, MongoDB, Redis, M-Pesa API
- **Search**: ElasticSearch
- **Storage**: AWS S3
- **State Management**: Redux Toolkit
- **Testing**: Jest, React Testing Library

## Installation

### Prerequisites

- Node.js (v18+)
- MongoDB (v6.0+)
- Redis (v7.0+)
- Docker (for containerization)

### Clone the Repository

```bash
git clone https://github.com/yourusername/agriconnect-kenya.git
cd agriconnect-kenya
```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example` and configure your environment variables.

4. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend application:
   ```bash
   npm run dev
   ```

## Docker Setup

To run the application using Docker, navigate to the `infra` directory and use Docker Compose:

```bash
cd infra
docker-compose up
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Contact

For inquiries, please contact [your-email@example.com].