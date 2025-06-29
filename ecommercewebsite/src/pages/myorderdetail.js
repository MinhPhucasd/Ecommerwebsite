// src/pages/myorderdetail.js
import React, { useState, useEffect } from 'react';
import { useParams, Link, NavLink, useNavigate } from 'react-router-dom';
import { getOrderDetails } from '../services/api';
import { useAuth } from '../context/authContext'; // Để xử lý loadingAuth
import './myorderdetail.css'; // Tạo file CSS này

function OrderDetailPage() {
    const { orderId } = useParams(); // Lấy orderId từ URL
    const { currentUser, loadingAuth } = useAuth();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (loadingAuth) return; // Chờ auth state ổn định

        if (!currentUser) { // Nếu chưa đăng nhập, không cho xem
            navigate('/login');
            return;
        }

        if (!orderId) {
            setError("Order ID is missing from URL.");
            setLoading(false);
            return;
        }

        const fetchOrderDetails = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await getOrderDetails(orderId);
                if (response.data.success) {
                    setOrder(response.data.data);
                } else {
                    setError(response.data.message || "Failed to fetch order details.");
                }
            } catch (err) {
                setError(err.response?.data?.message || "An error occurred while fetching order details.");
                console.error("Fetch order detail error:", err);
                if (err.response?.status === 403) { // Lỗi không có quyền xem
                    navigate('/my-orders'); // Hoặc trang lỗi
                    alert("You are not authorized to view this order.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [orderId, currentUser, loadingAuth, navigate]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString(); // Hiển thị cả ngày và giờ
    };

    if (loadingAuth || loading) {
        return <div className="order-detail-loading">Loading order details...</div>;
    }

    if (error) {
        return <div className="order-detail-error">Error: {error}</div>;
    }

    if (!order) {
        return <div className="order-detail-not-found">Order not found.</div>;
    }

    // Tính toán lại subtotal từ orderItems nếu cần, hoặc dùng itemsPrice từ order
    const orderSubtotal = order.orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <>
            {/* Header (Nên là component chung) */}
            <header className="order-detail-header">
                {/* ... (Header JSX tương tự các trang khác) ... */}
            </header>

            <div className="order-detail-container page-breadcrumb">
                <Link to="/">Home</Link> <span className="separator">/</span>
                <Link to="/account">My Account</Link> <span className="separator">/</span>
                <Link to="/my-orders">My Orders</Link> <span className="separator">/</span>
                <span>Order #{order._id.substring(0, 8)}...</span>
            </div>

            <main className="order-detail-container order-detail-main">
                <div className="order-summary-header">
                    <h2>Order Details - #{order._id}</h2>
                    <p>Order Placed: {formatDate(order.createdAt)}</p>
                </div>

                <div className="order-sections-wrapper">
                    {/* Order Items Section */}
                    <section className="order-items-section">
                        <h3>Items Ordered</h3>
                        {order.orderItems.map((item, index) => (
                            <div key={item.productId + (item.variantId || '') + index} className="order-item-card">
                                <img src={item.image || 'https://via.placeholder.com/70'} alt={item.name} className="order-item-image" />
                                <div className="order-item-details">
                                    <Link to={`/productdetail/${item.productId}`} className="item-name">{item.name}</Link>
                                    {/* Hiển thị variant attributes nếu có */}
                                    {item.variantAttributes && Object.keys(item.variantAttributes).length > 0 && (
                                        <small className="item-variant">
                                            {Object.entries(item.variantAttributes).map(([key, value]) => `${key}: ${value}`).join(', ')}
                                        </small>
                                    )}
                                    <p className="item-qty-price">Qty: {item.quantity} x ${item.price?.toFixed(2)}</p>
                                </div>
                                <p className="item-subtotal">${(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                        ))}
                    </section>

                    {/* Shipping & Payment Section */}
                    <section className="shipping-payment-section">
                        <div className="shipping-details-card">
                            <h3>Shipping Address</h3>
                            <p>{order.shippingAddress.fullName}</p>
                            <p>{order.shippingAddress.addressLine1}</p>
                            {order.shippingAddress.apartment && <p>{order.shippingAddress.apartment}</p>}
                            <p>{order.shippingAddress.city}, {order.shippingAddress.stateProvince || ''} {order.shippingAddress.postalCode}</p>
                            <p>{order.shippingAddress.country}</p>
                            <p>Phone: {order.shippingAddress.phone}</p>
                            <p>Email: {order.shippingAddress.email}</p>
                        </div>
                        <div className="payment-details-card">
                            <h3>Payment Information</h3>
                            <p><strong>Payment Method:</strong> {order.paymentMethod?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                            {/* Nếu có paymentResult, bạn có thể hiển thị thêm chi tiết */}
                            {/* <p><strong>Payment Status:</strong> {order.isPaid ? `Paid on ${formatDate(order.paidAt)}` : 'Not Paid'}</p> */}
                        </div>
                    </section>

                    {/* Order Totals Section */}
                    <section className="order-totals-card">
                        <h3>Order Summary</h3>
                        <div className="total-row"><p>Subtotal:</p> <p>${order.itemsPrice?.toFixed(2)}</p></div>
                        <div className="total-row"><p>Shipping:</p> <p>{order.shippingPrice === 0 ? 'Free' : `$${order.shippingPrice?.toFixed(2)}`}</p></div>
                        {order.discountApplied && order.discountApplied.amount > 0 && (
                            <div className="total-row discount-row">
                                <p>Discount ({order.discountApplied.code}):</p>
                                <p>-${order.discountApplied.amount?.toFixed(2)}</p>
                            </div>
                        )}
                        <div className="total-row grand-total"><p>Grand Total:</p> <p>${order.totalPrice?.toFixed(2)}</p></div>
                        {order.pointsEarned > 0 && (
                            <div className="total-row points-row"><p>Points Earned:</p> <p>{order.pointsEarned} points</p></div>
                        )}
                    </section>

                    {/* Order Status History Section */}
                    <section className="order-status-history-section">
                        <h3>Order Status History</h3>
                        {order.statusHistory && order.statusHistory.length > 0 ? (
                            <ul className="status-history-list">
                                {order.statusHistory.slice().reverse().map((statusEntry, index) => ( // Hiển thị mới nhất lên đầu
                                    <li key={index} className="status-history-item">
                                        <span className={`order-status status-${statusEntry.status?.toLowerCase().replace(' ', '-') || 'unknown'}`}>
                                            {statusEntry.status}
                                        </span> - <span className="status-timestamp">{formatDate(statusEntry.timestamp)}</span>
                                        {statusEntry.updatedBy && <span className="status-updated-by"> (by {statusEntry.updatedBy})</span>}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No status history available.</p>
                        )}
                        <p style={{ marginTop: '1em' }}><strong>Current Status:</strong> <span className={`order-status status-${order.orderStatus?.toLowerCase().replace(' ', '-') || 'unknown'}`}>{order.orderStatus}</span></p>
                    </section>
                </div>
            </main>

            {/* Footer (Nên là component chung) */}
            <footer className="order-detail-footer"> {/* ... */} </footer>
        </>
    );
}

export default OrderDetailPage;