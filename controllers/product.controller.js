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
const cloudinary = require("../config/cloudinary");
const Order = require("../models/order.model");
const Review = require("../models/review.model");
const { MAX_PRODUCT_IMAGES } = require("../config/upload.config");






const cleanupUploadedImages = async (files = []) => {
  const results = await Promise.allSettled(
    files
      .filter((file) => file.filename)
      .map((file) =>
        cloudinary.uploader.destroy(file.filename, {
          resource_type: "image",
        })
      )
  );

  results.forEach((result) => {
    if (result.status === "rejected") {
      console.error(
        "Cloudinary cleanup failed:",
        result.reason?.message
      );
    }
  });
};



const generateUniqueSlug = async (name, productId = null) => {
  const baseSlug = slugify(name, { lower: true,strict: true,});

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existingProduct = await Product.findOne({ slug, ...(productId && { _id: { $ne: productId } }),});

    if (!existingProduct) {
      break;
    }

    counter++;

    slug = `${baseSlug}-${counter}`;
  }

  return slug;
};



const createProduct = async (req, res) => {
  let session;
  let productCreated = false;

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
      featured,
      bestSeller,
      newArrival,
    } = req.body;

    // --------------------------------
    // Product Name Validation
    // --------------------------------

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required.",
      });
    }

    const productName = name.trim();

    // --------------------------------
    // Description Validation
    // --------------------------------

    if (
      description !== undefined &&
      typeof description !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Description must be a string.",
      });
    }

    // --------------------------------
    // Required IDs Validation
    // --------------------------------

    const requiredIds = {
      category,
      productType,
      subCategory,
      fabricType,
      brand,
    };

    for (const [field, value] of Object.entries(requiredIds)) {
      if (!value) {
        return res.status(400).json({
          success: false,
          message: `${field} is required.`,
        });
      }

      if (
        typeof value !== "string" ||
        !mongoose.Types.ObjectId.isValid(value)
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${field} ID.`,
        });
      }
    }

    if (
      season &&
      (
        typeof season !== "string" ||
        !mongoose.Types.ObjectId.isValid(season)
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Season ID.",
      });
    }

    // --------------------------------
    // Boolean Validation
    // --------------------------------

    const normalizeBoolean = (value) => {
      if (value === undefined || value === "") {
        return false;
      }

      if (value === true || value === "true") {
        return true;
      }

      if (value === false || value === "false") {
        return false;
      }

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

    // --------------------------------
    // Variants Validation
    // --------------------------------

    let variants = req.body.variants;

    if (typeof variants === "string") {
      try {
        variants = JSON.parse(variants);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Variants must be a valid JSON array.",
        });
      }
    }

    if (!Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product variant is required.",
      });
    }

    const invalidVariant = variants.find(
      (id) =>
        typeof id !== "string" ||
        !mongoose.Types.ObjectId.isValid(id)
    );

    if (invalidVariant) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product Variant ID.",
      });
    }

    const uniqueVariantIds = [
      ...new Set(variants.map((id) => id.toString())),
    ];

    if (uniqueVariantIds.length !== variants.length) {
      return res.status(400).json({
        success: false,
        message: "Duplicate product variant IDs are not allowed.",
      });
    }

    // --------------------------------
    // Images Validation
    // --------------------------------

    const uploadedFiles = req.files || [];

    if (uploadedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product image is required.",
      });
    }

    if (uploadedFiles.length > MAX_PRODUCT_IMAGES) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${MAX_PRODUCT_IMAGES} images are allowed.`,
      });
    }

    const images = uploadedFiles.map((file, index) => ({
      filename: file.filename,
      public_id: file.filename,
      url: file.path,
      alt: productName,
      isPrimary: index === 0,
    }));

    if (
      images.some(
        (image) => !image.filename || !image.public_id || !image.url
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid uploaded image data.",
      });
    }

    // --------------------------------
    // Check Related Records
    // --------------------------------

    const [
      categoryExists,
      productTypeExists,
      subCategoryExists,
      fabricTypeExists,
      brandExists,
      seasonExists,
    ] = await Promise.all([
      Category.exists({
        _id: category,
        isDeleted: false,
        isActive: true,
      }),

      ProductType.exists({
        _id: productType,
        isDeleted: false,
        isActive: true,
      }),

      SubCategory.exists({
        _id: subCategory,
        category,
        isDeleted: false,
        isActive: true,
      }),

      FabricType.exists({
        _id: fabricType,
        isDeleted: false,
        isActive: true,
      }),

      Brand.exists({
        _id: brand,
        isDeleted: false,
        isActive: true,
      }),

      season
        ? Season.exists({
            _id: season,
            isDeleted: false,
            isActive: true,
          })
        : Promise.resolve(true),
    ]);

    const relatedRecords = {
      Category: categoryExists,
      "Product Type": productTypeExists,
      "Sub Category": subCategoryExists,
      "Fabric Type": fabricTypeExists,
      Brand: brandExists,
      Season: seasonExists,
    };

    for (const [field, exists] of Object.entries(relatedRecords)) {
      if (!exists) {
        return res.status(404).json({
          success: false,
          message: `${field} not found, inactive, or invalid.`,
        });
      }
    }

    // --------------------------------
    // Generate Slug
    // --------------------------------

    const slug = await generateUniqueSlug(productName);

    // --------------------------------
    // Start Transaction
    // --------------------------------

    session = await mongoose.startSession();
    session.startTransaction();

    // --------------------------------
    // Check Variants Inside Transaction
    // --------------------------------

    const existingVariants = await ProductVariant.find({
      _id: { $in: uniqueVariantIds },
    })
      .select("_id product")
      .session(session);

    if (existingVariants.length !== uniqueVariantIds.length) {
      const error = new Error(
        "One or more product variants were not found."
      );
      error.status = 404;
      throw error;
    }

    const linkedVariant = existingVariants.find(
      (variant) => variant.product != null
    );

    if (linkedVariant) {
      const error = new Error(
        "One or more product variants are already linked to another product."
      );
      error.status = 409;
      throw error;
    }

    // --------------------------------
    // Create Product
    // --------------------------------

    const [product] = await Product.create(
      [
        {
          name: productName,
          category,
          productType,
          subCategory,
          fabricType,
          brand,
          season: season || null,
          slug,
          description: description?.trim() || "",
          images,
          variants: uniqueVariantIds,
          featured: normalizedFeatured,
          bestSeller: normalizedBestSeller,
          newArrival: normalizedNewArrival,
        },
      ],
      { session }
    );

    // --------------------------------
    // Link Variants to Product
    // --------------------------------

    const variantUpdate = await ProductVariant.updateMany(
      {
        _id: { $in: uniqueVariantIds },
        $or: [
          { product: null },
          { product: { $exists: false } },
        ],
      },
      {
        $set: {
          product: product._id,
        },
      },
      { session }
    );

    if (variantUpdate.matchedCount !== uniqueVariantIds.length) {
      const error = new Error(
        "Some variants could not be linked to this product."
      );
      error.status = 409;
      throw error;
    }

    // --------------------------------
    // Commit Transaction
    // --------------------------------

    await session.commitTransaction();

    productCreated = true;

    return res.status(201).json({
      success: true,
      message: "Product created successfully.",
      product,
    });

  } catch (error) {
    if (session?.inTransaction()) {
      await session.abortTransaction();
    }

    console.error("Create Product Error:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A product with this slug already exists.",
      });
    }

    return res.status(error.status || 500).json({
      success: false,
      message:
        error.status
          ? error.message
          : "Unable to create product.",
    });

  } finally {
    if (session) {
      await session.endSession();
    }

    if (!productCreated) {
      await cleanupUploadedImages(req.files || []);
    }
  }
};



// Get All Products
const getAllProducts = async (req, res) => {
  try {
    const {search,category,productType,subCategory,fabricType,brand,season,featured,bestSeller,newArrival,
      minPrice,maxPrice,color,size,design,page = "1",limit = "10",sort = "newest",} = req.query;

    // --------------------------------
    // Validate query parameters
    // --------------------------------

    const stringParams = {search,category,productType,subCategory,fabricType,brand,season,
      featured,bestSeller,newArrival,minPrice,maxPrice,color,size,design,page,limit,sort,};

    for (const [key, value] of Object.entries(stringParams)) {
      if (value !== undefined && typeof value !== "string") {
        return res.status(400).json({
          success: false,
          message: `${key} must be a string.`,
        });
      }
    }

    // --------------------------------
    // Pagination
    // --------------------------------

    if (!/^\d+$/.test(page) || !/^\d+$/.test(limit)) {
      return res.status(400).json({
        success: false,
        message: "Page and limit must be valid positive integers.",
      });
    }

    const currentPage = Number(page);
    const perPage = Number(limit);

    if (
      !Number.isSafeInteger(currentPage) ||
      !Number.isSafeInteger(perPage) ||
      currentPage < 1 ||
      perPage < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination values.",
      });
    }

    const finalLimit = Math.min(perPage, 100);
    const skip = (currentPage - 1) * finalLimit;

    if (!Number.isSafeInteger(skip)) {
      return res.status(400).json({
        success: false,
        message: "Requested page is too large.",
      });
    }

    // --------------------------------
    // Sorting
    // --------------------------------

    const allowedSortOptions = ["newest","oldest","name_asc","name_desc","price_low","price_high",];

    if (!allowedSortOptions.includes(sort)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sort option.",
      });
    }

    // --------------------------------
    // Validate ObjectIds
    // --------------------------------

    const objectIdParams = {category,productType,subCategory,fabricType,brand,season,};

    for (const [key, value] of Object.entries(objectIdParams)) {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${key} ID.`,
        });
      }
    }

    // --------------------------------
    // Validate Boolean Filters
    // --------------------------------

    const booleanParams = {featured,bestSeller,newArrival,};

    const booleanFilters = {};

    for (const [key, value] of Object.entries(booleanParams)) {
      if (value !== undefined) {
        if (value !== "true" && value !== "false") {
          return res.status(400).json({
            success: false,
            message: `${key} must be true or false.`,
          });
        }

        booleanFilters[key] = value === "true";
      }
    }

    // --------------------------------
    // Validate Price Filters
    // --------------------------------

   let min = 0;
     let max = Number.MAX_SAFE_INTEGER;

    if (minPrice !== undefined) {
      min = Number(minPrice);

      if (minPrice.trim() === "" || !Number.isFinite(min)) {
        return res.status(400).json({
          success: false,
          message: "minPrice must be a valid number.",
        });
      }
    }

    if (maxPrice !== undefined) {
      max = Number(maxPrice);

      if (maxPrice.trim() === "" || !Number.isFinite(max)) {
        return res.status(400).json({
          success: false,
          message: "maxPrice must be a valid number.",
        });
      }
    }

    if (min < 0 || max < 0) {
      return res.status(400).json({
        success: false,
        message: "Price cannot be negative.",
      });
    }

    if (min > max) {
      return res.status(400).json({
        success: false,
        message: "minPrice cannot be greater than maxPrice.",
      });
    }

    // --------------------------------
    // Base Product Filter
    // --------------------------------

    const filter = {isDeleted: false,isActive: true,};

    if (category) {
      filter.category = new mongoose.Types.ObjectId(category);
    }

    if (productType) {
      filter.productType = new mongoose.Types.ObjectId(productType);
    }

    if (subCategory) {
      filter.subCategory = new mongoose.Types.ObjectId(subCategory);
    }

    if (fabricType) {
      filter.fabricType = new mongoose.Types.ObjectId(fabricType);
    }

    if (brand) {
      filter.brand = new mongoose.Types.ObjectId(brand);
    }

    if (season) {
      filter.season = new mongoose.Types.ObjectId(season);
    }

    Object.assign(filter, booleanFilters);

  // --------------------------------
// Search Filter
// --------------------------------

if (search && search.trim()) {
  const escapedSearch = search
    .trim()
   .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    

  filter.name = {
    $regex: escapedSearch,
    $options: "i",
  };
}

    
    // --------------------------------
    // Variant Attribute Filters
    // --------------------------------

    const attributeFilters = [];

    if (color && color.trim()) {
      attributeFilters.push({
        attributes: {
          $elemMatch: {
            key: "color",
            value: color.trim(),
          },
        },
      });
    }

    if (size && size.trim()) {
      attributeFilters.push({
        attributes: {
          $elemMatch: {
            key: "size",
            value: size.trim(),
          },
        },
      });
    }

    if (design && design.trim()) {
      attributeFilters.push({
        attributes: {
          $elemMatch: {
            key: "design",
            value: design.trim(),
          },
        },
      });
    }

    // --------------------------------
    // Combined Variant Filter
    // --------------------------------

    const hasPriceFilter =
      minPrice !== undefined || maxPrice !== undefined;

    const variantFilter = {
      product: { $ne: null },
    };

    if (attributeFilters.length > 0) {
      variantFilter.$and = attributeFilters;
    }

    if (hasPriceFilter) {
      variantFilter.$expr = {
        $and: [
          {
            $gte: [
              { $ifNull: ["$salePrice", "$price"] },
              min,
            ],
          },
          {
            $lte: [
              { $ifNull: ["$salePrice", "$price"] },
              max,
            ],
          },
        ],
      };
    }

    if (attributeFilters.length > 0 || hasPriceFilter) {
      const matchingVariants = await ProductVariant.find(variantFilter)
        .select("product")
        .lean();

      const matchingProductIds = [
        ...new Set(
          matchingVariants.map((variant) =>
            variant.product.toString()
          )
        ),
      ].map((id) => new mongoose.Types.ObjectId(id));

      filter._id = { $in: matchingProductIds };
    }

    // --------------------------------
    // Count Products
    // --------------------------------

    const totalProducts = await Product.countDocuments(filter);

    const totalPages = Math.ceil(totalProducts / finalLimit);

    // --------------------------------
    // Populate Fields
    // --------------------------------

    const populateFields = [
      { path: "category", select: "name slug" },
      { path: "productType", select: "name slug" },
      { path: "subCategory", select: "name slug" },
      { path: "fabricType", select: "name slug" },
      { path: "brand", select: "name slug" },
      { path: "season", select: "name slug" },
    ];

    // --------------------------------
    // Fetch Products
    // --------------------------------

    let products;

    if (sort === "price_low" || sort === "price_high") {
      const priceSortDirection = sort === "price_low" ? 1 : -1;

      products = await Product.aggregate([
        { $match: filter },

        {
          $lookup: {
            from: ProductVariant.collection.name,
            localField: "_id",
            foreignField: "product",
            as: "productVariants",
          },
        },

        {
          $addFields: {
            sortPrice: {
              $ifNull: [
                {
                  $min: {
                    $map: {
                      input: "$productVariants",
                      as: "variant",
                      in: {
                        $ifNull: [
                          "$$variant.salePrice",
                          "$$variant.price",
                        ],
                      },
                    },
                  },
                },
                0,
              ],
            },
          },
        },

        {
          $sort: {
            sortPrice: priceSortDirection,
            _id: 1,
          },
        },

        { $skip: skip },
        { $limit: finalLimit },

        {
          $project: {
            productVariants: 0,
            sortPrice: 0,
          },
        },
      ]);

      products = await Product.populate(products, populateFields);
    } else {
      const sortOptions = {
        newest: { createdAt: -1 },
        oldest: { createdAt: 1 },
        name_asc: { name: 1 },
        name_desc: { name: -1 },
      };

      products = await Product.find(filter)
        .populate(populateFields)
        .sort(sortOptions[sort])
        .skip(skip)
        .limit(finalLimit)
        .lean();
    }

    // --------------------------------
    // Fetch Product Variants
    // --------------------------------

    const productIds = products.map((product) => product._id);

    const variants = productIds.length
      ? await ProductVariant.find({
          product: { $in: productIds },
        }).lean()
      : [];

    // Group variants by product ID
    const variantsMap = new Map();

    for (const variant of variants) {
      const productId = variant.product.toString();

      if (!variantsMap.has(productId)) {
        variantsMap.set(productId, []);
      }

      variantsMap.get(productId).push(variant);
    }

    // --------------------------------
    // Calculate Product Details
    // --------------------------------

    const productsWithDetails = products.map((product) => {
      const productVariants =
        variantsMap.get(product._id.toString()) || [];

      const effectivePrices = productVariants
        .map((variant) =>
          variant.salePrice ?? variant.price
        )
        .filter(
          (price) =>
            typeof price === "number" && Number.isFinite(price)
        );

      const totalStock = productVariants.reduce(
        (total, variant) =>
          total +
          (Number.isFinite(variant.stock) ? variant.stock : 0),
        0
      );

      const lowestPrice = effectivePrices.length
        ? Math.min(...effectivePrices)
        : 0;

      const highestPrice = effectivePrices.length
        ? Math.max(...effectivePrices)
        : 0;

        const discountedVariants = productVariants.filter(
  (variant) =>
    typeof variant.price === "number" &&
    Number.isFinite(variant.price) &&
    variant.price > 0 &&
    typeof variant.salePrice === "number" &&
    Number.isFinite(variant.salePrice) &&
    variant.salePrice >= 0 &&
    variant.salePrice < variant.price
);

const bestDiscountedVariant = discountedVariants.reduce(
  (best, variant) => {
    if (!best) return variant;

    const currentDiscount =
      ((variant.price - variant.salePrice) / variant.price) * 100;

    const bestDiscount =
      ((best.price - best.salePrice) / best.price) * 100;

    return currentDiscount > bestDiscount ? variant : best;
  },
  null
);

const isOnSale = Boolean(bestDiscountedVariant);

const discountPercentage = bestDiscountedVariant
  ? Math.round(
      ((bestDiscountedVariant.price - bestDiscountedVariant.salePrice) /
        bestDiscountedVariant.price) *
        100
    )
  : 0;

const amountSaved = bestDiscountedVariant
  ? bestDiscountedVariant.price - bestDiscountedVariant.salePrice
  : 0;

      // Primary image always first
     product.images?.sort(
       (a, b) => Number(b.isPrimary) - Number(a.isPrimary)
         );

         const thumbnail = product.images?.[0] || null;

      const inStock = totalStock > 0;

      const stockStatus =
        totalStock === 0
          ? "Out of Stock"
          : totalStock <= 5
          ? "Low Stock"
          : "In Stock";

      return {
        ...product,
        variants: productVariants,
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

    // --------------------------------
    // Response
    // --------------------------------

    return res.status(200).json({
      success: true,
      count: productsWithDetails.length,

      pagination: {
        currentPage,
        limit: finalLimit,
        totalProducts,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },

      products: productsWithDetails,
    });
  } catch (error) {
    console.error("Get All Products Error:", error);

    return res.status(500).json({
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

    const product = await Product.findOne({_id: id,isDeleted: false,isActive: true,})
      .populate("category", "name slug")
      .populate("productType", "name slug")
      .populate("subCategory", "name slug")
      .populate("fabricType", "name slug")
      .populate("brand", "name slug")
      .populate("season", "name slug")
      .populate("variants", "sku attributes price salePrice stock image");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }
   
    const productObject = product.toObject();

// Primary image always first
productObject.images?.sort(
  (a, b) => Number(b.isPrimary) - Number(a.isPrimary)
);

const thumbnail = productObject.images?.[0] || null;

const productVariants = productObject.variants || [];

const effectivePrices = productVariants
  .map((variant) => variant.salePrice ?? variant.price)
  .filter(
    (price) =>
      typeof price === "number" && Number.isFinite(price)
  );

const totalStock = productVariants.reduce(
  (total, variant) =>
    total +
    (Number.isFinite(variant.stock) ? variant.stock : 0),
  0
);

const lowestPrice = effectivePrices.length
  ? Math.min(...effectivePrices)
  : 0;

const highestPrice = effectivePrices.length
  ? Math.max(...effectivePrices)
  : 0;

const discountedVariants = productVariants.filter(
  (variant) =>
    typeof variant.price === "number" &&
    Number.isFinite(variant.price) &&
    variant.price > 0 &&
    typeof variant.salePrice === "number" &&
    Number.isFinite(variant.salePrice) &&
    variant.salePrice >= 0 &&
    variant.salePrice < variant.price
);

const bestDiscountedVariant = discountedVariants.reduce(
  (best, variant) => {
    if (!best) return variant;

    const currentDiscount =
      ((variant.price - variant.salePrice) / variant.price) * 100;

    const bestDiscount =
      ((best.price - best.salePrice) / best.price) * 100;

    return currentDiscount > bestDiscount ? variant : best;
  },
  null
);

const isOnSale = Boolean(bestDiscountedVariant);

const discountPercentage = bestDiscountedVariant
  ? Math.round(
      ((bestDiscountedVariant.price - bestDiscountedVariant.salePrice) /
        bestDiscountedVariant.price) *
        100
    )
  : 0;

const amountSaved = bestDiscountedVariant
  ? bestDiscountedVariant.price - bestDiscountedVariant.salePrice
  : 0;

const inStock = totalStock > 0;

const stockStatus =
  totalStock === 0
    ? "Out of Stock"
    : totalStock <= 5
      ? "Low Stock"
      : "In Stock";

res.status(200).json({
  success: true,
  product: { ...productObject, price: lowestPrice,maxPrice: highestPrice, discountPercentage, isOnSale,
  amountSaved,totalStock,inStock,stockStatus,thumbnail,},});

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

  let session;

  try {

    const { id } = req.params;

   
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID.",
      });
    }

    const product = await Product.findOne({_id: id,isDeleted: false,});

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

const {name,category,productType,subCategory,fabricType,brand,season,description,
  removedImages: removedImagesInput,featured,primaryImage,bestSeller,newArrival, isActive,} = req.body;

let { variants } = req.body;


let removedImages = removedImagesInput || [];

try {
  if (typeof removedImages === "string") {
    removedImages = JSON.parse(removedImages);
  }
} catch (error) {
  return res.status(400).json({
    success: false,
    message: "Removed images data must be valid JSON.",
  });
}

if (!Array.isArray(removedImages)) {
  return res.status(400).json({
    success: false,
    message: "Removed images must be an array.",
  });
}


if (
  !removedImages.every(
    (publicId) => typeof publicId === "string" && publicId.trim()
  )
) {
  return res.status(400).json({
    success: false,
    message: "Invalid removed image IDs.",
  });
}

const existingPublicIds = new Set(
  product.images.map((image) => image.public_id).filter(Boolean)
);

const invalidRemovedImage = removedImages.find(
  (publicId) => !existingPublicIds.has(publicId)
);

if (invalidRemovedImage) {
  return res.status(400).json({
    success: false,
    message: "One or more images do not belong to this product.",
  });
}

let uniqueVariantIds;

if (variants !== undefined) {
  // Form-data mein variants JSON string hota hai
  if (typeof variants === "string") {
    try {
      variants = JSON.parse(variants);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Variants must be a valid JSON array.",
      });
    }
  }

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

  uniqueVariantIds = [ ...new Set(variants.map((id) => id.toString())),];

  if (uniqueVariantIds.length !== variants.length) {
    return res.status(400).json({
      success: false,
      message: "Duplicate product variant IDs are not allowed.",
    });
  }

  const existingVariants = await ProductVariant.find({ _id: { $in: uniqueVariantIds },}).select("_id");

if (existingVariants.length !== uniqueVariantIds.length) {
  return res.status(404).json({
    success: false,
    message: "One or more product variants were not found.",
  });
}

const alreadyLinkedVariant = await ProductVariant.findOne({
  _id: { $in: uniqueVariantIds },
  product: {
    $exists: true,
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

const newCategory = category !== undefined ? category : product.category;

const newSubCategory = subCategory !== undefined ? subCategory : product.subCategory;

// Validate Category if changed
if (category !== undefined) {
  if (!mongoose.Types.ObjectId.isValid(category)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Category ID.",
    });
  }

  const categoryExists = await Category.findOne({_id: category,isDeleted: false, isActive: true,});

  if (!categoryExists) {
    return res.status(404).json({
      success: false,
      message: "Category not found or inactive.",
    });
  }
}

// Validate Sub Category
if (subCategory !== undefined) {
  if (!mongoose.Types.ObjectId.isValid(subCategory)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Sub Category ID.",
    });
  }

  const subCategoryExists = await SubCategory.findOne({ _id: subCategory,category: newCategory, isDeleted: false,isActive: true,});

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

if (category !== undefined && subCategory === undefined) {
  const currentSubCategory = await SubCategory.findOne({_id: product.subCategory,category: newCategory,isDeleted: false, isActive: true,});

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
if (category !== undefined) {
  product.category = category;
}

if (subCategory !== undefined) {
  product.subCategory = subCategory;
}


       // --------------------------------
    // Validate Product Type
    // --------------------------------

    if (productType !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(productType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Product Type ID.",
        });
      }

      const productTypeExists = await ProductType.findOne({
        _id: productType,
        isDeleted: false, isActive: true,});

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

    if (fabricType !== undefined) {
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

   if (brand !== undefined) {
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
  // Remove season
  if (season === null || season === "") {
    product.season = null;
  } else {
    // Validate Season ID
    if (!mongoose.Types.ObjectId.isValid(season)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Season ID.",
      });
    }

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
  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: "Product name is required.",
    });
  }

  const trimmedName = name.trim();

  product.name = trimmedName;

  product.slug = await generateUniqueSlug(
    trimmedName,
    product._id
  );
}

   if (description !== undefined) {
  if (typeof description !== "string") {
    return res.status(400).json({
      success: false,
      message: "Description must be a string.",
    });
  }

  product.description = description.trim();
} 

     // --------------------------------
// Product Image Management
// --------------------------------

// Keep existing images except selected removed images
const retainedImages = product.images.filter(
  (image) => !removedImages.includes(image.public_id)
);

// Add newly uploaded Cloudinary images
const newImages = (req.files || []).map((file) => ({
  filename: file.filename,
  public_id: file.filename,
  url: file.path,
  alt: name?.trim() || product.name,
  isPrimary: false,
}));

// Combine old and new images
const finalImages = [
  ...retainedImages.map((image) => image.toObject()),
  ...newImages,
];

   
// Validate selected primary image
if (primaryImage !== undefined) {
  if (
    typeof primaryImage !== "string" ||
    !primaryImage.trim() ||
    !finalImages.some(
      (image) => image.public_id === primaryImage.trim()
    )
  ) {
    return res.status(400).json({
      success: false,
      message: "Selected primary image is invalid.",
    });
  }

  // Set selected image as the only primary image
  finalImages.forEach((image) => {
    image.isPrimary = image.public_id === primaryImage.trim();
  });
}
   

if (finalImages.length > MAX_PRODUCT_IMAGES) {
  return res.status(400).json({
    success: false,
    message: `Maximum ${MAX_PRODUCT_IMAGES} product images are allowed.`,
  });
}

// At least one image required
if (finalImages.length === 0) {
  return res.status(400).json({
    success: false,
    message: "At least one product image is required.",
  });
}

// Ensure only one primary image
const primaryImages = finalImages.filter(
  (image) => image.isPrimary
);

if (primaryImages.length > 1) {
  return res.status(400).json({
    success: false,
    message: "Only one primary image is allowed.",
  });
}

// Automatically set first image as primary if none exists
if (primaryImages.length === 0) {
  finalImages[0].isPrimary = true;
}

// Keep primary image at first position
finalImages.sort(
  (a, b) => Number(b.isPrimary) - Number(a.isPrimary)
);

product.images = finalImages;


// Boolean Validation & Conversion

const booleanFields = {
  featured,
  bestSeller,
  newArrival,
  isActive,
};

const parsedBooleanFields = {};

for (const [field, value] of Object.entries(booleanFields)) {
  if (value === undefined) continue;

  if (value === true || value === "true") {
    parsedBooleanFields[field] = true;
  } else if (value === false || value === "false") {
    parsedBooleanFields[field] = false;
  } else {
    return res.status(400).json({
      success: false,
      message: `${field} must be true or false.`,
    });
  }
}

// Update Boolean Fields

if (parsedBooleanFields.featured !== undefined) {
  product.featured = parsedBooleanFields.featured;
}

if (parsedBooleanFields.bestSeller !== undefined) {
  product.bestSeller = parsedBooleanFields.bestSeller;
}

if (parsedBooleanFields.newArrival !== undefined) {
  product.newArrival = parsedBooleanFields.newArrival;
}

if (parsedBooleanFields.isActive !== undefined) {
  product.isActive = parsedBooleanFields.isActive;
}


session = await mongoose.startSession();
session.startTransaction();

   // variants update logic
if (variants !== undefined) {
  // Old variants ko unlink karo
  await ProductVariant.updateMany(
    {
      product: product._id,
      _id: { $nin: uniqueVariantIds },
    },
    {
      $set: { product: null },
    },
    { session }
  );

  // New variants ko current product ke saath link karo
  await ProductVariant.updateMany(
    {
      _id: { $in: uniqueVariantIds },
    },
    {
      $set: { product: product._id },
    },
    { session }
  );

  // Product mein new variants ki IDs save karo
  product.variants = uniqueVariantIds;
}



   await product.save({ session });


    // --------------------------------
    // Return Updated Product
    // --------------------------------

    await session.commitTransaction();
    session.endSession();

    // Delete removed images from Cloudinary after successful DB update
if (removedImages.length > 0) {
  setImmediate(async () => {
    const results = await Promise.allSettled(
      removedImages.map((publicId) =>
        cloudinary.uploader.destroy(publicId, {
          resource_type: "image",
        })
      )
    );

    results.forEach((result, index) => {
      if (
        result.status === "rejected" ||
        result.value?.result !== "ok"
      ) {
        console.error(
          "Cloudinary image deletion failed:",
          removedImages[index],
          result.status === "rejected" ? result.reason : result.value
        );
      }
    });
  });
}

    const updatedProduct = await Product.findById(product._id)
      .populate("category", "name slug")
      .populate("productType", "name slug")
      .populate("subCategory", "name slug")
      .populate("fabricType", "name slug")
      .populate("brand", "name slug")
      .populate("season", "name slug")
      .populate("variants","sku attributes price salePrice stock");


    res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      product: updatedProduct,
    });

     } catch (error) {
  console.log(error);

  if (session?.inTransaction()) {
    await session.abortTransaction();
  }

  if (session) {
    session.endSession();
  }

  // Duplicate variant attributes
  if (
    error.code === 11000 &&
    error.keyPattern?.product &&
    error.keyPattern?.attributeSignature
  ) {
    return res.status(400).json({
      success: false,
      message:
        "One or more product variants have duplicate attributes.",
    });
  }

  // Duplicate SKU
  if (error.code === 11000 && error.keyPattern?.sku) {
    return res.status(400).json({
      success: false,
      message: "One or more product variants have duplicate SKU.",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Server Error",
  });
}
};

// Soft Delete Product

const deleteProduct = async (req, res) => {
  let session;

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

    // Check order and review history
    const [hasOrders, hasReviews] = await Promise.all([
      Order.exists({
        "items.product": id,
      }),
      Review.exists({
        product: id,
      }),
    ]);

    const hasHistory = Boolean(hasOrders || hasReviews);

    // Start transaction
    session = await mongoose.startSession();
    session.startTransaction();

    // Unlink all variants
    await ProductVariant.updateMany(
      {
        product: product._id,
      },
      {
        $set: {
          product: null,
        },
      },
      { session }
    );

    if (hasHistory) {
      // Soft Delete: preserve historical product record
      product.isDeleted = true;
      product.isActive = false;

      await product.save({ session });
    } else {
      // Permanent Delete: no order or review history
      await product.deleteOne({ session });
    }

    await session.commitTransaction();
    session.endSession();
    session = null;

    // Delete Cloudinary images only after permanent deletion
    if (!hasHistory && product.images?.length > 0) {
      const publicIds = product.images
        .map((image) => image.public_id)
        .filter(Boolean);

      setImmediate(async () => {
        const results = await Promise.allSettled(
          publicIds.map((publicId) =>
            cloudinary.uploader.destroy(publicId, {
              resource_type: "image",
            })
          )
        );

        results.forEach((result, index) => {
          if (
            result.status === "rejected" ||
            !["ok", "not found"].includes(result.value?.result)
          ) {
            console.error(
              "Cloudinary image deletion failed:",
              publicIds[index],
              result.status === "rejected"
                ? result.reason
                : result.value
            );
          }
        });
      });
    }

    return res.status(200).json({
      success: true,
      message: hasHistory
        ? "Product soft deleted successfully because order or review history exists."
        : "Product permanently deleted successfully.",
      deleteType: hasHistory ? "soft" : "permanent",
    });

  } catch (error) {
    console.error("Delete Product Error:", error);

    if (session?.inTransaction()) {
      await session.abortTransaction();
    }

    if (session) {
      session.endSession();
    }

    return res.status(500).json({
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
      .populate("variants", "sku attributes price salePrice stock image")
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

   let session;

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

    session = await mongoose.startSession();
    session.startTransaction();

    const variantIds = Array.isArray(product.variants)
  ? product.variants
  : [];

const existingVariants = await ProductVariant.find({
  _id: { $in: variantIds },
})
  .select("_id product")
  .session(session);

if (existingVariants.length !== variantIds.length) {
  await session.abortTransaction();
  session.endSession();

  return res.status(404).json({
    success: false,
    message: "One or more product variants no longer exist.",
  });
}

const conflictingVariant = existingVariants.find(
  (variant) =>
    variant.product &&
    variant.product.toString() !== product._id.toString()
);

if (conflictingVariant) {
  await session.abortTransaction();
  session.endSession();

  return res.status(400).json({
    success: false,
    message:
      "One or more product variants are already linked to another product.",
  });
}
   

   if (variantIds.length === 0) {
  await session.abortTransaction();
  session.endSession();

  return res.status(400).json({
    success: false,
    message: "Product has no variants to restore.",
  });
}

await ProductVariant.updateMany(
  { _id: { $in: variantIds } },
  { $set: { product: product._id } },
  { session }
);


    product.isDeleted = false;
    product.isActive = true;

    await product.save({ session });

    await session.commitTransaction();
      session.endSession();

    const restoredProduct = await Product.findById(product._id)
      .populate("category", "name slug")
      .populate("productType", "name slug")
      .populate("subCategory", "name slug")
      .populate("fabricType", "name slug")
      .populate("brand", "name slug")
      .populate("season", "name slug")
       .populate("variants", "sku attributes price salePrice stock image");

    res.status(200).json({
      success: true,
      message: "Product restored successfully.",
      product: restoredProduct,
    });
  } catch (error) {
    console.log(error);

    if (session?.inTransaction()) {
      await session.abortTransaction();
    }

    if (session) {
      session.endSession();
    }

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


module.exports = {createProduct, getAllProducts,getProductById, updateProduct, deleteProduct, getDeletedProducts, restoreProduct,};