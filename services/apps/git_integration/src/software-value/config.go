package main

import (
	"github.com/knadh/koanf/parsers/toml/v2"
	"github.com/knadh/koanf/providers/file"
	"log"
	"os"
	"os/exec"
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
	BatchSize        int      `koanf:"batch.size"`
	InsightsDatabase DBConfig `koanf:"database.insights"`
	CMDatabase       DBConfig `koanf:"database.cm"`
}

func getConfig(configFile string) Config {
	var config Config
	var err error

	if err := k.Load(file.Provider(configFile), toml.Parser()); err != nil {
		log.Fatalf("Error loading config file '%s': %v", configFile, err)
	}

	config.TargetPath = k.String("target.path")
	config.SCCPath = k.String("scc.path")
	config.BatchSize = k.Int("batch.size")

	if _, err := os.Stat(config.TargetPath); os.IsNotExist(err) {
		log.Fatalf("Error: Target path '%s' does not exist: %v", config.TargetPath, err)
	} else if err != nil {
		log.Fatalf("Error checking target path '%s': %v", config.TargetPath, err)
	}

	if config.SCCPath == "" {
		config.SCCPath, err = exec.LookPath("scc")
		if err != nil {
			log.Fatalf("Error: Could not find 'scc' executable in PATH. Use -scc-path flag or ensure scc is in PATH: %v", err)
		}
	}

	config.InsightsDatabase.User = k.String("database.insights.user")
	config.InsightsDatabase.Password = k.String("database.insights.password")
	config.InsightsDatabase.DBName = k.String("database.insights.dbname")
	config.InsightsDatabase.Host = k.String("database.insights.host")
	config.InsightsDatabase.Port = k.Int("database.insights.port")
	config.InsightsDatabase.SSLMode = k.String("database.insights.sslmode")
	config.InsightsDatabase.PoolMax = k.Int("database.insights.pool_max")
	config.InsightsDatabase.ReadOnly = k.Bool("database.insights.readonly")

	config.CMDatabase.User = k.String("database.cm.user")
	config.CMDatabase.Password = k.String("database.cm.password")
	config.CMDatabase.DBName = k.String("database.cm.dbname")
	config.CMDatabase.Host = k.String("database.cm.host")
	config.CMDatabase.Port = k.Int("database.cm.port")
	config.CMDatabase.SSLMode = k.String("database.cm.sslmode")
	config.CMDatabase.PoolMax = k.Int("database.cm.pool_max")
	config.CMDatabase.ReadOnly = k.Bool("database.cm.readonly")

	return config
}
