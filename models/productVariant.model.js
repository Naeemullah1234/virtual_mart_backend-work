const mongoose = require("mongoose");

const productVariantSchema = new mongoose.Schema(
  {
    // --------------------------------
    // Product Reference
    // --------------------------------

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
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

  attributeSignature: {
  type: String,
  trim: true,
  index: true,
},


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
  default: null,
  min: 0,
  validate: {
    validator: function (value) {
      return value === null || value <= this.price;
    },
    message: "Sale price cannot be greater than price.",
  },
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
    filename: {
      type: String,
      trim: true,
      required: true,
    },

    url: {
      type: String,
      trim: true,
      required: true,
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

  },
  {
    timestamps: true,
  }
);

// --------------------------------
// Generate Attribute Signature
// --------------------------------

productVariantSchema.pre("validate", function () {
  if (!Array.isArray(this.attributes) || this.attributes.length === 0) {
    this.attributeSignature = "";
    return;
  }

  const normalizedAttributes = this.attributes
    .map((attribute) => ({
      key: attribute.key.trim().toLowerCase(),
      value: attribute.value.trim().toLowerCase(),
    }))
    .sort((a, b) => a.key.localeCompare(b.key));

  this.attributeSignature = normalizedAttributes
    .map((attribute) => `${attribute.key}:${attribute.value}`)
    .join("|");
});

productVariantSchema.index(
  {
    product: 1,
    attributeSignature: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      product: { $type: "objectId" },
    },
  }
);



module.exports = mongoose.model(
  "ProductVariant",
  productVariantSchema
);