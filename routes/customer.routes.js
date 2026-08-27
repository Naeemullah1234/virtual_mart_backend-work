const express = require("express");
const router = express.Router();
const {registerCustomer,verifyCustomerRegistrationOTP,resendCustomerRegistrationOTP,forgotCustomerPassword,verifyForgotPasswordOTP,resetCustomerPassword,
   resendForgotPasswordOTP,loginCustomer,refreshCustomerToken,
   getCustomerProfile,updateCustomerProfile,changeCustomerPassword,logoutCustomer,} = require("../controllers/customer.controller");
const { protect } = require("../middleware/auth.middleware");
const { customerProtect,} = require("../middleware/customerAuth.middleware");


router.post("/register", registerCustomer);

router.post("/login", loginCustomer);

router.post("/verify-otp",verifyCustomerRegistrationOTP);

router.post("/resend-otp",resendCustomerRegistrationOTP);

router.post("/forgot-password",forgotCustomerPassword);

router.post("/verify-forgot-password-otp",verifyForgotPasswordOTP);

router.post("/reset-password",resetCustomerPassword);

router.post("/resend-forgot-password-otp",resendForgotPasswordOTP);

router.post("/refresh-token",refreshCustomerToken);

router.get("/profile", protect, getCustomerProfile);

router.put("/profile", protect, updateCustomerProfile);

router.put("/change-password",protect,changeCustomerPassword);

router.post("/logout",protect,logoutCustomer);

module.exports = router;