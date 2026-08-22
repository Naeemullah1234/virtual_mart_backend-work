const Admin = require("../models/admin.model");
const jwt = require("jsonwebtoken");

const adminProtect = async (req, res, next) => {
  try {

    let token;


    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }


    if (!token) {
      return res.status(401).json({ success: false, message: "Access Denied. No Token Provided.",});}


    const decoded = jwt.verify( token, process.env.JWT_SECRET);

  

    if (!decoded.id) {
      return res.status(401).json({ success: false, message: "Invalid Admin Token.", });}


    if (decoded.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access Denied. Admin access required.",});}


    const admin = await Admin.findById(decoded.id) .select("-password -refreshToken -otp -otpExpiresAt");

    if (!admin) {
      return res.status(401).json({ success: false, message: "Admin not found.",});}


    if (!admin.isVerified) {
      return res.status(403).json({ success: false, message: "Admin email is not verified.", });}


    if (admin.isBlocked) {
      return res.status(403).json({ success: false, message: "Admin account is blocked.", });}


    req.user = admin;


    next();

  } catch (error) {

  console.log("ADMIN AUTH ERROR:", error);

  if (error.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Access token expired. Please refresh your token.",
      code: "ACCESS_TOKEN_EXPIRED",
    });
  }

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
}};

module.exports = {
  adminProtect,
};