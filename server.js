//   How to load external javascript
{
    /* <head>
      <title><%= name %></title>
      <script src="../javascripts/p5/p5.js"></script>
      <script src="../javascripts/p5/addons/p5.dom.js"></script>
      <script src="../javascripts/p5/addons/p5.sound.js"></script>
      <% for(var i = 0; i < extraScripts.length; i++) { %>
        <script src="<%= "../javascripts/" + extraScripts[i]%>" ></script>
      <% }%>
      <script src="<%= "../javascripts/experiments/"+name + "/sketch.js"%>"></script>
      <style> body {padding: 0; margin: 0;} </style>
    </head> */
}

const express = require('express')
const dotenv = require('dotenv')
const fileUpload = require('express-fileupload')
const path = require('path')
const morgan = require('morgan')
const errorHandler = require('./middleware/error_handler')
const cookieParser = require('cookie-parser')
// safety & protection
const mongoSanitize = require('express-mongo-sanitize')
const helmet = require('helmet')
const xssClean = require('xss-clean')
const hpp = require('hpp')
const expressRateLimit = require('express-rate-limit')
const cors = require('cors')


const connectDB = require('./config/db')

//      Import MIDDLEWARE

// Load env vars
dotenv.config({
    path: './config/config.env'
})

// connect to database
connectDB()


// Route files
const bootcamps = require('./routes/bootcamps')
const courses = require('./routes/courses')
const auth = require('./routes/auth')
const users = require('./routes/users')
const reviews = require('./routes/reviews')

const app = express()

// Middleware
if (process.env.NODE_ENV == 'development') {
    app.use(morgan('dev'))
}

//      MIDDLEWARE

// file upload middleware
app.use(fileUpload())

// parse and handle cookies
app.use(cookieParser())

// Body parser ***
app.use(express.json())

// define static folder
app.use(express.static(path.join(__dirname, 'public')))

//      Safety & Protection
// sanitize input
// removes input starting with $ or containing .
// it removes them from: req.body, req.query req.params
// and must run AFTER body parser aka. express.json
app.use(mongoSanitize())
// set security headers
app.use(helmet({
    contentSecurityPolicy: false,
}))
// prevent cross site scripting
app.use(xssClean())
app.use(hpp())
const rateLimiter = expressRateLimit({
    windowMs: 10 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
})
app.use(rateLimiter)
app.use(cors())

// set template engine
app.set('view engine', 'ejs')


// Mount Routers
app.use('/api/v1/bootcamps', bootcamps)
app.use('/api/v1/courses', courses)
app.use('/api/v1/auth', auth)
app.use('/api/v1/users', users)
app.use('/api/v1/reviews', reviews)
app.get('/', function (req, res) {
    res.render('pages/index')
})

// Error Handler - must come after router to catch mistakes from router
app.use(errorHandler)


const PORT = process.env.PORT || 5000

const server = app.listen(
    PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}.`))

// handle unhandled promise error on server
process.on('unhandledRejection', (err, Promise) => {
    console.log(`Unhandled Server error - promise: ${ err }`)
    // close server and exit process
    server.close(() => process.exit(1))
})