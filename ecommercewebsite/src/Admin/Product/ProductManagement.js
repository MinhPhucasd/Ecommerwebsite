import React, { useState, useEffect, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { fetchProducts, deleteProductAPI } from '../../services/api'; // Import API functions
import './ProductManagement.css';

const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    for (let i = 0; i < fullStars; i++) {
      stars.push(<i key={`full-${i}`} className="fas fa-star star-yellow"></i>);
    }
    if (halfStar) {
      stars.push(<i key="half" className="fas fa-star-half-alt star-yellow"></i>);
    }
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
        stars.push(<i key={`empty-${i}`} className="far fa-star star-yellow"></i>);
    }
    return stars.length > 0 ? stars : 'No rating';
};

function ProductManagement() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();

    // Filters State (giữ lại nếu bạn muốn mở rộng sau)
    const [filters, setFilters] = useState({
        productName: '',
        category: '',
        stockMin: '',
        stockMax: '',
        // salesMin: '', 
        // salesMax: ''
    });

    const loadProducts = useCallback(async (page = 1) => {
        setLoading(true);
        setError('');
        try {
            const params = { page, limit: 10 }; // Lấy 10 sản phẩm mỗi trang
            if (filters.productName) params.keyword = filters.productName;
            if (filters.category) params.category = filters.category;
            if (filters.stockMin) params.minStock = filters.stockMin; // Giả sử backend hỗ trợ
            if (filters.stockMax) params.maxStock = filters.stockMax; // Giả sử backend hỗ trợ

            const response = await fetchProducts(params);
            if (response.data.success) {
                setProducts(response.data.data);
                setPagination(response.data.pagination);
                setCurrentPage(response.data.pagination?.currentPage || 1);
            } else {
                setError(response.data.message || "Failed to load products.");
            }
        } catch (err) {
            setError(err.response?.data?.message || "An error occurred while fetching products.");
            console.error("Fetch products error:", err);
        } finally {
            setLoading(false);
        }
    }, [filters]); // Thêm filters vào dependencies

    useEffect(() => {
        loadProducts(currentPage);
    }, [loadProducts, currentPage]);

    const handleDeleteProduct = async (productId, productName) => {
        if (window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
            try {
                await deleteProductAPI(productId);
                alert(`Product "${productName}" deleted successfully.`);
                loadProducts(currentPage); // Tải lại danh sách sản phẩm
            } catch (err) {
                alert(`Failed to delete product: ${err.response?.data?.message || err.message}`);
                console.error("Delete product error:", err);
            }
        }
    };

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1); // Reset về trang 1 khi tìm kiếm
        loadProducts(1);
    };

    const handleResetFilters = () => {
        setFilters({ productName: '', category: '', stockMin: '', stockMax: '' });
        setCurrentPage(1);
        // loadProducts(1) sẽ được gọi bởi useEffect khi filters thay đổi (nếu loadProducts phụ thuộc filters)
        // Hoặc gọi trực tiếp:
        // loadProducts(1);
    };
    
    const handlePageChange = (newPage) => {
        if (newPage > 0 && (!pagination || newPage <= pagination.totalPages)) {
            setCurrentPage(newPage);
        }
    };


    if (loading && products.length === 0) {
        return <div className="manage-products-container">Loading products...</div>;
    }

    if (error) {
        return <div className="manage-products-container" style={{ color: 'red' }}>Error: {error}</div>;
    }

  return (
    <div className="manage-products-container">
      <h2 className="manage-products-title">Manage Products</h2>

      <div className="manage-products-top-nav-container">
        <div className="manage-products-nav-buttons">
          <NavLink to="/admin/Products" className={({ isActive }) => `manage-products-nav-button ${isActive ? 'active' : 'inactive'}`}>My Products</NavLink>
          <NavLink to="/admin/AddProduct" className={({ isActive }) => `manage-products-nav-button ${isActive ? 'active' : 'inactive'}`}>Add Product</NavLink>
          <NavLink to="/admin/Violations" className={({ isActive }) => `manage-products-nav-button ${isActive ? 'active' : 'inactive'}`}>Violations</NavLink>
        </div>
        {/* Date select có thể bỏ qua nếu không cần thiết cho quản lý sản phẩm */}
      </div>

      <form className="manage-products-filter-form" onSubmit={handleSearch}>
        <div className="filter-form-group">
          <label className="filter-form-label" htmlFor="productName">Product Name</label>
          <input className="filter-form-input full-width-md" id="productName" name="productName" type="text" value={filters.productName} onChange={handleFilterChange} />
        </div>
        <div className="filter-form-group">
          <label className="filter-form-label" htmlFor="category">Category</label>
          <input className="filter-form-input full-width-md" id="category" name="category" type="text" value={filters.category} onChange={handleFilterChange} />
        </div>
        <div className="filter-form-group">
          <label className="filter-form-label" htmlFor="stockMin">Stock</label>
          <input className="filter-form-input small" id="stockMin" name="stockMin" placeholder="Min" type="number" value={filters.stockMin} onChange={handleFilterChange} />
          <span className="filter-form-range-separator">-</span>
          <input className="filter-form-input small" id="stockMax" name="stockMax" placeholder="Max" type="number" value={filters.stockMax} onChange={handleFilterChange} />
        </div>
        <div className="filter-form-buttons">
          <button className="filter-form-button" type="submit">Search</button>
          <button className="filter-form-button" type="button" onClick={handleResetFilters}>Reset</button>
        </div>
      </form>

      <div className="manage-products-total-count">
        Total : {pagination?.totalProducts || products.length} Products
        {loading && <span style={{ marginLeft: '10px' }}>(Loading...)</span>}
      </div>

      <table className="manage-products-table">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Rating</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.length > 0 ? products.map(product => (
            <tr key={product._id}>
              <td className="product-table-name-cell">
                <img alt={product.name} className="product-table-image" height="40" src={product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/40'} width="40" />
                <span className="product-table-name">{product.name}</span>
              </td>
              <td>{product.category || '-'}</td>
              <td className="product-table-data">${product.price?.toFixed(2)}</td>
              <td className="product-table-data">{product.stock === undefined ? (product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || '-') : product.stock}</td>
              <td className="product-table-rating">{renderStars(product.averageRating || 0)}</td>
              <td className="product-table-actions">
                <button onClick={() => navigate(`/admin/EditProduct/${product._id}`)} className="action-button edit">Edit</button>
                <button onClick={() => handleDeleteProduct(product._id, product.name)} className="action-button delete">Delete</button>
              </td>
            </tr>
          )) : (
            <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No products found.</td>
            </tr>
          )}
        </tbody>
      </table>
      {pagination && pagination.totalPages > 1 && (
        <div className="pagination-controls">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || loading}>Previous</button>
            <span> Page {currentPage} of {pagination.totalPages} </span>
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === pagination.totalPages || loading}>Next</button>
        </div>
      )}
    </div>
  );
}

export default ProductManagement;