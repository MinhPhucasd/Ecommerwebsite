// src/productDetail/ProductDetail.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, NavLink, useParams, useNavigate } from 'react-router-dom';
import './productDetail.css'; // Đảm bảo tên file CSS khớp
import { fetchProductById, addItemToCart, fetchProducts as fetchRelatedProducts, addProductReview } from '../services/api';
import { useAuth } from '../context/authContext';
import { useCart } from '../context/cartContext.js';
import ProductCard from '../components/productCard/productCard.js';

// Component StarRatingInput (có thể tách ra file riêng)
const StarRatingInput = ({ rating, setRating, disabled = false }) => {
  const [hoverRating, setHoverRating] = useState(0);
  return (
    <div className="star-rating-input">
      {[1, 2, 3, 4, 5].map((star) => (
        <i
          key={star}
          className={`fas fa-star ${rating >= star || hoverRating >= star ? 'selected' : 'empty'}`}
          onMouseEnter={() => !disabled && setHoverRating(star)}
          onMouseLeave={() => !disabled && setHoverRating(0)}
          onClick={() => !disabled && setRating(star)}
          style={{ cursor: disabled ? 'default' : 'pointer', color: (rating >= star || hoverRating >= star) ? '#FFAD33' : '#E0E0E0', fontSize: '1.5rem', marginRight: '2px' }}
        />
      ))}
    </div>
  );
};


function ProductDetail() {
  const { id: productIdFromUrl } = useParams();
  const { currentUser } = useAuth(); // Lấy thông tin người dùng hiện tại
  const { cart, fetchCartData: refreshCart, loadingCart } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // States cho việc chọn biến thể và số lượng
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [currentVariant, setCurrentVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [mainImage, setMainImage] = useState('');
  const [relatedItems, setRelatedItems] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // States for new review/comment
  const [newRating, setNewRating] = useState(0); // 0 nghĩa là chưa rate
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');


  const cartItemCount = cart && cart.items ? cart.items.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 0), 0) : 0;

  // 1. Fetch Product Details
  const loadProductDetails = useCallback(async () => {
    if (!productIdFromUrl) {
      setError("Product ID is missing from URL.");
      setLoading(false);
      setProduct(null);
      return;
    }
    setLoading(true);
    setError('');
    // Không reset product hoàn toàn ở đây nếu chỉ muốn cập nhật reviews
    // mà chỉ fetch lại và setProduct(fetchedProduct)

    try {
      console.log(`PRODUCT_DETAIL: Fetching product details for ID: ${productIdFromUrl}`);
      const response = await fetchProductById(productIdFromUrl);
      if (response.data.success) {
        const fetchedProduct = response.data.data;
        console.log("PRODUCT_DETAIL: Product data received from API:", fetchedProduct);
        setProduct(fetchedProduct); // Cập nhật toàn bộ product, bao gồm cả reviews mới

        // Chỉ set ảnh chính và variant mặc định nếu đây là lần load đầu tiên cho sản phẩm này
        // Hoặc nếu `product` state hiện tại chưa có hoặc khác productIdFromUrl
        if (!product || product._id !== fetchedProduct._id) {
          setMainImage(fetchedProduct.images && fetchedProduct.images.length > 0 ? fetchedProduct.images[0] : 'https://via.placeholder.com/450x400?text=No+Image');
          if (fetchedProduct.variants && fetchedProduct.variants.length > 0) {
            const defaultVariant = fetchedProduct.variants.find(v => v.stock > 0) || fetchedProduct.variants[0];
            if (defaultVariant) {
              setCurrentVariant(defaultVariant);
              setSelectedAttributes(defaultVariant.attributes || {});
              if (defaultVariant.variantImages && defaultVariant.variantImages.length > 0) {
                setMainImage(defaultVariant.variantImages[0]);
              }
            }
          }
          setQuantity(1); // Reset số lượng khi sản phẩm mới được load
        }
        // Cảnh báo nếu không đủ biến thể
        if (fetchedProduct.variants && fetchedProduct.variants.length < 2 && fetchedProduct.variants.length !== 0) {
          console.warn(`Product ID ${productIdFromUrl} has only ${fetchedProduct.variants.length} variant(s). Project requires at least 2 variants per product for full marks if variants are intended.`);
        } else if (!fetchedProduct.variants || fetchedProduct.variants.length === 0) {
          // console.warn(`PRODUCT_DETAIL: Product ID ${productIdFromUrl} has no variants. Ensure this is intended.`);
        }

      } else {
        setError(response.data.message || "Failed to load product details.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred while fetching product details.");
      console.error("PRODUCT_DETAIL: Fetch product detail error:", err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productIdFromUrl]); // Chỉ phụ thuộc productIdFromUrl cho lần fetch đầu và khi ID thay đổi

  useEffect(() => {
    loadProductDetails();
  }, [loadProductDetails]);


  // 2. Fetch Related Items
  useEffect(() => {
    if (product && product.category) {
      const loadRelatedItems = async () => {
        setLoadingRelated(true);
        try {
          const response = await fetchRelatedProducts({
            category: product.category,
            limit: 4,
          });
          if (response.data.success) {
            setRelatedItems(response.data.data.filter(item => item._id !== product._id));
          } else { setRelatedItems([]); }
        } catch (error) { console.error("Failed to fetch related items:", error); setRelatedItems([]); }
        finally { setLoadingRelated(false); }
      };
      loadRelatedItems();
    }
  }, [product]);

  // 3. Tạo danh sách các tùy chọn thuộc tính khả dụng
  const availableAttributeOptions = useMemo(() => {
    if (!product || !product.variants) return {};
    const options = {};
    product.variants.forEach(variant => {
      if (variant.attributes) {
        for (const attrKey in variant.attributes) {
          if (!options[attrKey]) {
            options[attrKey] = new Set();
          }
          options[attrKey].add(variant.attributes[attrKey]);
        }
      }
    });
    for (const key in options) {
      options[key] = Array.from(options[key]).sort();
    }
    return options;
  }, [product]);

  // 4. Cập nhật currentVariant khi selectedAttributes thay đổi
  useEffect(() => {
    if (product && product.variants && product.variants.length > 0 && Object.keys(selectedAttributes).length > 0) {
      const allAttributeTypesPresentInProduct = Object.keys(availableAttributeOptions);
      // Kiểm tra xem tất cả các loại thuộc tính mà sản phẩm này có đã được chọn hay chưa
      const allSelected = allAttributeTypesPresentInProduct.every(key => selectedAttributes[key] !== undefined && selectedAttributes[key] !== null);

      if (allSelected || allAttributeTypesPresentInProduct.length === 0) {
        const matchedVariant = product.variants.find(variant => {
          if (!variant.attributes) return false;
          return Object.keys(selectedAttributes).every(
            attrKey => selectedAttributes[attrKey] === variant.attributes[attrKey]
          );
        });

        setCurrentVariant(matchedVariant || null);
        setQuantity(1);

        if (matchedVariant && matchedVariant.variantImages && matchedVariant.variantImages.length > 0) {
          setMainImage(matchedVariant.variantImages[0]);
        } else if (product.images && product.images.length > 0) {
          setMainImage(product.images[0]);
        }
      } else {
        setCurrentVariant(null);
      }
    } else if (product && (!product.variants || product.variants.length === 0)) {
      setCurrentVariant(null);
    }
  }, [selectedAttributes, product, availableAttributeOptions]);


  // 5. Handlers
  const handleAttributeSelect = (attributeKey, attributeValue) => {
    setSelectedAttributes(prevAttributes => {
      const newAttributes = { ...prevAttributes };
      if (prevAttributes[attributeKey] === attributeValue) {
        // delete newAttributes[attributeKey]; // Option: bỏ chọn nếu click lại
      } else {
        newAttributes[attributeKey] = attributeValue;
      }
      return newAttributes;
    });
  };

  const handleQuantityChange = (change) => {
    setQuantity(prevQuantity => {
      const newQuantity = prevQuantity + change;
      const stockLimit = currentVariant ? currentVariant.stock : (product ? (product.stock || 0) : 1);
      if (newQuantity < 1) return 1;
      if (newQuantity > stockLimit) {
        alert(`Sorry, only ${stockLimit} items available for this selection.`);
        return stockLimit;
      }
      return newQuantity;
    });
  };

  const handleAddToCart = async () => {
    if (!currentUser) {
      alert("Please log in to add items to your cart.");
      navigate('/login');
      return;
    }
    if (!product) return;

    let variantToCart = currentVariant;
    if (product.variants && product.variants.length > 0) {
      const allAttributeTypesInProduct = Object.keys(availableAttributeOptions);
      const allRequiredOptionsSelected = allAttributeTypesInProduct.every(key => selectedAttributes[key]);

      if (allAttributeTypesInProduct.length > 0 && !allRequiredOptionsSelected) {
        alert("Please select all product options (e.g., color, size).");
        return;
      }
      if (!variantToCart && allAttributeTypesInProduct.length > 0) {
        alert("Selected combination is not available. Please try other options.");
        return;
      }
      if (variantToCart && variantToCart.stock < quantity) {
        alert(`Not enough stock for the selected variant. Only ${variantToCart.stock} available.`);
        return;
      }
    } else {
      if (product.stock < quantity) {
        alert(`Not enough stock. Only ${product.stock} available.`);
        return;
      }
    }

    try {
      const itemData = {
        productId: product._id,
        quantity,
        variantId: variantToCart ? variantToCart._id : undefined,
      };
      const response = await addItemToCart(itemData);
      if (response.data.success) {
        let successMsg = `${product.name} added to cart!`;
        if (variantToCart) {
          const attrDetails = Object.entries(variantToCart.attributes || {})
            .map(([key, value]) => value)
            .filter(Boolean)
            .join(' / ');
          if (attrDetails) successMsg = `${product.name} (${attrDetails}) added to cart!`;
        }
        alert(successMsg);
        refreshCart();
      } else {
        alert("Failed to add product to cart: " + (response.data.message || "Unknown error"));
      }
    } catch (err) {
      alert("Error adding product to cart: " + (err.response?.data?.message || err.message));
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const numRating = parseFloat(rating) || 0;
    const fullStars = Math.floor(numRating);
    const halfStar = numRating % 1 >= 0.4;
    for (let i = 0; i < fullStars; i++) stars.push(<i key={`full-${i}-${product?._id}`} className="fas fa-star"></i>);
    if (halfStar && stars.length < 5) stars.push(<i key={`half-${product?._id}`} className="fas fa-star-half-alt"></i>);
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) stars.push(<i key={`empty-${i}-${product?._id}`} className="far fa-star"></i>);
    return stars.length > 0 ? stars : <small style={{ color: '#777', fontStyle: 'italic' }}>No rating</small>;
  };

  // Handler for submitting review
  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!newComment.trim()) {
      setReviewError("Comment cannot be empty.");
      return;
    }
    if (!currentUser && newRating > 0) {
      setReviewError("You must be logged in to submit a star rating. Your comment will be submitted anonymously.");
      // Vẫn cho phép submit comment, backend sẽ bỏ qua rating
    }

    setSubmittingReview(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      const reviewData = { comment: newComment.trim() };
      if (currentUser && newRating > 0) { // Chỉ gửi rating nếu đã đăng nhập và có chọn sao
        reviewData.rating = newRating;
      }

      console.log("PRODUCT_DETAIL: Submitting review data:", reviewData, "for product:", productIdFromUrl);
      const response = await addProductReview(productIdFromUrl, reviewData); // Gọi API
      console.log("PRODUCT_DETAIL: Submit review API response:", response);

      if (response.data.success) {
        setReviewSuccess("Your review has been submitted successfully! It will appear after moderation or refresh.");
        setNewComment('');
        setNewRating(0);
        // Tải lại chi tiết sản phẩm để cập nhật danh sách reviews và averageRating
        await loadProductDetails(); // Đợi cho đến khi dữ liệu được tải lại xong
      } else {
        setReviewError(response.data.message || "Failed to submit review.");
      }
    } catch (err) {
      // Lỗi 404 sẽ vào đây nếu API endpoint không tồn tại
      setReviewError(err.response?.data?.message || err.message || "An error occurred while submitting your review.");
      console.error("Submit review error:", err); // Log lỗi đầy đủ ra console
    } finally {
      setSubmittingReview(false);
    }
  };

  // --- RENDER ---
  if (loading && !product) return <div style={{ textAlign: 'center', margin: '5rem auto', fontSize: '1.2em' }}>Loading product details...</div>;
  if (error && !product) return <div style={{ textAlign: 'center', margin: '5rem auto', color: 'red' }}>Error: {error} <Link to="/">Go Home</Link></div>;
  if (!product) return <div style={{ textAlign: 'center', margin: '5rem auto' }}>Product not found. <Link to="/">Go Home</Link></div>;

  const displayPrice = currentVariant ? currentVariant.price : product.price;
  const currentStock = currentVariant ? currentVariant.stock : (product.stock || 0);
  const stockStatus = currentStock > 0;
  const productImages = product.images || [];
  const descriptionLines = (product.description || "").split('\n').filter(p => p.trim() !== '');

  return (
    <>
      <div className="product-detail-top-banner">
        Summer Sale for All Swim Suits and Free Express Delivery - QSR 5251
        <Link className="underline ml-2" style={{ color: 'white', fontWeight: '600', marginLeft: '0.5rem' }} to="/shop"> Shop Now</Link>
      </div>
      <header className="product-detail-header">
        <div className="product-detail-container product-detail-header-content">
          <Link to="/" className="product-detail-header-logo">Exclusive</Link>
          <nav className="product-detail-header-nav">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/contact">Contact</NavLink>
            <NavLink to="/about">About</NavLink>
            {!currentUser && <NavLink to="/signup">Sign Up</NavLink>}
          </nav>
          <form className="product-detail-search-form" onSubmit={(e) => { e.preventDefault(); const keyword = e.target.elements[0].value.trim(); if (keyword) navigate(`/shop?keyword=${encodeURIComponent(keyword)}`) }}>
            <input className="product-detail-search-input" placeholder="What are you looking for?" type="text" />
            <button className="product-detail-search-button" type="submit"><i className="fas fa-search"></i></button>
          </form>
          <div className="product-detail-header-icons">
            <Link to="/wishlist" aria-label="Wishlist" className="product-detail-header-icon-button"><i className="far fa-heart"></i></Link>
            <Link to="/cart" aria-label="Cart" className="product-detail-header-icon-button" style={{ position: 'relative' }}>
              <i className="fas fa-shopping-cart"></i>
              {currentUser && !loadingCart && cartItemCount > 0 && (
                <span className="cart-badge" style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#DB4444', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '18px' }}>{cartItemCount}</span>
              )}
            </Link>
            {currentUser ? (
              <Link to="/account" aria-label="User Account" className="product-detail-header-icon-button">
                {currentUser.fullName ?
                  <span style={{ display: 'inline-block', width: '24px', height: '24px', borderRadius: '50%', background: '#DB4444', color: 'white', textAlign: 'center', lineHeight: '24px', fontWeight: 'bold', fontSize: '0.8em' }}>
                    {currentUser.fullName.charAt(0).toUpperCase()}
                  </span>
                  : <i className="far fa-user"></i>
                }
              </Link>
            ) : (
              <Link to="/login" className="product-detail-header-nav" style={{ fontWeight: 500, marginLeft: '10px', color: '#333', textDecoration: 'none', fontSize: '0.875rem' }}>Login</Link>
            )}
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="product-detail-container product-detail-breadcrumb">
        <nav aria-label="Breadcrumb" className="breadcrumb-nav">
          <Link className="breadcrumb-link" to="/">Home</Link>
          {product.category && (
            <> <span className="breadcrumb-separator">/</span> <Link className="breadcrumb-link" to={`/shop?category=${encodeURIComponent(product.category)}`}>{product.category}</Link> </>
          )}
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{product.name}</span>
        </nav>
      </div>

      {/* Main content */}
      <main className="product-detail-container product-detail-main">
        <div className="product-detail-layout">
          {/* Left images column */}
          <div className="product-detail-images-aside">
            {(currentVariant?.variantImages && currentVariant.variantImages.length > 0 ? currentVariant.variantImages : productImages).slice(0, 4).map((imgUrl, index) => (
              <img alt={`${product.name} thumbnail ${index + 1}`} key={index} className="product-detail-thumbnail" src={imgUrl || 'https://via.placeholder.com/100?text=No+Image'} onClick={() => setMainImage(imgUrl)} style={{ cursor: 'pointer', border: mainImage === imgUrl ? '2px solid #DB4444' : '1px solid #E0E0E0', marginBottom: '10px', width: '100px', height: '100px', objectFit: 'contain', padding: '5px', display: 'block' }} />
            ))}
            {((currentVariant?.variantImages && currentVariant.variantImages.length > 0 ? currentVariant.variantImages : productImages).length < 3) &&
              <p style={{ fontSize: '0.8em', color: 'orange', marginTop: '10px' }}>Note: Project requires at least 3 illustrative images.</p>
            }
          </div>

          {/* Center large image */}
          <div className="product-detail-image-main-container">
            <img alt={`Main view of ${product.name}`} className="product-detail-image-main" src={mainImage || 'https://via.placeholder.com/450x400?text=No+Image'} />
          </div>

          {/* Right details column */}
          <div className="product-detail-info">
            <h1 className="product-title">{product.name}</h1>
            <div className="product-rating-stock">
              <div className="product-stars">{renderStars(product.averageRating || 0)}</div>
              <span className="product-reviews-count">({product.numReviews || 0} Reviews)</span>
              <span className="product-stock-status" style={{ color: stockStatus ? '#28a745' : '#dc3545', marginLeft: '10px', fontWeight: '500' }}>
                {stockStatus ? `In Stock (${currentStock} available)` : 'Out of Stock'}
              </span>
            </div>
            <p className="product-price">${displayPrice?.toFixed(2)}</p>
            <div className="product-description" style={{ minHeight: 'calc(1.2em * 5)', borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1rem', fontSize: '0.875rem', lineHeight: '1.6' }}>
              {descriptionLines.length > 0 ? descriptionLines.map((paragraph, index) => (
                <p key={index} style={{ marginBottom: index === descriptionLines.length - 1 ? 0 : '0.5em' }}>{paragraph}</p>
              )) : <p>No description available.</p>}
              {(descriptionLines.length < 5) &&
                <p style={{ fontSize: '0.8em', color: 'orange', marginTop: '10px' }}>Note: Product description should be at least 5 lines.</p>
              }
            </div>

            {/* Variants Selection */}
            {product.variants && product.variants.length > 0 && Object.keys(availableAttributeOptions).length > 0 && (
              <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', marginTop: '1rem' }}>
                {Object.entries(availableAttributeOptions).map(([attrKey, attrValues]) => (
                  <div key={attrKey} className="product-options-group" style={{ marginBottom: '1rem' }}>
                    <span className="product-options-label" style={{ textTransform: 'capitalize', fontWeight: '500', marginRight: '10px' }}>
                      {attrKey.replace(/_/g, ' ')}:
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      {attrValues.map(value => {
                        const isSelected = selectedAttributes[attrKey] === value;
                        return (
                          <button
                            key={value}
                            onClick={() => handleAttributeSelect(attrKey, value)}
                            className={`variant-option-button ${isSelected ? 'selected' : ''} ${attrKey === 'color' ? 'color-swatch' : 'size-button'}`}
                            style={attrKey === 'color' ? {
                              backgroundColor: value.toLowerCase(),
                              minWidth: '24px', width: '24px', height: '24px', borderRadius: '50%',
                              border: isSelected ? '2px solid #DB4444' : `1px solid ${value.toLowerCase() === 'white' || value.toLowerCase() === '#ffffff' ? '#ccc' : value.toLowerCase()}`,
                              boxShadow: isSelected ? '0 0 0 2px white, 0 0 0 4px #DB4444' : 'none',
                            } : {}}
                            title={value}
                          >
                            {attrKey !== 'color' ? value : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {(product.variants.length < 2) &&
                  <p style={{ fontSize: '0.8em', color: 'orange', marginTop: '10px' }}>Note: Project requires at least 2 variants.</p>
                }
              </div>
            )}

            {/* Actions */}
            <div className="product-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', border: '1px solid #808080', borderRadius: '4px' }}>
                <button aria-label="Decrease quantity" className="quantity-button" style={{ borderRight: '1px solid #808080', padding: '0.75rem 1rem', background: 'white', cursor: 'pointer' }} onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>−</button>
                <span className="quantity-value" style={{ padding: '0.75rem 1.5rem', userSelect: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '30px', fontWeight: '500' }}>{quantity}</span>
                <button aria-label="Increase quantity" className="quantity-button" style={{ borderLeft: '1px solid #808080', backgroundColor: '#DB4444', color: 'white', borderTopRightRadius: '3px', borderBottomRightRadius: '3px', padding: '0.75rem 1rem', cursor: 'pointer' }} onClick={() => handleQuantityChange(1)} disabled={!stockStatus || quantity >= currentStock}>+</button>
              </div>
              <button className="buy-now-button" onClick={handleAddToCart} disabled={!stockStatus || (product.variants?.length > 0 && !currentVariant && Object.keys(availableAttributeOptions).length > 0)}>
                {stockStatus ? (product.variants?.length > 0 && !currentVariant && Object.keys(availableAttributeOptions).length > 0 ? 'Select Options' : 'Add To Cart') : 'Out Of Stock'}
              </button>
              <button aria-label="Add to Wishlist" className="product-action-button" style={{ border: '1px solid #808080', borderRadius: '4px', padding: '0.75rem', height: 'auto', width: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'white', cursor: 'pointer' }}>
                <i className="far fa-heart" style={{ fontSize: '1.2rem' }}></i>
              </button>
            </div>

            {/* Delivery Info */}
            <div style={{ border: '1px solid #ccc', borderRadius: '4px', marginTop: '2rem' }}>
              <div className="delivery-info-card" style={{ borderBottom: '1px solid #ccc', marginBottom: 0, borderRadius: '4px 4px 0 0', padding: '1rem', display: 'flex', alignItems: 'center' }}>
                <i className="fas fa-truck delivery-info-icon" style={{ fontSize: '1.5rem', color: 'black', marginRight: '1rem' }}></i>
                <div className="delivery-info-text">
                  <p className="delivery-info-title" style={{ color: 'black', fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Free Delivery</p>
                  <p style={{ textDecoration: 'underline', fontWeight: '500', fontSize: '0.75rem', margin: 0 }}>Enter your postal code for Delivery Availability</p>
                </div>
              </div>
              <div className="delivery-info-card" style={{ borderRadius: '0 0 4px 4px', padding: '1rem', display: 'flex', alignItems: 'center' }}>
                <i className="fas fa-undo-alt delivery-info-icon" style={{ fontSize: '1.5rem', color: 'black', marginRight: '1rem' }}></i>
                <div className="delivery-info-text">
                  <p className="delivery-info-title" style={{ color: 'black', fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Return Delivery</p>
                  <p style={{ fontSize: '0.75rem', margin: 0 }}>Free 30 Days Delivery Returns. <Link to="/return-policy" style={{ textDecoration: 'underline', fontWeight: '500', color: 'inherit' }}>Details</Link></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* User Comments and Star Ratings Section */}
      <section className="product-detail-container" style={{ marginTop: '4rem', marginBottom: '3rem', borderTop: '1px solid #eee', paddingTop: '2rem' }}>
        <h2 className="related-items-title" style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>
          Reviews & Ratings ({product.numReviews || 0})
        </h2>
        <div className="add-review-form" style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>Leave a Review or Comment</h3>
          {reviewSuccess && <p style={{ color: 'green', marginBottom: '0.5rem' }}>{reviewSuccess}</p>}
          {reviewError && <p style={{ color: 'red', marginBottom: '0.5rem' }}>{reviewError}</p>}
          <form onSubmit={handleReviewSubmit}>
            {currentUser && (
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Your Rating:</label>
                <StarRatingInput rating={newRating} setRating={setNewRating} disabled={submittingReview} />
              </div>
            )}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="newComment" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Your Comment {currentUser ? '' : '(You can comment anonymously)'}:
              </label>
              <textarea
                id="newComment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows="4"
                placeholder="Write your comment here..."
                required
                disabled={submittingReview}
                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
              />
            </div>
            <button type="submit" className="buy-now-button" disabled={submittingReview} style={{ padding: '0.75rem 1.5rem' }}>
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
        {product.reviews && product.reviews.length > 0 ? (
          product.reviews.slice().reverse().map((review, index) => (
            <div key={review._id || `review-${index}`} style={{ borderBottom: '1px solid #f0f0f0', marginBottom: '1rem', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                <strong>{review.user?.name || "Anonymous"}</strong>
                {typeof review.rating === 'number' && review.rating > 0 &&
                  <div className="product-stars" style={{ marginLeft: '10px' }}>
                    {renderStars(review.rating)}
                  </div>
                }
              </div>
              <p style={{ fontSize: '0.9em', color: '#555', margin: '0 0 0.5em 0', whiteSpace: 'pre-wrap' }}>{review.comment}</p>
              {review.createdAt && <small style={{ color: '#777' }}>{new Date(review.createdAt).toLocaleString()}</small>}
            </div>
          ))
        ) : (
          <p>No reviews yet for this product. Be the first to write one!</p>
        )}
        <p style={{ marginTop: '2rem', fontSize: '0.8em', color: '#777' }}>
          <em>Note: Comments can be submitted anonymously. Star ratings require login.</em>
        </p>
      </section>

      {/* Related items */}
      <section className="related-items-section product-detail-container" style={{ borderTop: '1px solid #eee', paddingTop: '2rem' }}>
        <div className="related-items-header">
          <div className="related-items-marker" style={{ height: '2rem', width: '0.8rem', backgroundColor: '#DB4444' }}></div>
          <h2 className="related-items-title" style={{ fontSize: '1rem', fontWeight: '600', color: '#DB4444' }}>Related Items</h2>
        </div>
        {loadingRelated ? <p>Loading related items...</p> : relatedItems.length > 0 ? (
          <div className="related-items-grid">
            {relatedItems.map(item => (
              <ProductCard key={item._id} product={item} />
            ))}
          </div>
        ) : <p>No related items found.</p>}
      </section>

      {/* Footer */}
      <footer className="product-detail-footer" style={{ marginTop: '5rem' }}>
        <div className="product-detail-container product-detail-footer-grid">
          {/* ... (Toàn bộ JSX của Footer như bạn đã cung cấp) ... */}
        </div>
        <div className="product-detail-footer-copyright">
          © Copyright Exclusive 2022. All rights reserved
        </div>
      </footer>
    </>
  );
}

export default ProductDetail;
