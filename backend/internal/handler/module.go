package handlers

import (
	"net/http"
	"strconv"
	"strings"
	"web-quiz/internal/model"
	"web-quiz/internal/repository/module"
	"web-quiz/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

func RegisterModuleRoutes(router fiber.Router, psql *pgxpool.Pool) {
	svc := service.NewModuleService(psql)

	router.Get("/search", func(c *fiber.Ctx) error {
		name := c.Query("name")
		lastId, err := strconv.Atoi(c.Query("lastId"))
		if err != nil {
			lastId = 0
		}

		modules, err := svc.FindModulesByName(c.Context(), name, lastId)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Помилка запиту до бази даних",
			})
		}

		return c.Status(fiber.StatusOK).JSON(modules)
	})

	router.Get("/search-by-keywords", func(c *fiber.Ctx) error {
		keywords := strings.Split(c.Query("keywords"), ",")

		modules, err := svc.FindModulesByKeywords(c.Context(), keywords)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Помилка запиту до бази даних",
			})
		}

		return c.Status(fiber.StatusOK).JSON(modules)
	})

	router.Get("/user/:username", func(c *fiber.Ctx) error {
		username := c.Params("username")
		name := c.Query("name")
		lastId, err := strconv.Atoi(c.Query("lastId"))
		if err != nil {
			lastId = 0
		}

		modules, err := svc.ListUserModules(c.Context(), username, module.Query{Name: name, LastId: lastId})
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

		module, err := svc.GetModuleByID(c.Context(), id)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Помилка запиту до бази даних",
			})
		}

		return c.Status(fiber.StatusOK).JSON(module)
	})

	router.Post("/", func(c *fiber.Ctx) error {
		body := model.CreateModuleRequest{}

		if err := c.BodyParser(&body); err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		_, err := svc.CreateModule(c.Context(), "", body)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Помилка запиту до бази даних",
			})
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": "OK",
		})
	})

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
}
