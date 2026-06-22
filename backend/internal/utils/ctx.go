package utils

import (
	"log"
	"time"
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
	user, ok := GetLocals[*model.AccessToken](c, "user")
	if !ok || user == nil {
		return 0
	}

	return user.SUB
}

func SetCookie(c *fiber.Ctx, token string) {
	cookie := new(fiber.Cookie)
	cookie.Name = "token"
	cookie.Value = token
	cookie.Expires = time.Now().Add(time.Hour * 24 * 30)
	cookie.MaxAge = 60 * 60 * 24 * 30
	cookie.Path = "/"
	cookie.HTTPOnly = true
	cookie.Secure = false
	c.Cookie(cookie)
}

func RemoveCookie(c *fiber.Ctx, key string) {
	log.Println("removed")
	c.Cookie(&fiber.Cookie{
		Name:    key,
		Value:   "",
		Expires: time.Now().Add(-time.Hour),
	})
}
