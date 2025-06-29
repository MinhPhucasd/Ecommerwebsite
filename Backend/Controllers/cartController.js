// Backend/Controllers/cartController.js
const { getDB } = require('../Config/db');
const asyncHandler = require('express-async-handler');
const { ObjectId } = require('mongodb');

// @desc    Lấy giỏ hàng của người dùng hiện tại
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
    // req.user đã chứa thông tin cart (nếu có) từ middleware protect
    if (req.user && req.user.cart) {
        res.status(200).json({ success: true, data: req.user.cart });
    } else {
        // Nếu user chưa có cart, trả về cart rỗng
        res.status(200).json({ success: true, data: { items: [], updatedAt: new Date() } });
    }
});

// @desc    Thêm sản phẩm vào giỏ hàng hoặc cập nhật số lượng
// @route   POST /api/cart
// @access  Private
const addItemToCart = asyncHandler(async (req, res) => {
    const db = getDB();
    const userId = req.user._id;
    const { productId, variantId, quantity } = req.body; // variantId là tùy chọn

    if (!productId || !quantity || quantity < 1) {
        res.status(400);
        throw new Error('Invalid product data or quantity');
    }

    // 1. Lấy thông tin sản phẩm/biến thể từ DB để đảm bảo giá và tên là chính xác
    const product = await db.collection('products').findOne({ _id: new ObjectId(productId) });
    if (!product) {
        res.status(404); throw new Error('Product not found');
    }

    let itemToAdd;
    if (variantId) {
        if (!ObjectId.isValid(variantId)) {
             res.status(400); throw new Error('Invalid variant ID format');
        }
        const variant = product.variants.find(v => v._id.toString() === variantId);
        if (!variant) {
            res.status(404); throw new Error('Variant not found');
        }
        if (variant.stock < quantity) {
            res.status(400); throw new Error(`Not enough stock for variant ${variant.sku}. Available: ${variant.stock}`);
        }
        itemToAdd = {
            productId: new ObjectId(productId),
            variantId: new ObjectId(variantId),
            name: `${product.name} (${Object.values(variant.attributes).map(attr => attr.value).join(' - ')})`, // Hoặc tên biến thể
            quantity: parseInt(quantity),
            price: variant.price, // Giá của biến thể
            image: product.images ? product.images[0] : (variant.variantImages ? variant.variantImages[0] : null)
        };
    } else {
        // Nếu sản phẩm không có biến thể hoặc user không chọn biến thể (cần logic kiểm tra tồn kho sản phẩm chính)
        // Giả sử sản phẩm không có biến thể, kiểm tra tồn kho sản phẩm chính nếu có trường stock ở product level
        // if (product.stock < quantity) {
        //     res.status(400); throw new Error(`Not enough stock for product ${product.name}. Available: ${product.stock}`);
        // }
        itemToAdd = {
            productId: new ObjectId(productId),
            name: product.name,
            quantity: parseInt(quantity),
            price: product.basePrice || product.price, // Giá của sản phẩm
            image: product.images ? product.images[0] : null
        };
    }


    // 2. Lấy giỏ hàng hiện tại của user
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    let cart = user.cart || { items: [], updatedAt: new Date() };

    // 3. Kiểm tra xem sản phẩm/biến thể đã có trong giỏ chưa
    const existingItemIndex = cart.items.findIndex(
        item => item.productId.toString() === productId &&
                (variantId ? item.variantId && item.variantId.toString() === variantId : !item.variantId)
    );

    if (existingItemIndex > -1) {
        // Nếu đã có, cập nhật số lượng
        cart.items[existingItemIndex].quantity += parseInt(quantity);
        // Kiểm tra lại tồn kho sau khi cộng dồn
        // (Logic này cần chi tiết hơn, có thể bạn muốn thay thế số lượng thay vì cộng dồn)
    } else {
        // Nếu chưa có, thêm mới
        cart.items.push(itemToAdd);
    }
    cart.updatedAt = new Date();

    // 4. Cập nhật giỏ hàng trong user document
    await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { cart: cart } }
    );

    res.status(200).json({ success: true, message: 'Item added/updated in cart', data: cart });
});


// @desc    Xóa một item khỏi giỏ hàng hoặc giảm số lượng
// @route   DELETE /api/cart/item
// @access  Private
const removeItemFromCart = asyncHandler(async (req, res) => {
    const db = getDB();
    const userId = req.user._id;
    // Client cần gửi productId và variantId (nếu có) của item cần xóa/giảm
    const { productId, variantId, removeAll } = req.body; // removeAll: true để xóa hẳn, false để giảm 1

    if (!productId) {
        res.status(400); throw new Error('Product ID is required');
    }

    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user || !user.cart || !user.cart.items) {
        res.status(404); throw new Error('Cart not found or empty');
    }

    let cart = user.cart;
    const itemIndex = cart.items.findIndex(
        item => item.productId.toString() === productId &&
                (variantId ? item.variantId && item.variantId.toString() === variantId : !item.variantId)
    );

    if (itemIndex === -1) {
        res.status(404); throw new Error('Item not found in cart');
    }

    if (removeAll || cart.items[itemIndex].quantity <= 1) {
        cart.items.splice(itemIndex, 1); // Xóa hẳn item
    } else {
        cart.items[itemIndex].quantity -= 1; // Giảm số lượng đi 1
    }
    cart.updatedAt = new Date();

    await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { cart: cart } }
    );

    res.status(200).json({ success: true, message: 'Cart updated', data: cart });
});

// @desc    Xóa toàn bộ giỏ hàng
// @route   DELETE /api/cart
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
    const db = getDB();
    const userId = req.user._id;

    await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { cart: { items: [], updatedAt: new Date() } } }
    );
    res.status(200).json({ success: true, message: 'Cart cleared', data: { items: [], updatedAt: new Date() } });
});

const updateCartItemQuantity = asyncHandler(async (req, res) => {
    const db = getDB();
    const userId = req.user._id;
    const { productId, variantId, quantity } = req.body; // quantity là số lượng mới

    if (!productId || quantity === undefined || quantity < 0) { // Cho phép quantity = 0 để xóa item
        res.status(400);
        throw new Error('Invalid product ID or quantity');
    }
    if (variantId && !ObjectId.isValid(variantId)) {
        res.status(400); throw new Error('Invalid variant ID format');
    }


    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user || !user.cart || !user.cart.items) {
        res.status(404); throw new Error('Cart not found or empty');
    }

    let cart = user.cart;
    const itemIndex = cart.items.findIndex(
        item => item.productId.toString() === productId &&
                (variantId ? item.variantId && item.variantId.toString() === variantId : !item.variantId)
    );

    if (itemIndex === -1) {
        res.status(404); throw new Error('Item not found in cart');
    }

    const newQuantity = parseInt(quantity);

    if (newQuantity === 0) {
        // Nếu số lượng mới là 0, xóa item khỏi giỏ hàng
        cart.items.splice(itemIndex, 1);
    } else {
        // Kiểm tra tồn kho trước khi cập nhật số lượng
        const productDoc = await db.collection('products').findOne({ _id: new ObjectId(productId) });
        if (!productDoc) {
            res.status(404); throw new Error('Product for cart item not found');
        }

        let stockAvailable = 0;
        if (variantId) {
            const variant = productDoc.variants.find(v => v._id.toString() === variantId);
            if (!variant) {
                res.status(404); throw new Error('Variant for cart item not found');
            }
            stockAvailable = variant.stock;
        } else {
            // Giả sử sản phẩm không có biến thể, lấy tồn kho từ sản phẩm chính (nếu có)
            // stockAvailable = productDoc.stock || 0; // Cần có trường stock ở product level
            // Trong trường hợp này, nếu không có variantId, ta coi như sản phẩm không quản lý tồn kho chi tiết hoặc logic phức tạp hơn
            // For simplicity, if no variantId, we might assume it's a product without variants or stock isn't checked here
            // This part needs careful consideration based on your product structure
        }

        // Chỉ kiểm tra tồn kho nếu có variantId (hoặc nếu bạn có logic tồn kho cho sản phẩm chính)
        if (variantId && newQuantity > stockAvailable) {
            res.status(400);
            throw new Error(`Not enough stock. Available: ${stockAvailable}`);
        }
        cart.items[itemIndex].quantity = newQuantity;
    }
    cart.updatedAt = new Date();

    await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { cart: cart } }
    );

    res.status(200).json({ success: true, message: 'Cart item quantity updated', data: cart });
});


module.exports = {
    getCart,
    addItemToCart,
    removeItemFromCart,
    updateCartItemQuantity, // Hàm mới
    clearCart,
};