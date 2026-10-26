
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    
    images: {
      type: [
        {
          url: {
            type: String,
            required: true,
          },
          filename: {
            type: String,
            required: true,
          },
        },
      ],
      default: [],
      validate: {
       validator: function (images) {
  return images.length <= 3;
},
message: "A review can contain a maximum of 3 images.",
      },
    },


    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);


reviewSchema.index(
  { customer: 1, product: 1 },
  { unique: true }
);

module.exports = mongoose.model("Review", reviewSchema);
