const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');



router.post('/register', userController.register);
router.post('/verifyOtp', userController.verifyOtp);
router.get('/user-list', userController.userList);

module.exports = router;