const Review = require("../models/review.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");
const mongoose = require("mongoose");
const cloudinary = require("../config/cloudinary");
const cleanupCloudinaryImages = async (files = []) => {
  return Promise.allSettled( files.map((file) =>
      cloudinary.uploader.destroy(file.filename)));};



const addReview = async (req, res) => {
  const uploadedFiles = req.files || [];
  let reviewSaved = false;
  const sendError = async (status, message) => {
  await cleanupCloudinaryImages(uploadedFiles);

  return res.status(status).json({
    success: false,
    message,
  });};

  try {
   const { productId, orderId, rating, comment } = req.body;

   if (
  !mongoose.isValidObjectId(productId) ||
  !mongoose.isValidObjectId(orderId) ||
  rating === undefined
) {
  return sendError(400, "Valid productId, orderId and rating are required.");
}

    if (typeof comment !== "string" || !comment.trim()) {
    return sendError(400, "Review comment is required.");
    }

    const cleanComment = comment.trim().replace(/\s+/g, " ");

    if (cleanComment.length < 5 || cleanComment.length > 250) {
      return sendError(400, "Review must contain 5 to 250 characters.");
    }

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return sendError(400, "Rating must be an integer between 1 and 5.");
    }

    const product = await Product.findById(productId);

    if (!product) {
      return sendError(404, "Product not found.");
    }

    const deliveredOrder = await Order.findOne({
  _id: orderId,
  customer: req.user._id,
  orderStatus: "delivered",
  "items.product": productId,
});

if (!deliveredOrder) {
  return sendError(
    403,
    "This product was not found in your delivered order."
  );
}

    const review = await Review.create({
      customer: req.user._id,
      product: productId,
      rating: numericRating,
      comment: cleanComment,
      order: deliveredOrder._id,
      images: uploadedFiles.map((file) => ({
        url: file.path,
        filename: file.filename,
        public_id: file.filename,
      })),
    });

    reviewSaved = true;

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully. It is awaiting approval.",
      review,
    });
  } catch (error) {
    if (!reviewSaved) {
     if (!reviewSaved) {
  await cleanupCloudinaryImages(uploadedFiles);
}
    }

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


const getMyReviews = async (req, res) => {
  try {
    
    const reviews = await Review.find({ customer: req.user._id })
  .populate("product", "name images")
  .populate("order", "orderNumber orderStatus createdAt")
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


const updateMyReview = async (req, res) => {
  const uploadedFiles = req.files || [];
  let reviewSaved = false;

  const sendError = async (status, message) => {
    await cleanupCloudinaryImages(uploadedFiles);

    return res.status(status).json({
      success: false,
      message,
    });
  };

  try {
    if (!mongoose.isValidObjectId(req.params.reviewId)) {
      return sendError(400, "Invalid review ID.");
    }

    const { rating, comment } = req.body;
    let imagesToRemove = req.body.removeImages || [];

    // Accept a single ID or an array of IDs.
    if (typeof imagesToRemove === "string") {
      try {
        const parsed = JSON.parse(imagesToRemove);
        imagesToRemove = Array.isArray(parsed)
          ? parsed
          : [imagesToRemove];
      } catch {
        imagesToRemove = [imagesToRemove];
      }
    }

    if (
      !Array.isArray(imagesToRemove) ||
      !imagesToRemove.every((id) => typeof id === "string")
    ) {
      return sendError(400, "Invalid removeImages format.");
    }

    const review = await Review.findOne({
      _id: req.params.reviewId,
      customer: req.user._id,
    });

    if (!review) {
      return sendError(404, "Review not found.");
    }

    if (
      rating === undefined &&
      comment === undefined &&
      imagesToRemove.length === 0 &&
      uploadedFiles.length === 0
    ) {
      return sendError(400, "Please provide something to update.");
    }

    if (rating !== undefined) {
      const numericRating = Number(rating);

      if (
        !Number.isInteger(numericRating) ||
        numericRating < 1 ||
        numericRating > 5
      ) {
        return sendError(
          400,
          "Rating must be an integer between 1 and 5."
        );
      }

      review.rating = numericRating;
    }

    if (comment !== undefined) {
      if (typeof comment !== "string" || !comment.trim()) {
        return sendError(400, "Review comment is required.");
      }

      const cleanComment = comment.trim().replace(/\s+/g, " ");

      if (cleanComment.length < 5 || cleanComment.length > 250) {
        return sendError(
          400,
          "Review must contain 5 to 250 characters."
        );
      }

      review.comment = cleanComment;
    }

    const currentImages = review.images || [];

    const uniqueImagesToRemove = [...new Set(imagesToRemove)];

    const validImagesToRemove = currentImages.filter((image) =>
      uniqueImagesToRemove.includes(image.public_id)
    );

    if (validImagesToRemove.length !== uniqueImagesToRemove.length) {
      return sendError(
        400,
        "One or more images do not belong to this review."
      );
    }

    const remainingImages = currentImages.filter(
      (image) => !uniqueImagesToRemove.includes(image.public_id)
    );

    if (remainingImages.length + uploadedFiles.length > 3) {
      return sendError(
        400,
        "A review can contain a maximum of 3 images."
      );
    }

    review.images = [
      ...remainingImages,
      ...uploadedFiles.map((file) => ({
        url: file.path,
        filename: file.filename,
        public_id: file.filename,
      })),
    ];

    review.isApproved = false;

    await review.save();
    reviewSaved = true;

    const deletionResults = await Promise.allSettled(
      validImagesToRemove.map((image) =>
        cloudinary.uploader.destroy(image.public_id)
      )
    );

    return res.status(200).json({
      success: true,
      message: "Review updated and sent for approval.",
      imageCleanup: deletionResults.every(
        (result) => result.status === "fulfilled"
      ),
      review,
    });
  } catch (error) {
    if (!reviewSaved) {
      await cleanupCloudinaryImages(uploadedFiles);
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate review.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteMyReview = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID.",
      });
    }

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

    const images = review.images || [];

    await review.deleteOne();

    const cloudinary = require("../config/cloudinary");

    const deletionResults = await Promise.allSettled(
      images.map((image) =>
        cloudinary.uploader.destroy(image.public_id)
      )
    );

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully.",
      imageCleanup: deletionResults.every(
        (result) => result.status === "fulfilled"
      ),
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
      .populate("customer", "firstName lastName email")
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
    if (!mongoose.isValidObjectId(req.params.reviewId)) {
  return res.status(400).json({
    success: false,
    message: "Invalid review ID.",
  });
}
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

const deleteReviewForAdmin = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID.",
      });
    }

    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    const images = review.images || [];

    await review.deleteOne();

    const cloudinary = require("../config/cloudinary");

    const deletionResults = await Promise.allSettled(
      images.map((image) =>
        cloudinary.uploader.destroy(image.public_id)
      )
    );

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully by admin.",
      imageCleanup: deletionResults.every(
        (result) => result.status === "fulfilled"
      ),
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
    
    if (!mongoose.isValidObjectId(productId)) {
  return res.status(400).json({
    success: false,
    message: "Invalid product ID.",
  });
}

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const reviews = await Review.find({
      product: productId,isApproved: true,})
      .populate("customer", "firstName lastName")
      .select("customer rating comment images createdAt")
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;

    const averageRating = totalReviews > 0 ? Number(
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



module.exports = {addReview,getMyReviews,updateMyReview,deleteMyReview, getAllReviewsForAdmin, moderateReview,getProductReviews,deleteReviewForAdmin,};
