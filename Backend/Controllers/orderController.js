// Backend/Controllers/orderController.js
const { getDB } = require('../Config/db');
const asyncHandler = require('express-async-handler');
const { ObjectId } = require('mongodb');
const sendEmail = require('../Services/emailService'); 


// @desc    Tạo đơn hàng mới
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
    const db = getDB();
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice, // Giá gốc của các items (trước thuế, ship, discount)
        taxPrice,
        shippingPrice,
        // totalPrice, // Bỏ totalPrice từ req.body, backend sẽ tự tính toán
        discountCode, // Mã giảm giá người dùng nhập
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items');
    }
    if (!shippingAddress || !paymentMethod || itemsPrice === undefined) { // Bỏ kiểm tra totalPrice ở đây
        res.status(400);
        throw new Error('Missing required order information');
    }

    // --- DI CHUYỂN LOGIC XỬ LÝ DISCOUNT VÀ TÍNH TOTALPRICE VÀO ĐÂY ---
    let calculatedTotalPrice = Number(itemsPrice) + (Number(taxPrice) || 0) + (Number(shippingPrice) || 0);
    let appliedDiscountAmount = 0;
    let appliedDiscountCodeDetails = null;

    if (discountCode) {
        const discount = await db.collection('discountcodes').findOne({ code: discountCode.toUpperCase(), isActive: true });
        if (discount && discount.uses < discount.maxUses && Number(itemsPrice) >= discount.minOrderAmount) {
            if (discount.discountType === 'percentage') {
                appliedDiscountAmount = (Number(itemsPrice) * discount.value) / 100;
            } else if (discount.discountType === 'fixed_amount') {
                appliedDiscountAmount = discount.value;
            }
            // Đảm bảo số tiền giảm không lớn hơn tổng tiền hàng (itemsPrice)
            appliedDiscountAmount = Math.min(appliedDiscountAmount, Number(itemsPrice));
            calculatedTotalPrice -= appliedDiscountAmount; // Trừ đi số tiền giảm giá
            appliedDiscountCodeDetails = { code: discount.code, amount: parseFloat(appliedDiscountAmount.toFixed(2)) };
        } else {
            console.warn(`Invalid or inapplicable discount code '${discountCode}' at order creation.`);
            // Bạn có thể chọn ném lỗi ở đây nếu muốn mã giảm giá không hợp lệ phải dừng quá trình đặt hàng
            // res.status(400);
            // throw new Error('Applied discount code is invalid or no longer applicable.');
        }
    }
    // --- KẾT THÚC LOGIC XỬ LÝ DISCOUNT ---


    const order = {
        user: new ObjectId(req.user._id),
        orderItems: orderItems.map(item => ({
            ...item,
            productId: new ObjectId(item.productId),
            // variantId: item.variantId ? new ObjectId(item.variantId) : undefined
        })),
        shippingAddress,
        paymentMethod,
        itemsPrice: Number(itemsPrice),
        taxPrice: Number(taxPrice) || 0,
        shippingPrice: Number(shippingPrice) || 0,
        discountApplied: appliedDiscountCodeDetails,
        totalPrice: parseFloat(calculatedTotalPrice.toFixed(2)), // Sử dụng giá đã tính toán
        orderStatus: 'Processing',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const result = await db.collection('orders').insertOne(order);
    const createdOrder = await db.collection('orders').findOne({ _id: result.insertedId });

    if (createdOrder) { // Chỉ gửi email nếu đơn hàng thực sự được tạo
        try {
            let customerEmail = createdOrder.shippingAddress.email; // Lấy email từ địa chỉ giao hàng của đơn hàng đã tạo
            // Nếu đơn hàng có user ID, và user đó có email, thì ưu tiên email của user
            if (createdOrder.user) {
                const orderUser = await db.collection('users').findOne({ _id: new ObjectId(createdOrder.user) });
                if (orderUser && orderUser.email) {
                    customerEmailForConfirmation = orderUser.email;
                }
            }

            if (customerEmail) {
                const emailSubject = `Your E-Shop Order Confirmation - #${createdOrder._id.toString().slice(-6)}`;
                let emailHtmlContent = `<h1>Thank you for your order!</h1>`;
                emailHtmlContent += `<p>Hi ${createdOrder.shippingAddress.fullName || 'Customer'},</p>`;
                emailHtmlContent += `<p>Your order #${createdOrder._id.toString().slice(-6)} has been placed successfully on ${new Date(createdOrder.createdAt).toLocaleDateString()}.</p>`;
                emailHtmlContent += `<h3>Order Summary:</h3><ul>`;
                createdOrder.orderItems.forEach(item => {
                    emailHtmlContent += `<li>${item.name} (Qty: ${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}</li>`;
                });
                emailHtmlContent += `</ul>`;

                // Hiển thị thông tin giảm giá nếu có trong đơn hàng đã tạo
                if (createdOrder.discountApplied && createdOrder.discountApplied.amount > 0) {
                    emailHtmlContent += `<p>Discount Applied (${createdOrder.discountApplied.code}): -$${createdOrder.discountApplied.amount.toFixed(2)}</p>`;
                }

                emailHtmlContent += `<p>Shipping: $${createdOrder.shippingPrice.toFixed(2)}</p>`;
                emailHtmlContent += `<h4>Total: $${createdOrder.totalPrice.toFixed(2)}</h4>`;

                let fullShippingAddress = `${createdOrder.shippingAddress.addressLine1}`;
                if (createdOrder.shippingAddress.apartment) fullShippingAddress += `, ${createdOrder.shippingAddress.apartment}`;
                fullShippingAddress += `, ${createdOrder.shippingAddress.city}`;
                if (createdOrder.shippingAddress.state) fullShippingAddress += `, ${createdOrder.shippingAddress.state}`; // Giả sử model order dùng 'state'
                fullShippingAddress += `, ${createdOrder.shippingAddress.postalCode}, ${createdOrder.shippingAddress.country}`;
                emailHtmlContent += `<p>Shipping Address: ${fullShippingAddress}</p>`;

                emailHtmlContent += `<p>We will notify you once your order has been shipped.</p>`;
                emailHtmlContent += `<p>Thanks,<br/>The E-Shop Team</p>`;

                const emailResult = await sendEmail({
                    to: customerEmail,
                    subject: emailSubject,
                    html: emailHtmlContent,
                    text: `Your order #${createdOrder._id.toString().slice(-6)} has been placed. Total: $${createdOrder.totalPrice.toFixed(2)}.`
                });

                if (emailResult.success) {
                    console.log(`Order confirmation email sent to ${customerEmail} for order ${createdOrder._id}. Message ID: ${emailResult.messageId}`);
                } else {
                    console.error(`Failed to send order confirmation email to ${customerEmail} for order ${createdOrder._id}. Error: ${emailResult.error}`);
                }
            } else {
                console.warn("Could not send order confirmation email: No customer email found for order", createdOrder._id);
            }
        } catch (emailError) {
            console.error("Error during email sending process for order", createdOrder._id, emailError);
        }
    }

    // --- BƯỚC 3.2: CẬP NHẬT SỐ LẦN SỬ DỤNG MÃ GIẢM GIÁ (Chỉ nếu có mã được áp dụng) ---
    // Biến appliedDiscountCodeDetails này phải được lấy từ logic xác thực coupon ở Bước 1 của hàm addOrderItems
    // và createdOrder.discountApplied phải tồn tại để xác nhận coupon thực sự đã được dùng cho đơn hàng này.
    if (createdOrder && appliedDiscountCodeDetails && createdOrder.discountApplied && appliedDiscountCodeDetails.code === createdOrder.discountApplied.code) {
        try {
            console.log(`Attempting to update usage for discount code: ${appliedDiscountCodeDetails.code}`);
            const discountUpdateResult = await db.collection('discountcodes').updateOne(
                { code: appliedDiscountCodeDetails.code }, // Tìm đúng mã coupon
                { $inc: { uses: 1 } }                     // Tăng số lần sử dụng lên 1
            );

            if (discountUpdateResult.modifiedCount === 1) {
                console.log(`Successfully incremented 'uses' count for discount code: ${appliedDiscountCodeDetails.code}`);
            } else if (discountUpdateResult.matchedCount === 1 && discountUpdateResult.modifiedCount === 0) {
                console.warn(`Discount code ${appliedDiscountCodeDetails.code} was matched but 'uses' count was not incremented. It might have been updated by another process or already reached max uses if not checked prior.`);
            } else {
                console.error(`Failed to find or update usage count for discount code: ${appliedDiscountCodeDetails.code}. Matched: ${discountUpdateResult.matchedCount}, Modified: ${discountUpdateResult.modifiedCount}`);
            }
        } catch (discountUpdateError) {
            console.error(`Error updating discount code usage for ${appliedDiscountCodeDetails.code}:`, discountUpdateError);
            // Đây là lỗi cần được theo dõi, vì có thể dẫn đến việc mã giảm giá được dùng quá số lần cho phép.
        }
    } else if (createdOrder && appliedDiscountCodeDetails && (!createdOrder.discountApplied || appliedDiscountCodeDetails.code !== createdOrder.discountApplied.code)) {
        // Trường hợp này cảnh báo có sự không nhất quán giữa coupon được validate và coupon được lưu vào đơn hàng
        console.warn(`Mismatch or missing applied discount in createdOrder for code ${appliedDiscountCodeDetails.code}. Discount code usage not updated.`);
    }
    

    // TODO: Cập nhật tồn kho sản phẩm
    // TODO: Xóa giỏ hàng của người dùng

    res.status(201).json({ success: true, data: createdOrder });
});


// @desc    Lấy lịch sử đơn hàng của người dùng đã đăng nhập
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
    const db = getDB();
    const orders = await db.collection('orders')
        .find({ user: new ObjectId(req.user._id) })
        .sort({ createdAt: -1 })
        .toArray();

    res.status(200).json({ success: true, count: orders.length, data: orders });
});


// @desc    Lấy chi tiết một đơn hàng theo ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
    const db = getDB();
    const orderId = req.params.id;

    if (!ObjectId.isValid(orderId)) {
        res.status(400); throw new Error('Invalid order ID format');
    }

    const order = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });

    if (order) {
        if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            res.status(403);
            throw new Error('Not authorized to view this order');
        }
        res.status(200).json({ success: true, data: order });
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// Các hàm API khác cho Order (cập nhật trạng thái, thanh toán, lấy tất cả đơn hàng cho admin) sẽ được thêm vào đây.

const adminGetAllOrders = asyncHandler(async (req, res) => {
    const db = getDB();
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // TODO: Thêm logic lọc nếu cần (theo status, date range, user, etc.)
    let queryFilter = {};
    if (req.query.status) {
        queryFilter.orderStatus = req.query.status;
    }
    // Ví dụ lọc theo email người dùng (nếu cần)
    // if (req.query.userEmail) {
    //     const user = await db.collection('users').findOne({ email: req.query.userEmail });
    //     if (user) {
    //         queryFilter.user = user._id;
    //     } else {
    //         // Không tìm thấy user, trả về mảng rỗng
    //         return res.status(200).json({ success: true, count: 0, pagination: { currentPage: 1, totalPages: 0, totalOrders: 0, limit }, data: [] });
    //     }
    // }


    const totalOrders = await db.collection('orders').countDocuments(queryFilter);
    const totalPages = Math.ceil(totalOrders / limit);

    const orders = await db.collection('orders')
        .find(queryFilter)
        .sort({ createdAt: -1 }) // Sắp xếp đơn hàng mới nhất lên đầu
        .skip(skip)
        .limit(limit)
        .toArray();

    res.status(200).json({
        success: true,
        count: orders.length,
        pagination: {
            currentPage: page,
            totalPages: totalPages,
            totalOrders: totalOrders,
            limit: limit,
            ...(page < totalPages && { nextPage: page + 1 }),
            ...(page > 1 && { prevPage: page - 1 })
        },
        data: orders
    });
});

// @desc    Admin: Cập nhật trạng thái đơn hàng
// @route   PUT /api/orders/admin/:id/status
// @access  Private/Admin
const adminUpdateOrderStatus = asyncHandler(async (req, res) => {
    const db = getDB();
    const orderId = req.params.id;
    const { status } = req.body; // Trạng thái mới gửi từ admin

    if (!ObjectId.isValid(orderId)) {
        res.status(400); throw new Error('Invalid order ID format');
    }

    // Các trạng thái hợp lệ (ví dụ)
    const validStatuses = ['Processing', 'Shipped', 'Out For Delivery', 'Delivered', 'Cancelled', 'Refunded'];
    if (!status || !validStatuses.includes(status)) {
        res.status(400);
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const order = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Cập nhật trạng thái và thêm vào lịch sử trạng thái (nếu bạn có trường statusHistory)
    const updateResult = await db.collection('orders').updateOne(
        { _id: new ObjectId(orderId) },
        {
            $set: {
                orderStatus: status,
                updatedAt: new Date(),
                // Nếu orderStatus là 'Delivered', có thể cập nhật deliveredAt
                ...(status === 'Delivered' && { deliveredAt: new Date() }),
                // Nếu orderStatus là 'Shipped', có thể yêu cầu trackingNumber
            },
            // $push: { // Ví dụ thêm vào lịch sử
            //     statusHistory: {
            //         status: status,
            //         timestamp: new Date(),
            //         updatedBy: req.user._id // Admin ID
            //     }
            // }
        }
    );

    if (updateResult.matchedCount === 0) {
        res.status(404); throw new Error('Order not found during update');
    }
    if (updateResult.modifiedCount === 0 && updateResult.matchedCount === 1) {
        return res.status(200).json({ success: true, message: 'Order status is already ' + status, data: order });
    }
    
    const updatedOrder = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });

    // TODO: Gửi email thông báo cho khách hàng về việc cập nhật trạng thái đơn hàng (tùy chọn)
    // if (updatedOrder && updatedOrder.shippingAddress && updatedOrder.shippingAddress.email) {
    // try {
    //     await sendEmail({
    //         to: updatedOrder.shippingAddress.email,
    //         subject: `Your Order #${updatedOrder._id.toString().slice(-6)} has been Updated`,
    //         html: `<p>Hi ${updatedOrder.shippingAddress.fullName},</p>
    //                <p>The status of your order #${updatedOrder._id.toString().slice(-6)} is now: <strong>${status}</strong>.</p>
    //                <p>Thank you for shopping with us!</p>`,
    //         text: `Your order #${updatedOrder._id.toString().slice(-6)} status is now: ${status}.`
    //     });
    //     console.log(`Status update email sent for order ${updatedOrder._id}`);
    // } catch (emailError) {
    //     console.error(`Failed to send status update email for order ${updatedOrder._id}:`, emailError);
    // }
    // }


    res.status(200).json({
        success: true,
        message: 'Order status updated successfully',
        data: updatedOrder
    });
});

module.exports = {
    addOrderItems,
    getMyOrders,
    getOrderById,
     adminGetAllOrders,        // <--- HÀM MỚI
    adminUpdateOrderStatus,   // <--- HÀM MỚI
};