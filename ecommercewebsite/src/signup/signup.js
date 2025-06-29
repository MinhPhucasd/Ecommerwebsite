import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
// Đảm bảo tên file CSS import là đúng (ví dụ: signup.css nếu file thực tế là chữ thường)
import './signUp.css'; // <--- KIỂM TRA LẠI TÊN FILE NÀY
import { registerUser } from '../services/api';

function SignUp() {
  const [fullName, setFullName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false); 
  const navigate = useNavigate();
  
  const handleCreateAccount = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    const userData = {
      fullName,
      email: emailOrPhone, // Backend mong đợi 'email'
      password,
      shippingAddress: shippingAddress,
    };

    try {
      const response = await registerUser(userData);

      if (response.data.success) {
        setSuccessMessage('Account created successfully! You can now log in.');
        alert('Account created successfully! Please log in.'); // Hoặc dùng một component Toast/Notification đẹp hơn
        
        setFullName('');
        setEmailOrPhone('');
        setPassword('');
        setShippingAddress('');
        
        setTimeout(() => {
          navigate('/login');
        }, 2000); 
      } else {
        // Trường hợp API trả về success: false nhưng không phải lỗi HTTP
        setError(response.data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during registration.');
      console.error('Registration error:', err.response?.data || err.message || err);
    } finally {
      setLoading(false);
    }
  };

  // const handleGoogleSignUp = () => {
  //   // Logic đăng ký bằng Google
  //   console.log('Signing up with Google...');
  // };

  return (
    <>
      {/* Top black bar */}
      <div className="signup-top-bar">
        <div className="signup-container signup-top-bar-content">
          <p>
            Summer Sale For All Swim Suits And Free Express Delivery – OFF 50%!
            <Link className="signup-shop-link" to="/shop"> {/* Sửa link */}
              Shop Now
            </Link>
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="signup-container signup-nav">
        <div className="signup-nav-left">
          <span className="signup-nav-logo">Exclusive</span>
          {/* Sử dụng NavLink để có thể style link active nếu cần */}
          <div className="signup-nav-links">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/contact">Contact</NavLink>
            <NavLink to="/about">About</NavLink>
            <NavLink className={({isActive}) => isActive ? 'active' : ''} to="/signup">Sign Up</NavLink>
          </div>
        </div>
        <div className="signup-search-container">
          <input className="signup-search-input" placeholder="What are you looking for?" type="text" />
          <button aria-label="Search" className="signup-search-button">
            <i className="fas fa-search"></i>
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="signup-container signup-main">
        {/* Image */}
        <div className="signup-image-container">
          <img
            alt="Laptop computer on a clean white background with a modern design" // Alt text ổn
            className="signup-image"
            height="400"
            src="https://storage.googleapis.com/a1aa/image/a15beeaf-0268-4a0d-359c-80d4a793d0d7.jpg"
            width="480"
          />
        </div>

        {/* Form Section */}
        <section className="signup-form-section">
          <h2 className="signup-form-title">Create an account</h2>
          <p className="signup-form-subtitle">Enter your details below</p>
          <form className="signup-form" onSubmit={handleCreateAccount}>
            <input
              className="signup-form-input"
              placeholder="Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required // Giữ lại required nếu cần validation HTML5
            />
            <input
              className="signup-form-input"
              placeholder="Email"
              type="email" 
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              required
            />
            <input
              className="signup-form-input"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <input
              className="signup-form-input"
              placeholder="Address"
              type="text"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              required
            />
            <button className="signup-submit-button" type="submit" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          <button
            className="signup-google-button"
            type="button"
            /* onClick={handleGoogleSignUp} */
          >
            <img
              alt="Google logo icon" // Alt text ổn
              className="signup-google-icon"
              height="20"
              src="https://storage.googleapis.com/a1aa/image/1cb7b296-8f3d-42d0-54cc-3c2fc6184e2e.jpg"
              width="20"
            />
            Sign up with Google
          </button>
          <p className="signup-login-prompt">
            Already have account?{' '} {/* Thêm khoảng trắng */}
            <Link className="signup-login-link" to="/Login"> {/* Sửa link */}
              Log in
            </Link>
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="signup-footer">
        <div className="signup-container signup-footer-grid">
          {/* Column 1 */}
          <div className="signup-footer-column">
             <h3>Exclusive</h3>
             <h4>Subscribe</h4>
             <p>Get 10% off your first order</p>
             <form className="signup-footer-subscribe-form">
               <input className="signup-footer-subscribe-input" placeholder="Enter your email" type="email" />
               <button aria-label="Submit email" className="signup-footer-subscribe-button" type="submit">
                 <i className="fas fa-arrow-right"></i>
               </button>
             </form>
          </div>

          {/* Column 2 */}
          <div className="signup-footer-column">
             <h4>Support</h4>
             <address className="not-italic">
               111 Bijoy sarani, Dhaka,<br />
               DH 1515, Bangladesh.
             </address>
             {/* Links mailto và tel vẫn là thẻ a */}
             <a className="signup-footer-link" href="mailto:exclusive@gmail.com">exclusive@gmail.com</a>
             <a className="signup-footer-link" href="tel:+8801588889999">+88015-88888-9999</a>
           </div>

          {/* Column 3 */}
           <div className="signup-footer-column">
             <h4>Account</h4>
             {/* Sử dụng Link cho các mục này */}
             <Link className="signup-footer-link" to="/account">My Account</Link>
             <Link className="signup-footer-link" to="/login">Login / Register</Link>
             <Link className="signup-footer-link" to="/cart">Cart</Link>
             <Link className="signup-footer-link" to="/wishlist">Wishlist</Link>
             <Link className="signup-footer-link" to="/shop">Shop</Link>
           </div>

           {/* Column 4 */}
           <div className="signup-footer-column">
             <h4>Quick Link</h4>
             <Link className="signup-footer-link" to="/privacy">Privacy Policy</Link>
             <Link className="signup-footer-link" to="/terms">Terms Of Use</Link>
             <Link className="signup-footer-link" to="/faq">FAQ</Link>
             <Link className="signup-footer-link" to="/contact">Contact</Link>
           </div>

          {/* Column 5 & 6 (merged) */}
           <div className="signup-footer-column col-span-2">
             <h4>Download App</h4>
             <p>Save 5% with App New User Only</p>
             <div className="signup-footer-apps">
               {/* Sửa href cho App Store links */}
               <a href="URL_GOOGLE_PLAY_STORE_CUA_BAN" target="_blank" rel="noopener noreferrer"> {/* <--- Dòng ~180 */}
                   <img alt="Google Play Store badge" className="signup-footer-app-badge" height="25" src="https://storage.googleapis.com/a1aa/image/ca041595-cd89-4c73-3dad-938aed8acf08.jpg" width="80" />
               </a>
               <a href="URL_APP_STORE_CUA_BAN" target="_blank" rel="noopener noreferrer"> {/* <--- Dòng ~181 */}
                   <img alt="Apple App Store badge" className="signup-footer-app-badge" height="25" src="https://storage.googleapis.com/a1aa/image/24fd86d4-cfad-43af-d736-c3927e0da437.jpg" width="80" />
               </a>
             </div>
             <div className="signup-footer-socials">
               {/* Sửa href cho Social Media links */}
               <a aria-label="Facebook" href="URL_FACEBOOK_CUA_BAN" target="_blank" rel="noopener noreferrer"> {/* <--- Dòng ~185 */}
                   <i className="fab fa-facebook-f"></i>
               </a>
               <a aria-label="Twitter" href="URL_TWITTER_CUA_BAN" target="_blank" rel="noopener noreferrer"> {/* <--- Dòng ~186 */}
                   <i className="fab fa-twitter"></i>
               </a>
               <a aria-label="Pinterest" href="URL_PINTEREST_CUA_BAN" target="_blank" rel="noopener noreferrer"> {/* <--- Dòng ~187 */}
                   <i className="fab fa-pinterest-p"></i> {/* Sửa lại icon nếu cần */}
               </a>
               <a aria-label="LinkedIn" href="URL_LINKEDIN_CUA_BAN" target="_blank" rel="noopener noreferrer"> {/* <--- Dòng ~188 */}
                   <i className="fab fa-linkedin-in"></i>
               </a>
             </div>
           </div>
        </div>
        <div className="signup-footer-copyright">
          © Copyright Rimel 2022. All right reserved
        </div>
      </footer>
    </>
  );
}

export default SignUp;