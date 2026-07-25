const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    brand: {
      type: String,
      default: "",
    },

    price: {
      type: Number,
      required: true,
    },

    discountPrice: {
      type: Number,
      default: 0,
    },

    stock: {
      type: Number,
      required: true,
      default: 0,
    },

    images: [
      {
        type: String,
      },
    ],

    description: {
      type: String,
      default: "",
    },

    fabric: {
      type: String,
      default: "",
    },

    color: [
      {
        type: String,
      },
    ],

    size: [
      {
        type: String,
      },
    ],

    featured: {
      type: Boolean,
      default: false,
    },

    bestSeller: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
    unit: {
   type: String,
   enum: ["Stitches", "UnStitches", "2Pieces"],
   default: "UnStitches"
},
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);