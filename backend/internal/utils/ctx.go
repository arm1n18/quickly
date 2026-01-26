package utils

import "github.com/gofiber/fiber/v2"

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
