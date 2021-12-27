const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async_handler')

const Course = require("../models/Course")
const Bootcamp = require("../models/Bootcamp")
const User = require("../models/User")


// @desc  get all courses - or - get all courses from a single bootcamp
// @route GET /api/v1/courses
// @route GET /api/v1/bootcamps/:bootcampId/courses
// @access Public
exports.getCourses = asyncHandler(async (req, res, next) => {



    if (req.params.bootcampId) {
        // gets courses of a particular bootcamp
        // ===================================>>> this is POPULATE
        const courses = await Course.find({
            bootcamp: req.params.bootcampId
        })

        return res.status(200).json({
            success: true,
            data: courses
        })
    } else {
        // this gets ALL courses
        // res.status(200).json(res.advancedResults)
        console.log('bootcamp: ', res.advancedResults)
        res.status(200).render('pages/courses', {
            bootcamps: res.advancedResults.data
        })
    }
})


//  @desc Get a simgle course
//  @route  GET /api/vi/courses/:id
//  @access public
exports.getCourse = asyncHandler(async (req, res, next) => {
    const course = await Course.findById(req.params.id).populate({
        path: 'bootcamp',
        select: 'name description'
    })

    if (!course) {
        return next(new ErrorResponse(`'No course with the id of ${req.params.id}`, 404))
    }

    res.status(200).json({
        success: true,
        data: course
    })
})

// @desc create one course
// @route POST /api/vi/bootcamps/:bootcampId/courses
// @access Private
exports.createCourse = asyncHandler(async (req, res, next) => {
    // this data comes in with the BODY
    // params just come from the request string.

    // add the id of the bootcamp to the body because the course is created from data in the body
    req.body.bootcamp = req.params.bootcampId
    // add the id of the user who is the owner of the course.
    req.body.user = req.user.id

    const bootcamp = await Bootcamp.findById(req.params.bootcampId)

    if (!bootcamp) {
        return next(new ErrorResponse(`Cannot find a bootcamp with the id of ${req.params.bootcampId}.`, 404))
    }

    // owner of the bootcamp must be the user who is currently logged in
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User is not authorized to add a course to bootcamp ${bootcamp._id}.`, 403))
    }

    const course = await Course.create(req.body)

    res.status(200).json({
        success: true,
        data: course
    })
})

// @desc update one course
// @route POST /api/vi/courses/:id
// @access Private
exports.updateCourse = asyncHandler(async (req, res, next) => {
    // this data comes in with the BODY

    let course = await Course.findById(req.params.id)
    if (!course) {
        return next(new ErrorResponse(`Cannot find a course with the id of ${req.params.id}.`))
    }

    // owner of the course must be the user who is currently logged in
    if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User is not authorized to update this course id: ${course_id}.`, 403))
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
        new: true, // returns new version of the course
        runValidators: true
    })

    res.status(200).json({
        success: true,
        data: course
    })
})

// @desc delete one course
// @route DELETE /api/vi/courses/:id
// @access Private
exports.deleteCourse = asyncHandler(async (req, res, next) => {
    const course = await Course.findById(req.params.id)
    if (!course) {
        return next(new ErrorResponse(`Cannot find a course with the id of ${req.params.id}.`))
    }

    // owner of the course must be the user who is currently logged in
    if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User is not authorized to delete this course (id: ${course_id}).`, 403))
    }

    await course.remove()

    res.status(200).json({
        success: true,
        data: {}

    })
})

// delete one course