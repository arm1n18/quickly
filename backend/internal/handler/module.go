package handlers

import (
	"net/http"
	"strconv"
	"strings"
	"web-quiz/internal/middleware"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"
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
	router.Get("/search", middleware.OptionalJWTMiddleware(authsvc), func(c *fiber.Ctx) error {
		title := c.Query("title")
		lastId, err := strconv.Atoi(c.Query("lastId"))
		if err != nil {
			lastId = 0
		}

		resp, err := svc.FindModulesByTitle(c.Context(), utils.GetUserId(c), title, lastId)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Помилка запиту до бази даних",
			})
		}

		return c.Status(fiber.StatusOK).JSON(resp)
	})

	router.Get("/search-by-keywords", middleware.OptionalJWTMiddleware(authsvc), func(c *fiber.Ctx) error {
		keywords := strings.Split(c.Query("keywords"), ",")

		resp, err := svc.FindModulesByKeywords(c.Context(), utils.GetUserId(c), keywords)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Помилка запиту до бази даних",
			})
		}

		return c.Status(fiber.StatusOK).JSON(resp)
	})

	//change route
	router.Get("/user/:username", middleware.OptionalJWTMiddleware(authsvc), func(c *fiber.Ctx) error {
		username := c.Params("username")
		name := c.Query("name")
		lastId, err := strconv.Atoi(c.Query("lastId"))
		if err != nil {
			lastId = 0
		}

		resp, err := svc.ListUserModules(c.Context(), utils.GetUserId(c), username, module.Query{Name: name, LastId: lastId})
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Помилка запиту до бази даних",
			})
		}

		return c.Status(fiber.StatusOK).JSON(resp)
	})

	//yes
	router.Get("/:id", middleware.OptionalJWTMiddleware(authsvc), func(c *fiber.Ctx) error {
		id, ok := strconv.Atoi(c.Params("id"))
		if ok != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{
				"error": "Can`t parse id",
			})
		}

		resp, err := svc.GetModuleByID(c.Context(), utils.GetUserId(c), id)
		if err != nil {
			return protocol.ReturnErrorJSON(c, err.Status, err.Error)
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{"module": resp})
	})

	//yes
	router.Put("/:id", middleware.JWTMiddleware(authsvc, false), func(c *fiber.Ctx) error {
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

		err = svc.UpdateModule(c.Context(), utils.GetUserId(c), body)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Помилка запиту до бази даних",
			})
		}

		return c.SendStatus(fiber.StatusOK)
	})

	//yes
	router.Patch("/:id", middleware.JWTMiddleware(authsvc, false), func(c *fiber.Ctx) error {
		id, err := strconv.Atoi(c.Params("id"))
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{
				"error": "Can`t parse id",
			})
		}

		body := model.UpdateModuleCard{}

		if err := c.BodyParser(&body); err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		body.ID = id

		err = svc.UpdateModuleCard(c.Context(), utils.GetUserId(c), body)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Помилка запиту до бази даних",
			})
		}

		return c.SendStatus(fiber.StatusOK)
	})

	router.Delete("/:id", middleware.JWTMiddleware(authsvc, false), func(c *fiber.Ctx) error {
		id, err := strconv.Atoi(c.Params("id"))
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{
				"error": "Can`t parse id",
			})
		}

		err = svc.DeleteModule(c.Context(), utils.GetUserId(c), id)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Помилка запиту до бази даних",
			})
		}

		return c.SendStatus(fiber.StatusOK)
	})

	//yes
	router.Post("/", middleware.JWTMiddleware(authsvc, false), func(c *fiber.Ctx) error {
		body := model.CreateModuleRequest{}

		if err := c.BodyParser(&body); err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		resp, err := svc.CreateModule(c.Context(), utils.GetUserId(c), body)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Помилка запиту до бази даних",
			})
		}

		return c.Status(fiber.StatusOK).JSON(resp)
	})

	router.Post("/:id/save", middleware.JWTMiddleware(authsvc, false), func(c *fiber.Ctx) error {
		id, err := strconv.Atoi(c.Params("id"))
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{
				"error": "Can`t parse id",
			})
		}

		err = svc.SaveModule(c.Context(), utils.GetUserId(c), id)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Помилка запиту до бази даних",
			})
		}

		return c.SendStatus(fiber.StatusOK)
	})

	router.Delete("/:id/save", middleware.JWTMiddleware(authsvc, false), func(c *fiber.Ctx) error {
		id, err := strconv.Atoi(c.Params("id"))
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{
				"error": "Can`t parse id",
			})
		}

		err = svc.UnsaveModule(c.Context(), utils.GetUserId(c), id)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Помилка запиту до бази даних",
			})
		}

		return c.SendStatus(fiber.StatusOK)
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
