const Category = require("../models/category.model");
const SubCategory = require("../models/subCategory.model");
const mongoose = require("mongoose");

const createSubCategory = async (req, res) => {
  try {
    const { name, category, image, displayOrder } = req.body;

   
    const categoryExists = await Category.findById(category);

    if (!categoryExists) {

      return res.status(404).json({ success: false,message: "Category not found.",});}

  
    const alreadyExists = await SubCategory.findOne({ name,category,isDeleted: false,});

    if (alreadyExists) {

      return res.status(400).json({ success: false,message: "Sub Category already exists in this category.",});}

    const subCategory = await SubCategory.create({ name,category,image,displayOrder,});

    res.status(201).json({ success: true, message: "Sub Category created successfully.",subCategory,});

  } catch (error) {
    console.log(error);

    res.status(500).json({ success: false,message: "Server Error",});}};

  const getAllSubCategories = async (req, res) => {
  try {

    const subCategories = await SubCategory.find({isDeleted: false,})

      .populate("category", "name").sort({ displayOrder: 1 });

    res.status(200).json({ success: true, count: subCategories.length,subCategories,});

  } catch (error) {
    console.log(error);

    res.status(500).json({ success: false,message: "Server Error",});}};


const getSubCategoryById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {

      return res.status(400).json({ success: false,message: "Invalid Sub Category ID.",});}

    const subCategory = await SubCategory.findById(req.params.id)
      .populate("category", "name");

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

    const { name, category, image, displayOrder, isActive } = req.body;

    const subCategory = await SubCategory.findById(req.params.id);

    if (!subCategory || subCategory.isDeleted) {

      return res.status(404).json({success: false,message: "Sub Category not found.",});}

    if (category) {
      const categoryExists = await Category.findById(category);

      if (!categoryExists) {

        return res.status(404).json({ success: false,message: "Category not found.",});}

      subCategory.category = category;
    }

    subCategory.name = name || subCategory.name;
    subCategory.image = image ?? subCategory.image;
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

    subCategory.isDeleted = true;

    await subCategory.save();

    res.status(200).json({ success: true,message: "Sub Category deleted successfully.",});

  } catch (error) {
    console.log(error);

    res.status(500).json({ success: false,message: "Server Error",});}};

module.exports = {
  createSubCategory,
  getAllSubCategories,
  getSubCategoryById,
  updateSubCategory,
  deleteSubCategory,
};