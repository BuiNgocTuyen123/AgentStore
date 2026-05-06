package routes

import (
	"ecommerce-backend/handlers"
	"ecommerce-backend/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		// ── Auth (Public) ──────────────────────────────────
		auth := api.Group("/auth")
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
			auth.GET("/google/login", handlers.GoogleLogin)
			auth.GET("/google/callback", handlers.GoogleCallback)
		}

		// ── Products (Public) ──────────────────────────────
		products := api.Group("/products")
		{
			products.GET("", handlers.GetProducts)
			products.GET("/:id", handlers.GetProductByID)
		}

		// ── Protected Routes (phải đăng nhập) ─────────────
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			// Products CRUD — Admin/Manager/SuperAdmin
			adminProducts := protected.Group("/products")
			adminProducts.Use(middleware.AdminMiddleware())
			{
				adminProducts.POST("", handlers.CreateProduct)
				adminProducts.PUT("/:id", handlers.UpdateProduct)
				adminProducts.DELETE("/:id", handlers.DeleteProduct)
			}

			// ── Super Profiles (KOL Management) ───────────
			sp := protected.Group("/super-profiles")
			{
				sp.GET("", handlers.GetSuperProfiles)           // Xem danh sách (theo role)
				sp.POST("", handlers.CreateSuperProfile)        // Tạo mới (có quota check)
				sp.GET("/:id", handlers.GetSuperProfileByID)    // Xem chi tiết
				sp.PUT("/:id", handlers.UpdateSuperProfile)     // Cập nhật
				sp.DELETE("/:id", handlers.DeleteSuperProfile)  // Xóa

				sp.GET("/:id/accounts", handlers.GetSocialAccounts)
			}

			// ── Social Accounts (Kho Tài Khoản) ──────────
			accounts := protected.Group("/accounts")
			{
				accounts.GET("", handlers.GetAllSocialAccounts)  // Xem kho
				accounts.POST("", handlers.CreateSocialAccount)  // Thêm vào kho
				accounts.PUT("/:id", handlers.UpdateSocialAccount)
				accounts.DELETE("/:id", handlers.DeleteSocialAccount)
			}

			// ── Admin Panel ────────────────────────────────
			adminGroup := protected.Group("/admin")
			adminGroup.Use(middleware.AdminMiddleware())
			{
				adminGroup.GET("/users", handlers.GetAllUsers)
				adminGroup.POST("/users", handlers.CreateUserByAdmin)
				adminGroup.PUT("/users/:id/role", handlers.UpdateUserRole)
				adminGroup.DELETE("/users/:id", handlers.DeleteUser)
			}

			// ── Super Admin: Cập nhật quota cho user ──────
			superAdmin := protected.Group("/super-admin")
			superAdmin.Use(middleware.SuperAdminMiddleware())
			{
				superAdmin.PUT("/users/:id/quota", handlers.UpdateUserQuota)
			}
		}
	}
}
