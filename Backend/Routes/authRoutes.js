// Backend/Routes/authRoutes.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const { registerUser, loginUser, forgotPassword, resetPassword, loginAdmin,generateToken } = require('../Controllers/authControllers'); // Import loginAdmin
const { protect } = require('../Middlewares/authMiddleware'); // Sẽ tạo middleware này



router.post('/admin/login', (req, res, next) => { // Tạm thời dùng middleware trực tiếp để log
    console.log(`[AUTHROUTES.JS] HIT POST /admin/login with body:`, req.body);
    loginAdmin(req, res, next); // Gọi handler gốc
});
router.post('/register', registerUser);
router.post('/login', loginUser);
//router.post('/admin/login', loginAdmin); // <-- ROUTE MỚI CHO ADMIN LOGIN
//const { registerUser, loginUser, forgotPassword, resetPassword, loginAdmin } = require('../Controllers/authControllers'); // Import loginAdmin
//router.get('/me', protect, getMe); // Bảo vệ route /me, chỉ user đã đăng nhập mới truy cập được

router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);




router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'] // Yêu cầu quyền truy cập profile và email
}));

router.get('/google/callback',
    passport.authenticate('google', {
        // failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`, // Điều hướng về frontend nếu thất bại
        session: false // Quan trọng: Chúng ta sẽ dùng JWT, không dùng session của Passport sau bước này
    }),
    (req, res) => {
        // Xác thực Google thành công, req.user chứa thông tin người dùng từ hàm done() của strategy
        if (!req.user) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_user_not_found`);
        }

        // Tạo JWT cho người dùng này
        const token = generateToken(req.user._id, req.user.role); // Sử dụng hàm generateToken đã có ở đầu file hoặc import

        // Điều hướng người dùng về frontend, đính kèm token
        // Frontend sẽ lấy token từ URL query parameter và xử lý
        // Có nhiều cách để truyền token, query param là một cách đơn giản
        res.redirect(`${process.env.FRONTEND_URL}/auth/google/success?token=${token}`);
    }
);

module.exports = router;