const express = require("express");
const { protect,authorize } = require("../middleware/auth.middleware");
const router = express.Router();
const upload = require("../middleware/upload.middleware");

const { createProductVariant,getProductVariants,updateProductVariant,deleteProductVariant,getAllProductVariants,getProductVariantFilters,getProductVariantById} = require("../controllers/productVariant.controller");


router.post("/",protect,authorize("admin"),upload.array("images", 5),createProductVariant);

router.get("/",protect,getAllProductVariants);

router.get("/filters",protect,getProductVariantFilters);

router.get("/single/:variantId",protect,getProductVariantById);

router.get("/:productId",protect,getProductVariants);

router.put("/:variantId",protect,authorize("admin"),upload.array("images", 5),updateProductVariant);

router.delete("/:variantId",protect,authorize("admin"),deleteProductVariant);


module.exports = router;


