const ErrorResponse = require('../utils/errorResponse')
const path = require('path')
const asyncHandler = require('../middleware/async_handler')
const geocoder = require('../utils/geocoder')

const Bootcamp = require("../models/Bootcamp")
const User = require('../models/User')

// @desc Get all bootcamps
// @route GET /api/v1/bootcamps
// @access Public
// @example Where averageCost is less than 10,000 return averageCost, career, location
// @example /api/v1/bootcamps?select=averageCost,careers,location.formattedAddress&averageCost[lt]=10000
exports.getBootcamps = asyncHandler(async (req, res, next) => {

    res.status(200).json(
        res.advancedResults
    )

})

// @desc Get single bootcamp
// @route GET /api/v1/bootcamps/:id
// @access Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {

    const bootcamp = await Bootcamp.findById(req.params.id).populate({
        path: 'courses',
        select: 'title description tuition'
    })

    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}.`, 404))
    }

    res.status(200).json({
        success: true,
        data: bootcamp
    })


})

// @desc Create new bootcamp
// @route POST /api/v1/bootcamps
// @access Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {

    // get the userId from the request and attach it to the body
    req.body.user = req.user.id

    // a user can only create one bootcamp. So we check to see if this user has created a bootcamp and, if so, return an error 
    const publishedBootcamp = await Bootcamp.findOne({
        user: req.user.id
    })

    // only an admin can create more than one bootcamp
    if (publishedBootcamp && req.user.role !== 'admin') {
        return next(
            new errorResponse('This user has alredy created a bootcamp. One bootcampe per user', 403)
        )
    }

    const bootcamp = await Bootcamp.create(req.body)
    res.status(201).json({
        success: true,
        data: bootcamp
    })

})

// @desc Update bootcamp
// @route PUT /api/v1/bootcamps/:id
// @access Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {

    let bootcamp = await Bootcamp.findById(req.params.id)

    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}.`, 404))
    }

    console.log('bootcamp: ', bootcamp)

    // Must be an ADMIN or OWNER of this bootcamp to update.
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.params.id} is not authorized to update this bootcamp.`, 401))
    }

    bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })


    res.status(200).json({
        success: true,
        data: bootcamp
    })

})

// @desc Delete bootcamp
// @route DELETE /api/v1/bootcamps/:id
// @access Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
    // NB findByIdAndDelete will NOT TRIGGER MIDDLEWARE
    const bootcamp = await Bootcamp.findById(req.params.id)

    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}.`, 404))
    }

    // Must be an ADMIN or OWNER of this bootcamp to update.
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.params.id} is not authorized to delete this bootcamp.`, 401))
    }


    bootcamp.remove()

    res.status(200).json({
        success: true,
        data: {}
    })

})

// @desc Find Bootcamps within a radius
// @route GET /api/v1/bootcamps/:zipcode/:distance
// @access Public
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {

    const {
        zipcode,
        distance
    } = req.params

    // get lat/lng from geocoder
    const loc = await geocoder.geocode(zipcode)
    const lat = loc[0].latitude
    const lng = loc[0].longitude
    // for testing: -71.525681 41.482445

    // calc radius using radians
    // divide distance by radius of the earth (miles)
    // radius of the earth is: 3,963m or 6,378km
    const radius = distance / 3963.2

    const bootcamps = await Bootcamp.find({
        location: {
            $geoWithin: {
                $centerSphere: [
                    [lng, lat], radius
                ]
            }
        }
    })

    res.status(200).json({
        success: true,
        count: bootcamps.length,
        data: bootcamps
    })

})


// @desc Upload Photo bootcamp
// @route PUT /api/v1/bootcamps/:id/photo
// @access Private
exports.uploadPhotoToBootcamp = asyncHandler(async (req, res, next) => {
    // NB findByIdAndDelete will NOT TRIGGER MIDDLEWARE
    const bootcamp = await Bootcamp.findById(req.params.id)

    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}.`, 404))
    }

    // Must be an ADMIN or OWNER of this bootcamp to add a photo.
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.params.id} is not authorized to add a photo to this bootcamp.`, 401))
    }


    // is a file uploaded
    if (!req.files) {
        return next(new ErrorResponse(`Please upload a photo for this bootcamp.`, 400))
    }

    // console.log(req.files.file)

    if (!req.files.file.mimetype.startsWith('image')) {
        return next(new ErrorResponse(`Please upload a photo image for this bootcamp.`, 400))
    }

    if (req.files.file.size > process.env.MAX_FILE_UPLOAD) {
        return next(new ErrorResponse(`Please upload a photo that is smaller than ${process.env.MAX_FILE_UPLOAD}.`, 500))
    }
    // give the file a unique name
    req.files.file.name = `Photo_${bootcamp._id}_${Math.floor((Math.random() * 9000) + 1000)}_${path.parse(req.files.file.name).ext}`

    // save file in public directory
    req.files.file.mv(`${process.env.FILE_UPLOAD_PATH}/${req.files.file.name}`, async err => {
        console.error(err)
        if (err)
            return next(
                new ErrorResponse('There was an error uploading your file.', 500)
            )

        await Bootcamp.findByIdAndUpdate(req.params.id, {
            photo: req.files.file.name
        })

        res.status(200).json({
            success: true,
            data: req.files.file.name
        })

    })



})