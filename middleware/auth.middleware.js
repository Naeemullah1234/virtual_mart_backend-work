const Customer = require("../models/customer.model");
const jwt = require("jsonwebtoken");

const protect = async (req, res, next) => {

    try {

        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")) 

            {

            token = req.headers.authorization.split(" ")[1];

        }

        if (!token) {

            return res.status(401).json({ success: false, message: "Access Denied. No Token Provided.",});}

     const decoded = jwt.verify(token, process.env.JWT_SECRET);

     if (!decoded.id) {
  return res.status(401).json({
    success: false,
    message: "Invalid Token.",
  });
}

     const customer = await Customer.findById(decoded.id).select("-password");

if (!customer) {
  return res.status(401).json({
    success: false,
    message: "Customer not found.",
  });
}

req.user = customer;

next();

        } catch (error) {

        return res.status(401).json({success: false, message: "Invalid Token.", }); }};

      const authorize = (...roles) => {
        
      return (req, res, next) => {

        const authorize = (...roles) => {
  return (req, res, next) => {

    // Development Mode
    if (process.env.ENABLE_ADMIN_AUTH === "false") {
      return next();
    }

    // Production Mode
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access Denied. You are not authorized to perform this action."
      });
    }

    next();
  };
};

  
    };
};

module.exports = {
    protect,
    authorize,
};