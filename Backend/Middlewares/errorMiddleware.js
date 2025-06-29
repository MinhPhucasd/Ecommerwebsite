// Backend/Middlewares/errorMiddleware.js
const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode ? res.statusCode : 500; // Lấy status code từ res nếu có, ngược lại là 500

    res.status(statusCode);

    res.json({
        success: false,
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack, // Chỉ hiển thị stack trace ở môi trường dev
    });
};

module.exports = {
    errorHandler,
};