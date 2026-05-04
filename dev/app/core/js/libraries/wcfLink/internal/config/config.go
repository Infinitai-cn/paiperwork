package config

import (
	"encoding/json"
	"log/slog"
	"os"
	"path/filepath"
	"strconv"
	"time"
)

const (
	defaultListenAddr     = "127.0.0.1:17890"
	defaultBaseURL        = "https://ilinkai.weixin.qq.com"
	defaultCDNBaseURL     = "https://novac2c.cdn.weixin.qq.com/c2c"
	defaultChannelVersion = "2.0.1"
	defaultPollTimeout    = 35 * time.Second
)

type Config struct {
	ListenAddr     string
	StateDir       string
	MediaDir       string
	SettingsPath   string
	DefaultBaseURL string
	CDNBaseURL     string
	ChannelVersion string
	PollTimeout    time.Duration
	LogLevelText   string
	OpenBrowser    bool
	WebhookURL     string
}

func Load() Config {
	stateDir := envOrDefault("WCFLINK_STATE_DIR", defaultStateDir())
	mediaDir := envOrDefault("WCFLINK_MEDIA_DIR", os.TempDir())
	settingsPath := filepath.Join(stateDir, "settings.json")
	fileSettings := loadFileSettings(settingsPath)
	return Config{
		ListenAddr:     envOrDefault("WCFLINK_LISTEN_ADDR", valueOrDefault(fileSettings.ListenAddr, defaultListenAddr)),
		StateDir:       stateDir,
		MediaDir:       mediaDir,
		SettingsPath:   settingsPath,
		DefaultBaseURL: envOrDefault("WCFLINK_BASE_URL", defaultBaseURL),
		CDNBaseURL:     envOrDefault("WCFLINK_CDN_BASE_URL", defaultCDNBaseURL),
		ChannelVersion: envOrDefault("WCFLINK_CHANNEL_VERSION", defaultChannelVersion),
		PollTimeout:    envDurationOrDefault("WCFLINK_POLL_TIMEOUT", defaultPollTimeout),
		LogLevelText:   envOrDefault("WCFLINK_LOG_LEVEL", "INFO"),
		OpenBrowser:    envBoolOrDefault("WCFLINK_OPEN_BROWSER", false),
		WebhookURL:     envOrDefault("WCFLINK_WEBHOOK_URL", fileSettings.WebhookURL),
	}
}

type FileSettings struct {
	ListenAddr string `json:"listen_addr"`
	WebhookURL string `json:"webhook_url"`
}

func SaveFileSettings(path string, settings FileSettings) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	data, err := json.MarshalIndent(settings, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0o644)
}

func (c Config) LogLevel() slog.Level {
	switch c.LogLevelText {
	case "DEBUG", "debug":
		return slog.LevelDebug
	case "WARN", "warn", "WARNING", "warning":
		return slog.LevelWarn
	case "ERROR", "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}

func defaultStateDir() string {
	exePath, err := os.Executable()
	if err == nil && exePath != "" {
		return filepath.Join(filepath.Dir(exePath), "data")
	}
	return filepath.Join(".", "data")
}

func envOrDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func envDurationOrDefault(key string, fallback time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if parsed, err := time.ParseDuration(value); err == nil {
			return parsed
		}
	}
	return fallback
}

func envBoolOrDefault(key string, fallback bool) bool {
	if value := os.Getenv(key); value != "" {
		if parsed, err := strconv.ParseBool(value); err == nil {
			return parsed
		}
	}
	return fallback
}

func loadFileSettings(path string) FileSettings {
	data, err := os.ReadFile(path)
	if err != nil {
		return FileSettings{}
	}
	var settings FileSettings
	if err := json.Unmarshal(data, &settings); err != nil {
		return FileSettings{}
	}
	return settings
}

func valueOrDefault(value, fallback string) string {
	if value != "" {
		return value
	}
	return fallback
}
