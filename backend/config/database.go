package config

import (
    "context"
    "fmt"
    "log"
    "os"
    "time"

    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/options"
)

var DB *mongo.Database

func ConnectDB() {
    mongoURI := os.Getenv("MONGO_URI")
    if mongoURI == "" {
        mongoURI = "mongodb://localhost:27017"
    }

    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
    if err != nil {
        log.Fatal("❌ Không kết nối được MongoDB:", err)
    }

    err = client.Ping(ctx, nil)
    if err != nil {
        log.Fatal("❌ MongoDB không phản hồi:", err)
    }

    DB = client.Database("ecommerce")
    fmt.Println("✅ Kết nối MongoDB thành công!")
}

