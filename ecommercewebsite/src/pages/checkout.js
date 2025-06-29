// src/pages/checkout.js
import React, { useState, useEffect, useMemo } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { useCart } from '../context/cartContext';
import { createOrder } from '../services/api'; // Giả sử bạn vẫn muốn gọi API này
import './checkout.css'; // Tạo file CSS này

function CheckoutPage() {
    const { currentUser } = useAuth();
    const { cart, clearCartContext, fetchCartData: refreshCart } = useCart(); // Thêm refreshCart
    const navigate = useNavigate();
    const location = useLocation(); // Để nhận thông tin coupon từ trang Cart

    const [billingDetails, setBillingDetails] = useState({
        firstName: '',
        lastName: '',
        companyName: '',
        streetAddress: '',
        apartment: '',
        city: '',
        stateProvince: '',
        postalCode: '',
        country: 'Vietnam',
        phone: '',
        email: '',
        saveInfo: false,
    });
    const [placingOrder, setPlacingOrder] = useState(false);
    const [orderError, setOrderError] = useState('');

    // Lấy coupon đã áp dụng từ trang Cart (nếu có)
    const appliedCoupon = useMemo(() => location.state?.appliedCoupon || null, [location.state]);

    useEffect(() => {
        if (currentUser) {
            const nameParts = currentUser.fullName ? currentUser.fullName.split(' ') : [];
            setBillingDetails(prev => ({
                ...prev,
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                streetAddress: currentUser.shippingAddress || '', // Địa chỉ chính từ user
                phone: currentUser.phone || '',
                email: currentUser.email || '',
            }));
        }
        // Nếu không có cart items, chuyển về trang giỏ hàng (hoặc trang chủ)
        if (!cart || !cart.items || cart.items.length === 0) {
            alert("Your cart is empty. Redirecting to cart page.");
            navigate('/cart');
        }
    }, [currentUser, cart, navigate]);

    const subtotal = useMemo(() => {
        if (!cart || !cart.items) return 0;
        return cart.items.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (parseInt(item.quantity, 10) || 0), 0);
    }, [cart]);

    const [actualShippingFee, setActualShippingFee] = useState(0); // Mặc định free

    useEffect(() => {
        if (appliedCoupon && appliedCoupon.type === "shipping") {
            setActualShippingFee(0);
        } else {
            setActualShippingFee(0);
        }
    }, [appliedCoupon]);

    const total = useMemo(() => {
        let currentTotal = subtotal + actualShippingFee;
        if (appliedCoupon && appliedCoupon.type !== "shipping" && appliedCoupon.amount > 0) {
            currentTotal -= appliedCoupon.amount;
        }
        return currentTotal > 0 ? currentTotal : 0;
    }, [subtotal, actualShippingFee, appliedCoupon]);

    const handleBillingChange = (e) => {
        const { name, value, type, checked } = e.target;
        setBillingDetails(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handlePlaceOrder = async (event) => {
        event.preventDefault();
        setPlacingOrder(true);
        setOrderError('');

        const requiredFields = ['firstName', 'streetAddress', 'city', 'postalCode', 'country', 'phone', 'email'];
        for (const field of requiredFields) {
            if (!billingDetails[field] || String(billingDetails[field]).trim() === '') {
                const fieldNameReadable = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
                setOrderError(`Please fill in the required: ${fieldNameReadable}.`);
                setPlacingOrder(false);
                return;
            }
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(billingDetails.email)) {
            setOrderError("Please enter a valid email address.");
            setPlacingOrder(false);
            return;
        }

        const orderData = {
            orderItems: cart.items.map(item => ({
                productId: item.productId, variantId: item.variantId, name: item.name,
                quantity: parseInt(item.quantity, 10), price: parseFloat(item.price), image: item.image,
            })),
            shippingAddress: {
                fullName: `${billingDetails.firstName} ${billingDetails.lastName || ''}`.trim(),
                addressLine1: billingDetails.streetAddress, apartment: billingDetails.apartment || undefined,
                city: billingDetails.city, state: billingDetails.stateProvince || undefined,
                postalCode: billingDetails.postalCode, country: billingDetails.country,
                phone: billingDetails.phone, email: billingDetails.email
            },
            paymentMethod: 'cash_on_delivery', // Giữ phương thức thanh toán đơn giản
            itemsPrice: subtotal,
            shippingPrice: actualShippingFee,
            couponCode: appliedCoupon ? appliedCoupon.code : undefined,
            userId: currentUser ? currentUser._id : null,
        };

        console.log("Placing order with data:", orderData);

        try {
            // Nếu bạn muốn giả lập hoàn toàn ở frontend (không gọi API backend):
            // console.log("Frontend Only: Simulating order placement.", orderData);
            // await new Promise(resolve => setTimeout(resolve, 1000));
            // const simulatedOrderId = `SIM_ORD_FRONTEND_${Date.now().toString().slice(-6)}`;
            // alert(`Order Placed (Simulated Frontend)! Order ID: ${simulatedOrderId}`);
            // clearCartContext();
            // navigate(`/order-success/${simulatedOrderId}`);

            // Nếu bạn MUỐN GỌI API BACKEND (khuyến nghị cho đồ án thực tế):
            const response = await createOrder(orderData);
            if (response.data.success) {
                const createdOrder = response.data.data;
                alert("Order placed successfully! Order ID: " + (createdOrder._id || 'N/A'));
                clearCartContext(); // Xóa giỏ hàng ở context frontend
                navigate(`/order-success/${createdOrder._id || 'new'}`);
            } else {
                setOrderError(response.data.message || "Failed to place order.");
            }
        } catch (err) {
            setOrderError(err.response?.data?.message || "An error occurred while placing your order.");
            console.error("Place order error:", err);
        } finally {
            setPlacingOrder(false);
        }
    };

    const cartBadgeCount = useMemo(() => { // Để cập nhật header (nếu header là component chung)
        return cart && cart.items ? cart.items.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 0), 0) : 0;
    }, [cart]);

    if (!cart || !cart.items || cart.items.length === 0) {
        // useEffect ở trên sẽ điều hướng nếu cart rỗng, nhưng để đề phòng:
        return (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <h2>Your cart is empty. Cannot proceed to checkout.</h2>
                <Link to="/cart" className="cart-action-button" style={{ marginTop: '1rem', display: 'inline-block', textDecoration: 'none' }}>
                    Back to Cart
                </Link>
            </div>
        );
    }

    return (
        <>
            {/* Header nên là component chung để cartBadgeCount và user login/logout được cập nhật */}
            <header className="checkout-page-header"> {/* Tạo class riêng hoặc dùng chung */}
                <div className="cart-container cart-header-content"> {/* Tái sử dụng class từ cart.css */}
                    <Link to="/" className="cart-header-logo">Exclusive</Link>
                    <nav className="cart-header-nav">
                        <NavLink to="/">Home</NavLink>
                        <NavLink to="/contact">Contact</NavLink>
                        {/* ... các link khác ... */}
                    </nav>
                    <div className="cart-header-right">
                        {/* ... Icons Wishlist, Cart, User ... */}
                    </div>
                </div>
            </header>

            <div className="cart-container cart-breadcrumb" style={{ marginBottom: '3rem', marginTop: '1rem' }}>
                <nav aria-label="Breadcrumb" className="cart-breadcrumb-nav">
                    <Link className="cart-breadcrumb-link" to="/">Home</Link>
                    <span className="cart-breadcrumb-separator">/</span>
                    <Link className="cart-breadcrumb-link" to="/cart">Cart</Link>
                    <span className="cart-breadcrumb-separator">/</span>
                    <span className="cart-breadcrumb-current">Checkout</span>
                </nav>
            </div>

            <main className="cart-container checkout-main-content" style={{ display: 'flex', justifyContent: 'space-between', gap: '50px', flexWrap: 'wrap' }}>
                <div className="checkout-billing-details-section" style={{ flex: '3 1 500px', minWidth: '300px' }}>
                    <h2>Billing Details</h2>
                    <form onSubmit={handlePlaceOrder} id="checkout-form" className="checkout-form">
                        <div className="form-row">
                            <label htmlFor="firstName">First Name*</label>
                            <input type="text" id="firstName" name="firstName" value={billingDetails.firstName} onChange={handleBillingChange} required />
                        </div>
                        <div className="form-row">
                            <label htmlFor="lastName">Last Name</label>
                            <input type="text" id="lastName" name="lastName" value={billingDetails.lastName} onChange={handleBillingChange} />
                        </div>
                        <div className="form-row">
                            <label htmlFor="companyName">Company Name</label>
                            <input type="text" id="companyName" name="companyName" value={billingDetails.companyName} onChange={handleBillingChange} />
                        </div>
                        <div className="form-row">
                            <label htmlFor="country">Country / Region*</label>
                            <input type="text" id="country" name="country" value={billingDetails.country} onChange={handleBillingChange} required />
                        </div>
                        <div className="form-row">
                            <label htmlFor="streetAddress">Street Address*</label>
                            <input type="text" id="streetAddress" name="streetAddress" placeholder="House number and street name" value={billingDetails.streetAddress} onChange={handleBillingChange} required />
                        </div>
                        <div className="form-row">
                            <label htmlFor="apartment">Apartment, suite, unit, etc. (optional)</label>
                            <input type="text" id="apartment" name="apartment" value={billingDetails.apartment} onChange={handleBillingChange} />
                        </div>
                        <div className="form-row">
                            <label htmlFor="city">Town / City*</label>
                            <input type="text" id="city" name="city" value={billingDetails.city} onChange={handleBillingChange} required />
                        </div>
                        <div className="form-row">
                            <label htmlFor="stateProvince">Province / State</label>
                            <input type="text" id="stateProvince" name="stateProvince" value={billingDetails.stateProvince} onChange={handleBillingChange} />
                        </div>
                        <div className="form-row">
                            <label htmlFor="postalCode">Postal Code / ZIP*</label>
                            <input type="text" id="postalCode" name="postalCode" value={billingDetails.postalCode} onChange={handleBillingChange} required />
                        </div>
                        <div className="form-row">
                            <label htmlFor="phone">Phone Number*</label>
                            <input type="tel" id="phone" name="phone" value={billingDetails.phone} onChange={handleBillingChange} required />
                        </div>
                        <div className="form-row">
                            <label htmlFor="email">Email Address*</label>
                            <input type="email" id="email" name="email" value={billingDetails.email} onChange={handleBillingChange} required readOnly={!!currentUser && !!currentUser.email} />
                        </div>
                        {/* <div className="form-row checkbox-row">
              <input type="checkbox" id="saveInfo" name="saveInfo" checked={billingDetails.saveInfo} onChange={handleBillingChange} />
              <label htmlFor="saveInfo">Save this information for next time orders</label>
            </div> */}
                        {/* Nút Place Order sẽ nằm trong Order Summary */}
                    </form>
                </div>

                <div className="checkout-order-summary-section" style={{ flex: '2 1 350px', minWidth: '280px' }}>
                    <div className="cart-total-box" style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '4px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Your Order</h3>
                        {cart && cart.items && cart.items.map(item => (
                            <div key={item.productId + (item.variantId || '')} className="checkout-summary-item">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <img src={item.image || 'https://via.placeholder.com/40'} alt={item.name} style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                                    <span title={item.name} style={{ flexGrow: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name} x {item.quantity}</span>
                                </div>
                                <span>${(parseFloat(item.price || 0) * parseInt(item.quantity, 10)).toFixed(2)}</span>
                            </div>
                        ))}
                        <hr style={{ margin: '15px 0' }} />
                        <div className="cart-total-row"><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
                        <div className="cart-total-row"><span>Shipping:</span><span>{actualShippingFee === 0 ? 'Free' : `$${actualShippingFee.toFixed(2)}`}</span></div>
                        {appliedCoupon && appliedCoupon.amount > 0 && (
                            <div className="cart-total-row" style={{ color: 'green' }}>
                                <span>Discount ({appliedCoupon.code}):</span>
                                <span>-${appliedCoupon.amount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="cart-total-row total"><span>Total:</span><span>${total.toFixed(2)}</span></div>

                        <div style={{ marginTop: '20px', marginBottom: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <input type="radio" id="payment_bank" name="payment_method_group" value="bank" disabled />
                                <label htmlFor="payment_bank" style={{ flexGrow: 1, marginLeft: '10px', cursor: 'not-allowed', color: '#aaa' }}>Bank (Coming Soon)</label>
                                {/* <img src="payment-icons.png" alt="Payment methods" style={{height: '24px'}} /> */}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <input type="radio" id="payment_cod" name="payment_method_group" value="cash_on_delivery" checked readOnly />
                                <label htmlFor="payment_cod" style={{ marginLeft: '10px' }}>Cash on delivery</label>
                            </div>
                        </div>

                        {/* Form Coupon (có thể giữ lại ở đây nếu muốn, hoặc chỉ dùng coupon đã apply từ trang cart) */}
                        {/* <form className="cart-coupon-form" style={{margin: '20px 0'}}>
              <input className="cart-coupon-input" placeholder="Coupon Code" type="text" />
              <button className="cart-coupon-button" type="button">Apply Coupon</button>
            </form> 
            */}

                        {orderError && <p style={{ color: 'red', marginBottom: '15px' }}>{orderError}</p>}
                        <button
                            type="submit"
                            form="checkout-form" // Liên kết với form billing details
                            className="cart-checkout-button" // Tái sử dụng class
                            style={{ width: '100%', marginTop: '15px' }}
                            disabled={placingOrder}
                        >
                            {placingOrder ? 'Placing Order...' : 'Place Order'}
                        </button>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="cart-footer" style={{ marginTop: '5rem' }}> {/* ... */} </footer>
        </>
    );
}

export default CheckoutPage;