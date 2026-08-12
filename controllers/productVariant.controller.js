const Product = require("../models/product.model");
const ProductVariant = require("../models/productVariant.model");
const { validateSKU,validatePrice,validateSalePrice,validateStock,validateAttributes,normalizeAttributes,validateImages,validateIsActive} = require("../validators/productVariant.validator");
const mongoose = require("mongoose");





const createProductVariant = async (req, res) => {
  try {
  
const { product,sku,attributes,price,salePrice,stock,images,} = req.body;


const skuError = validateSKU(sku);

if (skuError) {
  return res.status(400).json({ success: false,message: skuError,});}

const normalizedSKU = sku.trim().toUpperCase();


if ( !product || !sku || !attributes || price === undefined ||stock === undefined
) {

  return res.status(400).json({ success: false,message: "Please fill all required fields.",});}



if (!Array.isArray(attributes) || attributes.length === 0) {
  return res.status(400).json({ success: false,message: "At least one attribute is required.", });}


if (!mongoose.Types.ObjectId.isValid(product)) {
  return res.status(400).json({ success: false,message: "Invalid Product ID.",});}


 const productExists = await Product.findOne({ _id: product,isActive: true,isDeleted: false,});

if (!productExists) {
  return res.status(404).json({ success: false,message: "Product not found.",});}

const existingSKU = await ProductVariant.findOne({ sku: normalizedSKU,isDeleted: false,});


if (existingSKU) {
  return res.status(400).json({ success: false,message: "SKU already exists.",});}


const priceError = validatePrice(price);

if (priceError) {
  return res.status(400).json({ success: false,message: priceError,});}


const salePriceError = validateSalePrice(price, salePrice);

if (salePriceError) {
  return res.status(400).json({ success: false, message: salePriceError,});}


const stockError = validateStock(stock);

if (stockError) {
  return res.status(400).json({ success: false,message: stockError,});}

const attributesError = validateAttributes(attributes);

if (attributesError) {
  return res.status(400).json({ success: false,message: attributesError,});}

const normalizedAttributes = normalizeAttributes(attributes);

const imagesError = validateImages(images);

if (imagesError) {
  return res.status(400).json({ success: false,message: imagesError,});}



const variant = await ProductVariant.create({ product,sku: normalizedSKU,attributes: normalizedAttributes,price,salePrice,stock,images,});

res.status(201).json({success: true,message: "Product variant created successfully.",variant,});

 } catch (error) {

  console.log(error);

  if (error.code === 11000) {
    return res.status(400).json({ success: false,message: "SKU already exists.",});}

  return res.status(500).json({ success: false,message: "Server Error",});}}



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
const normalizedSKU =
  sku !== undefined
    ? sku.trim().toUpperCase()
    : undefined;

    

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

let normalizedAttributes;

if (attributes !== undefined) {

  const attributesError = validateAttributes(attributes);

  if (attributesError) {
    return res.status(400).json({
      success: false,
      message: attributesError,
    });
  }

  normalizedAttributes = normalizeAttributes(attributes);

}

// --------------------------------
// SKU Duplicate Validation
// --------------------------------

if (normalizedSKU !== undefined) {

  const existingSKU = await ProductVariant.findOne({
    sku: normalizedSKU,
    _id: { $ne: variantId },
    isDeleted: false,
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

if (normalizedSKU !== undefined) {
  variant.sku = normalizedSKU;
}
if (normalizedAttributes !== undefined) {
  variant.attributes = normalizedAttributes;
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

  const imagesError = validateImages(images);

  if (imagesError) {
    return res.status(400).json({
      success: false,
      message: imagesError,
    });
  }

  variant.images = images;
}

if (isActive !== undefined) {

  const isActiveError = validateIsActive(isActive);

  if (isActiveError) {
    return res.status(400).json({
      success: false,
      message: isActiveError,
    });
  }

  variant.isActive = isActive;
}

await variant.save();



res.status(200).json({
  success: true,
  message: "Product variant updated successfully.",
  variant,
});


} catch (error) {

  console.log(error);

  if (error.code === 11000) {
    return res.status(400).json({
      success: false,
      message: "SKU already exists.",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Server Error",
  });
}};

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
    // SKU Duplicate Validation
    // --------------------------------

    const existingSKU = await ProductVariant.findOne({
      sku: variant.sku,
      _id: { $ne: variantId },
      isDeleted: false,
    });

    if (existingSKU) {
      return res.status(400).json({
        success: false,
        message: "Cannot restore variant. SKU already exists.",
      });
    }

    // --------------------------------
    // Restore
    // --------------------------------

    variant.isDeleted = false;

    await variant.save();

    return res.status(200).json({
      success: true,
      message: "Product variant restored successfully.",
      variant,
    });

  } catch (error) {

    console.log(error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "SKU already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const getAllProductVariants = async (req, res) => {
  try {

const {
  page = 1,
  limit = 20,
  search = "",
  status = "all",
  stockStatus = "all",
  productId,
  attribute = {},
} = req.query;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 1), 100);

    const skip = (pageNumber - 1) * limitNumber;

    // --------------------------------
    // Main Filter
    // --------------------------------

    const filter = {};

    // --------------------------------
    // Search
    // --------------------------------

    if (search.trim()) {
      filter.sku = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    // --------------------------------
    // Status Filter
    // --------------------------------

if (status === "active") {

  filter.isActive = true;
  filter.isDeleted = false;

} else if (status === "inactive") {

  filter.isActive = false;
  filter.isDeleted = false;

} else if (status === "deleted") {

  filter.isDeleted = true;

} else {

  // Default / All
  filter.isDeleted = false;

}

    // --------------------------------
    // Product Filter
    // --------------------------------

    if (productId) {
      filter.product = productId;
    }

  // --------------------------------
// Dynamic Attribute Filters
// --------------------------------

Object.entries(req.query).forEach(([key, value]) => {

  const match = key.match(/^attribute\[(.+)\]$/);

  if (!match) {
    return;
  }

  const attributeKey = match[1].trim().toLowerCase();
  const attributeValue = String(value).trim();

  if (!attributeValue) {
    return;
  }

  filter.$and = filter.$and || [];

  filter.$and.push({
    attributes: {
      $elemMatch: {
        key: attributeKey,
        value: {
          $regex: attributeValue,
          $options: "i",
        },
      },
    },
  });

});



    // --------------------------------
    // Stock Filter
    // --------------------------------

    if (stockStatus === "outOfStock") {

      filter.stock = 0;

    } else if (stockStatus === "inStock") {

      filter.stock = {
        $gt: 0,
      };

    }

    // --------------------------------
    // Get Total
    // --------------------------------

    const totalVariants = await ProductVariant.countDocuments(filter);

    // --------------------------------
    // Get Variants
    // --------------------------------

    const variants = await ProductVariant.find(filter)
      .populate({
        path: "product",
        select: "name slug",
      })
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limitNumber);

    // --------------------------------
    // Pagination
    // --------------------------------

    const totalPages = Math.ceil(
      totalVariants / limitNumber
    );

    return res.status(200).json({
      success: true,

      pagination: {
        page: pageNumber,
        limit: limitNumber,
        totalVariants,
        totalPages,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1,
      },

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

// const getProductVariantFilters = async (req, res) => {
//   try {

//     const filters = await ProductVariant.aggregate([
//       {
//         $match: {
//           isDeleted: false,
//           isActive: true,
//         },
//       },

//       {
//         $unwind: "$attributes",
//       },

//       {
//         $group: {
//           _id: {
//             key: "$attributes.key",
//             value: "$attributes.value",
//           },
//           count: {
//             $sum: 1,
//           },
//         },
//       },

//       {
//         $sort: {
//           "_id.key": 1,
//           "_id.value": 1,
//         },
//       },

//     ]);

//     const result = {};

//     filters.forEach((item) => {

//       const key = item._id.key;
//       const value = item._id.value;

//       if (!result[key]) {
//         result[key] = [];
//       }

//       result[key].push({
//         value,
//         count: item.count,
//       });

//     });

//     return res.status(200).json({
//       success: true,
//       filters: result,
//     });

//   } catch (error) {

//     console.log(error);

//     return res.status(500).json({
//       success: false,
//       message: "Server Error",
//     });

//   }
// };

const getProductVariantFilters = async (req, res) => {
  try {

    // --------------------------------
    // Base Filter
    // --------------------------------

    const matchFilter = {
      isActive: true,
      isDeleted: false,
    };

    // --------------------------------
    // Dynamic Attribute Filters
    // --------------------------------

    Object.entries(req.query).forEach(([key, value]) => {

      const match = key.match(/^attribute\[(.+)\]$/);

      if (!match) {
        return;
      }

      const attributeKey = match[1].trim().toLowerCase();
      const attributeValue = String(value).trim();

      if (!attributeValue) {
        return;
      }

      if (!matchFilter.$and) {
        matchFilter.$and = [];
      }

      matchFilter.$and.push({
        attributes: {
          $elemMatch: {
            key: attributeKey,
            value: {
              $regex: attributeValue,
              $options: "i",
            },
          },
        },
      });

    });

    // --------------------------------
    // Aggregate
    // --------------------------------

    const filters = await ProductVariant.aggregate([

      {
        $match: matchFilter,
      },

      {
        $unwind: "$attributes",
      },

      {
        $group: {
          _id: {
            key: "$attributes.key",
            value: "$attributes.value",
          },
          count: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          "_id.key": 1,
          "_id.value": 1,
        },
      },

    ]);

    // --------------------------------
    // Format Response
    // --------------------------------

    const result = {};

    filters.forEach((item) => {

      const key = item._id.key;
      const value = item._id.value;

      if (!result[key]) {
        result[key] = [];
      }

      result[key].push({
        value,
        count: item.count,
      });

    });

    return res.status(200).json({
      success: true,
      filters: result,
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });

  }
};

const getProductVariantById = async (req, res) => {
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
    }).populate({
      path: "product",
      select: "name slug",
    });

    // --------------------------------
    // Variant Not Found
    // --------------------------------

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Product variant not found.",
      });
    }

    // --------------------------------
    // Success Response
    // --------------------------------

    return res.status(200).json({
      success: true,
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


module.exports = {
  createProductVariant,
  getProductVariants,
  updateProductVariant,
  deleteProductVariant,
  restoreProductVariant,
  getAllProductVariants,
  getProductVariantFilters,
  getProductVariantById,
};