const multer = require("multer");
const path = require("path");

const { MAX_FILE_SIZE,} = require("../config/upload.config");



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/products");
  },

  filename: (req, file, cb) => {

    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb( null,uniqueName + path.extname(file.originalname));
  },});



const fileFilter = (req, file, cb) => {

  const allowedTypes =  /jpg|jpeg|png|webp/;

  const extName = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );

  const mimeType = allowedTypes.test(file.mimetype);

  if (extName && mimeType) {
    return cb(null, true);
  }

  cb(new Error("Only JPG, JPEG, PNG and WEBP images are allowed."));
};


const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE, },});

module.exports = upload;