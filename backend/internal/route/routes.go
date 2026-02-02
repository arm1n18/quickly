package routes

import (
	handlers "web-quiz/internal/handler"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

type InitRouter struct {
	App    *fiber.App
	Psql   *pgxpool.Pool
	Redis  *redis.Client
	EKEY   string
	JWTKEY string
}

func (i InitRouter) InitRoutes() {
	api := i.App.Group("/api")

	handlers.RegisterModuleRoutes(api.Group("/modules"), i.Psql, i.Redis, i.EKEY, i.JWTKEY)
	handlers.RegisterFolderRoutes(api.Group("/user/:username/folders"), i.Psql, i.Redis, i.EKEY, i.JWTKEY)
	handlers.RegisterFolderRoutes(api.Group("/folders"), i.Psql, i.Redis, i.EKEY, i.JWTKEY)
	handlers.RegisterUserRoutes(api.Group("/users"), i.Psql, i.Redis, i.EKEY, i.JWTKEY)
	handlers.RegisterAuthRoutes(api.Group("/auth"), i.Psql, i.Redis, i.EKEY, i.JWTKEY)
}
