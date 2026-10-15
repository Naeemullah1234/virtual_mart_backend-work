const Coupon = require("../models/coupon.model");

// Admin: Create Coupon
const createCoupon = async (req, res) => {
  try {
    let {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      startDate,
      expiryDate,
      usageLimit,
    } = req.body;

    if (!code || !discountType || discountValue == null || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: "Code, discount type, discount value and expiry date are required.",
      });
    }

    code = code.trim().toUpperCase();

    if (!["percentage", "fixed"].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: "Discount type must be percentage or fixed.",
      });
    }

    if (!Number.isFinite(Number(discountValue)) || Number(discountValue) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Discount value must be greater than zero.",
      });
    }

    if (discountType === "percentage" && Number(discountValue) > 100) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 100.",
      });
    }

    const expiry = new Date(expiryDate);
    const start = startDate ? new Date(startDate) : new Date();

    if (
      Number.isNaN(expiry.getTime()) ||
      Number.isNaN(start.getTime()) ||
      expiry <= start
    ) {
      return res.status(400).json({
        success: false,
        message: "Expiry date must be later than start date.",
      });
    }

    const existingCoupon = await Coupon.findOne({ code });

    if (existingCoupon) {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists.",
      });
    }

    const coupon = await Coupon.create({
      code,
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: minOrderAmount ?? 0,
      maxDiscount: maxDiscount ?? null,
      startDate: start,
      expiryDate: expiry,
      usageLimit: usageLimit ?? null,
    });

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully.",
      coupon,
    });
  } catch (error) {
    console.error("CREATE COUPON ERROR:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists.",
      });
    }

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create coupon.",
    });
  }
};

// Admin: Get All Coupons
const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: coupons.length,
      coupons,
    });
  } catch (error) {
    console.error("GET COUPONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch coupons.",
    });
  }
};

// Customer: Validate Coupon
const validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code || orderAmount == null) {
      return res.status(400).json({
        success: false,
        message: "Coupon code and order amount are required.",
      });
    }

    const amount = Number(orderAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Order amount must be greater than zero.",
      });
    }

    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code.",
      });
    }

    const now = new Date();

    if (now < coupon.startDate || now > coupon.expiryDate) {
      return res.status(400).json({
        success: false,
        message: "Coupon is not currently valid.",
      });
    }

    if (
      coupon.usageLimit !== null &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      return res.status(400).json({
        success: false,
        message: "Coupon usage limit has been reached.",
      });
    }

    if (amount < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is Rs. ${coupon.minOrderAmount}.`,
      });
    }

    let discount = 0;

    if (coupon.discountType === "percentage") {
      discount = (amount * coupon.discountValue) / 100;

      if (coupon.maxDiscount !== null) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.discountValue;
    }

    discount = Math.min(discount, amount);

    return res.status(200).json({
      success: true,
      message: "Coupon applied successfully.",
      couponCode: coupon.code,
      orderAmount: amount,
      discount,
      finalAmount: amount - discount,
    });
  } catch (error) {
    console.error("VALIDATE COUPON ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to validate coupon.",
    });
  }
};

module.exports = {
  createCoupon,
  getAllCoupons,
  validateCoupon,
};