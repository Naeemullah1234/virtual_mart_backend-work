const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const router = express.Router();

const { registerUser, loginUser, getCurrentUser} = require("../controllers/auth.controller");


router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getCurrentUser);


module.exports = router;