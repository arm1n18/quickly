package main

import (
	"context"
	"log"
	"web-quiz/internal/routes"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/jackc/pgx/v5/pgxpool"
)

func connectPSQL(db string) *pgxpool.Pool {
	conn, err := pgxpool.New(context.Background(), db)
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
	psqlConn := connectPSQL("postgresql://postgres:1231@localhost/web_quiz")
	defer psqlConn.Close()

	app := fiber.New(fiber.Config{
		Prefork: true,
	})

	app.Use(func(c *fiber.Ctx) error {
		log.Printf("Request: %s %s", c.Method(), c.Path())
		return c.Next()
	})

	app.Use(cors.New((cors.Config{
		AllowOrigins: "http://localhost:4200",
	})))

	initRouter := routes.InitRouter{
		App:  app,
		Psql: psqlConn,
	}

	initRouter.InitRoutes()

	log.Fatal(app.Listen(":3000"))
}
