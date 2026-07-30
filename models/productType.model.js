const mongoose = require("mongoose");
const slugify = require("slugify");

const productTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },

    displayOrder: {
      type: Number,
      default: 0,
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

productTypeSchema.pre("save", function () {
  this.slug = slugify(this.name, {
    lower: true,
    strict: true,
  });


});

module.exports = mongoose.model("ProductType", productTypeSchema);