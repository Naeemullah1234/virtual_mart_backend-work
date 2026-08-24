const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    
    firstName: { type: String,required: true,trim: true, maxlength: 25,},

    lastName: { type: String, required: true, trim: true, maxlength: 25,},

    email: { type: String, required: true, unique: true, lowercase: true, trim: true,},

    phone: { type: String, required: true,unique: true,trim: true,},

    password: { type: String,required: true, select: false,},
  
    avatar: { type: String, default: "", },

     role: { type: String, enum: ["customer", "admin"],default: "customer"},

    isEmailVerified: { type: Boolean, default: false,},

    isPhoneVerified: { type: Boolean, default: false,},

    googleId: { type: String, default: null,},

    isBlocked: { type: Boolean,default: false,},

      isVerified: { type: Boolean,default: false,},

    isBlocked: { type: Boolean,default: false,},

    otp: { type: String,default: null,},

    otpExpiresAt: { type: Date,default: null,},

    otpPurpose: {  type: String, enum: ["verification","forgotPassword","forgotPasswordVerified",null,], default: null,},

    otpResendAvailableAt: { type: Date,default: null,},

    refreshToken: { type: String, default: "",},

    tokenVersion: { type: Number,default: 0,},

    lastLogin: { type: Date,default: null,},


    
  isActive: { type: Boolean, default: true,},

 

   loginAttempts: { type: Number, default: 0,},

  lockUntil: { type: Date, default: null,},



  isDeleted: { type: Boolean, default: false,},
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Customer", customerSchema);