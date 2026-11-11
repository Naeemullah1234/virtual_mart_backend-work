const Category = require("../models/category.model");
const SubCategory = require("../models/subCategory.model");
const Product = require("../models/product.model");
const mongoose = require("mongoose");

   const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required.",
      });
    }

    const normalizedName = name.trim();

      const escapedName = normalizedName.replace(
  /[.*+?^${}()|[\]\\]/g,
  "\\$&"
);

const existing = await Category.findOne({
  name: { $regex: `^${escapedName}$`, $options: "i" },
  isDeleted: false,
});

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Category already exists.",
      });
    }

    const category = await Category.create({
      name: normalizedName,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully.",
      category,
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

   const getAllCategories = async (req, res) => {
   try {

   const categories = await Category.find({
  isActive: true,isDeleted: false,}).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: categories.length,categories,});

  } catch (error) {

    console.log(error);

    res.status(500).json({ success: false, message: "Server Error",});}};

   const getCategoryById = async (req, res) => {
    try {

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {

    return res.status(400).json({ success: false, message: "Invalid Category ID."});}

        const category = await Category.findOne({_id: req.params.id,isActive: true,isDeleted: false,});

        if (!category) {

            return res.status(404).json({ success: false, message: "Category not found."});}

        res.status(200).json({ success: true, category });

    } catch (error) {

        console.log(error);

        res.status(500).json({ success: false, message: "Server Error" }); }};



     const updateCategory = async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {

    return res.status(400).json({ success: false, message: "Invalid Category ID."});}

        const { name } = req.body;

        if (
  name !== undefined &&
  (typeof name !== "string" || !name.trim())
) {
  return res.status(400).json({
    success: false,
    message: "Category name must be a valid non-empty string.",
  });
}

        const category = await Category.findOne({
  _id: req.params.id,
  isDeleted: false,
});

        if (!category) {

            return res.status(404).json({ success: false, message: "Category not found." });}

            if (name !== undefined) {
  const normalizedName = name.trim();

  const existingCategory = await Category.findOne({
    name: {
      $regex: `^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      $options: "i",
    },
    _id: { $ne: category._id },
  });

  if (existingCategory) {
    return res.status(400).json({
      success: false,
      message: "Category name already exists.",
    });
  }

  category.name = normalizedName;
}

await category.save();

        res.status(200).json({ success: true, message: "Category updated successfully.", category});

       } catch (error) {

        console.log(error);

     res.status(500).json({ success: false,message: "Server Error"});}};


    const deleteCategory = async (req, res) => {

    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {

    return res.status(400).json({success: false,message: "Invalid Category ID."});}

        const category = await Category.findOne({
  _id: req.params.id,
  isDeleted: false,
});

        if (!category) {

            return res.status(404).json({ success: false, message: "Category not found." });}

            const existingSubCategories = await SubCategory.exists({
  category: category._id,
  isDeleted: false,
});

if (existingSubCategories) {
  return res.status(400).json({
    success: false,
    message: "Cannot delete Category because SubCategories are associated with it.",
  });
}

           const existingProducts = await Product.exists({
  category: category._id,
  isDeleted: false,
});

if (existingProducts) {
  return res.status(400).json({
    success: false,
    message: "Cannot delete Category because Products are associated with it.",
  });
}

        category.isDeleted = true;
        category.isActive = false;

        await category.save();

        res.status(200).json({success: true,message: "Category deleted successfully."});

    } catch (error) {

        console.log(error);

        res.status(500).json({ success: false, message: "Server Error" });}};

module.exports = {createCategory,getAllCategories,getCategoryById,updateCategory,deleteCategory,};