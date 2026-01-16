package handlers

import (
	"net/http"
	"strconv"
	"web-quiz/internal/repository/user"
	"web-quiz/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

func RegisterUserRoutes(router fiber.Router, psql *pgxpool.Pool) {
	svc := services.NewUserService(psql)

	router.Get("/:username", func(c *fiber.Ctx) error {
		username := c.Params("username")

		profile, err := svc.GetUserProfile(c.Context(), username)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Помилка запиту до бази даних",
			})
		}

		return c.Status(fiber.StatusOK).JSON(profile)
	})

	router.Get("/:username/folders", func(c *fiber.Ctx) error {
		username := c.Params("username")
		name := c.Query("name")
		lastId, err := strconv.Atoi(c.Query("lastId"))
		if err != nil {
			lastId = 0
		}

		folders, err := svc.GetUserFolders(c.Context(), username, user.Query{Name: name, LastId: lastId})
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Помилка запиту до бази даних",
			})
		}

		return c.Status(fiber.StatusOK).JSON(folders)
	})

	router.Get("/:username/folder/:slug", func(c *fiber.Ctx) error {
		username := c.Params("username")
		slug := c.Params("slug")

		folder, err := svc.GetFolder(c.Context(), username, slug)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Помилка запиту до бази даних",
			})
		}

		return c.Status(fiber.StatusOK).JSON(folder)
	})
}
