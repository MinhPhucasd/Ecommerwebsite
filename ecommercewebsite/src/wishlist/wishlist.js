import React from 'react';
// Import Link/NavLink
import { Link, NavLink } from 'react-router-dom';
// Import CSS - **KIỂM TRA TÊN FILE**
import './wishlist.css';

function Wishlist() {

    // Dữ liệu mẫu cho wishlist và just for you items
    const wishlistItems = [
        { id: 'w1', name: 'Gucci duffle bag', price: 960, originalPrice: 1150, discount: 20, image: 'https://storage.googleapis.com/a1aa/image/9046173d-edca-4995-6725-e1a1574f3b53.jpg' },
        { id: 'w2', name: 'RGB liquid CPU Cooler', price: 1960, originalPrice: null, discount: null, image: 'https://storage.googleapis.com/a1aa/image/bb271309-1c0b-4a4c-cabe-10c9aee81731.jpg' },
        { id: 'w3', name: 'GPH Shooter USB Gamepad', price: 550, originalPrice: null, discount: null, image: 'https://storage.googleapis.com/a1aa/image/47d7e472-2ca7-45f9-dd6d-e238567d0923.jpg' },
        { id: 'w4', name: 'Quilted Satin Jacket', price: 750, originalPrice: null, discount: null, image: 'https://storage.googleapis.com/a1aa/image/e37f74c0-dec7-459e-709e-23eec6b2097a.jpg' },
    ];

    const justForYouItems = [
        { id: 'j1', name: 'ASUS FHD Gaming Laptop', price: 960, originalPrice: 1160, rating: 4.5, reviews: 95, discount: 20, image: 'https://storage.googleapis.com/a1aa/image/2edf2fc8-01ee-4d18-dcd5-8341cc94bcd8.jpg', tag: 'discount' },
        { id: 'j2', name: 'IPS LCD Gaming Monitor', price: 1160, originalPrice: null, rating: 5, reviews: 95, image: 'https://storage.googleapis.com/a1aa/image/c16fd26b-6a9d-4972-17e0-1246293ea5da.jpg', tag: null },
        { id: 'j3', name: 'HAVIT HV-G92 Gamepad', price: 560, originalPrice: null, rating: 5, reviews: 95, image: 'https://storage.googleapis.com/a1aa/image/a33126a5-f073-4eda-1f68-7adfc2371fc8.jpg', tag: 'new' },
        { id: 'j4', name: 'AK-900 Wired Keyboard', price: 200, originalPrice: null, rating: 5, reviews: 95, image: 'https://storage.googleapis.com/a1aa/image/c665c157-053f-41dc-b602-6e66caf17fc3.jpg', tag: null },
    ];

    // Function để render sao đánh giá (ví dụ)
    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        for (let i = 0; i < fullStars; i++) {
        stars.push(<i key={`full-${i}`} className="fas fa-star"></i>);
        }
        if (halfStar) {
        stars.push(<i key="half" className="fas fa-star-half-alt"></i>);
        }
        const emptyStars = 5 - stars.length;
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<i key={`empty-${i}`} className="far fa-star"></i>);
        }
        return stars;
    };


  return (
    <>
      {/* Top Black Bar */}
      <div className="wishlist-top-bar">
        <div className="wishlist-container wishlist-top-bar-content">
          <p className="wishlist-top-bar-message">
            Summer Sale For All Swim Suits And Free Express Delivery - OFF 50%
            <Link className="wishlist-shop-link" to="/shop"> {/* Sửa link */}
              ShopNow
            </Link>
          </p>
          {/* Cần logic JS để xử lý dropdown */}
          <div className="wishlist-language-dropdown-container">
            <button className="wishlist-language-button">
              <span>English</span>
              <i className="fas fa-chevron-down"></i>
            </button>
            <ul className="wishlist-language-menu">
              <li className="wishlist-language-item">English</li>
              <li className="wishlist-language-item">Spanish</li>
              <li className="wishlist-language-item">French</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="wishlist-container wishlist-header">
        <div className="wishlist-header-left">
          <span className="wishlist-header-logo">Exclusive</span>
          <nav className="wishlist-header-nav">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/contact">Contact</NavLink>
            <NavLink to="/about">About</NavLink>
            <NavLink to="/signup">Sign Up</NavLink>
          </nav>
        </div>
        <form className="wishlist-search-form">
          <input className="wishlist-search-input" placeholder="what are you looking for?" type="text" />
          <button className="wishlist-search-button" type="submit">
            <i className="fas fa-search"></i>
          </button>
        </form>
        <div className="wishlist-header-icons">
          <button aria-label="Wishlist" className="wishlist-header-icon-button">
            <i className="far fa-heart"></i>
            {/* Số lượng wishlist cần lấy từ state/context */}
            <span className="wishlist-badge">4</span>
          </button>
          <button aria-label="Cart" className="wishlist-header-icon-button">
            <i className="fas fa-shopping-cart"></i>
            {/* Badge cho cart nếu cần */}
            {/* <span className="wishlist-badge">2</span> */}
          </button>
          <button aria-label="User Account" className="wishlist-header-icon-button">
            <i className="far fa-user"></i>
          </button>
        </div>
      </header>

      <main className="wishlist-container wishlist-main">
        {/* Wishlist Header */}
        <div className="wishlist-page-header">
          {/* Số lượng cần động */}
          <h2 className="wishlist-title">Wishlist ({wishlistItems.length})</h2>
          <button className="wishlist-move-all-button">Move All To Bag</button>
        </div>

        {/* Wishlist Items Grid */}
        <div className="wishlist-items-grid">
          {wishlistItems.map(item => (
            <div key={item.id} className="wishlist-item-card">
              {item.discount && <div className="wishlist-item-discount">-{item.discount}%</div>}
              <button aria-label="Remove item" className="wishlist-item-remove-button">
                <i className="fas fa-trash-alt"></i>
              </button>
              <img alt={item.name} className="wishlist-item-image" height="120" src={item.image} width="150" />
              <button className="wishlist-add-to-cart-button">
                <i className="fas fa-shopping-cart"></i>
                <span>Add To Cart</span>
              </button>
              <p className="wishlist-item-name">{item.name}</p>
              <p className="wishlist-item-price">
                ${item.price.toFixed(2)}
                {item.originalPrice && <span className="wishlist-item-original-price">${item.originalPrice.toFixed(2)}</span>}
              </p>
            </div>
          ))}
        </div>

        {/* Just For You Header */}
        <div className="wishlist-just-for-you-header">
          <div className="wishlist-section-title-container">
            <div className="wishlist-section-marker"></div>
            <p className="wishlist-section-title">Just For You</p>
          </div>
          <button className="wishlist-see-all-button">See All</button>
        </div>

        {/* Just For You Items Grid */}
        <div className="just-for-you-grid">
           {justForYouItems.map(item => (
             <div key={item.id} className="just-for-you-item-card">
                {item.tag === 'discount' && <div className="just-for-you-item-tag discount">-{item.discount}%</div>}
                {item.tag === 'new' && <div className="just-for-you-item-tag new">NEW</div>}
               <button aria-label="View item" className="just-for-you-view-button">
                 <i className="far fa-eye"></i>
               </button>
               <img alt={item.name} className="just-for-you-item-image" height="120" src={item.image} width="150" />
               <button className="wishlist-add-to-cart-button"> {/* Re-use button style */}
                 <i className="fas fa-shopping-cart"></i>
                 <span>Add To Cart</span>
               </button>
               <p className="just-for-you-item-name">{item.name}</p>
               <p className="just-for-you-item-price">
                 ${item.price.toFixed(2)}
                  {item.originalPrice && <span className="just-for-you-item-original-price">${item.originalPrice.toFixed(2)}</span>}
               </p>
               <div className="just-for-you-item-rating">
                  {renderStars(item.rating)}
                 <span className="just-for-you-item-rating-count">({item.reviews})</span>
               </div>
             </div>
           ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="wishlist-footer">
         <div className="wishlist-container wishlist-footer-grid">
            {/* Exclusive */}
            <div className="wishlist-footer-column">
                 <h3>Exclusive</h3>
                 <p>Subscribe</p>
                 <p>Get 10% off your first order</p>
                 <form className="wishlist-footer-subscribe-form">
                   <input className="wishlist-footer-subscribe-input" placeholder="Enter your email" type="email" />
                   <button className="wishlist-footer-subscribe-button" type="submit">Subscribe</button>
                 </form>
            </div>
            {/* Support */}
            <div className="wishlist-footer-column">
                 <h3>Support</h3>
                 <address className="not-italic mb-3 text-[11px] leading-tight">
                   111 Bijoy sarani, Dhaka,<br />
                   DH 1515, Bangladesh.
                 </address>
                 <p className="mb-3 text-[11px]">exclusive@gmail.com</p>
                 <p className="text-[11px]">+88015-88888-9999</p>
            </div>
            {/* Account */}
             <div className="wishlist-footer-column">
                 <h3>Account</h3>
                 <ul className="wishlist-footer-list">
                     <li><Link to="/account">My Account</Link></li>
                     <li><Link to="/login">Login / Register</Link></li>
                     <li><Link to="/cart">Cart</Link></li>
                     <li><Link to="/wishlist">Wishlist</Link></li>
                     <li><Link to="/shop">Shop</Link></li>
                 </ul>
             </div>
            {/* Quick Link */}
             <div className="wishlist-footer-column">
                 <h3>Quick Link</h3>
                 <ul className="wishlist-footer-list">
                     <li><Link to="/privacy">Privacy Policy</Link></li>
                     <li><Link to="/terms">Terms of Use</Link></li>
                     <li><Link to="/faq">FAQ</Link></li>
                     <li><Link to="/contact">Contact</Link></li>
                 </ul>
             </div>
            {/* Download App */}
            <div className="wishlist-footer-column">
                 <h3>Download App</h3>
                 <p className="mb-3 text-[11px]">Save 10% with App New User Only</p>
                 <div className="wishlist-footer-apps">
                    {/* Cập nhật href */}
                   <a className="wishlist-footer-app-link" aria-label="Download on App Store" href="URL_APP_STORE">
                     <img alt="Apple App Store QR code placeholder" className="wishlist-footer-app-img" height="25" src="https://storage.googleapis.com/a1aa/image/31006b51-7ec3-4abe-34fc-3c7e31ca698d.jpg" width="80" />
                   </a>
                    {/* Cập nhật href */}
                   <a className="wishlist-footer-app-link" aria-label="Download on Google Play Store" href="URL_PLAY_STORE">
                     <img alt="Google Play Store QR code placeholder" className="wishlist-footer-app-img" height="25" src="https://storage.googleapis.com/a1aa/image/829e5375-d964-4f41-b5fd-2ac55d68ee8d.jpg" width="80" />
                   </a>

                 </div>
                 <div className="wishlist-footer-socials">
                    {/* Cập nhật href */}
                   <a aria-label="Facebook" className="wishlist-footer-social-link" href="URL_FB"><i className="fab fa-facebook-f"></i></a>
                   <a aria-label="Twitter" className="wishlist-footer-social-link" href="URL_TW"><i className="fab fa-twitter"></i></a>
                   <a aria-label="Instagram" className="wishlist-footer-social-link" href="URL_IG"><i className="fab fa-instagram"></i></a>
                   <a aria-label="LinkedIn" className="wishlist-footer-social-link" href="URL_LI"><i className="fab fa-linkedin-in"></i></a>
                 </div>
             </div>
         </div>
         <div className="wishlist-footer-copyright">
           © Copyright Rimel 2022. All rights reserved
         </div>
      </footer>
    </>
  );
}

export default Wishlist;