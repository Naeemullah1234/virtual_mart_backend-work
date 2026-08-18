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

      phone: normalizedPhone, password: hashedPassword, avatar: avatar || "", role: "admin", isVerified: false, otp, otpExpiresAt, });


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

    if (!email || !password) {
      return res.status(400).json({ success: false,message: "Email and password are required.",});}


    const normalizedEmail = email.trim().toLowerCase();


    const admin = await Admin.findOne({ email: normalizedEmail,});

    if (!admin) {
      return res.status(401).json({ success: false,message: "Invalid email or password.",});}


    if (!admin.isVerified) {
      return res.status(403).json({ success: false,message: "Please verify your email before logging in.",});}


    if (admin.isBlocked) {
      return res.status(403).json({ success: false, message: "Your admin account has been blocked.", });}


    const passwordMatch = await bcrypt.compare( password,admin.password);

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password.",});}

   
    const token = jwt.sign( { id: admin._id, role: "admin",}, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "1d",});


    admin.lastLogin = new Date();

    await admin.save();



    return res.status(200).json({ success: true,message: "Admin login successful.",token,

      admin: { id: admin._id, firstName: admin.firstName, lastName: admin.lastName, email: admin.email,

        phone: admin.phone, avatar: admin.avatar, role: admin.role, isVerified: admin.isVerified, lastLogin: admin.lastLogin,},});

  } catch (error) {

    console.log(error);

    return res.status(500).json({success: false, message: "Server Error", }); }};

module.exports = { createAdmin,verifyAdminOTP,resendAdminOTP,loginAdmin,};