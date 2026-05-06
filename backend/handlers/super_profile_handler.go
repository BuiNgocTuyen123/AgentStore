package handlers

import (
	"context"
	"net/http"
	"time"

	"ecommerce-backend/config"
	"ecommerce-backend/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// POST /api/super-profiles — Tạo Super Profile mới (có check quota)
func CreateSuperProfile(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userIDStr, _ := c.Get("user_id")
	role, _ := c.Get("role")
	userID, err := primitive.ObjectIDFromHex(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID không hợp lệ"})
		return
	}

	// ── Kiểm tra quota (bỏ qua với super_admin) ──────────
	if role.(string) != "super_admin" {
		userCol := config.DB.Collection("users")
		var user models.User
		if err := userCol.FindOne(ctx, bson.M{"_id": userID}).Decode(&user); err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy user"})
			return
		}

		// Đếm số profile hiện tại
		profileCol := config.DB.Collection("super_profiles")
		count, err := profileCol.CountDocuments(ctx, bson.M{"user_id": userID})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi kiểm tra quota"})
			return
		}

		limit := int64(user.MaxSuperProfiles)
		if limit == 0 {
			limit = 1 // Mặc định user thường được 1 profile
		}
		if count >= limit {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Bạn đã đạt giới hạn Super Profile",
				"current": count,
				"limit":   limit,
				"message": "Vui lòng nâng cấp gói để thêm Super Profile",
			})
			return
		}
	}

	// ── Parse body và tạo profile ─────────────────────────
	var input struct {
		Name        string   `json:"name" binding:"required"`
		Niche       string   `json:"niche"`
		Personality string   `json:"personality"`
		Gender      string   `json:"gender" binding:"required"`
		Age         int      `json:"age" binding:"required,min=18,max=70"`
		Language    string   `json:"language"`
		Location    string   `json:"location"`
		Platforms   []string `json:"platforms" binding:"required,min=1"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ: " + err.Error()})
		return
	}

	// Validate platforms
	validPlatforms := map[string]bool{"tiktok": true, "instagram": true, "facebook": true}
	for _, p := range input.Platforms {
		if !validPlatforms[p] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Nền tảng không hợp lệ: " + p})
			return
		}
	}

	profile := models.SuperProfile{
		ID:          primitive.NewObjectID(),
		UserID:      userID,
		Name:        input.Name,
		Niche:       input.Niche,
		Personality: input.Personality,
		Gender:      input.Gender,
		Age:         input.Age,
		Language:    input.Language,
		Location:    input.Location,
		Platforms:   input.Platforms,
		Status:      "draft",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	col := config.DB.Collection("super_profiles")
	_, err = col.InsertOne(ctx, profile)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo Super Profile"})
		return
	}

	c.JSON(http.StatusCreated, profile)
}

// GET /api/super-profiles — Lấy danh sách (theo role)
func GetSuperProfiles(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userIDStr, _ := c.Get("user_id")
	role, _ := c.Get("role")
	userID, _ := primitive.ObjectIDFromHex(userIDStr.(string))

	col := config.DB.Collection("super_profiles")
	var filter bson.M

	switch role.(string) {
	case "super_admin":
		filter = bson.M{} // Super admin xem tất cả
	case "manager":
		filter = bson.M{} // Manager xem tất cả (giới hạn 10, enforce ở create)
	default:
		filter = bson.M{"user_id": userID} // User chỉ xem của mình
	}

	cursor, err := col.Find(ctx, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi lấy danh sách"})
		return
	}
	defer cursor.Close(ctx)

	var profiles []models.SuperProfile
	if err = cursor.All(ctx, &profiles); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi đọc dữ liệu"})
		return
	}

	c.JSON(http.StatusOK, profiles)
}

// GET /api/super-profiles/:id — Lấy 1 profile
func GetSuperProfileByID(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	userIDStr, _ := c.Get("user_id")
	role, _ := c.Get("role")
	userID, _ := primitive.ObjectIDFromHex(userIDStr.(string))

	col := config.DB.Collection("super_profiles")
	var profile models.SuperProfile
	if err := col.FindOne(ctx, bson.M{"_id": id}).Decode(&profile); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy Super Profile"})
		return
	}

	// Kiểm tra quyền sở hữu (trừ super_admin và manager)
	r := role.(string)
	if r != "super_admin" && r != "manager" && profile.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Bạn không có quyền xem profile này"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// PUT /api/super-profiles/:id — Cập nhật profile
func UpdateSuperProfile(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	userIDStr, _ := c.Get("user_id")
	role, _ := c.Get("role")
	userID, _ := primitive.ObjectIDFromHex(userIDStr.(string))

	// Kiểm tra quyền sở hữu
	col := config.DB.Collection("super_profiles")
	var existing models.SuperProfile
	if err := col.FindOne(ctx, bson.M{"_id": id}).Decode(&existing); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy Super Profile"})
		return
	}

	r := role.(string)
	if r != "super_admin" && r != "manager" && existing.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Bạn không có quyền chỉnh sửa profile này"})
		return
	}

	var input struct {
		Name        string   `json:"name"`
		Niche       string   `json:"niche"`
		Personality string   `json:"personality"`
		Gender      string   `json:"gender"`
		Age         int      `json:"age"`
		Language    string   `json:"language"`
		Location    string   `json:"location"`
		Platforms   []string `json:"platforms"`
		Status      string   `json:"status"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	update := bson.M{"$set": bson.M{
		"name":        input.Name,
		"niche":       input.Niche,
		"personality": input.Personality,
		"gender":      input.Gender,
		"age":         input.Age,
		"language":    input.Language,
		"location":    input.Location,
		"platforms":   input.Platforms,
		"status":      input.Status,
		"updated_at":  time.Now(),
	}}

	if _, err := col.UpdateOne(ctx, bson.M{"_id": id}, update); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể cập nhật"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cập nhật thành công"})
}

// DELETE /api/super-profiles/:id — Xóa profile
func DeleteSuperProfile(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	userIDStr, _ := c.Get("user_id")
	role, _ := c.Get("role")
	userID, _ := primitive.ObjectIDFromHex(userIDStr.(string))

	col := config.DB.Collection("super_profiles")
	var existing models.SuperProfile
	if err := col.FindOne(ctx, bson.M{"_id": id}).Decode(&existing); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy Super Profile"})
		return
	}

	r := role.(string)
	if r != "super_admin" && r != "manager" && existing.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Bạn không có quyền xóa profile này"})
		return
	}

	if _, err := col.DeleteOne(ctx, bson.M{"_id": id}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể xóa"})
		return
	}

	// Xóa tất cả social accounts liên quan
	config.DB.Collection("social_accounts").DeleteMany(ctx, bson.M{"super_profile_id": id})

	c.JSON(http.StatusOK, gin.H{"message": "Xóa Super Profile và tất cả Social Accounts thành công"})
}
