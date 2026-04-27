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
	"golang.org/x/crypto/bcrypt"
)

// POST /admin/users — Admin tạo user mới (có thể set role)
func CreateUserByAdmin(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var input struct {
		Username string `json:"username" binding:"required"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
		Role     string `json:"role"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Vui lòng nhập đầy đủ thông tin (mật khẩu >= 6 ký tự)"})
		return
	}

	collection := config.DB.Collection("users")

	// Kiểm tra username đã tồn tại chưa
	var existing models.User
	if err := collection.FindOne(ctx, bson.M{"username": input.Username}).Decode(&existing); err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Tên đăng nhập đã tồn tại"})
		return
	}
	// Kiểm tra email đã tồn tại chưa
	if err := collection.FindOne(ctx, bson.M{"email": input.Email}).Decode(&existing); err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email đã được sử dụng"})
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi xử lý mật khẩu"})
		return
	}

	role := input.Role
	if role != "admin" && role != "user" {
		role = "user"
	}

	user := models.User{
		ID:       primitive.NewObjectID(),
		Username: input.Username,
		Email:    input.Email,
		Password: string(hashed),
		Role:     role,
	}

	if _, err := collection.InsertOne(ctx, user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo người dùng"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Tạo người dùng thành công", "id": user.ID})
}

// GET /admin/users — Lấy danh sách tất cả users
func GetAllUsers(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	collection := config.DB.Collection("users")
	cursor, err := collection.Find(ctx, bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lấy danh sách user"})
		return
	}
	defer cursor.Close(ctx)

	var users []models.User
	if err := cursor.All(ctx, &users); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi đọc dữ liệu"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"users": users, "total": len(users)})
}

// PUT /admin/users/:id/role — Đổi role user
func UpdateUserRole(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	id := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	var body struct {
		Role string `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || (body.Role != "admin" && body.Role != "user") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Role phải là 'admin' hoặc 'user'"})
		return
	}

	collection := config.DB.Collection("users")
	_, err = collection.UpdateOne(ctx,
		bson.M{"_id": objID},
		bson.M{"$set": bson.M{"role": body.Role}},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể cập nhật role"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cập nhật role thành công"})
}

// DELETE /admin/users/:id — Xóa user
func DeleteUser(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	id := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	// Không cho phép xóa chính mình
	currentUserID, _ := c.Get("user_id")
	if currentUserID == id {
		c.JSON(http.StatusForbidden, gin.H{"error": "Không thể xóa chính mình"})
		return
	}

	collection := config.DB.Collection("users")
	result, err := collection.DeleteOne(ctx, bson.M{"_id": objID})
	if err != nil || result.DeletedCount == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể xóa user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Xóa user thành công"})
}
