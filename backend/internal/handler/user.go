package handlers

import (
	"net/http"
	"strconv"
	"web-quiz/internal/repository/user"
	"web-quiz/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

func RegisterUserRoutes(router fiber.Router, psql *pgxpool.Pool) {
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

	router.Get("/:username/folders", func(c *fiber.Ctx) error {
		lastId, err := strconv.Atoi(c.Query("lastId"))
		if err != nil {
			lastId = 0
		}

		folders, err := svc.ListUserFolders(
			c.Context(),
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

	router.Get("/:username/folder/:slug", func(c *fiber.Ctx) error {
		folder, err := svc.GetUserFolder(
			c.Context(),
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
