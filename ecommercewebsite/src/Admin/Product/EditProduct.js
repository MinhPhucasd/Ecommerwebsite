import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { fetchProductById, updateProductAPI } from '../../services/api'; // Thêm updateProductAPI
import './EditProduct.css'; // Có thể tái sử dụng CSS từ AddProduct hoặc tạo file riêng

const categoriesData = [ // Giữ categories mẫu hoặc fetch
    { id: 'cat1', name: 'Computer Components' }, { id: 'cat2', name: 'Laptops' },
    { id: 'cat3', name: 'Monitors' }, { id: 'cat4', name: 'Keyboards' },
    { id: 'cat5', name: 'Mice' }, { id: 'cat6', name: 'Storage Devices' },
    { id: 'cat7', name: 'Networking' }, { id: 'cat8', name: 'Accessories' },
    { id: 'cat9', name: 'Software' }, { id: 'cat10', name: 'Gaming PC' },
];

function EditProduct() {
  const { id: productId } = useParams(); // Lấy productId từ URL
  const navigate = useNavigate();
  const [productData, setProductData] = useState({
    name: '', description: '', price: '', basePrice: '', category: '', brand: '', stock: '',
    images: ['', '', ''], variants: [],
  });
  const [loading, setLoading] = useState(true); // Bắt đầu là true để fetch data
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadProduct = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchProductById(productId);
      if (response.data.success) {
        const fetched = response.data.data;
        setProductData({
          name: fetched.name || '',
          description: fetched.description || '',
          price: fetched.price || '',
          basePrice: fetched.basePrice || fetched.price || '', // Ưu tiên basePrice
          category: fetched.category || '',
          brand: fetched.brand || '',
          stock: fetched.stock === undefined ? '' : fetched.stock,
          images: fetched.images && fetched.images.length > 0 ? [...fetched.images, '', '', ''].slice(0,3) : ['', '', ''],
          variants: fetched.variants ? fetched.variants.map(v => ({
              ...v,
              attributes: v.attributes || { color: '', size: ''}, // Đảm bảo attributes tồn tại
              variantImages: v.variantImages && v.variantImages.length > 0 ? [...v.variantImages] : ['']
          })) : [],
        });
      } else {
        setError("Failed to load product data.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error loading product.");
      console.error("Load product error:", err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  // Copy các hàm handle...Change, handleAddVariant, handleRemoveVariant từ AddProduct.js vào đây
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (index, value) => {
    const newImages = [...productData.images];
    newImages[index] = value;
    setProductData(prev => ({ ...prev, images: newImages }));
  };

  const handleAddVariant = () => {
    setProductData(prev => ({
      ...prev,
      variants: [...prev.variants, { 
        sku: '', 
        attributes: { color: '', size: '' }, 
        price: '', 
        stock: '',
        variantImages: ['']
      }]
    }));
  };

  const handleRemoveVariant = (index) => {
    const newVariants = productData.variants.filter((_, i) => i !== index);
    setProductData(prev => ({ ...prev, variants: newVariants }));
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...productData.variants];
    newVariants[index][field] = value;
    setProductData(prev => ({ ...prev, variants: newVariants }));
  };
  
  const handleVariantAttributeChange = (variantIndex, attributeName, value) => {
    const newVariants = [...productData.variants];
    newVariants[variantIndex].attributes[attributeName] = value;
    setProductData(prev => ({ ...prev, variants: newVariants }));
  };

  const handleVariantImageChange = (variantIndex, imgIndex, value) => {
    const newVariants = [...productData.variants];
     if (!newVariants[variantIndex].variantImages) {
        newVariants[variantIndex].variantImages = [];
    }
    newVariants[variantIndex].variantImages[imgIndex] = value;
    setProductData(prev => ({ ...prev, variants: newVariants }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    const dataToSubmit = {
      ...productData,
      price: parseFloat(productData.price) || 0,
      basePrice: parseFloat(productData.basePrice) || parseFloat(productData.price) || 0,
      stock: parseInt(productData.stock) || 0,
      images: productData.images.filter(img => img.trim() !== ''),
      variants: productData.variants.map(v => ({
        _id: v._id, // Giữ lại _id của variant để backend biết update cái nào
        sku: v.sku,
        attributes: v.attributes,
        price: parseFloat(v.price) || 0,
        stock: parseInt(v.stock) || 0,
        variantImages: v.variantImages ? v.variantImages.filter(img => img.trim() !== '') : []
      })),
    };
    if (dataToSubmit.variants && dataToSubmit.variants.length > 0 && dataToSubmit.basePrice) {
        delete dataToSubmit.price;
    }


    try {
      const response = await updateProductAPI(productId, dataToSubmit);
      if (response.data.success) {
        setSuccessMessage('Product updated successfully!');
        alert('Product updated successfully!');
        navigate('/admin/Products');
      } else {
        setError(response.data.message || 'Failed to update product.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred.');
      console.error("Update product error:", err);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && !productData.name) { // Chỉ hiển thị loading ban đầu
    return <div className="admin-products-container">Loading product for editing...</div>;
  }

  return (
    <main className="admin-products-container add-product-page"> {/* Tái sử dụng class */}
      <h1 className="admin-products-title">Edit Product</h1>
      <section className="admin-products-nav-filter-section">
         <nav className="admin-products-nav">
          <NavLink to="/admin/Products" className={({ isActive }) => `product-page-nav-button ${isActive ? 'active' : 'inactive'}`}>Products</NavLink>
          <NavLink to="/admin/AddProduct" className={({ isActive }) => `product-page-nav-button ${isActive ? '' : 'inactive'}`}>Add Product</NavLink>
        </nav>
      </section>

      <section className="admin-product-form-section">
        <form className="admin-product-form" onSubmit={handleSubmit}>
          <h2 className="admin-product-form-title">Edit: {productData.name || "Product"}</h2>
          {error && <p className="form-error">{error}</p>}
          {successMessage && <p className="form-success">{successMessage}</p>}

          {/* Copy JSX của form từ AddProduct.js vào đây, giữ lại value và onChange */}
          {/* Ví dụ: */}
          <div className="admin-product-form-field">
            <label htmlFor="name">Product Name*</label>
            <input id="name" name="name" type="text" value={productData.name} onChange={handleChange} required />
          </div>
          <div className="admin-product-form-field">
            <label htmlFor="description">Description* (min 5 lines)</label>
            <textarea id="description" name="description" value={productData.description} onChange={handleChange} rows="5" required />
          </div>
           <div className="admin-product-form-grid">
            <div className="admin-product-form-field">
                <label htmlFor="price">Price* (Default/Base if no variants)</label>
                <input id="price" name="price" type="number" step="0.01" value={productData.price} onChange={handleChange} required />
            </div>
             <div className="admin-product-form-field">
                <label htmlFor="basePrice">Base Price (if product has variants)</label>
                <input id="basePrice" name="basePrice" type="number" step="0.01" value={productData.basePrice} onChange={handleChange} placeholder="Overrides Price if variants exist" />
            </div>
          </div>
          <div className="admin-product-form-grid">
            <div className="admin-product-form-field">
              <label htmlFor="category">Category*</label>
              <select id="category" name="category" value={productData.category} onChange={handleChange} required>
                <option value="">Select Category</option>
                {categoriesData.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
              </select>
            </div>
            <div className="admin-product-form-field">
              <label htmlFor="brand">Brand</label>
              <input id="brand" name="brand" type="text" value={productData.brand} onChange={handleChange} />
            </div>
          </div>
          <div className="admin-product-form-field">
            <label htmlFor="stock">Stock (for product without variants)</label>
            <input id="stock" name="stock" type="number" value={productData.stock} onChange={handleChange} />
          </div>

          <fieldset className="admin-product-form-fieldset">
            <legend>Product Images (Enter URLs, min 3)</legend>
            {productData.images.map((imgUrl, index) => (
              <div key={index} className="admin-product-form-field">
                <label htmlFor={`image-${index}`}>Image URL {index + 1}</label>
                <input id={`image-${index}`} type="url" value={imgUrl} onChange={(e) => handleImageChange(index, e.target.value)} placeholder="https://example.com/image.jpg" />
              </div>
            ))}
          </fieldset>

          <fieldset className="admin-product-form-fieldset">
            <legend>Variants (min 2 for full marks if applicable)</legend>
            {productData.variants.map((variant, vIndex) => (
              <div key={vIndex} className="variant-item">
                <h4>Variant {vIndex + 1} <button type="button" onClick={() => handleRemoveVariant(vIndex)} className="remove-variant-btn">Remove</button></h4>
                <div className="admin-product-form-field">
                  <label htmlFor={`variant-sku-${vIndex}`}>SKU</label>
                  <input id={`variant-sku-${vIndex}`} type="text" value={variant.sku || ''} onChange={(e) => handleVariantChange(vIndex, 'sku', e.target.value)} />
                </div>
                <div className="admin-product-form-field">
                  <label htmlFor={`variant-color-${vIndex}`}>Color</label>
                  <input id={`variant-color-${vIndex}`} type="text" value={variant.attributes.color || ''} onChange={(e) => handleVariantAttributeChange(vIndex, 'color', e.target.value)} />
                </div>
                 <div className="admin-product-form-field">
                  <label htmlFor={`variant-size-${vIndex}`}>Size</label>
                  <input id={`variant-size-${vIndex}`} type="text" value={variant.attributes.size || ''} onChange={(e) => handleVariantAttributeChange(vIndex, 'size', e.target.value)} />
                </div>
                <div className="admin-product-form-grid">
                  <div className="admin-product-form-field">
                    <label htmlFor={`variant-price-${vIndex}`}>Variant Price*</label>
                    <input id={`variant-price-${vIndex}`} type="number" step="0.01" value={variant.price || ''} onChange={(e) => handleVariantChange(vIndex, 'price', e.target.value)} required />
                  </div>
                  <div className="admin-product-form-field">
                    <label htmlFor={`variant-stock-${vIndex}`}>Variant Stock*</label>
                    <input id={`variant-stock-${vIndex}`} type="number" value={variant.stock || ''} onChange={(e) => handleVariantChange(vIndex, 'stock', e.target.value)} required />
                  </div>
                </div>
                <div className="admin-product-form-field">
                    <label htmlFor={`variant-image-url-${vIndex}-0`}>Variant Image URL</label>
                    <input id={`variant-image-url-${vIndex}-0`} type="url" value={variant.variantImages ? variant.variantImages[0] || '' : ''} onChange={(e) => handleVariantImageChange(vIndex, 0, e.target.value)} placeholder="https://example.com/variant_image.jpg" />
                </div>
              </div>
            ))}
            <button type="button" onClick={handleAddVariant} className="add-variant-btn">Add Variant</button>
          </fieldset>

          <div className="admin-product-form-buttons">
            <button className="admin-product-form-button submit" type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Product'}
            </button>
            <button className="admin-product-form-button cancel" type="button" onClick={() => navigate('/admin/Products')}>
              Cancel
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
export default EditProduct;