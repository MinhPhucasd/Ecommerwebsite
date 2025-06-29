// src/home/home.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import './home.css';
import { useAuth } from '../context/authContext.js';
import { useCart } from '../context/cartContext.js';
import {
  getNewProducts,
  getBestsellerProducts,
  fetchProducts,
  // addItemToCart // Đã chuyển vào ProductCard.js
} from '../services/api.js';
import ProductCard from '../components/productCard/productCard.js';

// Khai báo homePageDefaultCategories và hardcodedSidebarCategories bên ngoài component
const homePageDefaultCategories = [
  { displayName: "Laptops", apiValue: "Laptops", key: "cat1" },
  { displayName: "Monitors", apiValue: "Monitors", key: "cat2" },
  { displayName: "Hard Drives", apiValue: "Hard Drives", key: "cat3" },
];

const hardcodedSidebarCategories = [
  { _id: 'sb_cat_lap', name: "Laptops", slug: "Laptops" },
  { _id: 'sb_cat_mon', name: "Monitors", slug: "Monitors" },
  { _id: 'sb_cat_har', name: "Hard Drives", slug: "Hard Drives" },

];

function Home() {
  const { currentUser, logoutContext, loadingAuth } = useAuth();
  const { cart, fetchCartData: refreshCart, loadingCart } = useCart();
  const navigate = useNavigate();

  const [searchKeyword, setSearchKeyword] = useState('');

  // States for default home page sections
  const [newProducts, setNewProducts] = useState([]);
  const [loadingNewProducts, setLoadingNewProducts] = useState(true);
  const [bestsellerProducts, setBestsellerProducts] = useState([]);
  const [loadingBestsellers, setLoadingBestsellers] = useState(true);
  const [defaultCategoryProducts, setDefaultCategoryProducts] = useState({});
  const [loadingDefaultCategoryProducts, setLoadingDefaultCategoryProducts] = useState({});

  const [sidebarCategories, setSidebarCategories] = useState([]);
  const [loadingSidebarCategories, setLoadingSidebarCategories] = useState(true);

  // States for search OR category filter results (hiển thị trên home)
  const [results, setResults] = useState([]); // Chung cho search keyword và filter category
  const [isShowingResults, setIsShowingResults] = useState(false); // True khi có search hoặc filter category
  const [loadingResults, setLoadingResults] = useState(false);
  const [resultsError, setResultsError] = useState('');
  const [resultsPagination, setResultsPagination] = useState(null);
  const [currentResultsPage, setCurrentResultsPage] = useState(1);
  const [sortBy, setSortBy] = useState('');
  // activeCriteria: { type: 'keyword' | 'category', value: string (keyword or category slug), displayValue?: string }
  const [activeCriteria, setActiveCriteria] = useState({ type: null, value: null, displayValue: null });


  // Fetch New Products (cho mục "Flash Sales" hoặc "New Products")
  useEffect(() => {
    const loadNewProductsData = async () => {
      setLoadingNewProducts(true);
      try {
        const params = { limit: 5 }; 
        if (sortBy && !isShowingResults) { 
          params.sortBy = sortBy;
        }
        const response = await getNewProducts(params);
        if (response.data.success) setNewProducts(response.data.data);
        else setNewProducts([]);
      } catch (error) { console.error("Failed to fetch new products:", error); setNewProducts([]); }
      finally { setLoadingNewProducts(false); }
    };
    if (!isShowingResults) {
      loadNewProductsData();
    }
  }, [isShowingResults, sortBy]);

  // Fetch Bestseller Products
  useEffect(() => {
    const loadBestsellerProductsData = async () => {
      setLoadingBestsellers(true);
      try {
        const response = await getBestsellerProducts({ limit: 4 });
        if (response.data.success) setBestsellerProducts(response.data.data);
        else setBestsellerProducts([]);
      } catch (error) { console.error("Failed to fetch bestseller products:", error); setBestsellerProducts([]); }
      finally { setLoadingBestsellers(false); }
    };
    if (!isShowingResults) {
      loadBestsellerProductsData();
    }
  }, [isShowingResults]);

  // Fetch products for specific categories on Home Page (mục mặc định)
  const fetchHomePageDefaultCategoryProducts = useCallback(async (categoryApiValue, categoryKey) => {
    setLoadingDefaultCategoryProducts(prev => ({ ...prev, [categoryKey]: true }));
    try {
      const response = await fetchProducts({ category: categoryApiValue, limit: 4 });
      if (response.data.success) {
        setDefaultCategoryProducts(prev => ({ ...prev, [categoryKey]: response.data.data }));
      } else {
        setDefaultCategoryProducts(prev => ({ ...prev, [categoryKey]: [] }));
      }
    } catch (error) {
      console.error(`Failed to fetch ${categoryApiValue} products:`, error);
      setDefaultCategoryProducts(prev => ({ ...prev, [categoryKey]: [] }));
    } finally {
      setLoadingDefaultCategoryProducts(prev => ({ ...prev, [categoryKey]: false }));
    }
  }, []);

  useEffect(() => {
    if (!isShowingResults) {
      homePageDefaultCategories.forEach(cat => {
        fetchHomePageDefaultCategoryProducts(cat.apiValue, cat.key, sortBy);
      });
    }
  }, [isShowingResults, fetchHomePageDefaultCategoryProducts, sortBy]);


  // Load Sidebar Categories (dùng hardcoded)
  useEffect(() => {
    setLoadingSidebarCategories(true);
    setSidebarCategories(hardcodedSidebarCategories);
    setLoadingSidebarCategories(false);
  }, []);

  const handleSearchChange = (event) => setSearchKeyword(event.target.value);

  // Hàm trung tâm để fetch dữ liệu cho tìm kiếm THEO KEYWORD hoặc lọc THEO CATEGORY
  const executeSearchOrFilter = useCallback(async (criteria, page = 1, currentSortBy = sortBy) => {
    setIsShowingResults(true); // Kích hoạt chế độ hiển thị kết quả
    setLoadingResults(true);
    setResultsError('');
    setCurrentResultsPage(page);
    setActiveCriteria(criteria);

    try {
      const params = { page, limit: 8 }; 
      if (criteria.type === 'keyword' && criteria.value) {
        params.keyword = criteria.value; 
      } else if (criteria.type === 'category' && criteria.value) {
        params.category = criteria.value;
      } else {
        handleClearActiveSearchOrFilter();
        setLoadingResults(false);
        return;
      }

      if (currentSortBy) { 
        params.sortBy = currentSortBy;
      }

      console.log(`Frontend: Fetching for ${criteria.type} - "${criteria.displayValue || criteria.value}" with params:`, params);
      const response = await fetchProducts(params);

      if (response.data.success) {
        setResults(response.data.data);
        setResultsPagination(response.data.pagination);
        setActiveCriteria({ ...criteria, currentSortBy });
      } else {
        setResultsError(response.data.message || "Failed to fetch results.");
        setResults([]); setResultsPagination(null);
      }
    } catch (err) {
      setResultsError(err.response?.data?.message || "An error occurred.");
      setResults([]); setResultsPagination(null);
      console.error(`${criteria.type} execution error:`, err);
    } finally {
      setLoadingResults(false);
    }
    
  }, [sortBy]); 


  const handleSearchFormSubmit = (event) => {
    if (event) event.preventDefault();
    const keywordToSearch = searchKeyword.trim();
    if (keywordToSearch) {
      executeSearchOrFilter({ type: 'keyword', value: keywordToSearch, displayValue: keywordToSearch }, 1);
    } else {
      // Nếu submit keyword rỗng, không làm gì hoặc clear (tùy UX bạn muốn)
      handleClearActiveSearchOrFilter();
    }
  };

  const handleSortChange = (event) => {
    const newSortBy = event.target.value;
    setSortBy(newSortBy);

    if (isShowingResults && activeCriteria.type) {
      executeSearchOrFilter(activeCriteria, 1, newSortBy); 
    }
  };

  const handleSidebarCategoryClick = (categorySlug, categoryDisplayName) => {
    setSearchKeyword(''); // Xóa từ khóa tìm kiếm hiện tại (nếu có) khi lọc theo category
    executeSearchOrFilter({ type: 'category', value: categorySlug, displayValue: categoryDisplayName }, 1);
  };

  const handleClearActiveSearchOrFilter = () => {
    setIsShowingResults(false); // Quan trọng: Tắt chế độ hiển thị kết quả
    setSearchKeyword('');
    setSortBy('');
    setResults([]);
    setResultsPagination(null);
    setCurrentResultsPage(1);
    setActiveCriteria({ type: null, value: null, displayValue: null });
    // Không cần navigate vì isShowingResults sẽ tự động render lại các section cũ
  };

  const handleLogout = () => { logoutContext(); navigate('/'); };
  const cartItemCount = cart && cart.items ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;

  // Hàm render một section sản phẩm chung (cho các mục mặc định trên home)
  const renderProductSection = (title, label, products, loading, viewAllLink, sectionClass = "flash-sales-section", markerColor = '#dc2626', labelColor = '#dc2626') => {
    const productList = Array.isArray(products) ? products : [];
    return (
      <section className={sectionClass} style={{ paddingBottom: '2.5rem' }}>
        <div className="section-marker-title">
          <div className="section-marker" style={{ backgroundColor: markerColor }}></div>
          <span className="section-label" style={{ color: labelColor }}>{label}</span>
        </div>
        <h3 className="section-title">{title}</h3>
        {loading ? (
          <p style={{ textAlign: 'center' }}>Loading {title}...</p>
        ) : productList.length === 0 ? (
          <p style={{ textAlign: 'center' }}>No products available in {title} at the moment.</p>
        ) : (
          <div className="products-grid">
            {productList.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
        {viewAllLink && (
          <div className="view-all-container">
            <Link to={`${viewAllLink}${sortBy ? (viewAllLink.includes('?') ? '&' : '?') + 'sortBy=' + sortBy : ''}`} className="view-all-button">View All Products</Link>
          </div>
        )}
      </section>
    );
  };

  // Hàm render lưới sản phẩm (dùng cho kết quả search/filter)
  const renderResultsGrid = (products, loading, noProductMessage = "No products found.") => {
    if (loading) {
      return <p style={{ textAlign: 'center', padding: '2rem 0' }}>Loading products...</p>;
    }
    if (!products || !Array.isArray(products) || products.length === 0) {
      return <p style={{ textAlign: 'center', padding: '2rem 0' }}>{noProductMessage}</p>;
    }
    return (
      <div className="products-grid">
        {products.map(product => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    );
  };

  const renderResultsPaginationControls = () => {
    if (!isShowingResults || !resultsPagination || resultsPagination.totalPages <= 1) return null;
    let pages = [];
    for (let i = 1; i <= resultsPagination.totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => executeSearchOrFilter(activeCriteria, i, sortBy)}
          disabled={i === currentResultsPage || loadingResults}
          style={{ /* ... styles cho nút phân trang ... */ }}
        >
          {i}
        </button>
      );
    }
    return <div className="pagination-controls" style={{ marginTop: '30px', textAlign: 'center', marginBottom: '30px' }}>{pages}</div>;
  };

  if (loadingAuth) {
    return <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '1.2em' }}>Loading application...</div>;
  }

  return (
    <>
      {/* Top Bar */}
      <div className="top-bar">
        {/* ... (JSX Top Bar của bạn) ... */}
      </div>

      <div className="main-container">
        {/* Header */}
        <header className="header-nav">
          <Link to="/" className="header-logo" onClick={handleClearActiveSearchOrFilter}>Exclusive</Link>
          <nav className="main-nav-links">
            <NavLink className={({ isActive }) => isActive && !isShowingResults ? "active-link" : ""} end to="/">Home</NavLink>
            <NavLink className={({ isActive }) => isActive ? "active-link" : ""} to="/contact">Contact</NavLink>
            <NavLink className={({ isActive }) => isActive ? "active-link" : ""} to="/about">About</NavLink>
            {!currentUser && <NavLink className={({ isActive }) => isActive ? "active-link" : ""} to="/signup">Sign Up</NavLink>}
          </nav>
          <div className="header-actions">
            <form onSubmit={handleSearchFormSubmit} style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f5f5f5', padding: '5px 10px', borderRadius: '4px' }}>
              <input
                className="search-input"
                placeholder="What are you looking for?"
                type="text"
                value={searchKeyword}
                onChange={handleSearchChange}
                style={{ padding: '0.4rem', borderRadius: '4px 0 0 4px', border: '1px solid #ccc', borderRight: 'none', flexGrow: 1 }}
              />

              {/* Dropdown Sắp xếp */}
              <select
                className="header-sort-select" // Tạo class CSS nếu cần
                value={sortBy}
                onChange={handleSortChange}
                disabled={loadingResults || loadingNewProducts || loadingBestsellers || Object.values(loadingDefaultCategoryProducts).some(l => l)}
                style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.8em', marginLeft: '5px', cursor: 'pointer', minWidth: '150px' }}
              >
                <option value="">Sort by (Default)</option>
                <option value="price:asc">Price: Low to High</option>
                <option value="price:desc">Price: High to Low</option>
                <option value="name:asc">Name: A-Z</option>
                <option value="name:desc">Name: Z-A</option>
                <option value="createdAt:desc">Newest First</option>
              </select>

              <button aria-label="Search" className="header-action-button" type="submit" disabled={loadingResults} style={{ /* ... styles ... */ }}>
                <i className="fas fa-search"></i>
              </button>
            </form>
            {/* ... Wishlist, Cart, User Menu icons ... */}
            <button aria-label="Favorites" className="header-action-button" style={{ marginLeft: '10px' }}>
              <i className="far fa-heart"></i>
              {/* Bạn có thể thêm badge cho wishlist ở đây nếu cần, ví dụ:
              {currentUser && wishlistCount > 0 && (
                <span className="wishlist-badge">{wishlistCount}</span>
              )}
              */}
            </button>

            <Link to="/cart" className="header-action-button" aria-label="Cart">
              <i className="fas fa-shopping-cart"></i>
              {currentUser && !loadingCart && cartItemCount > 0 && (
                <span className="cart-badge">{cartItemCount}</span>
              )}
            </Link>

            {currentUser ? (
              <div className="user-menu-dropdown-container">
                <button aria-label="User menu" className="user-menu-button">
                  {/* Hiển thị chữ cái đầu của tên hoặc icon user */}
                  {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : <i className="fas fa-user"></i>}
                </button>
                <div className="user-menu-dropdown">
                  <ul>
                    <li><Link className="user-menu-item" to="/account"><i className="fas fa-user-circle"></i> Manage My Account</Link></li>
                    <li><Link className="user-menu-item" to="/my-orders"><i className="fas fa-box"></i> My Order</Link></li>
                    <li className="user-menu-item" onClick={handleLogout} style={{ cursor: 'pointer' }}><i className="fas fa-sign-out-alt"></i> Logout</li>
                  </ul>
                </div>
              </div>
            ) : (
              // Nếu chưa đăng nhập, hiển thị nút Login ở main-nav-links hoặc ở đây
              <NavLink className="main-nav-links" style={{ marginLeft: '1rem', fontSize: '0.875rem', padding: '0.4rem 0.8rem', border: '1px solid transparent', borderRadius: '4px', backgroundColor: '#DB4444', color: 'white', textDecoration: 'none' }} to="/login">Login</NavLink>
            )}
          </div>
        </header>

        {/* Main content area: Sidebar và Banner (luôn hiển thị, trừ khi bạn muốn ẩn khi search/filter) */}
        <div className="main-content-area">
          <aside className="sidebar">
            {loadingSidebarCategories ? (<p>Loading categories...</p>) : (
              sidebarCategories.length > 0 ? (
                <ul className="sidebar-list">
                  <li className="sidebar-item sidebar-item-link"
                    onClick={() => handleClearActiveSearchOrFilter()}
                    style={{ cursor: 'pointer', fontWeight: !activeCriteria.type ? 'bold' : 'normal', padding: '8px 0' }}>
                    <span>All Products (Home)</span>
                  </li>
                  {sidebarCategories.map(category => (
                    <li className="sidebar-item sidebar-item-link" key={category._id}
                      onClick={() => handleSidebarCategoryClick(category.slug, category.name)}
                      style={{ cursor: 'pointer', fontWeight: activeCriteria.type === 'category' && activeCriteria.value === category.slug ? 'bold' : 'normal', padding: '8px 0' }}
                    >
                      <span>{category.name}</span>
                      {/* Không cần icon nếu click cả li */}
                    </li>
                  ))}
                </ul>
              ) : <p>No categories to display.</p>
            )}
          </aside>
          {/* Banner chỉ hiển thị nếu không có search/filter active */}
          {!isShowingResults && (
            <section className="banner-section">
              {/* ... JSX của Banner ... */}
                <section className="new-banner-section" style={{ margin: '40px 0', textAlign: 'center' }}>
              {/* 
                Cách 1: Ảnh banner đơn giản 
                Thay YOUR_BANNER_IMAGE_URL.jpg bằng URL ảnh banner của bạn.
                Thay YOUR_LINK_FOR_BANNER bằng URL bạn muốn người dùng đến khi click banner.
              */}
              <Link to="/your_link_for_banner">
                <img 
                  src="https://storage.pixteller.com/designs/designs-images/2020-12-21/05/laptop-new-arrival-sales-banner-1-5fe0c47813869.png" 
                  alt="Special Offer Banner" 
                  style={{ width: '100%', maxHeight: '450px', objectFit: 'cover', borderRadius: '8px' }} 
                />
              </Link>

              {/* 
                Cách 2: Banner có chữ và nút (cần thêm CSS)
              <div className="new-banner-content" style={{ backgroundImage: 'url(YOUR_BANNER_IMAGE_URL.jpg)', padding: '50px 20px', color: 'white', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '8px'}}>
                <h2>Amazing New Collection!</h2>
                <p>Discover the latest trends and styles.</p>
                <Link to="/shop?category=new-collection" className="view-all-button">Shop Now</Link>
              </div>
              */}
            </section>
            </section>
          )}
        </div> {/* End main-content-area */}
        


        {/* Khu vực hiển thị sản phẩm chính: hoặc kết quả tìm kiếm/lọc, hoặc các mục sản phẩm mặc định */}
        <div className="main-products-area" style={{ padding: '0 1rem', marginTop: '2rem' }}>
          {isShowingResults ? (
            <section className="results-section"> {/* Đổi tên class để rõ ràng hơn */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                <h2 className="section-title" style={{ fontSize: '1.25rem', margin: 0 }}>
                  {activeCriteria.type === 'keyword' && activeCriteria.value ?
                    `Search Results for: "${activeCriteria.displayValue}"`
                    : activeCriteria.type === 'category' && activeCriteria.displayValue ?
                      `Products in Category: "${activeCriteria.displayValue}"`
                      : "Filtered Products"
                  }
                </h2>
                <button onClick={handleClearActiveSearchOrFilter} className="view-all-button" style={{ backgroundColor: '#6c757d', padding: '0.5rem 1rem', fontSize: '0.8rem', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Back to Home View
                </button>
              </div>
              {resultsError && <p style={{ color: 'red', textAlign: 'center' }}>{resultsError}</p>}
              {renderResultsGrid(results, loadingResults, "No products found matching your criteria.")}
              {renderResultsPaginationControls()}
            </section>
          ) : (
            <>
              {/* Mục "Flash Sales" (sử dụng newProducts) */}
              {/* ... JSX mục Flash Sales với renderProductSection ... */}
              {renderProductSection("Flash Sales", "Today's", newProducts, loadingNewProducts, "/shop?tag=flash-sale")}

              <div className="bottom-divider" style={{ marginTop: '2.5rem', marginBottom: '2.5rem' }}></div>
              {renderProductSection("Best Selling Products", "This Month", bestsellerProducts, loadingBestsellers, "/shop?sortBy=soldCount:desc", "flash-sales-section", "orange", "orange")}

              <div className="bottom-divider" style={{ marginTop: '2.5rem', marginBottom: '2.5rem' }}></div>
              {homePageDefaultCategories.map((cat, index) => (
                <React.Fragment key={cat.key}>
                  {renderProductSection(
                    `Explore Our ${cat.displayName}`,
                    cat.displayName,
                    defaultCategoryProducts[cat.key] || [],
                    loadingDefaultCategoryProducts[cat.key] === undefined ? true : loadingDefaultCategoryProducts[cat.key],
                    `/shop?category=${encodeURIComponent(cat.apiValue)}`,
                    "flash-sales-section", // Class CSS chung
                    ['#2E8B57', '#4682B4', '#A0522D', '#C71585', '#FF8C00'][index % 5],
                    ['#2E8B57', '#4682B4', '#A0522D', '#C71585', '#FF8C00'][index % 5]
                  )}
                  {index < homePageDefaultCategories.length - 1 && (
                    <div className="bottom-divider" style={{ marginTop: '2.5rem', marginBottom: '2.5rem' }}></div>
                  )}
                </React.Fragment>
              ))}
            </>
          )}
        </div>
        <div className="bottom-divider" style={{ marginTop: '2.5rem' }}></div>
      </div>
      {/* Footer */}
    </>
  );
}
export default Home;