package handlers

import (
	"net/http"
	"web-quiz/internal/middleware"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"
	"web-quiz/internal/service"
	"web-quiz/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func RegisterUserRoutes(router fiber.Router, psql *pgxpool.Pool, redis *redis.Client, ekey, jwtkey string) {
	svc := service.NewUserService(psql)
	authSvc := service.NewAuthService(psql, redis, ekey, jwtkey, nil)

	router.Get("/:username", func(c *fiber.Ctx) error {
		profile, err := svc.GetUserProfile(c.Context(), c.Params("username"))
		if err != nil {
			return protocol.ReturnErrorJSON(c, err.Status, err.Error)
		}

		return c.Status(fiber.StatusOK).JSON(profile)
	})

	router.Patch("/me", middleware.JWTMiddleware(authSvc, false), func(c *fiber.Ctx) error {
		var body struct {
			Username string `json:"username"`
		}
		if err := c.BodyParser(&body); err != nil {
			return protocol.ReturnErrorJSON(c, http.StatusBadRequest, protocol.ErrInvalidRequestBody)
		}

		user, ok := utils.GetLocals[*model.UserAccessToken](c, "user")
		if !ok {
			return c.SendStatus(fiber.StatusUnauthorized)
		}

		token, err := svc.UpdateUserInfo(c.Context(), authSvc, *user, body.Username)
		if err != nil {
			return protocol.ReturnErrorJSON(c, err.Status, err.Error)
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"accessToken": token,
		})
	})
}
