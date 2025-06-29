// ecommercewebsite/src/components/Auth/GoogleAuthCallback.js
import React, { useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import { getUserProfile } from '../../services/api'; // Để lấy thông tin user sau khi có token

function GoogleAuthCallback() {
    const location = useLocation();
    const navigate = useNavigate();
    const { loginContext, setCurrentUser } = useAuth(); // loginContext sẽ lưu token và user, setCurrentUser có thể dùng nếu chỉ có token

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const error = params.get('error');

        if (error) {
            console.error("Google Auth Error:", error);
            alert(`Google Authentication Failed: ${error}`);
            navigate('/login'); // Điều hướng về trang login nếu có lỗi
            return;
        }

        if (token) {
            console.log("Received token from Google callback:", token);
            localStorage.setItem('userToken', token); // Lưu token

            // Sau khi có token, gọi API để lấy thông tin user và cập nhật context
            const fetchProfileAndLogin = async () => {
                try {
                    const profileResponse = await getUserProfile(); // API này sẽ tự dùng token từ localStorage
                    if (profileResponse.data.success) {
                        loginContext(profileResponse.data.data, token); // Cập nhật AuthContext
                        // Quyết định điều hướng người dùng về đâu
                        // Ví dụ: nếu có state 'from' từ ProtectedRoute, điều hướng về đó
                        const from = location.state?.from?.pathname || "/"; // Lấy 'from' từ state nếu có
                        navigate(from, { replace: true });
                    } else {
                        throw new Error(profileResponse.data.message || "Failed to fetch user profile after Google login.");
                    }
                } catch (err) {
                    console.error("Error fetching profile after Google login:", err);
                    localStorage.removeItem('userToken'); // Xóa token nếu không lấy được profile
                    alert("Login with Google succeeded, but failed to retrieve your profile. Please try logging in manually.");
                    navigate('/login');
                }
            };

            fetchProfileAndLogin();

        } else {
            // Không có token, có thể là lỗi không mong muốn
            console.error("No token found in Google callback URL.");
            alert("An unexpected error occurred during Google Sign-In. Please try again.");
            navigate('/login');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location, navigate, loginContext]); // Chỉ chạy một lần khi location thay đổi

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
            <h2>Processing Google Sign-In...</h2>
            <p>Please wait while we securely log you in.</p>
            {/* Bạn có thể thêm một spinner ở đây */}
        </div>
    );
}

export default GoogleAuthCallback;