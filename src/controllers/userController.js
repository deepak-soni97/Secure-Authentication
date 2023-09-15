require('dotenv').config;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Joi = require('joi')
const nodemailer = require('nodemailer');
const randomString = require('randomstring');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth:{
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  }
});

const register = async (req, res) => {
    const { username, email, password } = req.body;
        try {

        const schema = Joi.object({
            username: Joi.string().required().min(3).max(30),
            email: Joi.string().required().email(),
            password: Joi.string().required().max(30),
        });

        const { error } = schema.validate({ username, email, password });

        if (error) {
            const errorMessage = error.details.map((detail) => detail.message).join(', ');
            return res.status(400).json({ message: errorMessage });
        }

        const existingUser = await User.findOne({  email });
        if (existingUser) {
          return res.status(409).json({ message: 'User or email already exists' });
        }
         // Check password strength
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      return res.status(400).json({ message: '\"password\" length must be at least 8 characters long and include alfanum' });
    }
         // Generate OTP
         const otp = randomString.generate({ length: 6, charset: 'numeric' });
        // Send OTP to the user's email
    // const mailOptions = {
    //   from: process.env.EMAIL,
    //   to: email,
    //   subject: 'OTP for User Registration',
    //   text: `Your OTP for registration is: ${otp}`,
    // };

    // await transporter.sendMail(mailOptions);
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ 
          username, 
          email,
          password: hashedPassword,
          otp,
          isVerified:false,
         });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully. Check your email for OTP verification.' })
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
}

const verifyOtp = async (req, res) => {
  try{
    const {email, otp} = req.body;

    console.log(req.body);
    const user = await User.findOne({ email});
   console.log(user);
    if(!user){
      return res.status(404).json({ message: 'User not found' });

    }

    if(user.otp === otp){
      user.otp = '';
      user.isVerified = true;
    
    await user.save();
    return res.status(200).json({ message: 'OTP Verified Successfully' });
    }else{
      return res.status(500).json({ message: 'Invalid OTP'});
    }
  }catch(error){
  console.log(error);
  res.status(500).json({ message: 'Server error'});
  }
}

const userList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Current page, default to 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Number of users per page, default to 10 if not provided

    const skip = (page - 1) * limit; // Calculate how many documents to skip

    const totalUsers = await User.countDocuments(); // Get the total number of users

    // Retrieve users with pagination
    const users = await User.find({})
      .skip(skip)
      .limit(limit);

    res.json({
      users,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

const login = async (req, res) => {
  try {
    const { email, password, deviceName, deviceID } = req.body;

    // Find the user by username
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare the provided password with the stored hash
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if the device is already logged in and replace it
    const existingDeviceIndex = user.devices.findIndex((device) => device.deviceID === deviceID);
    if (existingDeviceIndex !== -1) {
      user.devices.splice(existingDeviceIndex, 1);
    }

    // Add the current device to the user's list of devices
    user.devices.push({ deviceName, deviceID });
    await user.save();

    // Generate and send a JWT token
    const token = jwt.sign({ username: user.username }, 'secret_key', {
      expiresIn: '5m', // Token expires in 5 minutes
    });

    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

const forgotPassword = async(req, res) => {
  try {
    const { email } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a unique token for password reset
    const resetToken = randomString.generate(32); // Replace with a secure token generator

    // Store the reset token and its expiration time in the user's document
    user.resetToken = resetToken;
    user.resetTokenExpiration = Date.now() + 3600000; // Token expires in 1 hour

    await user.save();

    // Send a password reset link to the user's email
    const resetLink = `http://localhost:3000/api/auth/reset-password/${resetToken}`;
    console.log(resetLink);
    const mailOptions = {
      from: 'your-email@example.com',
      to: email,
      subject: 'Password Reset Link',
      text: `Click the following link to reset your password: ${resetLink}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

const resetPassword = async(req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Find the user by the reset token and check its expiration
    const user = await User.findOne({
      resetToken: token
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
     // Check if the reset token has expired
     if (user.resetTokenExpiration && user.resetTokenExpiration <= Date.now()) {
      return res.status(400).json({ message: 'Token has expired' });
    }
    // Update the user's password and clear the reset token
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiration = null;

    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}


const secure = async (req, res) => {
  res.status(200).json({ message: 'Access granted' });

}


module.exports = { 
    register,
    verifyOtp, 
    userList,
    login,
    forgotPassword,
    resetPassword,
    secure, 
  };