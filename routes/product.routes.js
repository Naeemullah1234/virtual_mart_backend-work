
const express = require("express");
const router = express.Router();

const {
  protect,
  authorize,
} = require("../middleware/auth.middleware");

const {
  productUpload,
} = require("../middleware/imageUpload");

const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getDeletedProducts,
  restoreProduct,
} = require("../controllers/product.controller");

// Create product
router.post(
  "/",
  protect,
  authorize("admin"),
  productUpload,
  createProduct
);

// Update product
router.put(
  "/:id",
  protect,
  authorize("admin"),
  productUpload,
  updateProduct
);

// Get all active products (Public)
router.get("/", getAllProducts);

// Get deleted products (Admin)
router.get(
  "/deleted",
  protect,
  authorize("admin"),
  getDeletedProducts
);

// Restore deleted product (Admin)
router.put(
  "/:id/restore",
  protect,
  authorize("admin"),
  restoreProduct
);

// Get single product (Public)
router.get("/:id", getProductById);

// Delete product (Admin)
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteProduct
);

module.exports = router;
