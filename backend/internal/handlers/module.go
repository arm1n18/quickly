package handlers

import (
	"net/http"
	"strconv"
	"strings"
	"web-quiz/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

func RegisterModuleRoutes(router fiber.Router, psql *pgxpool.Pool) {
	svc := services.NewModuleService(psql)

	router.Post("/keywords", func(c *fiber.Ctx) error {
		keywords := []string{}

		if err := c.BodyParser(&keywords); err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		err := svc.AddKeywords(c.Context(), keywords)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Помилка запиту до бази даних",
			})
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": "OK",
		})
	})

	router.Get("/search", func(c *fiber.Ctx) error {
		name := c.Query("name")
		lastId, err := strconv.Atoi(c.Query("lastId"))
		if err != nil {
			lastId = 0
		}

		modules, err := svc.GetModulesByName(c.Context(), name, lastId)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Помилка запиту до бази даних",
			})
		}

		return c.Status(fiber.StatusOK).JSON(modules)
	})

	router.Get("/search-by-keywords", func(c *fiber.Ctx) error {
		keywords := strings.Split(c.Query("keywords"), ",")

		modules, err := svc.GetModulesByKeywords(c.Context(), keywords)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Помилка запиту до бази даних",
			})
		}

		return c.Status(fiber.StatusOK).JSON(modules)
	})

	router.Get("/user/:username", func(c *fiber.Ctx) error {
		username := c.Params("username")
		lastId, err := strconv.Atoi(c.Query("lastId"))
		if err != nil {
			lastId = 0
		}

		modules, err := svc.GetUserModules(c.Context(), username, lastId)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Помилка запиту до бази даних",
			})
		}

		return c.Status(fiber.StatusOK).JSON(modules)
	})

	router.Get("/:id", func(c *fiber.Ctx) error {
		id, err := strconv.Atoi(c.Params("id"))
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{
				"error": "Can`t parse id",
			})
		}

		module, err := svc.GetModule(c.Context(), id)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Помилка запиту до бази даних",
			})
		}

		return c.Status(fiber.StatusOK).JSON(module)
	})
}
