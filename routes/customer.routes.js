const express = require("express");
const router = express.Router();
const {registerCustomer,loginCustomer,getCustomerProfile,updateCustomerProfile,changeCustomerPassword,logoutCustomer} = require("../controllers/customer.controller");
const { protect } = require("../middleware/auth.middleware");


router.post("/register", registerCustomer);
router.post("/login", loginCustomer);
router.get("/profile", protect, getCustomerProfile);
router.put("/profile", protect, updateCustomerProfile);
router.put("/change-password",protect,changeCustomerPassword);
router.post("/logout",protect,logoutCustomer);
module.exports = router;