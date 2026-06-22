const mongoose = require('mongoose');

// This is intentionally a "singleton" collection — only one document should
// ever exist. Using a fixed, known _id makes it trivial to upsert/fetch the
// single settings document without needing a separate "is this the active
// config" flag or query logic.
const SINGLETON_ID = 'shipping_config';

const shippingConfigSchema = new mongoose.Schema(
  {
    _id: { type: String, default: SINGLETON_ID },

    defaultFee: {
      type: Number,
      required: true,
      default: 200,
      min: 0
    },

    freeShippingThreshold: {
      type: Number,
      default: null,
      min: 0
    },

    zoneRates: [
      {
        zoneName: { type: String, required: true, trim: true },
        fee: { type: Number, required: true, min: 0 },
        estimatedDays: {
          min: { type: Number, default: 2, min: 0 },
          max: { type: Number, default: 5, min: 0 }
        }
      }
    ],

    defaultEstimatedDays: {
      min: { type: Number, default: 3, min: 0 },
      max: { type: Number, default: 7, min: 0 }
    },

    shippingPolicyText: {
      type: String,
      default: ''
    }
  },
  { timestamps: true, _id: false }
);

shippingConfigSchema.statics.SINGLETON_ID = SINGLETON_ID;

shippingConfigSchema.statics.getConfig = async function () {
  let config = await this.findById(SINGLETON_ID);
  if (!config) {
    config = await this.create({ _id: SINGLETON_ID });
  }
  return config;
};

module.exports = mongoose.model('ShippingConfig', shippingConfigSchema);
