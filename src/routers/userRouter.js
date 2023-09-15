const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const tokenExpiration = require('../middleware/tokenExpirationMiddleware');



router.post('/register', userController.register);
router.post('/verifyOtp',userController.verifyOtp); 
router.get('/user-list', userController.userList);
router.post('/login', userController.login);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password/:token', userController.resetPassword);
router.post('/secure-route',tokenExpiration,userController.secure);

module.exports = router;