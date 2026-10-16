
const Review = require("../models/review.model");
const Product = require("../models/product.model");

// Add Review
const addReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    if (!productId || rating === undefined || !comment?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product, rating and comment are required.",
      });
    }

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be an integer between 1 and 5.",
      });
    }

    if (comment.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot exceed 1000 characters.",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const review = await Review.create({
      customer: req.user._id,
      product: productId,
      rating: numericRating,
      comment: comment.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully. It is awaiting approval.",
      review,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this product.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get My Reviews
const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      customer: req.user._id,
    })
      .populate("product", "name images")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update My Review
const updateMyReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const review = await Review.findOne({
      _id: req.params.reviewId,
      customer: req.user._id,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    if (rating !== undefined) {
      const numericRating = Number(rating);

      if (
        !Number.isInteger(numericRating) ||
        numericRating < 1 ||
        numericRating > 5
      ) {
        return res.status(400).json({
          success: false,
          message: "Rating must be an integer between 1 and 5.",
        });
      }

      review.rating = numericRating;
    }

    if (comment !== undefined) {
      if (
        typeof comment !== "string" ||
        !comment.trim() ||
        comment.trim().length > 1000
      ) {
        return res.status(400).json({
          success: false,
          message: "Comment must contain 1 to 1000 characters.",
        });
      }

      review.comment = comment.trim();
    }

    // Edited reviews must be approved again.
    review.isApproved = false;

    await review.save();

    return res.status(200).json({
      success: true,
      message: "Review updated and sent for approval.",
      review,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete My Review
const deleteMyReview = async (req, res) => {
  try {
    const review = await Review.findOneAndDelete({
      _id: req.params.reviewId,
      customer: req.user._id,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const getAllReviewsForAdmin = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("customer", "name email")
      .populate("product", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const moderateReview = async (req, res) => {
  try {
    const { isApproved } = req.body;

    if (typeof isApproved !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isApproved must be true or false.",
      });
    }

    const review = await Review.findByIdAndUpdate(
      req.params.reviewId,
      { isApproved },
      { new: true, runValidators: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: isApproved
        ? "Review approved successfully."
        : "Review rejected successfully.",
      review,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const reviews = await Review.find({
      product: productId,
      isApproved: true,
    })
      .populate("customer", "name")
      .select("customer rating comment createdAt")
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;

    const averageRating =
      totalReviews > 0
        ? Number(
            (
              reviews.reduce((sum, review) => sum + review.rating, 0) /
              totalReviews
            ).toFixed(1)
          )
        : 0;

    return res.status(200).json({
      success: true,
      productId,
      averageRating,
      totalReviews,
      reviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



module.exports = {
  addReview,
  getMyReviews,
  updateMyReview,
  deleteMyReview,
  getAllReviewsForAdmin,
  moderateReview,
  getProductReviews,
};
