const express = require("express");
const router = express.Router();
const uploadRoutes = require("./upload.routes");

router.use("/auth", require("./auth.routes"));
router.use("/categories", require("./category.routes"));
router.use("/sub-categories", require("./subCategory.routes"));
router.use("/fabric-types", require("./fabricType.routes"));
router.use("/brands", require("./brand.routes"));
router.use("/seasons", require("./season.routes"));
router.use("/product-types", require("./productType.routes"));
router.use("/products", require("./product.routes"));
router.use("/upload", uploadRoutes);

module.exports = router;