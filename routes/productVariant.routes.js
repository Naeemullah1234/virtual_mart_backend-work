const express = require("express");

const router = express.Router();

const { protect,authorize } = require("../middleware/auth.middleware");

const { createProductVariant,getProductVariants,updateProductVariant,deleteProductVariant,getAllProductVariants,getProductVariantFilters,getProductVariantById} = require("../controllers/productVariant.controller");


router.post("/",protect,authorize("admin"),createProductVariant);
router.get("/",protect,getAllProductVariants);
router.get("/filters",protect,getProductVariantFilters);
router.get("/single/:variantId",protect,getProductVariantById);
router.get("/:productId",protect,getProductVariants);
router.put("/:variantId",protect,authorize("admin"),updateProductVariant);
router.delete("/:variantId",protect,authorize("admin"),deleteProductVariant);


module.exports = router;


