
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { MAX_FILE_SIZE } = require("../config/upload.config");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isReviewUpload = req.originalUrl.includes("/reviews");
    const folder = isReviewUpload
      ? "uploads/reviews"
      : "uploads/products";

    fs.mkdir(folder, { recursive: true }, (err) => {
      cb(err, folder);
    });
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueName + path.extname(file.originalname).toLowerCase());
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = new Set([
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
  ]);

  const ext = path.extname(file.originalname).toLowerCase();
  const allowedMimeTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);

  if (allowedTypes.has(ext) && allowedMimeTypes.has(file.mimetype)) {
    return cb(null, true);
  }

  cb(new Error("Only JPG, JPEG, PNG and WEBP images are allowed."));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

module.exports = upload;
