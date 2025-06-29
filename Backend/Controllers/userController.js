// Backend/Controllers/userController.js
const { getDB } = require('../Config/db');
const asyncHandler = require('express-async-handler');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs'); // Cần cho việc thay đổi mật khẩu





const adminGetAllUsers = asyncHandler(async (req, res) => {
    const db = getDB();
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    let queryFilter = {
        // _id: { $ne: req.user._id } // Tùy chọn: Loại trừ admin đang đăng nhập khỏi danh sách
    };
    if (req.query.role) {
        queryFilter.role = req.query.role;
    }
    if (req.query.search) { // Tìm kiếm theo email hoặc tên
        const searchRegex = new RegExp(req.query.search, 'i');
        queryFilter.$or = [
            { email: searchRegex },
            { fullName: searchRegex }
        ];
    }

    const totalUsers = await db.collection('users').countDocuments(queryFilter);
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await db.collection('users')
        .find(queryFilter)
        .project({ password: 0 }) // Loại bỏ trường password
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

    res.status(200).json({
        success: true,
        count: users.length,
        pagination: {
            currentPage: page,
            totalPages: totalPages,
            totalUsers: totalUsers,
            limit: limit,
            ...(page < totalPages && { nextPage: page + 1 }),
            ...(page > 1 && { prevPage: page - 1 })
        },
        data: users
    });
});




const adminUpdateUser = asyncHandler(async (req, res) => {
    const db = getDB();
    const userIdToUpdate = req.params.userId;
    const { role, isActive } = req.body; // Admin có thể cập nhật role hoặc isActive

    if (!ObjectId.isValid(userIdToUpdate)) {
        res.status(400); throw new Error('Invalid user ID format');
    }

    // Không cho admin tự thay đổi vai trò của chính mình qua API này để tránh tự khóa
    if (req.user._id.toString() === userIdToUpdate && role && role !== req.user.role) {
         res.status(403);
         throw new Error('Admins cannot change their own role via this endpoint.');
    }


    const fieldsToUpdate = {};
    if (role) {
        if (!['user', 'admin'].includes(role)) { // Các vai trò hợp lệ
            res.status(400); throw new Error('Invalid role specified.');
        }
        fieldsToUpdate.role = role;
    }
    if (isActive !== undefined && typeof isActive === 'boolean') {
        fieldsToUpdate.isActive = isActive; // Thêm trường isActive vào model user nếu cần
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
        res.status(400); throw new Error('No update fields provided.');
    }
    fieldsToUpdate.updatedAt = new Date();

    const result = await db.collection('users').updateOne(
        { _id: new ObjectId(userIdToUpdate) },
        { $set: fieldsToUpdate }
    );

    if (result.matchedCount === 0) {
        res.status(404); throw new Error('User not found.');
    }

    const updatedUser = await db.collection('users').findOne(
        { _id: new ObjectId(userIdToUpdate) },
        { projection: { password: 0 } }
    );

    res.status(200).json({
        success: true,
        message: 'User updated successfully.',
        data: updatedUser
    });
});




// @desc    Lấy hồ sơ người dùng hiện tại (người đã đăng nhập)
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    // req.user được gán từ middleware protect
    // Thông tin user (trừ password) đã có sẵn trong req.user sau khi protect middleware chạy
    if (req.user) {
        res.status(200).json({
            success: true,
            data: req.user // req.user đã không chứa password do projection trong protect middleware
        });
    } else {
        res.status(404);
        throw new Error('User not found'); // Trường hợp này hiếm khi xảy ra nếu protect hoạt động đúng
    }
});

// @desc    Cập nhật hồ sơ người dùng hiện tại
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const db = getDB();
    const userId = req.user._id; // Lấy _id từ user đã được xác thực trong req.user

    const { fullName, shippingAddress } = req.body; // Chỉ cho phép cập nhật các trường này
    const fieldsToUpdate = {};

    if (fullName) fieldsToUpdate.fullName = fullName;
    if (shippingAddress) fieldsToUpdate.shippingAddress = shippingAddress;
    // Thêm các trường khác nếu cần, ví dụ: quản lý danh sách địa chỉ

    if (Object.keys(fieldsToUpdate).length === 0) {
        res.status(400);
        throw new Error('No fields to update provided');
    }

    const result = await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: fieldsToUpdate }
    );

    if (result.matchedCount === 0) {
        res.status(404);
        throw new Error('User not found during update');
    }

    const updatedUser = await db.collection('users').findOne(
        { _id: new ObjectId(userId) },
        { projection: { password: 0 } } // Luôn loại bỏ password khi trả về
    );

    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
    });
});

// @desc    Thay đổi mật khẩu người dùng hiện tại
// @route   PUT /api/users/change-password
// @access  Private
const changeUserPassword = asyncHandler(async (req, res) => {
    const db = getDB();
    const userId = req.user._id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        res.status(400);
        throw new Error('Please provide old and new passwords');
    }

    if (newPassword.length < 6) { // Ví dụ: yêu cầu mật khẩu mới ít nhất 6 ký tự
        res.status(400);
        throw new Error('New password must be at least 6 characters long');
    }

    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    if (!user) {
        res.status(404);
        throw new Error('User not found'); // Không nên xảy ra nếu protect hoạt động đúng
    }

    // Kiểm tra mật khẩu cũ
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
        res.status(401); // Unauthorized
        throw new Error('Incorrect old password');
    }

    // Băm mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Cập nhật mật khẩu mới
    await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { password: hashedNewPassword } }
    );

    res.status(200).json({
        success: true,
        message: 'Password changed successfully'
    });
});

const getShippingAddresses = asyncHandler(async (req, res) => {
    // req.user đã có thông tin user (bao gồm cả shippingAddresses nếu có)
    // từ middleware protect
    if (req.user && req.user.shippingAddresses) {
        res.status(200).json({
            success: true,
            data: req.user.shippingAddresses
        });
    } else {
        res.status(200).json({
            success: true,
            data: [] // Trả về mảng rỗng nếu chưa có địa chỉ nào
        });
    }
});
// Các hàm quản lý địa chỉ (Ví dụ cơ bản - bạn có thể làm phức tạp hơn với mảng địa chỉ)
// @desc    Thêm địa chỉ giao hàng mới
// @route   POST /api/users/addresses
// @access  Private
const addShippingAddress = asyncHandler(async (req, res) => {
    const db = getDB();
    const userId = req.user._id;
    const { label, addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;

    if (!addressLine1 || !city || !postalCode || !country) {
        res.status(400);
        throw new Error('Please provide addressLine1, city, postalCode, and country');
    }

    const newAddress = {
        _id: new ObjectId(), // Tạo ID mới cho địa chỉ
        label: label || '',
        addressLine1,
        addressLine2: addressLine2 || '',
        city,
        state: state || '',
        postalCode,
        country,
        isDefault: Boolean(isDefault) || false,
    };

    // Nếu isDefault là true, cập nhật các địa chỉ khác của user thành isDefault: false
    if (newAddress.isDefault) {
        await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: { "shippingAddresses.$[].isDefault": false } }
        );
    }

    const result = await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $push: { shippingAddresses: newAddress } }
    );

     if (result.matchedCount === 0) {
        res.status(404); throw new Error('User not found');
    }

    // Lấy lại user để trả về danh sách địa chỉ đã cập nhật
    const updatedUser = await db.collection('users').findOne(
        { _id: new ObjectId(userId) },
        { projection: { password: 0, shippingAddresses: 1 } } // Chỉ lấy shippingAddresses
    );

    res.status(201).json({
        success: true,
        message: 'Shipping address added successfully',
        data: updatedUser.shippingAddresses || []
    });
});

const updateShippingAddress = asyncHandler(async (req, res) => {
    const db = getDB();
    const userId = req.user._id;
    const addressIdToUpdate = req.params.addressId;
    const { label, addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;

    if (!ObjectId.isValid(addressIdToUpdate)) {
        res.status(400); throw new Error('Invalid address ID format');
    }

    const updateFields = {};
    if (label !== undefined) updateFields["shippingAddresses.$.label"] = label;
    if (addressLine1 !== undefined) updateFields["shippingAddresses.$.addressLine1"] = addressLine1;
    if (addressLine2 !== undefined) updateFields["shippingAddresses.$.addressLine2"] = addressLine2 || '';
    if (city !== undefined) updateFields["shippingAddresses.$.city"] = city;
    if (state !== undefined) updateFields["shippingAddresses.$.state"] = state || '';
    if (postalCode !== undefined) updateFields["shippingAddresses.$.postalCode"] = postalCode;
    if (country !== undefined) updateFields["shippingAddresses.$.country"] = country;
    if (isDefault !== undefined) updateFields["shippingAddresses.$.isDefault"] = Boolean(isDefault);


    if (Object.keys(updateFields).length === 0) {
        res.status(400); throw new Error('No fields to update provided');
    }

    // Nếu isDefault là true cho địa chỉ này, set tất cả địa chỉ khác thành false
    if (Boolean(isDefault)) {
        await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: { "shippingAddresses.$[].isDefault": false } } // Set tất cả về false trước
        );
        // Sau đó set địa chỉ hiện tại thành true (sẽ được thực hiện ở updateOne bên dưới)
        updateFields["shippingAddresses.$.isDefault"] = true;
    }


    const result = await db.collection('users').updateOne(
        { _id: new ObjectId(userId), "shippingAddresses._id": new ObjectId(addressIdToUpdate) },
        { $set: updateFields }
    );

    if (result.matchedCount === 0) {
        res.status(404); throw new Error('User or address not found');
    }
    if (result.modifiedCount === 0 && result.matchedCount === 1) {
        return res.status(200).json({ success: true, message: 'No changes made to the address.' });
    }

    const updatedUser = await db.collection('users').findOne(
        { _id: new ObjectId(userId) },
        { projection: { password: 0, shippingAddresses: 1 } }
    );

    res.status(200).json({
        success: true,
        message: 'Shipping address updated successfully',
        data: updatedUser.shippingAddresses || []
    });
});


// @desc    Xóa một địa chỉ giao hàng
// @route   DELETE /api/users/addresses/:addressId
// @access  Private
const deleteShippingAddress = asyncHandler(async (req, res) => {
    const db = getDB();
    const userId = req.user._id;
    const addressIdToDelete = req.params.addressId;

    if (!ObjectId.isValid(addressIdToDelete)) {
        res.status(400); throw new Error('Invalid address ID format');
    }

    const result = await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $pull: { shippingAddresses: { _id: new ObjectId(addressIdToDelete) } } }
    );

    if (result.matchedCount === 0) {
        res.status(404); throw new Error('User not found');
    }
    if (result.modifiedCount === 0) { // Không tìm thấy địa chỉ con để xóa
        res.status(404); throw new Error('Address not found or already deleted');
    }


    const updatedUser = await db.collection('users').findOne(
        { _id: new ObjectId(userId) },
        { projection: { password: 0, shippingAddresses: 1 } }
    );

    res.status(200).json({
        success: true,
        message: 'Shipping address deleted successfully',
        data: updatedUser.shippingAddresses || []
    });
});


const setDefaultShippingAddress = asyncHandler(async (req, res) => {
    const db = getDB();
    const userId = req.user._id;
    const addressIdToSetDefault = req.params.addressId;

    if (!ObjectId.isValid(addressIdToSetDefault)) {
        res.status(400); throw new Error('Invalid address ID format');
    }

    // 1. Set tất cả isDefault của các địa chỉ khác thành false
    await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { "shippingAddresses.$[].isDefault": false } }
    );

    // 2. Set isDefault của địa chỉ được chọn thành true
    const result = await db.collection('users').updateOne(
        { _id: new ObjectId(userId), "shippingAddresses._id": new ObjectId(addressIdToSetDefault) },
        { $set: { "shippingAddresses.$.isDefault": true } }
    );

    if (result.matchedCount === 0) {
        res.status(404); throw new Error('User or address not found');
    }
     if (result.modifiedCount === 0 && result.matchedCount === 1) {
        // Có thể địa chỉ đó đã là default rồi
         return res.status(200).json({ success: true, message: 'Address is already the default or no change made.' });
    }


    const updatedUser = await db.collection('users').findOne(
        { _id: new ObjectId(userId) },
        { projection: { password: 0, shippingAddresses: 1 } }
    );

    res.status(200).json({
        success: true,
        message: 'Default shipping address updated successfully',
        data: updatedUser.shippingAddresses || []
    });
});




// Bạn có thể thêm các hàm:
// - getShippingAddresses (GET /api/users/addresses)
// - updateShippingAddress (PUT /api/users/addresses/:addressId)
// - deleteShippingAddress (DELETE /api/users/addresses/:addressId)
// - setDefaultShippingAddress (PUT /api/users/addresses/:addressId/default)

module.exports = {
    getUserProfile,
    updateUserProfile,
    changeUserPassword,
    getShippingAddresses,
    addShippingAddress,
    updateShippingAddress, // Thêm mới
    deleteShippingAddress, // Thêm mới
    setDefaultShippingAddress,
    adminGetAllUsers,    // <-- Thêm hàm mới
    adminUpdateUser,     // <-- Thêm hàm mới
    // ... các hàm quản lý địa chỉ khác
};