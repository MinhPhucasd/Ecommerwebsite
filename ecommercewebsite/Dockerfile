# ecommercewebsite/Dockerfile

# Giai đoạn 1: Build ứng dụng React
FROM node:18-alpine AS build
# Hoặc node:20-alpine

WORKDIR /app

COPY package*.json ./
# Nếu dùng yarn:
# COPY yarn.lock ./
# COPY package.json ./

RUN npm install
# Nếu dùng yarn:
# RUN yarn install --frozen-lockfile

COPY . ./

# Build ứng dụng React để tạo các file tĩnh
# Đảm bảo biến môi trường REACT_APP_API_URL được thiết lập đúng nếu cần trong quá trình build
# Bạn có thể truyền ARG vào đây và sử dụng trong ENV nếu API URL khác nhau giữa các môi trường
ARG REACT_APP_API_URL_ARG
ENV REACT_APP_API_URL=$REACT_APP_API_URL_ARG
RUN npm run build
# Nếu dùng yarn:
# RUN yarn build

# Giai đoạn 2: Serve các file tĩnh bằng Nginx (hoặc một web server nhẹ khác)
FROM nginx:stable-alpine

# Sao chép các file build tĩnh từ giai đoạn 'build' vào thư mục phục vụ của Nginx
COPY --from=build /app/build /usr/share/nginx/html

# (Tùy chọn) Sao chép file cấu hình Nginx tùy chỉnh nếu cần
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port mà Nginx lắng nghe (mặc định là 80)
EXPOSE 80

# Lệnh để khởi động Nginx
CMD ["nginx", "-g", "daemon off;"]