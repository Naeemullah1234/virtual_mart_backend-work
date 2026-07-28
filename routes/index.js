const express = require("express");

const router = express.Router();

router.use("/auth", require("./auth.routes"));
router.use("/categories", require("./category.routes"));
router.use("/sub-categories", require("./subCategory.routes"));
router.use("/fabric-types", require("./fabricType.routes"));
router.use("/brands", require("./brand.routes"));

module.exports = router;