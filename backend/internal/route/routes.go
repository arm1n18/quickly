package routes

import (
	handlers "web-quiz/internal/handler"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

type InitRouter struct {
	App  *fiber.App
	Psql *pgxpool.Pool
}

func (i InitRouter) InitRoutes() {
	api := i.App.Group("/api")

	handlers.RegisterModuleRoutes(api.Group("/module"), i.Psql)
	handlers.RegisterUserRoutes(api.Group("/user"), i.Psql)
}
