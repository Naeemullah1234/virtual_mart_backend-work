const express = require("express");
const { protect, authorize } = require("../middleware/auth.middleware");
const router = express.Router();
const upload = require("../middleware/upload.middleware");
const { createProduct, getAllProducts,getProductById, updateProduct, deleteProduct, getDeletedProducts,
restoreProduct,} = require("../controllers/product.controller");

const productImageUpload = (req, res, next) => {
  const startTime = performance.now();

  upload.array("images", 7)(req, res, (err) => {
    const duration = (performance.now() - startTime).toFixed(2);

    console.log(`Product Cloudinary Upload: ${duration} ms`);

    if (err) {
      return next(err);
    }

    next();
  });
};

router.post("/",protect,authorize("admin"),productImageUpload,createProduct);
router.put("/:id",protect,authorize("admin"),productImageUpload,updateProduct);
router.get("/", getAllProducts);
router.get("/deleted",protect,authorize("admin"),getDeletedProducts);
router.put("/:id/restore",protect,authorize("admin"),restoreProduct);
router.get("/:id", getProductById);
router.delete("/:id",protect,authorize("admin"),deleteProduct);

 

module.exports = router;