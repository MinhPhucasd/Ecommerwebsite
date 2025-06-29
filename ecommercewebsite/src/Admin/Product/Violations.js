import React from 'react';
// Import Link/NavLink
import { Link, NavLink } from 'react-router-dom';
// Import CSS - **KIỂM TRA TÊN FILE**
import './Violations.css'; // Giả sử tên file CSS là productPage.css

function Violations() { // Đổi tên component nếu cần
    // TODO: State for selected date, active tab, etc.
    // const [selectedDate, setSelectedDate] = useState('May 2022');

  return (
    // Component này có thể được render bên trong một AdminLayout.
    // Nếu AdminLayout đã có padding và max-width, thì div này có thể không cần style đó.
    <div className="product-page-container"> {/* Container chính của trang này */}
      <h2 className="product-page-title">Produk</h2>

      {/* Navigation Tabs & Date Select */}
      <div className="product-page-nav-controls">
        <NavLink
          to="/admin/Products" // Hoặc /admin/products/my (đường dẫn cho "Produk Saya")
          className={({ isActive }) =>
            `product-page-nav-button produk-saya ${isActive ? 'active' : ''}`
          }
        >
          Products
        </NavLink>
        <NavLink
          to="/admin/AddProduct" // Đường dẫn cho "Tambah Produk"
          className={({ isActive }) =>
            `product-page-nav-button tambah-produk ${isActive ? 'active' : ''}`
          }
        >
          Add Product
        </NavLink>
        <NavLink
          to="/admin/Violations" // Đường dẫn cho "Pelanggaran" (trang này)
          className={({ isActive }) =>
            `product-page-nav-button pelanggaran ${isActive ? 'active' : ''}`
          }
        >
          Violations
        </NavLink>
        <div className="product-page-date-select-wrapper">
          <select
            aria-label="Select month and year"
            className="product-page-date-select"
            // value={selectedDate}
            // onChange={(e) => setSelectedDate(e.target.value)}
          >
            <option>May 2022</option>
            {/* Thêm các options khác */}
          </select>
          <i className="fas fa-chevron-down product-page-date-select-arrow"></i>
        </div>
      </div>

      {/* No Violations Content */}
      <div className="no-violations-content-box">
        <p className="no-violations-message">
          You have not received any penalties from Asimov.com
        </p>
        <div className="no-violations-icon-container">
          <i className="fas fa-check"></i>
        </div>
        <p className="no-violations-advice">
          Keep being a good, wise, and responsible seller
        </p>
      </div>
    </div>
  );
}

export default Violations; // Đổi tên export nếu cần