const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/auth.middleware");

const { createCoupon,getAllCoupons,validateCoupon,} = require("../controllers/coupon.controller");

// Admin routes
router.post("/", protect, authorize("admin"), createCoupon);
router.get("/", protect, authorize("admin"), getAllCoupons);

router.post("/validate", protect, validateCoupon);

module.exports = router;