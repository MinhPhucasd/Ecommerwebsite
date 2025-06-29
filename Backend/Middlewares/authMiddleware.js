// Backend/Middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { getDB } = require('../Config/db');
const { ObjectId } = require('mongodb');

const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Kiểm tra xem header Authorization có tồn tại và bắt đầu bằng 'Bearer' không
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Lấy token từ header (Bỏ 'Bearer ')
            token = req.headers.authorization.split(' ')[1];

            // Xác minh token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Lấy thông tin người dùng từ token (không lấy password) và gán vào req.user
            // Chúng ta chỉ lưu id và role vào token, nên chỉ có thể lấy ra id và role
            // Nếu muốn lấy đầy đủ thông tin user (trừ password), bạn cần query DB
            // Tuy nhiên, cho mục đích xác thực, id từ token là đủ
            const db = getDB();
            const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.id) }, { projection: { password: 0 } });

            if (!user) {
                res.status(401);
                throw new Error('Not authorized, user not found');
            }
            req.user = user; // Gán toàn bộ thông tin user (trừ password) vào req.user

            next(); // Chuyển sang middleware/handler tiếp theo
        } catch (error) {
            console.error(error);
            res.status(401); // Unauthorized
            throw new Error('Not authorized, token failed');
        }
    }

    if (!token) {
        res.status(401); // Unauthorized
        throw new Error('Not authorized, no token');
    }
});

// (Tùy chọn) Middleware kiểm tra quyền admin
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403); // Forbidden
        throw new Error('Not authorized as an admin');
    }
};

module.exports = { protect, admin };