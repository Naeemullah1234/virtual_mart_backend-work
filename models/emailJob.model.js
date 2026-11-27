
const mongoose = require("mongoose");

const emailJobSchema = new mongoose.Schema(
  {
    // Unique identifier for preventing duplicate job creation
    jobId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    type: {
      type: String,
      required: true,
     enum: [
  "sendOTP",
  "sendForgotPasswordOTP",
  "sendOrderStatus",
  "sendInvoice",
],
    },

    recipient: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    // Encrypted email payload
    payloadEncrypted: {
      type: String,
      required: true,
      select: false,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "queued",
        "processing",
        "completed",
        "failed",
        "expired",
      ],
      default: "pending",
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxAttempts: {
      type: Number,
      default: 5,
      min: 1,
    },

    nextAttemptAt: {
      type: Date,
      default: Date.now,
    },

    // Worker locking
    lockToken: {
      type: String,
      default: null,
    },

    lockedAt: {
      type: Date,
      default: null,
    },

    lockedUntil: {
      type: Date,
      default: null,
    },

    // Job expiry, especially for OTP emails
    jobExpiresAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    failedAt: {
      type: Date,
      default: null,
    },

    expiredAt: {
      type: Date,
      default: null,
    },

    lastError: {
      type: String,
      default: null,
      maxlength: 2000,
    },

    // MongoDB automatic cleanup
    deleteAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Dispatcher: find jobs ready for processing
emailJobSchema.index({
  status: 1,
  nextAttemptAt: 1,
});

// Worker recovery: find jobs with expired locks
emailJobSchema.index({
  status: 1,
  lockedUntil: 1,
});

// Automatically delete terminal jobs when deleteAt is reached
emailJobSchema.index(
  { deleteAt: 1 },
  { expireAfterSeconds: 0 }
);

module.exports = mongoose.model("EmailJob", emailJobSchema);
