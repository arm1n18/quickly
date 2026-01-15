package handlers

import (
	"net/http"
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

		folders, err := svc.GetUserFolders(c.Context(), username)
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
