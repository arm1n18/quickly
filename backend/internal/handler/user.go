package handlers

import (
	"net/http"
	"strconv"
	"web-quiz/internal/middleware"
	"web-quiz/internal/model"
	"web-quiz/internal/repository/user"
	"web-quiz/internal/service"
	"web-quiz/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func RegisterUserRoutes(router fiber.Router, psql *pgxpool.Pool, redis *redis.Client, ekey, jwtkey string) {
	svc := service.NewUserService(psql)
	authsvc := service.NewAuthService(psql, redis, ekey, jwtkey)

	router.Get("/:username", func(c *fiber.Ctx) error {
		profile, err := svc.GetUserProfile(c.Context(), c.Params("username"))
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Помилка запиту до бази даних",
			})
		}

		return c.Status(fiber.StatusOK).JSON(profile)
	})

	router.Get("/:username/folders", middleware.OptionalJWTMiddleware(authsvc), func(c *fiber.Ctx) error {
		lastId, err := strconv.Atoi(c.Query("lastId"))
		if err != nil {
			lastId = 0
		}

		folders, err := svc.ListUserFolders(
			c.Context(),
			utils.GetUserId(c),
			c.Params("username"),
			user.Query{
				Name:   c.Query("name"),
				LastId: lastId,
			},
		)

		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Помилка запиту до бази даних",
			})
		}

		return c.Status(fiber.StatusOK).JSON(folders)
	})

	router.Get("/:username/folder/:slug", middleware.OptionalJWTMiddleware(authsvc), func(c *fiber.Ctx) error {
		user, ok := utils.GetLocals[*model.UserAccessToken](c, "user")
		if !ok {
			return c.SendStatus(fiber.StatusUnauthorized)
		}

		folder, err := svc.GetUserFolder(
			c.Context(),
			user.SUB,
			c.Params("username"),
			c.Params("slug"),
		)

		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Помилка запиту до бази даних",
			})
		}

		return c.Status(fiber.StatusOK).JSON(folder)
	})
}
