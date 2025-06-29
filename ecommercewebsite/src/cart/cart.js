// src/cart/cart.js
import React, { useState, useEffect, useMemo } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import './cart.css';
import { useAuth } from '../context/authContext';
import { useCart } from '../context/cartContext.js';
import {
  updateCartItemQuantity,
  removeItemFromCart,
  // applyDiscountCode,
  createOrder,
} from '../services/api';

const FIXED_COUPONS = {
  "SAVE15": { type: "percentage", value: 15, description: "Get 15% off your order." },
  "TAKE5": { type: "fixed_amount", value: 5, description: "Get $5 off." },
  "FREESHIP": { type: "shipping", value: 0, description: "Free shipping activated." } // Ví dụ cho free shipping
};

function Cart() {
  const { currentUser } 
    = useAuth();
  const { cart, fetchCartData: refreshCart, loadingCart, setCart } = useCart(); 

  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  
  const [discountInfo, setDiscountInfo] = useState(null);
  const [couponError, setCouponError] = useState('');

  const [applyingCoupon, setApplyingCoupon] = useState(false);
  

  const subtotal = useMemo(() => {
    if (!cart || !cart.items || cart.items.length === 0) return 0;
    return cart.items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity, 10) || 0;
      return sum + item.price * item.quantity;
    }, 0);
  }, [cart]);

  const shippingFee = 0; 

  const total = useMemo(() => {
    let currentTotal = subtotal + shippingFee;
    if (discountInfo && discountInfo.amount > 0) {
      currentTotal -= discountInfo.amount;
    }
    return currentTotal > 0 ? currentTotal : 0;
  }, [subtotal, shippingFee, discountInfo]);


  const handleQuantityChange = async (productId, variantId, newQuantity) => {
    const quantityNum = parseInt(newQuantity, 10);
    if (quantityNum < 1) return; 

    try {
      const response = await updateCartItemQuantity({ productId, variantId, quantity: quantityNum });
      if (response.data.success) {
        refreshCart(); 
        setDiscountInfo(null);
        setCouponError('');
      } else {
        alert(response.data.message || "Failed to update quantity.");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Error updating quantity.");
      console.error("Update quantity error:", error);
    }
  };

  const handleRemoveItem = async (productId, variantId) => {
    if (!window.confirm("Are you sure you want to remove this item from your cart?")) return;
    try {
      const response = await removeItemFromCart({ productId, variantId });
      if (response.data.success) {
        refreshCart();
        setDiscountInfo(null);
        setCouponError('');
      } else {
        alert(response.data.message || "Failed to remove item.");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Error removing item.");
      console.error("Remove item error:", error);
    }
  };

  const handleApplyCoupon = async (event) => {
    event.preventDefault();
    const enteredCode = couponCode.trim().toUpperCase();

    if (!enteredCode) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    setApplyingCoupon(true);
    setCouponError('');
    setDiscountInfo(null);
    await new Promise(resolve => setTimeout(resolve, 500));

    if (FIXED_COUPONS[enteredCode]) {
      const coupon = FIXED_COUPONS[enteredCode];
      let discountAmount = 0;

      if (coupon.type === "percentage") {
        discountAmount = (subtotal * coupon.value) / 100;
      } else if (coupon.type === "fixed_amount") {
        discountAmount = coupon.value;
      } else if (coupon.type === "shipping") {
        discountAmount = 0; 
      }

      if (coupon.type !== "shipping" && discountAmount > subtotal) {
        discountAmount = subtotal;
      }

      setDiscountInfo({
        code: enteredCode,
        amount: discountAmount,
        message: coupon.description || `Coupon "${enteredCode}" applied successfully!`,
        type: coupon.type
      });
      setCouponCode('');
    } else {
      setCouponError("Invalid or expired coupon code.");
    }
    setApplyingCoupon(false);
  };

  const handleUpdateCart = () => {
    refreshCart();
    setDiscountInfo(null); 
    setCouponError('');
    alert("Cart Refreshed!");
  };

  const cartBadgeCount = cart && cart.items ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;


  if (loadingCart && !cart) { 
    return <div style={{ textAlign: 'center', margin: '5rem auto' }}>Loading your cart...</div>;
  }

  return (
    <>
      {/* Top Black Bar */}
      <div className="cart-top-bar">
        <div className="cart-container">
          <span>Summer Sale For All Swim Suits And Free Express Delivery - OFF 50%:</span>
          <Link to="/shop" className="cart-shop-now-button">ShopNow</Link>
        </div>
      </div>

      {/* Header */}
      <header className="cart-header">
        <div className="cart-container cart-header-content">
          <div className="cart-header-left">
            <Link to="/" className="cart-header-logo">Exclusive</Link> 
            <nav className="cart-header-nav">
              <NavLink to="/">Home</NavLink>
              <NavLink to="/contact">Contact</NavLink>
              <NavLink to="/about">About</NavLink>
              {!currentUser && <NavLink to="/signup">Sign Up</NavLink>}
            </nav>
          </div>
          <div className="cart-header-right">
            <Link to="/wishlist" aria-label="Wishlist" className="cart-header-icon-button">
              <i className="far fa-heart"></i>
            </Link>
            <Link to="/cart" aria-label="Cart" className="cart-header-icon-button" style={{ position: 'relative' }}>
              <i className="fas fa-shopping-cart"></i>
              {currentUser && cartBadgeCount > 0 && (
                <span className="cart-badge" style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#DB4444', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '18px' }}>{cartBadgeCount}</span>
              )}
            </Link>
            {currentUser ? (
              <Link to="/account" aria-label="User Account" className="cart-header-icon-button">
                {currentUser.fullName ?
                  <span style={{ display: 'inline-block', width: '24px', height: '24px', borderRadius: '50%', background: '#DB4444', color: 'white', textAlign: 'center', lineHeight: '24px', fontWeight: 'bold', fontSize: '0.8em' }}>
                    {currentUser.fullName.charAt(0).toUpperCase()}
                  </span>
                  : <i className="far fa-user"></i>
                }
              </Link>
            ) : (
              <Link to="/login" className="cart-header-nav" style={{ fontWeight: 500, marginLeft: '10px', color: '#333', textDecoration: 'none', fontSize: '0.875rem' }}>Login</Link>
            )}
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="cart-container cart-breadcrumb">
        <nav aria-label="Breadcrumb" className="cart-breadcrumb-nav">
          <Link className="cart-breadcrumb-link" to="/">Home</Link>
          <span className="cart-breadcrumb-separator">/</span>
          <span className="cart-breadcrumb-current">Cart</span>
        </nav>
      </div>

      {/* Cart Table */}
      <main className="cart-container cart-main">
        {loadingCart && <p>Updating cart...</p>}
        {(!cart || !cart.items || cart.items.length === 0) && !loadingCart ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <h2>Your cart is empty.</h2>
            <Link to="/" className="cart-action-button" style={{ marginTop: '1rem', display: 'inline-block' }}>Continue Shopping</Link>
          </div>
        ) : (
          <>
            <table className="cart-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Subtotal</th>
                  <th>Action</th> 
                </tr>
              </thead>
              <tbody>
                {cart && cart.items && cart.items.map((item) => (
                  
                  <tr key={item.productId + (item.variantId || '')}>
                    <td className="cart-product-cell">
                      <div className="cart-product-image-container">
                        <img
                          alt={item.name}
                          className="cart-product-image"
                          src={item.image || 'https://via.placeholder.com/48'} 
                        />
                      </div>
                      <Link to={`/productdetail/${item.productId}`}>{item.name}</Link>
                    </td>
                    <td>${item.price?.toFixed(2)}</td>
                    <td>
                      <input
                        type="number"
                        aria-label={`Quantity for ${item.name}`}
                        className="cart-quantity-select" // Đổi thành input type number cho dễ
                        value={item.quantity}
                        min="1"
                        max={item.productStock || 10} // Lấy tồn kho từ item.productStock (backend cần trả về)
                        onChange={(e) => handleQuantityChange(item.productId, item.variantId, e.target.value)}
                        style={{ width: '60px', textAlign: 'center', padding: '5px' }}
                      />
                    </td>
                    <td className="cart-subtotal">${(item.price * item.quantity).toFixed(2)}</td>
                    <td>
                      <button
                        aria-label={`Remove ${item.name}`}
                        className="cart-product-remove-button" // Style nút này
                        onClick={() => handleRemoveItem(item.productId, item.variantId)}
                        style={{ background: 'transparent', border: 'none', color: '#DB4444', cursor: 'pointer', fontSize: '1.2em' }}
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="cart-action-buttons">
              <Link to="/shop" className="cart-action-button">Return To Shop</Link>
              {/* Nút Update Cart có thể không cần thiết nếu thay đổi số lượng tự cập nhật */}
              <button className="cart-action-button" type="button" onClick={handleUpdateCart}>Update Cart</button>
            </div>

            <div className="cart-summary-section">
              <form className="cart-coupon-form" onSubmit={handleApplyCoupon}>
                <input
                  className="cart-coupon-input"
                  placeholder="Coupon Code"
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <button className="cart-coupon-button" type="submit">Apply Coupon</button>
              </form>
              {couponError && <p style={{ color: 'red', marginTop: '5px', fontSize: '0.8em' }}>{couponError}</p>}
              {discountInfo && discountInfo.amount > 0 && (
                <p style={{ color: 'green', marginTop: '5px', fontSize: '0.8em' }}>
                  {discountInfo.message} (Discount: -${discountInfo.amount.toFixed(2)})
                </p>
              )}

              <div aria-label="Cart Total" className="cart-total-box">
                <h2 className="cart-total-title">Cart Total</h2>
                <div className="cart-total-row">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="cart-total-row">
                  <span>Shipping:</span>
                  <span>{shippingFee === 0 ? 'Free' : `$${shippingFee.toFixed(2)}`}</span>
                </div>
                {discountInfo && discountInfo.amount > 0 && (
                  <div className="cart-total-row" style={{ color: 'green' }}>
                    <span>Discount ({discountInfo.code}):</span>
                    <span>-${discountInfo.amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="cart-total-row total">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <button onClick={() => navigate('/checkout')} className="cart-checkout-button">
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="cart-footer"> {/* ... (JSX Footer của bạn) ... */} </footer>
    </>
  );
}

export default Cart;