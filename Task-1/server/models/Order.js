const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      productId: mongoose.Schema.Types.ObjectId,
      name: String,
      price: Number,
      quantity: Number,
      image: String,
    },
  ],
  shippingAddress: {
    name: String,
    phone: String,
    address: String,
    city: String,
    pincode: String,
  },
  paymentMethod: { type: String, enum: ['COD', 'CARD'], default: 'COD' },
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Delivered'],
    default: 'Pending',
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);
