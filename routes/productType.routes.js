const express = require("express");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

const {
  createProductType,
  getAllProductTypes,
  getProductTypeById,
  updateProductType,
  deleteProductType,
} = require("../controllers/productType.controler");

router.post(
  "/",
  protect,
  authorize("admin"),
  createProductType
);

router.get("/", getAllProductTypes);

router.get("/:id", getProductTypeById);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  updateProductType
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteProductType
);

module.exports = router;