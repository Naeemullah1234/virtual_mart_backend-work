const bcrypt = require("bcryptjs");
const Customer = require("../models/customer.model");
const {validateName,validateEmail,validatePhone,validatePassword,} = require("../validators/customer.validator");
const generateToken = require("../utils/generateToken");



const registerCustomer = async (req, res) => {
  try {
    const { firstName, lastName,email,phone,password,avatar,} = req.body;


if (
  !firstName || !lastName || !email || !phone || !password
) {

  return res.status(400).json({ success: false, message: "First name, last name, email, phone and password are required.",});}



const firstNameError = validateName(firstName, "First name");

if (firstNameError) {

  return res.status(400).json({success: false,message: firstNameError,});}

const lastNameError = validateName(lastName, "Last name");

if (lastNameError) {
  return res.status(400).json({success: false,message: lastNameError,});}


const emailError = validateEmail(email);

if (emailError) {
  return res.status(400).json({success: false,message: emailError, });}



const phoneError = validatePhone(phone);

if (phoneError) {
  return res.status(400).json({success: false,message: phoneError,});}



const passwordError = validatePassword(password);

if (passwordError) {
  return res.status(400).json({success: false,message: passwordError,});}


const normalizedEmail = email.trim().toLowerCase();


const existingEmail = await Customer.findOne({ email: normalizedEmail,});

if (existingEmail) {
  return res.status(409).json({ success: false, message: "Email is already registered.",});}



const existingPhone = await Customer.findOne({ phone: phone.trim(),});

if (existingPhone) {
  return res.status(409).json({ success: false,message: "Phone number is already registered.",});}


const salt = await bcrypt.genSalt(10);

const hashedPassword = await bcrypt.hash(password, salt);


const customer = await Customer.create({
  firstName: firstName.trim(),
  lastName: lastName.trim(),
  email: normalizedEmail,
  phone: phone.trim(),
  password: hashedPassword,
  avatar: avatar || "",
});

res.status(201).json({
  success: true,
  message: "Customer registered successfully.",
  customer: {
    id: customer._id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone,
    avatar: customer.avatar,
    isEmailVerified: customer.isEmailVerified,
    isPhoneVerified: customer.isPhoneVerified,
    isActive: customer.isActive,
  },
});



  } catch (error) {
    console.log(error);

    res.status(500).json({success: false,message: "Server Error",});}};


// --------------------------------
// Customer Login
// --------------------------------

const loginCustomer = async (req, res) => {
  try {
    
  const { email,phone,password,} = req.body;

    // --------------------------------
// Required Fields Validation
// --------------------------------

if ((!email && !phone) || !password) {
  return res.status(400).json({
    success: false,
    message: "Email or phone and password are required.",
  });
}
// --------------------------------
// Normalize Login Data
// --------------------------------

const normalizedEmail = email
  ? email.trim().toLowerCase()
  : null;

const normalizedPhone = phone
  ? phone.trim()
  : null;


// --------------------------------
// Find Customer
// --------------------------------
const customer = await Customer.findOne({
  $or: [
    ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
    ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
  ],
}).select("+password");

if (!customer) {
  return res.status(401).json({
    success: false,
    message: "Invalid credentials.",
  });
}

// --------------------------------
// Account Lock Check
// --------------------------------

if (customer.lockUntil && customer.lockUntil > Date.now()) {

  const remainingMinutes = Math.ceil(
    (customer.lockUntil - Date.now()) / (1000 * 60)
  );

  return res.status(423).json({
    success: false,
    message: `Account is locked. Try again in ${remainingMinutes} minute(s).`,
  });

}

// --------------------------------
// Verify Password
// --------------------------------

const isPasswordMatch = await bcrypt.compare(
  password,
  customer.password
);

if (!isPasswordMatch) {

  customer.loginAttempts += 1;

  // Lock account after 5 failed attempts
  if (customer.loginAttempts >= 5) {

    customer.lockUntil = Date.now() + (15 * 60 * 1000);

    customer.loginAttempts = 0;
  }

  await customer.save();

  return res.status(401).json({
    success: false,
    message: "Invalid credentials.",
  });
}

// --------------------------------
// Reset Login Attempts
// --------------------------------

customer.loginAttempts = 0;
customer.lockUntil = null;
customer.lastLogin = new Date();

await customer.save();


// --------------------------------
// Generate JWT Token
// --------------------------------

const token = generateToken(customer._id);


// --------------------------------
// Success Response
// --------------------------------

res.status(200).json({
  success: true,
  message: "Login successful.",

  token,

  customer: {
    id: customer._id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone,
    avatar: customer.avatar,
  },
});

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// --------------------------------
// Get Customer Profile
// --------------------------------

const getCustomerProfile = async (req, res) => {
  try {

    res.status(200).json({
      success: true,
      customer: req.user,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// --------------------------------
// Update Customer Profile
// --------------------------------

const updateCustomerProfile = async (req, res) => {
  try {

    const { firstName,lastName,avatar,} = req.body;

    // --------------------------------
// At Least One Field Required
// --------------------------------

if (
  firstName === undefined &&
  lastName === undefined &&
  avatar === undefined
) {
  return res.status(400).json({
    success: false,
    message: "At least one field is required to update.",
  });
}

// --------------------------------
// First Name Validation
// --------------------------------

if (firstName !== undefined) {

  const firstNameError = validateName(firstName, "First name");

  if (firstNameError) {
    return res.status(400).json({
      success: false,
      message: firstNameError,
    });
  }
   req.user.firstName = firstName.trim();
}


// --------------------------------
// Last Name Validation
// --------------------------------

if (lastName !== undefined) {

  const lastNameError = validateName(lastName, "Last name");

  if (lastNameError) {
    return res.status(400).json({
      success: false,
      message: lastNameError,
    });
  }
  req.user.lastName = lastName.trim();
}

if (avatar !== undefined) {
  req.user.avatar = avatar;
}

await req.user.save();

res.status(200).json({
  success: true,
  message: "Profile updated successfully.",
  customer: {
    id: req.user._id,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    email: req.user.email,
    phone: req.user.phone,
    avatar: req.user.avatar,
    isEmailVerified: req.user.isEmailVerified,
    isPhoneVerified: req.user.isPhoneVerified,
    isActive: req.user.isActive,
  },
});


// --------------------------------


  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// --------------------------------
// Change Customer Password
// --------------------------------

const changeCustomerPassword = async (req, res) => {
  try {

    const {
      currentPassword,
      newPassword,
    } = req.body;

    // --------------------------------
// Required Fields Validation
// --------------------------------

if (!currentPassword || !newPassword) {
  return res.status(400).json({
    success: false,
    message: "Current password and new password are required.",
  });
}

// --------------------------------
// New Password Validation
// --------------------------------

const passwordError = validatePassword(newPassword);

if (passwordError) {
  return res.status(400).json({
    success: false,
    message: passwordError,
  });
}

// --------------------------------
// Get Customer With Password
// --------------------------------

const customer = await Customer.findById(req.user._id).select("+password");

if (!customer) {
  return res.status(404).json({
    success: false,
    message: "Customer not found.",
  });
}

// --------------------------------
// Verify Current Password
// --------------------------------

const isPasswordCorrect = await bcrypt.compare(
  currentPassword,
  customer.password
);

if (!isPasswordCorrect) {
  return res.status(400).json({
    success: false,
    message: "Current password is incorrect.",
  });
}

// --------------------------------
// Prevent Same Password
// --------------------------------

const isSamePassword = await bcrypt.compare(
  newPassword,
  customer.password
);

if (isSamePassword) {
  return res.status(400).json({
    success: false,
    message: "New password must be different from current password.",
  });
}

// --------------------------------
// Hash New Password
// --------------------------------

const salt = await bcrypt.genSalt(10);

customer.password = await bcrypt.hash(newPassword, salt);

customer.loginAttempts = 0;
customer.lockUntil = null;

await customer.save();

res.status(200).json({
  success: true,
  message: "Password changed successfully.",
});

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// --------------------------------
// Logout Customer
// --------------------------------

const logoutCustomer = async (req, res) => {
  try {

    req.user.refreshToken = null;

    await req.user.save();

    res.status(200).json({
      success: true,
      message: "Logged out successfully.",
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
  registerCustomer,
  loginCustomer,
  getCustomerProfile,
  updateCustomerProfile,
  changeCustomerPassword,
   logoutCustomer,
};