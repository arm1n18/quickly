package handlers

import (
	"strconv"
	"web-quiz/internal/middleware"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"
	"web-quiz/internal/repository/folder"
	"web-quiz/internal/service"
	"web-quiz/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func RegisterFolderRoutes(router fiber.Router, psql *pgxpool.Pool, redis *redis.Client, ekey, jwtkey string) {
	/* REPOS */
	folderRepo := folder.NewFolderRepository(psql)

	/* SERVICES */
	foderSvc := service.NewFolderService(folderRepo)
	jwtSvc := service.NewJWTService(ekey, jwtkey)

	/* MIDDLEWARES */
	middleware := middleware.NewAuthMiddleware(jwtSvc)

	/* ROUTERS */
	router.Get("/", middleware.OptionalJWTMiddleware(), func(c *fiber.Ctx) error {
		lastId, err := strconv.Atoi(c.Query("lastId"))
		if err != nil {
			lastId = 0
		}

		var folders *model.FoldersSummary
		if resp, err := foderSvc.ListFolders(
			c.Context(),
			utils.GetUserId(c),
			c.Params("username"),
			folder.Query{
				Name:   c.Query("name"),
				LastID: lastId,
			},
		); err != nil {
			return protocol.ReturnErrorJSON(c, err)
		} else {
			folders = resp
		}

		return c.Status(fiber.StatusOK).JSON(folders)
	})

	router.Get("/:slug", middleware.OptionalJWTMiddleware(), func(c *fiber.Ctx) error {
		folder, err := foderSvc.GetFolder(
			c.Context(),
			utils.GetUserId(c),
			c.Params("username"),
			c.Params("slug"),
		)

		if err != nil {
			return protocol.ReturnErrorJSON(c, err)
		}

		return c.Status(fiber.StatusOK).JSON(folder)
	})

	router.Post("/", middleware.JWTMiddleware(false), func(c *fiber.Ctx) error {
		var body struct {
			Title string `json:"title"`
		}
		if err := c.BodyParser(&body); err != nil {
			return protocol.ReturnErrorJSON(c, protocol.ErrInvalidRequestBody)
		}

		resp, err := foderSvc.CreateFolder(
			c.Context(),
			utils.GetUserId(c),
			body.Title,
		)

		if err != nil {
			return protocol.ReturnErrorJSON(c, err)
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"slug": resp,
		})
	})

	router.Patch("/:slug", middleware.JWTMiddleware(false), func(c *fiber.Ctx) error {
		var body struct {
			Title string `json:"title"`
		}
		if err := c.BodyParser(&body); err != nil {
			return protocol.ReturnErrorJSON(c, protocol.ErrInvalidRequestBody)
		}

		resp, err := foderSvc.UpdateFolder(
			c.Context(),
			utils.GetUserId(c),
			c.Params("slug"),
			body.Title,
		)

		if err != nil {
			return protocol.ReturnErrorJSON(c, err)
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"slug": resp,
		})
	})

	router.Delete("/:slug", middleware.JWTMiddleware(false), func(c *fiber.Ctx) error {
		err := foderSvc.DeleteFolder(
			c.Context(),
			utils.GetUserId(c),
			c.Params("username"),
			c.Params("slug"),
		)

		if err != nil {
			return protocol.ReturnErrorJSON(c, err)
		}

		return c.SendStatus(fiber.StatusOK)
	})

	router.Post("/:slug/module", middleware.JWTMiddleware(false), func(c *fiber.Ctx) error {
		var body struct {
			Id int `json:"id"`
		}
		if err := c.BodyParser(&body); err != nil {
			return protocol.ReturnErrorJSON(c, protocol.ErrInvalidRequestBody)
		}

		err := foderSvc.AddModule(
			c.Context(),
			utils.GetUserId(c),
			body.Id,
			c.Params("slug"),
		)

		if err != nil {
			return protocol.ReturnErrorJSON(c, err)
		}

		return c.SendStatus(fiber.StatusOK)
	})

	router.Delete("/:slug/module/:id", middleware.JWTMiddleware(false), func(c *fiber.Ctx) error {
		id, err := strconv.Atoi(c.Params("id"))
		if err != nil {
			return protocol.ReturnErrorJSON(c, protocol.ErrBadRequest)
		}

		if err := foderSvc.RemoveModule(
			c.Context(),
			utils.GetUserId(c),
			id,
			c.Params("slug"),
		); err != nil {
			return protocol.ReturnErrorJSON(c, err)
		}

		return c.SendStatus(fiber.StatusOK)
	})
}
