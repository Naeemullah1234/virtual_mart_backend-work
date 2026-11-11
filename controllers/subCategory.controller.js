const Category = require("../models/category.model");
const SubCategory = require("../models/subCategory.model");
const Product = require("../models/product.model");
const mongoose = require("mongoose");

const createSubCategory = async (req, res) => {
  try {
    const { name, category, displayOrder } = req.body;

const normalizedName = name?.trim().toLowerCase();

if (!normalizedName) {
  return res.status(400).json({
    success: false,
    message: "Sub Category name is required.",
  });
}

const categoryExists = await Category.findOne({_id: category,isDeleted: false,isActive: true,});

if (!categoryExists) {
  return res.status(404).json({ success: false,message: "Category not found or inactive.",});}

  
    const alreadyExists = await SubCategory.findOne({ name: normalizedName,category,isDeleted: false,});

    if (alreadyExists) {

      return res.status(400).json({ success: false,message: "Sub Category already exists in this category.",});}

    const subCategory = await SubCategory.create({  name: normalizedName,category,displayOrder,});

    res.status(201).json({ success: true, message: "Sub Category created successfully.",subCategory,});

  } catch (error) {
    console.log(error);

    res.status(500).json({ success: false,message: "Server Error",});}};

  const getAllSubCategories = async (req, res) => {
  try {

    const subCategories = await SubCategory.find({isActive: true,isDeleted: false,})

      .populate("category", "name").sort({ displayOrder: 1 });

    res.status(200).json({ success: true, count: subCategories.length,subCategories,});

  } catch (error) {
    console.log(error);

    res.status(500).json({ success: false,message: "Server Error",});}};


const getSubCategoryById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {

      return res.status(400).json({ success: false,message: "Invalid Sub Category ID.",});}

    const subCategory = await SubCategory.findOne({
  _id: req.params.id,isActive: true,isDeleted: false,}).populate("category", "name");

    if (!subCategory || subCategory.isDeleted) {
      return res.status(404).json({ success: false,message: "Sub Category not found.",});}

    res.status(200).json({ success: true,subCategory,});

  } catch (error) {
    console.log(error);

    res.status(500).json({ success: false, message: "Server Error",}); }};

  const updateSubCategory = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {

      return res.status(400).json({success: false,message: "Invalid Sub Category ID.",});}

    const { name, category, displayOrder, isActive } = req.body;

    const subCategory = await SubCategory.findById(req.params.id);

    if (!subCategory || subCategory.isDeleted) {

      return res.status(404).json({success: false,message: "Sub Category not found.",});}


    if (category) {
  const categoryExists = await Category.findOne({_id: category,isDeleted: false,isActive: true,});

  if (!categoryExists) {
    return res.status(404).json({
      success: false,
      message: "Category not found or inactive.",
    });}

  subCategory.category = category;
}

    if (name !== undefined) {
  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: "Sub Category name must be a valid non-empty string.",
    });
  }

  const normalizedName = name.trim().toLowerCase();

const existingSubCategory = await SubCategory.findOne({
  name: normalizedName,
  category: subCategory.category,
  isDeleted: false,
  _id: { $ne: subCategory._id },
});

if (existingSubCategory) {
  return res.status(400).json({
    success: false,
    message: "Sub Category already exists in this category.",
  });
}

subCategory.name = normalizedName;
}
    subCategory.displayOrder = displayOrder ?? subCategory.displayOrder;

    if (typeof isActive === "boolean") {
      subCategory.isActive = isActive;
    }

    await subCategory.save();

    res.status(200).json({ success: true,message: "Sub Category updated successfully.",subCategory,});

  } catch (error) { console.log(error);

    res.status(500).json({ success: false,message: "Server Error",});}};

  const deleteSubCategory = async (req, res) => {
  try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {

      return res.status(400).json({success: false,message: "Invalid Sub Category ID.",});}

    const subCategory = await SubCategory.findById(req.params.id);

    if (!subCategory || subCategory.isDeleted) {

      return res.status(404).json({success: false,message: "Sub Category not found.",});}

      const existingProducts = await Product.exists({
  subCategory: subCategory._id,
  isDeleted: false,
});

if (existingProducts) {
  return res.status(400).json({
    success: false,
    message: "Cannot delete Sub Category because products are associated with it.",
  });
}

    subCategory.isDeleted = true;

    await subCategory.save();

    res.status(200).json({ success: true,message: "Sub Category deleted successfully.",});

  } catch (error) {
    console.log(error);

    res.status(500).json({ success: false,message: "Server Error",});}};

module.exports = {createSubCategory,getAllSubCategories,getSubCategoryById, updateSubCategory, deleteSubCategory,};