const express = require("express");

const router = express.Router();

const { protect,authorize } = require("../middleware/auth.middleware");

const { createProductVariant,getProductVariants,updateProductVariant,deleteProductVariant,restoreProductVariant,getAllProductVariants,getProductVariantFilters,getProductVariantById} = require("../controllers/productVariant.controller");


router.post("/",protect,authorize("admin"),createProductVariant);
router.get("/filters",protect,getProductVariantFilters);
router.get("/:productId",protect,getProductVariants);
router.put("/:variantId",protect,updateProductVariant);
router.delete("/:variantId",protect,deleteProductVariant);
router.patch( "/:variantId/restore",protect,authorize("admin"),restoreProductVariant);
router.get("/",protect,getAllProductVariants);
router.get("/single/:variantId",protect,getProductVariantById);

module.exports = router;


