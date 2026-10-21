
const mongoose = require("mongoose");

const orderNotificationSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      required: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
    },

    sent: {
      type: Boolean,
      default: false,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    lastError: {
      type: String,
      default: "",
    },

    lastAttemptAt: {
      type: Date,
      default: null,
    },

    sentAt: {
      type: Date,
      default: null,
    },

    nextRetryAt: {
      type: Date,
      default: Date.now,
    },

    lockedUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Ek order ke ek status ki duplicate notification nahi banegi.
orderNotificationSchema.index(
  { order: 1, status: 1 },
  { unique: true }
);

// Pending retries ko efficiently search karne ke liye.
orderNotificationSchema.index({
  sent: 1,
  attempts: 1,
  nextRetryAt: 1,
  lockedUntil: 1,
});

module.exports = mongoose.model(
  "OrderNotification",
  orderNotificationSchema
);
