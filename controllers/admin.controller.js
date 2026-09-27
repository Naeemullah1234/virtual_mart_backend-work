const Admin = require("../models/admin.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validateName,validateEmail,validatePhone,validatePassword,} = require("../validators/admin.validator");
const {generateOTP,getOTPExpiry,} = require("../utils/otp");
const {sendOTPEmail,} = require("../utils/sendEmail");
const pendingAdminSignups = new Map();



const createAdmin = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      avatar,
    } = req.body;

    console.log("CREATE ADMIN BODY:", req.body);

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
        message: "Please fill all required fields.",
      });
    }

    // --------------------------------
    // Name Validation
    // --------------------------------

    const firstNameError = validateName(firstName, "First name");

    if (firstNameError) {
      return res.status(400).json({
        success: false,
        message: firstNameError,
      });
    }

    const lastNameError = validateName(lastName, "Last name");

    if (lastNameError) {
      return res.status(400).json({
        success: false,
        message: lastNameError,
      });
    }

    // --------------------------------
    // Email Validation
    // --------------------------------

    const emailError = validateEmail(email);

    if (emailError) {
      return res.status(400).json({
        success: false,
        message: emailError,
      });
    }

    // --------------------------------
    // Phone Validation
    // --------------------------------

    const phoneError = validatePhone(phone);

    if (phoneError) {
      return res.status(400).json({
        success: false,
        message: phoneError,
      });
    }

    // --------------------------------
    // Password Validation
    // --------------------------------

    const passwordError = validatePassword(password);

    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    // --------------------------------
    // Check Existing Permanent Admin
    // --------------------------------

    const existingEmail = await Admin.findOne({
      email: normalizedEmail,
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already exists.",
      });
    }

    const existingPhone = await Admin.findOne({
      phone: normalizedPhone,
    });

    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: "Phone number already exists.",
      });
    }

    // --------------------------------
    // Hash Password
    // --------------------------------

    const hashedPassword = await bcrypt.hash(password, 10);

    // --------------------------------
    // Generate OTP
    // --------------------------------

    const otp = generateOTP();
    const otpExpiresAt = getOTPExpiry();

    // --------------------------------
    // TEMPORARY SIGNUP DATA
    // --------------------------------
    // IMPORTANT:
    // Admin is NOT saved to MongoDB here.
    // Data is temporarily stored in Map.

   pendingAdminSignups.set(normalizedEmail, {
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
});

    // --------------------------------
    // Send OTP Email
    // --------------------------------

    try {
      await sendOTPEmail(normalizedEmail, otp);
    } catch (emailError) {
      console.log("OTP EMAIL ERROR:", emailError);

      // Remove temporary signup
      pendingAdminSignups.delete(normalizedEmail);

      return res.status(500).json({
        success: false,
        message: "OTP could not be sent. Please try again.",
      });
    }

    // --------------------------------
    // Success
    // --------------------------------

    return res.status(200).json({
      success: true,
      message: "OTP has been sent to your email. Please verify your OTP.",
      email: normalizedEmail,
    });

  } catch (error) {
    console.log("CREATE ADMIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};



 

const verifyAdminOTP = async (req, res) => {
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

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOTP = String(otp).trim();

    // --------------------------------
    // Find Temporary Signup
    // --------------------------------

    const pendingAdmin = pendingAdminSignups.get(normalizedEmail);

    if (!pendingAdmin) {
      return res.status(404).json({
        success: false,
        message:
          "Signup request not found or expired. Please signup again.",
      });
    }

    // --------------------------------
    // Check OTP Expiry
    // --------------------------------

    if (
      !pendingAdmin.otpExpiresAt ||
      pendingAdmin.otpExpiresAt < new Date()
    ) {
      pendingAdminSignups.delete(normalizedEmail);

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please signup again.",
      });
    }

    // --------------------------------
    // Check OTP
    // --------------------------------

    if (pendingAdmin.otp !== normalizedOTP) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    // --------------------------------
    // OTP VERIFIED
    // NOW CREATE PERMANENT ADMIN
    // --------------------------------

    const admin = await Admin.create({
      firstName: pendingAdmin.firstName,
      lastName: pendingAdmin.lastName,
      email: pendingAdmin.email,
      phone: pendingAdmin.phone,
      password: pendingAdmin.password,
      avatar: pendingAdmin.avatar,
      role: "admin",
      isVerified: true,
    });

    // --------------------------------
    // Remove Temporary Signup
    // --------------------------------

    pendingAdminSignups.delete(normalizedEmail);

    // --------------------------------
    // Success
    // --------------------------------

    return res.status(201).json({
      success: true,
      message: "Admin account verified and created successfully.",
      admin: {
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        phone: admin.phone,
        avatar: admin.avatar,
        role: admin.role,
        isVerified: admin.isVerified,
      },
    });

  } catch (error) {
    console.log("VERIFY ADMIN OTP ERROR:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Admin email or phone already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

 
  const resendAdminOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // --------------------------------
    // Required Field
    // --------------------------------

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // --------------------------------
    // Find Temporary Signup
    // --------------------------------

    const pendingAdmin = pendingAdminSignups.get(normalizedEmail);

    if (!pendingAdmin) {
      return res.status(404).json({
        success: false,
        message:
          "Signup request not found or expired. Please signup again.",
      });
    }

    // --------------------------------
    // Resend Cooldown
    // --------------------------------

    if (
      pendingAdmin.otpResendAvailableAt &&
      new Date() < pendingAdmin.otpResendAvailableAt
    ) {
      const remainingSeconds = Math.ceil(
        (pendingAdmin.otpResendAvailableAt.getTime() -
          Date.now()) /
          1000
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

    pendingAdmin.otp = otp;
    pendingAdmin.otpExpiresAt = otpExpiresAt;

    // 60 seconds resend cooldown
    pendingAdmin.otpResendAvailableAt = new Date(
      Date.now() + 60 * 1000
    );

    // --------------------------------
    // Send New OTP
    // --------------------------------

    try {
      await sendOTPEmail(
        pendingAdmin.email,
        otp
      );
    } catch (emailError) {
      console.log("RESEND OTP EMAIL ERROR:", emailError);

      return res.status(500).json({
        success: false,
        message: "OTP could not be sent. Please try again.",
      });
    }

    // --------------------------------
    // Success
    // --------------------------------

    return res.status(200).json({
      success: true,
      message: "A new OTP has been sent to your email.",
    });

  } catch (error) {
    console.log("RESEND ADMIN OTP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
 

   const loginAdmin = async (req, res) => {
  try {

    const { email, password } = req.body;

   
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required.",});}


    const normalizedEmail = email.trim().toLowerCase();


    const admin = await Admin.findOne({ email: normalizedEmail,});

    if (!admin) {
      return res.status(401).json({ success: false, message: "Invalid email or password.", });}


    if (!admin.isVerified) {
      return res.status(403).json({ success: false,message: "Please verify your email before logging in.",});}


    if (admin.isBlocked) {
      return res.status(403).json({ success: false,message: "Your admin account has been blocked.", });}


    const passwordMatch = await bcrypt.compare( password, admin.password);

    if (!passwordMatch) {
      return res.status(401).json({ success: false,message: "Invalid email or password.",});}

 

    const accessToken = jwt.sign({ id: admin._id,role: "admin", tokenVersion: admin.tokenVersion, },process.env.JWT_SECRET,{ expiresIn: "15m",});


    const refreshToken = jwt.sign( { id: admin._id, role: "admin",},process.env.JWT_REFRESH_SECRET, { expiresIn: "7d", });


    admin.refreshToken = refreshToken;

    admin.lastLogin = new Date();

    await admin.save();


    return res.status(200).json({ success: true, message: "Admin login successful.", accessToken, refreshToken,

      admin: { id: admin._id, firstName: admin.firstName,lastName: admin.lastName,
         email: admin.email, phone: admin.phone, avatar: admin.avatar, role: admin.role, isVerified: admin.isVerified, lastLogin: admin.lastLogin,},});

  } catch (error) {

    console.log("ADMIN LOGIN ERROR:", error);

    return res.status(500).json({ success: false, message: "Server Error.",});}};


    const getAdminProfile = async (req, res) => {
  try {

    return res.status(200).json({ success: true, admin: req.admin,});

  } catch (error) {

    console.log("GET ADMIN PROFILE ERROR:", error);

    return res.status(500).json({ success: false, message: "Server Error",}); }};


const logoutAdmin = async (req, res) => {
  try {

    const adminId = req.user._id;

    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found.",});}

 

    admin.refreshToken = "";
    admin.tokenVersion += 1;

    await admin.save();

    return res.status(200).json({ success: true, message: "Admin logged out successfully.", });

  } catch (error) {

    console.log("ADMIN LOGOUT ERROR:", error);

    return res.status(500).json({ success: false, message: "Server Error.",});}};

const refreshAdminToken = async (req, res) => {
  try {

    const { refreshToken } = req.body;


    if (!refreshToken) {
      return res.status(401).json({ success: false, message: "Refresh token is required.",});}


    const decoded = jwt.verify( refreshToken, process.env.JWT_REFRESH_SECRET );


    const admin = await Admin.findOne({ _id: decoded.id, refreshToken: refreshToken, isVerified: true,isBlocked: false,});

    if (!admin) {
      return res.status(401).json({ success: false, message: "Invalid refresh token.",}); }


    const accessToken = jwt.sign({ id: admin._id, role: "admin", }, process.env.JWT_SECRET, { expiresIn: "15m",});

  

    const newRefreshToken = jwt.sign( { id: admin._id, role: "admin",  tokenVersion: admin.tokenVersion,}, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d",} );

    admin.refreshToken = newRefreshToken;

    await admin.save();


    return res.status(200).json({ success: true, message: "Token refreshed successfully.",accessToken, refreshToken: newRefreshToken,});

  } catch (error) {
     
    return res.status(401).json({ success: false, message: "Invalid or expired refresh token.",});}};




const forgotAdminPassword = async (req, res) => {
  try {

    const { email } = req.body;


    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required.",});}


    const normalizedEmail = email.trim().toLowerCase();

    const admin = await Admin.findOne({ email: normalizedEmail,});

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found.",});}


         if (admin.isBlocked) {
  return res.status(403).json({
    success: false,
    message: "Your admin account has been blocked.",
  });
}

// OTP resend cooldown check
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

const otp = generateOTP();

    const otpExpiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    admin.otp = otp;
    admin.otpExpiresAt = otpExpiresAt;
    admin.otpPurpose = "forgotPassword";
    admin.otpResendAvailableAt = new Date(
      Date.now() + 60 * 1000
    );

    await admin.save();

    try {

      await sendOTPEmail( admin.email,otp );

    } catch (emailError) {

      admin.otp = null;
      admin.otpExpiresAt = null;
      admin.otpPurpose = null;

      await admin.save();

      return res.status(500).json({
        success: false,
        message: "OTP email could not be sent.",
      });
    }

    return res.status(200).json({ success: true, message: "OTP has been sent to your email.",});

  } catch (error) {


    return res.status(500).json({ success: false, message: "Server Error",});}};

const verifyForgotPasswordOTP = async (req, res) => {
  try {

    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false,   message: "Email and OTP are required.", });}


    const normalizedEmail = email.trim().toLowerCase();

    const normalizedOTP = String(otp).trim();

  

    const admin = await Admin.findOne({ email: normalizedEmail,});

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found.", }); }

   

    if (admin.isBlocked) {
      return res.status(403).json({ success: false,  message: "Your admin account has been blocked.",});}

    if (admin.otpPurpose !== "forgotPassword") {
      return res.status(400).json({ success: false,  message: "Invalid OTP request.", });}


    if (!admin.otp || !admin.otpExpiresAt) {
      return res.status(400).json({ success: false, message: "OTP not found. Please request a new OTP.",}); }

    if (new Date() > admin.otpExpiresAt) {
      
      admin.otp = null;
      admin.otpExpiresAt = null;
      admin.otpPurpose = null;

      await admin.save();

      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new OTP.",}); }


    if (admin.otp !== normalizedOTP) {
      return res.status(400).json({ success: false, message: "Invalid OTP.",});}

    admin.otp = null;
    admin.otpExpiresAt = null;
    admin.otpPurpose = "forgotPasswordVerified";

await admin.save();

    return res.status(200).json({ success: true, message: "OTP verified successfully. You can now reset your password.", });

  } catch (error) {

    return res.status(500).json({ success: false, message: "Server Error", }); }};

const resetAdminPassword = async (req, res) => {
  try {

    const { email,newPassword,confirmPassword,} = req.body;


    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({  success: false,  message: "Email, new password and confirm password are required.", }); }


    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match.", });}


    const passwordError = validatePassword(newPassword);

    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError, });}

    const normalizedEmail = email.trim().toLowerCase();


    const admin = await Admin.findOne({ email: normalizedEmail, });

    if (!admin) {
      return res.status(404).json({  success: false, message: "Admin not found.",}); }


    if (admin.isBlocked) {  return res.status(403).json({  success: false, message: "Your admin account has been blocked.",}); }


    if (admin.otpPurpose !== "forgotPasswordVerified") {
      return res.status(400).json({ success: false, message: "Please verify the OTP before resetting your password.", }); }

    const hashedPassword = await bcrypt.hash( newPassword,10 );

    admin.password = hashedPassword;
    admin.refreshToken = "";
    admin.tokenVersion += 1;
    admin.otp = null;
    admin.otpExpiresAt = null;
    admin.otpPurpose = null;
    admin.otpResendAvailableAt = null;

    await admin.save();

    return res.status(200).json({ success: true, message: "Password reset successfully. Please login again.", });

  } catch (error) {

    return res.status(500).json({ success: false, message: "Server Error",});}};


const resendForgotPasswordOTP = async (req, res) => {
  try {

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({  success: false, message: "Email is required.", }); }


    const normalizedEmail = email.trim().toLowerCase();

    const admin = await Admin.findOne({ email: normalizedEmail, });

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found.", }); }


    if (admin.isBlocked) {
      return res.status(403).json({ success: false, message: "Your admin account has been blocked.",});}


    if (admin.otpPurpose === "forgotPasswordVerified") {
      return res.status(400).json({ success: false, message: "OTP has already been verified. Now You can reset your password.",});}


    if ( admin.otpResendAvailableAt && new Date() < admin.otpResendAvailableAt ) {

      const remainingSeconds = Math.ceil( (admin.otpResendAvailableAt.getTime() - Date.now()) / 1000);

      return res.status(429).json({ success: false, message: `Please wait ${remainingSeconds} seconds before requesting another OTP.`, });}

  
    const otp = generateOTP();

    const otpExpiresAt = getOTPExpiry();


    admin.otp = otp;
    admin.otpExpiresAt = otpExpiresAt;
    admin.otpPurpose = "forgotPassword";
    admin.otpResendAvailableAt = new Date(
     Date.now() + 60 * 1000
   );

    await admin.save();


    try {

      await sendOTPEmail( normalizedEmail,  otp );

    } catch (emailError) {

      admin.otp = null;
      admin.otpExpiresAt = null;
      admin.otpPurpose = null;
      admin.otpResendAvailableAt = null;

      await admin.save();

      return res.status(500).json({ success: false, message: "OTP email could not be sent.", });}


    return res.status(200).json({ success: true, message: "A new OTP has been sent to your email.",});

  } catch (error) {

    return res.status(500).json({ success: false,  message: "Server Error.", });}};
    

const getCurrentAdmin = async (req, res) => {
  try {


    const adminId = req.user._id;


    const admin = await Admin.findById(adminId)
      .select("-password -refreshToken -otp -otpExpiresAt");

    if (!admin) {
      return res.status(404).json({ success: false,  message: "Admin not found.",});}


    return res.status(200).json({ success: true,message: "Admin profile fetched successfully.", admin,});

  } catch (error) {

    console.log("GET CURRENT ADMIN ERROR:", error);

    return res.status(500).json({ success: false, message: "Server Error.",});}};

const changeAdminPassword = async (req, res) => {
  try {

    const adminId = req.user._id;

    const { currentPassword,  newPassword, confirmPassword, } = req.body;

   

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: "Current password, new password and confirm password are required.", }); }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false,  message: "New password and confirm password do not match.",});}


    const passwordError = validatePassword(newPassword);

    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError, }); }



    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found.",}); }


    if (admin.isBlocked) {
      return res.status(403).json({ success: false, message: "Admin account has been blocked.", });}


    const passwordMatch = await bcrypt.compare( currentPassword, admin.password);

    if (!passwordMatch) {
       return res.status(401).json({ success: false, message: "Current password is incorrect.", }); }

    const samePassword = await bcrypt.compare( newPassword, admin.password);

    if (samePassword) {
      return res.status(400).json({ success: false, message: "New password must be different from current password.", });}

    const hashedPassword = await bcrypt.hash( newPassword, 10 );

    admin.password = hashedPassword;

    admin.refreshToken = "";
    admin.tokenVersion += 1;

    await admin.save();

  

    return res.status(200).json({ success: true, message: "Password changed successfully. Please login again.",});

  } catch (error) {

    return res.status(500).json({ success: false, message: "Server Error.",});}};

module.exports = { createAdmin,verifyAdminOTP,resendAdminOTP,
  loginAdmin,getAdminProfile,logoutAdmin, refreshAdminToken,forgotAdminPassword,verifyForgotPasswordOTP,resetAdminPassword,resendForgotPasswordOTP,getCurrentAdmin,changeAdminPassword};