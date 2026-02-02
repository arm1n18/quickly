package handlers

import (
	"net/http"
	"strconv"
	"web-quiz/internal/middleware"
	"web-quiz/internal/model"
	"web-quiz/internal/repository/folder"
	"web-quiz/internal/service"
	"web-quiz/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func RegisterFolderRoutes(router fiber.Router, psql *pgxpool.Pool, redis *redis.Client, ekey, jwtkey string) {
	svc := service.NewFolderService(psql)
	authsvc := service.NewAuthService(psql, redis, ekey, jwtkey)

	router.Get("/", middleware.OptionalJWTMiddleware(authsvc), func(c *fiber.Ctx) error {
		lastId, err := strconv.Atoi(c.Query("lastId"))
		if err != nil {
			lastId = 0
		}

		folders, err := svc.ListUserFolders(
			c.Context(),
			utils.GetUserId(c),
			c.Params("username"),
			folder.Query{
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

	router.Get("/:slug", middleware.OptionalJWTMiddleware(authsvc), func(c *fiber.Ctx) error {
		user, ok := utils.GetLocals[*model.UserAccessToken](c, "user")
		if !ok {
			return c.SendStatus(fiber.StatusUnauthorized)
		}

		folder, err := svc.GetFolder(
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

	router.Post("/", middleware.JWTMiddleware(authsvc, false), func(c *fiber.Ctx) error {
		user, ok := utils.GetLocals[*model.UserAccessToken](c, "user")
		if !ok {
			return c.SendStatus(fiber.StatusUnauthorized)
		}

		var body struct {
			Title string `json:"title"`
		}
		if err := c.BodyParser(&body); err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		resp, err := svc.CreateFolder(
			c.Context(),
			user.SUB,
			body.Title,
		)

		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": err,
			})
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"slug": resp,
		})
	})

	router.Patch("/:slug", middleware.JWTMiddleware(authsvc, false), func(c *fiber.Ctx) error {
		user, ok := utils.GetLocals[*model.UserAccessToken](c, "user")
		if !ok {
			return c.SendStatus(fiber.StatusUnauthorized)
		}

		var body struct {
			Title string `json:"title"`
		}
		if err := c.BodyParser(&body); err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		resp, err := svc.UpdateFolder(
			c.Context(),
			user.SUB,
			c.Params("slug"),
			body.Title,
		)

		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"slug": resp,
		})
	})

	router.Delete("/:slug", middleware.JWTMiddleware(authsvc, false), func(c *fiber.Ctx) error {
		user, ok := utils.GetLocals[*model.UserAccessToken](c, "user")
		if !ok {
			return c.SendStatus(fiber.StatusUnauthorized)
		}

		err := svc.DeleteFolder(
			c.Context(),
			user.SUB,
			c.Params("username"),
			c.Params("slug"),
		)

		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": err,
			})
		}

		return c.SendStatus(fiber.StatusOK)
	})

	router.Delete("/:slug/module/:id", middleware.JWTMiddleware(authsvc, false), func(c *fiber.Ctx) error {
		user, ok := utils.GetLocals[*model.UserAccessToken](c, "user")
		if !ok {
			return c.SendStatus(fiber.StatusUnauthorized)
		}

		id, err := strconv.Atoi(c.Params("id"))
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{
				"error": "Can`t parse id",
			})
		}

		err = svc.DeleteModuleFromFolder(
			c.Context(),
			user.SUB,
			id,
			c.Params("slug"),
		)

		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": err,
			})
		}

		return c.SendStatus(fiber.StatusOK)
	})
}
