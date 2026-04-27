package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type User struct {
	ID       primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Username string             `json:"username" bson:"username"`
	Email    string             `json:"email" bson:"email"`
	Password string             `json:"-" bson:"password"`
	Role     string             `json:"role" bson:"role"` // "admin" hoặc "user"
	GoogleID string             `json:"google_id,omitempty" bson:"google_id,omitempty"`
	Avatar   string             `json:"avatar,omitempty" bson:"avatar,omitempty"`
}
