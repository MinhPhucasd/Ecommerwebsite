// src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('userToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            console.error("Unauthorized! Logging out or redirecting...");
            localStorage.removeItem('userToken');
            // Consider using a more integrated way to redirect, e.g., via context or router history
            // if (window.location.pathname !== '/login') {
            //    window.location.href = '/login';
            // }
        }
        return Promise.reject(error);
    }
);

// Auth
export const loginUser = (credentials) => api.post('/auth/login', credentials);
export const registerUser = (userData) => api.post('/auth/register', userData);
export const getUserProfile = () => api.get('/users/profile');

// Products (User & Admin)
export const fetchProducts = (params) => api.get('/products', { params });
export const fetchProductById = (productId) => api.get(`/products/${productId}`);
export const getNewProducts = (params) => api.get('/products/new', { params });
export const getBestsellerProducts = (params) => api.get('/products/bestsellers', { params });
export const addProductReview = (productId, reviewData) => api.post(`/products/${productId}/reviews`, reviewData);

// Product Management (Admin Only)
export const createNewProduct = (productData) => api.post('/products', productData); // Used by admin to create
export const updateProductAPI = (productId, productData) => api.put(`/products/${productId}`, productData); // Used by admin to update
export const deleteProductAPI = (productId) => api.delete(`/products/${productId}`); // Used by admin to delete

// Cart
export const getCart = () => api.get('/cart');
export const addItemToCart = (itemData) => api.post('/cart', itemData);
export const updateCartItemQuantity = (itemData) => api.put('/cart/item', itemData);
export const removeItemFromCart = (itemIdentifiers) => api.delete('/cart/item', { data: itemIdentifiers });
export const clearCartAPI = () => api.delete('/cart');
export const applyDiscountCode = (couponData) => api.post('/discounts/apply', couponData);

// Account and Profile
export const updateUserProfile = (profileData) => api.put('/users/profile', profileData);
export const changeUserPassword = (passwordData) => api.put('/users/change-password', passwordData);
export const getAddresses = () => api.get('/users/addresses');
export const addAddress = (addressData) => api.post('/users/addresses', addressData);
export const updateAddress = (addressId, addressData) => api.put(`/users/addresses/${addressId}`, addressData);
export const deleteAddress = (addressId) => api.delete(`/users/addresses/${addressId}`);
export const setDefaultAddress = (addressId) => api.put(`/users/addresses/${addressId}/default`);

// Order
export const createOrder = (orderData) => api.post('/orders', orderData);
export const getMyOrders = () => api.get('/orders/myorders');
export const getOrderDetails = (orderId) => api.get(`/orders/${orderId}`);

// Admin Order Management
export const adminGetAllOrders = (params) => api.get('/orders/admin/all', { params }); // NEW - Endpoint to be created
export const adminUpdateOrderStatus = (orderId, statusData) => api.put(`/orders/admin/${orderId}/status`, statusData); // NEW - Endpoint to be created

// Admin Review Management
export const adminGetAllReviews = (params) => api.get('/reviews/admin/all', { params }); // NEW - Endpoint to be created
export const adminDeleteReview = (reviewId) => api.delete(`/reviews/admin/${reviewId}`); // NEW - Endpoint to be created

// Admin Dashboard
export const getAdminDashboardStats = () => api.get('/admin/dashboard/stats'); 
// Utils
export const fetchFilterCategories = () => api.get('/products/utils/categories');

// Admin usermanagement
export const adminFetchUsers = (params) => api.get('/users/admin/all', { params });
export const adminUpdateUserAPI = (userId, userData) => api.put(`/users/admin/${userId}/update`, userData);

export default api;