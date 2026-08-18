const Brand = require("../models/brand.model");
const mongoose = require("mongoose");


const createBrand = async (req, res) => {
  try {
    const { name, displayOrder } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Brand name is required.",
      });
    }

    const existing = await Brand.findOne({
      name,
      isDeleted: false,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Brand already exists.",
      });
    }

    const brand = await Brand.create({
      name,
      displayOrder,
    });

    res.status(201).json({
      success: true,
      message: "Brand created successfully.",
      brand,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });

  }
};

// Get All Brands
const getAllBrands = async (req, res) => {
  try {

    const brands = await Brand.find({
      isDeleted: false,
    }).sort({
      displayOrder: 1,
    });

    res.status(200).json({
      success: true,
      count: brands.length,
      brands,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });

  }
};
const getBrandById = async (req, res) => {
  try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Brand ID.",
      });
    }

    const brand = await Brand.findById(req.params.id);

    if (!brand || brand.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Brand not found.",
      });
    }

    res.status(200).json({
      success: true,
      brand,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });

  }
};
const updateBrand = async (req, res) => {
  try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Brand ID.",
      });
    }

    const { name, displayOrder, logo, isActive } = req.body;

    const brand = await Brand.findById(req.params.id);

    if (!brand || brand.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Brand not found.",
      });
    }

    // Duplicate Name Check
    if (name && name !== brand.name) {
      const existing = await Brand.findOne({
        name,
        isDeleted: false,
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Brand already exists.",
        });
      }

      brand.name = name;
    }

    brand.logo = logo ?? brand.logo;
    brand.displayOrder = displayOrder ?? brand.displayOrder;

    if (typeof isActive === "boolean") {
      brand.isActive = isActive;
    }

    await brand.save();

    res.status(200).json({
      success: true,
      message: "Brand updated successfully.",
      brand,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });

  }
};
const deleteBrand = async (req, res) => {
  try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Brand ID.",
      });
    }

    const brand = await Brand.findById(req.params.id);

    if (!brand || brand.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Brand not found.",
      });
    }

    brand.isDeleted = true;

    await brand.save();

    res.status(200).json({
      success: true,
      message: "Brand deleted successfully.",
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
  createBrand,
  getAllBrands,
  getBrandById,
  updateBrand,
  deleteBrand
};