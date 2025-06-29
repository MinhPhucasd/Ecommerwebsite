import React, { useState, useEffect } from 'react'; 
// Import Link/NavLink nếu có điều hướng trong trang này (vd: nút Select month)
// import { Link, NavLink } from 'react-router-dom';
// Import CSS - **KIỂM TRA TÊN FILE**
import { getAdminDashboardStats } from '../../services/api';
import './Dashboard.css';

// Dữ liệu mẫu (thay thế bằng state/API)
const recentOrdersData = [
    { id: '#876364', productName: 'Gaming Laptop', image: 'https://storage.googleapis.com/a1aa/image/d2b21928-05e7-45e7-52a4-1e95c9982de7.jpg', price: '$1,200.00', quantity: 100, totalAmount: '$120,000.00' },
    { id: '#876368', productName: 'Wireless Mouse', image: 'https://storage.googleapis.com/a1aa/image/25005b4d-c74c-44f5-4ff4-2c6fa0052b80.jpg', price: '$40.00', quantity: 20, totalAmount: '$800.00' },
    { id: '#876412', productName: 'Mechanical Keyboard', image: 'https://storage.googleapis.com/a1aa/image/2088ae5b-c3b4-45df-d753-331f329a8e7a.jpg', price: '$90.00', quantity: 52, totalAmount: '$4,680.00' },
    { id: '#876621', productName: 'Gaming Headset', image: 'https://storage.googleapis.com/a1aa/image/10ebd006-a7e7-4fee-a454-1b9adb4ddb6a.jpg', price: '$150.00', quantity: 48, totalAmount: '$7,200.00' },
];

const topSalesData = [
    { id: 'ts1', name: 'Gaming Laptop', image: 'https://storage.googleapis.com/a1aa/image/d2b21928-05e7-45e7-52a4-1e95c9982de7.jpg', price: '$1,200.00', rating: 5 },
    { id: 'ts2', name: 'Wireless Mouse', image: 'https://storage.googleapis.com/a1aa/image/25005b4d-c74c-44f5-4ff4-2c6fa0052b80.jpg', price: '$40.00', rating: 5 },
    // Thêm sản phẩm khác nếu cần
];

const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
        if (i < rating) {
            stars.push(<i key={i} className="fas fa-star"></i>);
        } else {
            stars.push(<i key={i} className="far fa-star"></i>); // Hoặc fas fa-star-half-alt
        }
    }
    return stars;
};


function Dashboard() {
    // TODO: State for date select, chart data, etc.
    // const [selectedDate, setSelectedDate] = useState('May 2022');

    const [stats, setStats] = useState({
        totalVisitors: 0,
        orders: 0,
        sales: 0,
        cancelledOrders: 0,
        visitorsChange: 0,
        ordersChange: 0,
        salesChange: 0,
        cancelledOrdersChange: 0,
    });
    const [loadingStats, setLoadingStats] = useState(true);
    const [errorStats, setErrorStats] = useState('');
    // const [selectedDate, setSelectedDate] = useState('May 2022'); // Sẽ xử lý sau

    useEffect(() => {
    const fetchStats = async () => {
        setLoadingStats(true);
        setErrorStats('');
        try {
            const response = await getAdminDashboardStats();
            console.log("Dashboard Stats API Response:", response.data); // <--- THÊM LOG NÀY
            if (response.data.success) {
                setStats(response.data.data); // Đảm bảo response.data.data có đúng cấu trúc
            } else {
                setErrorStats(response.data.message || 'Failed to load dashboard stats.');
            }
        } catch (err) {
            // ...
        } finally {
            // ...
        }
    };
    fetchStats();
}, []);

  return (
    // Bỏ thẻ body, chỉ giữ lại div container chính của trang
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        {/* Nút này có thể là select hoặc button mở date picker */}
        <button aria-label="Select month and year" className="dashboard-date-button">
          May 2022 {/* Nên lấy từ state */}
          <i className="fas fa-chevron-down"></i>
        </button>
      </div>

      {/* Stats cards */}
      <div className="dashboard-stats-grid">
        {/* Card 1 */}
        <div aria-label="Total Visitors" className="stat-card">
          <div aria-hidden="true" className="stat-icon-wrapper visitors">
            <i className="fas fa-desktop"></i>
          </div>
          <p className="stat-value">2,761</p>
          <p className="stat-label">
            Total Visitors<br />
            <span className="stat-change positive">6%</span> increase from last month
          </p>
        </div>
        {/* Card 2 */}
        <div aria-label="Orders" className="stat-card">
          <div aria-hidden="true" className="stat-icon-wrapper orders">
            <i className="fas fa-shopping-cart"></i>
          </div>
          <p className="stat-value">580</p>
          <p className="stat-label">
            Orders<br />
            <span className="stat-change positive orders">4%</span> increase from last month
          </p>
        </div>
        {/* Card 3 */}
         <div aria-label="Sales" className="stat-card">
           <div aria-hidden="true" className="stat-icon-wrapper sales">
             <i className="fas fa-dollar-sign"></i>
           </div>
           <p className="stat-value">$22,480.00</p>
           <p className="stat-label">
             Sales<br />
             <span className="stat-change negative sales">-2%</span> decrease from last month
           </p>
         </div>
        {/* Card 4 */}
        <div aria-label="Cancelled Orders" className="stat-card">
           <div aria-hidden="true" className="stat-icon-wrapper cancelled">
             <i className="fas fa-times-circle"></i>
           </div>
           <p className="stat-value">90</p>
           <p className="stat-label">
             Cancelled Orders<br />
             <span className="stat-change negative cancelled">-5%</span> decrease from last month
           </p>
        </div>
      </div>

      {/* Reports and Analytics */}
      <div className="dashboard-reports-analytics-grid">
        {/* Reports */}
        <div aria-label="Reports" className="dashboard-section-card" style={{ gridColumn: 'md:span 2' }}> {/* CSS cho md:col-span-2 */}
          <div className="dashboard-section-header">
            <h2 className="dashboard-section-title">Reports</h2>
            <i className="fas fa-ellipsis-h dashboard-options-icon"></i>
          </div>
          <div className="reports-chart-container">
            {/* SVG Chart - Cần thư viện hoặc logic vẽ động */}
            <svg aria-hidden="true" fill="none" height="150" viewBox="0 0 1000 150" width="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient gradientUnits="userSpaceOnUse" id="gradientDashboard" x1="0" x2="0" y1="0" y2="150"> {/* Đổi ID */}
                  <stop stopColor="#3B82F6" stopOpacity="0.5"></stop>
                  <stop offset="1" stopColor="#3B82F6" stopOpacity="0"></stop>
                </linearGradient>
              </defs>
              <path d="M0 100 C 100 50 200 100 300 50 C 400 100 500 80 600 120 C 700 50 800 100 900 50 C 1000 100 1100 100 1200 100" fill="url(#gradientDashboard)" fillOpacity="0.5" stroke="#3B82F6" strokeWidth="2"></path>
            </svg>
            {/* Tooltip - Cần logic vị trí động */}
            <div aria-label="Orders 580" className="chart-tooltip-wrapper" tabIndex="0" style={{ top: '40px', left: '280px' }}>
              <div className="chart-tooltip">Orders<br />580</div>
            </div>
          </div>
          <div className="reports-chart-xaxis">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
          </div>
        </div>

        {/* Analytics */}
        <div aria-label="Analytics" className="dashboard-section-card analytics-card-content">
          <div className="dashboard-section-header" style={{ width: '100%' }}>
            <h2 className="dashboard-section-title">Analytics</h2>
            <i className="fas fa-ellipsis-h dashboard-options-icon"></i>
          </div>
          <div className="analytics-chart-container">
            {/* Donut Chart SVG - Cần thư viện hoặc logic vẽ động */}
            <svg aria-hidden="true" className="w-full h-full" role="img" viewBox="0 0 36 36">
              <circle cx="18" cy="18" fill="transparent" r="16" stroke="#10B981" strokeDasharray="25 100" strokeLinecap="round" strokeWidth="4"></circle>
              <circle cx="18" cy="18" fill="transparent" r="16" stroke="#F59E0B" strokeDasharray="45 100" strokeDashoffset="25" strokeLinecap="round" strokeWidth="4"></circle>
               {/* Thêm phần màu xám cho Cancelled nếu cần */}
               <circle cx="18" cy="18" fill="transparent" r="16" stroke="#6B7280" strokeDasharray="30 100" strokeDashoffset="70" strokeLinecap="round" strokeWidth="4"></circle>
            </svg>
            <div className="analytics-center-text">
              <span className="analytics-percentage">70%</span>
              <span className="analytics-label">Transactions</span>
            </div>
          </div>
          <div className="analytics-legend">
            <div className="legend-item"><span aria-hidden="true" className="legend-color-dot" style={{ backgroundColor: '#6B7280' }}></span><span>Cancelled</span></div>
            <div className="legend-item"><span aria-hidden="true" className="legend-color-dot" style={{ backgroundColor: '#10B981' }}></span><span>Orders</span></div>
            <div className="legend-item"><span aria-hidden="true" className="legend-color-dot" style={{ backgroundColor: '#F59E0B' }}></span><span>Sales</span></div>
          </div>
        </div>
      </div>

      {/* Recent Orders and Top Sales */}
      <div className="dashboard-orders-sales-grid">
        {/* Recent Orders */}
        <div aria-label="Recent Orders" className="dashboard-section-card dashboard-recent-orders-card" style={{ gridColumn: 'md:span 2' }}> {/* CSS cho md:col-span-2 */}
          <div className="dashboard-section-header">
            <h2 className="dashboard-section-title">Recent Orders</h2>
            <i className="fas fa-ellipsis-h dashboard-options-icon"></i>
          </div>
          <table className="recent-orders-table">
            <thead>
              <tr>
                <th>Tracking No</th>
                <th>Product Name</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentOrdersData.map(order => (
                <tr key={order.id}>
                  <td className="order-tracking-no">{order.id}</td>
                  <td className="order-product-cell">
                    <img alt={`${order.productName} product`} className="order-product-image" height="20" src={order.image} width="20" />
                    {order.productName}
                  </td>
                  <td>{order.price}</td>
                  <td><input aria-label={`Quantity for ${order.productName}`} className="order-quantity-input" readOnly type="text" value={order.quantity} /></td>
                  <td className="order-total-amount">{order.totalAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Sales */}
        <div aria-label="Top Sales" className="dashboard-section-card">
          <div className="dashboard-section-header">
            <h2 className="dashboard-section-title">Top Sales</h2>
            <i className="fas fa-ellipsis-h dashboard-options-icon"></i>
          </div>
          <div className="top-sales-list">
            {topSalesData.map(item => (
              <div key={item.id} className="top-sales-item">
                <img alt={`${item.name} product`} className="top-sales-image" height="50" src={item.image} width="50" />
                <div className="top-sales-info">
                  <p className="top-sales-name">{item.name}</p>
                  <p className="top-sales-price">{item.price}</p>
                </div>
                <div aria-label={`Rating ${item.rating} stars`} className="top-sales-rating">
                  {renderStars(item.rating)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;