// ecommercewebsite/src/App.js
import React from 'react';
import { Routes, Route, Navigate , useLocation} from 'react-router-dom'; // Thêm Navigate
import { AuthProvider, useAuth } from './context/authContext.js';
import { CartProvider } from './context/cartContext.js';
import './App.css';

// Import các component bảo vệ route
import ProtectedRoute from './components/protectedRoute';

// Import các component trang người dùng
import Home from './home/home';
import Contact from './contact/contact';
import About from './about/about';
import SignUp from './signup/signup';
import Login from './login/login';
import ProductDetail from './productDetail/ProductDetail';
import Account from './account/account';
import Wishlist from './wishlist/wishlist';
import Cart from './cart/cart';
import CheckoutPage from './pages/checkout.js';
import MyOrdersPage from './pages/myorder.js';
import OrderDetailPage from './pages/myorderdetail.js';
import GoogleAuthCallback from './components/Auth/GoogleAuthCallback';

// Import các component cho Admin
import AdminLoginPage from './Admin/Auth/AdminLoginPage'; // Import trang mới
import Layout from './Admin/Layout/Layout.js'; // Component Layout của Admin
import Dashboard from './Admin/Dashboard/Dashboard.js'; // Component trang Dashboard
import ProductManagement from './Admin/Product/ProductManagement.js';
import AddProduct from './Admin/Product/AddProduct.js'; 
import Violations from './Admin/Product/Violations.js';
import ManageOrder from './Admin/Shipping/ManageOrder.js';
import EditProduct from './Admin/Product/EditProduct.js';
import AdminOrderDetail from './Admin/Shipping/AdminOrderDetail.js'; // Import component mới
import UserManagement from './Admin/UserManagement/UserManagement'; // <-- IMPORT MỚI
// import AdminProducts from './Admin/Products/AdminProducts.js'; // Ví dụ trang quản lý sản phẩm admin

function AppContent() {
  
  // Giả sử có logic kiểm tra người dùng có phải là admin và đã đăng nhập hay không
  // const isAdminAuthenticated = true; // Thay bằng logic thực tế của bạn
  const { currentUser,loadingAuth } = useAuth();
  const location = useLocation(); // <--- THÊM DÒNG NÀY

  if (loadingAuth) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.5em' }}>Loading Application...</div>;
  }

  return (
    // Bạn không cần <div className="App"> ở đây nếu Layout đã xử lý class cho body
    // Hoặc bạn có thể giữ lại nếu có style chung cho toàn bộ ứng dụng

    <Routes>
      {/* Routes cho Trang Người Dùng */}
      <Route path="/" element={<Home />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/about" element={<About />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<Login />} />
      <Route path="/productdetail/:id" element={<ProductDetail />} /> {/* Thêm :id nếu cần */}
      <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />      <Route path="/wishlist" element={<Wishlist />} /> {/* Cần bảo vệ route này */}
      <Route path="/cart" element={<Cart />} /> {/* Cần bảo vệ route này */}
      <Route path='/checkout' element={<CheckoutPage />} />
      <Route path='/my-orders' element={<MyOrdersPage />} />
      <Route path="/order-detail/:orderId" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} /> {/* <<< ROUTE MỚI */}
      <Route path="/auth/google/success" element={<GoogleAuthCallback />} />


      {/* Routes cho Khu vực Admin */}

      <Route path="/admin-login" element={<AdminLoginPage />} />
      <Route
        path="/admin" // Route cha cho tất cả các trang admin
        element={
          // isAdminAuthenticated ? ( // Thêm logic kiểm tra đăng nhập admin ở đây
            currentUser && currentUser.role === 'admin' ? (
          <Layout /> // Layout sẽ chứa Sidebar và Outlet
           ) : (
              <Navigate to="/admin-login" state={{ from: location }} replace />
          )
        }
      >
        {/* Các route con của /admin sẽ được render bên trong Outlet của Layout */}
        <Route index element={<Navigate to="dashboard" replace />} /> {/* Mặc định /admin sẽ redirect đến /admin/dashboard */}
        <Route path="dashboard" element={<Dashboard />} /> {/* Sẽ được render tại <Outlet /> */}
        <Route path="Products" element={<ProductManagement />} />
        <Route path="AddProduct" element={<AddProduct />} />
        <Route path="EditProduct/:id" element={<EditProduct />} /> 
        <Route path="Violations" element={<Violations />} />
        <Route path="Shipping" element={<ManageOrder />} />
        <Route path="OrderDetail/:id" element={<AdminOrderDetail />} /> 
        <Route path="UserManagement" element={<UserManagement />} /> {/* <-- ROUTE MỚI */}
        {/* Thêm các route admin khác ở đây */}
        <Route path="*" element={<Navigate to="dashboard" replace />} /> {/* Nếu route admin không tồn tảis */}
      </Route>

      {/* (Tùy chọn) Route cho trang Login Admin (nếu có, nằm ngoài Layout chính của admin) */}
      {/* <Route path="/admin-login" element={<AdminLoginPage />} /> */}


      {/* Route bắt lỗi chung cho các đường dẫn không tồn tại */}
      <Route path="*" element={<div>404 Page Not Found</div>} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider> 
      <CartProvider> 
        <AppContent /> 
      </CartProvider>
    </AuthProvider>
  );
}

export default App;