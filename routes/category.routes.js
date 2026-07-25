const express = require("express");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

const {createCategory,getAllCategories,getCategoryById,updateCategory,deleteCategory,} = require("../controllers/category.controller");

router.post( "/",protect,authorize("admin"),createCategory);
router.get("/", getAllCategories);
router.get("/:id", getCategoryById);
router.put("/:id",protect,authorize("admin"),updateCategory);
router.delete("/:id",protect,authorize("admin"),deleteCategory);
module.exports = router;