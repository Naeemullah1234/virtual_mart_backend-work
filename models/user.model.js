const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
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
      default: "",
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    avatar: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },

    isVerified: {
      type: Boolean,
      default: false,
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
    },
  },
  {
    timestamps: true,
  }
);


userSchema.pre("save", async function () {
  if (!this.isModified("password")) return 

  this.password = await bcrypt.hash(this.password, 10);


});


userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);