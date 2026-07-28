const mongoose = require("mongoose");
const slugify = require("slugify");

const fabricTypeSchema = new mongoose.Schema(
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

fabricTypeSchema.pre("save", function () {
  this.slug = slugify(this.name, {
    lower: true,
    strict: true,
  });

});

module.exports = mongoose.model("FabricType", fabricTypeSchema);