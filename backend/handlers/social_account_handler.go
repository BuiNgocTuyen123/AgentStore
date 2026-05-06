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

// POST /api/accounts — Thêm Social Account mới vào Kho (bắt buộc gắn với 1 Super Profile)
func CreateSocialAccount(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userIDStr, _ := c.Get("user_id")
	role, _ := c.Get("role")
	userID, _ := primitive.ObjectIDFromHex(userIDStr.(string))

	var input struct {
		SuperProfileID string `json:"super_profile_id" binding:"required"`
		Platform       string `json:"platform" binding:"required"`
		Username       string `json:"username"`
		URL            string `json:"url"`
		Computer       string `json:"computer"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ: " + err.Error()})
		return
	}

	superProfileID, err := primitive.ObjectIDFromHex(input.SuperProfileID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Super Profile ID không hợp lệ"})
		return
	}

	// Kiểm tra Super Profile tồn tại và thuộc quyền sở hữu
	profileCol := config.DB.Collection("super_profiles")
	var profile models.SuperProfile
	if err := profileCol.FindOne(ctx, bson.M{"_id": superProfileID}).Decode(&profile); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy Super Profile để gán"})
		return
	}

	r := role.(string)
	if r != "super_admin" && r != "manager" && profile.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Bạn không có quyền thêm account vào profile này"})
		return
	}

	validPlatforms := map[string]bool{"tiktok": true, "instagram": true, "facebook": true}
	if !validPlatforms[input.Platform] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nền tảng không hợp lệ"})
		return
	}

	account := models.SocialAccount{
		ID:             primitive.NewObjectID(),
		UserID:         userID,
		SuperProfileID: superProfileID,
		Platform:       input.Platform,
		Username:       input.Username,
		URL:            input.URL,
		Computer:       input.Computer,
		Status:         "raw", // Mặc định vào kho là thô
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	col := config.DB.Collection("social_accounts")
	if _, err := col.InsertOne(ctx, account); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo Social Account"})
		return
	}

	c.JSON(http.StatusCreated, account)
}

// GET /api/accounts — Lấy tất cả Social Accounts trong Kho của User
func GetAllSocialAccounts(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userIDStr, _ := c.Get("user_id")
	role, _ := c.Get("role")
	userID, _ := primitive.ObjectIDFromHex(userIDStr.(string))

	col := config.DB.Collection("social_accounts")
	var filter bson.M

	r := role.(string)
	if r == "super_admin" || r == "manager" {
		filter = bson.M{} // Admin/Manager xem tất cả trong kho
	} else {
		filter = bson.M{"user_id": userID}
	}

	cursor, err := col.Find(ctx, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi lấy danh sách tài khoản"})
		return
	}
	defer cursor.Close(ctx)

	var accounts []models.SocialAccount
	if err = cursor.All(ctx, &accounts); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi đọc dữ liệu"})
		return
	}

	c.JSON(http.StatusOK, accounts)
}

// GET /api/super-profiles/:id/accounts — Lấy accounts của 1 Profile (giữ nguyên cho trang detail)
func GetSocialAccounts(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	superProfileID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Super Profile ID không hợp lệ"})
		return
	}

	col := config.DB.Collection("social_accounts")
	cursor, err := col.Find(ctx, bson.M{"super_profile_id": superProfileID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi lấy danh sách"})
		return
	}
	defer cursor.Close(ctx)

	var accounts []models.SocialAccount
	if err = cursor.All(ctx, &accounts); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi đọc dữ liệu"})
		return
	}

	c.JSON(http.StatusOK, accounts)
}

// PUT /api/accounts/:id — Cập nhật Social Account
func UpdateSocialAccount(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	var input struct {
		Username string `json:"username"`
		URL      string `json:"url"`
		Computer string `json:"computer"`
		Status   string `json:"status"` // "raw" | "setup" | "farming" | "die"
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	update := bson.M{"$set": bson.M{
		"username":   input.Username,
		"url":        input.URL,
		"computer":   input.Computer,
		"status":     input.Status,
		"updated_at": time.Now(),
	}}

	col := config.DB.Collection("social_accounts")
	result, err := col.UpdateOne(ctx, bson.M{"_id": id}, update)
	if err != nil || result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy Social Account"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cập nhật thành công"})
}

// DELETE /api/accounts/:id — Xóa Social Account
func DeleteSocialAccount(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	col := config.DB.Collection("social_accounts")
	result, err := col.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil || result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy Social Account"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Xóa thành công"})
}
