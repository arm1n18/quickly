package handlers

import (
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
	/* REPOS */
	moduleRepo := module.NewModuleRepository(psql)

	/* SERVICES */
	moduleSvc := service.NewModuleService(moduleRepo)
	jwtSvc := service.NewJWTService(ekey, jwtkey)

	/* MIDDLEWARES */
	middleware := middleware.NewAuthMiddleware(jwtSvc)

	/* ROUTERS */
	router.Get("/search", middleware.OptionalJWTMiddleware(), func(c *fiber.Ctx) error {
		lastId, err := strconv.Atoi(c.Query("lastId"))
		if err != nil {
			lastId = 0
		}

		query := module.FindMoulesQuery{
			Title:    c.Query("title"),
			Keywords: strings.Split(c.Query("keywords"), ","),
			Limit:    c.Query("limit"),
			LastID:   lastId,
		}

		if resp, err := moduleSvc.SearchModules(c.Context(), utils.GetUserId(c), query); err != nil {
			return protocol.ReturnErrorJSON(c, err)
		} else {
			return c.Status(fiber.StatusOK).JSON(resp)
		}
	})

	router.Get("/keywords", func(c *fiber.Ctx) error {
		resp, err := moduleSvc.SearchKeywords(c.Context(), c.Query("title"))
		if err != nil {
			return protocol.ReturnErrorJSON(c, err)
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{"keywords": resp})
	})

	router.Get("/keywords/:slug", func(c *fiber.Ctx) error {
		resp, err := moduleSvc.GetKeywordsBySlug(c.Context(), strings.Split(c.Params("slug"), ","))
		if err != nil {
			return protocol.ReturnErrorJSON(c, err)
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{"keywords": resp})
	})

	router.Get("/user/:username", middleware.OptionalJWTMiddleware(), func(c *fiber.Ctx) error {
		username := c.Params("username")
		name := c.Query("title")
		lastId, err := strconv.Atoi(c.Query("lastId"))
		if err != nil {
			lastId = 0
		}

		if resp, err := moduleSvc.GetUserModules(c.Context(), utils.GetUserId(c), username, module.Query{Name: name, LastID: lastId}); err != nil {
			return protocol.ReturnErrorJSON(c, err)
		} else {
			return c.Status(fiber.StatusOK).JSON(resp)
		}
	})

	router.Get("/saved", middleware.OptionalJWTMiddleware(), func(c *fiber.Ctx) error {
		name := c.Query("title")
		lastId, err := strconv.Atoi(c.Query("lastId"))
		if err != nil {
			lastId = 0
		}

		if resp, err := moduleSvc.GetUserSavedModules(c.Context(), utils.GetUserId(c), module.Query{Name: name, LastID: lastId}); err != nil {
			return protocol.ReturnErrorJSON(c, err)
		} else {
			return c.Status(fiber.StatusOK).JSON(resp)
		}
	})

	router.Get("/:id", middleware.OptionalJWTMiddleware(), func(c *fiber.Ctx) error {
		id, ok := strconv.Atoi(c.Params("id"))
		if ok != nil {
			return protocol.ReturnErrorJSON(c, protocol.ErrBadRequest)
		}

		resp, err := moduleSvc.GetByID(c.Context(), utils.GetUserId(c), id)
		if err != nil {
			return protocol.ReturnErrorJSON(c, err)
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{"module": resp})
	})

	router.Put("/:id", middleware.JWTMiddleware(false), func(c *fiber.Ctx) error {
		id, err := strconv.Atoi(c.Params("id"))
		if err != nil {
			return protocol.ReturnErrorJSON(c, protocol.ErrBadRequest)
		}

		body := model.UpdateModuleRequest{}

		if err := c.BodyParser(&body); err != nil {
			return protocol.ReturnErrorJSON(c, protocol.ErrInvalidRequestBody)
		}

		body.ID = id

		if err := moduleSvc.UpdateModule(c.Context(), utils.GetUserId(c), body); err != nil {
			return protocol.ReturnErrorJSON(c, err)
		}

		return c.SendStatus(fiber.StatusOK)
	})

	router.Patch("/:id", middleware.JWTMiddleware(false), func(c *fiber.Ctx) error {
		id, err := strconv.Atoi(c.Params("id"))
		if err != nil {
			return protocol.ReturnErrorJSON(c, protocol.ErrBadRequest)
		}

		body := model.UpdateModuleCard{}

		if err := c.BodyParser(&body); err != nil {
			return protocol.ReturnErrorJSON(c, protocol.ErrInvalidRequestBody)
		}

		body.ID = id

		if err := moduleSvc.UpdateCard(c.Context(), utils.GetUserId(c), body); err != nil {
			return protocol.ReturnErrorJSON(c, err)
		}

		return c.SendStatus(fiber.StatusOK)
	})

	router.Delete("/:id", middleware.JWTMiddleware(false), func(c *fiber.Ctx) error {
		id, err := strconv.Atoi(c.Params("id"))
		if err != nil {
			return protocol.ReturnErrorJSON(c, protocol.ErrBadRequest)
		}

		if err := moduleSvc.DeleteModule(c.Context(), utils.GetUserId(c), id); err != nil {
			return protocol.ReturnErrorJSON(c, err)
		}

		return c.SendStatus(fiber.StatusOK)
	})

	router.Post("/", middleware.JWTMiddleware(false), func(c *fiber.Ctx) error {
		body := model.CreateModuleRequest{}

		if err := c.BodyParser(&body); err != nil {
			return protocol.ReturnErrorJSON(c, protocol.ErrInvalidRequestBody)
		}

		resp, err := moduleSvc.CreateModule(c.Context(), utils.GetUserId(c), body)
		if err != nil {
			return protocol.ReturnErrorJSON(c, err)
		}

		return c.Status(fiber.StatusOK).JSON(resp)
	})

	router.Post("/:id/save", middleware.JWTMiddleware(false), func(c *fiber.Ctx) error {
		id, err := strconv.Atoi(c.Params("id"))
		if err != nil {
			return protocol.ReturnErrorJSON(c, protocol.ErrBadRequest)
		}

		if err := moduleSvc.SaveModule(c.Context(), utils.GetUserId(c), id); err != nil {
			return protocol.ReturnErrorJSON(c, err)
		}

		return c.SendStatus(fiber.StatusOK)
	})

	router.Delete("/:id/save", middleware.JWTMiddleware(false), func(c *fiber.Ctx) error {
		id, err := strconv.Atoi(c.Params("id"))
		if err != nil {
			return protocol.ReturnErrorJSON(c, protocol.ErrBadRequest)
		}

		if err := moduleSvc.UnsaveModule(c.Context(), utils.GetUserId(c), id); err != nil {
			return protocol.ReturnErrorJSON(c, err)
		}

		return c.SendStatus(fiber.StatusOK)
	})

	router.Post("/keywords", func(c *fiber.Ctx) error {
		keywords := []string{}

		if err := c.BodyParser(&keywords); err != nil {
			return protocol.ReturnErrorJSON(c, protocol.ErrInvalidRequestBody)
		}

		err := moduleSvc.AddKeywords(c.Context(), keywords)
		if err != nil {
			return protocol.ReturnErrorJSON(c, err)
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": "OK",
		})
	})
}
