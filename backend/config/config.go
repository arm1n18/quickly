package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type SMTPClient struct {
	Domain   string
	Port     string
	Email    string
	Password string
}

type Config struct {
	Host          string
	Port          string
	PSQL          string
	RedisPort     string
	RedisHost     string
	RedisPassword string
	EKEY          string
	JWTKEY        string
	SMTP          SMTPClient
}

func LoadMainConfig() *Config {
	if err := godotenv.Load(".env"); err != nil {
		log.Fatalf("Failed to load .env: %v", err)
	}

	return &Config{
		Host:          os.Getenv("HOST"),
		Port:          os.Getenv("PORT"),
		PSQL:          os.Getenv("PSQL_URL"),
		RedisHost:     os.Getenv("REDIS_HOST"),
		RedisPort:     os.Getenv("REDIS_PORT"),
		RedisPassword: os.Getenv("REDIS_PASSWORD"),
		EKEY:          os.Getenv("EKEY"),
		JWTKEY:        os.Getenv("JWTKEY"),
		SMTP: SMTPClient{
			Domain:   os.Getenv("SMTP_DOMAIN"),
			Port:     os.Getenv("SMTP_PORT"),
			Email:    os.Getenv("SMTP_EMAIL"),
			Password: os.Getenv("SMTP_PASSWORD"),
		},
	}
}
