const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    avatar: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      default: "admin",
      enum: ["admin"],
    },

    isVerified: {
  type: Boolean,
  default: false,
},

otp: {
  type: String,
  default: null,
},

otpExpiresAt: {
  type: Date,
  default: null,
},

otpPurpose: {
  type: String,
  enum: ["verification", "forgotPassword","forgotPasswordVerified"],
  default: null,
},

otpResendAvailableAt: {
  type: Date,
  default: null,
},

    isBlocked: {
      type: Boolean,
      default: false,
    },

    refreshToken: {
      type: String,
      default: "",
    },

    tokenVersion: {
  type: Number,
  default: 0,
},

    lastLogin: {
      type: Date,
      default: null,
    },

    
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Admin", adminSchema);