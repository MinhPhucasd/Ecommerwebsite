// Backend/Controllers/productController.js
const { getDB } = require('../Config/db'); // Import hàm getDB để lấy đối tượng db
const { ObjectId } = require('mongodb'); // Import ObjectId để làm việc với _id
const asyncHandler = require('express-async-handler');

// GET /api/products - Lấy tất cả sản phẩm
const getAllProducts = asyncHandler(async (req, res) => {
    console.log("--- ENTERING getAllProducts (REGEX SEARCH APPROACH) ---");
    console.log("Full req.query received:", JSON.stringify(req.query, null, 2));

    const db = getDB();
    if (!db) {
        console.error("DATABASE IS NULL in getAllProducts. Check db.js and MONGODB_URI.");
        return res.status(500).json({ success: false, error: 'Database connection error.' });
    }
    // Đảm bảo bạn đang dùng đúng tên collection ở đây
    const collectionName = 'products'; // HOẶC 'productsTree' NẾU ĐÓ LÀ TÊN ĐÚNG CỦA BẠN
    console.log(`Operating on database: ${db.databaseName}, Targeting collection: ${collectionName}`);

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    let queryFilter = {};

    // --- LỌC (FILTERING) --- (Giữ nguyên logic lọc của bạn nếu có)
    if (req.query.category) queryFilter.category = req.query.category;
    if (req.query.brand) {
        if (Array.isArray(req.query.brand)) {
            queryFilter.brand = { $in: req.query.brand };
        } else {
            queryFilter.brand = req.query.brand;
        }
    }
    if (req.query.minPrice || req.query.maxPrice) {
        queryFilter.price = {};
        if (req.query.minPrice) queryFilter.price.$gte = parseFloat(req.query.minPrice);
        if (req.query.maxPrice) queryFilter.price.$lte = parseFloat(req.query.maxPrice);
    }
    if (req.query.minRating) {
        queryFilter.averageRating = { $gte: parseFloat(req.query.minRating) };
    }

    // --- TÌM KIẾM THEO KEYWORD (SỬ DỤNG REGEX) ---
    if (req.query.keyword) {
        const keyword = req.query.keyword;
        // Tạo một regular expression để tìm kiếm không phân biệt chữ hoa/thường
        // và tìm các sản phẩm có chứa từ khóa (không cần khớp hoàn toàn)
        const keywordRegex = new RegExp(keyword.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), 'i');
        console.log("Keyword received for regex search:", keyword);
        console.log("Regex created:", keywordRegex.toString());

        // Tìm kiếm trên nhiều trường bằng $or
        // Đảm bảo các trường này tồn tại trong collection của bạn
        queryFilter.$or = [
            { name: keywordRegex },
            { description: keywordRegex },
            { category: keywordRegex },
            { brand: keywordRegex },
            // { tags: keywordRegex } // Nếu tags là mảng chuỗi, query này sẽ tìm nếu một tag khớp regex
        ];
        console.log("Applying Regex search filter with $or:", JSON.stringify(queryFilter.$or));
    }
    // --- KẾT THÚC TÌM KIẾM REGEX ---

    // --- SẮP XẾP (ORDERING) ---
    let sortOptions = {};
    if (req.query.sortBy) {
        const sortParams = req.query.sortBy.split(':');
        const sortField = sortParams[0];
        const sortOrder = sortParams[1] === 'desc' ? -1 : 1;
        const allowedSortFields = ['name', 'price', 'createdAt', 'averageRating', 'soldCount'];
        if (allowedSortFields.includes(sortField)) {
            sortOptions[sortField] = sortOrder;
        } else {
            sortOptions.createdAt = -1; // Mặc định nếu sortBy không hợp lệ
        }
    } else {
        // Nếu đang tìm kiếm bằng keyword, có thể sắp xếp theo tên hoặc giữ nguyên createdAt
        if (req.query.keyword) {
            // sortOptions.name = 1; // Ví dụ: sắp xếp theo tên A-Z
            sortOptions.createdAt = -1; // Hoặc vẫn ưu tiên sản phẩm mới
        } else {
            sortOptions.createdAt = -1; // Mặc định nếu không có sortBy và không có keyword
        }
    }
    console.log("Final sort options to be applied:", JSON.stringify(sortOptions));
    console.log("Final queryFilter before database operations:", JSON.stringify(queryFilter));

    try {
        const totalProducts = await db.collection(collectionName).countDocuments(queryFilter);
        console.log(`MongoDB countDocuments found ${totalProducts} products matching filter.`);
        const totalPages = Math.ceil(totalProducts / limit);

        const products = await db.collection(collectionName)
            .find(queryFilter)
            .sort(sortOptions) // Sẽ không có { score: { $meta: "textScore" } } ở đây
            .skip(skip)
            .limit(limit)
            .toArray();
        console.log(`MongoDB find().toArray() returned ${products.length} products.`);

        res.status(200).json({
            success: true,
            count: products.length,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalProducts: totalProducts,
                limit: limit,
                ...(page < totalPages && { nextPage: page + 1 }),
                ...(page > 1 && { prevPage: page - 1 })
            },
            data: products,
        });
    } catch (error) {
        console.error(`ERROR EXECUTING QUERY in getAllProducts on collection '${collectionName}':`, error);
        res.status(500).json({ success: false, error: 'Server Error when fetching products' });
    }
});                   

// POST /api/products - Tạo sản phẩm mới
const createProduct = asyncHandler(async (req, res) => { // Thêm asyncHandler
    const db = getDB();
    const { name, price, description, category, brand, images, variants /* các trường khác */ } = req.body;

    // Validate đầu vào cơ bản
    if (!name || price === undefined) { // Kiểm tra price === undefined vì price có thể là 0
        res.status(400);
        throw new Error('Please provide name and price'); // asyncHandler sẽ bắt lỗi này
    }
    // Thêm các validate khác theo yêu cầu (mô tả >= 5 dòng, >= 3 ảnh, variants...)

    const newProduct = {
        name,
        price: parseFloat(price),
        description,
        category,
        brand,
        images: images || [],       // Mảng URL ảnh
        variants: variants || [],   // Mảng các biến thể
        // basePrice, soldCount, averageRating, tags...
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const result = await db.collection('products').insertOne(newProduct);
    // Lấy lại document vừa insert để trả về (insertOne chỉ trả về insertedId và acknowledged)
    const createdProduct = await db.collection('products').findOne({ _id: result.insertedId });

    if (!createdProduct) { // Kiểm tra thêm nếu không tìm thấy sau khi insert (hiếm)
        res.status(500);
        throw new Error('Product created but could not be retrieved');
    }

    res.status(201).json({
        success: true,
        data: createdProduct,
    });
});


// GET /api/products/:id - Lấy một sản phẩm theo ID
const getProductById = asyncHandler(async (req, res) => { // Bỏ 'next' nếu dùng asyncHandler
    const db = getDB();
    const productId = req.params.id;

    if (!ObjectId.isValid(productId)) {
        res.status(400);
        throw new Error('Invalid product ID format');
    }

    const product = await db.collection('products').findOne({ _id: new ObjectId(productId) });
    // Nếu bạn muốn populate thêm thông tin category hoặc brand từ collection khác, bạn có thể dùng $lookup (aggregation) ở đây.
    // Ví dụ:
    // const productDetails = await db.collection('products').aggregate([
    //     { $match: { _id: new ObjectId(productId) } },
    //     {
    //         $lookup: {
    //             from: 'categories', // Tên collection categories
    //             localField: 'category', // Giả sử 'category' trong product là ObjectId của category
    //             foreignField: '_id',
    //             as: 'categoryDetails'
    //         }
    //     },
    //     { $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true } } // preserve nếu category có thể null
    // ]).toArray();
    // const product = productDetails.length > 0 ? productDetails[0] : null;


    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    // Đảm bảo các yêu cầu về thông tin chi tiết được đáp ứng bởi dữ liệu trong 'product'
    // (ví dụ: product.description phải đủ dài, product.images phải có đủ ảnh)

    res.status(200).json({
        success: true,
        data: product, // Dữ liệu này đã bao gồm mảng 'variants'
    });
});

// PUT /api/products/:id - Cập nhật sản phẩm
async function updateProduct(req, res, next) {
    try {
        const db = getDB();
        const productId = req.params.id;
        const updates = req.body; // Dữ liệu cần cập nhật

        if (!ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, error: 'Invalid product ID format' });
        }

        // Loại bỏ _id khỏi updates nếu có, vì không nên cập nhật _id
        delete updates._id;

        const result = await db.collection('products').updateOne(
            { _id: new ObjectId(productId) },
            { $set: updates } // Sử dụng $set để chỉ cập nhật các trường được cung cấp
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        if (result.modifiedCount === 0 && result.matchedCount === 1) {
             return res.status(200).json({ success: true, message: 'No changes made to the product', data: await db.collection('products').findOne({_id: new ObjectId(productId)}) });
        }

        const updatedProduct = await db.collection('products').findOne({ _id: new ObjectId(productId) });

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            data: updatedProduct
        });
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
}


// DELETE /api/products/:id - Xóa sản phẩm
async function deleteProduct(req, res, next) {
    try {
        const db = getDB();
        const productId = req.params.id;

        if (!ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, error: 'Invalid product ID format' });
        }

        const result = await db.collection('products').deleteOne({ _id: new ObjectId(productId) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully',
            data: {} // Hoặc trả về một thông báo
        });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
}


const getNewProducts = asyncHandler(async (req, res) => {
    const db = getDB();
    const limit = parseInt(req.query.limit) || 5; // Lấy limit từ query param, mặc định là 5
    const products = await db.collection('products')
        .find({})
        .sort({ createdAt: -1 }) // Sắp xếp theo ngày tạo giảm dần
        .limit(limit)
        .toArray();

    res.status(200).json({ success: true, count: products.length, data: products });
});


// @desc    Lấy sản phẩm bán chạy nhất (ví dụ: dựa trên số lượng đã bán - cần thêm trường 'sold' hoặc logic khác)
// @route   GET /api/products/bestsellers
// @access  Public
const getBestSellerProducts = asyncHandler(async (req, res) => {
    const db = getDB();
    const limit = parseInt(req.query.limit) || 5;
    // Giả sử bạn có một trường 'soldCount' trong product document để theo dõi số lượng đã bán
    // Hoặc bạn có thể tính toán dựa trên collection 'orders' (phức tạp hơn)
    const products = await db.collection('products')
        .find({}) // Có thể thêm điều kiện lọc khác nếu cần
        .sort({ soldCount: -1 }) // Sắp xếp theo số lượng bán giảm dần
        .limit(limit)
        .toArray();

    res.status(200).json({ success: true, count: products.length, data: products });
});




// @desc    Lấy sản phẩm theo một danh mục cụ thể
// @route   GET /api/products/category/:categoryName
// @access  Public
const getProductsByCategoryName = asyncHandler(async (req, res) => {
    const db = getDB();
    const categoryName = req.params.categoryName;

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10; // Có thể điều chỉnh limit mặc định cho trang category
    const skip = (page - 1) * limit;

    let queryFilter = { category: categoryName };
    // Thêm các bộ lọc khác nếu cần (brand, price trong category đó)

    let sortOptions = {};
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':');
        sortOptions[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    } else {
        sortOptions.createdAt = -1;
    }
    if (req.query.tags) {
    queryFilter.tags = { $in: req.query.tags.split(',') }; // Tìm sản phẩm có bất kỳ tag nào trong danh sách
    // Hoặc $all nếu muốn sản phẩm phải có tất cả các tag
    }
    const totalProducts = await db.collection('products').countDocuments(queryFilter);
    const totalPages = Math.ceil(totalProducts / limit);

    const products = await db.collection('products')
        .find(queryFilter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .toArray();

    res.status(200).json({
        success: true,
        count: products.length,
        pagination: {
            currentPage: page,
            totalPages: totalPages,
            totalProducts: totalProducts,
            limit: limit,
            ...(page < totalPages && { nextPage: page + 1 }),
            ...(page > 1 && { prevPage: page - 1 })
        },
        data: products,
    });
});

const addProductReview = asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    const productId = req.params.id;
    const db = getDB();

    console.log(`PRODUCT_CONTROLLER: Received POST to add review for product ID: ${productId}`);
    console.log(`Review data: rating=${rating}, comment=${comment}`);
    console.log(`User (if logged in):`, req.user ? req.user._id : 'Guest/Anonymous');

    if (!ObjectId.isValid(productId)) {
        res.status(400);
        throw new Error('Invalid Product ID format for review submission.');
    }

    if (!comment || comment.trim() === '') {
        res.status(400);
        throw new Error('Comment cannot be empty.');
    }

    const product = await db.collection('products').findOne({ _id: new ObjectId(productId) });

    if (!product) {
        res.status(404);
        throw new Error('Product not found to add review to.');
    }

    const newReview = {
        _id: new ObjectId(),
        user: {},
        comment: comment.trim(),
        createdAt: new Date(),
    };

    if (req.user && req.user._id) {
        newReview.user = {
            id: new ObjectId(req.user._id),
            name: req.user.fullName || "Registered User",
        };
        const numericRating = Number(rating);
        if (numericRating >= 1 && numericRating <= 5) {
            newReview.rating = numericRating;
        } else if (rating !== undefined && rating !== null && String(rating).trim() !== '') {
            console.warn(`Invalid rating value '${rating}' from user ${req.user._id}. Rating ignored.`);
        }
    } else {
        if (rating !== undefined && rating !== null && String(rating).trim() !== '' && Number(rating) > 0) {
            console.warn(`Rating '${rating}' received from guest. Rating ignored as user not logged in.`);
        }
        newReview.user.name = "Anonymous";
    }

    const updatedReviews = product.reviews ? [...product.reviews, newReview] : [newReview];

    let totalRatingValue = 0;
    let reviewsWithActualRatingCount = 0;
    updatedReviews.forEach(rev => {
        if (rev.rating && typeof rev.rating === 'number') {
            totalRatingValue += rev.rating;
            reviewsWithActualRatingCount++;
        }
    });

    const averageRating = reviewsWithActualRatingCount > 0 ? parseFloat((totalRatingValue / reviewsWithActualRatingCount).toFixed(1)) : (product.averageRating || 0);
    const numReviews = updatedReviews.length;

    const updateResult = await db.collection('products').updateOne(
        { _id: new ObjectId(productId) },
        {
            $set: {
                reviews: updatedReviews,
                averageRating: averageRating,
                numReviews: numReviews,
                updatedAt: new Date()
            }
        }
    );

    if (updateResult.modifiedCount === 1) {
        console.log(`Review added and product ${productId} updated successfully in DB.`);
        const updatedProduct = await db.collection('products').findOne({ _id: new ObjectId(productId) });
        res.status(201).json({
            success: true,
            message: 'Review added successfully!',
            data: updatedProduct, // Trả về sản phẩm đã cập nhật để frontend có thể cập nhật state
        });
    } else {
        console.error(`Failed to update product ${productId} in DB after adding review. Matched: ${updateResult.matchedCount}, Modified: ${updateResult.modifiedCount}`);
        res.status(500);
        throw new Error('Could not save review to the product.');
    }
});

// Export các hàm controller
module.exports = {
  getAllProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  getNewProducts,
  getBestSellerProducts,
  getProductsByCategoryName,
  addProductReview,
};