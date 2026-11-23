const mongoose = require("mongoose");
const Product = require("../models/product.model");
const ProductVariant = require("../models/productVariant.model");
const { getOptimizedImageUrl } = require("../utils/cloudinaryImage");

const getVTOProductImage = async (req, res) => {
  try {
    const { productId } = req.params;
    const { variantId } = req.query;

    // Validate Product ID
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID.",
      });
    }

    const product = await Product.findOne({_id: productId,isDeleted: false,isActive: true,})
   .select("name images category productType isVTOEnabled vtoTypes")
   .populate("category", "name")
   .populate("productType", "name");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or inactive.",
      });}
    
    // Check if VTO is enabled for this product
   if (!product.isVTOEnabled) {
  return res.status(400).json({
    success: false,
    message: "VTO is not enabled for this product.",
  });}

// Check VTO Types
if (!product.vtoTypes || product.vtoTypes.length === 0) {
  return res.status(400).json({
    success: false,
    message: "VTO type is not configured for this product.",
  });
}

    // Validate allowed VTO Types
const allowedVTOTypes = [
  "body",
  "head",
  "face",
  "ears",
  "neck",
];

const invalidVTOType = product.vtoTypes.some(
  (type) => !allowedVTOTypes.includes(type)
);

if (invalidVTOType) {
  return res.status(400).json({
    success: false,
    message: "Invalid VTO configuration for this product.",
  });
}

   if (!Array.isArray(product.images) || product.images.length === 0) {
  return res.status(404).json({
    success: false,
    message: "Product images not found.",
  });
}

    // Get Product Primary Image
    const primaryImage = product.images.find(
      (image) => image.isPrimary
    );

    if (!primaryImage) {
      return res.status(404).json({
        success: false,
        message: "Product primary image not found.",
      });
    }

    let selectedImage = primaryImage;
    let imageSource = "product";
    let selectedVariant = null;

    // Validate and find selected Variant
    if (variantId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(variantId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Variant ID.",
        });
      }

      selectedVariant = await ProductVariant.findOne({ _id: variantId, product: product._id,}).select("sku image");

      if (!selectedVariant) {
        return res.status(404).json({
          success: false,
          message: "Variant not found for this product.",
        });
      }

      // Use Variant image if available
      if (selectedVariant.image?.public_id) {
        selectedImage = selectedVariant.image;
        imageSource = "variant";
      }
    }

    return res.status(200).json({
      success: true,
      message: "VTO image fetched successfully.",
        product: {_id: product._id, name: product.name,
    category: product.category?.name || null,
    productType: product.productType?.name || null,
    isVTOEnabled: product.isVTOEnabled,
    vtoTypes: product.vtoTypes,
  },
      vtoImage: {
        public_id: selectedImage.public_id,
        originalUrl: selectedImage.url,
        optimizedUrl: getOptimizedImageUrl(
          selectedImage.public_id
        ),
        source: imageSource,
        alt: selectedImage.alt || product.name,
      },
      variant: selectedVariant
        ? {
            _id: selectedVariant._id,
            sku: selectedVariant.sku,
          }
        : null,
    });

  } catch (error) {
    console.error("Get VTO Product Image Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch VTO image.",
    });
  }
};

module.exports = { getVTOProductImage };
