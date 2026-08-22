const express = require("express");
const router = express.Router();
const { adminProtect } = require("../middleware/adminAuth.middleware");


const { createAdmin,verifyAdminOTP,resendAdminOTP,loginAdmin,refreshAdminToken,getAdminProfile,
    logoutAdmin,forgotAdminPassword,verifyForgotPasswordOTP,resetAdminPassword,
    resendForgotPasswordOTP,getCurrentAdmin,changeAdminPassword} = require("../controllers/admin.controller");


router.post("/", createAdmin);

router.post("/verify-otp", verifyAdminOTP);

router.post("/resend-otp", resendAdminOTP);

router.post("/login", loginAdmin);

router.post("/refresh-token", refreshAdminToken);

router.get("/profile", adminProtect, getAdminProfile);

router.post("/logout", adminProtect, logoutAdmin);

router.post("/forgot-password",forgotAdminPassword);

router.post("/verify-forgot-password-otp",verifyForgotPasswordOTP);

router.post("/reset-password",resetAdminPassword);

router.post("/resend-forgot-password-otp",resendForgotPasswordOTP);

router.get("/me",adminProtect,getCurrentAdmin);

router.put( "/change-password",adminProtect,changeAdminPassword);

module.exports = router;