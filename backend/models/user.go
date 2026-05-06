package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID                primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Username          string             `json:"username" bson:"username"`
	Email             string             `json:"email" bson:"email"`
	Password          string             `json:"-" bson:"password"`
	Role              string             `json:"role" bson:"role"` // "user" | "manager" | "super_admin"
	MaxSuperProfiles  int                `json:"max_super_profiles" bson:"max_super_profiles"` // Quota
	GoogleID          string             `json:"google_id,omitempty" bson:"google_id,omitempty"`
	Avatar            string             `json:"avatar,omitempty" bson:"avatar,omitempty"`
	CreatedAt         time.Time          `json:"created_at" bson:"created_at"`
}
