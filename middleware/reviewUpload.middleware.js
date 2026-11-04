const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const mongoose = require("mongoose");

const cloudinary = require("../config/cloudinary");
const Review = require("../models/review.model");
const { MAX_FILE_SIZE } = require("../config/upload.config");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "virtual-mart/reviews",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const fileFilter = (req, file, cb) => {
  (async () => {
    const { productId, orderId } = req.body;

    if (
      req.user?._id &&
      mongoose.isValidObjectId(productId) &&
      mongoose.isValidObjectId(orderId)
    ) {
      const existingReview = await Review.findOne({
        customer: req.user._id,
        product: productId,
        order: orderId,
      });

      if (existingReview) {
        const error = new Error(
          "You have already reviewed this product for this order."
        );
        error.status = 409;
        return cb(error);
      }
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG, JPEG, PNG and WEBP images are allowed."));
    }

    cb(null, true);
  })().catch(cb);
};

const uploadImages = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).array("images", 3);

const reviewUpload = (req, res, next) => {
  uploadImages(req, res, (error) => {
    if (error) {
      if (error.status === 409) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }

      return next(error);
    }

    next();
  });
};

module.exports = reviewUpload;