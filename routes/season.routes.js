const express = require("express");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

const { createSeason,getAllSeasons,getSeasonById,updateSeason,deleteSeason,} = require("../controllers/season.controller");

router.post("/", protect, authorize("admin"), createSeason);

router.get("/", getAllSeasons);

router.get("/:id", getSeasonById);

router.put("/:id", protect, authorize("admin"), updateSeason);

router.delete("/:id", protect, authorize("admin"), deleteSeason);

module.exports = router;