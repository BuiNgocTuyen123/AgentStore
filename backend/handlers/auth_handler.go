package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"ecommerce-backend/config"
	"ecommerce-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

// POST /auth/register — Đăng ký tài khoản
func Register(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var input struct {
		Username string `json:"username" binding:"required"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Vui lòng nhập đầy đủ và đúng định dạng (mật khẩu >= 6 ký tự)"})
		return
	}

	var user models.User
	user.Username = input.Username
	user.Email = input.Email

	// Kiểm tra email đã tồn tại chưa
	collection := config.DB.Collection("users")
	var existingUser models.User
	err := collection.FindOne(ctx, bson.M{"email": user.Email}).Decode(&existingUser)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email đã được sử dụng"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi xử lý mật khẩu"})
		return
	}

	user.ID = primitive.NewObjectID()
	user.Password = string(hashedPassword)
	if user.Role == "" {
		user.Role = "user"
	}

	_, err = collection.InsertOne(ctx, user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo tài khoản"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Đăng ký thành công", "id": user.ID})
}

// POST /auth/login — Đăng nhập
func Login(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var input struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Vui lòng nhập tên đăng nhập và mật khẩu"})
		return
	}

	collection := config.DB.Collection("users")
	var user models.User
	err := collection.FindOne(ctx, bson.M{"username": input.Username}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tên đăng nhập hoặc mật khẩu không đúng"})
		return
	}

	// So sánh password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tên đăng nhập hoặc mật khẩu không đúng"})
		return
	}

	// Tạo JWT token
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "secret_key_change_in_production"
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  user.ID.Hex(),
		"email":    user.Email,
		"username": user.Username,
		"role":     user.Role,
		"exp":      time.Now().Add(24 * time.Hour).Unix(),
	})

	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": tokenString,
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
			"role":     user.Role,
			"avatar":   user.Avatar,
		},
	})
}

var googleOauthConfig *oauth2.Config

func init() {
	// Khởi tạo config với ID/Secret (Sẽ được gán lại động trong hàm chạy)
}

func GoogleLogin(c *gin.Context) {
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	clientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
	
	host := c.Request.Host 
	scheme := "http"
	if c.Request.TLS != nil || c.GetHeader("X-Forwarded-Proto") == "https" {
		scheme = "https"
	}
	
	// Khởi tạo động để lấy đúng domain hiện tại (localhost hoặc tuyenxinhtrai.site)
	googleOauthConfig = &oauth2.Config{
		RedirectURL:  fmt.Sprintf("%s://%s/api/auth/google/callback", scheme, host),
		ClientID:     clientID,
		ClientSecret: clientSecret,
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"},
		Endpoint:     google.Endpoint,
	}

	url := googleOauthConfig.AuthCodeURL("random-state-string")
	c.Redirect(http.StatusTemporaryRedirect, url)
}

func GoogleCallback(c *gin.Context) {
	state := c.Query("state")
	if state != "random-state-string" {
		c.Redirect(http.StatusTemporaryRedirect, "/login?error=invalid_state")
		return
	}

	code := c.Query("code")
	token, err := googleOauthConfig.Exchange(context.Background(), code)
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, "/login?error=exchange_failed")
		return
	}

	client := googleOauthConfig.Client(context.Background(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, "/login?error=userinfo_failed")
		return
	}
	defer resp.Body.Close()

	var userInfo struct {
		ID      string `json:"id"`
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}
	json.NewDecoder(resp.Body).Decode(&userInfo)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	collection := config.DB.Collection("users")
	var user models.User
	err = collection.FindOne(ctx, bson.M{"email": userInfo.Email}).Decode(&user)
	if err != nil {
		user = models.User{
			ID:       primitive.NewObjectID(),
			Username: userInfo.Name,
			Email:    userInfo.Email,
			Role:     "user",
			GoogleID: userInfo.ID,
			Avatar:   userInfo.Picture,
		}
		collection.InsertOne(ctx, user)
	} else {
		// Update GoogleID và Avatar nếu user đã tồn tại
		updateData := bson.M{}
		if user.GoogleID == "" {
			updateData["google_id"] = userInfo.ID
		}
		if user.Avatar == "" && userInfo.Picture != "" {
			updateData["avatar"] = userInfo.Picture
			user.Avatar = userInfo.Picture
		}
		if len(updateData) > 0 {
			collection.UpdateOne(ctx, bson.M{"_id": user.ID}, bson.M{"$set": updateData})
		}
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "secret_key_change_in_production"
	}
	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  user.ID.Hex(),
		"email":    user.Email,
		"username": user.Username,
		"role":     user.Role,
		"avatar":   user.Avatar,
		"exp":      time.Now().Add(24 * time.Hour).Unix(),
	})
	tokenString, _ := jwtToken.SignedString([]byte(jwtSecret))

	// Chuyển hướng người dùng về trang đăng nhập của React kèm theo token
	c.Redirect(http.StatusTemporaryRedirect, "/login?token="+tokenString)
}
