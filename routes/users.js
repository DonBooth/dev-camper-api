const express = require('express')
const router = express.Router()
const {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser
} = require('../controllers/user')

// for use with advancedResults - pagination, etc.
const User = require('../models/User')

const {
    protect,
    authorizedRoles
} = require('../middleware/auth')
const advancedResults = require('../middleware/advancedResults')

// all routes below will use protect and authorize the role of admin
router.use(protect)
router.use(authorizedRoles('admin'))

router.route('/')
    .get(advancedResults(User), getUsers)
    .post(createUser)

router.route('/:id')
    .get(getUser)
    .put(updateUser)
    .delete(deleteUser)

module.exports = router