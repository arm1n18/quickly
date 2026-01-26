package utils

import (
	"errors"
	"math"
	"math/rand"
	"strings"
	"time"
)

func GenerateCode(length int) int {
	if length <= 0 {
		return 0
	}

	min := int(math.Pow10(length - 1))
	max := int(math.Pow10(length)) - 1

	source := rand.NewSource(time.Now().UnixNano())
	r := rand.New(source)

	return r.Intn(max-min+1) + min
}

func ValidateCredentials(email, password string) error {
	email = strings.TrimSpace(email)
	password = strings.TrimSpace(password)

	if email == "" {
		return errors.New("Email is required")
	}
	if password == "" {
		return errors.New("Password is required")
	}

	if !ValidateEmail(email) {
		return errors.New("Invalid email")
	}

	if len(password) < 6 {
		return errors.New("Password too short")
	}
	if len(password) > 50 {
		return errors.New("Password too long")
	}

	return nil
}
