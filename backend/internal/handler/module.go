package handlers

import (
	"net/http"
	"strconv"
	"strings"
	"web-quiz/internal/middleware"
	"web-quiz/internal/model"
	"web-quiz/internal/repository/module"
	"web-quiz/internal/service"
	"web-quiz/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func RegisterModuleRoutes(router fiber.Router, psql *pgxpool.Pool, redis *redis.Client, ekey, jwtkey string) {
	svc := service.NewModuleService(psql)
	authsvc := service.NewAuthService(psql, redis, ekey, jwtkey)

	//yes
	router.Get("/search", func(c *fiber.Ctx) error {
		title := c.Query("title")
		lastId, err := strconv.Atoi(c.Query("lastId"))
		if err != nil {
			lastId = 0
		}

		user, ok := utils.GetLocals[model.UserAccessToken](c, "user")
		if !ok {
			return c.SendStatus(fiber.StatusUnauthorized)
		}

		modules, err := svc.FindModulesByTitle(c.Context(), user.SUB, title, lastId)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Помилка запиту до бази даних",
			})
		}

		return c.Status(fiber.StatusOK).JSON(modules)
	})

	router.Get("/search-by-keywords", func(c *fiber.Ctx) error {
		keywords := strings.Split(c.Query("keywords"), ",")

		user, ok := utils.GetLocals[model.UserAccessToken](c, "user")
		if !ok {
			return c.SendStatus(fiber.StatusUnauthorized)
		}

		modules, err := svc.FindModulesByKeywords(c.Context(), user.SUB, keywords)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Помилка запиту до бази даних",
			})
		}

		return c.Status(fiber.StatusOK).JSON(modules)
	})

	//change route
	router.Get("/user/:username", func(c *fiber.Ctx) error {
		username := c.Params("username")
		name := c.Query("name")
		lastId, err := strconv.Atoi(c.Query("lastId"))
		if err != nil {
			lastId = 0
		}

		user, ok := utils.GetLocals[model.UserAccessToken](c, "user")
		if !ok {
			return c.SendStatus(fiber.StatusUnauthorized)
		}

		modules, err := svc.ListUserModules(c.Context(), user.SUB, username, module.Query{Name: name, LastId: lastId})
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Помилка запиту до бази даних",
			})
		}

		return c.Status(fiber.StatusOK).JSON(modules)
	})

	//yes
	router.Get("/:id", middleware.OptionalJWTMiddleware(authsvc), func(c *fiber.Ctx) error {
		id, err := strconv.Atoi(c.Params("id"))
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{
				"error": "Can`t parse id",
			})
		}

		user, ok := utils.GetLocals[model.UserAccessToken](c, "user")
		if !ok {
			return c.SendStatus(fiber.StatusUnauthorized)
		}

		module, err := svc.GetModuleByID(c.Context(), user.SUB, id)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Помилка запиту до бази даних",
			})
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{"module": module})
	})

	//yes
	router.Patch("/:id", middleware.JWTMiddleware(authsvc), func(c *fiber.Ctx) error {
		id, err := strconv.Atoi(c.Params("id"))
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{
				"error": "Can`t parse id",
			})
		}

		body := model.UpdateModuleRequest{}

		if err := c.BodyParser(&body); err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		body.ID = id

		user, ok := utils.GetLocals[model.UserAccessToken](c, "user")
		if !ok {
			return c.SendStatus(fiber.StatusUnauthorized)
		}

		err = svc.UpdateModule(c.Context(), user.SUB, body)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Помилка запиту до бази даних",
			})
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": "OK",
		})
	})

	//yes
	router.Post("/", middleware.JWTMiddleware(authsvc), func(c *fiber.Ctx) error {
		body := model.CreateModuleRequest{}

		if err := c.BodyParser(&body); err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		user, ok := utils.GetLocals[model.UserAccessToken](c, "user")
		if !ok {
			return c.SendStatus(fiber.StatusUnauthorized)
		}

		id, err := svc.CreateModule(c.Context(), user.SUB, body)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Помилка запиту до бази даних",
			})
		}

		return c.Status(fiber.StatusOK).JSON(id)
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
