const express = require('express')
const {
    getCourses,
    getCourse,
    createCourse,
    updateCourse,
    deleteCourse
} = require('../controllers/courses')
const {
    protect,
    authorizedRoles
} = require('../middleware/auth')

// for use with advancedResults - pagination, etc.
const Course = require('../models/Course')
const advancedResults = require('../middleware/advancedResults')

// *** mergeParams is required to use params from the bootcamps routes (-or other routes-)
// N.B. This router uses resources from /controllers/bootcamps
const router = express.Router({
    mergeParams: true
})

// the routes
router.route('/')
    .get(advancedResults(Course, {
        path: 'bootcamp',
        select: 'name description'
    }), getCourses)
    .post(protect, authorizedRoles('publisher', 'admin'), createCourse)

router.route('/:id')
    .get(getCourse)
    .put(protect, authorizedRoles('publisher', 'admin'), updateCourse)
    .delete(protect, authorizedRoles('publisher', 'admin'), deleteCourse)

module.exports = router