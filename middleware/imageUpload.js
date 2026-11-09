
const multer = require("multer");
const crypto = require("crypto");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const cloudinary = require("../config/cloudinary");

const {
  MAX_FILE_SIZE,
  MAX_PRODUCT_IMAGES,
  MAX_REVIEW_IMAGES,
} = require("../config/upload.config");

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const createImageUpload = (folder, maxFiles) => {
  const storage = new CloudinaryStorage({
    cloudinary,

    params: async (req, file) => ({
      folder,
      public_id: crypto.randomUUID(),
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      resource_type: "image",
    }),
  });

  const fileFilter = (req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error("Only JPG, JPEG and WEBP images are allowed.")
      );
    }

    return cb(null, true);
  };

  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: MAX_FILE_SIZE,
      files: maxFiles,
    },
  }).array("images", maxFiles);

  return (req, res, next) => {
    upload(req, res, (error) => {
      if (error) {
        if (error instanceof multer.MulterError) {
          return res.status(400).json({
            success: false,
            message:
              error.code === "LIMIT_FILE_SIZE"
                ? "Image size must not exceed 5 MB."
                : error.code === "LIMIT_FILE_COUNT"
                ? `Maximum ${maxFiles} images are allowed.`
                : error.message,
          });
        }

        return res.status(400).json({
          success: false,
          message: error.message || "Image upload failed.",
        });
      }

      return next();
    });
  };
};

const productUpload = createImageUpload(
  "virtual-mart/products",
  MAX_PRODUCT_IMAGES
);

const reviewUpload = createImageUpload(
  "virtual-mart/reviews",
  MAX_REVIEW_IMAGES
);

module.exports = {
  productUpload,
  reviewUpload,
};
