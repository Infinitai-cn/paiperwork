package config

import (
	"go.mau.fi/whatsmeow/proto/waCompanionReg"
)

var (
	AppVersion             = "v8.3.5"
	AppPort                = "3000"
	AppHost                = "0.0.0.0"
	AppDebug               = false
	AppOs                  = "Paiperwork-AldinoKemal"
	AppPlatform            = waCompanionReg.DeviceProps_PlatformType(1)
	AppBasicAuthCredential []string
	AppBasePath            = ""
	AppTrustedProxies      []string // Trusted proxy IP ranges (e.g., "0.0.0.0/0" for all, or specific CIDRs)

	McpPort = "8080"
	McpHost = "localhost"

	PathQrCode    = "statics/qrcode"
	PathSendItems = "statics/senditems"
	PathMedia     = "statics/media"
	PathStorages  = "storages"

	NoDisk = false // Set true to avoid any filesystem writes in gowa

	// By default this points to local WhatsApp key store.
	// In integrated deployments, you can override with PAIPERWORK_DB_URI.
	DBURI     = "file:storages/whatsapp.db?_foreign_keys=on&_journal_mode=WAL&_busy_timeout=5000"
	DBKeysURI = ""

	WhatsappAutoReplyMessage          string
	WhatsappAutoMarkRead              = false // Auto-mark incoming messages as read
	WhatsappAutoDownloadMedia         = true  // Auto-download media from incoming messages
	WhatsappWebhook                   []string
	WhatsappWebhookSecret             = "secret"
	WhatsappWebhookInsecureSkipVerify = false          // Skip TLS certificate verification for webhooks (insecure)
	WhatsappWebhookEvents             []string         // Whitelist of events to forward to webhook (empty = all events)
	WhatsappAutoRejectCall                     = false // Auto-reject incoming calls
	WhatsappLogLevel                           = "ERROR"
	WhatsappAppStateSyncEnabled                = false // Disable WhatsApp app state sync for user WhatsApp state. We do not plan to sync user WhatsApp state in this deployment.
	// Optional values to link preferred pair device from the external user database.
	WhatsappPreferredDeviceID            = ""
	WhatsappPreferredDeviceMeta          = ""
	WhatsappSettingMaxImageSize    int64 = 20000000  // 20MB
	WhatsappSettingMaxFileSize     int64 = 50000000  // 50MB
	WhatsappSettingMaxVideoSize    int64 = 100000000 // 100MB
	WhatsappSettingMaxDownloadSize int64 = 500000000 // 500MB
	WhatsappTypeUser                     = "@s.whatsapp.net"
	WhatsappTypeGroup                    = "@g.us"
	WhatsappTypeLid                      = "@lid"
	WhatsappAccountValidation            = true
	WhatsappPresenceOnConnect            = "unavailable" // Presence to send on connect: "available", "unavailable", or "none"

	ChatStorageURI               = "file:storages/chatstorage.db"
	ChatStorageEnableForeignKeys = true
	ChatStorageEnableWAL         = true

	ChatwootEnabled   = false
	ChatwootURL       = ""
	ChatwootAPIToken  = ""
	ChatwootAccountID = 0
	ChatwootInboxID   = 0
	ChatwootDeviceID  = "" // Device ID for outbound messages (required for multi-device)

	// Chatwoot History Sync settings
	ChatwootImportMessages          = false // Enable message history import to Chatwoot
	ChatwootDaysLimitImportMessages = 3     // Days of history to import (default: 3)

	// Toggle handling of WhatsApp history sync events inside gowa.
	// For chatbot-only usage we disable this to avoid import of full device history.
	HistorySyncEnabled = false
)
