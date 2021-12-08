// error response requires a message and then an error code: next(new ErrorResponse(`No something ${thatThing}`))
class ErrorResponse extends Error {
    constructor(message, statusCode) {
        super(message)
        this.statusCode = statusCode
    }
}

module.exports = ErrorResponse