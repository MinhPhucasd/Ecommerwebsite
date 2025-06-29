# Backend/Dockerfile

# Sử dụng một Node image chính thức làm base image
FROM node:18-alpine AS builder
# Hoặc node:20-alpine, tùy theo phiên bản Node.js bạn đang dùng

# Đặt thư mục làm việc trong container
WORKDIR /usr/src/app

# Sao chép package.json và package-lock.json (hoặc yarn.lock)
COPY package*.json ./
# Nếu dùng yarn:
# COPY yarn.lock ./
# COPY package.json ./

# Cài đặt dependencies
RUN npm install
# Nếu dùng yarn:
# RUN yarn install --frozen-lockfile

# Sao chép toàn bộ source code của backend vào thư mục làm việc
COPY . .

# (Tùy chọn) Nếu backend của bạn có bước build (ví dụ TypeScript)
# RUN npm run build

# Giai đoạn production image (nhỏ gọn hơn)
FROM node:18-alpine
WORKDIR /usr/src/app

# Sao chép node_modules và source code đã build (nếu có) từ builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app ./

# Expose port mà backend của bạn lắng nghe
EXPOSE 3001

# Lệnh để chạy ứng dụng khi container khởi động
CMD [ "npm", "start" ]
# Hoặc nếu bạn chạy trực tiếp bằng node:
# CMD [ "node", "server.js" ]