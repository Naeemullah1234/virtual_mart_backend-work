const express = require("express");

const router = express.Router();

const { protect,authorize } = require("../middleware/auth.middleware");

const { createProductVariant,getProductVariants,updateProductVariant,deleteProductVariant,restoreProductVariant,getAllProductVariants} = require("../controllers/productVariant.controller");


router.post("/",protect,authorize("admin"),createProductVariant);

router.get("/:productId",protect,getProductVariants);
router.put("/:variantId",protect,updateProductVariant);
router.delete("/:variantId",protect,deleteProductVariant);
router.patch("/:variantId",protect,restoreProductVariant);
router.get("/",protect,getAllProductVariants);
module.exports = router;


