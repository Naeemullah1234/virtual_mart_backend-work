const express = require("express");
const multer = require("multer");
const router = express.Router();

const upload = require("../middleware/upload.middleware");

router.post("/products", (req, res) => {

  upload.array("images", 3)(req, res, (err) => {

    // Multer Errors
    if (err instanceof multer.MulterError) {

      switch (err.code) {

        case "LIMIT_FILE_SIZE":
          return res.status(400).json({
            success: false,
            message: "Each image must be less than 5MB.",
          });

        case "LIMIT_UNEXPECTED_FILE":
          return res.status(400).json({
            success: false,
            message: "Maximum 3 images are allowed.",
          });

        default:
          return res.status(400).json({
            success: false,
            message: err.message,
          });
      }
    }

    // Custom Errors
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    // No Image
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one image.",
      });
    }

    const uploadedImages = req.files.map((file) => ({
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
      message: "Images uploaded successfully.",
      images: uploadedImages,
    });

  });

});
 
    

module.exports = router;