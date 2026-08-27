const Customer = require("../models/customer.model");
const jwt = require("jsonwebtoken");

const customerProtect = async (req, res, next) => {
  try {

    let token;

    // --------------------------------
    // Get Token
    // --------------------------------

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // --------------------------------
    // Token Required
    // --------------------------------

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access Denied. No Token Provided.",
      });
    }

    // --------------------------------
    // Verify Token
    // --------------------------------

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // --------------------------------
    // Check ID
    // --------------------------------

    if (!decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid Customer Token.",
      });
    }

    // --------------------------------
    // Check Role
    // --------------------------------

    if (decoded.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Access Denied. Customer access required.",
      });
    }

    // --------------------------------
    // Find Customer
    // --------------------------------

    const customer = await Customer.findById(
      decoded.id
    ).select(
      "-password -refreshToken -otp -otpExpiresAt"
    );

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer not found.",
      });
    }

    // --------------------------------
    // Email Verification
    // --------------------------------

    if (!customer.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Customer email is not verified.",
      });
    }

    // --------------------------------
    // Block Check
    // --------------------------------

    if (customer.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Customer account is blocked.",
      });
    }

    // --------------------------------
    // Active Check
    // --------------------------------

    if (!customer.isActive) {
      return res.status(403).json({
        success: false,
        message: "Customer account is inactive.",
      });
    }

    // --------------------------------
    // Deleted Check
    // --------------------------------

    if (customer.isDeleted) {
      return res.status(403).json({
        success: false,
        message: "Customer account no longer exists.",
      });
    }

    // --------------------------------
    // Token Version Check
    // --------------------------------

    if (
      decoded.tokenVersion !==
      customer.tokenVersion
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Session expired. Please login again.",
        code: "SESSION_EXPIRED",
      });
    }

    // --------------------------------
    // Attach User
    // --------------------------------

    req.user = customer;

    next();

  } catch (error) {

    console.log(
      "CUSTOMER AUTH ERROR:",
      error
    );

    // --------------------------------
    // Expired Token
    // --------------------------------

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message:
          "Access token expired. Please refresh your token.",
        code: "ACCESS_TOKEN_EXPIRED",
      });
    }

    // --------------------------------
    // Invalid Token
    // --------------------------------

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid access token.",
        code: "INVALID_ACCESS_TOKEN",
      });
    }

    // --------------------------------
    // Other Errors
    // --------------------------------

    return res.status(401).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};

module.exports = {
  customerProtect,
};