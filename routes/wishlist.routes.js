const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/auth.middleware");

const { addToWishlist,getWishlist,removeFromWishlist,moveWishlistToCart,} = require("../controllers/wishlist.controller");

router.post("/", protect, addToWishlist);

router.get("/", protect, getWishlist);

router.delete("/:productId", protect, removeFromWishlist);

router.post("/move-to-cart/:productId", protect, moveWishlistToCart);

module.exports = router;