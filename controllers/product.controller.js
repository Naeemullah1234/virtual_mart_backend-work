const mongoose = require("mongoose");
const Product = require("../models/product.model");
const Category = require("../models/category.model");
const ProductType = require("../models/productType.model");
const SubCategory = require("../models/subCategory.model");
const FabricType = require("../models/fabricType.model");
const Brand = require("../models/brand.model");
const Season = require("../models/season.model");
const slugify = require("slugify");

// Generate SKU
const generateSKU = async () => {
  const lastProduct = await Product.findOne()
    .sort({ createdAt: -1 })
    .select("sku");

  if (!lastProduct) {
    return "VM-000001";
  }

  const lastNumber = parseInt(lastProduct.sku.replace("VM-", ""), 10);

  const nextNumber = lastNumber + 1;

  return `VM-${String(nextNumber).padStart(6, "0")}`;
};


// Create Product
const createProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      productType,
      subCategory,
      fabricType,
      brand,
      season,
      description,
      originalPrice,
      salePrice,
      stock,
      images,
      featured,
      bestSeller,
      newArrival,
    } = req.body;


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
    // Required Fields
    // -----------------------------

    if (
      !name ||
      !category ||
      !productType ||
      !subCategory ||
      !fabricType ||
      !brand ||
      originalPrice === undefined ||
      salePrice === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, category, product type, sub category, fabric type, brand, original price and sale price are required.",
      });
    }


    // -----------------------------
    // Price Validation
    // -----------------------------

    if (originalPrice < 0 || salePrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Price cannot be negative.",
      });
    }

    if (salePrice > originalPrice) {
      return res.status(400).json({
        success: false,
        message: "Sale price cannot be greater than original price.",
      });
    }


    // -----------------------------
    // Stock Validation
    // -----------------------------

    if (stock !== undefined && stock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock cannot be negative.",
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
      isDeleted: false,
      isActive: true,
    });

    if (!subCategoryExists) {
      return res.status(404).json({
        success: false,
        message: "Sub Category not found or inactive.",
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

    const sku = await generateSKU();

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


    // -----------------------------
    // Create Product
    // -----------------------------

    const product = await Product.create({
      name,
      category,
      productType,
      subCategory,
      fabricType,
      brand,
      season: season || null,
      sku,
      slug,
      description: description || "",
      originalPrice,
      salePrice,
      stock: stock ?? 0,
      images: images || [],
      featured: featured ?? false,
      bestSeller: bestSeller ?? false,
      newArrival: newArrival ?? false,
    });


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

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
// Get All Products

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
  onSale,
  minPrice,
  maxPrice,
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
      filter.$or = [
        {
          name: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          sku: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
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

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.salePrice = {};

      if (minPrice !== undefined) {
        filter.salePrice.$gte = Number(minPrice);
      }

      if (maxPrice !== undefined) {
        filter.salePrice.$lte = Number(maxPrice);
      }
    }

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

if (onSale !== undefined) {
  if (onSale === "true") {
    filter.$expr = {
      $lt: ["$salePrice", "$originalPrice"],
    };
  }
}


    // --------------------------------
    // Sorting
    // --------------------------------

    let sortOption = {
      createdAt: -1,
    };

    if (sort === "price_low") {
      sortOption = {
        salePrice: 1,
      };
    }

    if (sort === "price_high") {
      sortOption = {
        salePrice: -1,
      };
    }

    if (sort === "oldest") {
      sortOption = {
        createdAt: 1,
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

      const productsWithDiscount = products.map((product) => {
  const productObject = product.toObject();

  let discountPercentage = 0;

  if (
    productObject.originalPrice > 0 &&
    productObject.salePrice < productObject.originalPrice
  ) {
    discountPercentage = Math.round(
      ((productObject.originalPrice - productObject.salePrice) /
        productObject.originalPrice) *
        100
    );
  }
const isOnSale =
  productObject.salePrice < productObject.originalPrice;

const amountSaved = isOnSale
  ? productObject.originalPrice - productObject.salePrice
  : 0;

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

return {
  ...productObject,
  thumbnail,
  discountPercentage,
  isOnSale,
  amountSaved,
  inStock,
  stockStatus,
};
      });

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
  count: productsWithDiscount.length,

  pagination: {
    currentPage,
    limit: perPage,
    totalProducts,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  },

  products: productsWithDiscount,
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
      originalPrice,
      salePrice,
      stock,
      images,
      featured,
      bestSeller,
      newArrival,
      isActive,
    } = req.body;


    // --------------------------------
    // Price Validation
    // --------------------------------

    const newOriginalPrice =
      originalPrice !== undefined
        ? originalPrice
        : product.originalPrice;

    const newSalePrice =
      salePrice !== undefined
        ? salePrice
        : product.salePrice;

    if (newOriginalPrice < 0 || newSalePrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Price cannot be negative.",
      });
    }

    if (newSalePrice > newOriginalPrice) {
      return res.status(400).json({
        success: false,
        message: "Sale price cannot be greater than original price.",
      });
    }


    // --------------------------------
    // Stock Validation
    // --------------------------------

    if (stock !== undefined && stock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock cannot be negative.",
      });
    }


    // --------------------------------
    // Validate Category
    // --------------------------------

    if (category) {
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

      product.category = category;
    }


    // --------------------------------
    // Validate Product Type
    // --------------------------------

    if (productType) {
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
    // Validate Sub Category
    // --------------------------------

    if (subCategory) {
      const subCategoryExists = await SubCategory.findOne({
        _id: subCategory,
        isDeleted: false,
        isActive: true,
      });

      if (!subCategoryExists) {
        return res.status(404).json({
          success: false,
          message: "Sub Category not found or inactive.",
        });
      }

      product.subCategory = subCategory;
    }


    // --------------------------------
    // Validate Fabric Type
    // --------------------------------

    if (fabricType) {
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

    if (originalPrice !== undefined) {
      product.originalPrice = originalPrice;
    }

    if (salePrice !== undefined) {
      product.salePrice = salePrice;
    }

    if (stock !== undefined) {
      product.stock = stock;
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