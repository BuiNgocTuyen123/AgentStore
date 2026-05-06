package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type SocialAccount struct {
	ID             primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID         primitive.ObjectID `json:"user_id" bson:"user_id"`
	SuperProfileID primitive.ObjectID `json:"super_profile_id" bson:"super_profile_id"`
	Platform       string             `json:"platform" bson:"platform"`         // "tiktok" | "instagram" | "facebook"
	Username       string             `json:"username" bson:"username"`          // Tên tài khoản trên nền tảng
	URL            string             `json:"url" bson:"url"`
	Computer       string             `json:"computer" bson:"computer"`
	Status         string             `json:"status" bson:"status"`             // "raw" | "setup" | "farming" | "die"
	CreatedAt      time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt      time.Time          `json:"updated_at" bson:"updated_at"`
}
