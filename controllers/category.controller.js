const Category = require("../models/category.model");
const slugify = require("slugify");
const mongoose = require("mongoose");

const createCategory = async (req, res) => {
  try {

    const { name } = req.body;

    if (!name) {
      return 
      res.status(400).json({ success: false, message: "Category name is required.",}); }

    const existing = await Category.findOne({ name });

    if (existing) {
      return 
      res.status(400).json({ success: false, message: "Category already exists.", });}

    const category = await Category.create({ name, slug: slugify(name, { lower: true }),});

    res.status(201).json({ success: true, message: "Category created successfully.",category,});

  } catch (error) {

    console.log(error);

    res.status(500).json({ success: false,message: "Server Error",});}};

   const getAllCategories = async (req, res) => {
   try {

   const categories = await Category.find({ isDeleted: false}).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: categories.length,categories,});

  } catch (error) {

    console.log(error);

    res.status(500).json({ success: false, message: "Server Error",});}};

   const getCategoryById = async (req, res) => {
    try {

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {

    return
     res.status(400).json({ success: false, message: "Invalid Category ID."});}

        const category = await Category.findById(req.params.id);

        if (!category) {

            return
             res.status(404).json({ success: false, message: "Category not found."});}

        res.status(200).json({ success: true, category });

    } catch (error) {

        console.log(error);

        res.status(500).json({ success: false, message: "Server Error" }); }};



     const updateCategory = async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {

    return 
    res.status(400).json({ success: false, message: "Invalid Category ID."});}

        const { name } = req.body;

        const category = await Category.findById(req.params.id);

        if (!category) {

            return
            res.status(404).json({ success: false, message: "Category not found." });}

        category.name = name || category.name;
        category.slug = slugify(category.name, { lower: true });

        await category.save();

        res.status(200).json({ success: true, message: "Category updated successfully.", category});

       } catch (error) {

        console.log(error);

     res.status(500).json({ success: false,message: "Server Error"});}};


    const deleteCategory = async (req, res) => {

    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {

    return
     res.status(400).json({success: false,message: "Invalid Category ID."});}

        const category = await Category.findById(req.params.id);

        if (!category) {

            return
         res.status(404).json({ success: false, message: "Category not found." });}

        category.isDeleted = true;

        await category.save();

        res.status(200).json({success: true,message: "Category deleted successfully."});

    } catch (error) {

        console.log(error);

        res.status(500).json({ success: false, message: "Server Error" });}};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};