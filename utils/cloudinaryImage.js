const cloudinary = require("../config/cloudinary");

const getOptimizedImageUrl = (publicId) => {
  if (!publicId) return "";

  return cloudinary.url(publicId, {
    fetch_format: "auto",
    quality: "auto",
    secure: true,
  });
};

module.exports = { getOptimizedImageUrl };