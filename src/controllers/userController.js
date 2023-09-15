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



module.exports = { register, verifyOtp, userList};