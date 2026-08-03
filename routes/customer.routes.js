const express = require("express");
const router = express.Router();

const {registerCustomer,loginCustomer,getCustomerProfile} = require("../controllers/customer.controller");

const { protect } = require("../middleware/auth.middleware");

// Public Routes
router.post("/register", registerCustomer);
router.post("/login", loginCustomer);
router.get("/profile", protect, getCustomerProfile);

module.exports = router;