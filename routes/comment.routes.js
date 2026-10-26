const express = require("express");
const router = express.Router();
const {protect,authorize,} = require("../middleware/auth.middleware");

const {createComment,getProductComments,deleteMyComment,
  getAllCommentsForAdmin,moderateComment,deleteCommentForAdmin,} = require("../controllers/comment.controller");


router.post("/", createComment);

router.get("/product/:productId", getProductComments);

router.delete("/:commentId", protect, deleteMyComment);

router.get("/admin/all",protect,authorize("admin"),getAllCommentsForAdmin);

router.patch("/admin/:commentId/moderate",protect,authorize("admin"),moderateComment);

router.delete("/admin/:commentId",protect,authorize("admin"),deleteCommentForAdmin);

module.exports = router;
