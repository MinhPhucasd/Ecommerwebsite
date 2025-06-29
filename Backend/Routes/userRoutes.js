// Backend/Routes/userRoutes.js
const express = require('express');
const router = express.Router();
const {
    getUserProfile,
    updateUserProfile,
    changeUserPassword,
    getShippingAddresses,
    addShippingAddress,
    updateShippingAddress,
    deleteShippingAddress,
    setDefaultShippingAddress,
    adminGetAllUsers,    // <-- Import
    adminUpdateUser      // <-- Import
    // ... các hàm controller khác cho user
} = require('../Controllers/userController');
const { protect, admin } = require('../Middlewares/authMiddleware'); // Đảm bảo import cả protect và admin


router.get('/admin/all', protect, admin, adminGetAllUsers); // Giờ admin đã được định nghĩa
router.put('/admin/:userId/update', protect, admin, adminUpdateUser); // Giờ admin đã được định nghĩa

router.use(protect); // Áp dụng middleware 'protect' cho tất cả các route bên dưới từ đây

// Tất cả các route trong file này sẽ được bảo vệ (yêu cầu đăng nhập)


router.route('/profile')
    .get(getUserProfile)      // GET /api/users/profile
    .put(updateUserProfile);  // PUT /api/users/profile

router.put('/change-password', changeUserPassword); // PUT /api/users/change-password

router.route('/addresses')
    .get(getShippingAddresses)  // GET /api/users/addresses
    .post(addShippingAddress); // POST /api/users/addresses
    // .get(getShippingAddresses); // Sẽ thêm sau

router.route('/addresses/:addressId')
    .put(updateShippingAddress)
    .delete(deleteShippingAddress);

// admin 

router.use(protect); // Áp dụng middleware 'protect' cho tất cả các route bên dưới từ đây

router.get('/admin/all', protect, admin, adminGetAllUsers);
router.put('/admin/:userId/update', protect, admin, adminUpdateUser);


router.put('/addresses/:addressId/default', setDefaultShippingAddress);

module.exports = router;