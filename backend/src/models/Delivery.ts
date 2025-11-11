import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_transit', 'delivered', 'failed'],
    default: 'pending'
  },
  deliveryAddress: {
    type: String,
    required: true
  },
  deliveryFee: {
    type: Number,
    required: true
  },
  trackingNumber: {
    type: String,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('Delivery', deliverySchema);