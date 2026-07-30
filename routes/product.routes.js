const express = require("express");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

const { createProduct, getAllProducts,getProductById, updateProduct, deleteProduct, getDeletedProducts,
  restoreProduct,} = require("../controllers/product.controller");

router.post("/",protect,authorize("admin"),createProduct);

router.get("/", getAllProducts);

router.get("/deleted",protect,authorize("admin"),getDeletedProducts);

 router.put("/:id/restore",protect,authorize("admin"),restoreProduct);

router.get("/:id", getProductById);

 router.put("/:id",protect,authorize("admin"),updateProduct);

 router.delete("/:id",protect,authorize("admin"),deleteProduct);

 



module.exports = router;