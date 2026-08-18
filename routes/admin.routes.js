const express = require("express");
const router = express.Router();
const { adminProtect } = require("../middleware/adminAuth.middleware");

const { createAdmin,verifyAdminOTP,resendAdminOTP,loginAdmin,} = require("../controllers/admin.controller");


router.post("/", createAdmin);

router.post("/verify-otp", verifyAdminOTP);

router.post("/resend-otp", resendAdminOTP);

router.post("/login", loginAdmin);

router.get("/profile", adminProtect, (req, res) => {
  res.status(200).json({
    success: true,
    admin: req.admin,
  });
});

module.exports = router;