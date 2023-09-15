require('dotenv').config;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const transporter = require('../services/emailService');
const randomString = require('randomstring');


const login = async (req, res) => {
    try {
        const { email, password, deviceName, deviceID } = req.body;

        // Find the user by email
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
        const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, {
            expiresIn: '5m', // Token expires in 5 minutes
        });

        res.status(200).json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

const forgotPassword = async (req, res) => {
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
        const resetLink = `https://user-auth-ypz7.onrender.com/api/auth/reset-password/${resetToken}`;
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

const resetPassword = async (req, res) => {
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
    login,
    forgotPassword,
    resetPassword,
    secure,
};  