const express = require("express");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

const { createBrand, getAllBrands,getBrandById,updateBrand,deleteBrand,} = require("../controllers/brand.controller");

router.post("/",protect,authorize("admin"),createBrand);

router.get("/", getAllBrands);

router.get("/:id", getBrandById);

router.put("/:id", protect, authorize("admin"), updateBrand);

router.delete("/:id", protect, authorize("admin"), deleteBrand);

module.exports = router;