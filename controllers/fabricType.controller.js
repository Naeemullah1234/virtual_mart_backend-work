const FabricType = require("../models/fabricType.model");
const Product = require("../models/product.model");
const mongoose = require("mongoose");


const createFabricType = async (req, res) => {
  try {
    const { name, displayOrder } = req.body;

   if (typeof name !== "string" || !name.trim()) {
  return res.status(400).json({
    success: false,
    message: "Fabric Type name is required.",
  });
}

const normalizedName = name.trim();

const escapedName = normalizedName.replace(
  /[.*+?^${}()|[\]\\]/g,
  "\\$&"
);

const existing = await FabricType.findOne({
  name: { $regex: `^${escapedName}$`, $options: "i" },
  isDeleted: false,
});

    if (existing) {

      return res.status(400).json({success: false, message: "Fabric Type already exists.", });}

     const fabricType = await FabricType.create({
  name: normalizedName,
  displayOrder,
});

    res.status(201).json({ success: true, message: "Fabric Type created successfully.",fabricType,});

  } catch (error) { console.log(error);

    res.status(500).json({ success: false,message: "Server Error",});}};


  const getAllFabricTypes = async (req, res) => {
  try {

     const fabricTypes = await FabricType.find({
  isActive: true,
  isDeleted: false,
}).sort({
  displayOrder: 1,
});

    res.status(200).json({ success: true,count: fabricTypes.length,fabricTypes,});

  } catch (error) { console.log(error);

    res.status(500).json({ success: false,message: "Server Error",});}};

   const getFabricTypeById = async (req, res) => {

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {

      return res.status(400).json({ success: false,message: "Invalid Fabric Type ID.",});}

    const fabricType = await FabricType.findOne({
  _id: req.params.id,
  isActive: true,
  isDeleted: false,
});

    if (!fabricType) {

      return res.status(404).json({success: false, message: "Fabric Type not found.",});}

    res.status(200).json({ success: true,fabricType,});

  } catch (error) { console.log(error);

    res.status(500).json({ success: false,message: "Server Error",});}};

  const updateFabricType = async (req, res) => {
  try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {

      return res.status(400).json({ success: false,message: "Invalid Fabric Type ID.",});}

    const { name, displayOrder, isActive } = req.body;

    const fabricType = await FabricType.findOne({
  _id: req.params.id,
  isDeleted: false,
});

    if (!fabricType) {

      return res.status(404).json({success: false,message: "Fabric Type not found.",});}

      if (
  name !== undefined &&
  (typeof name !== "string" || !name.trim())
) {
  return res.status(400).json({
    success: false,
    message: "Fabric Type name cannot be empty.",
  });
}

  if (name !== undefined) {
  const normalizedName = name.trim();

 const escapedName = normalizedName.replace(
  /[.*+?^${}()|[\]\\]/g,
  "\\$&"
);

  const existingFabricType = await FabricType.findOne({
    name: { $regex: `^${escapedName}$`, $options: "i" },
    _id: { $ne: fabricType._id },
    isDeleted: false,
  });

  if (existingFabricType) {
    return res.status(400).json({
      success: false,
      message: "Fabric Type already exists.",
    });
  }

  fabricType.name = normalizedName;
}
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

    const fabricType = await FabricType.findOne({
  _id: req.params.id,
  isDeleted: false,
});

    if (!fabricType) {

      return res.status(404).json({success: false,message: "Fabric Type not found.",});}

        const existingProducts = await Product.exists({
  fabricType: fabricType._id,
  isDeleted: false,
});

if (existingProducts) {
  return res.status(400).json({
    success: false,
    message: "Cannot delete Fabric Type because Products are associated with it.",
  });
}

    fabricType.isDeleted = true;
     fabricType.isActive = false;

    await fabricType.save();

    res.status(200).json({ success: true,message: "Fabric Type deleted successfully.",});

  } catch (error) { console.log(error);

    res.status(500).json({ success: false,message: "Server Error",});}};

module.exports = {createFabricType,getAllFabricTypes,getFabricTypeById,updateFabricType,deleteFabricType};