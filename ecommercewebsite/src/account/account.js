// src/account/account.js
import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom'; // NavLink vẫn hữu ích cho active state của sidebar
import './account.css'; // Đảm bảo tên file CSS khớp
import { useAuth } from '../context/authContext';
import { updateUserProfile, changeUserPassword, getAddresses /*, các API khác cho address */ } from '../services/api'; // Import các hàm API cần thiết

function Account() {
  const { currentUser, loadingAuth, setCurrentUser } = useAuth(); // setCurrentUser để cập nhật context sau khi profile thay đổi
  const [activeSection, setActiveSection] = useState('profile'); // Mặc định hiển thị 'profile'

  // States cho Edit Profile Form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState(''); // Backend hiện tại lưu shippingAddress là một string

  // States cho Change Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State cho thông báo
  const [message, setMessage] = useState({ text: '', type: '' }); // type: 'success' hoặc 'error'

  // State cho Address Book (ví dụ, sẽ được phát triển thêm)
  const [userAddresses, setUserAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Populate form fields khi currentUser thay đổi
  useEffect(() => {
    if (currentUser) {
      const nameParts = currentUser.fullName ? currentUser.fullName.split(' ') : [];
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      setEmail(currentUser.email || '');
      // Backend của bạn lưu shippingAddress chính trong user document
      // Đối với Address Book, bạn sẽ fetch từ /api/users/addresses
      setAddress(currentUser.shippingAddress || '');
    }
  }, [currentUser]);

  // Fetch addresses khi activeSection là 'address'
  useEffect(() => {
    if (activeSection === 'address' && currentUser) {
      const fetchUserAddresses = async () => {
        setLoadingAddresses(true);
        setMessage({ text: '', type: '' });
        try {
          const response = await getAddresses();
          if (response.data.success) {
            setUserAddresses(response.data.data || []);
          } else {
            setMessage({ text: response.data.message || 'Failed to load addresses.', type: 'error' });
          }
        } catch (error) {
          setMessage({ text: error.response?.data?.message || 'Error fetching addresses.', type: 'error' });
        } finally {
          setLoadingAddresses(false);
        }
      };
      fetchUserAddresses();
    }
  }, [activeSection, currentUser]);


  const handleProfileUpdate = async () => {
    const fullName = `${firstName} ${lastName}`.trim();
    if (!fullName) {
        setMessage({ text: 'Full name cannot be empty.', type: 'error'});
        return false;
    }
    try {
      // Chỉ gửi các trường có thay đổi hoặc theo cấu trúc API backend yêu cầu
      const profileData = { fullName, shippingAddress: address };
      const response = await updateUserProfile(profileData);
      if (response.data.success) {
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
        setCurrentUser(response.data.data); // Cập nhật lại currentUser trong context
        return true;
      } else {
        setMessage({ text: response.data.message || 'Failed to update profile.', type: 'error' });
        return false;
      }
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'An error occurred while updating profile.', type: 'error' });
      return false;
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ text: 'Please fill all password fields to change password.', type: 'error' });
      return false;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'New passwords do not match.', type: 'error' });
      return false;
    }
    if (newPassword.length < 6) {
      setMessage({ text: 'New password must be at least 6 characters long.', type: 'error' });
      return false;
    }
    try {
      const response = await changeUserPassword({ oldPassword: currentPassword, newPassword });
      if (response.data.success) {
        setMessage({ text: 'Password changed successfully!', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        return true;
      } else {
        setMessage({ text: response.data.message || 'Failed to change password.', type: 'error' });
        return false;
      }
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'An error occurred while changing password.', type: 'error' });
      return false;
    }
  };

  const handleSaveChanges = async (event) => {
    event.preventDefault();
    setMessage({ text: '', type: '' }); // Clear previous messages

    let profileUpdated = false;
    let passwordChanged = false;

    // Kiểm tra xem có input mật khẩu không
    const passwordFieldsFilled = currentPassword || newPassword || confirmPassword;

    // Cập nhật profile trước
    // Bạn có thể kiểm tra xem dữ liệu profile có thực sự thay đổi không trước khi gọi API
    // if (currentUser.fullName !== `${firstName} ${lastName}`.trim() || currentUser.shippingAddress !== address) {
        profileUpdated = await handleProfileUpdate();
    // } else {
    //     profileUpdated = true; // Coi như thành công nếu không có gì thay đổi
    // }


    // Nếu có nhập mật khẩu, thì tiến hành đổi mật khẩu
    if (passwordFieldsFilled) {
        passwordChanged = await handlePasswordChange();
    }

    if (profileUpdated && !passwordFieldsFilled) {
        // Chỉ cập nhật profile thành công
    } else if (profileUpdated && passwordChanged) {
        // Cả hai thành công (message đổi mật khẩu sẽ ghi đè message profile)
    }
    // Các trường hợp lỗi đã được set trong từng hàm con
  };

  const handleCancel = () => {
    // Reset form về giá trị ban đầu từ currentUser
    if (currentUser) {
      const nameParts = currentUser.fullName ? currentUser.fullName.split(' ') : [];
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      setEmail(currentUser.email || '');
      setAddress(currentUser.shippingAddress || '');
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setMessage({ text: '', type: '' });
    // Có thể điều hướng hoặc không tùy ý
  };


  if (loadingAuth) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading account details...</div>;
  }

  if (!currentUser && !loadingAuth) {
    // Should be handled by ProtectedRoute, but as a fallback
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Please <Link to="/login">log in</Link> to view your account.</div>;
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <section aria-label="Edit Profile Form" className="profile-form-section">
            <h2 className="profile-form-title">Edit Your Profile</h2>
            {message.text && (
              <p style={{ color: message.type === 'success' ? 'green' : 'red', marginBottom: '15px', textAlign: 'center' }}>
                {message.text}
              </p>
            )}
            <form className="profile-form" onSubmit={handleSaveChanges}>
              <div className="profile-form-grid">
                <div>
                  <label className="profile-form-label" htmlFor="firstName">First Name</label>
                  <input
                    className="profile-form-input"
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="profile-form-label" htmlFor="lastName">Last Name</label>
                  <input
                    className="profile-form-input"
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="profile-form-grid">
                <div>
                  <label className="profile-form-label" htmlFor="email">Email</label>
                  <input
                    className="profile-form-input"
                    id="email"
                    type="email"
                    value={email}
                    readOnly // Thường không cho phép đổi email trực tiếp
                  />
                </div>
                <div>
                  <label className="profile-form-label" htmlFor="address">Address</label>
                  <input
                    className="profile-form-input"
                    id="address"
                    type="text"
                    value={address} // Đây là shippingAddress chính
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="profile-form-label" style={{ marginTop: '10px', display: 'block', fontWeight: 'bold' }}>Password Changes</label>
                <input
                  className="profile-form-input password-input"
                  placeholder="Current Password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <input
                  className="profile-form-input password-input"
                  placeholder="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <input
                  className="profile-form-input"
                  placeholder="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="profile-form-actions">
                <button className="profile-cancel-button" type="button" onClick={handleCancel}>
                  Cancel
                </button>
                <button className="profile-save-button" type="submit">
                  Save Changes
                </button>
              </div>
            </form>
          </section>
        );
      case 'address':
        return (
          <section aria-label="Address Book" className="profile-content-section"> {/* Đặt tên class CSS phù hợp */}
            <h2 className="profile-form-title">Address Book</h2>
            {message.text && (
              <p style={{ color: message.type === 'success' ? 'green' : 'red', marginBottom: '15px' }}>
                {message.text}
              </p>
            )}
            {loadingAddresses ? <p>Loading addresses...</p> : (
              userAddresses.length > 0 ? (
                <ul>
                  {userAddresses.map(addr => (
                    <li key={addr._id}>
                      <p>{addr.label ? `${addr.label}: ` : ''}{addr.addressLine1}, {addr.city}, {addr.postalCode}, {addr.country} {addr.isDefault ? '(Default)' : ''}</p>
                      {/* TODO: Nút Edit/Delete/Set Default cho mỗi địa chỉ */}
                    </li>
                  ))}
                </ul>
              ) : <p>You have no saved addresses.</p>
            )}
            {/* TODO: Nút "Add New Address" và form thêm địa chỉ */}
            <p style={{marginTop: '20px'}}><em>Address book functionality is under development. More features coming soon!</em></p>
          </section>
        );
      // Thêm các case khác cho 'payment', 'returns', 'cancellations' nếu cần
      // Ví dụ:
      // case 'orders':
      //   return <MyOrdersComponent />; // Một component riêng để hiển thị đơn hàng
      default:
        // Mặc định có thể là "My Profile" hoặc một trang chào mừng
        return <section><h2>Welcome to Your Account</h2><p>Select an option from the sidebar to manage your account.</p></section>;
    }
  };

  // Header và Footer JSX giữ nguyên như trong file bạn cung cấp
  // Chỉ thay đổi phần <main> để sử dụng activeSection
  return (
    <>
      {/* Top bar - Giữ nguyên hoặc làm component chung */}
      <div className="profile-top-bar">
        <div className="profile-container profile-top-bar-content">
          <p className="profile-top-bar-message">
            Summer Sale For All Swim Suits And Free Express Delivery - OFF 50%!
            <Link className="profile-top-bar-link" to="/shop">ShopNow</Link>
          </p>
          <div className="profile-language-selector">
            English <i className="fas fa-chevron-down"></i>
          </div>
        </div>
      </div>

      {/* Header - Giữ nguyên hoặc làm component chung */}
      <header className="profile-container profile-header">
         <div className="profile-header-logo">Exclusive</div>
         <nav className="profile-header-nav">
           <NavLink to="/">Home</NavLink>
           <NavLink to="/contact">Contact</NavLink>
           <NavLink to="/about">About</NavLink>
           {/* Hiển thị Sign Up/Login nếu chưa đăng nhập, hoặc User icon nếu đã đăng nhập */}
           {!currentUser && <NavLink to="/signup">Sign Up</NavLink>}
           {!currentUser && <NavLink to="/login">Login</NavLink>}
         </nav>
         <div className="profile-header-actions">
           <input className="profile-search-input" placeholder="What are you looking for?" type="text" />
           <button aria-label="Search" className="profile-header-icon-button"><i className="fas fa-search"></i></button>
           <button aria-label="Wishlist" className="profile-header-icon-button"><i className="far fa-heart"></i></button>
           <Link to="/cart" aria-label="Cart" className="profile-header-icon-button"><i className="fas fa-shopping-cart"></i></Link>
           {currentUser && (
            <button aria-label="User Account" className="profile-user-avatar-button">
              {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
            </button>
           )}
         </div>
      </header>

      {/* Breadcrumb - Giữ nguyên */}
      <div className="profile-container profile-breadcrumb">
        <nav className="profile-breadcrumb-nav">
           <Link className="profile-breadcrumb-link" to="/">Home</Link>
           <span className="profile-breadcrumb-separator">/</span>
           {/* Thay đổi tùy theo activeSection nếu muốn breadcrumb động hơn */}
           <span className="profile-breadcrumb-current">
             {activeSection === 'profile' ? 'My Profile' :
              activeSection === 'address' ? 'Address Book' :
              'My Account'}
           </span>
        </nav>
      </div>

      {/* Main content */}
      <main className="profile-container profile-main-content">
        <aside className="profile-sidebar">
          <div className="profile-sidebar-section">
            <h3 className="profile-sidebar-title">Manage My Account</h3>
            <ul className="profile-sidebar-list">
              <li>
                <a href="#!" onClick={(e) => { e.preventDefault(); setActiveSection('profile'); }}
                   className={`profile-sidebar-link ${activeSection === 'profile' ? 'active' : ''}`}>
                  My Profile
                </a>
              </li>
              <li>
                <a href="#!" onClick={(e) => { e.preventDefault(); setActiveSection('address'); }}
                   className={`profile-sidebar-link ${activeSection === 'address' ? 'active' : ''}`}>
                  Address Book
                </a>
              </li>
              <li>
                <a href="#!" onClick={(e) => { e.preventDefault(); setActiveSection('payment'); }} // Giả sử có section payment
                   className={`profile-sidebar-link ${activeSection === 'payment' ? 'active' : ''}`}>
                  My Payment Options
                </a>
              </li>
            </ul>
          </div>
          <div className="profile-sidebar-section">
            <h3 className="profile-sidebar-title">My Orders</h3>
            <ul className="profile-sidebar-list">
                {/* Link to My Orders page (nếu là route riêng) hoặc section trong Account */}
              <li><Link className="profile-sidebar-link" to="/my-orders">My Orders</Link></li>
              <li>
                <a href="#!" onClick={(e) => { e.preventDefault(); setActiveSection('returns'); }}
                   className={`profile-sidebar-link ${activeSection === 'returns' ? 'active' : ''}`}>
                  My Returns
                </a>
              </li>
              <li>
                <a href="#!" onClick={(e) => { e.preventDefault(); setActiveSection('cancellations'); }}
                   className={`profile-sidebar-link ${activeSection === 'cancellations' ? 'active' : ''}`}>
                  My Cancellations
                </a>
              </li>
            </ul>
          </div>
          <div className="profile-sidebar-section">
             <h3 className="profile-sidebar-title">
                <Link className="profile-sidebar-link" to="/wishlist">My Wishlist</Link>
             </h3>
          </div>
        </aside>

        <div className="profile-content-area">
          {renderSection()} {/* Render nội dung dựa trên activeSection */}
        </div>
      </main>

      {/* Footer - Giữ nguyên */}
       <footer className="profile-footer">
         {/* ... */}
       </footer>
    </>
  );
}

export default Account;