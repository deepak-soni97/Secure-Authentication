const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/register', userController.register);
router.post('/verifyOtp',userController.verifyOtp); 
router.get('/user-list', userController.userList);
router.post('/login', userController.login);
// router.post('/forgotPassword', userController.forgotPassword);

module.exports = router;