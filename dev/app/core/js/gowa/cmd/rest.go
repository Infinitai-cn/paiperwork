package cmd

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/aldinokemal/go-whatsapp-web-multidevice/config"
	"github.com/aldinokemal/go-whatsapp-web-multidevice/infrastructure/whatsapp"
	"github.com/aldinokemal/go-whatsapp-web-multidevice/pkg/utils"
	"github.com/aldinokemal/go-whatsapp-web-multidevice/ui/rest"
	"github.com/aldinokemal/go-whatsapp-web-multidevice/ui/rest/helpers"
	"github.com/aldinokemal/go-whatsapp-web-multidevice/ui/rest/middleware"
	"github.com/aldinokemal/go-whatsapp-web-multidevice/ui/websocket"
	"github.com/dustin/go-humanize"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/basicauth"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/filesystem"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/template/html/v2"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

var (
	embeddedRestApp   *fiber.App
	embeddedRestAppMu sync.Mutex
)

// rootCmd represents the base command when called without any subcommands
var restCmd = &cobra.Command{
	Use:   "rest",
	Short: "Send whatsapp API over http",
	Long:  `This application is from clone https://github.com/aldinokemal/go-whatsapp-web-multidevice`,
	Run:   restServer,
}

func init() {
	rootCmd.AddCommand(restCmd)
}
func restServer(_ *cobra.Command, _ []string) {
	engine := html.NewFileSystem(http.FS(EmbedIndex), ".html")
	engine.AddFunc("isEnableBasicAuth", func(token any) bool {
		return token != nil
	})
	fiberConfig := fiber.Config{
		Views:                   engine,
		EnableTrustedProxyCheck: true,
		BodyLimit:               int(config.WhatsappSettingMaxVideoSize),
		Network:                 "tcp",
	}

	// Configure proxy settings if trusted proxies are specified
	if len(config.AppTrustedProxies) > 0 {
		fiberConfig.TrustedProxies = config.AppTrustedProxies
		fiberConfig.ProxyHeader = fiber.HeaderXForwardedHost
	}

	app := fiber.New(fiberConfig)

	embeddedRestAppMu.Lock()
	embeddedRestApp = app
	embeddedRestAppMu.Unlock()

	app.Static(config.AppBasePath+"/statics", "./statics")
	app.Use(config.AppBasePath+"/components", filesystem.New(filesystem.Config{
		Root:       http.FS(EmbedViews),
		PathPrefix: "views/components",
		Browse:     true,
	}))
	app.Use(config.AppBasePath+"/assets", filesystem.New(filesystem.Config{
		Root:       http.FS(EmbedViews),
		PathPrefix: "views/assets",
		Browse:     true,
	}))

	app.Use(middleware.Recovery())
	app.Use(middleware.RequestTimeout(middleware.DefaultRequestTimeout))
	app.Use(middleware.BasicAuth())
	if config.AppDebug {
		app.Use(logger.New())
	}
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept",
	}))

	// Device manager - needed for chatwoot webhook and health check
	dm := whatsapp.GetDeviceManager()

	// Health check endpoint (public, no auth)
	// Registered at root path (ignoring AppBasePath) to ensure fixed availability
	// for infrastructure health probes (Kubernetes liveness/readiness, Docker healthcheck, etc.)
	app.Get("/health", func(c *fiber.Ctx) error {
		if dm != nil && dm.IsHealthy() {
			return c.SendString("OK")
		}
		return c.Status(http.StatusServiceUnavailable).SendString("Service Unavailable")
	})

	// Chatwoot webhook - registered BEFORE basic auth middleware
	// This allows Chatwoot to send webhooks without authentication
	if config.ChatwootEnabled {
		chatwootHandler := rest.NewChatwootHandler(appUsecase, sendUsecase, dm, chatStorageRepo)
		webhookPath := "/chatwoot/webhook"
		if config.AppBasePath != "" {
			webhookPath = config.AppBasePath + webhookPath
		}
		app.Post(webhookPath, chatwootHandler.HandleWebhook)
	}

	if len(config.AppBasicAuthCredential) > 0 {
		account := make(map[string]string)
		for _, basicAuth := range config.AppBasicAuthCredential {
			ba := strings.Split(basicAuth, ":")
			if len(ba) != 2 {
				logrus.Fatalln("Basic auth is not valid, please this following format <user>:<secret>")
			}
			account[ba[0]] = ba[1]
		}

		app.Use(basicauth.New(basicauth.Config{
			Users: account,
		}))
	}

	// Create base path group or use app directly
	var apiGroup fiber.Router = app
	if config.AppBasePath != "" {
		apiGroup = app.Group(config.AppBasePath)
	}

	registerDeviceScopedRoutes := func(r fiber.Router) {
		rest.InitRestApp(r, appUsecase)
		rest.InitRestChat(r, chatUsecase)
		rest.InitRestSend(r, sendUsecase)
		rest.InitRestUser(r, userUsecase)
		rest.InitRestMessage(r, messageUsecase)
		rest.InitRestGroup(r, groupUsecase)
		rest.InitRestNewsletter(r, newsletterUsecase)
		websocket.RegisterRoutes(r, appUsecase)
	}

	// Device management routes (no device_id required)
	rest.InitRestDevice(apiGroup, deviceUsecase)

	// Device-scoped operations (header-based)
	headerDeviceGroup := apiGroup.Group("", middleware.DeviceMiddleware(dm))
	registerDeviceScopedRoutes(headerDeviceGroup)

	// Chatwoot sync routes - require authentication (webhook is registered earlier without auth)
	if config.ChatwootEnabled {
		chatwootHandler := rest.NewChatwootHandler(appUsecase, sendUsecase, dm, chatStorageRepo)
		apiGroup.Post("/chatwoot/sync", chatwootHandler.SyncHistory)
		apiGroup.Get("/chatwoot/sync/status", chatwootHandler.SyncStatus)
	}

	apiGroup.Get("/", func(c *fiber.Ctx) error {
		return c.Render("views/index", fiber.Map{
			"AppHost":        fmt.Sprintf("%s://%s", c.Protocol(), c.Hostname()),
			"AppVersion":     config.AppVersion,
			"AppBasePath":    config.AppBasePath,
			"BasicAuthToken": c.UserContext().Value(middleware.AuthorizationValue("BASIC_AUTH")),
			"MaxFileSize":    humanize.Bytes(uint64(config.WhatsappSettingMaxFileSize)),
			"MaxVideoSize":   humanize.Bytes(uint64(config.WhatsappSettingMaxVideoSize)),
		})
	})

	go websocket.RunHub()

	// Set auto reconnect to whatsapp server after booting
	if appUsecase == nil {
		logrus.Warn("appUsecase is nil; skipping auto connect after booting")
	} else {
		go helpers.SetAutoConnectAfterBooting(appUsecase)
	}

	// Set auto reconnect checking with a guaranteed client instance
	startAutoReconnectCheckerIfClientAvailable()

	defer func() {
		embeddedRestAppMu.Lock()
		embeddedRestApp = nil
		embeddedRestAppMu.Unlock()
	}()

	err := app.Listen(config.AppHost + ":" + config.AppPort)
	if err != nil {
		if errors.Is(err, http.ErrServerClosed) {
			logrus.Info("Gowa REST server closed")
			return
		}
		logrus.Errorf("Gowa REST server failed: %v", err)
		return
	}
	logrus.Info("Gowa REST server exited cleanly")
}

// StartRestServer launches the gowa REST gateway directly (for embedded use in Paiperwork).
func StartRestServer() {
	// Ensure embedded startup manually performs same initialization as normal command.
	utils.LoadConfig(".")
	initEnvConfig()
	initApp()
	logrus.Infof("StartRestServer: appUsecase nil=%v", appUsecase == nil)
	restServer(nil, nil)
}

func ShutdownRestServer(ctx context.Context) error {
	embeddedRestAppMu.Lock()
	app := embeddedRestApp
	embeddedRestAppMu.Unlock()

	if app == nil {
		logrus.Info("ShutdownRestServer: no embedded gowa server to shut down")
		return nil
	}

	logrus.Info("ShutdownRestServer: shutting down embedded gowa server")
	shutdownCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	if err := app.Shutdown(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	select {
	case <-shutdownCtx.Done():
		if shutdownCtx.Err() != nil {
			return shutdownCtx.Err()
		}
	default:
	}
	return nil
}
