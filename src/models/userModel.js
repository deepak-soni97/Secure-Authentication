const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: { type: String, required: true },
    email:{type: String, unique: true},
    password: { type: String, required: true },
    otp: { type: String,default: '' },
    isVerified: { type: Boolean, required: true},
    devices: [{ deviceName: String, deviceID: String }],
    resetToken: String,
  resetTokenExpiration: Date,
});


module.exports = mongoose.model('User', userSchema);