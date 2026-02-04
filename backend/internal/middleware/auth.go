package middleware

import (
	"strings"
	"web-quiz/internal/service"

	"github.com/gofiber/fiber/v2"
)

func JWTMiddleware(authService *service.AuthService, allowExpired bool) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			authService.RemoveCookie(c, "token")
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "missing authorization header",
			})
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			authService.RemoveCookie(c, "token")
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "invalid authorization header",
			})
		}

		token, err := authService.ParseUserAccessToken(parts[1])
		if err != nil {
			authService.RemoveCookie(c, "token")
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		if !allowExpired {
			if token.Expired {
				authService.RemoveCookie(c, "token")
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
					"error": "session expired",
				})
			}
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
			authService.RemoveCookie(c, "token")
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "invalid authorization header",
			})
		}

		token, err := authService.ParseUserAccessToken(parts[1])
		if err != nil {
			authService.RemoveCookie(c, "token")
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		if token.Expired {
			authService.RemoveCookie(c, "token")
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "session expired",
			})
		}

		c.Locals("user", token)

		return c.Next()
	}
}
