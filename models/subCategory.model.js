const mongoose = require("mongoose");
const slugify = require("slugify");

const subCategorySchema = new mongoose.Schema(
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

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    image: {
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

subCategorySchema.pre("save", function () {
  this.slug = slugify(this.name, {
    lower: true,
    strict: true,
  });


});

module.exports = mongoose.model("SubCategory", subCategorySchema);