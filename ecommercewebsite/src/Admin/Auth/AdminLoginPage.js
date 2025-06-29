// ecommercewebsite/src/Admin/Auth/AdminLoginPage.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/authContext'; // Sử dụng chung AuthContext
import api from '../../services/api'; // Import instance axios đã cấu hình
import './AdminLoginPage.css'; // Tạo file CSS riêng

function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { loginContext } = useAuth(); // Dùng chung loginContext

    const handleAdminLogin = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Gọi API admin login mới tạo
            const response = await api.post('/auth/admin/login', { email, password });

            if (response.data.success) {
                console.log('Admin login successful:', response.data.data);
                // Lưu token và cập nhật context như bình thường
                // localStorage.setItem('userToken', response.data.token); // loginContext đã làm việc này
                loginContext(response.data.data, response.data.token);
                navigate('/admin/dashboard'); // Chuyển hướng đến admin dashboard
            } else {
                setError(response.data.message || 'Admin login failed.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred. Please try again.');
            console.error('Admin login error:', err.response || err.message || err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <div className="admin-login-container">
                <img src="/path/to/your/admin-logo.png" alt="Admin Panel Logo" className="admin-login-logo" />
                <h2>Admin Panel Login</h2>
                <form onSubmit={handleAdminLogin} className="admin-login-form">
                    {error && <p className="admin-login-error">{error}</p>}
                    <div className="admin-form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="admin@example.com"
                        />
                    </div>
                    <div className="admin-form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>
                    <button type="submit" className="admin-login-button" disabled={loading}>
                        {loading ? 'Logging In...' : 'Login'}
                    </button>
                     <p style={{ textAlign: 'center', marginTop: '15px' }}>
                        <Link to="/">Back to Main Site</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default AdminLoginPage;