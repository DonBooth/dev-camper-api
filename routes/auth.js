const express = require('express')
const router = express.Router()
const {
    register,
    login,
    logout,
    getMe,
    forgotpassword,
    resetpassword,
    updateUserDetails,
    updatePassword,
    registerForm,
    loginForm,
    profile
} = require('../controllers/auth')
const {
    protect
} = require('../middleware/auth')

router.get('/register', registerForm)
router.post('/register', register)
router.get('/login', loginForm)
router.post('/login', login)
router.get('/me', protect, getMe)
router.get('/profile', protect, profile)
router.get('/logout', protect, logout)
router.post('/forgotpassword', forgotpassword)
router.put('/resetpassword/:resettoken', resetpassword)
router.put('/updateUserDetails', protect, updateUserDetails)
router.put('/updatepassword', protect, updatePassword)

module.exports = router