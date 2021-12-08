const mongoose = require('mongoose')
const geocoder = require('../utils/geocoder')
const slugify = require('slugify')

const BootcampSchema = new mongoose.Schema({
        name: {
            type: String,
            required: [true, 'Please add a name'],
            unique: true,
            trim: true,
            maxLength: [50, 'Name cannot be more than 50 characters']
        },
        slug: String,
        description: {
            type: String,
            required: true,
            trim: true,
            maxLength: [500, 'Name cannot be more than 500 characters']
        },
        website: {
            type: String,
            match: [
                /^(https?|chrome):\/\/[^\s$.?#].[^\s]*$/,
                'Please use a valid URL.'
            ]
        },
        phone: {
            type: String,
            maxLength: [20, 'Phone number cannot be longer than 20 characters.'],
            match: [/^[0-9\-\(\)\+\s]+$/,
                'Only numbers and - allowed.'
            ]
        },
        email: {
            type: String,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,5})+$/,
                'Please enter a valid email.'
            ]
        },
        address: {
            type: String,
            required: [true, 'Please enter an address.']
        },
        location: {
            // GeoJSON Point
            type: {
                type: String,
                enum: ['Point']
            },
            coordinates: {
                type: [Number],
                index: '2dsphere'
            },
            formattedAddress: String,
            street: String,
            city: String,
            state: String,
            zipcode: String,
            country: String
        },
        careers: {
            // Array of strings
            type: [String],
            required: true,
            enum: [
                'Web Development',
                'Mobile Development',
                'Business',
                'UI/UX',
                'Data Science',
                'Other'
            ]
        },
        averageRating: {
            type: Number,
            min: [1, 'Rating must be at least 1'],
            max: [10, 'Rating must not be more than 10']
        },

        averageCost: Number,

        photo: {
            type: String,
            default: 'no-photo.jpg'
        },
        housing: {
            type: Boolean,
            default: false
        },
        jobAssistance: {
            type: Boolean,
            default: false
        },
        jobGuarantee: {
            type: Boolean,
            default: false
        },
        acceptGI: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true
        }
    }, {
        //  Needed for VIRTUALS ===================
        toJSON: {
            virtuals: true
        },
        toObject: {
            virtuals: true
        }
    }

)

//  for geojson
const pointSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Point'],
        required: true
    },
    coordinates: {
        type: [Number],
        required: true
    }
});

// create bootcamp slug from the name
BootcampSchema.pre('save', function (next) {
    this.slug = slugify(this.name, {
        lower: true,
        trim: true
    })
    next()
})

// geocode and create location field
BootcampSchema.pre('save', async function (next) {
    const loc = await geocoder.geocode(this.address)
    this.location = {
        // type: Point,
        coordinates: [loc[0].longitude, loc[0].latitude],
        formattedAddress: loc[0].formattedAddress,
        street: loc[0].streetName,
        city: loc[0].city,
        state: loc[0].stateCode,
        zipcode: loc[0].zipcode,
        country: loc[0].countryCode
    }

    // do not save formattedAddress in the DB
    this.address = undefined
    next()
})

// Delete 'courses' when their bootcamp is deleted - cascade delete
BootcampSchema.pre('remove', async function (next) {
    await this.model('Course').deleteMany({
        bootcamp: this._id
    })
    next()
})

// ====>>         Reverse Populate with virtuals      <<======
//  Also please note that to get this to work we add an object at the end of BootcampSchema where we have "toObject" and "doJSON"
//  To complete the virtual. That is, to use it, in the Bootcamps Controller, where you get one or many bootcamps you need to populate the query. eg: Bootcamp.find(JSON.parse(queryStr)).populate({  path: 'courses',select: 'title'})
//  and if you want all info on all of the fields for each course just: Bootcamp.find(JSON.parse(queryStr)).populate('courses')
BootcampSchema.virtual('courses', { // the name of the virtual field that we are creating is 'courses'
    ref: 'Course', // the model that we reference
    localField: '_id', // we use this local field to look in the 'bootcamp' field in the Course
    foreignField: 'bootcamp', // where we match the _id
    justOne: false // and get all of them.
})


module.exports = mongoose.model('Bootcamp', BootcampSchema)