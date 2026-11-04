const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth.middleware");
const reviewUpload = require("../middleware/reviewUpload.middleware");
const {addReview,getMyReviews,updateMyReview,deleteMyReview,getAllReviewsForAdmin,
  moderateReview,getProductReviews,deleteReviewForAdmin} = require("../controllers/review.controller");


router.post("/", protect, reviewUpload, addReview);
router.get("/my-reviews", protect, getMyReviews);
router.put("/:reviewId", protect, reviewUpload, updateMyReview);
router.delete("/:reviewId", protect, deleteMyReview);
router.get("/product/:productId", getProductReviews);
router.get("/admin/all", protect, authorize("admin"), getAllReviewsForAdmin);
router.patch("/admin/:reviewId", protect, authorize("admin"), moderateReview);
router.delete("/admin/:reviewId",protect,authorize("admin"),deleteReviewForAdmin);



module.exports = router;
