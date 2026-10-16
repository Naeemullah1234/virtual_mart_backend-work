
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");

const {addReview,getMyReviews,updateMyReview,deleteMyReview,getAllReviewsForAdmin,
  moderateReview,getProductReviews,} = require("../controllers/review.controller");


router.post("/", protect, addReview);
router.get("/my-reviews", protect, getMyReviews);
router.put("/:reviewId", protect, updateMyReview);
router.delete("/:reviewId", protect, deleteMyReview);
router.get("/product/:productId", getProductReviews);

router.get("/admin/all",protect,require("../middleware/auth.middleware").authorize("admin"),getAllReviewsForAdmin);

router.patch("/admin/:reviewId",protect,require("../middleware/auth.middleware").authorize("admin"),moderateReview);



module.exports = router;
