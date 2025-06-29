// Backend/Routes/discountRoutes.js
const express = require('express');
const router = express.Router();
const { createDiscountCode, applyDiscountCode } = require('../Controllers/discountController');
const { protect, admin } = require('../Middlewares/authMiddleware');

// Admin tạo mã giảm giá
router.post('/', protect, admin, createDiscountCode); // POST /api/discounts

// User áp dụng mã giảm giá
router.post('/apply', protect, applyDiscountCode); // POST /api/discounts/apply

module.exports = router;