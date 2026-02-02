package main

import (
	"context"
	"fmt"
	"log"
	"web-quiz/config"
	routes "web-quiz/internal/route"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func connectRedis(ctx context.Context, host, port, password string) *redis.Client {
	rdb := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", host, port),
		Password: password,
		DB:       0,
	})

	_, err := rdb.Ping(ctx).Result()
	if err != nil {
		log.Fatalf("Failed to ping Redis: %v", err)
	}

	log.Println("Successfully connected to Redis")

	return rdb
}

func connectPSQL(ctx context.Context, url string) *pgxpool.Pool {
	conn, err := pgxpool.New(ctx, url)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}

	err = conn.Ping(context.Background())
	if err != nil {
		log.Fatalf("failed to ping database: %v", err)
	}

	return conn
}

func main() {
	ctx := context.Background()
	config := config.LoadMainConfig()

	psqlConn := connectPSQL(ctx, config.PSQL)
	defer psqlConn.Close()

	redisConn := connectRedis(ctx, config.RedisHost, config.RedisPort, config.RedisPassword)
	defer redisConn.Close()

	app := fiber.New(fiber.Config{
		Prefork: true,
	})

	app.Use(func(c *fiber.Ctx) error {
		log.Printf("Request: %s %s", c.Method(), c.Path())
		return c.Next()
	})

	app.Use(cors.New((cors.Config{
		AllowOrigins:     "http://" + config.Host + ":4200",
		AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, app-os, app-device, app-browser",
		ExposeHeaders:    "Content-Length",
		AllowCredentials: true,
	})))

	initRouter := routes.InitRouter{
		App:    app,
		Psql:   psqlConn,
		Redis:  redisConn,
		EKEY:   config.EKEY,
		JWTKEY: config.JWTKEY,
	}

	initRouter.InitRoutes()

	log.Fatal(app.Listen(config.Host + ":" + config.Port))
}
