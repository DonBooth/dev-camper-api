// a function inside of a function
const advancedResults = (model, populate) => async (req, res, next) => {
    let query

    // copy req.query - spread operator - it's a discrete copy. Changes to reqQuery do not change req.query
    const reqQuery = {
        ...req.query
    }

    // fields to exculde
    const removeFields = ['select', 'sort', 'page', 'limit']

    // loop over removeFields and delete them from the requestQuery
    removeFields.forEach(param => delete reqQuery[param])

    // create query string - JSON to string
    let queryStr = JSON.stringify(reqQuery)

    // create operators like $gt, $gte, etc.
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`) // same as: "$" + ${match}

    // find resource  - string to JSON
    queryStr = JSON.parse(queryStr)
    // if you only want to select "title" query = model.find(queryStr).populate({ path: 'courses', select: 'title'})
    // give you all the info on each course:
    query = model.find(queryStr)
    // Select Fields
    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ')
        query = query.select(fields)
    }

    // Sort
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ')
        query = query.sort(sortBy)
    } else {
        query = query.sort('name') // -name would be sort from last to first
    }

    // PAGINATION
    const page = parseInt(req.query.page, 10) || 1
    const limit = parseInt(req.query.limit, 10) || 10 // limits the results per page
    const startIndex = (page - 1) * limit
    const endIndex = page * limit
    const totalDocuments = await model.countDocuments()

    query = query.skip(startIndex).limit(limit)

    if (populate) {
        query = query.populate(populate)
    }

    const results = await query

    // paggination results
    const pagination = {}
    if (endIndex < totalDocuments) {
        pagination.next = {
            page: page + 1,
            limit
        }
    }

    if (startIndex > 0) {
        pagination.prev = {
            page: page - 1,
            limit
        }
    }

    res.advancedResults = {
        success: true,
        count: results.length,
        pagination,
        data: results
    }

    next()


}

module.exports = advancedResults