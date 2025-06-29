// backend/server.js
const express = require('express');
const cors = require('cors');
const app = express();
// const port = 5000; // PORT đã được định nghĩa lại ở dưới, có thể bỏ dòng này
require('dotenv').config();
const passport = require('passport');

require('./Config/passport-setup'); // Đảm bảo file này không có lỗi khi require
const { connectDB, getDB, closeDB } = require('./Config/db');
const mainRoutes = require('./Routes'); // Import router chính từ Routes/index.js
const session = require('express-session');
const { errorHandler } = require('./Middlewares/errorMiddleware'); // Import

const PORT = process.env.PORT || 3001; // Nên dùng PORT từ .env hoặc một giá trị nhất quán, ví dụ 3001
// Middleware để parse JSON trong request body
app.use(express.json());
app.use(cors());

// BỎ DÒNG NÀY ĐI: app.use('/api', mainRoutes);

// Một API endpoint đơn giản để test
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Xin chào từ backend!' });
});

async function startServer() {
  try {
    await connectDB(); // Kết nối đến MongoDB
    // const db = getDB();
    // console.log(`Connected to database: ${db.databaseName}`); // Có thể bỏ comment để test DB

    app.use(session({
        secret: process.env.SESSION_SECRET || 'a_very_secret_key_for_session',
        resave: false,
        saveUninitialized: false,
        // cookie: { secure: process.env.NODE_ENV === 'production' } // Quan trọng cho HTTPS
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    // Đặt app.use('/api', mainRoutes) ở đây, sau các middleware session và passport
    app.use('/api', mainRoutes); // <<< GIỮ LẠI DÒNG NÀY Ở ĐÂY

    // Middleware xử lý lỗi phải được đặt SAU CÙNG, sau tất cả các route và middleware khác
    app.use(errorHandler);


    app.get('/', (req, res) => {
      res.send('Hello from E-commerce Backend!');
    });

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the server", error);
    process.exit(1);
  }
}

app.use(session({
    secret: process.env.SESSION_SECRET, // Lấy từ .env
    resave: false,
    saveUninitialized: false, // Hoặc true tùy theo nhu cầu, nhưng false thường tốt hơn
    // cookie: { secure: process.env.NODE_ENV === 'production' } // Bật ở production
}));

startServer();

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing MongoDB connection.');
  await closeDB();
  process.exit(0);
});