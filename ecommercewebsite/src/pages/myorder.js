// src/pages/myorder.js
import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom'; 
import { getMyOrders } from '../services/api';
import { useAuth } from '../context/authContext'; 
import './myorder.css'; 

function MyOrdersPage() {
    const { currentUser, loadingAuth } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (loadingAuth) {
            // Chờ cho đến khi AuthContext xác định xong currentUser
            return;
        }
        if (!currentUser) {
            // Nếu không có user, có thể điều hướng về login hoặc hiển thị thông báo
            // ProtectedRoute trong App.js nên đã xử lý việc này
            navigate('/login');
            return;
        }

        const fetchOrders = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await getMyOrders();
                if (response.data.success) {
                    setOrders(response.data.data);
                } else {
                    setError(response.data.message || "Failed to fetch orders.");
                    setOrders([]);
                }
            } catch (err) {
                setError(err.response?.data?.message || "An error occurred while fetching your orders.");
                setOrders([]);
                console.error("Fetch my orders error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [currentUser, loadingAuth, navigate]); // Phụ thuộc vào currentUser và loadingAuth

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    if (loadingAuth || loading) {
        return <div className="my-orders-loading">Loading your orders...</div>;
    }

    if (error) {
        return <div className="my-orders-error">Error: {error}</div>;
    }

    return (
        <>
            {/* Header nên là component chung */}
            <header className="my-orders-header">
                <div className="my-orders-container header-content">
                    <Link to="/" className="header-logo-my-orders">Exclusive</Link>
                    {/* Nav links có thể thêm nếu cần */}
                    <nav className="header-nav-my-orders">
                        <NavLink to="/">Home</NavLink>
                        <NavLink to="/shop">Shop</NavLink>
                        <NavLink to="/cart">Cart</NavLink>
                    </nav>
                    {/* User icon có thể thêm */}
                </div>
            </header>

            <div className="my-orders-container page-breadcrumb">
                <Link to="/">Home</Link> <span className="separator">/</span>
                <Link to="/account">My Account</Link> <span className="separator">/</span>
                <span>My Orders</span>
            </div>

            <main className="my-orders-container my-orders-main">
                <h2>My Orders</h2>
                {orders.length === 0 ? (
                    <p>You have no orders yet.</p>
                ) : (
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Total</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order._id}>
                                    <td>#{order._id.substring(0, 8)}...</td> {/* Hiển thị rút gọn ID */}
                                    <td>{formatDate(order.createdAt)}</td>
                                    <td>
                                        <span className={`order-status status-${order.orderStatus?.toLowerCase().replace(' ', '-') || 'unknown'}`}>
                                            {order.orderStatus || 'N/A'}
                                        </span>
                                    </td>
                                    <td>${order.totalPrice?.toFixed(2)}</td>
                                    <td>
                                        {/* Điều hướng đến trang chi tiết đơn hàng (sẽ tạo sau) */}
                                        <Link to={`/order-detail/${order._id}`} className="view-order-button">
                                            View Details
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </main>

            {/* Footer nên là component chung */}
            <footer className="my-orders-footer">
                <div className="my-orders-container">
                    <p>&copy; {new Date().getFullYear()} Exclusive. All rights reserved.</p>
                </div>
            </footer>
        </>
    );
}

export default MyOrdersPage;