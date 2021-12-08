const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async_handler')
const User = require('../models/User')


// @desc Get All Users
// @route GET /api/v1/users
// @example: /api/v1/users?}/api/v1/users?select=name,email&limit=2page=2&limit=2 gives us the second page and a limit of two users per page.
// @example: /api/v1/users?}/api/v1/users?select=name,email&page=3&limit=2 gives us name and email on the second page and two to a page.
// @access private/admin
exports.getUsers = asyncHandler(async (req, res, next) => {

    res.status(200).json(
        res.advancedResults
    )
})

// @desc Get Single User
// @route GET /api/v1/users/:id
// @access private/admin
exports.getUser = asyncHandler(async (req, res, next) => {

    const user = await User.findById(req.params.id)

    if (!user) {
        return next(new ErrorResponse('User not found.', 404))
    }

    res.status(200).json({
        success: true,
        data: user
    })
})

// @desc Create user
// @route POST /api/v1/users
// @access private/admin
exports.createUser = asyncHandler(async (req, res, next) => {

    const user = await User.create(req.body)

    res.status(201).json({
        success: true,
        data: user
    })
})

// @desc update user
// @route PUT /api/v1/users/:id
// @access private/admin
exports.updateUser = asyncHandler(async (req, res, next) => {

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })

    res.status(201).json({
        success: true,
        data: user
    })
})

// @desc delete user
// @route DELETE /api/v1/users/:id
// @access private/admin
exports.deleteUser = asyncHandler(async (req, res, next) => {

    await User.findByIdAndDelete(req.params.id)

    res.status(201).json({
        success: true,
        data: {}
    })
})