const mongoose = require("mongoose");
const slugify = require("slugify");

const brandSchema = new mongoose.Schema(
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

    logo: {
      type: String,
      default: "",
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

brandSchema.pre("save", function (next) {
  this.slug = slugify(this.name, {
    lower: true,
    strict: true,
  });

  next();
});

module.exports = mongoose.model("Brand", brandSchema);