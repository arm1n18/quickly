package protocol

import (
	"errors"
	"web-quiz/internal/model"

	"github.com/gofiber/fiber/v2"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInvalidPurpose     = errors.New("invalid purpose")
	ErrCodeNotFound       = errors.New("verification code not found")
	ErrNotFound           = errors.New(" found")
	ErrCodeExpired        = errors.New("verification code expired")
	ErrCodeMismatch       = errors.New("verification code mismatch")
	ErrTooManyAttempts    = errors.New("too many attempts")
	ErrTooManyRequests    = errors.New("too many requests")
	ErrUserAlreadyExists  = errors.New("user already exists")
	ErrUserNotFound       = errors.New("user not found")
	ErrSessionInvalid     = errors.New("invalid session")
	ErrRefreshExpired     = errors.New("refresh token expired")
	ErrCannotGenerateName = errors.New("cannot generate unique username")
	ErrInternal           = errors.New("internal error")
	ErrInvalidRequestBody = errors.New("invalid request body")
	ErrBadRequest         = errors.New("bad request")
)

func ReturnError(status int, err error) *model.ErrorResponse {
	return &model.ErrorResponse{
		Status: status,
		Error:  err,
	}
}

func ReturnErrorJSON(c *fiber.Ctx, status int, err error) error {
	return c.Status(status).JSON(fiber.Map{
		"error": err.Error(),
	})
}
