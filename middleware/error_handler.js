// error response requires a message and then an error code: next(new ErrorResponse(`No something ${thatThing}`))
const ErrorResponse = require("../utils/errorResponse")

const errorHandler = (err, req, res, next) => {
    let error = {
        ...err
    }

    error.message = err.message

    // log to console for dev
    console.log(err.stack)

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = `Resource not found with id of ${err.value}.`
        error = new ErrorResponse(message, 404)
    }

    // Mongoose duplicat key
    if (err.code == 11000) {
        const message = 'Duplicate field value entered'
        error = new ErrorResponse(message, 400)
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        console.log(err.errors)
        const message = Object.values(err.errors).map(val => val.message)
        error = new ErrorResponse(message, 400)
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error'
    })
}

module.exports = errorHandler