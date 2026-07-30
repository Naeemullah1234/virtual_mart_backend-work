const Season = require("../models/season.model");
const mongoose = require("mongoose");

// Create Season
const createSeason = async (req, res) => {
  try {
    const { name, displayOrder } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Season name is required.",
      });
    }

    const existing = await Season.findOne({
      name,
      isDeleted: false,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Season already exists.",
      });
    }

    const season = await Season.create({
      name,
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

    const season = await Season.findById(req.params.id);

    if (!season || season.isDeleted) {
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

    const season = await Season.findById(req.params.id);

    if (!season || season.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Season not found.",
      });
    }

    if (name && name !== season.name) {
      const existing = await Season.findOne({
        name,
        isDeleted: false,
        _id: { $ne: req.params.id },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Season already exists.",
        });
      }

      season.name = name;
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

    const season = await Season.findById(req.params.id);

    if (!season || season.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Season not found.",
      });
    }

    season.isDeleted = true;

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

module.exports = {
  createSeason,
  getAllSeasons,
  getSeasonById,
  updateSeason,
  deleteSeason,
};