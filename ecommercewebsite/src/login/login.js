// src/components/Login.js (hoặc nơi bạn đặt file Login.js)

import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import './login.css'; 
import { loginUser } from '../services/api'; 
import { useAuth } from '../context/authContext';

// Giả sử bạn có một Context để quản lý trạng thái đăng nhập
// import { useAuth } from '../context/AuthContext'; // Ví dụ

function Login() {
  // State cho form
  const [email, setEmail] = useState(''); // Đã đổi emailOrPhone thành email cho rõ ràng
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate(); 
  const { loginContext } = useAuth();

  // Handler khi submit form
  const handleLogin = async (event) => {
    event.preventDefault(); // Ngăn chặn hành vi submit mặc định của form
    setError(''); // Xóa lỗi cũ
    setLoading(true); // Bắt đầu loading

    try {
      const response = await loginUser({ email, password }); // Gọi API

      if (response.data.success) {
        console.log('Login successful:', response.data.data);
        localStorage.setItem('userToken', response.data.token);

        loginContext(response.data.data, response.data.token);

        alert('Login successful! Redirecting...'); // Thông báo tạm thời
        navigate('/'); // Chuyển hướng về trang chủ
        // Hoặc navigate('/profile') hoặc trang nào đó bạn muốn
      } else {
        // Trường hợp API trả về success: false nhưng không phải lỗi HTTP (hiếm gặp nếu backend chuẩn)
        setError(response.data.message || 'Login failed.');
      }
    } catch (err) {
      // Xử lý lỗi từ API (ví dụ: sai credentials, server error)
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
      console.error('Login error:', err.response || err.message || err);
    } finally {
      setLoading(false); // Kết thúc loading
    }
  };

  const handleGoogleLogin = () => {
        // Điều hướng đến API backend để bắt đầu luồng Google OAuth
        // Backend sẽ điều hướng tiếp đến Google
        window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/auth/google`;
    };

  return (
    <>
      {/* Top bar */}
      <div className="login-top-bar">
        <div className="login-container login-top-bar-content">
          <div className="login-top-bar-message">
            summer sale for all swim suits And Free Express Delivery - OFF 50%{' '}
            <Link className="login-shop-link" to="/shop">ShopNow</Link>
          </div>
          <div className="relative">
            <button aria-expanded="false" aria-haspopup="true" className="login-language-button" id="langBtn">
              <span>English</span>
              <i className="fas fa-chevron-down"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="login-header">
        <div className="login-header-logo">Exclusive</div>
        <nav className="login-header-nav">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/contact">Contact</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/signup">Sign Up</NavLink>
        </nav>
        <form className="login-header-search-form">
          <input className="login-header-search-input" placeholder="What are you looking for?" type="text" />
          <button className="login-header-search-button" type="submit">
            <i className="fas fa-search"></i>
          </button>
        </form>
      </header>

      {/* Main content */}
      <main className="login-container login-main">
        <div className="login-image-container">
          <img
            alt="Shopping cart with smartphone and pink shopping bags on light blue background"
            className="login-image"
            height="400"
            src="https://storage.googleapis.com/a1aa/image/1f6a0c12-9199-43fb-11a4-58189e601ab3.jpg"
            width="400"
          />
        </div>
        <div className="login-form-container">
          <h2 className="login-form-title">Log in to Exclusive</h2>
          <p className="login-form-subtitle">Enter your details below</p>
          {/* Form đăng nhập */}

          
          <form className="login-form" onSubmit={handleLogin}> {/* Gắn onSubmit */}
            {error && <p className="login-form-error" style={{ color: 'red' }}>{error}</p>} {/* Hiển thị lỗi */}
            <input
              className="login-form-input"
              placeholder="Email" // Đã sửa thành Email cho rõ ràng
              type="email" // Nên dùng type="email" để trình duyệt validate
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="login-form-input"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="login-form-actions">
              <button className="login-submit-button" type="submit" disabled={loading}>
                {loading ? 'Logging In...' : 'Log In'} {/* Hiển thị trạng thái loading */}
              </button>
              <Link className="login-forgot-password-link" to="/forgot-password">
                Forget Password?
              </Link>
            </div>
             <button
                type="button"
                onClick={handleGoogleLogin}
                className="google-login-button" // Style nút này
                style={{ marginTop: '15px', width: '100%', padding: '10px', backgroundColor: '#db4437', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <i className="fab fa-google" style={{ marginRight: '10px' }}></i> Sign in with Google
            </button>
          </form>
          <p className="login-signup-prompt">
              Don't have an account?{' '}
              <Link className="login-signup-link" to="/signup">
                Sign Up
              </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      {/* Phần Footer giữ nguyên như code của bạn */}
      <footer className="login-footer">
        {/* ... (Nội dung footer của bạn) ... */}
      </footer>
    </>
  );
}

export default Login;