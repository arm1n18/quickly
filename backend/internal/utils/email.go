package utils

import (
	"regexp"
	"strings"
)

func ValidateEmail(email string) bool {
	re := regexp.MustCompile(`^[\w.-]+@([\w-]+\.)+[\w-]{2,}$`)
	return re.MatchString(email)
}

func NameFromEmail(email string) string {
	parts := strings.Split(email, "@")
	if len(parts) == 0 {
		return ""
	}

	return strings.ToLower(parts[0])
}
