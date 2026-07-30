const mongoose = require("mongoose");
const slugify = require("slugify");

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
  trim: true,
},

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    productType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductType",
      default: null,
       required: true,
    },

    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      required: true,
    },

    fabricType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FabricType",
      required: true,
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },

    season: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Season",
      default: null,
    },

    sku: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      uppercase: true,
    },

    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    salePrice: {
      type: Number,
      required: true,
      min: 0,
    },

    stock: {
  type: Number,
  default: 0,
  min: 0,
},

averageRating: {
  type: Number,
  default: 0,
  min: 0,
  max: 5,
},

totalReviews: {
  type: Number,
  default: 0,
  min: 0,
},



    images: [
      {
        url: {
          type: String,
          required: true,
          trim: true,
        },

        alt: {
          type: String,
          default: "",
          trim: true,
        },

        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],

    description: {
      type: String,
      trim: true,
      default: "",
    },

    featured: {
      type: Boolean,
      default: false,
    },

    bestSeller: {
      type: Boolean,
      default: false,
    },

    newArrival: {
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);