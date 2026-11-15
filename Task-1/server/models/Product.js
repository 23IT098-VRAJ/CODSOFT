const mongoose = require('mongoose');
const { CATEGORIES } = require('../config/constants');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: 150 },
    description: { type: String, default: '', maxlength: 2000 },
    price: { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'] }, // in rupees
    category: { type: String, enum: CATEGORIES, required: [true, 'Category is required'] },
    brand: { type: String, trim: true, default: 'Generic' },
    images: [String],
    stock: { type: Number, default: 0, min: [0, 'Stock cannot be negative'] },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
  },
  { timestamps: true }
);

// Indexes that back the catalogue filters and sorts.
productSchema.index({ category: 1, price: 1 });
productSchema.index({ 'rating.average': -1, 'rating.count': -1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
