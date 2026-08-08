const Product = require("../models/product.model");
const ProductVariant = require("../models/productVariant.model");
const { validateSKU,validatePrice,validateSalePrice,validateStock,validateAttributes,} = require("../validators/productVariant.validator");
const mongoose = require("mongoose");





const createProductVariant = async (req, res) => {
  try {

    const { product,sku,attributes,price,salePrice,stock,images,} = req.body;

    // --------------------------------
// Required Fields Validation
// --------------------------------

if (
  !product ||
  !sku ||
  !attributes ||
  !price ||
  stock === undefined
) {
  return res.status(400).json({
    success: false,
    message: "Please fill all required fields.",
  });
}

// --------------------------------
// Attributes Validation
// --------------------------------

if (!Array.isArray(attributes) || attributes.length === 0) {
  return res.status(400).json({
    success: false,
    message: "At least one attribute is required.",
  });
}

// --------------------------------
// Product Validation
// --------------------------------

const productExists = await Product.findOne({
  _id: product,
  isActive: true,
  isDeleted: false,
});

if (!productExists) {
  return res.status(404).json({
    success: false,
    message: "Product not found.",
  });
}
// --------------------------------
// SKU Validation
// --------------------------------

const existingSKU = await ProductVariant.findOne({
  sku: sku.toUpperCase(),
});

if (existingSKU) {
  return res.status(400).json({
    success: false,
    message: "SKU already exists.",
  });
}

// --------------------------------
// Price Validation
// --------------------------------

if (price < 0) {
  return res.status(400).json({
    success: false,
    message: "Price cannot be negative.",
  });
}

if (salePrice && salePrice > price) {
  return res.status(400).json({
    success: false,
    message: "Sale price cannot be greater than price.",
  });
}

// --------------------------------
// Stock Validation
// --------------------------------

if (stock < 0) {
  return res.status(400).json({
    success: false,
    message: "Stock cannot be negative.",
  });
}

// --------------------------------
// Attributes Validation
// --------------------------------

for (const attribute of attributes) {

  if (!attribute.key || !attribute.value) {
    return res.status(400).json({
      success: false,
      message: "Each attribute must contain key and value.",
    });
  }

}
// --------------------------------
// Create Product Variant
// --------------------------------

const variant = await ProductVariant.create({
  product,
  sku: sku.toUpperCase(),
  attributes,
  price,
  salePrice,
  stock,
  images,
});

// --------------------------------
// Success Response
// --------------------------------

res.status(201).json({
  success: true,
  message: "Product variant created successfully.",
  variant,
});

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });

  }


};

const getProductVariants = async (req, res) => {
  try {

    const { productId } = req.params;


if (!mongoose.Types.ObjectId.isValid(productId)) {
  return res.status(400).json({
    success: false,
    message: "Invalid Product ID.",
  });
}
const variants = await ProductVariant.find({
  product: productId,
  isDeleted: false,
  isActive: true,
}).sort({
  createdAt: -1,
});

res.status(200).json({
  success: true,
  totalVariants: variants.length,
  variants,
});

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });

  }
};
const updateProductVariant = async (req, res) => {
  try {

    console.log("====== UPDATE API HIT ======");

    const { variantId } = req.params;

    console.log("variantId:", variantId);
    // --------------------------------
// Variant ID Validation
// --------------------------------

if (!mongoose.Types.ObjectId.isValid(variantId)) {
  return res.status(400).json({
    success: false,
    message: "Invalid Variant ID.",
  });
}
// --------------------------------
// Variant Exists Validation
// --------------------------------

const variant = await ProductVariant.findOne({
  _id: variantId,
  isDeleted: false,
});

if (!variant) {
  return res.status(404).json({
    success: false,
    message: "Product variant not found.",
  });
}

const {
  sku,
  attributes,
  price,
  salePrice,
  stock,
  images,
  isActive,
} = req.body;

if (sku !== undefined) {

  const skuError = validateSKU(sku);

  if (skuError) {
    return res.status(400).json({
      success: false,
      message: skuError,
    });
  }

}

if (price !== undefined) {

  const priceError = validatePrice(price);

  if (priceError) {
    return res.status(400).json({
      success: false,
      message: priceError,
    });
  }

}

if (salePrice !== undefined) {

  const salePriceError = validateSalePrice(
    price ?? variant.price,
    salePrice
  );

  if (salePriceError) {
    return res.status(400).json({
      success: false,
      message: salePriceError,
    });
  }

}

if (stock !== undefined) {

  const stockError = validateStock(stock);

  if (stockError) {
    return res.status(400).json({
      success: false,
      message: stockError,
    });
  }

}
if (attributes !== undefined) {

  const attributesError = validateAttributes(attributes);

  if (attributesError) {
    return res.status(400).json({
      success: false,
      message: attributesError,
    });
  }

}

// --------------------------------
// SKU Duplicate Validation
// --------------------------------

if (sku !== undefined) {

  const existingSKU = await ProductVariant.findOne({
    sku: sku.toUpperCase(),
    _id: { $ne: variantId },
  });

  if (existingSKU) {
    return res.status(400).json({
      success: false,
      message: "SKU already exists.",
    });
  }

}

// --------------------------------
// Update Fields
// --------------------------------

if (sku !== undefined) {
  variant.sku = sku.toUpperCase();
}

if (attributes !== undefined) {
  variant.attributes = attributes;
}

if (price !== undefined) {
  variant.price = price;
}

if (salePrice !== undefined) {
  variant.salePrice = salePrice;
}

if (stock !== undefined) {
  variant.stock = stock;
}

if (images !== undefined) {
  variant.images = images;
}

if (isActive !== undefined) {
  variant.isActive = isActive;
}
console.log("Before Save");

await variant.save();

console.log("After Save");

console.log("Sending Response");

res.status(200).json({
  success: true,
  message: "Product variant updated successfully.",
  variant,
});


  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });

  }
};

const deleteProductVariant = async (req, res) => {
  try {

    const { variantId } = req.params;

    // --------------------------------
    // Variant ID Validation
    // --------------------------------

    if (!mongoose.Types.ObjectId.isValid(variantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Variant ID.",
      });
    }

    // --------------------------------
    // Find Variant
    // --------------------------------

    const variant = await ProductVariant.findOne({
      _id: variantId,
      isDeleted: false,
    });

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Product variant not found.",
      });
    }

    // --------------------------------
    // Soft Delete
    // --------------------------------

    variant.isDeleted = true;
    variant.isActive = false;

    await variant.save();

    // --------------------------------
    // Response
    // --------------------------------

    return res.status(200).json({
      success: true,
      message: "Product variant deleted successfully.",
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
const restoreProductVariant = async (req, res) => {
  try {

    const { variantId } = req.params;

    // --------------------------------
    // Variant ID Validation
    // --------------------------------

    if (!mongoose.Types.ObjectId.isValid(variantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Variant ID.",
      });
    }

    // --------------------------------
    // Find Deleted Variant
    // --------------------------------

    const variant = await ProductVariant.findOne({
      _id: variantId,
      isDeleted: true,
    });

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Deleted product variant not found.",
      });
    }

    // --------------------------------
    // Restore Variant
    // --------------------------------

    variant.isDeleted = false;
    variant.isActive = true;

    await variant.save();

    // --------------------------------
    // Response
    // --------------------------------

    return res.status(200).json({
      success: true,
      message: "Product variant restored successfully.",
      variant,
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });

  }
};

const getAllProductVariants = async (req, res) => {
  try {

    const variants = await ProductVariant.find({})
      .populate({
        path: "product",
        select: "name slug",
      })
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      totalVariants: variants.length,
      variants,
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
  createProductVariant,
  getProductVariants,
  updateProductVariant,
  deleteProductVariant,
  restoreProductVariant,
  getAllProductVariants
};