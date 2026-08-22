const { validateEmail } = require("./customer.validator");

const nameRegex = /^[A-Za-zÀ-ÿ\s.'-]{2,50}$/;

const phoneRegex = /^\+[1-9]\d{7,14}$/;

const postalCodeRegex = /^[A-Za-z0-9\s-]{3,12}$/;




const validateFullName = (fullName) => {

  if (!fullName || !fullName.trim()) {
    return "Full name is required.";
  }

  if (!nameRegex.test(fullName.trim())) {
    return "Full name must be between 2 and 50 characters and contain only letters.";
  }

  return null;
};




const validatePhone = (phone) => {

  if (!phone || !phone.trim()) {
    return "Phone number is required.";
  }

  if (!phoneRegex.test(phone.trim())) {
    return "Phone number must be in international format (e.g. +923001234567).";
  }

  return null;
};



const validateOptionalEmail = (email) => {
  if (!email) return null;

  return validateEmail(email);
};

const validateLabel = (label) => {

  const allowedLabels = [ "Home","Office","Warehouse","Other",];

  if (!allowedLabels.includes(label)) {
    return "Invalid address label.";
  }

  return null;
};



const validateRequiredText = (value, fieldName) => {

  if (!value || !value.trim()) {
    return `${fieldName} is required.`;
  }

  return null;
};



const validatePostalCode = (postalCode) => {

  if (!postalCode || !postalCode.trim()) {
    return "Postal code is required.";
  }

  if (!postalCodeRegex.test(postalCode.trim())) {
    return "Invalid postal code.";
  }

  return null;
};



module.exports = {
  validateFullName,
  validatePhone,
  validateRequiredText,
  validatePostalCode,
  validateOptionalEmail,
  validateLabel
};