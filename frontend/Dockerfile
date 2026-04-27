# Bước 1: Build ứng dụng React với Node.js
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# Bước 2: Dùng Nginx để phục vụ các file tĩnh (HTML, CSS, JS) đã được build
FROM nginx:alpine

# Xóa trang mặc định của Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copy code đã build từ bước 1 sang thư mục của Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy file cấu hình Nginx (để hỗ trợ React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
