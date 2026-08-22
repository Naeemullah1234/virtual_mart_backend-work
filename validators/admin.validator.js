
const nameRegex = /^[A-Za-z\s'-]+$/;

const validateName = (name, fieldName = "Name") => {
  if (!name || !name.trim()) {
    return `${fieldName} is required.`;
  }

  if (!nameRegex.test(name.trim())) {
    return `${fieldName} contains invalid characters.`;
  }

  return null;
};



const emailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return "Email is required.";
  }

  if (!emailRegex.test(email.trim())) {
    return "Please enter a valid email address.";
  }

  return null;
};



const phoneRegex =
  /^\+?[0-9]{10,15}$/;

const validatePhone = (phone) => {
  if (!phone || !phone.trim()) {
    return "Phone is required.";
  }

  if (!phoneRegex.test(phone.trim())) {
    return "Please enter a valid phone number.";
  }

  return null;
};



const passwordRegex =
  /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/;

const validatePassword = (password) => {
  if (!password) {
    return "Password is required.";
  }

  if (!passwordRegex.test(password)) {
    return "Password must be at least 8 characters and contain a number and special character.";
  }

  return null;
};



const validateIsBlocked = (isBlocked) => {
  if (typeof isBlocked !== "boolean") {
    return "isBlocked must be true or false.";
  }

  return null;
};



module.exports = {
  nameRegex,
  emailRegex,
  phoneRegex,
  passwordRegex,
  validateName,
  validateEmail,
  validatePhone,
  validatePassword,
  validateIsBlocked,
};