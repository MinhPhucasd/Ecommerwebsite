// Backend/Controllers/adminController.js
const asyncHandler = require('express-async-handler');
const { getDB } = require('../Config/db');
const { ObjectId } = require('mongodb');

// @desc    Admin: Lấy thống kê tổng quan cho Dashboard
// @route   GET /api/admin/dashboard/stats
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
    const db = getDB();

    // Lấy khoảng thời gian (ví dụ: tháng hiện tại, hoặc 30 ngày qua)
    // Tạm thời lấy tất cả để đơn giản hóa
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalOrders = await db.collection('orders').countDocuments({}); // Tổng tất cả đơn
    const recentOrdersCount = await db.collection('orders').countDocuments({ createdAt: { $gte: thirtyDaysAgo }});

    const totalSalesData = await db.collection('orders').aggregate([
        { $match: { orderStatus: 'Delivered' } }, // Chỉ tính đơn đã giao thành công
        { $group: { _id: null, totalAmount: { $sum: '$totalPrice' } } }
    ]).toArray();
    const totalSales = totalSalesData.length > 0 ? totalSalesData[0].totalAmount : 0;

    const cancelledOrders = await db.collection('orders').countDocuments({ orderStatus: 'Cancelled' });

    // Total Users (thay vì visitors)
    const totalUsers = await db.collection('users').countDocuments({ role: 'user' }); // Chỉ đếm user thường

    // Dữ liệu % thay đổi có thể phức tạp, tạm thời bỏ qua
    res.json({
        success: true,
        data: {
            totalVisitors: totalUsers, // Tạm dùng totalUsers
            orders: totalOrders, // Hoặc recentOrdersCount nếu muốn
            sales: totalSales,
            cancelledOrders: cancelledOrders,
            // Mockup % change
            visitorsChange: Math.floor(Math.random() * 10) * (Math.random() > 0.5 ? 1 : -1), // +/- ngẫu nhiên
            ordersChange: Math.floor(Math.random() * 10) * (Math.random() > 0.5 ? 1 : -1),
            salesChange: Math.floor(Math.random() * 10) * (Math.random() > 0.5 ? 1 : -1),
            cancelledOrdersChange: Math.floor(Math.random() * 10) * (Math.random() > 0.5 ? 1 : -1),
        }
    });
});

module.exports = {
    getDashboardStats,
};