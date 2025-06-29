// src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
// 1. Đảm bảo đã import BrowserRouter
import { BrowserRouter } from 'react-router-dom';
import './index.css'; // File CSS global
import App from './App'; // Component App chính

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* 2. Đảm bảo App được bao bọc bởi BrowserRouter */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)