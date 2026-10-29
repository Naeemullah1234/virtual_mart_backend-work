const mongoose = require("mongoose");
const Comment = require("../models/comment.model");
const Product = require("../models/product.model");



const createComment = async (req, res) => {
  try {
    const { productId, comment, guestName } = req.body;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Valid productId is required.",
      });
    }

    if (typeof comment !== "string" || !comment.trim()) {
  return res.status(400).json({
    success: false,
    message: "Comment text is required.",
  });
}

// Multiple spaces ko single space karein
const cleanComment = comment.trim().replace(/\s+/g, " ");

// Minimum 3 words
if (cleanComment.split(" ").length < 3) {
  return res.status(400).json({
    success: false,
    message: "Comment must contain at least 3 words.",
  });
}

// Maximum 100 characters
if (cleanComment.length > 100) {
  return res.status(400).json({
    success: false,
    message: "Comment cannot exceed 100 characters.",
  });
}

    const product = await Product.findOne({
      _id: productId,
      isActive: true,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const loggedInCustomer =
      req.user?.role === "customer" ? req.user._id : null;

    const safeGuestName = loggedInCustomer
      ? undefined
      : "Visitor";

   const newComment = await Comment.create({
  product: product._id,
  customer: loggedInCustomer,
  guestName: loggedInCustomer ? null : "Visitor",
  comment: cleanComment,
  isApproved: false,
});

    return res.status(201).json({
      success: true,
      message: "Comment submitted for approval.",
      comment: newComment,
    });
  } catch (error) {
    console.error("Create comment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create comment.",
    });
  }
};



const getProductComments = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const comments = await Comment.find({
      product: productId,
      isApproved: true,
    })
      .select("guestName customer comment createdAt")
      .populate("customer", "firstName lastName")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch comments.",
    });
  }
};


const deleteMyComment = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.commentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid comment ID.",
      });
    }

    const comment = await Comment.findOneAndDelete({
      _id: req.params.commentId,
      customer: req.user._id,
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found or not owned by you.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete comment.",
    });
  }
};


const getAllCommentsForAdmin = async (req, res) => {
  try {
    const comments = await Comment.find()
      .populate("customer", "name email")
      .populate("product", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch comments.",
    });
  }
};


const moderateComment = async (req, res) => {
  try {
    const { isApproved } = req.body;

    if (!mongoose.isValidObjectId(req.params.commentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid comment ID.",
      });
    }

    if (typeof isApproved !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isApproved must be true or false.",
      });
    }

    const comment = await Comment.findByIdAndUpdate(
      req.params.commentId,
      { isApproved },
      { new: true, runValidators: true }
    );

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: isApproved ? "Comment approved." : "Comment rejected.",
      comment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to moderate comment.",
    });
  }
};


const deleteCommentForAdmin = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.commentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid comment ID.",
      });
    }

    const comment = await Comment.findByIdAndDelete(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete comment.",
    });
  }
};

module.exports = { createComment,getProductComments,deleteMyComment,getAllCommentsForAdmin,moderateComment,deleteCommentForAdmin,};
