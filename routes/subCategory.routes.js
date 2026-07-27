const express = require("express");

const router = express.Router();

const { createSubCategory, getAllSubCategories,getSubCategoryById,updateSubCategory,deleteSubCategory,}
 = require("../controllers/subCategory.controller");

const { protect,authorize,} = require("../middleware/auth.middleware");

router.post( "/",protect,authorize("admin"),createSubCategory,);
router.get("/", getAllSubCategories);
router.get("/:id", getSubCategoryById);

router.put("/:id",protect,authorize("admin"),updateSubCategory);

router.delete( "/:id",protect,authorize("admin"),deleteSubCategory);

module.exports = router;