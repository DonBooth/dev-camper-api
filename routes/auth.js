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
    updatePassword
} = require('../controllers/auth')
const {
    protect
} = require('../middleware/auth')

router.post('/register', register)
router.post('/login', login)
router.get('/me', protect, getMe)
router.get('/logout', protect, logout)
router.post('/forgotpassword', forgotpassword)
router.put('/resetpassword/:resettoken', resetpassword)
router.put('/updateUserDetails', protect, updateUserDetails)
router.put('/updatepassword', protect, updatePassword)

module.exports = router