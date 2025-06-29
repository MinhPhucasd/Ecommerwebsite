// Backend/Routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const {
    getCart,
    addItemToCart,
    removeItemFromCart,
    updateCartItemQuantity,
    clearCart
} = require('../Controllers/cartController');
const { protect } = require('../Middlewares/authMiddleware');

router.use(protect); // Tất cả các route giỏ hàng yêu cầu đăng nhập

router.route('/')
    .get(getCart)           // GET /api/cart - Lấy giỏ hàng
    .post(addItemToCart)    // POST /api/cart - Thêm/cập nhật item
    .delete(clearCart);     // DELETE /api/cart - Xóa toàn bộ giỏ hàng

router.delete('/item', removeItemFromCart); // DELETE /api/cart/item - Xóa/giảm số lượng 1 item
router.put('/item', updateCartItemQuantity);

module.exports = router;