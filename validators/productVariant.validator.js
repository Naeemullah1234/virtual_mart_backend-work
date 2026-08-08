// --------------------------------
// SKU Validation
// --------------------------------

const validateSKU = (sku) => {

  if (!sku || sku.trim() === "") {
    return "SKU is required.";
  }

  if (sku.trim().length < 3) {
    return "SKU must be at least 3 characters.";
  }

  return null;
};

// --------------------------------
// Price Validation
// --------------------------------

const validatePrice = (price) => {

  if (price === undefined || price === null) {
    return "Price is required.";
  }

  if (isNaN(price) || Number(price) < 0) {
    return "Price must be a valid positive number.";
  }

  return null;
};

// --------------------------------
// Sale Price Validation
// --------------------------------

const validateSalePrice = (price, salePrice) => {

  if (salePrice === undefined || salePrice === null || salePrice === "") {
    return null;
  }

  if (isNaN(salePrice) || Number(salePrice) < 0) {
    return "Sale price must be a valid positive number.";
  }

  if (Number(salePrice) > Number(price)) {
    return "Sale price cannot be greater than price.";
  }

  return null;
};

// --------------------------------
// Stock Validation
// --------------------------------

const validateStock = (stock) => {

  if (stock === undefined || stock === null) {
    return "Stock is required.";
  }

  if (isNaN(stock) || Number(stock) < 0) {
    return "Stock must be a valid positive number.";
  }

  return null;
};

// --------------------------------
// Attributes Validation
// --------------------------------

const validateAttributes = (attributes) => {

  if (!Array.isArray(attributes) || attributes.length === 0) {
    return "At least one attribute is required.";
  }

  for (const attribute of attributes) {

    if (!attribute.key || !attribute.value) {
      return "Each attribute must contain key and value.";
    }

  }

  return null;
};

module.exports = {
  validateSKU,
  validatePrice,
  validateSalePrice,
  validateStock,
  validateAttributes,
};