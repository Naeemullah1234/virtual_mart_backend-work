const express = require("express");
const router = express.Router();

const {
  getVTOProductImage,
} = require("../controllers/vtoController");


router.get(
  "/products/:productId",
  getVTOProductImage
);

module.exports = router;