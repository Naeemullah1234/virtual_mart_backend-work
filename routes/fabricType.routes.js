const express = require("express");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

const { createFabricType,getAllFabricTypes, getFabricTypeById,updateFabricType,deleteFabricType,} = require("../controllers/fabricType.controller");

router.post("/",protect,authorize("admin"),createFabricType);
router.get("/", getAllFabricTypes);
router.get("/:id", getFabricTypeById);
router.put("/:id",protect,authorize("admin"),updateFabricType);
router.delete("/:id",protect,authorize("admin"),deleteFabricType);

module.exports = router;