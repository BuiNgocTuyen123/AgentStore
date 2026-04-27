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

// GET /products — Lấy tất cả sản phẩm
func GetProducts(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	collection := config.DB.Collection("products")
	cursor, err := collection.Find(ctx, bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lấy danh sách sản phẩm"})
		return
	}
	defer cursor.Close(ctx)

	var products []models.Product
	if err = cursor.All(ctx, &products); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi đọc dữ liệu"})
		return
	}

	c.JSON(http.StatusOK, products)
}

// GET /products/:id — Lấy 1 sản phẩm theo ID
func GetProductByID(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	collection := config.DB.Collection("products")
	var product models.Product
	err = collection.FindOne(ctx, bson.M{"_id": id}).Decode(&product)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy sản phẩm"})
		return
	}

	c.JSON(http.StatusOK, product)
}

// POST /products — Tạo sản phẩm mới (Admin)
func CreateProduct(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var product models.Product
	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ: " + err.Error()})
		return
	}

	product.ID = primitive.NewObjectID()
	collection := config.DB.Collection("products")
	_, err := collection.InsertOne(ctx, product)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo sản phẩm"})
		return
	}

	c.JSON(http.StatusCreated, product)
}

// PUT /products/:id — Cập nhật sản phẩm (Admin)
func UpdateProduct(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	var product models.Product
	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	collection := config.DB.Collection("products")
	update := bson.M{
		"$set": bson.M{
			"name":        product.Name,
			"description": product.Description,
			"price":       product.Price,
			"stock":       product.Stock,
			"image_url":   product.ImageURL,
			"category":    product.Category,
		},
	}

	result, err := collection.UpdateOne(ctx, bson.M{"_id": id}, update)
	if err != nil || result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy sản phẩm để cập nhật"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cập nhật thành công"})
}

// DELETE /products/:id — Xóa sản phẩm (Admin)
func DeleteProduct(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	collection := config.DB.Collection("products")
	result, err := collection.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil || result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy sản phẩm để xóa"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Xóa thành công"})
}
