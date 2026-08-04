const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    
    firstName: { type: String,required: true,trim: true, maxlength: 25,},

    lastName: { type: String, required: true, trim: true, maxlength: 25,},

    email: { type: String, required: true, unique: true, lowercase: true, trim: true,},

    phone: { type: String, required: true,unique: true,trim: true,},

    password: { type: String,required: true, select: false,},
  
    avatar: { type: String, default: "", },

    isEmailVerified: { type: Boolean, default: false,},

    isPhoneVerified: { type: Boolean, default: false,},

    googleId: { type: String, default: null,},

  refreshToken: { type: String,default: null,},
    
  isActive: { type: Boolean, default: true,},

   loginAttempts: { type: Number, default: 0,},

  lockUntil: { type: Date, default: null,},

  lastLogin:{ type: Date, default: null },

  isDeleted: { type: Boolean, default: false,},
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Customer", customerSchema);