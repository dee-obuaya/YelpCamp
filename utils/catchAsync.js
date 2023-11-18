module.exports = func => {
    return (req, res, next) => {
        func(req, res, next).catch(next);
    }
}

// Accepts a function and returns a function which executes the accepted function
// catches any errors if any and passes it to next

// Basically, it executes the route handlers and catches any unhandled error
