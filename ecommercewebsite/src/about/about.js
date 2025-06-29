import React from 'react';
// Import Link/NavLink
import { Link, NavLink } from 'react-router-dom';
import './about.css'; // Import CSS

function About() {
  return (
    <>
      {/* Header */}
      <header className="about-header">
        <div className="about-container"> {/* Reuse container */}
          <nav className="about-header-nav">
            <div className="about-header-left">
              <div className="about-header-logo">Exclusive</div>
              <ul className="about-header-links">
                <li><NavLink to="/">Home</NavLink></li>
                <li><NavLink to="/contact">Contact</NavLink></li>
                <li><NavLink className={({isActive}) => isActive ? 'active' : ''} to="/about">About</NavLink></li> {/* Example active */}
                <li><NavLink to="/signup">Sign Up</NavLink></li>
              </ul>
            </div>
            <div className="about-header-language">English</div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="about-container about-main"> {/* Reuse container */}
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="about-breadcrumb">
          <ol className="about-breadcrumb-list">
            <li><Link className="about-breadcrumb-link" to="/">Home</Link></li>
            <li><span>/</span></li>
            <li className="about-breadcrumb-current">About</li>
          </ol>
        </nav>

        {/* Story Section */}
        <section className="about-story-section">
          <div className="about-story-text">
            <h2 className="about-story-title">Our Story</h2>
            <p className="about-story-paragraph">
              Founded in 2015, Exclusive is a South East Asian online shopping marketplace with a diverse product development, supporting the digital transformation and e-commerce solutions worldwide. We have more than 200 brands and more than 1 million customers worldwide and counting.
            </p>
            <p className="about-story-paragraph">
              Exclusive now covers 15 different product categories, growing at a rapid rate, thanks to the continuous product and category managing from our partners.
            </p>
          </div>
          <div className="about-story-image-container">
            <img
              alt="Two happy women holding multiple colorful shopping bags, standing against a pink background"
              className="about-story-image"
              height="400"
              src="https://storage.googleapis.com/a1aa/image/9ef928af-d749-4edf-d30f-bc91d696d420.jpg"
              width="600"
            />
          </div>
        </section>

        {/* Stats Section */}
        <section className="about-stats-section">
          {/* Stat Card 1 */}
          <div className="about-stat-card">
            <div className="about-stat-icon-wrapper"><i className="fas fa-shopping-bag"></i></div>
            <div className="about-stat-number">10.5k</div>
            <div className="about-stat-label">Active sellers on our site</div>
          </div>
          {/* Stat Card 2 (Highlighted) */}
          <div className="about-stat-card highlighted">
            <div className="about-stat-icon-wrapper"><i className="fas fa-box-open"></i></div>
            <div className="about-stat-number">33k</div>
            <div className="about-stat-label">Monthly Product Sold</div>
          </div>
          {/* Stat Card 3 */}
           <div className="about-stat-card">
             <div className="about-stat-icon-wrapper"><i className="fas fa-users"></i></div>
             <div className="about-stat-number">45.5k</div>
             <div className="about-stat-label">Customers active on site</div>
           </div>
          {/* Stat Card 4 */}
           <div className="about-stat-card">
             <div className="about-stat-icon-wrapper"><i className="fas fa-user-plus"></i></div>
             <div className="about-stat-number">25k</div>
             <div className="about-stat-label">Average orders on our site</div>
           </div>
        </section>

        {/* Team Section */}
        <section className="about-team-section">
          <div className="about-team-grid">
            {/* Team Member 1 */}
            <div className="about-team-member">
              <img alt="Portrait photo of Tom Cruise wearing a light blue shirt with arms crossed" height="200" src="https://storage.googleapis.com/a1aa/image/543e2e63-55e3-4aad-9aad-cb187a1c4645.jpg" width="150" />
              <h3 className="about-team-member-name">Tom Cruise</h3>
              <p className="about-team-member-title">Founder & Chairman</p>
              <div className="about-team-member-socials">
                {/* Links should point to actual social profiles */}
                <a aria-label="Tom Cruise Twitter" href="#"><i className="fab fa-twitter"></i></a>
                <a aria-label="Tom Cruise LinkedIn" href="#"><i className="fab fa-linkedin-in"></i></a>
              </div>
            </div>
             {/* Team Member 2 */}
            <div className="about-team-member">
              <img alt="Portrait photo of Emma Watson wearing a black blazer with arms crossed" height="200" src="https://storage.googleapis.com/a1aa/image/d1e03811-af00-49ed-ba1b-22ededb02552.jpg" width="150" />
              <h3 className="about-team-member-name">Emma Watson</h3>
              <p className="about-team-member-title">Managing Director</p>
              <div className="about-team-member-socials">
                 <a aria-label="Emma Watson Twitter" href="#"><i className="fab fa-twitter"></i></a>
                 <a aria-label="Emma Watson LinkedIn" href="#"><i className="fab fa-linkedin-in"></i></a>
              </div>
            </div>
             {/* Team Member 3 */}
            <div className="about-team-member">
               <img alt="Portrait photo of Will Smith wearing a black suit and tie" height="200" src="https://storage.googleapis.com/a1aa/image/40ac3dcc-c307-49d1-fd4f-09dbe6c4c0ea.jpg" width="150" />
               <h3 className="about-team-member-name">Will Smith</h3>
               <p className="about-team-member-title">Product Designer</p>
               <div className="about-team-member-socials">
                  <a aria-label="Will Smith Twitter" href="#"><i className="fab fa-twitter"></i></a>
                  <a aria-label="Will Smith LinkedIn" href="#"><i className="fab fa-linkedin-in"></i></a>
               </div>
            </div>
          </div>
          {/* Team Pagination */}
          <div className="about-team-pagination">
            <span className="about-team-pagination-dot"></span>
            <span className="about-team-pagination-dot active"></span>
            <span className="about-team-pagination-dot"></span>
          </div>
        </section>

        {/* Features Section */}
        <section className="about-features-section">
          {/* Feature 1 */}
          <div className="about-feature">
            <i className="fas fa-truck"></i>
            <p>FREE AND FAST DELIVERY</p>
            <p>Free shipping on all orders over $100</p>
          </div>
          {/* Feature 2 */}
          <div className="about-feature">
             <i className="fas fa-headset"></i>
             <p>24/7 CUSTOMER SERVICE</p>
             <p>Friendly 24/7 customer support</p>
          </div>
          {/* Feature 3 */}
           <div className="about-feature">
             <i className="fas fa-undo"></i>
             <p>MONEY BACK GUARANTEE</p>
             <p>30 days money back guarantee</p>
           </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="about-footer">
        <div className="about-container about-footer-grid"> {/* Reuse container */}
          {/* Footer Column 1 */}
          <div className="about-footer-column">
            <h4>Exclusive</h4>
            <p>Subscribe</p>
            <form className="about-footer-subscribe-form">
              <input className="about-footer-subscribe-input" placeholder="Enter your email" type="email" />
              <button className="about-footer-subscribe-button" type="submit">Subscribe</button>
            </form>
          </div>
          {/* Footer Column 2 */}
          <div className="about-footer-column">
             <h4>Support</h4>
             <ul>
               <li>24/7 Support</li>
               <li>FAQ</li>
               <li>Contact Us</li>
               <li>Order Status</li>
             </ul>
          </div>
          {/* Footer Column 3 */}
           <div className="about-footer-column">
             <h4>Account</h4>
             <ul>
               <li><Link to="/account">My Account</Link></li>
               <li><Link to="/login">Login / Register</Link></li>
               <li><Link to="/cart">Cart</Link></li>
               <li><Link to="/wishlist">Wishlist</Link></li>
               <li><Link to="/shop">Shop</Link></li>
             </ul>
           </div>
          {/* Footer Column 4 */}
          <div className="about-footer-column">
             <h4>Quick Links</h4>
             <ul>
               <li><Link to="/privacy">Privacy Policy</Link></li>
               <li><Link to="/terms">Terms of Use</Link></li>
               <li><Link to="/return-policy">Return Policy</Link></li>
               <li><Link to="/contact">Contact</Link></li>
             </ul>
             <div className="about-footer-socials">
                {/* Add actual URLs */}
               <a aria-label="Facebook" href="#"><i className="fab fa-facebook-f"></i></a>
               <a aria-label="Twitter" href="#"><i className="fab fa-twitter"></i></a>
               <a aria-label="Instagram" href="#"><i className="fab fa-instagram"></i></a>
               <a aria-label="LinkedIn" href="#"><i className="fab fa-linkedin-in"></i></a>
             </div>
          </div>
        </div>
        <div className="about-footer-copyright">
          © Copyright 2015-2023. All rights reserved.
        </div>
      </footer>
    </>
  );
}

export default About;