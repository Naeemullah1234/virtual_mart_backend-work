
const Customer = require("../models/customer.model");
const jwt = require("jsonwebtoken");

const optionalCustomerAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Token nahi hai to guest ke taur par allow karein
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.id || decoded.role !== "customer") {
      return res.status(401).json({
        success: false,
        message: "Invalid customer token.",
      });
    }

    const customer = await Customer.findById(decoded.id)
      .select("-password -refreshToken -otp -otpExpiresAt");

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer not found.",
      });
    }

    if (
      !customer.isEmailVerified ||
      customer.isBlocked ||
      !customer.isActive ||
      customer.isDeleted ||
      decoded.tokenVersion !== customer.tokenVersion
    ) {
      return res.status(403).json({
        success: false,
        message: "Customer account cannot comment.",
      });
    }

    req.user = customer;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired customer token.",
    });
  }
};

module.exports = { optionalCustomerAuth };
