import React from 'react';
// Import Link/NavLink
import { NavLink } from 'react-router-dom';
// Import CSS - **KIỂM TRA TÊN FILE**
import './Sidebar.css'; // Ví dụ dùng tên chữ thường

// Dữ liệu cho các mục nav
const navItems = [
    { to: "/Admin/Dashboard", icon: "fas fa-th-large", label: "Dashboard", specialClass: "dashboard" },
    { to: "/Admin/products", icon: "fas fa-shopping-cart", label: "Products" },
    { to: "/Admin/Shipping", icon: "fas fa-box", label: "Shipping" }, // fas fa-box from HTML
    { to: "/Admin/UserManagement", icon: "fas fa-users", label: "User Management" }, // Đổi icon và label
    { to: "/Admin/messages", icon: "fas fa-comment-alt", label: "Messages", badge: 45, specialClass: "messages" },
    { to: "/Admin/notifications", icon: "fas fa-bell", label: "Notifications" },
    { to: "/Admin/settings", icon: "fas fa-cog", label: "Settings" },
];

function Sidebar() {
    // TODO: Logic for active state if NavLink's default active class is not enough
    // TODO: Logic for logout button

  return (
    <aside className="admin-sidebar">
      {/* Top section: Logo and Navigation */}
      <div className="admin-sidebar-top-section">
        {/* Logo */}
        <div className="admin-sidebar-logo-container">
          <img
            alt="ASIMOV.COM logo" // Updated alt text
            className="admin-sidebar-logo-img"
            height="40"
            src="https://storage.googleapis.com/a1aa/image/79b4f434-f29c-4c73-48ce-a341205dfd1a.jpg"
            width="40"
          />
          <p className="admin-sidebar-logo-text">ASIMOV.COM</p>
        </div>

        {/* Navigation */}
        <nav className="admin-sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `admin-sidebar-nav-link ${isActive ? 'active' : ''}`
              }
              title={item.label} // Add title for accessibility on icon-only
            >
              <i className={item.icon}></i>
              <span className={`admin-sidebar-link-text ${item.specialClass || ''}`}>
                {item.label}
              </span>
              {item.badge && (
                <span className="message-badge">{item.badge}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom section: User info and Logout */}
      <div className="admin-sidebar-bottom-section">
        <img
          alt="Charles, Computer Shop Admin" // Updated alt text
          className="admin-sidebar-user-avatar"
          height="40"
          src="https://storage.googleapis.com/a1aa/image/d5fecf4d-1e25-4133-1c83-129b178c3563.jpg"
          width="40"
        />
        {/* User info hidden on small screens by CSS */}
        <p className="admin-sidebar-user-name sm:block hidden">Charles</p>
        <p className="admin-sidebar-user-role sm:block hidden">Computer Shop</p>
        <button aria-label="Logout" className="admin-sidebar-logout-button" title="Logout">
          <i className="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;