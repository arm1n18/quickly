package handlers

import (
	"log"
	"net/http"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"
	"web-quiz/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func RegisterAuthRoutes(router fiber.Router, psql *pgxpool.Pool, redis *redis.Client, ekey, jwtkey string) {
	svc := service.NewAuthService(psql, redis, ekey, jwtkey)

	router.Post("/register", func(c *fiber.Ctx) error {
		req := model.AuthRequest{}

		if err := c.BodyParser(&req); err != nil {
			log.Println(err)

			return protocol.ReturnErrorJSON(c, http.StatusBadRequest, protocol.ErrInvalidRequestBody)
		}

		success, err := svc.Register(c.Context(), req)
		if err != nil {

			return protocol.ReturnErrorJSON(c, err.Status, err.Error)
		}

		return c.Status(fiber.StatusOK).JSON(success)
	})

	router.Post("/login", func(c *fiber.Ctx) error {
		req := model.AuthRequest{}

		if err := c.BodyParser(&req); err != nil {
			log.Println(err)

			return protocol.ReturnErrorJSON(c, http.StatusBadRequest, protocol.ErrInvalidRequestBody)
		}

		success, err := svc.Login(c.Context(), req)
		if err != nil {
			return protocol.ReturnErrorJSON(c, err.Status, err.Error)
		}

		return c.Status(fiber.StatusOK).JSON(success)
	})

	router.Post("/verify", func(c *fiber.Ctx) error {
		req := model.VerifyCodeRequest{}

		if err := c.BodyParser(&req); err != nil {
			return protocol.ReturnErrorJSON(c, http.StatusBadRequest, protocol.ErrInvalidRequestBody)
		}

		headers := model.UaHeaders{
			UserAgent: c.Get("User-Agent", "unknown"),
			OS:        c.Get("X-OS", "unknown"),
			Device:    c.Get("X-Device", "unknown"),
			Browser:   c.Get("X-Browser", "unknown"),
		}

		success, err := svc.Verify(c.Context(), req, headers)
		if err != nil {
			return protocol.ReturnErrorJSON(c, err.Status, err.Error)
		}

		return c.Status(fiber.StatusOK).JSON(success)
	})

	router.Post("/send-code", func(c *fiber.Ctx) error {
		req := model.AuthRequest{}

		if err := c.BodyParser(&req); err != nil {
			return protocol.ReturnErrorJSON(c, http.StatusBadRequest, protocol.ErrInvalidRequestBody)
		}

		success, err := svc.SendCode(c.Context(), req)
		if err != nil {
			return protocol.ReturnErrorJSON(c, err.Status, err.Error)
		}

		return c.Status(fiber.StatusOK).JSON(success)
	})

	router.Post("/refresh", func(c *fiber.Ctx) error {
		req := model.Tokens{}

		if err := c.BodyParser(&req); err != nil {
			return protocol.ReturnErrorJSON(c, http.StatusBadRequest, protocol.ErrInvalidRequestBody)
		}

		success, err := svc.Refresh(c.Context(), req)
		if err != nil {
			return protocol.ReturnErrorJSON(c, err.Status, err.Error)
		}

		return c.Status(fiber.StatusOK).JSON(success)
	})

	router.Post("/logout", func(c *fiber.Ctx) error {
		req := model.Tokens{}

		if err := c.BodyParser(&req); err != nil {
			return protocol.ReturnErrorJSON(c, http.StatusBadRequest, protocol.ErrInvalidRequestBody)
		}

		success, err := svc.Logout(c.Context(), req)
		if err != nil {
			return protocol.ReturnErrorJSON(c, err.Status, err.Error)
		}

		return c.Status(fiber.StatusOK).JSON(success)
	})
}
