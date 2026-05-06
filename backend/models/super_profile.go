package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type SuperProfile struct {
	ID             primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID         primitive.ObjectID `json:"user_id" bson:"user_id"`       // Chủ sở hữu
	Name           string             `json:"name" bson:"name"`             // Tên KOL ảo (VD: Anna, Sophia)
	Niche          string             `json:"niche" bson:"niche"`           // Ngách nội dung (VD: Fashion, Travel)
	Personality    string             `json:"personality" bson:"personality"` // Mô tả tính cách, backstory
	Gender         string             `json:"gender" bson:"gender"`         // "male" | "female" | "lgbt"
	Age            int                `json:"age" bson:"age"`               // 18-70
	Language       string             `json:"language" bson:"language"`     // "vi" | "en" | ...
	Location       string             `json:"location" bson:"location"`     // Khu vực nhắm tới
	Platforms      []string           `json:"platforms" bson:"platforms"`   // ["tiktok", "instagram", "facebook"]
	Status         string             `json:"status" bson:"status"`         // "draft" | "active" | "banned"
	CreatedAt      time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt      time.Time          `json:"updated_at" bson:"updated_at"`
}
