package middleware

import (
	"strings"
	"web-quiz/internal/service"

	"github.com/gofiber/fiber/v2"
)

func JWTMiddleware(authService *service.AuthService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "missing authorization header",
			})
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "invalid authorization header",
			})
		}

		token, err := authService.ParseUserAccessToken(parts[1])
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		if token.Expired {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "session expired",
			})
		}

		c.Locals("user", token)

		return c.Next()
	}
}

func OptionalJWTMiddleware(authService *service.AuthService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Next()
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "invalid authorization header",
			})
		}

		token, err := authService.ParseUserAccessToken(parts[1])
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		if token.Expired {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "session expired",
			})
		}

		c.Locals("user", token)

		return c.Next()
	}
}
