const mongoose = require("mongoose");


const validateProductId = (productId) => {

  if (!productId) {
    return "Product ID is required.";
  }

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return "Invalid Product ID.";
  }

  return null;
};


const validateQuantity = (quantity) => {

  if (quantity === undefined || quantity === null) {
    return "Quantity is required.";
  }

  if (!Number.isInteger(quantity)) {
    return "Quantity must be a whole number.";
  }

    if (quantity > 20) {
  return "Maximum quantity allowed is 20.";
}

  if (quantity < 1) {
    return "Quantity must be at least 1.";
  }

  return null;
};


module.exports = {
  validateProductId,
  validateQuantity,
};