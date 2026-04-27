package main

import (
	"log"
	"os"

	"ecommerce-backend/config"
	"ecommerce-backend/routes"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load file .env nếu có
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  Không tìm thấy file .env, dùng biến môi trường mặc định")
	}

	// Kết nối MongoDB
	config.ConnectDB()

	// Khởi tạo Gin router
	r := gin.Default()

	// CORS — cho phép frontend gọi API
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "message": "🚀 E-commerce API đang chạy!"})
	})

	// Đăng ký tất cả routes
	routes.SetupRoutes(r)

	// Lấy port từ biến môi trường, mặc định 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("✅ Server đang chạy tại http://localhost:%s\n", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("❌ Không thể khởi động server:", err)
	}
}
