const express = require("express");
const { protect,authorize } = require("../middleware/auth.middleware");
const router = express.Router();
const { productVariantUpload } = require("../middleware/imageUpload");

const { createProductVariant,getProductVariants,updateProductVariant,deleteProductVariant,getAllProductVariants,getProductVariantFilters,getProductVariantById} = require("../controllers/productVariant.controller");


router.post("/",protect,authorize("admin"),productVariantUpload,createProductVariant);

router.get("/",protect,getAllProductVariants);

router.get("/filters",protect,getProductVariantFilters);

router.get("/single/:variantId",protect,getProductVariantById);

router.get("/:productId",protect,getProductVariants);

router.put("/:variantId",protect,authorize("admin"),productVariantUpload,updateProductVariant);

router.delete("/:variantId",protect,authorize("admin"),deleteProductVariant);


module.exports = router;


