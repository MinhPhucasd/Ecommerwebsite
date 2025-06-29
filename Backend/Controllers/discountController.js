// Backend/Controllers/discountController.js
const { getDB } = require('../Config/db');
const asyncHandler = require('express-async-handler');
// const { ObjectId } = require('mongodb'); // Bạn có thể không cần ObjectId ở đây nếu không dùng trực tiếp _id

// @desc    Admin: Tạo mã giảm giá mới
// @route   POST /api/discounts  <-- Đây là comment mô tả route, KHÔNG phải code router.post()
// @access  Private/Admin
const createDiscountCode = asyncHandler(async (req, res) => {
    const db = getDB();
    const { code, discountType, value, maxUses, minOrderAmount } = req.body;

    // ... (toàn bộ logic của hàm createDiscountCode) ...

    const newDiscount = {
        code: code.toUpperCase(),
        discountType,
        value: Number(value),
        maxUses: Number(maxUses),
        uses: 0,
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
        isActive: true,
        createdAt: new Date()
    };

    const result = await db.collection('discountcodes').insertOne(newDiscount);
    const createdDiscount = await db.collection('discountcodes').findOne({ _id: result.insertedId });

    res.status(201).json({ success: true, data: createdDiscount });
});

// @desc    User: Áp dụng mã giảm giá
// @route   POST /api/discounts/apply <-- Đây là comment mô tả route
// @access  Private
const applyDiscountCode = asyncHandler(async (req, res) => {
    const db = getDB();
    const { code, currentOrderAmount } = req.body;

    // ... (toàn bộ logic của hàm applyDiscountCode) ...

    res.status(200).json({
        success: true,
        message: 'Discount code applied successfully',
        data: {
            code: discountCode.code, // discountCode phải được định nghĩa từ findOne
            discountAmount: parseFloat(discountAmount.toFixed(2)), // discountAmount phải được tính toán
            newTotal: parseFloat(newTotal.toFixed(2)), // newTotal phải được tính toán
            originalAmount: parseFloat(currentOrderAmount.toFixed(2))
        }
    });
});

// ... (Các hàm controller khác cho admin nếu có)

module.exports = {
    createDiscountCode,
    applyDiscountCode,
    // ... các hàm khác
};