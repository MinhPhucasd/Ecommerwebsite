// Backend/Routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const {
    addOrderItems,
    getMyOrders,
    getOrderById,
    adminGetAllOrders,      // <--- IMPORT MỚI
    adminUpdateOrderStatus, // <--- IMPORT MỚI
} = require('../Controllers/orderController');
const { protect, admin } = require('../Middlewares/authMiddleware');

// Các route cần đăng nhập
router.use(protect);

router.route('/')
    .post(addOrderItems); // POST /api/orders (Tạo đơn hàng mới)
router.route('/myorders')
    .get(protect, getMyOrders);
router.route('/:id')
    .get(protect, getOrderById);

router.get('/myorders', getMyOrders); // GET /api/orders/myorders (Lịch sử đơn hàng của tôi)

router.get('/:id', getOrderById);    // GET /api/orders/:id (Chi tiết một đơn hàng)

// Các route cho Admin (ví dụ)
router.get('/admin/all', protect, admin, adminGetAllOrders); // Lấy tất cả đơn hàng
router.put('/admin/:id/status', protect, admin, adminUpdateOrderStatus); // Cập nhật trạng thái

module.exports = router;