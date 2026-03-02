package handlers

import (
	"net/http"
	"web-quiz/internal/mail"
	"web-quiz/internal/middleware"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"
	"web-quiz/internal/service"
	"web-quiz/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func RegisterAuthRoutes(router fiber.Router, psql *pgxpool.Pool, redis *redis.Client, ekey, jwtkey string, mail *mail.SMTPClient) {
	svc := service.NewAuthService(psql, redis, ekey, jwtkey, mail)

	router.Post("/register", func(c *fiber.Ctx) error {
		req := model.AuthRequest{}

		if err := c.BodyParser(&req); err != nil {
			return protocol.ReturnErrorJSON(c, http.StatusBadRequest, protocol.ErrInvalidRequestBody)
		}

		err := svc.Register(c.Context(), req)
		if err != nil {
			return protocol.ReturnErrorJSON(c, err.Status, err.Error)
		}

		return c.SendStatus(fiber.StatusOK)
	})

	router.Post("/login", func(c *fiber.Ctx) error {
		req := model.AuthRequest{}

		if err := c.BodyParser(&req); err != nil {
			return protocol.ReturnErrorJSON(c, http.StatusBadRequest, protocol.ErrInvalidRequestBody)
		}

		err := svc.Login(c.Context(), req)
		if err != nil {
			return protocol.ReturnErrorJSON(c, err.Status, err.Error)
		}

		return c.SendStatus(fiber.StatusOK)
	})

	router.Post("/verify", func(c *fiber.Ctx) error {
		req := model.VerifyCodeRequest{}

		if err := c.BodyParser(&req); err != nil {
			return protocol.ReturnErrorJSON(c, http.StatusBadRequest, protocol.ErrInvalidRequestBody)
		}

		headers := model.UaHeaders{
			UserAgent: c.Get("User-Agent", "unknown"),
			OS:        c.Get("app-os", "unknown"),
			Device:    c.Get("app-device", "unknown"),
			Browser:   c.Get("app-browser", "unknown"),
		}

		success, err := svc.Verify(c.Context(), req, headers)
		if err != nil {
			return protocol.ReturnErrorJSON(c, err.Status, err.Error)
		}

		svc.SetCookie(c, success.RefreshToken)
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"accessToken": success.AccessToken,
		})
	})

	router.Post("/send-code", func(c *fiber.Ctx) error {
		req := model.AuthRequest{}

		if err := c.BodyParser(&req); err != nil {
			return protocol.ReturnErrorJSON(c, http.StatusBadRequest, protocol.ErrInvalidRequestBody)
		}

		err := svc.SendCode(c.Context(), req)
		if err != nil {
			return protocol.ReturnErrorJSON(c, err.Status, err.Error)
		}

		return c.SendStatus(fiber.StatusOK)
	})

	router.Post("/reset", func(c *fiber.Ctx) error {

		var body struct {
			Email string `json:"email"`
		}
		if err := c.BodyParser(&body); err != nil {
			return protocol.ReturnErrorJSON(c, http.StatusBadRequest, protocol.ErrInvalidRequestBody)
		}

		err := svc.Reset(c.Context(), body.Email)
		if err != nil {
			return protocol.ReturnErrorJSON(c, err.Status, err.Error)
		}

		return c.SendStatus(fiber.StatusOK)
	})

	router.Post("/reset/:token", func(c *fiber.Ctx) error {

		var body struct {
			Password string `json:"password"`
		}

		if err := c.BodyParser(&body); err != nil {
			return protocol.ReturnErrorJSON(c, http.StatusBadRequest, protocol.ErrInvalidRequestBody)
		}

		err := svc.ConfirmReset(c.Context(), c.Params("token"), body.Password)
		if err != nil {
			return protocol.ReturnErrorJSON(c, err.Status, err.Error)
		}

		return c.SendStatus(fiber.StatusOK)
	})

	router.Get("/reset/:token", func(c *fiber.Ctx) error {
		err := svc.ValidReset(c.Context(), c.Params("token"))
		if err != nil {
			return protocol.ReturnErrorJSON(c, err.Status, err.Error)
		}

		return c.SendStatus(fiber.StatusOK)
	})

	router.Post("/refresh", middleware.JWTMiddleware(svc, true), func(c *fiber.Ctx) error {
		user, ok := utils.GetLocals[*model.UserAccessToken](c, "user")
		if !ok {
			return c.SendStatus(fiber.StatusUnauthorized)
		}

		success, err := svc.Refresh(
			c.Context(),
			model.Tokens{
				AccessToken:  user.Token,
				RefreshToken: c.Cookies("token"),
			},
		)
		if err != nil {
			return protocol.ReturnErrorJSON(c, err.Status, err.Error)
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"accessToken": success.AccessToken,
		})
	})

	router.Post("/logout", middleware.JWTMiddleware(svc, true), func(c *fiber.Ctx) error {
		user, ok := utils.GetLocals[*model.UserAccessToken](c, "user")
		if !ok {
			return c.SendStatus(fiber.StatusUnauthorized)
		}

		req := model.Tokens{
			AccessToken:  user.Token,
			RefreshToken: c.Cookies("token"),
		}

		err := svc.Logout(c.Context(), req)
		if err != nil {
			return protocol.ReturnErrorJSON(c, err.Status, err.Error)
		}

		svc.RemoveCookie(c, "token")

		return c.SendStatus(fiber.StatusOK)
	})
}
