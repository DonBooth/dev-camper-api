const jwt = require('jsonwebtoken')
const asyncHandler = require('./async_handler')
const ErrorResponse = require('../utils/errorResponse')
const User = require('../models/User')

exports.protect = asyncHandler(async (req, res, next) => {
    let token

    // set token in header with Bearer token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]

        // COOKIES do this, below, if you want to use cookies ie.set token from cookie
    } else if (req.cookies.token) {
        token = req.cookies.token
    }


    // make sure token exists
    if (!token) {
        return next(new ErrorResponse('not authorized.', 401))
    }

    try {
        // verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        req.user = await User.findById(decoded.id)

        next()

    } catch (err) {
        return next(new ErrorResponse('not authorized.', 401))
    }

})

// Roles - Grant access to secific routes
// this is middleware (remember to pass the next value)
// NB ---====>>> when adding "authorizedRoles to routes it must be added after "protect" because the user is created in protect
exports.authorizedRoles = (...roles) => {
    return (req, res, next) => {
        console.log(req.user.role, ' ', roles)
        if (!roles.includes(req.user.role)) {
            return next(new ErrorResponse(`User role of '${req.user.role}' is not authorized to access this route.`, 403))
        }
        next()
    }
}