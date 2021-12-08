const fs = require('fs')
const mongoose = require('mongoose')
const dotenv = require('dotenv')

// Load env vars
dotenv.config({
    path: './config/config.env'
})

// load models
const Bootcamp = require('./models/Bootcamp')
const Course = require('./models/Course')
const User = require('./models/User')
const Review = require('./models/Review')

// connect to database
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
})

// read json files
const bootcamps = JSON.parse(fs.readFileSync(`${__dirname}/_data/bootcamps.json`, 'utf-8'))
const courses = JSON.parse(fs.readFileSync(`${__dirname}/_data/courses.json`, 'utf-8'))
const users = JSON.parse(fs.readFileSync(`${__dirname}/_data/users.json`, 'utf-8'))
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/_data/reviews.json`, 'utf-8'))


// import data into database
const importData = async () => {
    try {
        await Bootcamp.create(bootcamps)
        await Course.create(courses)
        await User.create(users)
        await Review.create(reviews)
        console.log('bootcamp - course - user - review data imported')
        process.exit()
    } catch (err) {
        console.log(err)
    }
}

// destroy all data
const destroyData = async () => {
    try {
        await Bootcamp.deleteMany()
        await Course.deleteMany()
        await User.deleteMany()
        await Review.deleteMany()
        console.log('bootcamp data destroyed')
        process.exit()
    } catch (err) {
        console.log(err)
    }
}

// to use node -i or -d seeder
if (process.argv[2] === '-i') {
    importData()
} else if (process.argv[2] === '-d') {
    destroyData()
}