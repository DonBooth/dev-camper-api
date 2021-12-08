const mongoose = require('mongoose')

const ReviewSchema = mongoose.Schema({
    title: {
        type: String,
        trim: true,
        maxlength: 100,
        required: [true, 'Please enter a title for your review.']
    },
    text: {
        type: String,
        required: [true, 'Please enter your review.']
    },
    rating: {
        type: Number,
        min: 1,
        max: 10,
        required: [true, 'Please add your rating between 1 and 10.']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    bootcamp: {
        type: mongoose.Schema.ObjectId,
        ref: 'Bootcamp',
        required: true,
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
})

// prevent user from adding more than one review per bootcamp
ReviewSchema.index({
    bootcamp: 1,
    user: 1
}, {
    unique: true
})

// =====>>>>   Agregate.   <<<<<<<===========
// static method to get average tuition for courses in a bootcamp
ReviewSchema.statics.getAverageRating = async function (bootcampId) {

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
                    $avg: '$rating'
                }
            }
        }
    ])

    // add average cost to the Bootcamp Model
    try {
        await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
            averageCost: obj[0]
        })
    } catch (err) {
        console.log('error saving average tuition: ', err)
    }
}

// When you add or delete a COURSE we need to recalculate the average cost 
// Call getAverageCost after save -  in this case "post" means after
ReviewSchema.post('save', function () {
    // just runs the method
    this.constructor.getAverageRating(this.bootcamp)
})

// Call getAverageCost before remove
ReviewSchema.pre('remove', function () {
    this.constructor.getAverageRating(this.bootcamp)
})

module.exports = mongoose.model('Review', ReviewSchema)