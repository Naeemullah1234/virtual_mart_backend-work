const nameRegex = /^[A-Za-z\s'-]{2,25}$/;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const phoneRegex = /^\+[1-9]\d{7,14}$/;

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_\-+=])[A-Za-z\d@$!%*?&^#()_\-+=]{8,64}$/;


  // --------------------------------
// Validate Name
// --------------------------------

const validateName = (name, fieldName) => {

  if (!name || name.trim() === "") {
    return `${fieldName} is required.`;
  }

  const trimmedName = name.trim();

  if (!nameRegex.test(trimmedName)) {
    return `${fieldName} is invalid.`;
  }

  return null;

};

// --------------------------------
// Validate Email
// --------------------------------

const validateEmail = (email) => {

  if (!email || email.trim() === "") {
    return "Email is required.";
  }

  const trimmedEmail = email.trim().toLowerCase();

  if (!emailRegex.test(trimmedEmail)) {
    return "Please enter a valid email address.";
  }

  return null;

};

// --------------------------------
// Validate Phone
// --------------------------------

const validatePhone = (phone) => {
  if (!phone || phone.trim() === "") {
    return "Phone number is required.";
  }

  const trimmedPhone = phone.trim();

  if (!phoneRegex.test(trimmedPhone)) {
    return "Please enter a valid international phone number.";
  }

  return null;
};

// --------------------------------
// Validate Password
// --------------------------------             

const validatePassword = (password) => {
  if (!password) {
    return "Password is required.";
  }

  if (!passwordRegex.test(password)) {
    return "Password must be 8-64 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.";
  }

  return null;
};

module.exports = {
  validateName,
  validateEmail,
  validatePhone,
  validatePassword,
};