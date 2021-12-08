const mongoose = require('mongoose')

const CourseSchema = mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: [true, 'Please enter a course title.']
    },
    description: {
        type: String,
        required: [true, 'Please enter a course description.']
    },
    weeks: {
        type: Number,
        required: [true, 'Please enter the course duration in weeks.']
    },
    tuition: {
        type: Number,
        required: [true, 'Please enter the cost of tuition for this course']
    },
    minimumSkill: {
        type: String,
        required: [true, 'Please enter the skill level for this course'],
        enum: ['beginner', 'intermediate', 'advanced']
    },
    scholarshipAvaliable: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    bootcamp: {
        type: mongoose.Schema.ObjectId,
        ref: 'Bootcamp',
        required: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
})

// Agregate. <<<<<<<===========
// static method to get average tuition for courses in a bootcamp
CourseSchema.statics.getAverageCost = async function (bootcampId) {

    const obj = await this.aggregate([{
            // first: match all the courses from the same bootcamp by id
            $match: {
                bootcamp: bootcampId
            }
        },
        // Second: group them together and then average the cost.
        {
            $group: {
                _id: '$bootcamp',
                averageCost: {
                    $avg: '$tuition'
                }
            }
        }
    ])

    // add average cost to the Bootcamp Model
    try {
        await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
            averageCost: Math.floor(obj[0].averageCost / 10) * 10
        })
    } catch (err) {
        console.log('error saving average tuition: ', err)
    }
}

// When you add or delete a COURSE we need to recalculate the average cost 
// Call getAverageCost after save -  in this case "post" means after
CourseSchema.post('save', function () {
    // just runs the method
    this.constructor.getAverageCost(this.bootcamp)
})

// Call getAverageCost before remove
CourseSchema.pre('remove', function () {
    this.constructor.getAverageCost(this.bootcamp)
})

module.exports = mongoose.model('Course', CourseSchema)