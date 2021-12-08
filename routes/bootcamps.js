const express = require('express')
const router = express.Router()
const {
     protect,
     authorizedRoles
} = require('../middleware/auth')

const {
     getBootcamp,
     getBootcamps,
     createBootcamp,
     updateBootcamp,
     deleteBootcamp,
     getBootcampsInRadius,
     uploadPhotoToBootcamp
} = require('../controllers/bootcamps')

const advancedResults = require('../middleware/advancedResults')
const Bootcamp = require('../models/Bootcamp')

// *** ===> Include other resource routers (eg. /routers/courses)
const courseRouter = require('./courses')
const reviewRouter = require('./reviews')

// *** ===> re-route to other resource routers - in this case it rerouts to the course router or reviews
router.use('/:bootcampId/courses', courseRouter)
router.use('/:bootcampId/reviews', reviewRouter)


// The Routes
router.route('/radius/:zipcode/:distance')
     .get(getBootcampsInRadius)

router.route('/')
     // note: using middleware for pagination and to populate the bootcamp model with the courses for that bootcamp
     .get(advancedResults(Bootcamp, 'courses'), getBootcamps)
     .post(protect, authorizedRoles('publisher', 'admin'), createBootcamp)

router.route('/:id/photo')
     .put(protect, authorizedRoles('publisher', 'admin'), uploadPhotoToBootcamp)

router.route('/:id')
     .get(getBootcamp)
     .put(protect, authorizedRoles('publisher', 'admin'), updateBootcamp)
     .delete(protect, authorizedRoles('publisher', 'admin'), deleteBootcamp)


module.exports = router