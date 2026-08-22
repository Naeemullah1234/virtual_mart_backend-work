

const validateSKU = (sku) => {

  if (sku === undefined || sku === null || !sku.trim()) {
    return "SKU is required.";
  }

  if (typeof sku !== "string") {
    return "SKU must be a string.";
  }

  const normalizedSKU = sku.trim().toUpperCase();

  if (normalizedSKU.length < 3) {
    return "SKU must be at least 3 characters.";
  }

  if (normalizedSKU.length > 50) {
    return "SKU cannot exceed 50 characters.";
  }

  return null;
};


const validatePrice = (price) => {

  if (price === undefined || price === null) {
    return "Price is required.";
  }

  if (typeof price !== "number" || Number.isNaN(price)) {
    return "Price must be a valid number.";
  }

  if (price <= 0) {
    return "Price must be greater than 0.";
  }

  return null;
};



const validateSalePrice = (price, salePrice) => {


  if (salePrice === undefined || salePrice === null) {
    return null;
  }

  if (typeof salePrice !== "number" || Number.isNaN(salePrice)) {
    return "Sale price must be a valid number.";
  }

  if (salePrice <= 0) {
    return "Sale price must be greater than 0.";
  }

  if (salePrice >= price) {
    return "Sale price must be less than price.";
  }

  return null;
};



const validateStock = (stock) => {

  if (stock === undefined || stock === null) {
    return "Stock is required.";
  }

  if (typeof stock !== "number" || Number.isNaN(stock)) {
    return "Stock must be a valid number.";
  }

  if (stock < 0) {
    return "Stock cannot be negative.";
  }

  return null;
};



const validateAttributes = (attributes) => {



  if (!Array.isArray(attributes) || attributes.length === 0) {
    return "At least one attribute is required.";
  }

  

  for (const attribute of attributes) {

    if (!attribute || typeof attribute !== "object") {
      return "Each attribute must be a valid object.";
    }

    if (
      typeof attribute.key !== "string" ||
      !attribute.key.trim()
    ) {
      return "Each attribute must contain a valid key.";
    }

    if (
      typeof attribute.value !== "string" ||
      !attribute.value.trim()
    ) {
      return "Each attribute must contain a valid value.";
    }

  }


  const keys = attributes.map((attribute) =>
    attribute.key.trim().toLowerCase()
  );

  const uniqueKeys = new Set(keys);

  if (uniqueKeys.size !== keys.length) {
    return "Duplicate attribute keys are not allowed.";
  }

  return null;
};

const normalizeAttributes = (attributes) => {

  return attributes.map((attribute) => ({
    key: attribute.key.trim().toLowerCase(),
    value: attribute.value.trim(),
  }));

};

const validateImages = (images) => {

  if (images === undefined || images === null) {
    return null;
  }


  if (!Array.isArray(images)) {
    return "Images must be an array.";
  }


  for (const image of images) {

    if (typeof image !== "string" || !image.trim()) {
      return "Each image must be a valid string.";
    }

  }

  return null;
};

const validateIsActive = (isActive) => {

  if (typeof isActive !== "boolean") {
    return "isActive must be a boolean.";
  }

  return null;
};

module.exports = {

  validateSKU,
  validatePrice,
  validateSalePrice,
  validateStock,
  validateAttributes,
  normalizeAttributes,
  validateImages,
  validateIsActive
};