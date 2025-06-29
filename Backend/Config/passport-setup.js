// Backend/Config/passport-setup.js (Hoặc tên file khác)
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { getDB } = require('./db'); // Hoặc đường dẫn đúng đến file db.js
const { ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken'); // Thêm import jwt nếu chưa có ở đây
// Giả sử bạn có hàm generateToken từ authController
// const { generateToken } = require('../Controllers/authController'); // Cần điều chỉnh để tránh circular dependency nếu đặt generateToken ở đó

// Hàm tạo JWT (bạn có thể đặt hàm này ở một file utils riêng)
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};


passport.serializeUser((user, done) => {
    // Lưu id của user vào session
    done(null, user._id.toString());
});

passport.deserializeUser(async (id, done) => {
    // Lấy user từ DB dựa trên id đã lưu trong session
    try {
        const db = getDB();
        const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});
console.log("Attempting to use GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID); // Thêm log này
console.log("Attempting to use GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "Defined" : "NOT DEFINED"); // Thêm log này
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/api/auth/google/callback', // Phải khớp với Authorized redirect URI trên Google Cloud Console
            scope: ['profile', 'email'] // Yêu cầu quyền truy cập profile và email
        },
        async (accessToken, refreshToken, profile, done) => {
            // Hàm này được gọi sau khi Google xác thực thành công
            // profile chứa thông tin người dùng từ Google
            const db = getDB();
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
            const googleId = profile.id;
            const fullName = profile.displayName;
            const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null; // Lấy ảnh đại diện nếu cần

            if (!email) {
                return done(new Error('Failed to get email from Google.'), null);
            }

            try {
                let user = await db.collection('users').findOne({ email: email });

                if (user) {
                    // Người dùng đã tồn tại, có thể cập nhật googleId nếu chưa có
                    if (!user.googleId) {
                        await db.collection('users').updateOne({ _id: user._id }, { $set: { googleId: googleId } });
                        user.googleId = googleId; // Cập nhật local user object
                    }
                    // Đăng nhập thành công
                    return done(null, user); // Truyền user vào hàm done
                } else {
                    // Người dùng chưa tồn tại, tạo người dùng mới
                    // Theo yêu cầu đề bài, khi đăng ký chỉ cần email, full name, shipping address
                    // Chúng ta có email, fullName từ Google. Cần có cách lấy shippingAddress
                    // Hoặc: Sau khi đăng nhập bằng Google lần đầu, chuyển hướng người dùng đến trang yêu cầu nhập shippingAddress
                    // Hoặc: Đặt một giá trị mặc định/ trống cho shippingAddress và cho phép người dùng cập nhật sau.

                    const newUser = {
                        googleId: googleId,
                        fullName: fullName,
                        email: email,
                         avatar: avatar,
                        // password: Sẽ không có password cho user đăng nhập bằng Google
                        role: 'user', // Mặc định
                        // shippingAddress: 'Cần cập nhật', // Hoặc null
                        
                        shippingAddress: null, // Tạm thời để null, người dùng cập nhật sau
                        createdAt: new Date(),
                        emailVerified: true // Email từ Google được coi là đã xác thực
                    };
                    // Quan trọng: Theo đề bài, đăng ký cần shippingAddress.
                    // Bạn cần xử lý việc này. Có thể:
                    // 1. Sau khi callback, nếu user mới, chuyển hướng frontend tới trang yêu cầu nhập thêm shippingAddress.
                    // 2. Hoặc, nếu bạn không muốn phức tạp, có thể cho phép shippingAddress là null ban đầu.
                    //    Tuy nhiên, điều này có thể không đúng 100% với yêu cầu "When creating an account, users only enter their email, full name and shipping address."
                    //    Nhưng với social login, việc lấy shipping address trực tiếp từ Google không phải lúc nào cũng có.
                    //    Một giải pháp là sau khi Google callback thành công và xác định đây là user mới,
                    //    bạn không tạo user ngay mà trả về một trạng thái/token đặc biệt cho frontend,
                    //    frontend sẽ hiển thị form yêu cầu nhập shippingAddress rồi mới gửi request hoàn tất đăng ký.

                    // Giả sử chúng ta tạm thời cho phép shippingAddress là null/undefined để đơn giản hóa
                    const result = await db.collection('users').insertOne(newUser);
                    const createdUser = await db.collection('users').findOne({ _id: result.insertedId });
                    return done(null, createdUser);
                }
            } catch (err) {
                return done(err, null);
            }
        }
    )
);