package routes

import (
	"ecommerce-backend/handlers"
	"ecommerce-backend/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	// ── Public routes ──────────────────────────────────────
	api := r.Group("/api")
	{
		// Auth
		auth := api.Group("/auth")
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
			auth.GET("/google/login", handlers.GoogleLogin)
			auth.GET("/google/callback", handlers.GoogleCallback)
		}

		// Products (public - ai cũng xem được)
		products := api.Group("/products")
		{
			products.GET("", handlers.GetProducts)
			products.GET("/:id", handlers.GetProductByID)
		}

		// ── Protected routes (phải đăng nhập) ──────────────
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			// Products (chỉ admin mới được tạo/sửa/xóa)
			adminProducts := protected.Group("/products")
			adminProducts.Use(middleware.AdminMiddleware())
			{
				adminProducts.POST("", handlers.CreateProduct)
				adminProducts.PUT("/:id", handlers.UpdateProduct)
				adminProducts.DELETE("/:id", handlers.DeleteProduct)
			}

			// Admin — Quản lý users
			adminGroup := protected.Group("/admin")
			adminGroup.Use(middleware.AdminMiddleware())
			{
				adminGroup.GET("/users", handlers.GetAllUsers)
				adminGroup.POST("/users", handlers.CreateUserByAdmin)
				adminGroup.PUT("/users/:id/role", handlers.UpdateUserRole)
				adminGroup.DELETE("/users/:id", handlers.DeleteUser)
			}
		}
	}
}
