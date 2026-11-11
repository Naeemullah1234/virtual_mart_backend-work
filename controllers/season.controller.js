const Season = require("../models/season.model");
const Product = require("../models/product.model");
const mongoose = require("mongoose");

// Create Season
const createSeason = async (req, res) => {
  try {
    const { name, displayOrder } = req.body;

    if (typeof name !== "string" || !name.trim()) {
  return res.status(400).json({
    success: false,
    message: "Season name is required.",
  });
}

const normalizedName = name.trim();

const escapedName = normalizedName.replace(
  /[.*+?^${}()|[\]\\]/g,
  "\\$&"
);

const existing = await Season.findOne({
  name: { $regex: `^${escapedName}$`, $options: "i" },
  isDeleted: false,
});

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Season already exists.",
      });
    }

   const season = await Season.create({
  name: normalizedName,
  displayOrder,
});

    res.status(201).json({
      success: true,
      message: "Season created successfully.",
      season,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get All Seasons
const getAllSeasons = async (req, res) => {
  try {
    const seasons = await Season.find({
  isActive: true,
  isDeleted: false,
}).sort({
  displayOrder: 1,
});

    res.status(200).json({
      success: true,
      count: seasons.length,
      seasons,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get Season By ID
const getSeasonById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Season ID.",
      });
    }

  const season = await Season.findOne({
  _id: req.params.id,
  isActive: true,
  isDeleted: false,
});

    if (!season) {
      return res.status(404).json({
        success: false,
        message: "Season not found.",
      });
    }

    res.status(200).json({
      success: true,
      season,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Update Season
const updateSeason = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Season ID.",
      });
    }

    const { name, displayOrder, isActive } = req.body;

    const season = await Season.findOne({
  _id: req.params.id,
  isDeleted: false,
});

    if (!season) {
      return res.status(404).json({
        success: false,
        message: "Season not found.",
      });
    }

    if (
  name !== undefined &&
  (typeof name !== "string" || !name.trim())
) {
  return res.status(400).json({
    success: false,
    message: "Season name cannot be empty.",
  });
}

      if (name !== undefined) {
  const normalizedName = name.trim();

   const escapedName = normalizedName.replace(
  /[.*+?^${}()|[\]\\]/g,
  "\\$&"
);

  const existingSeason = await Season.findOne({
    name: { $regex: `^${escapedName}$`, $options: "i" },
    _id: { $ne: season._id },
    isDeleted: false,
  });

  if (existingSeason) {
    return res.status(400).json({
      success: false,
      message: "Season already exists.",
    });
  }

  season.name = normalizedName;
}

    if (displayOrder !== undefined) {
      season.displayOrder = displayOrder;
    }

    if (typeof isActive === "boolean") {
      season.isActive = isActive;
    }

    await season.save();

    res.status(200).json({
      success: true,
      message: "Season updated successfully.",
      season,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Soft Delete Season
const deleteSeason = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Season ID.",
      });
    }

    const season = await Season.findOne({
  _id: req.params.id,
  isDeleted: false,
});

    if (!season) {
      return res.status(404).json({
        success: false,
        message: "Season not found.",
      });
    }

     const existingProducts = await Product.exists({
  season: season._id,
  isDeleted: false,
});

if (existingProducts) {
  return res.status(400).json({
    success: false,
    message: "Cannot delete Season because Products are associated with it.",
  });
}

    season.isDeleted = true;
     season.isActive = false;

    await season.save();

    res.status(200).json({
      success: true,
      message: "Season deleted successfully.",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = { createSeason, getAllSeasons, getSeasonById, updateSeason, deleteSeason,};