const express = require("express");
const { protect,authorize,} = require("../middleware/auth.middleware");
const router = express.Router();

const { createSubCategory, getAllSubCategories,getSubCategoryById,updateSubCategory,deleteSubCategory,}
 = require("../controllers/subCategory.controller");




router.get("/", getAllSubCategories);
router.get("/:id", getSubCategoryById);

router.post( "/",protect,authorize("admin"),createSubCategory,);
router.put("/:id",protect,authorize("admin"),updateSubCategory);
router.delete( "/:id",protect,authorize("admin"),deleteSubCategory);

module.exports = router;