const Product = require("../models/product.model");
const fs = require("fs");
const path = require("path");

// Delete Uploaded Image
const deleteUploadedImage = async (req, res) => {
  try {

    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({
        success: false,
        message: "Filename is required.",
      });
    }

    const product = await Product.findOne({
  "images.filename": filename,
});

if (product) {
  return res.status(400).json({
    success: false,
    message: "Image is attached to a product. Remove it from the product first.",
  });
}


    const imagePath = path.join(
      __dirname,
      "..",
      "uploads",
      "products",
      filename
    );

    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        message: "Image not found.",
      });
    }

    fs.unlinkSync(imagePath);

    return res.status(200).json({
      success: true,
      message: "Image deleted successfully.",
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  deleteUploadedImage,
};