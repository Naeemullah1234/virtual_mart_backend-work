const express = require("express");
const router = express.Router();
const {protect,authorize,} = require("../middleware/auth.middleware");
const {productUpload,} = require("../middleware/imageUpload");

const {createProduct,getAllProducts,getProductById,updateProduct,
  deleteProduct,getDeletedProducts,restoreProduct,} = require("../controllers/product.controller");


router.post("/",protect,authorize("admin"),productUpload,createProduct);
router.put("/:id",protect,authorize("admin"),productUpload,updateProduct);
router.get("/deleted",protect,authorize("admin"),getDeletedProducts);
router.put("/:id/restore",protect,authorize("admin"),restoreProduct);
router.delete("/:id",protect,authorize("admin"),deleteProduct);

router.get("/", getAllProducts);
router.get("/:id", getProductById);

module.exports = router;
