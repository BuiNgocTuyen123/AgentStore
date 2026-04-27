FROM golang:alpine AS builder

WORKDIR /app

# Copy các file quản lý thư viện và tải về trước (tối ưu cache)
COPY go.mod go.sum ./
RUN go mod download

# Copy toàn bộ code
COPY . .

# Build ứng dụng thành file thực thi tên là 'main'
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/main.go

# Chuyển sang image siêu nhẹ để chạy thực tế
FROM alpine:latest
WORKDIR /app

# Chỉ copy file thực thi từ bước build
COPY --from=builder /app/main .

EXPOSE 8080

# Chạy ứng dụng
CMD ["./main"]
