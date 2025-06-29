import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Không cần NavLink ở đây nếu các tab là button
import { adminGetAllOrders, adminUpdateOrderStatus } from '../../services/api';
import './ManageOrder.css'; // Đảm bảo import CSS

const ORDER_STATUSES = ['Processing', 'Shipped', 'Out For Delivery', 'Delivered', 'Cancelled', 'Refunded'];

function ManageOrder() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();

    // Filters
    const [statusFilter, setStatusFilter] = useState(''); // '' for All
    // const [dateFilter, setDateFilter] = useState('May 2022'); // Cần logic xử lý date range
    const [searchTerm, setSearchTerm] = useState(''); // Cho order ID hoặc customer name

    const loadOrders = useCallback(async (page = 1) => {
        setLoading(true);
        setError('');
        try {
            const params = { page, limit: 10 };
            if (statusFilter) params.status = statusFilter;
            if (searchTerm) params.search = searchTerm; // Backend cần hỗ trợ search
            // if (dateFilter) params.monthYear = dateFilter; // Backend cần hỗ trợ

            const response = await adminGetAllOrders(params);
            if (response.data.success) {
                setOrders(response.data.data);
                setPagination(response.data.pagination);
                setCurrentPage(response.data.pagination?.currentPage || 1);
            } else {
                setError(response.data.message || "Failed to load orders.");
            }
        } catch (err) {
            setError(err.response?.data?.message || "An error occurred.");
            console.error("Admin fetch orders error:", err);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, searchTerm /*, dateFilter*/]);

    useEffect(() => {
        loadOrders(currentPage);
    }, [loadOrders, currentPage]);

    const handleStatusChange = async (orderId, newStatus) => {
        if (!window.confirm(`Change order ${orderId.slice(-6)} status to "${newStatus}"?`)) return;
        try {
            await adminUpdateOrderStatus(orderId, { status: newStatus });
            alert(`Order ${orderId.slice(-6)} status updated to "${newStatus}".`);
            loadOrders(currentPage); // Tải lại danh sách
        } catch (err) {
            alert(`Failed to update status: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleFilterButtonClick = (newStatus) => {
        setStatusFilter(newStatus);
        setCurrentPage(1); // Reset về trang 1 khi đổi filter
        // loadOrders(1) sẽ được gọi bởi useEffect khi statusFilter thay đổi
    };
    
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        loadOrders(1); // Trigger load with new search term
    };

    const handlePageChange = (newPage) => {
        if (newPage > 0 && (!pagination || newPage <= pagination.totalPages)) {
            setCurrentPage(newPage);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    // Dữ liệu mẫu cho các nút filter đã bị xóa, thay bằng state `statusFilter`

    if (loading && orders.length === 0) {
        return <div className="orders-page-container">Loading orders...</div>;
    }
    if (error) {
        return <div className="orders-page-container" style={{ color: 'red' }}>Error: {error}</div>;
    }

    return (
        <div className="orders-page-container">
            <h1 className="orders-page-title">Manage Orders</h1>

            {/* Tabs (giữ nguyên nếu bạn có các section khác như Bulk Orders, Issues) */}
            <div className="orders-tabs-nav">
                <button className="orders-tab-button active" type="button">All Orders</button>
                {/* <button className="orders-tab-button inactive" type="button">Bulk Orders</button> */}
            </div>

            {/* Filter bar */}
            <div className="orders-filter-bar">
                <div className="filter-status-buttons">
                    <button onClick={() => handleFilterButtonClick('')} className={`filter-status-button ${statusFilter === '' ? 'active' : ''}`}>All</button>
                    {ORDER_STATUSES.map(status => (
                        <button
                            key={status}
                            onClick={() => handleFilterButtonClick(status)}
                            className={`filter-status-button status-${status.toLowerCase().replace(' ', '-')} ${statusFilter === status ? 'active' : ''}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                <form className="order-search-form" onSubmit={handleSearchSubmit}>
                    <input
                        className="order-search-input"
                        placeholder="Search Order ID, Customer..."
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="order-search-button" type="submit">Search</button>
                </form>
            </div>
            
            {loading && <p>Loading...</p>}

            {!loading && orders.length === 0 && (
                <p style={{textAlign: 'center', padding: '20px'}}>No orders found matching your criteria.</p>
            )}

            {orders.length > 0 && (
                <>
                    <div className="orders-table-header-desktop admin-orders-table-header">
                        <div>Order ID</div>
                        <div>Customer</div>
                        <div>Date</div>
                        <div>Total</div>
                        <div>Status</div>
                        <div>Actions</div>
                    </div>

                    {orders.map(order => (
                        <section key={order._id} aria-labelledby={`order-admin-${order._id}`} className="order-section admin-order-section">
                            <header className="order-header admin-order-header-info">
                                <div className="order-id-admin">#{order._id.slice(-8)}</div>
                                <div className="order-customer-admin" title={order.user?.toString() || 'Guest'}>
                                  {order.shippingAddress?.fullName || 'N/A'}
                                  <small style={{display:'block', color:'#777'}}>{order.shippingAddress?.email || ''}</small>
                                </div>
                                <div className="order-date-admin">{formatDate(order.createdAt)}</div>
                                <div className="order-total-admin">${order.totalPrice?.toFixed(2)}</div>
                                <div className="order-status-admin">
                                    <select
                                        value={order.orderStatus}
                                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                        className={`status-select status-${order.orderStatus?.toLowerCase().replace(' ', '-')}`}
                                    >
                                        {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="order-actions-admin">
                                    <Link to={`/admin/OrderDetail/${order._id}`} className="action-link view-details">View</Link>
                                    {/* Thêm các action khác nếu cần, ví dụ: In hóa đơn */}
                                </div>
                            </header>
                            {/* Không cần hiển thị items chi tiết ở đây, chỉ ở trang chi tiết */}
                        </section>
                    ))}
                     {pagination && pagination.totalPages > 1 && (
                        <div className="pagination-controls">
                            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || loading}>Previous</button>
                            <span> Page {currentPage} of {pagination.totalPages} ({pagination.totalOrders} orders) </span>
                            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === pagination.totalPages || loading}>Next</button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default ManageOrder;