const Admin = require("../models/admin.model");
const Customer = require("../models/customer.model");
const jwt = require("jsonwebtoken");

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access Denied. No Token Provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid Token.",
      });
    }

    let account;

if (decoded.role === "admin") {
  account = await Admin.findById(decoded.id)
    .select("-password -refreshToken -otp -otpExpiresAt");

  console.log("ADMIN FOUND:", account);

  if (!account) {
    return res.status(401).json({
      success: false,
      message: "Admin not found.",
    });
  }
} else {
  account = await Customer.findById(decoded.id)
    .select("-password -refreshToken -otp -otpExpiresAt");

  console.log("CUSTOMER FOUND:", account);

  if (!account) {
    return res.status(401).json({
      success: false,
      message: "Customer not found.",
    });
  }
}


 
// --------------------------------
// Email Verification
// --------------------------------

if (decoded.role === "admin") {
  if (!account.isVerified) {
    return res.status(403).json({
      success: false,
      message: "Admin email is not verified.",
    });
  }
} else {
  if (!account.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: "Customer email is not verified.",
    });
  }
}
 

  

    // --------------------------------
    // Block Check
    // --------------------------------

    if (account.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Account is blocked.",
      });
    }

   // --------------------------------
// Active Check
// --------------------------------

if (decoded.role !== "admin" && !account.isActive) {
  return res.status(403).json({
    success: false,
    message: "Customer account is inactive.",
  });
}
   

// --------------------------------
// Deleted Check
// --------------------------------

if (decoded.role !== "admin" && account.isDeleted) {
  return res.status(403).json({
    success: false,
    message: "Customer account has been deleted.",
  });
}

    // --------------------------------
    // Token Version Check
    // --------------------------------

    if (
      decoded.tokenVersion !==
      account.tokenVersion
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Session expired. Please login again.",
        code: "SESSION_EXPIRED",
      });
    }



req.user = account;


    next();

} catch (error) {

    console.log(
      "ACCOUNT AUTH ERROR:",
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

    return res.status(401).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};


const authorize = (...roles) => {
  return (req, res, next) => {

    if (process.env.ENABLE_ADMIN_AUTH === "false") {
      return next();
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access Denied. You are not authorized to perform this action.",
      });
    }

    next();
  };
};


module.exports = {
  protect,
  authorize,
};