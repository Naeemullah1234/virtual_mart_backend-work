const mongoose = require("mongoose");

const productVariantSchema = new mongoose.Schema(
  {
    // --------------------------------
    // Product Reference
    // --------------------------------

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    // --------------------------------
    // SKU
    // --------------------------------

    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 50,
      
    },

    // --------------------------------
// Dynamic Attributes
// --------------------------------

attributes: [
  {
    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    value: {
      type: String,
      required: true,
      trim: true,
    },
  },
],



    // --------------------------------
    // Pricing
    // --------------------------------

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    salePrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    // --------------------------------
    // Stock
    // --------------------------------

    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // --------------------------------
    // Variant Images
    // --------------------------------

    images: [
      {
        type: String,
        trim: true,
      },
    ],

    // --------------------------------
    // Status
    // --------------------------------

    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// --------------------------------
// Prevent Duplicate Variants
// --------------------------------

productVariantSchema.index(
  {
    product: 1,
    color: 1,
    size: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "ProductVariant",
  productVariantSchema
);