const express = require("express");
const multer = require("multer");
const router = express.Router();
const upload = require("../middleware/upload.middleware");
const {MAX_PRODUCT_IMAGES,MAX_REVIEW_IMAGES,} = require("../config/upload.config");
const {protect,authorize,} = require("../middleware/auth.middleware");
const {customerProtect,} = require("../middleware/customerAuth.middleware");
const {deleteUploadedImage,} = require("../controllers/upload.controller");


router.post("/products",protect,authorize("admin"),
  (req, res, next) => {
    upload.array("images", MAX_PRODUCT_IMAGES)(req, res, (err) => {
      if (err) return handleUploadError(err, res);
      next();
    });
  },
  (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one image.",
      });
    }

    const images = req.files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      url: `/uploads/products/${file.filename}`,
      size: file.size,
      mimeType: file.mimetype,
      alt: "",
      isPrimary: false,
    }));

    return res.status(200).json({
      success: true,
      message: "Product images uploaded successfully.",
      images,
    });
  }
);


router.post("/reviews",customerProtect,
  (req, res, next) => {
    upload.array("images", MAX_REVIEW_IMAGES)(req, res, (err) => {
      if (err) return handleUploadError(err, res);
      next();
    });
  },
  (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one review image.",
      });
    }

    const images = req.files.map((file) => ({
      filename: file.filename,
      url: `/uploads/products/${file.filename}`,
    }));

    return res.status(200).json({
      success: true,
      message: "Review images uploaded successfully.",
      images,
    });
  }
);


function handleUploadError(err, res) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Each image must not exceed 5 MB.",
      });
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Too many images uploaded.",
      });
    }
  }

  return res.status(400).json({
    success: false,
    message: err.message || "Image upload failed.",
  });
}


router.delete("/products/:filename",protect,authorize("admin"),deleteUploadedImage);

module.exports = router;
