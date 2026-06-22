package handlers

import (
	"web-quiz/internal/middleware"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"
	"web-quiz/internal/repository/session"
	"web-quiz/internal/repository/user"
	"web-quiz/internal/service"
	"web-quiz/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func RegisterUserRoutes(router fiber.Router, psql *pgxpool.Pool, redis *redis.Client, ekey, jwtkey string) {
	/* REPOS */
	userRepo := user.NewUserRepository(psql, redis)
	sessionRepo := session.NewSessionRepository(psql, redis)

	/* SERVICES */
	jwtSvc := service.NewJWTService(ekey, jwtkey)
	userSvc := service.NewUserService(userRepo, sessionRepo, *jwtSvc)

	/* MIDDLEWARES */
	middleware := middleware.NewAuthMiddleware(jwtSvc)

	/* ROUTERS */
	router.Get("/:username", func(c *fiber.Ctx) error {
		profile, err := userSvc.GetProfile(c.Context(), c.Params("username"))
		if err != nil {
			return protocol.ReturnErrorJSON(c, err)
		}

		return c.Status(fiber.StatusOK).JSON(profile)
	})

	router.Patch("/me", middleware.JWTMiddleware(false), func(c *fiber.Ctx) error {
		var body struct {
			Username string `json:"username"`
		}
		if err := c.BodyParser(&body); err != nil {
			return protocol.ReturnErrorJSON(c, protocol.ErrInvalidRequestBody)
		}

		user, ok := utils.GetLocals[*model.AccessToken](c, "user")
		if !ok {
			return c.SendStatus(fiber.StatusUnauthorized)
		}

		token, err := userSvc.UpdateProfile(c.Context(), *user, body.Username)
		if err != nil {
			return protocol.ReturnErrorJSON(c, err)
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"accessToken": token,
		})
	})
}
