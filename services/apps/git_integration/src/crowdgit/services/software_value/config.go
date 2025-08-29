package main

import (
	"log"
	"os"
	"os/exec"
	"strconv"
)

type DBConfig struct {
	User     string `koanf:"user"`
	Password string `koanf:"password"`
	DBName   string `koanf:"dbname"`
	Host     string `koanf:"host"`
	Port     int    `koanf:"port"`
	SSLMode  string `koanf:"sslmode"`
	PoolMax  int    `koanf:"pool_max"`
	ReadOnly bool   `koanf:"readonly"`
}

type Config struct {
	TargetPath       string   `koanf:"target.path"`
	SCCPath          string   `koanf:"scc.path"`
	InsightsDatabase DBConfig `koanf:"database.insights"`
	CMDatabase       DBConfig `koanf:"database.cm"`
}

func getConfig(targetPath string) Config {
	var config Config
	var err error

	// Load configuration from command line argument and environment variables
	config.TargetPath = targetPath
	// SCC path will be auto-discovered via exec.LookPath("scc")

	if _, err := os.Stat(config.TargetPath); os.IsNotExist(err) {
		log.Fatalf("Error: Target path '%s' does not exist: %v", config.TargetPath, err)
	} else if err != nil {
		log.Fatalf("Error checking target path '%s': %v", config.TargetPath, err)
	}

	// Auto-discover scc binary in PATH (should be at /usr/local/bin/scc in container)
	config.SCCPath, err = exec.LookPath("scc")
	if err != nil {
		log.Fatalf("Error: Could not find 'scc' executable in PATH: %v", err)
	}

	config.InsightsDatabase.User = os.Getenv("INSIGHTS_DB_USERNAME")
	config.InsightsDatabase.Password = os.Getenv("INSIGHTS_DB_PASSWORD")
	config.InsightsDatabase.DBName = os.Getenv("INSIGHTS_DB_DATABASE")
	config.InsightsDatabase.Host = os.Getenv("INSIGHTS_DB_WRITE_HOST")
	if portStr := os.Getenv("INSIGHTS_DB_PORT"); portStr != "" {
		if port, err := strconv.Atoi(portStr); err == nil {
			config.InsightsDatabase.Port = port
		}
	}
	config.InsightsDatabase.SSLMode = os.Getenv("INSIGHTS_DB_SSLMODE")
	if poolMaxStr := os.Getenv("INSIGHTS_DB_POOL_MAX"); poolMaxStr != "" {
		if poolMax, err := strconv.Atoi(poolMaxStr); err == nil {
			config.InsightsDatabase.PoolMax = poolMax
		}
	}
	if readOnlyStr := os.Getenv("INSIGHTS_DB_READONLY"); readOnlyStr != "" {
		config.InsightsDatabase.ReadOnly = readOnlyStr == "true"
	}

	config.CMDatabase.User = os.Getenv("CROWD_DB_USERNAME")
	config.CMDatabase.Password = os.Getenv("CROWD_DB_PASSWORD")
	config.CMDatabase.DBName = os.Getenv("CROWD_DB_DATABASE")
	config.CMDatabase.Host = os.Getenv("CROWD_DB_READ_HOST")
	if portStr := os.Getenv("CROWD_DB_PORT"); portStr != "" {
		if port, err := strconv.Atoi(portStr); err == nil {
			config.CMDatabase.Port = port
		}
	}
	config.CMDatabase.SSLMode = os.Getenv("CROWD_DB_SSLMODE")
	if poolMaxStr := os.Getenv("CROWD_DB_POOL_MAX"); poolMaxStr != "" {
		if poolMax, err := strconv.Atoi(poolMaxStr); err == nil {
			config.CMDatabase.PoolMax = poolMax
		}
	}
	if readOnlyStr := os.Getenv("CROWD_DB_READONLY"); readOnlyStr != "" {
		config.CMDatabase.ReadOnly = readOnlyStr == "true"
	}

	return config
}
