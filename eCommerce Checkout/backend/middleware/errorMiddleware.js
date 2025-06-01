// backend/middleware/errorMiddleware.js
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack, // Don't send stack trace in production
    });
    console.error(err.message); // Log the error message to the console
    if (process.env.NODE_ENV !== 'production') {
        console.error(err.stack); // Log stack trace in development
    }
};

module.exports = { notFound, errorHandler };