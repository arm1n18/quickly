package utils

import (
	"log"
	"regexp"
	"strings"
	"time"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"
)

func ValidateEmail(email string) bool {
	re := regexp.MustCompile(`^[\w.-]+@([\w-]+\.)+[\w-]{2,}$`)
	return re.MatchString(email)
}

func ValidateCredentials(email, password string) *protocol.AppError {
	email = strings.TrimSpace(email)
	password = strings.TrimSpace(password)

	if email == "" {
		return protocol.ErrEmailRequired
	}
	if password == "" {
		return protocol.ErrPasswordRequired
	}

	if !ValidateEmail(email) {
		return protocol.ErrInvalidEmail
	}

	if len(password) < 6 {
		return protocol.ErrPasswordTooShort
	}
	if len(password) > 50 {
		return protocol.ErrPasswordTooLong
	}

	return nil
}

func ValidateCode(code model.VerificationCode, req model.VerifyCodeRequest) *protocol.AppError {
	now := time.Now()

	if now.Before(code.BanUntil) {
		return protocol.ErrTooManyAttempts
	}

	if code.Purpose != req.Purpose {
		return protocol.ErrCodeMismatch
	}

	log.Printf("Exp: %v, Now: %v\n", code.Exp, now)
	if code.Exp.Before(now) {
		return protocol.ErrCodeExpired
	}

	return nil
}
