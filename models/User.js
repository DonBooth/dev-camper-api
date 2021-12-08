mongoose = require('mongoose')
const crypto = require('crypto') // for hash of email in password recovers.
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const {
    threadId
} = require('worker_threads')

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: [true, 'Please add a name']
    },
    email: {
        required: true,
        trim: true,
        unique: [true, 'That email address has been taken.'],
        type: String,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,5})+$/,
            'Please enter a valid email.'
        ]
    },
    role: {
        type: String,
        enum: ['user', 'publisher', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minLength: 6,
        select: false
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }

})

// encrypt password with bcryptjs
UserSchema.pre('save', async function (next) {
    // when just saving the hashed emailand expiration time for "forgotPassword" it won't save unless:
    if (!this.isModified('password')) {
        next()
    }
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
})

// create jwt token
UserSchema.methods.createJwtToken = function () {
    return jwt.sign({
            id: this._id
        },
        process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRATION
        })
}

// validate token
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}

// generate and hash password token (to reset password)
UserSchema.methods.getRestPasswordToken = function () {
    // generate token
    const resetToken = crypto.randomBytes(20).toString('hex')

    // hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    // set expire - 10 minutes
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000

    return (resetToken)

}


module.exports = mongoose.model('User', UserSchema)