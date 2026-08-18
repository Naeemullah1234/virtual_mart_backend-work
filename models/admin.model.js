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
      unique: true,
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
      unique: true,
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

    isBlocked: {
      type: Boolean,
      default: false,
    },

    refreshToken: {
      type: String,
      default: "",
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