const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/auth.middleware");

const { addAddress, getAddresses,getSingleAddress,updateAddress,deleteAddress} = require("../controllers/address.controller");


router.post("/",protect,addAddress);
router.get("/",protect,getAddresses);
router.get("/:id",protect,getSingleAddress);
router.put("/:id",protect,updateAddress);
router.delete("/:id",protect,deleteAddress);


module.exports = router;