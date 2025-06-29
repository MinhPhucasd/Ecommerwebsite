import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getOrderDetails, adminUpdateOrderStatus } from '../../services/api';
// import './AdminOrderDetail.css'; // Tạo file CSS nếu cần style phức tạp

const ORDER_STATUSES = ['Processing', 'Shipped', 'Out For Delivery', 'Delivered', 'Cancelled', 'Refunded'];

function AdminOrderDetail() {
    const { id: orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newStatus, setNewStatus] = useState('');

    const loadOrder = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await getOrderDetails(orderId); // Admin dùng chung API getOrderById
            if (response.data.success) {
                setOrder(response.data.data);
                setNewStatus(response.data.data.orderStatus); // Khởi tạo newStatus
            } else {
                setError(response.data.message || "Failed to load order details.");
            }
        } catch (err) {
            setError(err.response?.data?.message || "An error occurred.");
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        loadOrder();
    }, [loadOrder]);

    const handleStatusUpdate = async () => {
        if (!newStatus || newStatus === order.orderStatus) {
            alert("Please select a new status.");
            return;
        }
        if (!window.confirm(`Confirm updating order status to "${newStatus}"?`)) return;
        
        try {
            setLoading(true); // Cho biết đang xử lý
            await adminUpdateOrderStatus(orderId, { status: newStatus });
            alert("Order status updated successfully!");
            loadOrder(); // Tải lại chi tiết đơn hàng để thấy thay đổi
        } catch (err) {
            alert(`Failed to update status: ${err.response?.data?.message || err.message}`);
            setError(err.response?.data?.message || "Error updating status.");
        } finally {
            setLoading(false);
        }
    };
    
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    if (loading && !order) return <div className="orders-page-container">Loading order details...</div>;
    if (error) return <div className="orders-page-container" style={{ color: 'red' }}>Error: {error}</div>;
    if (!order) return <div className="orders-page-container">Order not found.</div>;

    return (
        <div className="orders-page-container admin-order-detail-page">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                <h1 className="orders-page-title">Order Detail - #{order._id.slice(-8)}</h1>
                <Link to="/admin/Shipping" className="action-button">« Back to Orders</Link>
            </div>

            <div className="order-detail-grid">
                <section className="order-info-card">
                    <h3>Order Information</h3>
                    <p><strong>Order ID:</strong> {order._id}</p>
                    <p><strong>Date Placed:</strong> {formatDate(order.createdAt)}</p>
                    <p><strong>Customer:</strong> {order.shippingAddress?.fullName || 'N/A'}</p>
                    <p><strong>Email:</strong> {order.shippingAddress?.email || 'N/A'}</p>
                    <p><strong>Phone:</strong> {order.shippingAddress?.phone || 'N/A'}</p>
                    <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
                </section>

                <section className="order-info-card">
                    <h3>Shipping Address</h3>
                    <p>{order.shippingAddress?.addressLine1}</p>
                    {order.shippingAddress?.apartment && <p>{order.shippingAddress.apartment}</p>}
                    <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}</p>
                    <p>{order.shippingAddress?.country}</p>
                </section>

                <section className="order-info-card order-status-card">
                    <h3>Order Status: <span className={`status-badge status-${order.orderStatus?.toLowerCase().replace(' ', '-')}`}>{order.orderStatus}</span></h3>
                    <div style={{ marginTop: '15px' }}>
                        <label htmlFor="status-update" style={{display: 'block', marginBottom: '5px'}}>Change Status:</label>
                        <select id="status-update" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={handleStatusUpdate} disabled={loading || newStatus === order.orderStatus} style={{marginLeft: '10px', padding: '8px 12px'}}>
                            {loading && newStatus !== order.orderStatus ? 'Updating...' : 'Update Status'}
                        </button>
                    </div>
                </section>
            </div>

            <section className="order-items-summary" style={{marginTop: '30px'}}>
                <h3>Items in Order</h3>
                <table className="items-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>SKU/Variant</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.orderItems.map(item => (
                            <tr key={item.productId + (item.variantId || '')}>
                                <td>
                                    <img src={item.image || 'https://via.placeholder.com/40'} alt={item.name} style={{width: '40px', height: '40px', marginRight: '10px', verticalAlign: 'middle'}} />
                                    {item.name}
                                </td>
                                <td>{item.variantId ? `VAR-${item.variantId.slice(-5)}` : 'N/A'}</td>
                                <td>{item.quantity}</td>
                                <td>${item.price?.toFixed(2)}</td>
                                <td>${(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <section className="order-totals-summary" style={{marginTop: '20px', textAlign: 'right', borderTop: '1px solid #eee', paddingTop: '20px'}}>
                 <p><strong>Items Price:</strong> ${order.itemsPrice?.toFixed(2)}</p>
                 <p><strong>Shipping:</strong> ${order.shippingPrice?.toFixed(2)}</p>
                 {order.discountApplied && (
                     <p style={{color: 'green'}}><strong>Discount ({order.discountApplied.code}):</strong> -${order.discountApplied.amount?.toFixed(2)}</p>
                 )}
                 <h3 style={{marginTop: '10px'}}>Grand Total: ${order.totalPrice?.toFixed(2)}</h3>
            </section>
             {/* TODO: Status History display (if available from backend) */}
        </div>
    );
}

export default AdminOrderDetail;