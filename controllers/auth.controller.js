const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { validateName,validateEmail,validatePhone,validatePassword,} = require("../validators/customer.validator");


const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password,} = req.body;
 
    if (
      !firstName || !email || !password) 
      {

      return res.status(400).json({success: false, message: "Please fill all required fields.",});}


     const firstNameError = validateName(firstName, "First name");

    if (firstNameError) {
    return res.status(400).json({
    success: false,
    message: firstNameError,
  });
 }



const emailError = validateEmail(email);

if (emailError) {
  return res.status(400).json({
    success: false,
    message: emailError,
  });
}


if (phone) {
  const phoneError = validatePhone(phone);

  if (phoneError) {
    return res.status(400).json({
      success: false,
      message: phoneError,
    });
  }
}


const passwordError = validatePassword(password);

if (passwordError) {
  return res.status(400).json({
    success: false,
    message: passwordError,
  });
}

    
    const existingUser = await User.findOne({ email });

    if (existingUser) {

      return res.status(400).json({success: false,message: "Email already registered.",});}

   
    const user = await User.create({firstName, lastName, email, phone, password, role: "customer" });

    const token = jwt.sign({ id: user._id, role: user.role,},
        
    process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN,});

    res.status(201).json({ success: true, message: "User registered successfully.", token,

    user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role,},});}

   catch (error) {

    console.log(error);

    res.status(500).json({ success: false, message: "Server Error",});}};


   const loginUser = async (req, res) => {
    try {

        const { email, password } = req.body;

        if (!email || !password) {

            return res.status(400).json({ success: false,message: "Email and Password are required.",});}

        const user = await User.findOne({ email });

        if (!user) {

            return  res.status(400).json({ success: false, message: "Invalid Email or Password.",});}

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {

            return res.status(400).json({ success: false,message: "Invalid Email or Password.",});}

        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign ({ id: user._id,role: user.role,}, process.env.JWT_SECRET,{ expiresIn: process.env.JWT_EXPIRES_IN,});

        res.status(200).json({ success: true, message: "Login Successfully.", token,
            
            user: {id: user._id,firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role,},});

        } catch (error) {

        console.log(error);

        res.status(500).json({ success: false, message: "Server Error", }); }};

         const getCurrentUser = async (req, res) => {

        try {

      const user = await User.findById(req.user.id).select( "firstName lastName email phone avatar role isVerified isBlocked createdAt lastLogin");

        if (!user) {

         return res.status(404).json({ success: false,message: "User not found.",});}

         res.status(200).json({ success: true, user,});

    } catch (error) {

    console.log(error);

    res.status(500).json({success: false,message: "Server Error",});}};



module.exports = {
  registerUser,
  loginUser,
  getCurrentUser
};