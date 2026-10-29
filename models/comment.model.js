
const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    product: {type: mongoose.Schema.Types.ObjectId,ref: "Product",required: true,index: true,},

     customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null,},

     guestName: {type: String,trim: true,maxlength: 80, default: "Guest",},

    comment: {type: String, required: true, trim: true,minlength: 1,maxlength: 100,},
    
    isApproved: {type: Boolean,default: false,},
  },
  { timestamps: true }
);

commentSchema.index({ product: 1, isApproved: 1, createdAt: -1 });

module.exports = mongoose.model("Comment", commentSchema);
