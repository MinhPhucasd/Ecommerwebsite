// src/context/cartContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { getCart } from '../services/api'; // Hàm này sẽ gọi GET /api/cart
import { useAuth } from './authContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(null); // cart là object { items: [], ... }
    const [loadingCart, setLoadingCart] = useState(false);
    const { currentUser } = useAuth();

    const fetchCartData = useCallback(async () => {
        if (!currentUser) {
            setCart(null); // Nếu không có user, không có cart
            return;
        }
        setLoadingCart(true);
        try {
            const response = await getCart();
            if (response.data.success) {
                setCart(response.data.data);
            } else {
                setCart(null); // Hoặc { items: [] } nếu backend trả về lỗi nhưng vẫn muốn có cấu trúc cart
            }
        } catch (error) {
            console.error("CartContext: Failed to fetch cart", error);
            setCart(null);
            if (error.response && error.response.status === 401) {
                // Có thể xử lý logout nếu token không hợp lệ
            }
        } finally {
            setLoadingCart(false);
        }
    }, [currentUser]); // useCallback với dependency là currentUser

    useEffect(() => {
        fetchCartData();
    }, [fetchCartData]); // useEffect sẽ chạy khi fetchCartData (tức là khi currentUser thay đổi)

    const clearCartContext = () => {
        setCart(null); // Hoặc { items: [] }
    }

    return (
        <CartContext.Provider value={{ cart, setCart, fetchCartData, loadingCart, clearCartContext }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);