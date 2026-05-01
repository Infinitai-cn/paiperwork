package main

import (
	"context"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/lich0821/wcfLink/internal/app"
	"github.com/lich0821/wcfLink/internal/config"
	coreversion "github.com/lich0821/wcfLink/version"
)

func main() {
	showVersion := flag.Bool("version", false, "print version and exit")
	flag.Parse()
	if *showVersion {
		fmt.Println(coreversion.String())
		return
	}

	cfg := config.Load()

	level := new(slog.LevelVar)
	level.Set(cfg.LogLevel())
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: level,
	}))

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	a, err := app.New(ctx, cfg, logger)
	if err != nil {
		logger.Error("failed to initialize app", "err", err)
		os.Exit(1)
	}

	if err := a.Run(ctx); err != nil {
		logger.Error("application exited with error", "err", err)
		os.Exit(1)
	}
}
