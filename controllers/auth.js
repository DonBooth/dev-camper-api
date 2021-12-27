const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async_handler')
const User = require('../models/User')
const Bootcamp = require('../models/Bootcamp')
const sendEmail = require('../utils/sendEmail')
const crypto = require('crypto')


// @desc Get the form to register
// @route GET /api/v1/auth/register
// @access public
exports.registerForm = (req, res, next) => {
    res.render('pages/registerForm', {
        scripts: '<script src="/../../js/register.js"></script>'
    });
}

// @desc Get the form to login
// @route GET /api/v1/auth/login
// @access public
exports.loginForm = (req, res, next) => {
    res.render('pages/loginForm', {
        scripts: '<script src="/../../js/login.js"></script> '
    });
}

// @desc Register user
// @route POST /api/v1/auth/register
// @access public
exports.register = asyncHandler(async (req, res, next) => {

    const {
        name,
        email,
        password,
        role
    } = req.body

    // create user
    const user = await User.create({
        email,
        password,
        role,
        name
    })

    sendTokenResponse(user, 200, res)
})


// @desc Login user  
// @route POST /api/v1/auth/login
// @access public
exports.login = asyncHandler(async (req, res, next) => {

    const {
        email,
        password
    } = req.body
    console.log(req.body)
    // Validate email and password
    if (!email || !password) {
        return next(new ErrorResponse('please provide your email and password', 400))
    }

    // check for user - NB normally the database will not return a password but if we +password then we will get it.
    const user = await User.findOne({
        email
    }).select('+password')
    if (!user) {
        return next(new ErrorResponse('Invalid credentials.', 401))
    }

    // do passwords match?
    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
        return next(new ErrorResponse('Invalid credentials.', 401))
    }

    sendTokenResponse(user, 200, res)

})

//  @desc   Get current logged in user profile
//  @route  Get /api/v1/auth/profile
//  @access Private
exports.profile = asyncHandler(async (req, res, next) => {

    const user = await User.findById(req.user.id)

    const usersBootcamp = await Bootcamp.findOne({
        user: req.user.id
    })
    console.log(usersBootcamp)


    res.status(200).render('pages/profile', {
        data: user,
        success: true,
        scripts: ''
    })
})



//  @desc   Get current logged in user
//  @route  Get /api/v1/auth/me
//  @access Private
exports.getMe = asyncHandler(async (req, res, next) => {

    const user = await User.findById(req.user.id)


    res.status(200).json({
        success: true,
        data: user
    })
})

//  @desc   Get log out current user / clear cookie
//  @route  GET /api/v1/auth/logout
//  @access Private
exports.logout = asyncHandler(async (req, res, next) => {

    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 10000),
        httpOnly: true
    })

    res.status(200).json({
        success: true,
        data: {}
    })
})

//  @desc   Update Password
//  @route  PUT /api/v1/auth/updatepassword
//  @access Private
exports.updatePassword = asyncHandler(async (req, res, next) => {

    const user = await User.findById(req.user.id).select('+password')

    // check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
        next(new ErrorResponse('password is incorrect', 401))
    }

    user.password = req.body.newPassword

    await user.save()

    sendTokenResponse(user, 200, res)
})

//  @desc   Update User Details
//  @route  Put /api/v1/auth/me
//  @access Private
exports.updateUserDetails = asyncHandler(async (req, res, next) => {

    const fieldsToUpdate = {
        name: req.body.name,
        email: req.body.email
    }

    // new: true means that mongoose will return the new model with the updated info (it's the same as returnOriginal: false)
    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new: true,
        runValidators: true
    })

    res.status(200).json({
        success: true,
        data: user
    })


})

//  @desc   Forgot Password
//  @route  POST /api/v1/auth/forgotpassword
//  @access Public
exports.forgotpassword = asyncHandler(async (req, res, next) => {

    const user = await User.findOne({
        email: req.body.email
    })

    if (!user) {
        return next(new ErrorResponse('There is no user with that email.', 404))
    }

    // get rest token
    const resetToken = user.getRestPasswordToken()

    await user.save({
        validateBeforeSave: false
    })

    // Create reset URL
    const resetUrl = `${req.protocol}:${req.get('host')}/api/v1/auth/resetpassword/${resetToken}`

    const message = `You are receiving this message because you (or someone else) has requested a password reset. Please send a PUT request to: \n\n ${resetUrl}.`
    const html = `<p>You are receiving this message because you (or someone else) has requested a password reset. Please send a PUT request to:</p>${resetUrl}<p>`

    try {
        await sendEmail({
            email: user.email,
            subject: 'Password reset',
            message: message,
            html: html
        })
        res.status(200).json({
            success: true
        })
    } catch (err) {
        console.log(err)
        user.resetPasswordToken = undefined
        user.resetPasswordExpire = undefined

        await user.save({
            validateBeforeSave: false
        })

        return next(new ErrorResponse('email could not be sent', 500))
    }

})


//  @desc   Reset Password
//  @route  PUT /api/v1/auth/resetpassword/:resettoken
//  @access Public
exports.resetpassword = asyncHandler(async (req, res, next) => {
    // get hashed token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex')

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: {
            $gt: Date.now()
        }
    })

    if (!user) {
        return next(new ErrorResponse('Invalid token', 401))
    }

    // setnew password
    user.password = req.body.password
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save()

    sendTokenResponse(user, 200, res)


})


// helper function
// get token from model and create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {

    const token = user.createJwtToken()

    const d = new Date();
    d.setDate(d.getDate() + process.env.JWT_COOKIE_EXPIRATION);


    //create cookie
    const options = {
        maxAge: d,
        httpOnly: true
    }

    if (process.env.NODE_ENV === 'production') {
        options.secure = true
    }

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token
        })

}