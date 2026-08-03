const fs = require("fs");
const path = require("path");
const Product = require("../models/product.model");

// --------------------------------
// Cleanup Orphan Images
// --------------------------------

const cleanupOrphanImages = async () => {
  try {

    // Upload Folder
    const uploadFolder = path.join(
      __dirname,
      "..",
      "uploads",
      "products"
    );

    // Read All Files
    const uploadedFiles = fs.readdirSync(uploadFolder);

    // Get All Products
    const products = await Product.find().select("images.filename");

    // Store DB Filenames
    const usedImages = new Set();

    products.forEach((product) => {

      product.images.forEach((image) => {

        if (image.filename) {
          usedImages.add(image.filename);
        }

      });

    });

    // Delete Orphan Images
    uploadedFiles.forEach((file) => {

      if (!usedImages.has(file)) {

        fs.unlinkSync(path.join(uploadFolder, file));

        console.log(`Deleted Orphan Image: ${file}`);

      }

    });

   console.log("✅ Orphan Image Cleanup Completed.");

  } catch (error) {

    console.log("Cleanup Error:", error);

  }
};

module.exports = cleanupOrphanImages;