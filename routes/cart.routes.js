const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/auth.middleware");

const {addToCart,getCart,updateCartQuantity,removeCartItem,clearCart} = require("../controllers/cart.controller");

router.post("/",protect,addToCart);
router.get("/",protect,getCart);
router.patch("/",protect,updateCartQuantity);
router.delete("/:productId",protect,removeCartItem);
router.delete("/",protect,clearCart);

module.exports = router;