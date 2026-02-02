package handlers

import (
	"net/http"
	"web-quiz/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func RegisterUserRoutes(router fiber.Router, psql *pgxpool.Pool, redis *redis.Client, ekey, jwtkey string) {
	svc := service.NewUserService(psql)

	router.Get("/:username", func(c *fiber.Ctx) error {
		profile, err := svc.GetUserProfile(c.Context(), c.Params("username"))
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Помилка запиту до бази даних",
			})
		}

		return c.Status(fiber.StatusOK).JSON(profile)
	})
}
