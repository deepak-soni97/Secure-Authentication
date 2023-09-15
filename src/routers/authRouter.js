const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const tokenExpiration = require('../middleware/tokenExpirationMiddleware');



router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.post('/secure-route', tokenExpiration, authController.secure);

module.exports = router;