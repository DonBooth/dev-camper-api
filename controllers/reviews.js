const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async_handler')

const Course = require("../models/Course")
const Bootcamp = require("../models/Bootcamp")
const User = require("../models/User")
const Review = require('../models/Review')


// @desc  get all reviews - or - get all reviews from a single bootcamp
// @route GET /api/v1/reviews
// @route GET /api/v1/bootcamps/:bootcampId/reviews
// @access Public
exports.getReviews = asyncHandler(async (req, res, next) => {

    if (req.params.bootcampId) {
        // gets courses of a particular bootcamp

        const reviews = await Review.find({
            bootcamp: req.params.bootcampId
        })

        return res.status(200).json({
            success: true,
            data: reviews
        })
    } else {
        // this gets ALL reviews
        // advancedResults middleware is handled in the /routes/reviews file
        res.status(200).json(res.advancedResults)
    }
})

// @desc  GET one review 
// @route GET /api/v1/reviews/:id
// @access Public
exports.getReview = asyncHandler(async (req, res, next) => {

    const review = await Review.findById(req.params.id).populate({
        path: 'bootcamp',
        select: 'name description'
    })

    if (!review) {
        return next(new ErrorResponse(`Review not found with the id of ${req.params.id}.`, 404))
    }

    res.status(200).json({
        success: true,
        data: review
    })

})

// @desc  CREATE one review 
// @route POST /api/v1/bootcamps/:bootcampId/reviews
// @access Private
exports.createReview = asyncHandler(async (req, res, next) => {

    req.body.bootcamp = req.params.bootcampId
    req.body.user = req.user.id
    console.log(req.body)

    const bootcamp = await Bootcamp.findById(req.body.bootcamp)
    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp with id: ${req.params.bootcampId} not found.`, 404))
    }

    const review = await Review.create(req.body)

    res.status(201).json({
        success: true,
        data: review
    })

})

// @desc  UPDATE one review 
// @route PUT /api/v1/reviews/:id
// @access Private
exports.updateReview = asyncHandler(async (req, res, next) => {

    let review = await Review.findById(req.params.id)

    if (!review) {
        return next(new ErrorResponse(`Review not found with the id of ${req.params.id}.`, 404))
    }

    if (req.params.id.toString() === review.user && req.user.role !== 'admin') {
        return next(new ErrorResponse(`user ${req.params.id} does to have permission to update this review.`), 401)
    }

    review = await Review.findByIdAndUpdate(req.params.id, req.body, {
        runValidators: true,
        new: true
    })

    res.status(200).json({
        success: true,
        data: review
    })

})

// @desc  DELETE one review 
// @route DELETE /api/v1/reviews/:id
// @access Private
exports.deleteReview = asyncHandler(async (req, res, next) => {

    const review = await Review.findById(req.params.id)

    if (!review) {
        return next(new ErrorResponse(`Review not found with the id of ${req.params.id}.`, 404))
    }

    if (req.params.id.toString() === review.user && req.user.role !== 'admin') {
        return next(new ErrorResponse(`user ${req.params.id} does to have permission to delete this review.`), 401)
    }

    await Review.findByIdAndRemove(req.params.id)

    res.status(200).json({
        success: true,
        data: {}
    })

})