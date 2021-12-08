const express = require('express')
const {
    protect,
    authorizedRoles
} = require('../middleware/auth')



const {
    getReviews,
    getReview,
    createReview,
    updateReview,
    deleteReview
} = require('../controllers/reviews')

const Bootcamp = require('../models/Bootcamp')

// for use with advancedResults - pagination, etc.
const Review = require('../models/Review')
const advancedResults = require('../middleware/advancedResults')

// *** mergeParams is required to use params from the bootcamps routes (-or other routes-)
// N.B. This router uses resources from /controllers/bootcamps
const router = express.Router({
    mergeParams: true
})


// the routes

// @desc    Get reviews
// @route   GET /api/v1/reviews  -  all reviews
// @route   GET /api/v1/bootcamps/:bootcampId/reviews   -  reviews for one bootcamp
// @access  public
router.route('/')
    .get(advancedResults(Review, {
        path: 'bootcamp',
        select: 'name description'
    }), getReviews)
    .post(protect, authorizedRoles('user', 'admin'), createReview)

router.route('/:id')
    .get(getReview)
    .put(protect, authorizedRoles('user', 'admin'), updateReview)
    .delete(protect, authorizedRoles('user', 'admin'), deleteReview)

module.exports = router