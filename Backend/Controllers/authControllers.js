// Backend/Controllers/authController.js
const { getDB } = require('../Config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler'); // Để bắt lỗi async
const { ObjectId } = require('mongodb');
const crypto = require('crypto');
const sendEmail = require('../Services/emailService'); 



// @desc    Đăng nhập Admin
// @route   POST /api/auth/admin/login
// @access  Public
const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password: inputPassword } = req.body;
    const db = getDB();
    console.log(`[LOGIN_ADMIN] Attempting login for email: ${email}`);

    if (!email || !inputPassword) {
        console.log('[LOGIN_ADMIN] Missing email or password in request.');
        res.status(400);
        throw new Error('Please provide email and password');
    }

    const adminUser = await db.collection('users').findOne({ email });

    if (!adminUser) {
        console.log(`[LOGIN_ADMIN] No user found with email: ${email}`);
        res.status(401);
        throw new Error('Invalid admin credentials or not an admin account');
        // Quan trọng: Thêm return ở đây để không chạy tiếp nếu không tìm thấy user
        return; // Thêm return
    }

    console.log(`[LOGIN_ADMIN] User found: ${adminUser.email}, Role: ${adminUser.role}`);
    console.log(`[LOGIN_ADMIN] Hashed password from DB: ${adminUser.password}`);
    console.log(`[LOGIN_ADMIN] Plain password from input (for bcrypt.compare): ${inputPassword}`); // Để xem mật khẩu nhập vào

    const passwordMatches = await bcrypt.compare(inputPassword, adminUser.password);
    console.log(`[LOGIN_ADMIN] Password comparison result for ${email}: ${passwordMatches}`);

    if (adminUser.role === 'admin' && passwordMatches) {
        console.log(`[LOGIN_ADMIN] Admin login successful for: ${email}`);
        const { password, ...userWithoutPassword } = adminUser;
        res.json({
            success: true,
            message: "Admin login successful",
            data: userWithoutPassword,
            token: generateToken(adminUser._id, adminUser.role),
        });
    } else {
        console.log(`[LOGIN_ADMIN] Login failed for ${email}. Role check: ${adminUser.role === 'admin'}. Password check: ${passwordMatches}.`);
        res.status(401);
        throw new Error('Invalid admin credentials or not an admin account');
    }
});
// @desc    Đăng ký người dùng mới
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, password, shippingAddress } = req.body;
    const db = getDB();

    // Kiểm tra đầu vào cơ bản
    if (!fullName || !email || !password || !shippingAddress) {
        res.status(400);
        throw new Error('Please add all fields');
    }

    // Kiểm tra xem người dùng đã tồn tại chưa
    const userExists = await db.collection('users').findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Băm mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo người dùng mới
    const newUser = {
        fullName,
        email,
        password: hashedPassword,
        shippingAddress,
        role: 'user', // Mặc định là user
        createdAt: new Date(),
    };

    const result = await db.collection('users').insertOne(newUser);
    const createdUser = await db.collection('users').findOne({ _id: result.insertedId });

    if (createdUser) {
        // Loại bỏ mật khẩu khỏi đối tượng user trả về
        const { password, ...userWithoutPassword } = createdUser;
        res.status(201).json({
            success: true,
            data: userWithoutPassword,
            token: generateToken(createdUser._id, createdUser.role), // Tạo token sau khi đăng ký thành công
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Đăng nhập người dùng
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password: inputPassword } = req.body; // Đổi tên biến password từ req.body để tránh nhầm lẫn
    const db = getDB();

    // Kiểm tra email và password có được cung cấp không
    if (!email || !inputPassword) {
        res.status(400);
        throw new Error('Please provide email and password');
    }

    // Tìm người dùng bằng email
    const user = await db.collection('users').findOne({ email });

    // Nếu tìm thấy người dùng và mật khẩu khớp
    if (user && (await bcrypt.compare(inputPassword, user.password))) {
        // Loại bỏ mật khẩu khỏi đối tượng user trả về
        const { password, ...userWithoutPassword } = user;
        res.json({
            success: true,
            data: userWithoutPassword,
            token: generateToken(user._id, user.role),
        });
    } else {
        res.status(401); // Unauthorized
        throw new Error('Invalid email or password');
    }
});

const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const db = getDB();
    

    if (!email) {
        res.status(400);
        throw new Error('Please provide an email address');
    }

    const user = await db.collection('users').findOne({ email });

    if (!user) {
        // Không báo lỗi "user not found" để tránh tiết lộ email nào đã đăng ký
        // Chỉ gửi thông báo thành công giả nếu muốn tăng cường bảo mật,
        // nhưng để đơn giản cho dev, có thể báo lỗi
        res.status(404);
        throw new Error('User with that email not found');
        // return res.status(200).json({ success: true, message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // 1. Tạo Reset Token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 2. Băm Reset Token trước khi lưu vào DB
    const hashedResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // 3. Đặt thời gian hết hạn cho token (ví dụ: 10 phút)
    const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút từ bây giờ

    // 4. Lưu hashedResetToken và thời gian hết hạn vào user document
    await db.collection('users').updateOne(
        { _id: user._id },
        {
            $set: {
                passwordResetToken: hashedResetToken,
                passwordResetExpires: passwordResetExpires,
            },
        }
    );

    // 5. Tạo URL Reset (để gửi qua email - trong trường hợp này, chúng ta sẽ log ra)
    // Trong ứng dụng thực tế, FRONTEND_URL nên là biến môi trường
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `Forgot your password? Click the link below to reset your password. This link is valid for 10 minutes.\n\n${resetUrl}\n\nIf you didn't request a password reset, please ignore this email.`;
    const htmlMessage = `
        <p>Forgot your password?</p>
        <p>Click the link below to reset your password. This link is valid for 10 minutes.</p>
        <a href="${resetUrl}" target="_blank">Reset Your Password</a>
        <p>If you didn't request a password reset, please ignore this email.</p>
    `;


    // 6. Gửi email (Trong ví dụ này, chúng ta log ra console)
    console.log('Password Reset URL (Normally sent via email):', resetUrl);
    // try {
    //   await sendEmail({
    //     email: user.email,
    //     subject: 'Password Reset Token (valid for 10 min)',
    //     message: `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetUrl}.\nIf you didn't forget your password, please ignore this email!`,
    //     // Hoặc HTML content với link
    //   });
    //   res.status(200).json({ success: true, message: 'Token sent to email!' });
    // } catch (err) {
    //   await db.collection('users').updateOne(
    //       { _id: user._id },
    //       { $set: { passwordResetToken: undefined, passwordResetExpires: undefined } }
    //   ); // Xóa token nếu gửi mail thất bại
    //   throw new Error('There was an error sending the email. Try again later!');
    // }

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your Password Reset Token (Valid for 10 Minutes)',
            message: message, // Nội dung text
            html: htmlMessage, // Nội dung HTML (đẹp hơn)
        });

        res.status(200).json({
            success: true,
            message: 'Password reset token has been sent to your email.',
        });
}   catch (err) {
    // Nếu gửi mail thất bại, nên xóa token đã tạo trong DB để tránh token mồ côi
        await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { passwordResetToken: undefined, passwordResetExpires: undefined } }
        );
    // console.error(err); // Đã log trong emailService
    // Ném lỗi để errorHandler chung xử lý, hoặc trả về lỗi cụ thể
        res.status(500);
        throw new Error('There was an error sending the password reset email. Please try again later.');
}

    res.status(200).json({
        success: true,
        message: 'Password reset token generated. Check console for reset URL (in real app, this would be emailed).',
        // Không trả về token cho client ở bước này
    });
    
});



// @desc    Lấy thông tin người dùng hiện tại (cần token)
// @route   GET /api/auth/me
// @access  Private
// const getMe = asyncHandler(async (req, res) => {
//     // req.user được gán từ middleware protect
//     const db = getDB();
//     // Tìm lại user từ DB để đảm bảo thông tin mới nhất (tùy chọn, có thể chỉ trả về req.user)
//     const user = await db.collection('users').findOne({ _id: new ObjectId(req.user.id) });

//     if (user) {
//         const { password, ...userWithoutPassword } = user;
//         res.status(200).json({ success: true, data: userWithoutPassword });
//     } else {
//         res.status(404);
//         throw new Error('User not found');
//     }
// });
const resetPassword = asyncHandler(async (req, res) => {
    const { resetToken } = req.params;
    const { password, confirmPassword } = req.body;
    const db = getDB();

    if (!password || !confirmPassword) {
        res.status(400);
        throw new Error('Please provide new password and confirm password');
    }

    if (password !== confirmPassword) {
        res.status(400);
        throw new Error('Passwords do not match');
    }

    if (password.length < 6) {
        res.status(400);
        throw new Error('Password must be at least 6 characters long');
    }

    const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    const user = await db.collection('users').findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
        res.status(400);
        throw new Error('Password reset token is invalid or has expired');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ... trong hàm resetPassword ...
    await db.collection('users').updateOne(
        { _id: user._id },
        {
            $set: {
                password: hashedPassword,
                passwordResetToken: undefined, // Xóa token
                passwordResetExpires: undefined, // Xóa thời gian hết hạn
            },
        }
    );

    res.status(200).json({
        success: true,
        message: 'Password has been reset successfully.',
    });
});




// Hàm tạo JWT
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Token hết hạn sau 30 ngày
    });
};


module.exports = {
    registerUser,
    loginUser,
    forgotPassword,    
    resetPassword,  
    loginAdmin, // <-- Thêm hàm mới vào exports   
    generateToken,
   // getMe,
};