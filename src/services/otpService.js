const randomString = require('randomstring');

// Generate OTP
const generateOTP = () => {
  return randomString.generate({ length: 6, charset: 'numeric' });
};

module.exports = generateOTP ;
