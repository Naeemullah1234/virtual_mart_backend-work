const ProductType = require("../models/productType.model");
const mongoose = require("mongoose");


const createProductType = async (req, res) => {
  try {
    const { name, displayOrder } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Product Type name is required.",
      });
    }

    const existing = await ProductType.findOne({
      name,
      isDeleted: false,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Product Type already exists.",
      });
    }

    const productType = await ProductType.create({
      name,
      displayOrder,
    });

    res.status(201).json({
      success: true,
      message: "Product Type created successfully.",
      productType,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


const getAllProductTypes = async (req, res) => {
  try {
    const productTypes = await ProductType.find({
      isDeleted: false,
      isActive: true,
    }).sort({
      displayOrder: 1,
    });

    res.status(200).json({
      success: true,
      count: productTypes.length,
      productTypes,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


const getProductTypeById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product Type ID.",
      });
    }

    const productType = await ProductType.findById(req.params.id);

    if (!productType || productType.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Product Type not found.",
      });
    }

    res.status(200).json({
      success: true,
      productType,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


const updateProductType = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product Type ID.",
      });
    }

    const { name, displayOrder, isActive } = req.body;

    const productType = await ProductType.findById(req.params.id);

    if (!productType || productType.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Product Type not found.",
      });
    }

    if (name && name !== productType.name) {
      const existing = await ProductType.findOne({
        name,
        isDeleted: false,
        _id: { $ne: req.params.id },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Product Type already exists.",
        });
      }

      productType.name = name;
    }

    if (displayOrder !== undefined) {
      productType.displayOrder = displayOrder;
    }

    if (typeof isActive === "boolean") {
      productType.isActive = isActive;
    }

    await productType.save();

    res.status(200).json({
      success: true,
      message: "Product Type updated successfully.",
      productType,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


const deleteProductType = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product Type ID.",
      });
    }

    const productType = await ProductType.findById(req.params.id);

    if (!productType || productType.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Product Type not found.",
      });
    }

    productType.isDeleted = true;

    await productType.save();

    res.status(200).json({
      success: true,
      message: "Product Type deleted successfully.",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  createProductType,
  getAllProductTypes,
  getProductTypeById,
  updateProductType,
  deleteProductType,
  
};