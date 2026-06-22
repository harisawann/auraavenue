const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: { type: String, required: true }, // snapshot in case product changes later
    image: { type: String },
    price: { type: Number, required: true }, // price at time of purchase
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String }
  },
  { _id: false }
);

const PAYMENT_METHODS = ['cod', 'jazzcash', 'easypaisa', 'bank_transfer'];

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: {
      type: [orderItemSchema],
      validate: [(arr) => arr.length > 0, 'Order must have at least one item']
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true
    },

    itemsTotal: { type: Number, required: true },
    shippingCost: { type: Number, required: true, default: 0 },
    taxAmount: { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true },

    coupon: {
      code: { type: String, trim: true, uppercase: true },
      discountAmount: { type: Number, min: 0 }
    },

    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      required: [true, 'Payment method is required']
    },
    // For bank transfer: customer-submitted proof reference (e.g. transaction ID),
    // since this method requires manual admin verification before fulfillment.
    paymentReference: {
      type: String,
      trim: true
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },

    // A client-generated idempotency key, set once per checkout attempt.
    // Used to prevent the same cart being submitted twice (e.g. double-click
    // or a retried network request creating duplicate orders).
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },

    orderStatus: {
      type: String,
      enum: ['processing', 'shipped', 'delivered', 'cancelled'],
      default: 'processing'
    },
    deliveredAt: Date,
    cancelledAt: Date
  },
  { timestamps: true }
);

orderSchema.statics.PAYMENT_METHODS = PAYMENT_METHODS;

module.exports = mongoose.model('Order', orderSchema);
