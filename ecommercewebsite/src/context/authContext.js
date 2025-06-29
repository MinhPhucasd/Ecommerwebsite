// src/context/authContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { getUserProfile } from '../services/api'; // Hàm này sẽ gọi GET /api/users/profile

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('userToken');
        if (token) {
            const fetchUserProfileOnLoad = async () => {
                try {
                    // Giả sử api.js đã có interceptor đính kèm token
                    const response = await getUserProfile();
                    if (response.data.success) {
                        setCurrentUser(response.data.data);
                    } else {
                        localStorage.removeItem('userToken');
                        setCurrentUser(null);
                    }
                } catch (error) {
                    console.error("AuthContext: Failed to fetch user profile", error);
                    if (error.response && error.response.status === 401) {
                        localStorage.removeItem('userToken'); // Token không hợp lệ
                        setCurrentUser(null);
                    }
                } finally {
                    setLoadingAuth(false);
                }
            };
            fetchUserProfileOnLoad();
        } else {
            setLoadingAuth(false);
        }
    }, []);

    const loginContext = (userData, token) => { // Được gọi từ trang Login
        localStorage.setItem('userToken', token);
        setCurrentUser(userData);
    };

    const logoutContext = async () => { // Được gọi từ nút Logout
        // Nếu bạn có API backend cho logout (ví dụ: để vô hiệu hóa token phía server)
        // try {
        //   await logoutUserAPI(); // Tạo hàm này trong services/api.js nếu có endpoint
        // } catch (error) {
        //   console.error("Logout API error", error);
        // }
        localStorage.removeItem('userToken');
        setCurrentUser(null);
    };

    return (
        <AuthContext.Provider value={{ currentUser, setCurrentUser, loginContext, logoutContext, loadingAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);