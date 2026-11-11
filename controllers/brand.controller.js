const Brand = require("../models/brand.model");
const Product = require("../models/product.model");
const mongoose = require("mongoose");


const createBrand = async (req, res) => {
  try {
    const { name, displayOrder } = req.body;

   if (typeof name !== "string" || !name.trim()) {
  return res.status(400).json({
    success: false,
    message: "Brand name is required.",
  });
}

const normalizedName = name.trim();

  const escapedName = normalizedName.replace(
  /[.*+?^${}()|[\]\\]/g,
  "\\$&"
);

const existing = await Brand.findOne({
  name: { $regex: `^${escapedName}$`, $options: "i" },
  isDeleted: false,
});

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Brand already exists.",
      });
    }

    const brand = await Brand.create({
  name: normalizedName,
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
  isActive: true,
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

    const brand = await Brand.findOne({
  _id: req.params.id,
  isActive: true,
  isDeleted: false,
});

    if (!brand) {
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

    const { name, displayOrder, isActive } = req.body;

    const brand = await Brand.findOne({
  _id: req.params.id,
  isDeleted: false,
});

    if (!brand || brand.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Brand not found.",
      });
    }


        if (
  name !== undefined &&
  (typeof name !== "string" || !name.trim())
) {
  return res.status(400).json({
    success: false,
    message: "Brand name cannot be empty.",
  });
}

    // Duplicate Name Check
       if (name !== undefined) {
  const normalizedName = name.trim();

  const escapedName = normalizedName.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const existingBrand = await Brand.findOne({
    name: { $regex: `^${escapedName}$`, $options: "i" },
    _id: { $ne: brand._id },
    isDeleted: false,
  });

  if (existingBrand) {
    return res.status(400).json({
      success: false,
      message: "Brand already exists.",
    });
  }

  brand.name = normalizedName;
}

    
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

    const brand = await Brand.findOne({
  _id: req.params.id,
  isDeleted: false,
});

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found.",
      });
    }

    const existingProducts = await Product.exists({
  brand: brand._id,
  isDeleted: false,
});

if (existingProducts) {
  return res.status(400).json({
    success: false,
    message: "Cannot delete Brand because Products are associated with it.",
  });
}

    brand.isDeleted = true;
     brand.isActive = false;

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

module.exports = {createBrand,getAllBrands,getBrandById,updateBrand,deleteBrand};