package protocol

import (
	"errors"
	"net/http"
	"web-quiz/internal/model"

	"github.com/gofiber/fiber/v2"
)

type AppError struct {
	Code   string `json:"code"`
	Status int    `json:"-"`
	Err    error  `json:"-"`
}

/* --- USER ERRORS --- */
var (
	ErrUsernameRequired      = New("username required", http.StatusBadRequest)
	ErrInvalidUsername       = New("invalid username", http.StatusBadRequest)
	ErrUsernameTaken         = New("username taken", http.StatusConflict)
	ErrInvalidUsernameLength = New("invalid username length", http.StatusBadRequest)

	ErrUserNotFound      = New("user not found", http.StatusNotFound)
	ErrUserAlreadyExists = New("user already exists", http.StatusConflict)
)

/* --- CARD ERRORS --- */
var (
	ErrInvalidCardTitle       = New("invalid card title", http.StatusBadRequest)
	ErrInvalidCardDescription = New("invalid card description", http.StatusBadRequest)
	ErrInvalidCardsLength     = New("invalid cards length", http.StatusBadRequest)
	ErrCardNotFound           = New("card not found", http.StatusNotFound)
)

/* --- MODULE ERRORS --- */
var (
	ErrInvalidModuleTitle       = New("invalid module title", http.StatusBadRequest)
	ErrInvalidModuleDescription = New("invalid module description", http.StatusBadRequest)
	ErrModuleNotFound           = New("module not found", http.StatusNotFound)
)

/* --- FOLDER ERRORS --- */
var (
	ErrInvalidFolderTitle  = New("invalid folder title", http.StatusBadRequest)
	ErrFolderNotFound      = New("folder not found", http.StatusNotFound)
	ErrFolderAlreadyExists = New("folder already exists", http.StatusConflict)
)

/* --- AUTH ERRORS --- */
var (
	ErrEmailRequired    = New("email required", http.StatusBadRequest)
	ErrPasswordRequired = New("password required", http.StatusBadRequest)
	ErrInvalidEmail     = New("invalid email", http.StatusBadRequest)
	ErrPasswordTooShort = New("password too short", http.StatusBadRequest)
	ErrPasswordTooLong  = New("password too long", http.StatusBadRequest)

	ErrInvalidToken       = New("invalid token", http.StatusUnauthorized)
	ErrInvalidTokenClaims = New("invalid token claims", http.StatusUnauthorized)
	ErrnIvalidSession     = New("invalid session", http.StatusUnauthorized)
	ErrInvalidCredentials = New("invalid credentials", http.StatusUnauthorized)
)

/* --- CODE ERRORS --- */
var (
	ErrCodeNotFound = New("code not found", http.StatusNotFound)
	ErrCodeExpired  = New("code expired", http.StatusGone)
	ErrCodeMismatch = New("code mismatch", http.StatusBadRequest)
)

/* --- COMMON ERRORS --- */
var (
	ErrInternal           = New("internal error", http.StatusInternalServerError)
	ErrBadRequest         = New("bad request", http.StatusBadRequest)
	ErrInvalidRequestBody = New("invalid request body", http.StatusBadRequest)
	ErrForbidden          = New("forbidden", http.StatusForbidden)
	ErrInvalidPurpose     = New("invalid purpose", http.StatusBadRequest)

	ErrTooManyAttempts = New("too many attempts", http.StatusTooManyRequests)
	ErrTooManyRequests = New("too many requests", http.StatusTooManyRequests)
)

var (
	ErrRefreshExpired     = errors.New("refresh token expired")
	ErrCannotGenerateName = errors.New("cannot generate unique username")

	ErrInvalidLength = errors.New("invalid length")
)

func New(code string, status int) *AppError {
	return &AppError{
		Code:   code,
		Status: status,
	}
}

func (e *AppError) Wrap(err error) *AppError {
	e.Err = err
	return e
}

func ReturnError(status int, err error) *model.ErrorResponse {
	return &model.ErrorResponse{
		Status: status,
		Error:  err,
	}
}

func ReturnErrorJSON(c *fiber.Ctx, e *AppError) error {
	return c.Status(e.Status).JSON(fiber.Map{
		"message": e.Code,
	})
}
