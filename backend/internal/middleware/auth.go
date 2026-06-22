package middleware

import (
	"strings"
	"web-quiz/internal/service"
	"web-quiz/internal/utils"

	"github.com/gofiber/fiber/v2"
)

type AuthMiddleware struct {
	jwtService *service.JWTService
}

func NewAuthMiddleware(
	jwtService *service.JWTService,
) *AuthMiddleware {
	return &AuthMiddleware{
		jwtService: jwtService,
	}
}

func (a *AuthMiddleware) JWTMiddleware(allowExpired bool) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			utils.RemoveCookie(c, "token")
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "missing authorization header",
			})
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			utils.RemoveCookie(c, "token")
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "invalid authorization header",
			})
		}

		token, err := a.jwtService.ParseAccessToken(parts[1])
		if err != nil {
			utils.RemoveCookie(c, "token")
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"message": err.Code,
			})
		}

		if !allowExpired {
			if token.Expired {
				utils.RemoveCookie(c, "token")
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
					"error": "session expired",
				})
			}
		}

		c.Locals("user", token)

		return c.Next()
	}
}

func (a *AuthMiddleware) OptionalJWTMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Next()
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			utils.RemoveCookie(c, "token")
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "invalid authorization header",
			})
		}

		token, err := a.jwtService.ParseAccessToken(parts[1])
		if err != nil {
			utils.RemoveCookie(c, "token")
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"message": err.Code,
			})
		}

		if token.Expired {
			utils.RemoveCookie(c, "token")
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "session expired",
			})
		}

		c.Locals("user", token)

		return c.Next()
	}
}
