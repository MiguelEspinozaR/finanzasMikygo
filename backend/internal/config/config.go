package config

import (
	"fmt"
	"os"
	"time"

	"github.com/joho/godotenv"
)

var Location, _ = time.LoadLocation("America/La_Paz")

type Config struct {
	Port           string
	DatabaseURL    string
	UploadDir      string
	MaxUploadSize  string
	CORSOrigin     string
	SQLDevEnabled  string
}

func Load() *Config {
	godotenv.Load()

	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbName := getEnv("DB_NAME", "finanzas_miky_go")
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "")
	databaseURL := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable", dbUser, dbPassword, dbHost, dbPort, dbName)

	return &Config{
		Port:          getEnv("PORT", "8080"),
		DatabaseURL:   databaseURL,
		UploadDir:     getEnv("UPLOAD_DIR", "./uploads"),
		MaxUploadSize: getEnv("MAX_UPLOAD_SIZE", "10"),
		CORSOrigin:    getEnv("CORS_ORIGIN", "http://localhost:5173"),
		SQLDevEnabled: getEnv("SQL_DEV_ENABLED", "true"),
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
