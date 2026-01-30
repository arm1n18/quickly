package utils

import (
	"web-quiz/internal/model"

	"github.com/gofiber/fiber/v2"
)

func GetLocals[T any](c *fiber.Ctx, key string) (T, bool) {
	v := c.Locals(key)
	var zero T
	if v == nil {
		return zero, false
	}

	val, ok := v.(T)
	if !ok {
		return zero, false
	}

	return val, true
}

func GetUserId(c *fiber.Ctx) int {
	user, ok := GetLocals[*model.UserAccessToken](c, "user")
	if !ok || user == nil {
		return 0
	}

	return user.SUB
}
