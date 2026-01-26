package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Host          string
	Port          string
	PSQL          string
	RedisPort     string
	RedisHost     string
	RedisPassword string
	EKEY          string
	JWTKEY        string
}

func LoadMainConfig() *Config {
	if err := godotenv.Load("../.env"); err != nil {
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
	}
}
