package handlers

import (
	"fmt"
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
	authsvc := service.NewAuthService(psql, redis, ekey, jwtkey, nil)

	router.Get("/search", middleware.OptionalJWTMiddleware(authsvc), func(c *fiber.Ctx) error {
		lastId, err := strconv.Atoi(c.Query("lastId"))
		if err != nil {
			lastId = 0
		}

		query := module.FindMoulesQuery{
			Title:    c.Query("title"),
			Keywords: strings.Split(c.Query("keywords"), ","),
			Limit:    c.Query("limit"),
			LastId:   lastId,
		}

		if resp, err := svc.FindModules(c.Context(), utils.GetUserId(c), query); err != nil {
			return protocol.ReturnErrorJSON(c, err.Status, err.Error)
		} else {
			return c.Status(fiber.StatusOK).JSON(resp)
		}
	})

	router.Get("/keywords", func(c *fiber.Ctx) error {
		resp, err := svc.GetKeywords(c.Context(), c.Query("title"))
		if err != nil {
			return protocol.ReturnErrorJSON(c, err.Status, err.Error)
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{"keywords": resp})
	})

	router.Get("/keywords/:slug", func(c *fiber.Ctx) error {
		resp, err := svc.GetKeywordsBySlug(c.Context(), strings.Split(c.Params("slug"), ","))
		if err != nil {
			return protocol.ReturnErrorJSON(c, err.Status, err.Error)
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{"keywords": resp})
	})

	router.Get("/user/:username", middleware.OptionalJWTMiddleware(authsvc), func(c *fiber.Ctx) error {
		username := c.Params("username")
		name := c.Query("title")
		lastId, err := strconv.Atoi(c.Query("lastId"))
		if err != nil {
			lastId = 0
		}

		if resp, err := svc.ListUserModules(c.Context(), utils.GetUserId(c), username, module.Query{Name: name, LastId: lastId}); err != nil {
			return protocol.ReturnErrorJSON(c, err.Status, err.Error)
		} else {
			return c.Status(fiber.StatusOK).JSON(resp)
		}
	})

	router.Get("/saved", middleware.OptionalJWTMiddleware(authsvc), func(c *fiber.Ctx) error {
		name := c.Query("title")
		lastId, err := strconv.Atoi(c.Query("lastId"))
		if err != nil {
			lastId = 0
		}

		if resp, err := svc.ListUserSavedModules(c.Context(), utils.GetUserId(c), module.Query{Name: name, LastId: lastId}); err != nil {
			return protocol.ReturnErrorJSON(c, err.Status, err.Error)
		} else {
			return c.Status(fiber.StatusOK).JSON(resp)
		}
	})

	router.Get("/:id", middleware.OptionalJWTMiddleware(authsvc), func(c *fiber.Ctx) error {
		id, ok := strconv.Atoi(c.Params("id"))
		if ok != nil {
			return protocol.ReturnErrorJSON(c, http.StatusBadRequest, fmt.Errorf("Can`t parse number"))
		}

		resp, err := svc.GetModuleByID(c.Context(), utils.GetUserId(c), id)
		if err != nil {
			return protocol.ReturnErrorJSON(c, err.Status, err.Error)
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{"module": resp})
	})

	router.Put("/:id", middleware.JWTMiddleware(authsvc, false), func(c *fiber.Ctx) error {
		id, err := strconv.Atoi(c.Params("id"))
		if err != nil {
			return protocol.ReturnErrorJSON(c, http.StatusBadRequest, fmt.Errorf("Can`t parse number"))
		}

		body := model.UpdateModuleRequest{}

		if err := c.BodyParser(&body); err != nil {
			return protocol.ReturnErrorJSON(c, http.StatusBadRequest, protocol.ErrInvalidRequestBody)
		}

		body.ID = id

		if err := svc.UpdateModule(c.Context(), utils.GetUserId(c), body); err != nil {
			return protocol.ReturnErrorJSON(c, err.Status, err.Error)
		}

		return c.SendStatus(fiber.StatusOK)
	})

	router.Patch("/:id", middleware.JWTMiddleware(authsvc, false), func(c *fiber.Ctx) error {
		id, err := strconv.Atoi(c.Params("id"))
		if err != nil {
			return protocol.ReturnErrorJSON(c, http.StatusBadRequest, fmt.Errorf("Can`t parse number"))
		}

		body := model.UpdateModuleCard{}

		if err := c.BodyParser(&body); err != nil {
			return protocol.ReturnErrorJSON(c, http.StatusBadRequest, protocol.ErrInvalidRequestBody)
		}

		body.ID = id

		if err := svc.UpdateModuleCard(c.Context(), utils.GetUserId(c), body); err != nil {
			return protocol.ReturnErrorJSON(c, err.Status, err.Error)
		}

		return c.SendStatus(fiber.StatusOK)
	})

	router.Delete("/:id", middleware.JWTMiddleware(authsvc, false), func(c *fiber.Ctx) error {
		id, err := strconv.Atoi(c.Params("id"))
		if err != nil {
			return protocol.ReturnErrorJSON(c, http.StatusBadRequest, fmt.Errorf("Can`t parse number"))
		}

		if err := svc.DeleteModule(c.Context(), utils.GetUserId(c), id); err != nil {
			return protocol.ReturnErrorJSON(c, err.Status, err.Error)
		}

		return c.SendStatus(fiber.StatusOK)
	})

	router.Post("/", middleware.JWTMiddleware(authsvc, false), func(c *fiber.Ctx) error {
		body := model.CreateModuleRequest{}

		if err := c.BodyParser(&body); err != nil {
			return protocol.ReturnErrorJSON(c, http.StatusBadRequest, protocol.ErrInvalidRequestBody)
		}

		resp, err := svc.CreateModule(c.Context(), utils.GetUserId(c), body)
		if err != nil {
			return protocol.ReturnErrorJSON(c, err.Status, err.Error)
		}

		return c.Status(fiber.StatusOK).JSON(resp)
	})

	router.Post("/:id/save", middleware.JWTMiddleware(authsvc, false), func(c *fiber.Ctx) error {
		id, err := strconv.Atoi(c.Params("id"))
		if err != nil {
			return protocol.ReturnErrorJSON(c, http.StatusBadRequest, fmt.Errorf("Can`t parse number"))
		}

		if err := svc.SaveModule(c.Context(), utils.GetUserId(c), id); err != nil {
			return protocol.ReturnErrorJSON(c, err.Status, err.Error)
		}

		return c.SendStatus(fiber.StatusOK)
	})

	router.Delete("/:id/save", middleware.JWTMiddleware(authsvc, false), func(c *fiber.Ctx) error {
		id, err := strconv.Atoi(c.Params("id"))
		if err != nil {
			return protocol.ReturnErrorJSON(c, http.StatusBadRequest, fmt.Errorf("Can`t parse number"))
		}

		if err := svc.UnsaveModule(c.Context(), utils.GetUserId(c), id); err != nil {
			return protocol.ReturnErrorJSON(c, err.Status, err.Error)
		}

		return c.SendStatus(fiber.StatusOK)
	})

	router.Post("/keywords", func(c *fiber.Ctx) error {
		keywords := []string{}

		if err := c.BodyParser(&keywords); err != nil {
			return protocol.ReturnErrorJSON(c, http.StatusBadRequest, protocol.ErrInvalidRequestBody)
		}

		err := svc.AddKeywords(c.Context(), keywords)
		if err != nil {
			return protocol.ReturnErrorJSON(c, err.Status, err.Error)
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": "OK",
		})
	})
}
