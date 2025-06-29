// Backend/Routes/index.js
const express = require('express');
const router = express.Router();


// Import các router con
const productRoutes = require('./productRoutes');
const authRoutes = require('./authRoutes'); // Sẽ tạo sau
const userRoutes = require('./userRoutes'); 
const orderRoutes = require('./orderRoutes'); // <--- Đảm bảo đã import và tên file đúng
const cartRoutes = require('./cartRoutes');
const discountRoutes = require('./discountRoutes');
const adminRoutes = require('./adminRoutes'); // <-- THÊM IMPORT MỚI
// const userRoutes = require('./userRoutes');   // Sẽ tạo sau
// ... các router khác

// Mount các router con vào đường dẫn cơ sở
router.use('/products', productRoutes); // Tất cả các route trong productRoutes sẽ có tiền tố /products
router.use('/auth', authRoutes); // Đảm bảo authRoutes được mount vào '/auth'
router.use('/users', userRoutes);
router.use('/orders', orderRoutes); // Mount orderRoutes vào /orders
router.use('/cart', cartRoutes); // Mount cartRoutes vào /cart
router.use('/discounts', discountRoutes);
router.use('/admin', adminRoutes); 
// ...

module.exports = router;