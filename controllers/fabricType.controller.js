const FabricType = require("../models/fabricType.model");
const mongoose = require("mongoose");


const createFabricType = async (req, res) => {
  try {
    const { name, displayOrder } = req.body;

    if (!name) {

      return res.status(400).json({ success: false, message: "Fabric Type name is required.",});}

    const existing = await FabricType.findOne({ name,isDeleted: false,});

    if (existing) {

      return res.status(400).json({success: false, message: "Fabric Type already exists.", });}

    const fabricType = await FabricType.create({ name,displayOrder,});

    res.status(201).json({ success: true, message: "Fabric Type created successfully.",fabricType,});

  } catch (error) { console.log(error);

    res.status(500).json({ success: false,message: "Server Error",});}};


  const getAllFabricTypes = async (req, res) => {
  try {

    const fabricTypes = await FabricType.find({ isDeleted: false,}).sort({ displayOrder: 1,});

    res.status(200).json({ success: true,count: fabricTypes.length,fabricTypes,});

  } catch (error) { console.log(error);

    res.status(500).json({ success: false,message: "Server Error",});}};

   const getFabricTypeById = async (req, res) => {

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {

      return res.status(400).json({ success: false,message: "Invalid Fabric Type ID.",});}

    const fabricType = await FabricType.findById(req.params.id);

    if (!fabricType || fabricType.isDeleted) {

      return res.status(404).json({success: false, message: "Fabric Type not found.",});}

    res.status(200).json({ success: true,fabricType,});

  } catch (error) { console.log(error);

    res.status(500).json({ success: false,message: "Server Error",});}};

  const updateFabricType = async (req, res) => {
  try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {

      return res.status(400).json({ success: false,message: "Invalid Fabric Type ID.",});}

    const { name, displayOrder, isActive } = req.body;

    const fabricType = await FabricType.findById(req.params.id);

    if (!fabricType || fabricType.isDeleted) {

      return res.status(404).json({success: false,message: "Fabric Type not found.",});}

    fabricType.name = name || fabricType.name;
    fabricType.displayOrder = displayOrder ?? fabricType.displayOrder;

    if (typeof isActive === "boolean") {
      fabricType.isActive = isActive;
    }

    await fabricType.save();

    res.status(200).json({ success: true, message: "Fabric Type updated successfully.",fabricType,});

  } catch (error) { console.log(error);

    res.status(500).json({ success: false, message: "Server Error",});}};

  const deleteFabricType = async (req, res) => {
  try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {

      return res.status(400).json({ success: false, message: "Invalid Fabric Type ID.",});}

    const fabricType = await FabricType.findById(req.params.id);

    if (!fabricType || fabricType.isDeleted) {

      return res.status(404).json({success: false,message: "Fabric Type not found.",});}

    fabricType.isDeleted = true;

    await fabricType.save();

    res.status(200).json({ success: true,message: "Fabric Type deleted successfully.",});

  } catch (error) { console.log(error);

    res.status(500).json({ success: false,message: "Server Error",});}};

module.exports = {
  createFabricType,
  getAllFabricTypes,
  getFabricTypeById,
  updateFabricType,
  deleteFabricType
};