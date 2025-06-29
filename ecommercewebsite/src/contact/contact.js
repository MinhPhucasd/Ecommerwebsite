import React from 'react';
// Import Link/NavLink nếu bạn dùng react-router-dom
import { Link, NavLink } from 'react-router-dom';
import './contact.css'; // Import CSS

function Contact() {
  return (
    // Sử dụng Fragment <> </>
    <>
      {/* Top Black Bar */}
      <div className="top-bar">
        <div className="container-max-width top-bar-content">
          <p className="top-bar-message">
            Summer Sale For All Swim Suits And Free Express Delivery - OFF 50%!
            {/* Sử dụng Link nếu điều hướng nội bộ */}
            <Link className="top-bar-shop-link" to="/shop"> {/* Thay đổi đường dẫn */}
              ShopNow
            </Link>
          </p>
          <div className="language-selector">
            <span>English</span>
            <i className="fas fa-chevron-down"></i>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="main-header">
        <div className="container-max-width header-content">
          <div className="header-logo">Exclusive</div>
          <nav className="header-nav">
            {/* Sử dụng NavLink cho active state */}
            <NavLink to="/">Home</NavLink> {/* Bỏ class active-link nếu dùng NavLink */}
            <NavLink className={({ isActive }) => isActive ? "active-link" : ""} to="/contact">Contact</NavLink>
            <NavLink to="/about">About</NavLink>
            <NavLink to="/signup">Sign Up</NavLink>
          </nav>
          {/* Search Form */}
          <form className="search-form">
            <input className="search-input" placeholder="What are you looking for?" type="text" />
            <button aria-label="Search" className="search-button" type="submit">
              <i className="fas fa-search"></i>
            </button>
          </form>
          {/* Header Icons */}
          <div className="header-icons">
            <i className="far fa-heart"></i>
            <i className="fas fa-shopping-cart"></i>
            <i className="far fa-user"></i>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="container-max-width breadcrumb">
        <span>Home</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Contact</span>
      </div>

      {/* Main Content */}
      <main className="container-max-width main-content">
        <div className="main-content-flex">
          {/* Left Contact Info */}
          <section aria-label="Contact Information" className="contact-info-section">
            <div className="contact-info-item">
              <div className="contact-info-header">
                <div className="contact-info-icon-wrapper"><i className="fas fa-phone-alt"></i></div>
                <div><h3 className="contact-info-title">Call To Us</h3></div>
              </div>
              <p className="contact-info-text">We are available 24/7, 7 days a week.</p>
              <p className="contact-info-detail">
                <span className="contact-info-label">Phone: </span>
                <span className="contact-info-value">+8801611112222</span>
              </p>
            </div>

            <hr className="contact-info-divider" />

            <div className="contact-info-item">
              <div className="contact-info-header">
                 <div className="contact-info-icon-wrapper"><i className="far fa-envelope"></i></div>
                 <div><h3 className="contact-info-title">Write To Us</h3></div>
              </div>
              <p className="contact-info-text">Fill out our form and we will contact you within 24 hours.</p>
              <p className="contact-info-detail">
                <span className="contact-info-label">Emails: </span>
                <span className="contact-info-value">customer@exclusive.com</span>
              </p>
              <p className="contact-info-detail">
                <span className="contact-info-label">Emails: </span>
                <span className="contact-info-value">support@exclusive.com</span>
              </p>
            </div>
          </section>

          {/* Right Contact Form */}
          <section aria-label="Contact Form" className="contact-form-section">
            <form className="contact-form">
              <div className="form-input-grid">
                <input className="form-input" placeholder="Your Name *" required type="text" />
                <input className="form-input" placeholder="Your Email *" required type="email" />
                <input className="form-input" placeholder="Your Phone *" required type="tel" />
              </div>
              <textarea className="form-textarea" placeholder="Your Massage" rows="5"></textarea>
              <div className="form-submit-container">
                <button className="submit-button" type="submit">Send Massage</button>
              </div>
            </form>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="main-footer">
        <div className="container-max-width footer-grid">
          {/* Column 1 */}
          <div className="footer-column">
            <h4>Exclusive</h4>
            <p>Subscribe</p>
            <p className="mb-3">Get 10% off your first order</p> {/* Giữ mb-3 nếu cần */}
            <form className="subscribe-form">
              <input className="subscribe-input" placeholder="Enter your email" type="email" />
              <button aria-label="Subscribe" className="subscribe-button" type="submit">
                <i className="fas fa-arrow-right"></i>
              </button>
            </form>
          </div>

          {/* Column 2 */}
          <div className="footer-column space-y-1">
            <h4>Support</h4>
            <p>111 Bijoy sarani, Dhaka, DH 1515, Bangladesh.</p>
            <p>exclusive@gmail.com</p>
            <p>+88015-88888-9999</p>
          </div>

          {/* Column 3 */}
          <div className="footer-column space-y-1">
            <h4>Account</h4>
            <p><Link to="/account">My Account</Link></p> {/* Ví dụ dùng Link */}
            <p><Link to="/login">Login / Register</Link></p>
            <p><Link to="/cart">Cart</Link></p>
            <p><Link to="/wishlist">Wishlist</Link></p>
            <p><Link to="/shop">Shop</Link></p>
          </div>

          {/* Column 4 */}
          <div className="footer-column space-y-1">
            <h4>Quick Link</h4>
            <p><Link to="/privacy">Privacy Policy</Link></p>
            <p><Link to="/terms">Terms Of Use</Link></p>
            <p><Link to="/faq">FAQ</Link></p>
            <p><Link to="/contact">Contact</Link></p>
          </div>

          {/* Column 5 */}
          <div className="footer-column space-y-3">
             <h4>Download App</h4>
             <p className="download-text-small">Save $3 with App New User Only</p>
             <div className="download-qr-apps">
               <img alt="QR code for app download" className="download-qr-code" height="50" src="https://storage.googleapis.com/a1aa/image/2d8a4cf2-9034-4649-642a-8b074941bd8c.jpg" width="50" />
               <div className="download-app-badges">
                 <img alt="Google Play Store badge" className="download-app-badge" height="25" src="https://storage.googleapis.com/a1aa/image/72538187-c032-44f4-5145-fa494294406d.jpg" width="80" />
                 <img alt="Apple App Store badge" className="download-app-badge" height="25" src="https://storage.googleapis.com/a1aa/image/97b85b70-a69e-41c9-6f7c-a918f6379640.jpg" width="80" />
               </div>
             </div>
             <div className="social-links">
               {/* Các thẻ <i> này có thể là Link hoặc Button tùy mục đích */}
               <i className="fab fa-facebook-f"></i>
               <i className="fab fa-twitter"></i>
               <i className="fab fa-instagram"></i>
               <i className="fab fa-linkedin-in"></i>
             </div>
          </div>
        </div> {/* End footer-grid */}

        <div className="footer-copyright">
          © Copyright Rimel 2022. All right reserved
        </div>
      </footer>
    </>
  );
}

export default Contact;