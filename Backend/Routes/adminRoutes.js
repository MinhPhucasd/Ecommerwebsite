// Backend/Routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../Controllers/adminController');
const { protect, admin } = require('../Middlewares/authMiddleware');

// Tất cả các route trong file này đều cần quyền admin
router.use(protect, admin);

router.get('/dashboard/stats', getDashboardStats);
// Các route dashboard khác sẽ được thêm vào đây

module.exports = router;