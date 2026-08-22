const Admin = require("../models/admin.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validateName,validateEmail,validatePhone,validatePassword,} = require("../validators/admin.validator");
const {generateOTP,getOTPExpiry,} = require("../utils/otp");
const {sendOTPEmail,} = require("../utils/sendEmail");




const createAdmin = async (req, res) => {
  try {

    const {firstName,lastName,email,phone,password,avatar,} = req.body;


    if (
      !firstName ||!lastName ||!email ||!phone||!password ) {

      return res.status(400).json({success: false, message: "Please fill all required fields.",});}


    const firstNameError = validateName( firstName,"First name");

    if (firstNameError) {
      return res.status(400).json({success: false,message: firstNameError,});}


    const lastNameError = validateName( lastName,"Last name");

    if (lastNameError) {
      return res.status(400).json({success: false,message: lastNameError,});}


    const emailError = validateEmail(email);

    if (emailError) {
      return res.status(400).json({success: false,message: emailError,});}


    const phoneError = validatePhone(phone);

    if (phoneError) {
      return res.status(400).json({ success: false, message: phoneError,});}

    const passwordError = validatePassword(password);

    if (passwordError) {
      return res.status(400).json({ success: false,message: passwordError,});}


    const normalizedEmail = email.trim().toLowerCase();

    const normalizedPhone = phone.trim();


    const existingEmail = await Admin.findOne({ email: normalizedEmail,});

    if (existingEmail) {
      return res.status(400).json({success: false, message: "Email already exists.", });}


    const existingPhone = await Admin.findOne({ phone: normalizedPhone,});

    if (existingPhone) {
      return res.status(400).json({ success: false,message: "Phone number already exists.",});}


    const hashedPassword = await bcrypt.hash(password, 10);


    const otp = generateOTP();

    const otpExpiresAt = getOTPExpiry();


    const admin = await Admin.create({ firstName: firstName.trim(), lastName: lastName.trim(), email: normalizedEmail,

      phone: normalizedPhone, password: hashedPassword, avatar: avatar || "", role: "admin", isVerified: false, otp, otpExpiresAt,  otpPurpose: "verification", });


    try {

      await sendOTPEmail( normalizedEmail, otp );

    } catch (emailError) {

      console.log( "OTP EMAIL ERROR:",emailError);

       await Admin.findByIdAndDelete(admin._id);

      return res.status(500).json({ success: false,message:"Admin could not be created because OTP email could not be sent.",});}


    return res.status(201).json({ success: true, message:"Admin created successfully. OTP has been sent to your email.", adminId: admin._id, email: admin.email,});

  } catch (error) {

    console.log(error);


    if (error.code === 11000) {

      return res.status(400).json({success: false,message:  "Admin email or phone already exists.",}); }

      return res.status(500).json({success: false,message: "Server Error",}); }};



const verifyAdminOTP = async (req, res) => {
  try {

    const { email, otp } = req.body;

  

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required.",});}

    

    const admin = await Admin.findOne({ email: email.trim().toLowerCase(),});

    if (!admin) {
      return res.status(404).json({ success: false,message: "Admin not found.",});}


    if (admin.isVerified) {
      return res.status(400).json({ success: false, message: "Admin email is already verified.",});}


    if (admin.otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: "Invalid OTP.",});}

    if (
      !admin.otpExpiresAt ||
      admin.otpExpiresAt < new Date()
    ) {
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new OTP.",});}


    admin.isVerified = true;

    admin.otp = null;

    admin.otpExpiresAt = null;

    await admin.save();


    return res.status(200).json({ success: true, message: "Admin email verified successfully.",});

  } catch (error) {

    console.log(error);

    return res.status(500).json({ success: false,message: "Server Error",});}};

const resendAdminOTP = async (req, res) => {
  try {

    const { email } = req.body;


    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required.",});}

    const normalizedEmail = email.trim().toLowerCase();

    const admin = await Admin.findOne({ email: normalizedEmail,});

    if (!admin) {
      return res.status(404).json({ success: false,message: "Admin not found.",});}


    if (admin.isVerified) {
      return res.status(400).json({ success: false,message: "Admin email is already verified.",});}

   

    const otp = Math.floor( 100000 + Math.random() * 900000).toString();

    const otpExpiresAt = new Date( Date.now() + 10 * 60 * 1000);

    admin.otp = otp;
    admin.otpExpiresAt = otpExpiresAt;

    await admin.save();


    try {

      await sendOTPEmail( admin.email, otp);

    } catch (emailError) {

      console.log("RESEND OTP EMAIL ERROR:", emailError);

      return res.status(500).json({ success: false,message: "OTP could not be sent. Please try again.",});}


    return res.status(200).json({ success: true,message: "New OTP has been sent to your email.",});

  } catch (error) {

    console.log(error);

    return res.status(500).json({ success: false, message: "Server Error",});}};


   const loginAdmin = async (req, res) => {
  try {

    const { email, password } = req.body;

    // --------------------------------
    // Required Fields
    // --------------------------------

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // --------------------------------
    // Normalize Email
    // --------------------------------

    const normalizedEmail = email.trim().toLowerCase();

    // --------------------------------
    // Find Admin
    // --------------------------------

    const admin = await Admin.findOne({
      email: normalizedEmail,
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // --------------------------------
    // Email Verification
    // --------------------------------

    if (!admin.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
      });
    }

    // --------------------------------
    // Block Check
    // --------------------------------

    if (admin.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your admin account has been blocked.",
      });
    }

    // --------------------------------
    // Password Check
    // --------------------------------

    const passwordMatch = await bcrypt.compare(
      password,
      admin.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // --------------------------------
    // Access Token
    // --------------------------------

    const accessToken = jwt.sign(
      {
        id: admin._id,
        role: "admin",
        tokenVersion: admin.tokenVersion,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m",
      }
    );

    // --------------------------------
    // Refresh Token
    // --------------------------------

    const refreshToken = jwt.sign(
      {
        id: admin._id,
        role: "admin",
      },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: "7d",
      }
    );

    
console.log(
  "REFRESH SECRET EXISTS:",
  !!process.env.JWT_REFRESH_SECRET
);

console.log(
  "REFRESH SECRET:",
  process.env.JWT_REFRESH_SECRET
);
    // --------------------------------
    // Save Refresh Token
    // --------------------------------

    admin.refreshToken = refreshToken;

    admin.lastLogin = new Date();

    await admin.save();

    // --------------------------------
    // Response
    // --------------------------------

    return res.status(200).json({
      success: true,
      message: "Admin login successful.",

      accessToken,

      refreshToken,

      admin: {
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        phone: admin.phone,
        avatar: admin.avatar,
        role: admin.role,
        isVerified: admin.isVerified,
        lastLogin: admin.lastLogin,
      },
    });

  } catch (error) {

    console.log("ADMIN LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error.",
    });
  }
};


    const getAdminProfile = async (req, res) => {
  try {

    return res.status(200).json({
      success: true,
      admin: req.admin,
    });

  } catch (error) {

    console.log("GET ADMIN PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });

  }
};

const logoutAdmin = async (req, res) => {
  try {

    // Admin protect middleware se aayega
    const adminId = req.user._id;

    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found.",
      });
    }

    // --------------------------------
    // Invalidate Refresh Token
    // --------------------------------

    admin.refreshToken = "";

    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Admin logged out successfully.",
    });

  } catch (error) {

    console.log("ADMIN LOGOUT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error.",
    });
  }
};

const refreshAdminToken = async (req, res) => {
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
    // Find Admin
    // --------------------------------

    const admin = await Admin.findOne({
      _id: decoded.id,
      refreshToken: refreshToken,
      isVerified: true,
      isBlocked: false,
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token.",
      });
    }

    // --------------------------------
    // Generate New Access Token
    // --------------------------------

    const accessToken = jwt.sign(
      {
        id: admin._id,
        role: "admin",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m",
      }
    );

    // --------------------------------
    // Generate NEW Refresh Token
    // --------------------------------

    const newRefreshToken = jwt.sign(
      {
        id: admin._id,
        role: "admin",
         tokenVersion: admin.tokenVersion,
      },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // --------------------------------
    // Replace Old Refresh Token
    // --------------------------------

    admin.refreshToken = newRefreshToken;

    await admin.save();

    // --------------------------------
    // Response
    // --------------------------------

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully.",

      accessToken,

      refreshToken: newRefreshToken,
    });

  } catch (error) {

    console.log(
      "REFRESH TOKEN ERROR:",
      error
    );

    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token.",
    });
  }
};




const forgotAdminPassword = async (req, res) => {
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

    const normalizedEmail = email.trim().toLowerCase();

    // --------------------------------
    // Find Admin
    // --------------------------------

    const admin = await Admin.findOne({
      email: normalizedEmail,
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found.",
      });
    }

    // --------------------------------
    // Block Check
    // --------------------------------

    if (admin.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your admin account has been blocked.",
      });
    }

    // --------------------------------
    // Generate OTP
    // --------------------------------

    const otp = generateOTP();

    // --------------------------------
    // OTP Expiry
    // --------------------------------

    const otpExpiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    // --------------------------------
    // Save OTP
    // --------------------------------

    admin.otp = otp;
    admin.otpExpiresAt = otpExpiresAt;
    admin.otpPurpose = "forgotPassword";

    await admin.save();

    // --------------------------------
    // Send OTP Email
    // --------------------------------

    try {

      await sendOTPEmail(
        admin.email,
        otp
      );

    } catch (emailError) {

      console.log(
        "FORGOT PASSWORD OTP EMAIL ERROR:",
        emailError
      );

      // Remove OTP if email failed

      admin.otp = null;
      admin.otpExpiresAt = null;
      admin.otpPurpose = null;

      await admin.save();

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
      message: "OTP has been sent to your email.",
    });

  } catch (error) {

    console.log(
      "FORGOT ADMIN PASSWORD ERROR:",
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

    const normalizedEmail = email.trim().toLowerCase();

    const normalizedOTP = String(otp).trim();

    // --------------------------------
    // Find Admin
    // --------------------------------

    const admin = await Admin.findOne({
      email: normalizedEmail,
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found.",
      });
    }

    // --------------------------------
    // Block Check
    // --------------------------------

    if (admin.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your admin account has been blocked.",
      });
    }

    // --------------------------------
    // OTP Purpose Check
    // --------------------------------

    if (admin.otpPurpose !== "forgotPassword") {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP request.",
      });
    }

    // --------------------------------
    // OTP Exists Check
    // --------------------------------

    if (!admin.otp || !admin.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: "OTP not found. Please request a new OTP.",
      });
    }

    // --------------------------------
    // OTP Expiry Check
    // --------------------------------

    if (new Date() > admin.otpExpiresAt) {
      
      admin.otp = null;
      admin.otpExpiresAt = null;
      admin.otpPurpose = null;

      await admin.save();

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    // --------------------------------
    // OTP Match Check
    // --------------------------------

    if (admin.otp !== normalizedOTP) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    admin.otp = null;
admin.otpExpiresAt = null;
admin.otpPurpose = "forgotPasswordVerified";

await admin.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. You can now reset your password.",
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

const resetAdminPassword = async (req, res) => {
  try {

    const {
      email,
      newPassword,
      confirmPassword,
    } = req.body;

    // --------------------------------
    // Required Fields
    // --------------------------------

    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, new password and confirm password are required.",
      });
    }

    // --------------------------------
    // Password Match
    // --------------------------------

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    // --------------------------------
    // Validate Password
    // --------------------------------

    const passwordError = validatePassword(newPassword);

    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    // --------------------------------
    // Normalize Email
    // --------------------------------

    const normalizedEmail = email.trim().toLowerCase();

    // --------------------------------
    // Find Admin
    // --------------------------------

    const admin = await Admin.findOne({
      email: normalizedEmail,
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found.",
      });
    }

    // --------------------------------
    // Block Check
    // --------------------------------

    if (admin.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your admin account has been blocked.",
      });
    }

    // --------------------------------
    // OTP Verification Check
    // --------------------------------

    if (admin.otpPurpose !== "forgotPasswordVerified") {
      return res.status(400).json({
        success: false,
        message: "Please verify the OTP before resetting your password.",
      });
    }

    // --------------------------------
    // Hash New Password
    // --------------------------------

    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    // --------------------------------
    // Update Password
    // --------------------------------

    admin.password = hashedPassword;

    // --------------------------------
    // Invalidate Existing Sessions
    // --------------------------------

    admin.refreshToken = "";

    // --------------------------------
    // Clear OTP State
    // --------------------------------

    admin.otp = null;
    admin.otpExpiresAt = null;
    admin.otpPurpose = null;
    admin.otpResendAvailableAt = null;

    await admin.save();

    // --------------------------------
    // Response
    // --------------------------------

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Please login again.",
    });

  } catch (error) {

    console.log(
      "RESET ADMIN PASSWORD ERROR:",
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

    const normalizedEmail = email.trim().toLowerCase();

    // --------------------------------
    // Find Admin
    // --------------------------------

    const admin = await Admin.findOne({
      email: normalizedEmail,
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found.",
      });
    }

    // --------------------------------
    // Block Check
    // --------------------------------

    if (admin.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your admin account has been blocked.",
      });
    }

    // --------------------------------
    // Already Verified Reset Check
    // --------------------------------

    if (admin.otpPurpose === "forgotPasswordVerified") {
      return res.status(400).json({
        success: false,
        message: "OTP has already been verified. You can reset your password.",
      });
    }

    // --------------------------------
    // Resend Cooldown
    // --------------------------------

    if (
      admin.otpResendAvailableAt &&
      new Date() < admin.otpResendAvailableAt
    ) {

      const remainingSeconds = Math.ceil(
        (admin.otpResendAvailableAt.getTime() - Date.now()) / 1000
      );

      return res.status(429).json({
        success: false,
        message: `Please wait ${remainingSeconds} seconds before requesting another OTP.`,
      });
    }

    // --------------------------------
    // Generate New OTP
    // --------------------------------

    const otp = generateOTP();

    const otpExpiresAt = getOTPExpiry();

  

    // --------------------------------
    // Save New OTP
    // --------------------------------

    admin.otp = otp;
    admin.otpExpiresAt = otpExpiresAt;
    admin.otpPurpose = "forgotPassword";
    admin.otpResendAvailableAt = new Date(
  Date.now() + 60 * 1000
);

    await admin.save();

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

      admin.otp = null;
      admin.otpExpiresAt = null;
      admin.otpPurpose = null;
      admin.otpResendAvailableAt = null;

      await admin.save();

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
      message: "A new OTP has been sent to your email.",
    });

  } catch (error) {

    console.log(
      "RESEND FORGOT PASSWORD OTP ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error.",
    });
  }
};
    

const getCurrentAdmin = async (req, res) => {
  try {

    // --------------------------------
    // Admin from adminProtect middleware
    // --------------------------------

    const adminId = req.user._id;

    // --------------------------------
    // Find Admin
    // --------------------------------

    const admin = await Admin.findById(adminId)
      .select("-password -refreshToken -otp -otpExpiresAt");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found.",
      });
    }

    // --------------------------------
    // Response
    // --------------------------------

    return res.status(200).json({
      success: true,
      message: "Admin profile fetched successfully.",
      admin,
    });

  } catch (error) {

    console.log("GET CURRENT ADMIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error.",
    });
  }
};

const changeAdminPassword = async (req, res) => {
  try {

    const adminId = req.user._id;

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    // --------------------------------
    // Required Fields
    // --------------------------------

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password, new password and confirm password are required.",
      });
    }

    // --------------------------------
    // New Password Confirmation
    // --------------------------------

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match.",
      });
    }

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
    // Find Admin
    // --------------------------------

    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found.",
      });
    }

    // --------------------------------
    // Check Blocked
    // --------------------------------

    if (admin.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Admin account has been blocked.",
      });
    }

    // --------------------------------
    // Check Current Password
    // --------------------------------

    const passwordMatch = await bcrypt.compare(
      currentPassword,
      admin.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    // --------------------------------
    // Prevent Same Password
    // --------------------------------

    const samePassword = await bcrypt.compare(
      newPassword,
      admin.password
    );

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password.",
      });
    }

    // --------------------------------
    // Hash New Password
    // --------------------------------

    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    admin.password = hashedPassword;

    // --------------------------------
    // Invalidate Refresh Token
    // --------------------------------

    admin.refreshToken = "";

    await admin.save();

    // --------------------------------
    // Response
    // --------------------------------

    return res.status(200).json({
      success: true,
      message: "Password changed successfully. Please login again.",
    });

  } catch (error) {

    console.log(
      "CHANGE ADMIN PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error.",
    });
  }
};

module.exports = { createAdmin,verifyAdminOTP,resendAdminOTP,loginAdmin,getAdminProfile,logoutAdmin, refreshAdminToken,forgotAdminPassword,verifyForgotPasswordOTP,resetAdminPassword,resendForgotPasswordOTP,getCurrentAdmin,changeAdminPassword};