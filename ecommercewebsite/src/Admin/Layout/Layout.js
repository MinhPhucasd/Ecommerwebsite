// ecommercewebsite/src/Admin/Layout/Layout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import './Layout.css'; // Đảm bảo import CSS

function Layout() {
  return (
    <div className="admin-layout-container"> {/* Thẻ div bao ngoài cùng */}
      <Sidebar />
      {/* Thẻ div này sẽ chứa header (nếu có) và khu vực nội dung chính */}
      <div className="admin-main-area-wrapper">
        {/* <HeaderAdmin /> */}
        <main className="admin-main-content-outlet">
          <Outlet />
        </main>
        {/* <FooterAdmin /> */}
      </div>
    </div>
  );
}

export default Layout;