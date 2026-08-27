const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Customer = require("../models/customer.model");
const {validateName,validateEmail,validatePhone,validatePassword,} = require("../validators/customer.validator");
const generateToken = require("../utils/generateToken");
const { savePendingRegistration,getPendingRegistration,deletePendingRegistration,} = require("../utils/customerRegistrationStore");
const { generateOTP,getOTPExpiry,} = require("../utils/otp");
const {sendOTPEmail} = require("../utils/sendEmail");


const registerCustomer = async (req, res) => {
  try {

    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      avatar,
    } = req.body;

    // --------------------------------
    // Required Fields
    // --------------------------------

    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "First name, last name, email, phone and password are required.",
      });
    }

    // --------------------------------
    // Validate First Name
    // --------------------------------

    const firstNameError = validateName(
      firstName,
      "First name"
    );

    if (firstNameError) {
      return res.status(400).json({
        success: false,
        message: firstNameError,
      });
    }

    // --------------------------------
    // Validate Last Name
    // --------------------------------

    const lastNameError = validateName(
      lastName,
      "Last name"
    );

    if (lastNameError) {
      return res.status(400).json({
        success: false,
        message: lastNameError,
      });
    }

    // --------------------------------
    // Validate Email
    // --------------------------------

    const emailError = validateEmail(email);

    if (emailError) {
      return res.status(400).json({
        success: false,
        message: emailError,
      });
    }

    // --------------------------------
    // Validate Phone
    // --------------------------------

    const phoneError = validatePhone(phone);

    if (phoneError) {
      return res.status(400).json({
        success: false,
        message: phoneError,
      });
    }

    // --------------------------------
    // Validate Password
    // --------------------------------

    const passwordError = validatePassword(password);

    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    // --------------------------------
    // Normalize Data
    // --------------------------------

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const normalizedPhone = phone.trim();

    // --------------------------------
    // Check Existing Customer
    // --------------------------------

    const existingEmail = await Customer.findOne({
      email: normalizedEmail,
    });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    const existingPhone = await Customer.findOne({
      phone: normalizedPhone,
    });

    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: "Phone number is already registered.",
      });
    }

    // --------------------------------
    // Hash Password
    // --------------------------------

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(
      password,
      salt
    );

    // --------------------------------
    // Generate OTP
    // --------------------------------

    const otp = generateOTP();

    const otpExpiresAt = getOTPExpiry();


    const otpResendAvailableAt = new Date( Date.now() + 60 * 1000);

    // --------------------------------
    // Save Registration Temporarily
    // --------------------------------

    savePendingRegistration(normalizedEmail, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password: hashedPassword,
      avatar: avatar || "",
      otp,
      otpExpiresAt,
      otpResendAvailableAt: new Date(
    Date.now() + 60 * 1000
  ),

  otpAttempts: 0,});
    // --------------------------------
    // Send OTP Email
    // --------------------------------

    try {

      await sendOTPEmail(
        normalizedEmail,
        otp
      );

    } catch (emailError) {

      console.log(
        "CUSTOMER OTP EMAIL ERROR:",
        emailError
      );

      // Remove temporary registration
  

      return res.status(500).json({
        success: false,
        message: "OTP email could not be sent.",
      });
    }

    // --------------------------------
    // Response
    // --------------------------------

    return res.status(200).json({
      success: true,
      message:
        "Registration started. OTP has been sent to your email.",
      email: normalizedEmail,
    });

  } catch (error) {

    console.log(
      "REGISTER CUSTOMER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const verifyCustomerRegistrationOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // --------------------------------
    // Required Fields
    // --------------------------------

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    // --------------------------------
    // Normalize Email
    // --------------------------------

    const normalizedEmail = email.trim().toLowerCase();

    // --------------------------------
    // Get Pending Registration
    // --------------------------------

    const pendingRegistration =
      getPendingRegistration(normalizedEmail);

    if (!pendingRegistration) {
      return res.status(404).json({
        success: false,
        message:
          "Registration session not found or expired. Please register again.",
      });
    }


    if (pendingRegistration.otpAttempts >= 5) {
  deletePendingRegistration(normalizedEmail);

  return res.status(429).json({
    success: false,
    message:
      "Too many incorrect OTP attempts. Please register again.",
  });
}

    // --------------------------------
    // Check OTP Expiry
    // --------------------------------

    if (
      !pendingRegistration.otpExpiresAt ||
      pendingRegistration.otpExpiresAt < new Date()
    ) {
      deletePendingRegistration(normalizedEmail);

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please register again.",
      });
    }

    // --------------------------------
    // Check OTP
    // --------------------------------

  if (
  String(pendingRegistration.otp) !==
  String(otp).trim()
) {

  pendingRegistration.otpAttempts += 1;

  savePendingRegistration(
    normalizedEmail,
    pendingRegistration
  );

  const remainingAttempts =
    5 - pendingRegistration.otpAttempts;

  return res.status(400).json({
    success: false,
    message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`,
  });
}

    // --------------------------------
    // Final Duplicate Check
    // --------------------------------

    const existingEmail = await Customer.findOne({
      email: normalizedEmail,
    });

    if (existingEmail) {
      deletePendingRegistration(normalizedEmail);

      return res.status(409).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    const existingPhone = await Customer.findOne({
      phone: pendingRegistration.phone,
    });

    if (existingPhone) {
      deletePendingRegistration(normalizedEmail);

      return res.status(409).json({
        success: false,
        message: "Phone number is already registered.",
      });
    }

    // --------------------------------
    // Create Customer
    // --------------------------------

    const customer = await Customer.create({
      firstName: pendingRegistration.firstName,
      lastName: pendingRegistration.lastName,
      email: pendingRegistration.email,
      phone: pendingRegistration.phone,
      password: pendingRegistration.password,
      avatar: pendingRegistration.avatar || "",

      role: "customer",

      isEmailVerified: true,
      isPhoneVerified: false,
      isVerified: true,

      isBlocked: false,
      isActive: true,

      otp: null,
      otpExpiresAt: null,
      otpPurpose: null,
      otpResendAvailableAt: null,

      refreshToken: "",
      tokenVersion: 0,

      loginAttempts: 0,
      lockUntil: null,
      isDeleted: false,
    });

    // --------------------------------
    // Delete Temporary Registration
    // --------------------------------

    deletePendingRegistration(normalizedEmail);

    // --------------------------------
    // Response
    // --------------------------------

    return res.status(201).json({
      success: true,
      message:
        "Email verified and customer registered successfully.",

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
    console.log(
      "VERIFY CUSTOMER OTP ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


 const resendCustomerRegistrationOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // --------------------------------
    // Email Required
    // --------------------------------

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    // --------------------------------
    // Get Pending Registration
    // --------------------------------

    const pendingRegistration =
      getPendingRegistration(normalizedEmail);

    if (!pendingRegistration) {
      return res.status(404).json({
        success: false,
        message:
          "Registration session not found or expired. Please register again.",
      });
    }

    // --------------------------------
    // Check Resend Timer
    // --------------------------------

    if (
      pendingRegistration.otpResendAvailableAt &&
      pendingRegistration.otpResendAvailableAt > new Date()
    ) {
      const remainingSeconds = Math.ceil(
        (
          pendingRegistration.otpResendAvailableAt -
          new Date()
        ) / 1000
      );

      return res.status(429).json({
        success: false,
        message: `Please wait ${remainingSeconds} second(s) before requesting another OTP.`,
      });
    }

    // --------------------------------
    // Generate New OTP
    // --------------------------------

    const otp = generateOTP();

    const otpExpiresAt = getOTPExpiry();

    const otpResendAvailableAt = new Date(
      Date.now() + 60 * 1000
    );

    // --------------------------------
    // Update Temporary Registration
    // --------------------------------

    pendingRegistration.otp = otp;
    pendingRegistration.otpExpiresAt = otpExpiresAt;
    pendingRegistration.otpResendAvailableAt =
      otpResendAvailableAt;

    savePendingRegistration(
      normalizedEmail,
      pendingRegistration
    );

    // --------------------------------
    // Send New OTP
    // --------------------------------

    try {

      await sendOTPEmail(
        normalizedEmail,
        otp
      );

    } catch (emailError) {

      console.log(
        "RESEND CUSTOMER OTP EMAIL ERROR:",
        emailError
      );

      // Remove temporary registration
      deletePendingRegistration(normalizedEmail);

      return res.status(500).json({
        success: false,
        message: "OTP email could not be sent.",
      });
    }

    // --------------------------------
    // Response
    // --------------------------------

    return res.status(200).json({
      success: true,
      message: "New OTP has been sent to your email.",
      email: normalizedEmail,
    });

  } catch (error) {

    console.log(
      "RESEND CUSTOMER OTP ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


const forgotCustomerPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // --------------------------------
    // Email Required
    // --------------------------------

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    // --------------------------------
    // Normalize Email
    // --------------------------------

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    // --------------------------------
    // Find Customer
    // --------------------------------

    const customer = await Customer.findOne({
      email: normalizedEmail,
      isDeleted: false,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    // --------------------------------
    // Check Account
    // --------------------------------

    if (!customer.isActive) {
      return res.status(403).json({
        success: false,
        message: "Customer account is inactive.",
      });
    }

    if (customer.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Customer account has been blocked.",
      });
    }

    // --------------------------------
    // Email Verification Required
    // --------------------------------

    if (!customer.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message:
          "Please verify your email before resetting your password.",
      });
    }

    // --------------------------------
    // Generate OTP
    // --------------------------------

    const otp = generateOTP();

    const otpExpiresAt = getOTPExpiry();

    // --------------------------------
    // Save OTP
    // --------------------------------

    customer.otp = otp;
    customer.otpExpiresAt = otpExpiresAt;
    customer.otpPurpose = "forgotPassword";
    customer.otpAttempts = 0;
    customer.otpResendAvailableAt = new Date(
      Date.now() + 60 * 1000
    );

    await customer.save();

    // --------------------------------
    // Send OTP Email
    // --------------------------------

    try {

      await sendOTPEmail(
        normalizedEmail,
        otp
      );

    } catch (emailError) {

      console.log(
        "FORGOT PASSWORD OTP EMAIL ERROR:",
        emailError
      );

      // Invalidate OTP if email fails

      customer.otp = null;
      customer.otpExpiresAt = null;
      customer.otpPurpose = null;
      customer.otpResendAvailableAt = null;

      await customer.save();

      return res.status(500).json({
        success: false,
        message: "OTP email could not be sent.",
      });
    }

    // --------------------------------
    // Response
    // --------------------------------

    return res.status(200).json({
      success: true,
      message:
        "Password reset OTP has been sent to your email.",
      email: normalizedEmail,
    });

  } catch (error) {

    console.log(
      "FORGOT CUSTOMER PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


const verifyForgotPasswordOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // --------------------------------
    // Required Fields
    // --------------------------------

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    // --------------------------------
    // Normalize Email
    // --------------------------------

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    // --------------------------------
    // Find Customer
    // --------------------------------

    const customer = await Customer.findOne({
      email: normalizedEmail,
      isDeleted: false,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    // --------------------------------
    // Account Checks
    // --------------------------------

    if (customer.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Customer account has been blocked.",
      });
    }

    if (!customer.isActive) {
      return res.status(403).json({
        success: false,
        message: "Customer account is inactive.",
      });
    }

    // --------------------------------
    // Check OTP Purpose
    // --------------------------------

    if (customer.otpPurpose !== "forgotPassword") {
      return res.status(400).json({
        success: false,
        message: "No password reset OTP is pending.",
      });
    }

    // --------------------------------
    // Check OTP Exists
    // --------------------------------

    if (!customer.otp || !customer.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: "OTP is invalid or expired.",
      });
    }

    // --------------------------------
    // Check OTP Expiry
    // --------------------------------

    if (customer.otpExpiresAt < new Date()) {

      customer.otp = null;
      customer.otpExpiresAt = null;
      customer.otpPurpose = null;
      customer.otpResendAvailableAt = null;

      await customer.save();

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

  // --------------------------------
// Check OTP Attempts
// --------------------------------

if (customer.otpAttempts >= 5) {

  customer.otp = null;
  customer.otpExpiresAt = null;
  customer.otpPurpose = null;
  customer.otpResendAvailableAt = null;
  customer.otpAttempts = 0;

  await customer.save();

  return res.status(429).json({
    success: false,
    message:
      "Too many incorrect OTP attempts. Please request a new OTP.",
  });
}

// --------------------------------
// Check OTP
// --------------------------------

if (
  String(customer.otp) !==
  String(otp).trim()
) {

  customer.otpAttempts += 1;

  // --------------------------------
  // 5th Wrong Attempt
  // --------------------------------

  if (customer.otpAttempts >= 5) {

    customer.otp = null;
    customer.otpExpiresAt = null;
    customer.otpPurpose = null;
    customer.otpResendAvailableAt = null;
    customer.otpAttempts = 0;

    await customer.save();

    return res.status(429).json({
      success: false,
      message:
        "Too many incorrect OTP attempts. Please request a new OTP.",
    });
  }

  await customer.save();

  const remainingAttempts =
    5 - customer.otpAttempts;

  return res.status(400).json({
    success: false,
    message:
      `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`,
  });
}

    

    // --------------------------------
    // OTP Verified
    // --------------------------------

    customer.otp = null;
    customer.otpExpiresAt = null;
    customer.otpResendAvailableAt = null;
    customer.otpAttempts = 0;

    customer.otpPurpose = "forgotPasswordVerified";

    await customer.save();

    // --------------------------------
    // Response
    // --------------------------------

    return res.status(200).json({
      success: true,
      message:
        "OTP verified successfully. You can now reset your password.",
    });

  } catch (error) {

    console.log(
      "VERIFY FORGOT PASSWORD OTP ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const resetCustomerPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // --------------------------------
    // Required Fields
    // --------------------------------

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required.",
      });
    }

    // --------------------------------
    // Normalize Email
    // --------------------------------

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    // --------------------------------
    // Validate New Password
    // --------------------------------

    const passwordError = validatePassword(newPassword);

    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    // --------------------------------
    // Find Customer
    // --------------------------------

    const customer = await Customer.findOne({
      email: normalizedEmail,
      isDeleted: false,
    }).select("+password");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    // --------------------------------
    // Account Checks
    // --------------------------------

    if (customer.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Customer account has been blocked.",
      });
    }

    if (!customer.isActive) {
      return res.status(403).json({
        success: false,
        message: "Customer account is inactive.",
      });
    }

    // --------------------------------
    // Check OTP Verification
    // --------------------------------

    if (
      customer.otpPurpose !==
      "forgotPasswordVerified"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Please verify the password reset OTP first.",
      });
    }

    // --------------------------------
    // Check Same Password
    // --------------------------------

    const isSamePassword = await bcrypt.compare(
      newPassword,
      customer.password
    );

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from your previous password.",
      });
    }

    // --------------------------------
    // Hash New Password
    // --------------------------------

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(
      newPassword,
      salt
    );

    // --------------------------------
    // Update Password
    // --------------------------------

    customer.password = hashedPassword;

    // --------------------------------
    // Clear Password Reset State
    // --------------------------------

    customer.otp = null;
    customer.otpExpiresAt = null;
    customer.otpPurpose = null;
    customer.otpResendAvailableAt = null;

    // --------------------------------
    // Reset Login Security
    // --------------------------------

    customer.loginAttempts = 0;
    customer.lockUntil = null;

    // --------------------------------
    // Invalidate Existing Sessions
    // --------------------------------

    customer.refreshToken = "";
    customer.tokenVersion += 1;

    await customer.save();

    // --------------------------------
    // Response
    // --------------------------------

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully. Please login with your new password.",
    });

  } catch (error) {

    console.log(
      "RESET CUSTOMER PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

 const resendForgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // --------------------------------
    // Email Required
    // --------------------------------

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    // --------------------------------
    // Normalize Email
    // --------------------------------

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    // --------------------------------
    // Find Customer
    // --------------------------------

    const customer = await Customer.findOne({
      email: normalizedEmail,
      isDeleted: false,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    // --------------------------------
    // Account Checks
    // --------------------------------

    if (customer.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Customer account has been blocked.",
      });
    }

    if (!customer.isActive) {
      return res.status(403).json({
        success: false,
        message: "Customer account is inactive.",
      });
    }

    // --------------------------------
    // Email Verification
    // --------------------------------

    if (!customer.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message:
          "Please verify your email before resetting your password.",
      });
    }

    // --------------------------------
    // Check Resend Cooldown
    // --------------------------------

    if (
      customer.otpResendAvailableAt &&
      customer.otpResendAvailableAt > new Date()
    ) {
      const remainingSeconds = Math.ceil(
        (
          customer.otpResendAvailableAt -
          new Date()
        ) / 1000
      );

      return res.status(429).json({
        success: false,
        message:
          `Please wait ${remainingSeconds} second(s) before requesting another OTP.`,
      });
    }

    // --------------------------------
    // Generate New OTP
    // --------------------------------

    const otp = generateOTP();

    const otpExpiresAt = getOTPExpiry();

    const otpResendAvailableAt = new Date(
      Date.now() + 60 * 1000
    );

    // --------------------------------
    // Save New OTP
    // --------------------------------

    customer.otp = otp;
    customer.otpExpiresAt = otpExpiresAt;
    customer.otpPurpose = "forgotPassword";
    customer.otpAttempts = 0;
    customer.otpResendAvailableAt =
      otpResendAvailableAt;

    await customer.save();

    // --------------------------------
    // Send Email
    // --------------------------------

    try {

      await sendOTPEmail(
        normalizedEmail,
        otp
      );

    } catch (emailError) {

      console.log(
        "RESEND FORGOT PASSWORD OTP EMAIL ERROR:",
        emailError
      );

      // Invalidate OTP if email failed

      customer.otp = null;
      customer.otpExpiresAt = null;
      customer.otpPurpose = null;
      customer.otpResendAvailableAt = null;

      await customer.save();

      return res.status(500).json({
        success: false,
        message: "OTP email could not be sent.",
      });
    }

    // --------------------------------
    // Response
    // --------------------------------

    return res.status(200).json({
      success: true,
      message:
        "New password reset OTP has been sent to your email.",
      email: normalizedEmail,
    });

  } catch (error) {

    console.log(
      "RESEND FORGOT PASSWORD OTP ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};



/////

const loginCustomer = async (req, res) => {
  try {
    
  const { email,phone,password,} = req.body;

if ((!email && !phone) || !password) {
  return res.status(400).json({ success: false, message: "Email or phone and password are required.", });}

const normalizedEmail = email
  ? email.trim().toLowerCase()
  : null;

const normalizedPhone = phone ? phone.trim() : null;


const customer = await Customer.findOne({
  $or: [
    ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
    ...(normalizedPhone ? [{ phone: normalizedPhone }] : []), ],}).select("+password");

if (!customer) {
  return res.status(401).json({  success: false,  message: "Invalid credentials.", });}


if (customer.lockUntil && customer.lockUntil > Date.now()) {

  const remainingMinutes = Math.ceil((customer.lockUntil - Date.now()) / (1000 * 60));

  return res.status(423).json({ success: false, message: `Account is locked. Try again in ${remainingMinutes} minute(s).`, });}



const isPasswordMatch = await bcrypt.compare( password, customer.password );

if (!isPasswordMatch) {

  customer.loginAttempts += 1;

  if (customer.loginAttempts >= 5) {

    customer.lockUntil = Date.now() + (15 * 60 * 1000);

    customer.loginAttempts = 0;
  }

  await customer.save();

  return res.status(401).json({ success: false, message: "Invalid credentials.",});}

customer.loginAttempts = 0;
customer.lockUntil = null;
customer.lastLogin = new Date();

const accessToken = jwt.sign(
  {
    id: customer._id,
    role: "customer",
    tokenVersion: customer.tokenVersion,
  },
  process.env.JWT_SECRET,
  {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  }
);

const refreshToken = jwt.sign(
  {
    id: customer._id,
    role: "customer",
    tokenVersion: customer.tokenVersion,
  },
  process.env.JWT_REFRESH_SECRET,
  {
    expiresIn:
      process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  }
);

customer.refreshToken = refreshToken;

await customer.save();

return res.status(200).json({
  success: true,
  message: "Login successful.",

  accessToken,
  refreshToken,

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

    res.status(500).json({ success: false, message: "Server Error",});}};




const refreshCustomerToken = async (req, res) => {
  try {

    const { refreshToken } = req.body;

    // --------------------------------
    // Refresh Token Required
    // --------------------------------

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required.",
      });
    }

    // --------------------------------
    // Verify Refresh Token
    // --------------------------------

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    // --------------------------------
    // Check Customer
    // --------------------------------

    if (!decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token.",
      });
    }

    // --------------------------------
    // Find Customer
    // --------------------------------

    const customer = await Customer.findOne({
      _id: decoded.id,
      refreshToken: refreshToken,
      isEmailVerified: true,
      isBlocked: false,
      isActive: true,
      isDeleted: false,
    });

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token.",
      });
    }

    // --------------------------------
    // Token Version Check
    // --------------------------------

    if (
      decoded.tokenVersion !==
      customer.tokenVersion
    ) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
        code: "SESSION_EXPIRED",
      });
    }

    // --------------------------------
    // Generate New Access Token
    // --------------------------------

    const accessToken = jwt.sign(
      {
        id: customer._id,
        role: "customer",
        tokenVersion: customer.tokenVersion,
      },
      process.env.JWT_SECRET,
      {
        expiresIn:
          process.env.JWT_EXPIRES_IN || "15m",
      }
    );

    // --------------------------------
    // Response
    // --------------------------------

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully.",
      accessToken,
    });

  } catch (error) {

    console.log(
      "CUSTOMER REFRESH TOKEN ERROR:",
      error
    );

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Refresh token expired. Please login again.",
        code: "REFRESH_TOKEN_EXPIRED",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token.",
        code: "INVALID_REFRESH_TOKEN",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Refresh token authentication failed.",
    });
  }
};




    ////

const getCustomerProfile = async (req, res) => {
  try {

    res.status(200).json({ success: true, customer: req.user,});

  } catch (error) {

    res.status(500).json({ success: false, message: "Server Error", });}};



const updateCustomerProfile = async (req, res) => {
  try {

    const { firstName,lastName,avatar,} = req.body;


if (
  firstName === undefined &&
  lastName === undefined &&
  avatar === undefined
) {
  return res.status(400).json({ success: false, message: "At least one field is required to update.", });}


if (firstName !== undefined) {

  const firstNameError = validateName(firstName, "First name");

  if (firstNameError) {
    return res.status(400).json({ success: false, message: firstNameError,});} req.user.firstName = firstName.trim();}


if (lastName !== undefined) {

  const lastNameError = validateName(lastName, "Last name");

  if (lastNameError) {
    return res.status(400).json({ success: false, message: lastNameError, });}

  req.user.lastName = lastName.trim();}

if (avatar !== undefined) {
  req.user.avatar = avatar;
}

await req.user.save();

res.status(200).json({ success: true, message: "Profile updated successfully.",
  customer: { id: req.user._id, firstName: req.user.firstName, lastName: req.user.lastName, email: req.user.email,
    phone: req.user.phone, avatar: req.user.avatar, isEmailVerified: req.user.isEmailVerified,isPhoneVerified: req.user.isPhoneVerified,isActive: req.user.isActive, },});


  } catch (error) {

    res.status(500).json({ success: false, message: "Server Error", }); }};


const changeCustomerPassword = async (req, res) => {
  try {

    const { currentPassword,  newPassword, } = req.body;



if (!currentPassword || !newPassword) {
  return res.status(400).json({ success: false,  message: "Current password and new password are required.", });}


const passwordError = validatePassword(newPassword);

if (passwordError) {
  return res.status(400).json({ success: false, message: passwordError, });}


const customer = await Customer.findById(req.user._id).select("+password");

if (!customer) {
  return res.status(404).json({ success: false,message: "Customer not found.",});}

const isPasswordCorrect = await bcrypt.compare( currentPassword, customer.password);

if (!isPasswordCorrect) {
  return res.status(400).json({ success: false, message: "Current password is incorrect.", });}


const isSamePassword = await bcrypt.compare( newPassword, customer.password);

if (isSamePassword) {
  return res.status(400).json({ success: false, message: "New password must be different from current password.",});}


const salt = await bcrypt.genSalt(10);

customer.password = await bcrypt.hash(newPassword, salt);

customer.loginAttempts = 0;
customer.lockUntil = null;

await customer.save();

res.status(200).json({ success: true, message: "Password changed successfully.",});

  } catch (error) {

    res.status(500).json({ success: false,  message: "Server Error", }); }};


const logoutCustomer = async (req, res) => {
  try {

    // --------------------------------
    // Remove Refresh Token
    // --------------------------------

    req.user.refreshToken = null;

    // --------------------------------
    // Revoke Current Access Tokens
    // --------------------------------

    req.user.tokenVersion += 1;

    await req.user.save();

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });

  } catch (error) {

    console.log(
      "CUSTOMER LOGOUT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};



module.exports = {
  registerCustomer,
  verifyCustomerRegistrationOTP,
  resendCustomerRegistrationOTP,
  forgotCustomerPassword,
  verifyForgotPasswordOTP,
   resetCustomerPassword,
   resendForgotPasswordOTP,
   loginCustomer,
  refreshCustomerToken,
  logoutCustomer,


  getCustomerProfile,
  updateCustomerProfile,
  changeCustomerPassword,
   
};