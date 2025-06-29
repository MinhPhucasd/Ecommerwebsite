// Backend/Routes/productRoutes.js
const express = require('express');
const router = express.Router();

// Import admin middleware
const { protect, admin } = require('../Middlewares/authMiddleware'); // Đảm bảo đường dẫn đúng

// Import các hàm controller
const {
  getAllProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  getNewProducts,
  getBestSellerProducts,
  getProductsByCategoryName,
  addProductReview,
} = require('../Controllers/productController');

// Định nghĩa các routes
router.route('/')
  .get(getAllProducts)   // GET /api/products - Có thể public hoặc chỉ cần protect
  .post(protect, admin, createProduct);  // POST /api/products - Chỉ Admin

router.route('/:id')
  .get(getProductById)    // GET /api/products/:id - Có thể public hoặc chỉ cần protect
  .put(protect, admin, updateProduct)     // PUT /api/products/:id - Chỉ Admin
  .delete(protect, admin, deleteProduct); // DELETE /api/products/:id - Chỉ Admin

router.route('/:id/reviews')
  .post(protect, addProductReview); // User có thể thêm review (cần đăng nhập)

// Các route này thường là public
router.get('/new', getNewProducts);
router.get('/bestsellers', getBestSellerProducts);
router.get('/category/:categoryName', getProductsByCategoryName);

module.exports = router;