package utils

import (
	"crypto/sha256"

	"golang.org/x/crypto/bcrypt"
)

func GetHash(str string) ([]byte, error) {
	sum := sha256.Sum256([]byte(str))
	hash, err := bcrypt.GenerateFromPassword(sum[:], bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	return hash, nil
}

func VerifyHash(password string, hash []byte) bool {
	sum := sha256.Sum256([]byte(password))
	err := bcrypt.CompareHashAndPassword(hash, sum[:])
	return err == nil
}
