const mongoose = require("mongoose");
const slugify = require("slugify");

const categorySchema = new mongoose.Schema(

  { name: { type: String, required: true, trim: true, unique: true,},

    slug: { type: String, unique: true, lowercase: true, trim: true, },

     image: { type: String, default: "", },
    
   isActive: { type: Boolean, default: true,},

    isDeleted: { type: Boolean, default: false,},},

  { timestamps: true,});

  categorySchema.pre("save", function () { this.slug = slugify(this.name, {lower: true, strict: true,});});

module.exports = mongoose.model("Category", categorySchema);