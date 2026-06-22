package utils

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"strconv"

	"golang.org/x/crypto/bcrypt"
)

type DecryptedData struct {
	Data  []byte
	Error error
}

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

func EncryptDate(ekey string, data []byte) (string, error) {
	key, err := hex.DecodeString(ekey)
	if err != nil {
		log.Fatalf("Invalid EKEY hex: %v", err)
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		log.Printf("Error encrypting: %v", err)
		return "", err
	}

	nonce := make([]byte, 12)
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		panic(err.Error())
	}

	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		panic(err.Error())
	}

	ciphertext := aesgcm.Seal(nil, nonce, data, nil)

	result := append(nonce, ciphertext...)

	return hex.EncodeToString(result), nil
}

func DecryptData(ekey, encryptedData string) *DecryptedData {
	data, err := hex.DecodeString(encryptedData)
	if err != nil {
		log.Printf("Error decoding: %v", err)
		return nil
	}

	nonce, ciphertext := data[:12], data[12:]

	key, err := hex.DecodeString(ekey)
	if err != nil {
		log.Fatalf("Invalid EKEY hex: %v", err)
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		log.Printf("Error: %v", err)
		return &DecryptedData{
			Error: fmt.Errorf("ivalid data"),
		}
	}

	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		log.Printf("Error: %v", err)
		return &DecryptedData{
			Error: fmt.Errorf("ivalid data"),
		}
	}

	plaintext, err := aesgcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		log.Printf("Error: %v", err)
		return &DecryptedData{
			Error: fmt.Errorf("ivalid data"),
		}
	}

	return &DecryptedData{Data: plaintext}
}

func (d DecryptedData) Int() (int, error) {
	if d.Error != nil {
		return -1, d.Error
	}

	n, err := strconv.Atoi(string(d.Data))
	if err != nil {
		log.Printf("Error converting decrypted plaintext to integer: %v", err)
		return -1, err
	}

	return n, nil
}

func (d DecryptedData) Result() (string, error) {
	if d.Error != nil {
		return "", d.Error
	}

	return string(d.Data), nil
}
