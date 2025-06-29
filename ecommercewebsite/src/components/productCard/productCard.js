// src/components/ProductCard/ProductCard.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext'; 
import { useCart } from '../../context/cartContext'; 
import { addItemToCart } from '../../services/api';   

const ProductCard = ({ product }) => {
    const { currentUser } = useAuth();
    const { fetchCartData: refreshCart } = useCart();
    const navigate = useNavigate(); 

    const handleAddToCartFromCard = async () => {
        if (!currentUser) {
            alert("Please log in to add items to your cart.");
            navigate('/login'); 
            return;
        }
        try {
            const itemData = { productId: product._id, quantity: 1 };
            // Xử lý variantId nếu sản phẩm có biến thể và bạn muốn chọn biến thể mặc định
            // if (product.defaultVariantId) itemData.variantId = product.defaultVariantId;
            const response = await addItemToCart(itemData);
            if (response.data.success) {
                alert(`${product.name} added to cart!`);
                refreshCart();
            } else {
                alert("Failed to add product to cart: " + (response.data.message || "Unknown error"));
            }
        } catch (error) {
            alert("Error adding product to cart: " + (error.response?.data?.message || error.message));
        }
    };

    // Hàm render sao (nếu có)
    const renderStars = (rating) => { /* ... */ };

    if (!product) return null;

    return (
        <div className="product-card"> {/* Sử dụng class từ home.css hoặc ProductCard.css */}
            {product.discountPercentage && (
                <div className="product-discount-badge">-{product.discountPercentage}%</div>
            )}
            <Link to={`/productdetail/${product._id}`}>
                <img
                    alt={product.name}
                    className="product-image"
                    src={product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/150'}
                />
            </Link>
            <div className="product-actions">
                <button aria-label="Add to favorites" className="product-action-button"> {/* TODO: Wishlist */}
                    <i className="far fa-heart"></i>
                </button>
                <Link to={`/productdetail/${product._id}`} aria-label="View details" className="product-action-button">
                    <i className="far fa-eye"></i>
                </Link>
            </div>
            <button
                className="add-to-cart-button"
                type="button"
                onClick={handleAddToCartFromCard}
            >
                Add To Cart
            </button>
            <p className="product-name">{product.name}</p>
            <p className="product-price">
                ${product.price?.toFixed(2)}
                {product.originalPrice && product.originalPrice > product.price && (
                    <span className="product-original-price">${product.originalPrice.toFixed(2)}</span>
                )}
            </p>
            <p className="product-rating">
                {/* {renderStars(product.averageRating)} */}
                <span className="product-rating-count">({product.numReviews || 0})</span>
            </p>
        </div>
    );
};

export default ProductCard;