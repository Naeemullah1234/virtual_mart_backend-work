const mongoose = require("mongoose");
const Product = require("../models/product.model");
const ProductVariant = require("../models/productVariant.model");
const Category = require("../models/category.model");
const ProductType = require("../models/productType.model");
const SubCategory = require("../models/subCategory.model");
const FabricType = require("../models/fabricType.model");
const Brand = require("../models/brand.model");
const Season = require("../models/season.model");
const slugify = require("slugify");

// Generate Unique Slug
const generateUniqueSlug = async (name, productId = null) => {
  const baseSlug = slugify(name, {
    lower: true,
    strict: true,
  });

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existingProduct = await Product.findOne({
      slug,
      ...(productId && { _id: { $ne: productId } }),
    });

    if (!existingProduct) {
      break;
    }

    counter++;

    slug = `${baseSlug}-${counter}`;
  }

  return slug;
};


// Create Product
const createProduct = async (req, res) => {

  let session;

  try {
    
    const {name,category,productType,subCategory,fabricType, brand,season, description,
      featured,bestSeller,newArrival,variants,} = req.body;

      if (!Array.isArray(variants) || variants.length === 0) {
  return res.status(400).json({
    success: false,
    message: "At least one product variant is required.",
  });
}

    const invalidVariantId = variants.find(
  (variantId) => !mongoose.Types.ObjectId.isValid(variantId)
);

if (invalidVariantId) {
  return res.status(400).json({
    success: false,
    message: `Invalid Product Variant ID: ${invalidVariantId}`,
  });
}  
   const uniqueVariantIds = [...new Set(variants.map((id) => id.toString()))];

if (uniqueVariantIds.length !== variants.length) {
  return res.status(400).json({
    success: false,
    message: "Duplicate product variant IDs are not allowed.",
  });
} 
    
   const existingVariants = await ProductVariant.find({
  _id: { $in: uniqueVariantIds },
}).select("_id");

if (existingVariants.length !== uniqueVariantIds.length) {
  return res.status(404).json({
    success: false,
    message: "One or more product variants were not found.",
  });
}


    const alreadyLinkedVariant = await ProductVariant.findOne({
  _id: { $in: uniqueVariantIds },
  product: { $ne: null },
}).select("_id product");

if (alreadyLinkedVariant) {
  return res.status(400).json({
    success: false,
    message: "One or more product variants are already linked to another product.",
  });
}



      const images = (req.files || []).map((file, index) => ({
  filename: file.filename,
  url: `/uploads/products/${file.filename}`,
  alt: name?.trim() || "",
  isPrimary: index === 0,
}));

    // --------------------------------
// Boolean Validation
// --------------------------------

const normalizeBoolean = (value) => {
  if (value === undefined || value === "") return undefined;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;

  return null;
};

const normalizedFeatured = normalizeBoolean(featured);
const normalizedBestSeller = normalizeBoolean(bestSeller);
const normalizedNewArrival = normalizeBoolean(newArrival);

const booleanFields = {
  featured: normalizedFeatured,
  bestSeller: normalizedBestSeller,
  newArrival: normalizedNewArrival,
};

for (const [field, value] of Object.entries(booleanFields)) {
  if (value === null) {
    return res.status(400).json({
      success: false,
      message: `${field} must be true or false.`,
    });
  }
}

   if (!name?.trim()) {
  return res.status(400).json({
    success: false,
    message: "Product name is required.",
  });
}

if (!category || !productType || !subCategory || !fabricType || !brand) {
  return res.status(400).json({
    success: false,
    message:
      "Category, Product Type, Sub Category, Fabric Type and Brand are required.",
  });
}

if (
  !mongoose.Types.ObjectId.isValid(category) ||
  !mongoose.Types.ObjectId.isValid(productType) ||
  !mongoose.Types.ObjectId.isValid(subCategory) ||
  !mongoose.Types.ObjectId.isValid(fabricType) ||
  !mongoose.Types.ObjectId.isValid(brand)
) {
  return res.status(400).json({
    success: false,
    message: "Invalid Category, Product Type, Sub Category, Fabric Type or Brand ID.",
  });
}

if (season && !mongoose.Types.ObjectId.isValid(season)) {
  return res.status(400).json({
    success: false,
    message: "Invalid Season ID.",
  });
}

    // --------------------------------
// Images Validation
// --------------------------------

if (!images || !Array.isArray(images) || images.length === 0) {
  return res.status(400).json({
    success: false,
    message: "At least one product image is required.",
  });
}

if (images.length > 10) {
  return res.status(400).json({
    success: false,
    message: "Maximum 10 images are allowed.",
  });
}

// --------------------------------
// Primary Image Validation
// --------------------------------

const primaryImages = images.filter((img) => img.isPrimary);

if (primaryImages.length > 1) {
  return res.status(400).json({
    success: false,
    message: "Only one primary image is allowed.",
  });
}

// --------------------------------
// Auto Set First Image as Primary
// --------------------------------

if (primaryImages.length === 0) {
  images[0].isPrimary = true;
}
// --------------------------------
// Auto Generate Alt Text
// --------------------------------

images.forEach((image) => {
  if (!image.alt || image.alt.trim() === "") {
    image.alt = name;
  }
});

// --------------------------------
// Duplicate Image Validation
// --------------------------------

const imageUrls = images.map((img) => img.url);

const uniqueUrls = [...new Set(imageUrls)];

if (imageUrls.length !== uniqueUrls.length) {
  return res.status(400).json({
    success: false,
    message: "Duplicate product images are not allowed.",
  });
}

   

    // -----------------------------
    // Check Category
    // -----------------------------

    const categoryExists = await Category.findOne({
      _id: category,
      isDeleted: false,
      isActive: true,
    });

    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: "Category not found or inactive.",
      });
    }
  

    // -----------------------------
    // Check Product Type
    // -----------------------------

    const productTypeExists = await ProductType.findOne({
      _id: productType,
      isDeleted: false,
      isActive: true,
    });

    if (!productTypeExists) {
      return res.status(404).json({
        success: false,
        message: "Product Type not found or inactive.",
      });
    }


    // -----------------------------
    // Check Sub Category
    // -----------------------------

     const subCategoryExists = await SubCategory.findOne({
  _id: subCategory,
  category: category,
  isDeleted: false,
  isActive: true,
});

if (!subCategoryExists) {
  return res.status(404).json({
    success: false,
    message: "Sub Category not found, inactive, or does not belong to the selected category.",
  });
}


    // -----------------------------
    // Check Fabric Type
    // -----------------------------

    const fabricTypeExists = await FabricType.findOne({
      _id: fabricType,
      isDeleted: false,
      isActive: true,
    });

    if (!fabricTypeExists) {
      return res.status(404).json({
        success: false,
        message: "Fabric Type not found or inactive.",
      });
    }


    // -----------------------------
    // Check Brand
    // -----------------------------

    const brandExists = await Brand.findOne({
      _id: brand,
      isDeleted: false,
      isActive: true,
    });

    if (!brandExists) {
      return res.status(404).json({
        success: false,
        message: "Brand not found or inactive.",
      });
    }


    // -----------------------------
    // Check Season (Optional)
    // -----------------------------

    if (season) {
      const seasonExists = await Season.findOne({
        _id: season,
        isDeleted: false,
        isActive: true,
      });

      if (!seasonExists) {
        return res.status(404).json({
          success: false,
          message: "Season not found or inactive.",
        });
      }
    }
   const slug = await generateUniqueSlug(name);

    // -----------------------------
    // Generate SKU
    // -----------------------------

    // const sku = await generateSKU();

     const session = await mongoose.startSession();
    session.startTransaction();


    // -----------------------------
    // Create Product
    // -----------------------------

     const [product] = await Product.create(
  [
    {
      name,
      category,
      productType,
      subCategory,
      fabricType,
      brand,
      season: season || null,
      slug,
      description: description || "",
      images: images || [],
      variants: uniqueVariantIds,
      featured: normalizedFeatured ?? false,
      bestSeller: normalizedBestSeller ?? false,
      newArrival: normalizedNewArrival ?? false,
    },
  ],


  { session }
);

await ProductVariant.updateMany(
  {
    _id: { $in: uniqueVariantIds },
  },
  {
    $set: {
      product: product._id,
    },
  },
  { session }
);

 
   await session.commitTransaction();
     session.endSession();


    // -----------------------------
    // Response
    // -----------------------------

    res.status(201).json({
      success: true,
      message: "Product created successfully.",
      product,
    });

     } catch (error) {
  console.log(error);

  if (session) {
    await session.abortTransaction();
    session.endSession();
  }

  return res.status(500).json({
    success: false,
    message: "Server Error",
  });
}
}

// Get All Products
const getAllProducts = async (req, res) => {
  try {
    const {
  search,
  category,
  productType,
  subCategory,
  fabricType,
  brand,
  season,
  featured,
  bestSeller,
  newArrival,
  page = 1,
  limit = 20,
  sort = "newest",
} = req.query;

    // --------------------------------
    // Pagination
    // --------------------------------

    const currentPage = Math.max(parseInt(page, 10) || 1, 1);

    const perPage = Math.min(
      Math.max(parseInt(limit, 10) || 20, 1),
      100
    );

    const skip = (currentPage - 1) * perPage;


    // --------------------------------
    // Base Filter
    // --------------------------------

    const filter = {
      isDeleted: false,
      isActive: true,
    };


    // --------------------------------
    // Search
    // --------------------------------

  if (search && search.trim()) {
  filter.name = {
    $regex: search.trim(),
    $options: "i",
  };
}


    // --------------------------------
    // Category
    // --------------------------------

    if (category) {
      filter.category = category;
    }


    // --------------------------------
    // Product Type
    // --------------------------------

    if (productType) {
      filter.productType = productType;
    }


    // --------------------------------
    // Sub Category
    // --------------------------------

    if (subCategory) {
      filter.subCategory = subCategory;
    }


    // --------------------------------
    // Fabric Type
    // --------------------------------

    if (fabricType) {
      filter.fabricType = fabricType;
    }


    // --------------------------------
    // Brand
    // --------------------------------

    if (brand) {
      filter.brand = brand;
    }


    // --------------------------------
    // Season
    // --------------------------------

    if (season) {
      filter.season = season;
    }


    // --------------------------------
    // Price Filter
    // --------------------------------

    // if (minPrice !== undefined || maxPrice !== undefined) {
    //   filter.salePrice = {};

    //   if (minPrice !== undefined) {
    //     filter.salePrice.$gte = Number(minPrice);
    //   }

    //   if (maxPrice !== undefined) {
    //     filter.salePrice.$lte = Number(maxPrice);
    //   }
    // }

    // --------------------------------
// Featured Filter
// --------------------------------

if (featured !== undefined) {
  filter.featured = featured === "true";
}


// --------------------------------
// Best Seller Filter
// --------------------------------

if (bestSeller !== undefined) {
  filter.bestSeller = bestSeller === "true";
}


// --------------------------------
// New Arrival Filter
// --------------------------------

if (newArrival !== undefined) {
  filter.newArrival = newArrival === "true";
}

// --------------------------------
// On Sale Filter
// --------------------------------

// if (onSale !== undefined) {
//   if (onSale === "true") {
//     filter.$expr = {
//       $lt: ["$salePrice", "$originalPrice"],
//     };
//   }
// }


    // --------------------------------
    // Sorting
    // --------------------------------

    let sortOption = {
      createdAt: -1,
    };

    // if (sort === "price_low") {
    //   sortOption = {
    //     salePrice: 1,
    //   };
    // }

    // if (sort === "price_high") {
    //   sortOption = {
    //     salePrice: -1,
    //   };
    // }

    if (sort === "oldest") {
      sortOption = {
        createdAt: 1,
      };
    }

    if (sort === "newest") {
      sortOption = {
        createdAt: -1,
      };
    }

    if (sort === "name_asc") {
      sortOption = {
        name: 1,
      };
    }

    if (sort === "name_desc") {
      sortOption = {
        name: -1,
      };
    }


    // --------------------------------
    // Get Products
    // --------------------------------

    const products = await Product.find(filter)
      .populate("category", "name slug")
      .populate("productType", "name slug")
      .populate("subCategory", "name slug")
      .populate("fabricType", "name slug")
      .populate("brand", "name slug")
      .populate("season", "name slug")
      .sort(sortOption)
      .skip(skip)
      .limit(perPage);

      const productIds = products.map((product) => product._id);

const variants = await ProductVariant.find({
  product: { $in: productIds },
});

const productsWithVariants = products.map((product) => {
  const productObject = product.toObject();

  const productVariants = variants.filter(
    (variant) => variant.product.toString() === product._id.toString()
  );

  return {
    ...productObject,
    variants: productVariants,
  };
});

const productsWithDetails = productsWithVariants.map((product) => {
  const productObject = { ...product };

  const productVariants = product.variants || [];

  const prices = productVariants
    .map((variant) => variant.salePrice ?? variant.price)
    .filter((price) => typeof price === "number");

  const originalPrices = productVariants
    .map((variant) => variant.price)
    .filter((price) => typeof price === "number");

  const totalStock = productVariants.reduce(
    (total, variant) => total + (variant.stock || 0),
    0
  );

  const lowestPrice = prices.length ? Math.min(...prices) : 0;
  const highestPrice = prices.length ? Math.max(...prices) : 0;

  const lowestOriginalPrice = originalPrices.length
    ? Math.min(...originalPrices)
    : 0;

  const isOnSale = productVariants.some(
    (variant) =>
      variant.salePrice !== undefined &&
      variant.salePrice < variant.price
  );

  const discountPercentage =
    lowestOriginalPrice > 0 && lowestPrice < lowestOriginalPrice
      ? Math.round(
          ((lowestOriginalPrice - lowestPrice) /
            lowestOriginalPrice) *
            100
        )
      : 0;

  const amountSaved =
    isOnSale && lowestOriginalPrice > lowestPrice
      ? lowestOriginalPrice - lowestPrice
      : 0;

  const thumbnail =
    productObject.images?.find((img) => img.isPrimary) ||
    productObject.images?.[0] ||
    null;

  const inStock = totalStock > 0;

  const stockStatus =
    totalStock === 0
      ? "Out of Stock"
      : totalStock <= 5
      ? "Low Stock"
      : "In Stock";

  return {
    ...productObject,
    price: lowestPrice,
    maxPrice: highestPrice,
    discountPercentage,
    isOnSale,
    amountSaved,
    thumbnail,
    totalStock,
    inStock,
    stockStatus,
  };
});

//       const productsWithDiscount = products.map((product) => {
//   const productObject = product.toObject();

//   let discountPercentage = 0;

//   if (
//     productObject.originalPrice > 0 &&
//     productObject.salePrice < productObject.originalPrice
//   ) {
//     discountPercentage = Math.round(
//       ((productObject.originalPrice - productObject.salePrice) /
//         productObject.originalPrice) *
//         100
//     );
//   }
// const isOnSale =
//   productObject.salePrice < productObject.originalPrice;

// const amountSaved = isOnSale
//   ? productObject.originalPrice - productObject.salePrice
//   : 0;

// const thumbnail =
//   productObject.images.find((img) => img.isPrimary) ||
//   productObject.images[0] ||
//   null;

// const inStock = productObject.stock > 0;

// const stockStatus =
//   productObject.stock === 0
//     ? "Out of Stock"
//     : productObject.stock <= 5
//     ? "Low Stock"
//     : "In Stock";

// return {
//   ...productObject,
//   thumbnail,
//   discountPercentage,
//   isOnSale,
//   amountSaved,
//   inStock,
//   stockStatus,
// };
//       });

    // --------------------------------
    // Total Products
    // --------------------------------

    const totalProducts = await Product.countDocuments(filter);

    const totalPages = Math.ceil(totalProducts / perPage);


    // --------------------------------
    // Response
    // --------------------------------

  res.status(200).json({
  success: true,
 count: productsWithDetails.length,

  pagination: {
    currentPage,
    limit: perPage,
    totalProducts,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  },

  products: productsWithDetails,
});

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get Product By ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID.",
      });
    }

    const product = await Product.findOne({
      _id: id,
      isDeleted: false,
      isActive: true,
    })
      .populate("category", "name slug")
      .populate("productType", "name slug")
      .populate("subCategory", "name slug")
      .populate("fabricType", "name slug")
      .populate("brand", "name slug")
      .populate("season", "name slug");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

const productObject = product.toObject();

const thumbnail =
  productObject.images.find((img) => img.isPrimary) ||
  productObject.images[0] ||
  null;

const inStock = productObject.stock > 0;

const stockStatus =
  productObject.stock === 0
    ? "Out of Stock"
    : productObject.stock <= 5
    ? "Low Stock"
    : "In Stock";

    const isOnSale =
  productObject.salePrice < productObject.originalPrice;

const amountSaved = isOnSale
  ? productObject.originalPrice - productObject.salePrice
  : 0;

res.status(200).json({
  success: true,
product: {
  ...productObject,
  thumbnail,
  inStock,
  stockStatus,
  isOnSale,
  amountSaved,
},
});

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
// Update Product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate Product ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID.",
      });
    }

    const product = await Product.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const {
  name,
  category,
  productType,
  subCategory,
  fabricType,
  brand,
  season,
  description,
  variants,
  images,
  featured,
  bestSeller,
  newArrival,
  isActive,
} = req.body;

let uniqueVariantIds;

if (variants !== undefined) {
  if (!Array.isArray(variants) || variants.length === 0) {
    return res.status(400).json({
      success: false,
      message: "At least one product variant is required.",
    });
  }

  const invalidVariantId = variants.find(
    (variantId) => !mongoose.Types.ObjectId.isValid(variantId)
  );

  if (invalidVariantId) {
    return res.status(400).json({
      success: false,
      message: `Invalid Product Variant ID: ${invalidVariantId}`,
    });
  }

  uniqueVariantIds = [
    ...new Set(variants.map((id) => id.toString())),
  ];

  if (uniqueVariantIds.length !== variants.length) {
    return res.status(400).json({
      success: false,
      message: "Duplicate product variant IDs are not allowed.",
    });
  }

  const existingVariants = await ProductVariant.find({
  _id: { $in: uniqueVariantIds },
}).select("_id");

if (existingVariants.length !== uniqueVariantIds.length) {
  return res.status(404).json({
    success: false,
    message: "One or more product variants were not found.",
  });
}

const alreadyLinkedVariant = await ProductVariant.findOne({
  _id: { $in: uniqueVariantIds },
  product: {
    $nin: [null, product._id],
  },
}).select("_id product");

if (alreadyLinkedVariant) {
  return res.status(400).json({
    success: false,
    message:
      "One or more product variants are already linked to another product.",
  });
}

}


    // --------------------------------
// Validate Category & Sub Category
// --------------------------------

const newCategory = category || product.category;
const newSubCategory = subCategory || product.subCategory;

// Validate Category if changed
if (category) {
  if (!mongoose.Types.ObjectId.isValid(category)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Category ID.",
    });
  }

  const categoryExists = await Category.findOne({
    _id: category,
    isDeleted: false,
    isActive: true,
  });

  if (!categoryExists) {
    return res.status(404).json({
      success: false,
      message: "Category not found or inactive.",
    });
  }
}

// Validate Sub Category
if (subCategory) {
  if (!mongoose.Types.ObjectId.isValid(subCategory)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Sub Category ID.",
    });
  }

  const subCategoryExists = await SubCategory.findOne({
    _id: subCategory,
    category: newCategory,
    isDeleted: false,
    isActive: true,
  });

  if (!subCategoryExists) {
    return res.status(404).json({
      success: false,
      message:
        "Sub Category not found, inactive, or does not belong to the selected category.",
    });
  }
}

// --------------------------------
// Prevent Category/SubCategory Mismatch
// --------------------------------

if (category && !subCategory) {
  const currentSubCategory = await SubCategory.findOne({
    _id: product.subCategory,
    category: newCategory,
    isDeleted: false,
    isActive: true,
  });

  if (!currentSubCategory) {
    return res.status(400).json({
      success: false,
      message:
        "You changed the category. Please select a Sub Category belonging to the new category.",
    });
  }
}

// --------------------------------
// Save Category & Sub Category
// --------------------------------

if (category) {
  product.category = category;
}

if (subCategory) {
  product.subCategory = subCategory;
}


       // --------------------------------
    // Validate Product Type
    // --------------------------------

    if (productType) {
      if (!mongoose.Types.ObjectId.isValid(productType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Product Type ID.",
        });
      }

      const productTypeExists = await ProductType.findOne({
        _id: productType,
        isDeleted: false,
        isActive: true,
      });

      if (!productTypeExists) {
        return res.status(404).json({
          success: false,
          message: "Product Type not found or inactive.",
        });
      }

      product.productType = productType;
    }



    // --------------------------------
    // Validate Fabric Type
    // --------------------------------

    if (fabricType) {
      if (!mongoose.Types.ObjectId.isValid(fabricType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Fabric Type ID.",
        });
      }

      const fabricTypeExists = await FabricType.findOne({
        _id: fabricType,
        isDeleted: false,
        isActive: true,
      });

      if (!fabricTypeExists) {
        return res.status(404).json({
          success: false,
          message: "Fabric Type not found or inactive.",
        });
      }

      product.fabricType = fabricType;
    }


    // --------------------------------
    // Validate Brand
    // --------------------------------

    if (brand) {
      if (!mongoose.Types.ObjectId.isValid(brand)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Brand ID.",
        });
      }

      const brandExists = await Brand.findOne({
        _id: brand,
        isDeleted: false,
        isActive: true,
      });

      if (!brandExists) {
        return res.status(404).json({
          success: false,
          message: "Brand not found or inactive.",
        });
      }

      product.brand = brand;
    }


    // --------------------------------
    // Validate Season
    // --------------------------------

    if (season !== undefined) {

      if (!mongoose.Types.ObjectId.isValid(season)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Season ID.",
        });
      }

      if (season === null || season === "") {
        product.season = null;
      } else {
        const seasonExists = await Season.findOne({
          _id: season,
          isDeleted: false,
          isActive: true,
        });

        if (!seasonExists) {
          return res.status(404).json({
            success: false,
            message: "Season not found or inactive.",
          });
        }

        product.season = season;
      }
    }


    // --------------------------------
    // Update Basic Fields
    // --------------------------------

 if (name !== undefined) {

  product.name = name;

  product.slug = await generateUniqueSlug(
    name,
    product._id
  );

}

    if (description !== undefined) {
      product.description = description;
    } 

   if (images !== undefined) {

  if (!Array.isArray(images) || images.length === 0) {
    return res.status(400).json({
      success: false,
      message: "At least one product image is required.",
    });
  }

  if (images.length > 10) {
    return res.status(400).json({
      success: false,
      message: "Maximum 10 images are allowed.",
    });
  }

  const primaryImages = images.filter((img) => img.isPrimary);

  if (primaryImages.length > 1) {
    return res.status(400).json({
      success: false,
      message: "Only one primary image is allowed.",
    });
  }

  if (primaryImages.length === 0) {
    images[0].isPrimary = true;
  }
  
const productName = name ?? product.name;

images.forEach((image) => {
  if (!image.alt || image.alt.trim() === "") {
    image.alt = productName;
  }
});


// --------------------------------
// Duplicate Image Validation
// --------------------------------

const imageUrls = images.map((img) => img.url);

const uniqueUrls = [...new Set(imageUrls)];

if (imageUrls.length !== uniqueUrls.length) {
  return res.status(400).json({
    success: false,
    message: "Duplicate product images are not allowed.",
  });
}


  product.images = images;
}

 // --------------------------------
// Boolean Validation
// --------------------------------

const booleanFields = {
  featured,
  bestSeller,
  newArrival,
  isActive,
};

for (const [field, value] of Object.entries(booleanFields)) {
  if (value !== undefined && typeof value !== "boolean") {
    return res.status(400).json({
      success: false,
      message: `${field} must be true or false.`,
    });
  }
}

// --------------------------------
// Update Boolean Fields
// --------------------------------

if (featured !== undefined) {
  product.featured = featured;
}

if (bestSeller !== undefined) {
  product.bestSeller = bestSeller;
}

if (newArrival !== undefined) {
  product.newArrival = newArrival;
}

if (isActive !== undefined) {
  product.isActive = isActive;
}

   // variants update logic
if (variants !== undefined) {
  await ProductVariant.updateMany(
    {
      product: product._id,
      _id: { $nin: uniqueVariantIds },
    },
    {
      $set: { product: null },
    }
  );

  await ProductVariant.updateMany(
    {
      _id: { $in: uniqueVariantIds },
    },
    {
      $set: { product: product._id },
    }
  );

  product.variants = uniqueVariantIds;
}



    await product.save();


    // --------------------------------
    // Return Updated Product
    // --------------------------------

    const updatedProduct = await Product.findById(product._id)
      .populate("category", "name slug")
      .populate("productType", "name slug")
      .populate("subCategory", "name slug")
      .populate("fabricType", "name slug")
      .populate("brand", "name slug")
      .populate("season", "name slug");


    res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      product: updatedProduct,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Soft Delete Product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate Product ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID.",
      });
    }

    // Find product
    const product = await Product.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // Soft Delete
    product.isDeleted = true;

    // Also hide it from customers
    product.isActive = false;

    await product.save();

    res.status(200).json({
      success: true,
      message: "Product deleted successfully.",
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get Deleted Products - Admin
const getDeletedProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isDeleted: true,
    })
      .populate("category", "name slug")
      .populate("productType", "name slug")
      .populate("subCategory", "name slug")
      .populate("fabricType", "name slug")
      .populate("brand", "name slug")
      .populate("season", "name slug")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Restore Product - Admin
const restoreProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate Product ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID.",
      });
    }

    const product = await Product.findOne({
      _id: id,
      isDeleted: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Deleted product not found.",
      });
    }

    product.isDeleted = false;
    product.isActive = true;

    await product.save();

    const restoredProduct = await Product.findById(product._id)
      .populate("category", "name slug")
      .populate("productType", "name slug")
      .populate("subCategory", "name slug")
      .populate("fabricType", "name slug")
      .populate("brand", "name slug")
      .populate("season", "name slug");

    res.status(200).json({
      success: true,
      message: "Product restored successfully.",
      product: restoredProduct,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


module.exports = {
  createProduct,
  getAllProducts,
 getProductById,
  updateProduct,
   deleteProduct,
  getDeletedProducts,
  restoreProduct,
};