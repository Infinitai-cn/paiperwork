package main

import (
	"bytes"
	"context"
	"crypto/hmac"
	crand "crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"log/slog"
	"math/rand"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"regexp"
	"runtime"
	"runtime/debug"
	"slices"
	"sort"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/PuerkitoBio/goquery"
	gowaCmd "github.com/aldinokemal/go-whatsapp-web-multidevice/cmd"
	config "github.com/aldinokemal/go-whatsapp-web-multidevice/config"
	whatsappInfra "github.com/aldinokemal/go-whatsapp-web-multidevice/infrastructure/whatsapp"
	"github.com/aldinokemal/go-whatsapp-web-multidevice/pkg/sqliteutil"
	restHelpers "github.com/aldinokemal/go-whatsapp-web-multidevice/ui/rest/helpers"
	uiWebsocket "github.com/aldinokemal/go-whatsapp-web-multidevice/ui/websocket"
	wcfLinkEngine "github.com/lich0821/wcfLink/engine"
)

var adminAuditMutex sync.Mutex
var gatewayStartMutex sync.Mutex
var whatsappGatewayBroadcastObserverOnce sync.Once

var whatsappQrProxyLogMu sync.Mutex
var lastWhatsappQrProxyUserKey string
var lastWhatsappQrProxyDBURI string
var whatsappQrProxyHandlerMu sync.Mutex

var wechatEngineMu sync.Mutex
var wechatEngine *wcfLinkEngine.Engine
var wechatEngineStarted bool
var wechatEngineReady bool
var wechatEngineStateDir string

const wechatListenAddr = "127.0.0.1:17890"

func getWechatReverseProxy() *httputil.ReverseProxy {
	targetURL := &url.URL{Scheme: "http", Host: wechatListenAddr}
	proxy := httputil.NewSingleHostReverseProxy(targetURL)
	proxy.Director = func(req *http.Request) {
		originalPath := req.URL.Path
		req.URL.Scheme = targetURL.Scheme
		req.URL.Host = targetURL.Host
		// Strip the /api/wechat prefix before proxying.
		req.URL.Path = strings.TrimPrefix(req.URL.Path, "/api/wechat")
		req.Host = targetURL.Host
		// direction logging disabled to reduce noise
		_ = originalPath
	}
	proxy.ModifyResponse = func(resp *http.Response) error {
		if resp.StatusCode >= 400 {
			body, err := io.ReadAll(resp.Body)
			if err != nil {
				log.Printf("wechatReverseProxy: error reading response body for %s %s: %v", resp.Request.Method, resp.Request.URL.String(), err)
			} else {
				log.Printf("wechatReverseProxy: received error response %d for %s %s proxied to %s; body=%q",
					resp.StatusCode,
					resp.Request.Method,
					resp.Request.URL.Path,
					resp.Request.URL.String(),
					truncateString(string(body), 1024))
				resp.Body = io.NopCloser(bytes.NewBuffer(body))
			}
		}
		return nil
	}
	proxy.ErrorHandler = func(rw http.ResponseWriter, req *http.Request, err error) {
		log.Printf("wechatReverseProxy: proxy error for %s %s -> %v", req.Method, req.URL.Path, err)
		http.Error(rw, "WeChat reverse proxy error", http.StatusBadGateway)
	}
	return proxy
}

func truncateString(value string, maxLen int) string {
	if len(value) <= maxLen {
		return value
	}
	return value[:maxLen] + "..."
}

type whatsappRemoteLogoutNotice struct {
	DeviceID   string
	Message    string
	OccurredAt time.Time
}

var selectedWhatsappDeviceMu sync.RWMutex
var selectedWhatsappDevice = make(map[string]map[string]string)
var gatewayStarting bool
var gatewayLastStartAttempt time.Time
var gatewayReady bool
var gatewayStartCooldown = 8 * time.Second

var activeWhatsappUserMu sync.RWMutex
var activeWhatsappUser string

var activeGatewayMu sync.RWMutex
var activeGateway string

const (
	activeGatewayWhatsApp = "whatsapp"
	activeGatewayWechat   = "wechat"
)

var whatsappManualStopMu sync.RWMutex
var whatsappManualStopUntil time.Time

var welcomeSentForDevice = map[string]bool{}
var welcomePendingForDevice = map[string]bool{}
var welcomeLastSentAtForDevice = map[string]time.Time{}
var purgedWhatsappWelcomeBlockedUntil = map[string]time.Time{}
var welcomeMu sync.Mutex
var pairRequested bool
var whatsappInMemoryRuntimeLogOnce sync.Once

var whatsappGatewayDeviceResolutionMu sync.RWMutex
var whatsappGatewayDeviceResolutionCache = make(map[string]string)

var syncedPersistedWhatsappDevicesMu sync.RWMutex
var syncedPersistedWhatsappDevicesByUser = make(map[string][]persistedWhatsappDeviceEntry)

const whatsappFreshPairStartupEnv = "PAIPERWORK_WHATSAPP_FRESH_PAIR_STARTUP"
const whatsappPurgedWelcomeBlockTTL = 2 * time.Minute
const whatsappActiveUserEnv = "PAIPERWORK_WHATSAPP_ACTIVE_USER"
const whatsappExpectedSessionRestoreEnv = "PAIPERWORK_WHATSAPP_EXPECT_SESSION_RESTORE"
const whatsappInMemoryRuntimeEnv = "PAIPERWORK_WHATSAPP_RUNTIME_IN_MEMORY"
const whatsappPersistedDevicesBootstrapEnv = "PAIPERWORK_WHATSAPP_PERSISTED_DEVICES_JSON"

var whatsappServerStarted bool
var whatsappStartupTargetPhone string

var whatsappWebhookURL string
var whatsappWebhookSecret string

var embeddedGowaStarted bool
var embeddedGowaMutex sync.Mutex

// Track outbound messages from this app for duplicate suppression
type whatsappOutgoingMessage struct {
	ChatID    string
	Body      string
	Timestamp time.Time
}

var whatsappOutgoingMessagesByUser = make(map[string][]whatsappOutgoingMessage)
var whatsappOutgoingMu sync.Mutex

// Incoming WhatsApp message queue (from webhook)
type whatsappIncomingMessage struct {
	DeviceID    string `json:"device_id"`
	ID          string `json:"id,omitempty"`
	ChatID      string `json:"chat_id"`
	From        string `json:"from"`
	FromName    string `json:"from_name"`
	Timestamp   string `json:"timestamp"`
	Body        string `json:"body"`
	RepliedToID string `json:"replied_to_id,omitempty"`
	QuotedBody  string `json:"quoted_body,omitempty"`
}

var whatsappIncomingQueueByUser = make(map[string][]whatsappIncomingMessage)
var whatsappIncomingMu sync.Mutex

var whatsappChatDeviceRoutesByUser = make(map[string]map[string]string)
var whatsappChatDeviceRoutesMu sync.RWMutex

var whatsappModeByUser = make(map[string]string)
var whatsappModeMu sync.RWMutex

var whatsappRemoteLogoutMu sync.RWMutex
var whatsappRemoteLogoutState *whatsappRemoteLogoutNotice

var whatsappGatewayCachedQR string
var whatsappGatewayCachedQRTimestamp time.Time
var whatsappGatewayQRTTL = 20 * time.Second

// Cached QR image bytes + content-type to avoid repeatedly fetching transient
// gateway PNGs that may disappear quickly. Protected by whatsappGatewayCachedBytesMu.
var whatsappGatewayCachedBytesMu sync.Mutex
var whatsappGatewayCachedQRBytes []byte
var whatsappGatewayCachedQRContentType string

var dataURLLogPattern = regexp.MustCompile(`data:[^"'\s]+`)

const whatsappIncomingQueueDefaultScope = "__default__"

func compactLogValue(raw string, maxLen int) string {
	value := strings.TrimSpace(raw)
	if value == "" {
		return value
	}
	if maxLen <= 0 {
		maxLen = 512
	}

	// Avoid flooding logs with inlined data URLs (QR PNG base64 payloads).
	sanitized := dataURLLogPattern.ReplaceAllStringFunc(value, func(match string) string {
		return fmt.Sprintf("<data-url len=%d>", len(match))
	})

	if len(sanitized) > maxLen {
		return sanitized[:maxLen] + "...(truncated)"
	}
	return sanitized
}

func normalizeWhatsappIdentity(value string) string {
	trimmed := strings.TrimSpace(strings.ToLower(value))
	if trimmed == "" {
		return ""
	}
	if at := strings.Index(trimmed, "@"); at >= 0 {
		trimmed = trimmed[:at]
	}
	if colon := strings.Index(trimmed, ":"); colon >= 0 {
		trimmed = trimmed[:colon]
	}
	return strings.TrimSpace(trimmed)
}

func getCachedWhatsappGatewayDeviceResolution(requestedDeviceID string) string {
	whatsappGatewayDeviceResolutionMu.RLock()
	defer whatsappGatewayDeviceResolutionMu.RUnlock()
	return whatsappGatewayDeviceResolutionCache[strings.ToLower(strings.TrimSpace(requestedDeviceID))]
}

func setCachedWhatsappGatewayDeviceResolution(requestedDeviceID, resolvedDeviceID string) {
	if strings.TrimSpace(requestedDeviceID) == "" || strings.TrimSpace(resolvedDeviceID) == "" {
		return
	}
	whatsappGatewayDeviceResolutionMu.Lock()
	defer whatsappGatewayDeviceResolutionMu.Unlock()
	whatsappGatewayDeviceResolutionCache[strings.ToLower(strings.TrimSpace(requestedDeviceID))] = strings.TrimSpace(resolvedDeviceID)
}

func clearWhatsappGatewayDeviceResolutionCache() {
	whatsappGatewayDeviceResolutionMu.Lock()
	defer whatsappGatewayDeviceResolutionMu.Unlock()
	whatsappGatewayDeviceResolutionCache = make(map[string]string)
}

func canonicalizeRequestedWhatsappDeviceID(userKey, deviceID string) string {
	trimmed := strings.TrimSpace(deviceID)
	if trimmed == "" {
		return ""
	}
	if !isPersistableWhatsappDeviceID(trimmed) {
		log.Printf("canonicalizeRequestedWhatsappDeviceID: rejecting non-paired requested device id %s for user=%s", maskPhoneForLog(trimmed), safeUserKeyForFilename(userKey))
		return ""
	}

	lower := strings.ToLower(trimmed)
	if strings.Count(trimmed, "@") > 1 || strings.Contains(lower, "whatsapp.netnet") {
		log.Printf("canonicalizeRequestedWhatsappDeviceID: rejecting malformed requested device id %s for user=%s", maskPhoneForLog(trimmed), safeUserKeyForFilename(userKey))
		return ""
	}

	normalized := normalizeWhatsappIdentity(trimmed)
	if normalized == "" || strings.TrimSpace(userKey) == "" {
		return trimmed
	}

	persistedDevices, err := loadPersistedWhatsappDevicesFromDB(userKey)
	if err != nil {
		log.Printf("canonicalizeRequestedWhatsappDeviceID: failed to load persisted devices for user=%s: %v", safeUserKeyForFilename(userKey), err)
		return trimmed
	}

	identityMatches := make([]string, 0, len(persistedDevices))
	for _, entry := range persistedDevices {
		candidateID := strings.TrimSpace(entry.ID)
		if candidateID == "" {
			continue
		}
		if strings.EqualFold(candidateID, trimmed) {
			return candidateID
		}
		if normalizeWhatsappIdentity(candidateID) == normalized {
			identityMatches = append(identityMatches, candidateID)
		}
	}

	for _, candidateID := range identityMatches {
		if strings.Contains(candidateID, ":") {
			return candidateID
		}
	}
	if len(identityMatches) == 1 {
		return identityMatches[0]
	}

	return trimmed
}

func isPersistableWhatsappDeviceID(deviceID string) bool {
	trimmed := strings.TrimSpace(deviceID)
	return trimmed != "" && strings.Contains(trimmed, "@") && strings.Contains(trimmed, ":")
}

func whatsappMentionsDevice(mentions []string, deviceID string) bool {
	target := normalizeWhatsappIdentity(deviceID)
	if target == "" {
		return false
	}
	for _, mention := range mentions {
		if normalizeWhatsappIdentity(mention) == target {
			return true
		}
	}
	return false
}

func qrRefForLog(qr string) string {
	trimmed := strings.TrimSpace(qr)
	if trimmed == "" {
		return ""
	}
	if strings.HasPrefix(trimmed, "data:") {
		return fmt.Sprintf("<data-url len=%d>", len(trimmed))
	}
	return compactLogValue(trimmed, 200)
}

func maskURLForLog(raw string) string {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return ""
	}

	parsed, err := url.Parse(trimmed)
	if err != nil {
		return compactLogValue(trimmed, 200)
	}

	query := parsed.Query()
	if deviceID := strings.TrimSpace(query.Get("device_id")); deviceID != "" {
		query.Set("device_id", maskPhoneForLog(deviceID))
	}
	parsed.RawQuery = query.Encode()

	return compactLogValue(parsed.String(), 200)
}

func useInMemoryPaiperworkWhatsappRuntime() bool {
	if config.RuntimeNoDisk() {
		return true
	}
	return strings.EqualFold(strings.TrimSpace(os.Getenv(whatsappInMemoryRuntimeEnv)), "true")
}

func forceWhatsappInMemoryRuntime() {
	config.NoDisk = true
	os.Setenv(whatsappInMemoryRuntimeEnv, "true")
	os.Setenv("PAIPERWORK_NO_DISK", "true")
}

func syncEmbeddedGowaRuntimeDBEnv(userKey string) {
	forceWhatsappInMemoryRuntime()

	resolvedUserKey := strings.TrimSpace(userKey)
	if resolvedUserKey == "" {
		resolvedUserKey = strings.TrimSpace(os.Getenv(whatsappActiveUserEnv))
	}
	if resolvedUserKey == "" {
		resolvedUserKey = "default"
	}

	userDBURI := userWhatsappDBURI(resolvedUserKey)
	userKeysDBURI := userWhatsappKeysDBURI(resolvedUserKey)
	os.Setenv("PAIPERWORK_DB_URI", userDBURI)
	os.Setenv("PAIPERWORK_DB_KEYS_URI", userKeysDBURI)
	os.Setenv("PAIPERWORK_CHAT_STORAGE_URI", userDBURI)
	syncPersistedWhatsappBootstrapEnv(resolvedUserKey)
}

func inMemoryPaiperworkWhatsappDBURI(userKey string) string {
	name := safeUserKeyForDBFilename(userKey)
	if name == "" {
		name = "default"
	}
	return fmt.Sprintf("file:paiperwork-whatsapp-%s?mode=memory&cache=shared&_foreign_keys=on&_journal_mode=WAL&_busy_timeout=5000", name)
}

func loadSelectedWhatsappDeviceFromDB(userKey string) (deviceID string, meta string, err error) {
	if useInMemoryPaiperworkWhatsappRuntime() {
		return "", "", nil
	}
	if strings.TrimSpace(userKey) == "" {
		return "", "", nil
	}

	dbPath := sqliteURIPath(userWhatsappDBURI(userKey))
	if strings.TrimSpace(dbPath) == "" {
		return "", "", nil
	}

	db, err := openUserWhatsappDB(userKey, false)
	if err != nil {
		return "", "", err
	}
	defer db.Close()

	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS preferred_whatsapp_device (
			id INTEGER PRIMARY KEY CHECK (id = 1),
			device_id VARCHAR(255) DEFAULT '',
			meta TEXT DEFAULT '',
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`); err != nil {
		return "", "", err
	}

	var storedID, storedMeta string
	err = db.QueryRow(`
		SELECT COALESCE(device_id, ''), COALESCE(meta, '')
		FROM preferred_whatsapp_device
		WHERE id = 1
		LIMIT 1
	`).Scan(&storedID, &storedMeta)
	if err == sql.ErrNoRows {
		return "", "", nil
	}
	if err != nil {
		return "", "", err
	}

	return strings.TrimSpace(storedID), strings.TrimSpace(storedMeta), nil
}

func saveSelectedWhatsappDeviceToDB(userKey, deviceID, meta string) error {
	if useInMemoryPaiperworkWhatsappRuntime() {
		return nil
	}
	if strings.TrimSpace(userKey) == "" {
		return nil
	}

	dbPath := sqliteURIPath(userWhatsappDBURI(userKey))
	if strings.TrimSpace(dbPath) == "" {
		return nil
	}

	db, err := openUserWhatsappDB(userKey, false)
	if err != nil {
		return err
	}
	defer db.Close()

	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS preferred_whatsapp_device (
			id INTEGER PRIMARY KEY CHECK (id = 1),
			device_id VARCHAR(255) DEFAULT '',
			meta TEXT DEFAULT '',
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`); err != nil {
		return err
	}

	_, err = db.Exec(`
		INSERT INTO preferred_whatsapp_device (id, device_id, meta, updated_at)
		VALUES (1, ?, ?, CURRENT_TIMESTAMP)
		ON CONFLICT(id) DO UPDATE SET
			device_id = excluded.device_id,
			meta = excluded.meta,
			updated_at = CURRENT_TIMESTAMP
	`, strings.TrimSpace(deviceID), strings.TrimSpace(meta))

	return err
}

func ensureWhatsappReplayEventTable(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS whatsapp_replay_event (
			id INTEGER PRIMARY KEY,
			device_id VARCHAR(255) NOT NULL,
			chat_id VARCHAR(255) NOT NULL,
			from_id VARCHAR(255) DEFAULT '',
			message_hash VARCHAR(64) NOT NULL UNIQUE,
			message_timestamp VARCHAR(64) DEFAULT '',
			body_preview TEXT DEFAULT '',
			replay_count INTEGER NOT NULL DEFAULT 1,
			received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
	return err
}

func normalizeWhatsappReplayMessageHash(incoming whatsappIncomingMessage) string {
	h := sha256.New()
	parts := []string{
		strings.TrimSpace(incoming.DeviceID),
		strings.TrimSpace(incoming.ChatID),
		strings.TrimSpace(incoming.From),
		strings.TrimSpace(incoming.Timestamp),
		strings.TrimSpace(incoming.Body),
	}
	for _, part := range parts {
		h.Write([]byte(part))
		h.Write([]byte("|"))
	}
	return hex.EncodeToString(h.Sum(nil))
}

func saveWhatsappReplayEvent(userKey string, incoming whatsappIncomingMessage) error {
	if useInMemoryPaiperworkWhatsappRuntime() {
		return nil
	}
	if strings.TrimSpace(userKey) == "" {
		return nil
	}

	dbPath := sqliteURIPath(userWhatsappDBURI(userKey))
	if strings.TrimSpace(dbPath) == "" {
		return nil
	}

	db, err := openUserWhatsappDB(userKey, false)
	if err != nil {
		return err
	}
	defer db.Close()

	if err := ensureWhatsappReplayEventTable(db); err != nil {
		return err
	}

	messageHash := normalizeWhatsappReplayMessageHash(incoming)
	bodyPreview := strings.TrimSpace(incoming.Body)
	if len(bodyPreview) > 512 {
		bodyPreview = bodyPreview[:512]
	}

	_, err = db.Exec(`
		INSERT INTO whatsapp_replay_event (
			device_id,
			chat_id,
			from_id,
			message_hash,
			message_timestamp,
			body_preview,
			replay_count,
			received_at
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
		ON CONFLICT(message_hash) DO UPDATE SET
			replay_count = replay_count + 1,
			received_at = CURRENT_TIMESTAMP
	`, strings.TrimSpace(incoming.DeviceID), strings.TrimSpace(incoming.ChatID), strings.TrimSpace(incoming.From), messageHash, strings.TrimSpace(incoming.Timestamp), bodyPreview)

	return err
}

func clearWhatsappReplayHistoryForDevice(userKey, deviceID string) error {
	if useInMemoryPaiperworkWhatsappRuntime() {
		return nil
	}
	if strings.TrimSpace(userKey) == "" || strings.TrimSpace(deviceID) == "" {
		return nil
	}

	dbPath := sqliteURIPath(userWhatsappDBURI(userKey))
	if strings.TrimSpace(dbPath) == "" {
		return nil
	}

	db, err := openUserWhatsappDB(userKey, false)
	if err != nil {
		return err
	}
	defer db.Close()

	_, err = db.Exec(`DELETE FROM whatsapp_replay_event WHERE device_id = ?`, strings.TrimSpace(deviceID))
	if err != nil && strings.Contains(strings.ToLower(err.Error()), "no such table") {
		return nil
	}
	return err
}

func removeWhatsappSQLiteFile(path string) error {
	trimmed := strings.TrimSpace(path)
	if trimmed == "" {
		return nil
	}
	if err := os.Remove(trimmed); err != nil && !os.IsNotExist(err) {
		return err
	}
	_ = os.Remove(trimmed + "-wal")
	_ = os.Remove(trimmed + "-shm")
	return nil
}

func clearAllSQLiteTables(db *sql.DB) error {
	if db == nil {
		return nil
	}

	rows, err := db.Query(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`)
	if err != nil {
		return err
	}
	defer rows.Close()

	tables := make([]string, 0, 16)
	for rows.Next() {
		var table string
		if scanErr := rows.Scan(&table); scanErr != nil {
			return scanErr
		}
		table = strings.TrimSpace(table)
		if table != "" {
			tables = append(tables, table)
		}
	}
	if err := rows.Err(); err != nil {
		return err
	}

	tx, err := db.Begin()
	if err != nil {
		return err
	}

	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	if _, err := tx.Exec("PRAGMA foreign_keys = OFF"); err != nil {
		return err
	}

	for _, table := range tables {
		escaped := strings.ReplaceAll(table, `"`, `""`)
		statement := fmt.Sprintf(`DELETE FROM "%s"`, escaped)
		if _, err := tx.Exec(statement); err != nil {
			return err
		}
	}

	if _, err := tx.Exec("PRAGMA foreign_keys = ON"); err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		return err
	}
	committed = true
	return nil
}

func clearAllSQLiteTablesByURI(dbURI string) error {
	trimmedURI := strings.TrimSpace(dbURI)
	if trimmedURI == "" {
		return nil
	}

	db, err := sqliteutil.Open(trimmedURI)
	if err != nil {
		return err
	}
	defer db.Close()

	return clearAllSQLiteTables(db)
}

func clearPersistedWhatsappDataForUser(userKey string) error {
	trimmedUserKey := strings.TrimSpace(userKey)
	if trimmedUserKey == "" {
		return nil
	}

	if useInMemoryPaiperworkWhatsappRuntime() {
		if err := whatsappInfra.CleanupDatabase(); err != nil {
			return err
		}
		return nil
	}

	paths := []string{
		userWhatsappDBURI(trimmedUserKey),
		userWhatsappKeysDBURI(trimmedUserKey),
		fmt.Sprintf("file:storages/whatsapp_%s.db?_foreign_keys=on&_journal_mode=WAL&_busy_timeout=5000", safeUserKeyForFilename(trimmedUserKey)),
		fmt.Sprintf("file:storages/whatsapp_keys_%s.db?_foreign_keys=on&_journal_mode=WAL&_busy_timeout=5000", safeUserKeyForFilename(trimmedUserKey)),
	}

	seen := make(map[string]struct{}, len(paths))
	var firstErr error
	for _, dbURI := range paths {
		trimmedURI := strings.TrimSpace(dbURI)
		if trimmedURI == "" {
			continue
		}
		if _, ok := seen[trimmedURI]; ok {
			continue
		}
		seen[trimmedURI] = struct{}{}
		if err := clearAllSQLiteTablesByURI(trimmedURI); err != nil && firstErr == nil {
			firstErr = err
		}
	}

	return firstErr
}

func deletePersistedWhatsappDBFilesForUser(userKey string) error {
	trimmedUserKey := strings.TrimSpace(userKey)
	if trimmedUserKey == "" {
		return nil
	}

	paths := []string{
		userWhatsappDBPath(trimmedUserKey),
		sqliteURIPath(userWhatsappKeysDBURI(trimmedUserKey)),
		sqliteURIPath(fmt.Sprintf("file:storages/whatsapp_%s.db?_foreign_keys=on&_journal_mode=WAL&_busy_timeout=5000", safeUserKeyForFilename(trimmedUserKey))),
		sqliteURIPath(fmt.Sprintf("file:storages/whatsapp_keys_%s.db?_foreign_keys=on&_journal_mode=WAL&_busy_timeout=5000", safeUserKeyForFilename(trimmedUserKey))),
	}

	seen := make(map[string]struct{}, len(paths))
	var firstErr error
	for _, path := range paths {
		trimmedPath := strings.TrimSpace(path)
		if trimmedPath == "" {
			continue
		}
		if _, exists := seen[trimmedPath]; exists {
			continue
		}
		seen[trimmedPath] = struct{}{}

		if err := removeWhatsappSQLiteFile(trimmedPath); err != nil {
			if firstErr == nil {
				firstErr = err
			}
			continue
		}

		//log.Printf("deletePersistedWhatsappDBFilesForUser: removed persisted WhatsApp DB file %s (and sidecars) for user=%s", filepath.Base(trimmedPath), safeUserKeyForFilename(trimmedUserKey))
	}

	return firstErr
}

func clearWhatsappPersistedStateForUser(userKey, clearReason string) {
	trimmedUserKey := strings.TrimSpace(userKey)
	if trimmedUserKey == "" {
		return
	}
	referenceEntries := getSyncedPersistedWhatsappDevicesForUser(trimmedUserKey)

	if err := clearPersistedWhatsappDataForUser(trimmedUserKey); err != nil {
		log.Printf("clearWhatsappPersistedStateForUser: failed to clear persisted data for user=%s reason=%s: %v", safeUserKeyForFilename(trimmedUserKey), strings.TrimSpace(clearReason), err)
	}
	if err := deletePersistedWhatsappDBFilesForUser(trimmedUserKey); err != nil {
		log.Printf("clearWhatsappPersistedStateForUser: failed to remove persisted DB files for user=%s reason=%s: %v", safeUserKeyForFilename(trimmedUserKey), strings.TrimSpace(clearReason), err)
	}
	if err := whatsappInfra.ClearPersistedPairingData(strings.TrimSpace(clearReason)); err != nil {
		log.Printf("clearWhatsappPersistedStateForUser: failed to clear persisted pairing registry for user=%s reason=%s: %v", safeUserKeyForFilename(trimmedUserKey), strings.TrimSpace(clearReason), err)
	}

	setSyncedPersistedWhatsappDevicesForUser(trimmedUserKey, nil)
	if removedScopes := clearMatchingSyncedPersistedWhatsappFallbackScopes(trimmedUserKey, referenceEntries); len(removedScopes) > 0 {
		log.Printf("clearWhatsappPersistedStateForUser: cleared matching synced fallback scopes for user=%s reason=%s removed=%v", safeUserKeyForFilename(trimmedUserKey), strings.TrimSpace(clearReason), removedScopes)
	}
	syncPersistedWhatsappBootstrapEnv(trimmedUserKey)

	selectedWhatsappDeviceMu.Lock()
	delete(selectedWhatsappDevice, trimmedUserKey)
	selectedWhatsappDeviceMu.Unlock()

	if err := saveSelectedWhatsappDeviceToDB(trimmedUserKey, "", ""); err != nil {
		log.Printf("clearWhatsappPersistedStateForUser: failed to clear selected device for user=%s reason=%s: %v", safeUserKeyForFilename(trimmedUserKey), strings.TrimSpace(clearReason), err)
	}

	clearWhatsappGatewayDeviceResolutionCache()
	os.Unsetenv("PAIPERWORK_WHATSAPP_DEVICE_ID")
	os.Unsetenv("WHATSAPP_DEVICE_ID")
	config.WhatsappPreferredDeviceID = ""

	if activeWhatsappRuntimeScope() == normalizeWhatsappRuntimeScope(trimmedUserKey) {
		setActiveWhatsappUserScope("")
	}
}

func purgePersistedWhatsappDeviceForUser(userKey, deviceID string) error {
	trimmedUserKey := strings.TrimSpace(userKey)
	trimmedDeviceID := strings.TrimSpace(deviceID)
	if trimmedUserKey == "" || trimmedDeviceID == "" {
		return nil
	}

	var firstErr error
	recordErr := func(err error) {
		if err != nil && firstErr == nil {
			firstErr = err
		}
	}

	candidateDeviceIDs := make(map[string]struct{}, 4)
	candidateJIDs := make(map[string]struct{}, 4)
	candidatePhones := make(map[string]struct{}, 4)
	appendCandidateDeviceID := func(raw string) {
		trimmed := strings.TrimSpace(raw)
		if trimmed == "" {
			return
		}
		candidateDeviceIDs[trimmed] = struct{}{}
		if normalized := normalizeWhatsappIdentity(trimmed); normalized != "" {
			candidatePhones[normalized] = struct{}{}
		}
	}
	appendCandidateJID := func(raw string) {
		trimmed := strings.TrimSpace(raw)
		if trimmed == "" {
			return
		}
		candidateJIDs[trimmed] = struct{}{}
		if normalized := normalizeWhatsappIdentity(trimmed); normalized != "" {
			candidatePhones[normalized] = struct{}{}
		}
	}
	appendCandidatePhone := func(raw string) {
		if normalized := normalizeWhatsappIdentity(raw); normalized != "" {
			candidatePhones[normalized] = struct{}{}
		}
	}
	appendCandidateDeviceID(trimmedDeviceID)
	appendCandidateJID(trimmedDeviceID)
	appendCandidatePhone(trimmedDeviceID)
	if resolvedID, ok, err := resolvePersistedWhatsappDeviceID(trimmedUserKey, trimmedDeviceID); err != nil {
		recordErr(err)
	} else if ok {
		appendCandidateDeviceID(resolvedID)
	}
	markPurgedWhatsappWelcomeTargets(candidateDeviceIDs, candidateJIDs, candidatePhones)

	ctx := context.Background()

	resolvedManagerDeviceID := trimmedDeviceID
	for candidateID := range candidateDeviceIDs {
		if isPersistableWhatsappDeviceID(candidateID) {
			resolvedManagerDeviceID = candidateID
			break
		}
	}
	if dm := whatsappInfra.GetDeviceManager(); dm != nil {
		if inst, found := dm.GetDevice(resolvedManagerDeviceID); found && inst != nil {
			inst.UpdateStateFromClient()
			if inst.IsLoggedIn() || inst.IsConnected() {
				recordErr(dm.PurgeDevice(ctx, resolvedManagerDeviceID))
			} else {
				recordErr(dm.PurgeLoggedOutDevice(ctx, resolvedManagerDeviceID))
			}
		}
	}

	purgeChatStorageTables := func(db *sql.DB) {
		if db == nil {
			return
		}

		for candidateID := range candidateDeviceIDs {
			var storedJID string
			row := db.QueryRow(`SELECT COALESCE(jid, '') FROM devices WHERE device_id = ? LIMIT 1`, candidateID)
			if err := row.Scan(&storedJID); err != nil && !errors.Is(err, sql.ErrNoRows) {
				if !strings.Contains(strings.ToLower(err.Error()), "no such table") {
					recordErr(err)
				}
			}
			appendCandidateJID(storedJID)
			for _, statement := range []string{
				"DELETE FROM messages WHERE device_id = ?",
				"DELETE FROM chats WHERE device_id = ?",
				"DELETE FROM devices WHERE device_id = ?",
				"DELETE FROM whatsapp_replay_event WHERE device_id = ?",
				"UPDATE preferred_whatsapp_device SET device_id = '', meta = '', updated_at = CURRENT_TIMESTAMP WHERE device_id = ?",
			} {
				if _, err := db.Exec(statement, candidateID); err != nil {
					if strings.Contains(strings.ToLower(err.Error()), "no such table") {
						continue
					}
					recordErr(err)
				}
			}
		}

		for candidateJID := range candidateJIDs {
			if _, err := db.Exec("DELETE FROM devices WHERE jid = ?", candidateJID); err != nil {
				if !strings.Contains(strings.ToLower(err.Error()), "no such table") {
					recordErr(err)
				}
			}
		}

		for jid := range candidateJIDs {
			for _, statement := range []string{
				"DELETE FROM whatsmeow_identity_keys WHERE our_jid = ?",
				"DELETE FROM whatsmeow_sessions WHERE our_jid = ?",
				"DELETE FROM whatsmeow_sender_keys WHERE our_jid = ?",
				"DELETE FROM whatsmeow_pre_keys WHERE jid = ?",
				"DELETE FROM whatsmeow_app_state_sync_keys WHERE jid = ?",
				"DELETE FROM whatsmeow_app_state_version WHERE jid = ?",
				"DELETE FROM whatsmeow_app_state_mutation_macs WHERE jid = ?",
				"DELETE FROM whatsmeow_message_secrets WHERE our_jid = ?",
				"DELETE FROM whatsmeow_privacy_tokens WHERE our_jid = ?",
			} {
				if _, err := db.Exec(statement, jid); err != nil {
					if strings.Contains(strings.ToLower(err.Error()), "no such table") {
						continue
					}
					recordErr(err)
				}
			}
		}
	}

	purgeStoreDevice := func(dbURI string) {
		trimmedURI := strings.TrimSpace(dbURI)
		if trimmedURI == "" {
			return
		}

		db, err := sqliteutil.Open(trimmedURI)
		if err != nil {
			recordErr(err)
			return
		}
		defer db.Close()

		purgeChatStorageTables(db)
		log.Printf("purgePersistedWhatsappDeviceForUser: purged persisted WhatsApp device rows for %s user=%s", maskPhoneForLog(trimmedDeviceID), safeUserKeyForFilename(trimmedUserKey))
	}

	seenURIs := map[string]struct{}{}
	for _, dbURI := range []string{userWhatsappDBURI(trimmedUserKey), userWhatsappKeysDBURI(trimmedUserKey)} {
		trimmedURI := strings.TrimSpace(dbURI)
		if trimmedURI == "" {
			continue
		}
		if _, exists := seenURIs[trimmedURI]; exists {
			continue
		}
		seenURIs[trimmedURI] = struct{}{}
		purgeStoreDevice(trimmedURI)
	}

	selectedDeviceID := strings.TrimSpace(getSelectedWhatsappDeviceIDForUser(trimmedUserKey))
	selectedIdentity := normalizeWhatsappIdentity(selectedDeviceID)
	clearSelectedDevice := false
	for candidateID := range candidateDeviceIDs {
		if strings.EqualFold(candidateID, selectedDeviceID) || (selectedIdentity != "" && normalizeWhatsappIdentity(candidateID) == selectedIdentity) {
			clearSelectedDevice = true
			break
		}
	}
	if !clearSelectedDevice {
		for candidateJID := range candidateJIDs {
			if strings.EqualFold(candidateJID, selectedDeviceID) || (selectedIdentity != "" && normalizeWhatsappIdentity(candidateJID) == selectedIdentity) {
				clearSelectedDevice = true
				break
			}
		}
	}
	if !clearSelectedDevice && selectedIdentity != "" {
		for candidatePhone := range candidatePhones {
			if candidatePhone == selectedIdentity {
				clearSelectedDevice = true
				break
			}
		}
	}
	if clearSelectedDevice {
		setSelectedWhatsappDeviceForUser(trimmedUserKey, "", "")
	}

	return firstErr
}

type persistedWhatsappDeviceEntry struct {
	ID          string `json:"id"`
	PhoneNumber string `json:"phone_number,omitempty"`
	DisplayName string `json:"display_name,omitempty"`
	State       string `json:"state"`
	JID         string `json:"jid,omitempty"`
	CreatedAt   string `json:"created_at,omitempty"`
}

func persistedWhatsappDeviceAccountKey(deviceID, jid string) string {
	candidate := strings.TrimSpace(jid)
	if candidate == "" {
		candidate = strings.TrimSpace(deviceID)
	}
	if candidate == "" {
		return ""
	}
	if at := strings.Index(candidate, "@"); at >= 0 {
		candidate = candidate[:at]
	}
	if colon := strings.Index(candidate, ":"); colon >= 0 {
		candidate = candidate[:colon]
	}
	return strings.TrimSpace(strings.ToLower(candidate))
}

func persistedWhatsappDeviceKey(deviceID, jid string) string {
	if key := persistedWhatsappDeviceAccountKey(deviceID, jid); key != "" {
		return key
	}
	trimmedJID := strings.TrimSpace(strings.ToLower(jid))
	if trimmedJID != "" {
		return trimmedJID
	}
	return strings.TrimSpace(strings.ToLower(deviceID))
}

func mergePersistedWhatsappDeviceEntry(entries map[string]persistedWhatsappDeviceEntry, order *[]string, entry persistedWhatsappDeviceEntry) {
	entry.ID = strings.TrimSpace(entry.ID)
	entry.JID = strings.TrimSpace(entry.JID)
	entry.PhoneNumber = normalizeWhatsappIdentity(entry.PhoneNumber)
	entry.DisplayName = strings.TrimSpace(entry.DisplayName)
	entry.State = strings.TrimSpace(entry.State)
	entry.CreatedAt = strings.TrimSpace(entry.CreatedAt)
	if entry.State == "" {
		entry.State = "disconnected"
	}
	if entry.PhoneNumber == "" {
		entry.PhoneNumber = normalizeWhatsappIdentity(entry.JID)
	}
	if entry.ID == "" && entry.JID == "" {
		return
	}

	key := persistedWhatsappDeviceKey(entry.ID, entry.JID)
	if key == "" {
		return
	}

	current, exists := entries[key]
	if !exists {
		entries[key] = entry
		*order = append(*order, key)
		return
	}

	if current.ID == "" {
		current.ID = entry.ID
	}
	if current.JID == "" {
		current.JID = entry.JID
	}
	if current.PhoneNumber == "" {
		current.PhoneNumber = entry.PhoneNumber
	}
	if current.DisplayName == "" {
		current.DisplayName = entry.DisplayName
	}
	if current.CreatedAt == "" {
		current.CreatedAt = entry.CreatedAt
	}
	if current.State == "" || current.State == "disconnected" {
		current.State = entry.State
	}
	entries[key] = current
}

func normalizedSyncedPersistedWhatsappDevices(entries []persistedWhatsappDeviceEntry) []persistedWhatsappDeviceEntry {
	merged := make(map[string]persistedWhatsappDeviceEntry)
	order := make([]string, 0, len(entries))
	for _, entry := range entries {
		entry.ID = strings.TrimSpace(entry.ID)
		entry.JID = strings.TrimSpace(entry.JID)
		if entry.ID == "" {
			continue
		}
		mergePersistedWhatsappDeviceEntry(merged, &order, entry)
	}

	devices := make([]persistedWhatsappDeviceEntry, 0, len(order))
	for _, key := range order {
		entry, ok := merged[key]
		if !ok {
			continue
		}
		devices = append(devices, entry)
	}
	return devices
}

func getSyncedPersistedWhatsappDevicesForUser(userKey string) []persistedWhatsappDeviceEntry {
	scope := normalizeWhatsappRuntimeScope(userKey)
	if scope == "" {
		return nil
	}

	syncedPersistedWhatsappDevicesMu.RLock()
	entries := syncedPersistedWhatsappDevicesByUser[scope]
	syncedPersistedWhatsappDevicesMu.RUnlock()
	if len(entries) == 0 {
		return nil
	}

	cloned := make([]persistedWhatsappDeviceEntry, len(entries))
	copy(cloned, entries)
	return cloned
}

func getUniqueSyncedPersistedWhatsappDevicesFallback(userKey string) ([]persistedWhatsappDeviceEntry, string) {
	targetScope := normalizeWhatsappRuntimeScope(userKey)

	syncedPersistedWhatsappDevicesMu.RLock()
	defer syncedPersistedWhatsappDevicesMu.RUnlock()

	fallbackScope := ""
	var fallbackEntries []persistedWhatsappDeviceEntry
	for scope, entries := range syncedPersistedWhatsappDevicesByUser {
		if scope == "" || scope == targetScope || len(entries) == 0 {
			continue
		}
		if fallbackScope != "" {
			return nil, ""
		}
		fallbackScope = scope
		fallbackEntries = entries
	}
	if fallbackScope == "" || len(fallbackEntries) == 0 {
		return nil, ""
	}

	cloned := make([]persistedWhatsappDeviceEntry, len(fallbackEntries))
	copy(cloned, fallbackEntries)
	return cloned, fallbackScope
}

func setSyncedPersistedWhatsappDevicesForUser(userKey string, entries []persistedWhatsappDeviceEntry) {
	scope := normalizeWhatsappRuntimeScope(userKey)
	if scope == "" {
		return
	}

	normalized := normalizedSyncedPersistedWhatsappDevices(entries)
	//log.Printf("setSyncedPersistedWhatsappDevicesForUser: user=%s received=%d normalized=%d", safeUserKeyForFilename(userKey), len(entries), len(normalized))
	syncedPersistedWhatsappDevicesMu.Lock()
	if len(normalized) == 0 {
		delete(syncedPersistedWhatsappDevicesByUser, scope)
	} else {
		syncedPersistedWhatsappDevicesByUser[scope] = normalized
	}
	syncedPersistedWhatsappDevicesMu.Unlock()

	activeWhatsappUserMu.RLock()
	currentActiveUser := activeWhatsappUser
	activeWhatsappUserMu.RUnlock()
	if normalizeWhatsappRuntimeScope(currentActiveUser) == scope {
		syncPersistedWhatsappBootstrapEnv(userKey)
	}
}

func persistedWhatsappEntriesFingerprint(entries []persistedWhatsappDeviceEntry) string {
	normalized := normalizedSyncedPersistedWhatsappDevices(entries)
	if len(normalized) == 0 {
		return ""
	}

	parts := make([]string, 0, len(normalized))
	for _, entry := range normalized {
		parts = append(parts, strings.ToLower(strings.TrimSpace(entry.ID))+"|"+strings.ToLower(strings.TrimSpace(entry.JID))+"|"+normalizeWhatsappIdentity(entry.PhoneNumber))
	}
	slices.Sort(parts)
	return strings.Join(parts, ";")
}

func clearMatchingSyncedPersistedWhatsappFallbackScopes(userKey string, referenceEntries []persistedWhatsappDeviceEntry) []string {
	targetScope := normalizeWhatsappRuntimeScope(userKey)
	referenceFingerprint := persistedWhatsappEntriesFingerprint(referenceEntries)
	if targetScope == "" || referenceFingerprint == "" {
		return nil
	}

	removedScopes := make([]string, 0)
	syncedPersistedWhatsappDevicesMu.Lock()
	for scope, entries := range syncedPersistedWhatsappDevicesByUser {
		if scope == "" || scope == targetScope || len(entries) == 0 {
			continue
		}
		if persistedWhatsappEntriesFingerprint(entries) != referenceFingerprint {
			continue
		}
		delete(syncedPersistedWhatsappDevicesByUser, scope)
		removedScopes = append(removedScopes, scope)
	}
	syncedPersistedWhatsappDevicesMu.Unlock()
	return removedScopes
}

func syncPersistedWhatsappBootstrapEnv(userKey string) {
	entries := getSyncedPersistedWhatsappDevicesForUser(userKey)
	if len(entries) == 0 {
		if fallbackEntries, _ := getUniqueSyncedPersistedWhatsappDevicesFallback(userKey); len(fallbackEntries) > 0 {
			entries = fallbackEntries
			// suppressed to reduce noisy bootstrap logging
		}
	}
	if len(entries) == 0 {
		// suppressed to reduce noisy bootstrap logging
		os.Unsetenv(whatsappPersistedDevicesBootstrapEnv)
		return
	}

	payload, err := json.Marshal(entries)
	if err != nil {
		log.Printf("syncPersistedWhatsappBootstrapEnv: failed to marshal persisted device bootstrap payload for user=%s: %v", safeUserKeyForFilename(userKey), err)
		return
	}
	os.Setenv(whatsappPersistedDevicesBootstrapEnv, string(payload))
	//log.Printf("syncPersistedWhatsappBootstrapEnv: user=%s exported=%d payload_bytes=%d", safeUserKeyForFilename(userKey), len(entries), len(payload))
}

func loadPersistedWhatsappDevicesFromDB(userKey string) ([]persistedWhatsappDeviceEntry, error) {
	if useInMemoryPaiperworkWhatsappRuntime() {
		synced := getSyncedPersistedWhatsappDevicesForUser(userKey)
		if len(synced) == 0 {
			if fallbackEntries, _ := getUniqueSyncedPersistedWhatsappDevicesFallback(userKey); len(fallbackEntries) > 0 {
				//log.Printf("loadPersistedWhatsappDevicesFromDB: user=%s source=synced-unique-fallback fallback_user=%s count=%d", safeUserKeyForFilename(userKey), safeUserKeyForFilename(fallbackScope), len(fallbackEntries))
				return fallbackEntries, nil
			}
		}
		//log.Printf("loadPersistedWhatsappDevicesFromDB: user=%s source=synced-in-memory count=%d", safeUserKeyForFilename(userKey), len(synced))
		return synced, nil
	}
	if strings.TrimSpace(userKey) == "" {
		return []persistedWhatsappDeviceEntry{}, nil
	}

	dbPath := sqliteURIPath(userWhatsappDBURI(userKey))
	if strings.TrimSpace(dbPath) == "" {
		return []persistedWhatsappDeviceEntry{}, nil
	}

	db, err := openUserWhatsappDB(userKey, true)
	if err != nil {
		errText := strings.ToLower(err.Error())
		if strings.Contains(errText, "no such file") || strings.Contains(errText, "unable to open database file") {
			return []persistedWhatsappDeviceEntry{}, nil
		}
		return nil, err
	}
	defer db.Close()

	entries := make(map[string]persistedWhatsappDeviceEntry)
	order := make([]string, 0)

	rows, err := db.Query(`
		SELECT COALESCE(device_id, ''), COALESCE(display_name, ''), COALESCE(jid, ''), COALESCE(CAST(created_at AS TEXT), '')
		FROM devices
		ORDER BY created_at ASC, device_id ASC
	`)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "no such table") {
			rows = nil
		} else {
			return nil, err
		}
	}
	if rows != nil {
		defer rows.Close()
		for rows.Next() {
			var deviceID, displayName, jid, createdAt string
			if err := rows.Scan(&deviceID, &displayName, &jid, &createdAt); err != nil {
				return nil, err
			}
			mergePersistedWhatsappDeviceEntry(entries, &order, persistedWhatsappDeviceEntry{
				ID:          deviceID,
				DisplayName: displayName,
				PhoneNumber: normalizeWhatsappIdentity(jid),
				State:       "disconnected",
				JID:         jid,
				CreatedAt:   createdAt,
			})
		}
		if err := rows.Err(); err != nil {
			return nil, err
		}
	}

	devices := make([]persistedWhatsappDeviceEntry, 0, len(entries))
	for _, key := range order {
		entry, ok := entries[key]
		if !ok {
			continue
		}
		devices = append(devices, entry)
	}

	sort.SliceStable(devices, func(i, j int) bool {
		leftCreated := strings.TrimSpace(devices[i].CreatedAt)
		rightCreated := strings.TrimSpace(devices[j].CreatedAt)
		if leftCreated != rightCreated {
			if leftCreated == "" {
				return false
			}
			if rightCreated == "" {
				return true
			}
			return leftCreated < rightCreated
		}
		return devices[i].ID < devices[j].ID
	})

	if len(devices) == 0 {
		if synced := getSyncedPersistedWhatsappDevicesForUser(userKey); len(synced) > 0 {
			//log.Printf("loadPersistedWhatsappDevicesFromDB: user=%s source=synced-fallback count=%d", safeUserKeyForFilename(userKey), len(synced))
			return synced, nil
		}
		if fallbackEntries, _ := getUniqueSyncedPersistedWhatsappDevicesFallback(userKey); len(fallbackEntries) > 0 {
			//log.Printf("loadPersistedWhatsappDevicesFromDB: user=%s source=synced-unique-fallback fallback_user=%s count=%d", safeUserKeyForFilename(userKey), safeUserKeyForFilename(fallbackScope), len(fallbackEntries))
			return fallbackEntries, nil
		}
	}

	//log.Printf("loadPersistedWhatsappDevicesFromDB: user=%s source=sqlite count=%d", safeUserKeyForFilename(userKey), len(devices))

	return devices, nil
}

func resolvePersistedWhatsappDeviceID(userKey, requestedID string) (string, bool, error) {
	requested := strings.TrimSpace(requestedID)
	if requested == "" || strings.TrimSpace(userKey) == "" {
		return "", false, nil
	}

	persistedDevices, err := loadPersistedWhatsappDevicesFromDB(userKey)
	if err != nil {
		return "", false, err
	}

	normalizedRequested := normalizeWhatsappIdentity(requested)
	for _, entry := range persistedDevices {
		candidate := strings.TrimSpace(entry.ID)
		if candidate == "" {
			continue
		}
		if strings.EqualFold(candidate, requested) {
			return candidate, true, nil
		}
		if normalizeWhatsappIdentity(candidate) == normalizedRequested {
			return candidate, true, nil
		}
		if normalizeWhatsappIdentity(entry.JID) == normalizedRequested {
			return candidate, true, nil
		}
		if normalizeWhatsappIdentity(entry.PhoneNumber) == normalizedRequested {
			return candidate, true, nil
		}
	}

	return "", false, nil
}

func selectReplacementWhatsappDeviceID(userKey, removedDeviceID string) string {
	trimmedUserKey := strings.TrimSpace(userKey)
	trimmedRemovedDeviceID := strings.TrimSpace(removedDeviceID)
	if trimmedUserKey == "" {
		return ""
	}

	persistedDevices, err := loadPersistedWhatsappDevicesFromDB(trimmedUserKey)
	if err != nil {
		log.Printf("selectReplacementWhatsappDeviceID: failed to load persisted devices for user=%s removed=%s: %v", safeUserKeyForFilename(trimmedUserKey), maskPhoneForLog(trimmedRemovedDeviceID), err)
		return ""
	}

	removedKey := normalizeWhatsappIdentity(trimmedRemovedDeviceID)
	for _, entry := range persistedDevices {
		candidateID := strings.TrimSpace(entry.ID)
		if candidateID == "" {
			continue
		}
		if strings.EqualFold(candidateID, trimmedRemovedDeviceID) {
			continue
		}
		if removedKey != "" {
			candidateKeys := []string{
				normalizeWhatsappIdentity(candidateID),
				normalizeWhatsappIdentity(strings.TrimSpace(entry.JID)),
				normalizeWhatsappIdentity(strings.TrimSpace(entry.PhoneNumber)),
			}
			matchedRemoved := false
			for _, candidateKey := range candidateKeys {
				if candidateKey != "" && candidateKey == removedKey {
					matchedRemoved = true
					break
				}
			}
			if matchedRemoved {
				continue
			}
		}
		return candidateID
	}

	return ""
}

func firstNonEmptyString(values ...string) string {
	for _, value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed != "" {
			return trimmed
		}
	}
	return ""
}

func newWhatsappPlaceholderDeviceID() string {
	b := make([]byte, 16)
	if _, err := crand.Read(b); err != nil {
		for i := range b {
			b[i] = byte(rand.Intn(256))
		}
	}
	return fmt.Sprintf("pw-%s", hex.EncodeToString(b))
}

func getRequestedWhatsappDeviceIDFromRequest(r *http.Request) string {
	if r == nil {
		return ""
	}

	deviceID := strings.TrimSpace(r.URL.Query().Get("device_id"))
	if deviceID != "" {
		if isWhatsappFreshPairRequested(r) {
			if !shouldAcceptFreshPairDeviceCandidate(deviceID) {
				//log.Printf("getRequestedWhatsappDeviceIDFromRequest: ignoring stale fresh-pair device candidate %s without an active QR probe", maskPhoneForLog(deviceID))
			} else {
				return deviceID
			}
		} else if !isPersistableWhatsappDeviceID(deviceID) {
			userKey := resolveWhatsappUserKeyFromRequest(r)
			if userKey != "" {
				resolvedID, ok, err := resolvePersistedWhatsappDeviceID(userKey, deviceID)
				if err == nil && ok && resolvedID != "" {
					return resolvedID
				}
			}
			logScope := fmt.Sprintf("ignored-non-persistable:%s:%s", safeUserKeyForFilename(userKey), strings.ToLower(strings.TrimSpace(deviceID)))
			if shouldEmitWhatsappRateLimitedLog(logScope, whatsappGatewayPollNoiseCooldown) {
				//log.Printf("getRequestedWhatsappDeviceIDFromRequest: ignoring non-persistable device candidate %s", maskPhoneForLog(deviceID))
			}
		} else {
			return deviceID
		}
	}

	return ""
}

func getSelectedWhatsappDeviceIDForUser(userKey string) string {
	if strings.TrimSpace(userKey) == "" {
		return ""
	}

	scope := normalizeWhatsappRuntimeScope(userKey)
	selectedWhatsappDeviceMu.RLock()
	selectedEntry := selectedWhatsappDevice[scope]
	selectedWhatsappDeviceMu.RUnlock()
	if selectedEntry != nil {
		if deviceID := strings.TrimSpace(selectedEntry["device_id"]); deviceID != "" {
			return deviceID
		}
	}

	deviceID, _, err := loadSelectedWhatsappDeviceFromDB(userKey)
	if err != nil {
		log.Printf("getSelectedWhatsappDeviceIDForUser: failed to load selected device for user=%s: %v", safeUserKeyForFilename(userKey), err)
		return ""
	}
	return strings.TrimSpace(deviceID)
}

func setSelectedWhatsappDeviceForUser(userKey, deviceID, meta string) {
	if strings.TrimSpace(userKey) == "" {
		return
	}
	trimmedDeviceID := strings.TrimSpace(deviceID)

	scope := normalizeWhatsappRuntimeScope(userKey)
	selectedWhatsappDeviceMu.Lock()
	routes := selectedWhatsappDevice[scope]
	if routes == nil {
		routes = map[string]string{}
		selectedWhatsappDevice[scope] = routes
	}
	routes["device_id"] = trimmedDeviceID
	routes["meta"] = strings.TrimSpace(meta)
	selectedWhatsappDeviceMu.Unlock()

	if normalizeWhatsappRuntimeScope(activeWhatsappRuntimeScope()) == scope {
		if trimmedDeviceID != "" {
			os.Setenv("PAIPERWORK_WHATSAPP_DEVICE_ID", trimmedDeviceID)
			os.Setenv("WHATSAPP_DEVICE_ID", trimmedDeviceID)
			config.WhatsappPreferredDeviceID = trimmedDeviceID
		} else {
			os.Unsetenv("PAIPERWORK_WHATSAPP_DEVICE_ID")
			os.Unsetenv("WHATSAPP_DEVICE_ID")
			config.WhatsappPreferredDeviceID = ""
		}
	}

	if err := saveSelectedWhatsappDeviceToDB(userKey, deviceID, meta); err != nil {
		log.Printf("setSelectedWhatsappDeviceForUser: failed to persist selected device for user=%s device=%s: %v", safeUserKeyForFilename(userKey), maskPhoneForLog(deviceID), err)
	}
}

func shouldAllowRuntimeWhatsappDevice(userKey, deviceID string) bool {
	selectedDeviceID := strings.TrimSpace(getSelectedWhatsappDeviceIDForUser(userKey))
	if selectedDeviceID == "" {
		return true
	}

	resolvedDeviceID := strings.TrimSpace(deviceID)
	if resolvedDeviceID == "" {
		return false
	}

	if strings.EqualFold(selectedDeviceID, resolvedDeviceID) {
		return true
	}

	return normalizeWhatsappIdentity(selectedDeviceID) == normalizeWhatsappIdentity(resolvedDeviceID)
}

func getRuntimeSelectedWhatsappDeviceID(userKey string) string {
	_ = userKey
	return ""
}

func isWhatsappFreshPairRequested(r *http.Request) bool {
	if r == nil {
		return false
	}
	return strings.TrimSpace(strings.ToLower(r.URL.Query().Get("fresh_pair"))) == "true"
}

func resolveWhatsappUserKeyFromRequest(r *http.Request) string {
	if r == nil {
		return ""
	}
	userKey := strings.TrimSpace(r.URL.Query().Get("user"))
	if userKey == "" {
		userKey = strings.TrimSpace(r.Header.Get("X-Paiperwork-User"))
	}
	return userKey
}

func normalizeWhatsappIncomingQueueScope(userKey string) string {
	trimmed := strings.TrimSpace(userKey)
	if trimmed == "" {
		return whatsappIncomingQueueDefaultScope
	}
	return trimmed
}

func activeWhatsappIncomingQueueScope() string {
	activeWhatsappUserMu.RLock()
	currentActiveUser := activeWhatsappUser
	activeWhatsappUserMu.RUnlock()
	return normalizeWhatsappIncomingQueueScope(currentActiveUser)
}

func normalizeWhatsappRuntimeScope(userKey string) string {
	return normalizeWhatsappIncomingQueueScope(userKey)
}

func activeWhatsappRuntimeScope() string {
	activeWhatsappUserMu.RLock()
	currentActiveUser := activeWhatsappUser
	activeWhatsappUserMu.RUnlock()
	return normalizeWhatsappRuntimeScope(currentActiveUser)
}

func normalizeWhatsappChatRouteKey(chatTarget string) string {
	trimmed := strings.TrimSpace(strings.ToLower(chatTarget))
	if trimmed == "" {
		return ""
	}
	if strings.HasSuffix(trimmed, "@g.us") {
		return trimmed
	}
	return normalizeWhatsappIdentity(trimmed)
}

func rememberWhatsappChatDeviceRoute(userKey, deviceID string, chatTargets ...string) {
	trimmedDeviceID := strings.TrimSpace(deviceID)
	if trimmedDeviceID == "" {
		return
	}
	scope := normalizeWhatsappRuntimeScope(userKey)
	whatsappChatDeviceRoutesMu.Lock()
	routes := whatsappChatDeviceRoutesByUser[scope]
	if routes == nil {
		routes = make(map[string]string)
		whatsappChatDeviceRoutesByUser[scope] = routes
	}
	for _, chatTarget := range chatTargets {
		key := normalizeWhatsappChatRouteKey(chatTarget)
		if key == "" {
			continue
		}
		routes[key] = trimmedDeviceID
	}
	whatsappChatDeviceRoutesMu.Unlock()
}

func resolveWhatsappChatDeviceRoute(userKey string, chatTargets ...string) string {
	scope := normalizeWhatsappRuntimeScope(userKey)
	whatsappChatDeviceRoutesMu.RLock()
	routes := whatsappChatDeviceRoutesByUser[scope]
	for _, chatTarget := range chatTargets {
		key := normalizeWhatsappChatRouteKey(chatTarget)
		if key == "" {
			continue
		}
		if deviceID := strings.TrimSpace(routes[key]); deviceID != "" {
			if !shouldAllowRuntimeWhatsappDevice(userKey, deviceID) {
				continue
			}
			whatsappChatDeviceRoutesMu.RUnlock()
			return deviceID
		}
	}
	whatsappChatDeviceRoutesMu.RUnlock()
	return ""
}

func resolveWhatsappChatDeviceRouteWithGateway(client *http.Client, userKey string, chatTargets ...string) string {
	routedDeviceID := strings.TrimSpace(resolveWhatsappChatDeviceRoute(userKey, chatTargets...))
	if routedDeviceID == "" {
		return ""
	}

	selectedDeviceID := strings.TrimSpace(getSelectedWhatsappDeviceIDForUser(userKey))
	if selectedDeviceID != "" && normalizeWhatsappIdentity(selectedDeviceID) == normalizeWhatsappIdentity(routedDeviceID) {
		return selectedDeviceID
	}

	if client == nil {
		return routedDeviceID
	}

	if resolvedID, _, err := resolveWhatsappGatewayRegisteredDeviceID(client, routedDeviceID); err == nil && strings.TrimSpace(resolvedID) != "" {
		return strings.TrimSpace(resolvedID)
	}

	if candidateIDs, err := resolveWhatsappGatewayDeviceCandidatesByIdentity(client, routedDeviceID); err == nil {
		fallbackID := ""
		for _, candidateID := range candidateIDs {
			trimmedCandidateID := strings.TrimSpace(candidateID)
			if trimmedCandidateID == "" {
				continue
			}
			if fallbackID == "" {
				fallbackID = trimmedCandidateID
			}
			if status, statusErr := fetchWhatsappGatewayConnectionStatus(client, trimmedCandidateID); statusErr == nil && status != nil && (status.Connected || status.LoggedIn) {
				return trimmedCandidateID
			}
		}
		if fallbackID != "" {
			return fallbackID
		}
	}

	return routedDeviceID
}

func setWhatsappRemoteLogoutNotice(deviceID, message string) {
	whatsappRemoteLogoutMu.Lock()
	whatsappRemoteLogoutState = &whatsappRemoteLogoutNotice{
		DeviceID:   strings.TrimSpace(deviceID),
		Message:    strings.TrimSpace(message),
		OccurredAt: time.Now(),
	}
	whatsappRemoteLogoutMu.Unlock()
}

func clearWhatsappRemoteLogoutNotice() {
	whatsappRemoteLogoutMu.Lock()
	whatsappRemoteLogoutState = nil
	whatsappRemoteLogoutMu.Unlock()
}

func getWhatsappRemoteLogoutNotice() *whatsappRemoteLogoutNotice {
	whatsappRemoteLogoutMu.RLock()
	defer whatsappRemoteLogoutMu.RUnlock()
	if whatsappRemoteLogoutState == nil {
		return nil
	}
	cloned := *whatsappRemoteLogoutState
	return &cloned
}

func setActiveWhatsappUserScope(userKey string) {
	trimmed := strings.TrimSpace(userKey)
	activeWhatsappUserMu.Lock()
	activeWhatsappUser = trimmed
	activeWhatsappUserMu.Unlock()
	if trimmed == "" {
		os.Unsetenv(whatsappActiveUserEnv)
		return
	}
	os.Setenv(whatsappActiveUserEnv, trimmed)
}

func isWhatsappSessionRestoreExpected() bool {
	return strings.EqualFold(strings.TrimSpace(os.Getenv(whatsappExpectedSessionRestoreEnv)), "true")
}

func setWhatsappSessionRestoreExpected(expected bool) {
	if expected {
		os.Setenv(whatsappExpectedSessionRestoreEnv, "true")
		return
	}
	os.Unsetenv(whatsappExpectedSessionRestoreEnv)
}

func enqueueWhatsappIncomingMessage(userKey string, incoming whatsappIncomingMessage) {
	scope := normalizeWhatsappIncomingQueueScope(userKey)
	whatsappIncomingMu.Lock()
	queue := append(whatsappIncomingQueueByUser[scope], incoming)
	if len(queue) > 500 {
		queue = queue[len(queue)-500:]
	}
	whatsappIncomingQueueByUser[scope] = queue
	whatsappIncomingMu.Unlock()
}

func drainWhatsappIncomingMessages(userKey string) []whatsappIncomingMessage {
	scope := normalizeWhatsappIncomingQueueScope(userKey)
	whatsappIncomingMu.Lock()
	msgs := whatsappIncomingQueueByUser[scope]
	delete(whatsappIncomingQueueByUser, scope)
	whatsappIncomingMu.Unlock()
	return msgs
}

func enforceWhatsappActiveUserAccess(w http.ResponseWriter, r *http.Request, requireGatewayRunning bool) (string, bool) {
	userKey := resolveWhatsappUserKeyFromRequest(r)
	activeWhatsappUserMu.RLock()
	currentActiveUser := activeWhatsappUser
	activeWhatsappUserMu.RUnlock()

	if currentActiveUser == "" {
		return userKey, true
	}

	if requireGatewayRunning && !isGatewayRunning() {
		return userKey, true
	}

	if userKey != "" && userKey == currentActiveUser {
		return userKey, true
	}

	requestedScope := safeUserKeyForFilename(userKey)
	activeScope := safeUserKeyForFilename(currentActiveUser)
	//log.Printf("enforceWhatsappActiveUserAccess: rejecting request active=%s requested=%s gatewayRunning=%v requireGatewayRunning=%v path=%s", activeScope, requestedScope, isGatewayRunning(), requireGatewayRunning, r.URL.Path)

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusConflict)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"error":          "user mismatch",
		"message":        "WhatsApp gateway already active for another user. Stop and restart with current user key.",
		"activeScope":    activeScope,
		"requestedScope": requestedScope,
	})
	return userKey, false
}

var whatsappGatewayLastLoginAttempt time.Time
var whatsappGatewayLoginCooldown = 20 * time.Second
var whatsappGatewayStartupWarmup = 35 * time.Second
var whatsappPairingProbeCooldown = 8 * time.Second
var whatsappGatewayPollNoiseCooldown = 10 * time.Second

var whatsappGatewayWarmupMessageMu sync.Mutex
var whatsappGatewayWarmupMessageLogged = make(map[string]struct{})
var whatsappGatewayRateLimitedLogMu sync.Mutex
var whatsappGatewayRateLimitedLogAt = make(map[string]time.Time)

func shouldEmitWhatsappRateLimitedLog(scope string, cooldown time.Duration) bool {
	trimmedScope := strings.TrimSpace(scope)
	if trimmedScope == "" {
		trimmedScope = "default"
	}
	if cooldown <= 0 {
		cooldown = whatsappGatewayPollNoiseCooldown
	}

	now := time.Now()
	whatsappGatewayRateLimitedLogMu.Lock()
	defer whatsappGatewayRateLimitedLogMu.Unlock()
	if lastLoggedAt, ok := whatsappGatewayRateLimitedLogAt[trimmedScope]; ok {
		if now.Sub(lastLoggedAt) < cooldown {
			return false
		}
	}
	whatsappGatewayRateLimitedLogAt[trimmedScope] = now
	return true
}

func shouldLogWhatsappGatewayWarmup(deviceID string) bool {
	if strings.TrimSpace(deviceID) == "" {
		return false
	}
	whatsappGatewayWarmupMessageMu.Lock()
	defer whatsappGatewayWarmupMessageMu.Unlock()
	if _, seen := whatsappGatewayWarmupMessageLogged[deviceID]; seen {
		return false
	}
	whatsappGatewayWarmupMessageLogged[deviceID] = struct{}{}
	return true
}

func clearWhatsappGatewayWarmup(deviceID string) {
	if strings.TrimSpace(deviceID) == "" {
		return
	}
	whatsappGatewayWarmupMessageMu.Lock()
	delete(whatsappGatewayWarmupMessageLogged, deviceID)
	whatsappGatewayWarmupMessageMu.Unlock()
}

type whatsappPairingProbeState struct {
	LastProbe time.Time
	AllowQR   bool
	Reason    string
}

var whatsappPairingProbeMu sync.Mutex
var whatsappPairingProbeByDevice = make(map[string]whatsappPairingProbeState)
var whatsappPlaceholderCreateMu sync.Mutex

func ensureSingleWhatsappGatewayPlaceholder(client *http.Client, requestedDeviceID, reason string) (string, error) {
	if client == nil {
		return "", fmt.Errorf("gateway client is nil")
	}

	whatsappPlaceholderCreateMu.Lock()
	defer whatsappPlaceholderCreateMu.Unlock()

	trimmedRequested := strings.TrimSpace(requestedDeviceID)
	if trimmedRequested == "" {
		if activeID := findActiveWhatsappPairingProbeID(); activeID != "" {
			markWhatsappPairingProbeState(activeID, firstNonEmptyString(strings.TrimSpace(reason), "placeholder-reuse-active-memory"))
			return activeID, nil
		}
	}

	devices, err := listWhatsappGatewayDevices(client)
	if err == nil {
		trimmedRequested := strings.TrimSpace(requestedDeviceID)
		if trimmedRequested != "" {
			for _, device := range devices {
				resolvedID := strings.TrimSpace(device.DeviceID)
				if resolvedID == "" {
					resolvedID = strings.TrimSpace(device.ID)
				}
				if resolvedID == "" {
					continue
				}
				aliases := []string{resolvedID, strings.TrimSpace(device.JID), strings.TrimSpace(device.PhoneNumber)}
				for _, alias := range aliases {
					if alias == "" {
						continue
					}
					if strings.EqualFold(alias, trimmedRequested) {
						markWhatsappPairingProbeState(resolvedID, firstNonEmptyString(strings.TrimSpace(reason), "placeholder-reuse-requested"))
						return resolvedID, nil
					}
				}
			}
		}

		for _, device := range devices {
			resolvedID := strings.TrimSpace(device.DeviceID)
			if resolvedID == "" {
				resolvedID = strings.TrimSpace(device.ID)
			}
			if resolvedID == "" {
				continue
			}
			if hasActiveWhatsappPairingProbe(resolvedID) {
				markWhatsappPairingProbeState(resolvedID, firstNonEmptyString(strings.TrimSpace(reason), "placeholder-reuse-active-probe"))
				return resolvedID, nil
			}
		}

		for _, device := range devices {
			resolvedID := strings.TrimSpace(device.DeviceID)
			if resolvedID == "" {
				resolvedID = strings.TrimSpace(device.ID)
			}
			if resolvedID != "" {
				markWhatsappPairingProbeState(resolvedID, firstNonEmptyString(strings.TrimSpace(reason), "placeholder-reuse-existing"))
				return resolvedID, nil
			}
		}
	}

	placeholderID := strings.TrimSpace(requestedDeviceID)
	if placeholderID == "" {
		placeholderID = newWhatsappPlaceholderDeviceID()
	}

	createBody := strings.NewReader(fmt.Sprintf(`{"device_id":"%s"}`, placeholderID))
	createResp, createErr := client.Post("http://127.0.0.1:3000/devices", "application/json", createBody)
	if createErr != nil {
		return "", createErr
	}
	defer createResp.Body.Close()

	if createResp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(createResp.Body, 4096))
		return "", fmt.Errorf("status=%d body=%s", createResp.StatusCode, strings.TrimSpace(string(body)))
	}

	var payload struct {
		Results struct {
			ID     string `json:"id"`
			Device string `json:"device"`
		} `json:"results"`
	}
	if derr := json.NewDecoder(createResp.Body).Decode(&payload); derr != nil {
		return "", derr
	}

	createdID := strings.TrimSpace(payload.Results.ID)
	if createdID == "" {
		createdID = strings.TrimSpace(payload.Results.Device)
	}
	if createdID == "" {
		createdID = placeholderID
	}
	if createdID == "" {
		return "", fmt.Errorf("created placeholder id is empty")
	}

	markWhatsappPairingProbeState(createdID, firstNonEmptyString(strings.TrimSpace(reason), "placeholder-created"))
	return createdID, nil
}

func snapshotGatewayStartState() (starting bool, lastAttempt time.Time) {
	gatewayStartMutex.Lock()
	defer gatewayStartMutex.Unlock()
	return gatewayStarting, gatewayLastStartAttempt
}

func setGatewayReady(ready bool) {
	gatewayStartMutex.Lock()
	gatewayReady = ready
	gatewayStartMutex.Unlock()
}

func isGatewayReady() bool {
	gatewayStartMutex.Lock()
	defer gatewayStartMutex.Unlock()
	return gatewayReady
}

func setActiveGateway(gateway string) {
	activeGatewayMu.Lock()
	activeGateway = gateway
	activeGatewayMu.Unlock()
}

func getActiveGateway() string {
	activeGatewayMu.RLock()
	defer activeGatewayMu.RUnlock()
	return activeGateway
}

func markWhatsappManualStopWindow(duration time.Duration) {
	whatsappManualStopMu.Lock()
	if duration <= 0 {
		whatsappManualStopUntil = time.Time{}
	} else {
		whatsappManualStopUntil = time.Now().Add(duration)
	}
	whatsappManualStopMu.Unlock()
}

func isWhatsappManualStopActive() bool {
	whatsappManualStopMu.RLock()
	until := whatsappManualStopUntil
	whatsappManualStopMu.RUnlock()
	return !until.IsZero() && time.Now().Before(until)
}

func shouldHoldQrDuringStartupWarmup(deviceID, selectedDeviceID string) bool {
	candidate := strings.TrimSpace(deviceID)
	if candidate == "" {
		candidate = strings.TrimSpace(selectedDeviceID)
	}
	if candidate == "" || !strings.Contains(candidate, "@") {
		return false
	}
	starting, lastAttempt := snapshotGatewayStartState()
	if lastAttempt.IsZero() {
		if starting {
			return true
		}
		return false
	}
	elapsed := time.Since(lastAttempt)
	if elapsed < 0 {
		return false
	}
	return elapsed < whatsappGatewayStartupWarmup
}

func clearWhatsappPairingProbeState(deviceID string) {
	trimmedID := strings.TrimSpace(deviceID)
	if trimmedID == "" {
		return
	}
	whatsappPairingProbeMu.Lock()
	delete(whatsappPairingProbeByDevice, trimmedID)
	whatsappPairingProbeMu.Unlock()
}

func markWhatsappPairingProbeState(deviceID, reason string) {
	trimmedID := strings.TrimSpace(deviceID)
	if trimmedID == "" {
		return
	}
	whatsappPairingProbeMu.Lock()
	whatsappPairingProbeByDevice[trimmedID] = whatsappPairingProbeState{
		LastProbe: time.Now(),
		AllowQR:   true,
		Reason:    strings.TrimSpace(reason),
	}
	whatsappPairingProbeMu.Unlock()
}

func hasActiveWhatsappPairingProbe(deviceID string) bool {
	trimmedID := strings.TrimSpace(deviceID)
	if trimmedID == "" {
		return false
	}
	whatsappPairingProbeMu.Lock()
	defer whatsappPairingProbeMu.Unlock()
	state, ok := whatsappPairingProbeByDevice[trimmedID]
	if !ok {
		return false
	}
	maxAge := whatsappGatewayQRTTL + 5*time.Second
	if maxAge <= 0 {
		maxAge = 25 * time.Second
	}
	if time.Since(state.LastProbe) > maxAge {
		delete(whatsappPairingProbeByDevice, trimmedID)
		return false
	}
	return state.AllowQR
}

func findActiveWhatsappPairingProbeID() string {
	whatsappPairingProbeMu.Lock()
	defer whatsappPairingProbeMu.Unlock()

	maxAge := whatsappGatewayQRTTL + 5*time.Second
	if maxAge <= 0 {
		maxAge = 25 * time.Second
	}

	for id, state := range whatsappPairingProbeByDevice {
		if time.Since(state.LastProbe) > maxAge {
			delete(whatsappPairingProbeByDevice, id)
			continue
		}
		if state.AllowQR {
			return id
		}
	}
	return ""
}

func shouldAcceptFreshPairDeviceCandidate(deviceID string) bool {
	trimmedID := strings.TrimSpace(deviceID)
	if trimmedID == "" {
		return false
	}
	return hasActiveWhatsappPairingProbe(trimmedID)
}

func classifyQrEligibilityByLoginFailure(statusCode int, code, message, bodyText string) (allowQR bool, networkRelated bool) {
	combined := strings.ToLower(strings.TrimSpace(code + " " + message + " " + bodyText))

	networkIndicators := []string{
		"connection refused",
		"connect: connection",
		"no route to host",
		"network is unreachable",
		"temporary failure in name resolution",
		"dial tcp",
		"i/o timeout",
		"context deadline exceeded",
		"gateway timeout",
		"timeout",
		"eof",
		"tls",
	}
	for _, marker := range networkIndicators {
		if strings.Contains(combined, marker) {
			return false, true
		}
	}

	if statusCode == http.StatusBadGateway || statusCode == http.StatusServiceUnavailable || statusCode == http.StatusGatewayTimeout {
		return false, true
	}

	explicitRemoteLogoutIndicators := []string{
		"remote logout",
		"remote_logout",
		"logged out from phone",
		"device unlinked from phone",
		"removed from phone whatsapp",
	}
	for _, marker := range explicitRemoteLogoutIndicators {
		if strings.Contains(combined, marker) {
			return true, false
		}
	}

	genericSessionIndicators := []string{
		"session deleted",
		"not logged in",
		"authentication_error",
		"authenticat",
		"device not found",
	}
	for _, marker := range genericSessionIndicators {
		if strings.Contains(combined, marker) {
			return false, false
		}
	}

	if strings.Contains(strings.ToUpper(strings.TrimSpace(code)), "SESSION_SAVED_ERROR") || strings.Contains(combined, "session have been saved") {
		return false, false
	}

	if strings.Contains(strings.ToUpper(strings.TrimSpace(code)), "ALREADY_LOGGED_IN") {
		return false, false
	}

	return false, false
}

func shouldAllowQrForPersistentDevice(client *http.Client, deviceID string, freshPairRequested bool) (bool, string) {
	_ = client
	if freshPairRequested {
		return true, "fresh-pair-request"
	}
	trimmedID := strings.TrimSpace(deviceID)
	if trimmedID == "" {
		return true, "no-device"
	}

	// Any explicit selected device candidate represents a previously remembered
	// Paiperwork pairing. Do not surface QR just because the gateway reports the
	// generic "session deleted / not logged in" path during reconnect startup.
	// Fresh pairing flows clear selected-device state before requesting QR.
	return false, "saved-device-awaiting-explicit-unpair"
}

func isWhatsappGatewayAlreadyLoggedInResponse(code, message string) bool {
	combined := strings.ToLower(strings.TrimSpace(code + " " + message))
	if combined == "" {
		return false
	}
	if strings.Contains(combined, "already_logged_in") {
		return true
	}
	return strings.Contains(combined, "already logged in")
}

func waitForWhatsappGatewayLoggedInStatus(client *http.Client, deviceID string, timeout time.Duration) (*whatsappGatewayStatus, error) {
	deadline := time.Now().Add(timeout)
	var lastStatus *whatsappGatewayStatus
	for {
		status, err := fetchWhatsappGatewayConnectionStatus(client, deviceID)
		if err == nil {
			lastStatus = status
			if status != nil && status.LoggedIn {
				return status, nil
			}
		}

		if time.Now().After(deadline) {
			break
		}
		time.Sleep(350 * time.Millisecond)
	}

	if lastStatus != nil {
		return lastStatus, nil
	}
	return fetchWhatsappGatewayConnectionStatus(client, deviceID)
}

func safeUserKeyForFilename(userKey string) string {
	if userKey == "" {
		return "default"
	}
	hash := sha256.Sum256([]byte(userKey))
	return hex.EncodeToString(hash[:8])
}

func safeUserKeyForDBFilename(userKey string) string {
	trimmed := strings.TrimSpace(userKey)
	if trimmed == "" {
		return "default"
	}
	var builder strings.Builder
	builder.Grow(len(trimmed))
	for _, r := range trimmed {
		switch {
		case (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9'):
			builder.WriteRune(r)
		case r == '-' || r == '_' || r == '.':
			builder.WriteRune(r)
		default:
			builder.WriteRune('_')
		}
	}
	result := strings.Trim(builder.String(), "._-")
	if result == "" {
		return safeUserKeyForFilename(userKey)
	}
	return result
}

func sqliteURIPath(raw string) string {
	trimmed := strings.TrimSpace(raw)
	trimmed = strings.Trim(trimmed, `"'`)
	trimmed = strings.TrimPrefix(trimmed, "file:")
	if idx := strings.Index(trimmed, "?"); idx >= 0 {
		trimmed = trimmed[:idx]
	}
	return trimmed
}

func fileExists(path string) bool {
	if strings.TrimSpace(path) == "" {
		return false
	}
	_, err := os.Stat(path)
	return err == nil
}

func copyFileIfMissing(srcPath, dstPath string) error {
	if srcPath == "" || dstPath == "" || fileExists(dstPath) {
		return nil
	}
	data, err := os.ReadFile(srcPath)
	if err != nil {
		return err
	}
	return os.WriteFile(dstPath, data, 0600)
}

func mergeSQLiteIntoTarget(targetPath, sourcePath string) error {
	if targetPath == "" || sourcePath == "" || !fileExists(targetPath) || !fileExists(sourcePath) {
		return nil
	}

	db, err := sqliteutil.Open(fmt.Sprintf("file:%s?_foreign_keys=on&_journal_mode=WAL&_busy_timeout=5000", targetPath))
	if err != nil {
		return err
	}
	defer db.Close()

	if _, err = db.Exec("ATTACH DATABASE ? AS legacy", sourcePath); err != nil {
		return err
	}
	defer func() {
		_, _ = db.Exec("DETACH DATABASE legacy")
	}()

	rows, err := db.Query(`
		SELECT name, COALESCE(sql, '')
		FROM legacy.sqlite_master
		WHERE type='table' AND name NOT LIKE 'sqlite_%'
	`)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var tableName, createSQL string
		if err := rows.Scan(&tableName, &createSQL); err != nil {
			return err
		}
		if strings.TrimSpace(tableName) == "" {
			continue
		}

		if createSQL != "" {
			createStmt := strings.Replace(createSQL, "CREATE TABLE ", "CREATE TABLE IF NOT EXISTS ", 1)
			if _, err := db.Exec(createStmt); err != nil {
				log.Printf("prepareUserWhatsappStore: failed to ensure table %s before merge: %v", tableName, err)
			}
		}

		columnRows, err := db.Query(fmt.Sprintf("PRAGMA legacy.table_info(%q)", tableName))
		if err != nil {
			return err
		}
		legacyColumns := make([]string, 0)
		for columnRows.Next() {
			var cid int
			var name, colType string
			var notNull, pk int
			var defaultValue any
			if err := columnRows.Scan(&cid, &name, &colType, &notNull, &defaultValue, &pk); err != nil {
				columnRows.Close()
				return err
			}
			legacyColumns = append(legacyColumns, name)
		}
		columnRows.Close()

		targetColumnRows, err := db.Query(fmt.Sprintf("PRAGMA main.table_info(%q)", tableName))
		if err != nil {
			return err
		}
		targetColumns := make(map[string]struct{}, len(legacyColumns))
		for targetColumnRows.Next() {
			var cid int
			var name, colType string
			var notNull, pk int
			var defaultValue any
			if err := targetColumnRows.Scan(&cid, &name, &colType, &notNull, &defaultValue, &pk); err != nil {
				targetColumnRows.Close()
				return err
			}
			targetColumns[name] = struct{}{}
		}
		targetColumnRows.Close()

		commonColumns := make([]string, 0, len(legacyColumns))
		for _, name := range legacyColumns {
			if _, ok := targetColumns[name]; ok {
				commonColumns = append(commonColumns, fmt.Sprintf("%q", name))
			}
		}
		if len(commonColumns) == 0 {
			continue
		}

		stmt := fmt.Sprintf(
			"INSERT OR REPLACE INTO main.%q (%s) SELECT %s FROM legacy.%q",
			tableName,
			strings.Join(commonColumns, ", "),
			strings.Join(commonColumns, ", "),
			tableName,
		)
		if _, err := db.Exec(stmt); err != nil {
			log.Printf("prepareUserWhatsappStore: failed to merge table %s from %s: %v", tableName, filepath.Base(sourcePath), err)
		}
	}

	return rows.Err()
}

func prepareUserWhatsappStore(userKey string) (string, string, error) {
	targetBase := safeUserKeyForDBFilename(userKey)
	targetPath := filepath.Join("storages", fmt.Sprintf("%s.whatsapp.db", targetBase))
	targetURI := fmt.Sprintf("file:%s?_foreign_keys=on&_journal_mode=WAL&_busy_timeout=5000&cache=shared", targetPath)

	if err := os.MkdirAll(filepath.Dir(targetPath), 0700); err != nil {
		return targetURI, targetURI, err
	}

	return targetURI, targetURI, nil
}

func userWhatsappDBURI(userKey string) string {
	if useInMemoryPaiperworkWhatsappRuntime() {
		return inMemoryPaiperworkWhatsappDBURI(userKey)
	}

	uri, _, err := prepareUserWhatsappStore(userKey)
	if err != nil {
		log.Printf("userWhatsappDBURI: failed to prepare Paiperwork WhatsApp DB for user=%s: %v", safeUserKeyForFilename(userKey), err)
		return fmt.Sprintf("file:storages/%s.whatsapp.db?_foreign_keys=on&_journal_mode=WAL&_busy_timeout=5000&cache=shared", safeUserKeyForDBFilename(userKey))
	}
	return uri
}

func userWhatsappKeysDBURI(userKey string) string {
	if useInMemoryPaiperworkWhatsappRuntime() {
		return inMemoryPaiperworkWhatsappDBURI(userKey)
	}

	_, uri, err := prepareUserWhatsappStore(userKey)
	if err != nil {
		log.Printf("userWhatsappKeysDBURI: failed to prepare Paiperwork WhatsApp key DB for user=%s: %v", safeUserKeyForFilename(userKey), err)
		return fmt.Sprintf("file:storages/%s.whatsapp.db?_foreign_keys=on&_journal_mode=WAL&_busy_timeout=5000&cache=shared", safeUserKeyForDBFilename(userKey))
	}
	return uri
}

func userWhatsappDBPath(userKey string) string {
	return sqliteURIPath(userWhatsappDBURI(userKey))
}

func openUserWhatsappDB(userKey string, readOnly bool) (*sql.DB, error) {
	if useInMemoryPaiperworkWhatsappRuntime() {
		return sqliteutil.Open(userWhatsappDBURI(userKey))
	}

	dbPath := userWhatsappDBPath(userKey)
	if strings.TrimSpace(dbPath) == "" {
		return nil, fmt.Errorf("user Whatsapp DB path is empty")
	}
	mode := "rwc"
	if readOnly {
		mode = "ro"
	}
	return sqliteutil.Open(fmt.Sprintf(
		"file:%s?mode=%s&cache=shared&_foreign_keys=on&_journal_mode=WAL&_busy_timeout=5000",
		dbPath,
		mode,
	))
}

func noCacheHandler(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		w.Header().Set("Pragma", "no-cache")
		w.Header().Set("Expires", "0")
		h.ServeHTTP(w, r)
	})
}

// validateOutboundURL restricts outbound requests to standard web URLs and blocks local/private targets.
func validateOutboundURL(rawURL string) (*url.URL, error) {
	parsedURL, err := url.Parse(strings.TrimSpace(rawURL))
	if err != nil {
		return nil, fmt.Errorf("invalid URL: %w", err)
	}

	if parsedURL.Scheme != "http" && parsedURL.Scheme != "https" {
		return nil, errors.New("only http and https URLs are allowed")
	}

	if parsedURL.Host == "" {
		return nil, errors.New("URL host is required")
	}

	hostname := parsedURL.Hostname()
	if hostname == "" {
		return nil, errors.New("URL hostname is required")
	}

	if strings.EqualFold(hostname, "localhost") {
		return nil, errors.New("localhost is not allowed")
	}

	if ip := net.ParseIP(hostname); ip != nil {
		if isDisallowedOutboundIP(ip) {
			return nil, errors.New("local/private network targets are not allowed")
		}
		return parsedURL, nil
	}

	ips, err := net.LookupIP(hostname)
	if err != nil {
		return nil, fmt.Errorf("failed to resolve host: %w", err)
	}

	if len(ips) == 0 {
		return nil, errors.New("host did not resolve to any IP address")
	}

	for _, ip := range ips {
		if isDisallowedOutboundIP(ip) {
			return nil, errors.New("resolved host points to a local/private network")
		}
	}

	return parsedURL, nil
}

func isDisallowedOutboundIP(ip net.IP) bool {
	return ip.IsLoopback() ||
		ip.IsPrivate() ||
		ip.IsLinkLocalMulticast() ||
		ip.IsLinkLocalUnicast() ||
		ip.IsMulticast() ||
		ip.IsUnspecified()
}

func proxyVersionCheck(w http.ResponseWriter, r *http.Request) {
	// Set CORS headers first - this ensures they're sent even if there's an error
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	// Handle preflight requests
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Log the request with a timestamp
	log.Printf("[%s] Version check request received", time.Now().Format(time.RFC3339))

	// Raw GitHub content URL - this is the correct format for accessing raw files
	cacheBuster := fmt.Sprintf("nocache=%d-%d", time.Now().UnixNano(), rand.Int63())
	versionUrl := fmt.Sprintf("https://raw.githubusercontent.com/Infinitai-cn/paiperwork/main/version.json?%s", cacheBuster)

	// Create an HTTP client with timeouts
	client := &http.Client{
		Timeout: 15 * time.Second,
		Transport: &http.Transport{
			DisableKeepAlives:   true, // Don't reuse connections
			TLSHandshakeTimeout: 10 * time.Second,
		},
	}

	// Create a new request
	req, err := http.NewRequest("GET", versionUrl, nil)
	if err != nil {
		log.Printf("Error creating request: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Add appropriate headers to make the request more reliable
	req.Header.Set("User-Agent", "Paiperwork-UpdateChecker/1.0")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Cache-Control", "no-cache")

	// Execute the request with detailed logging
	log.Printf("Fetching from GitHub: %s", versionUrl)
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error fetching version data: %v", err)

		// Provide a user-friendly error
		errorMsg := "Could not connect to update server. Please check your internet connection."
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable)
		fmt.Fprintf(w, `{"error":"%s"}`, errorMsg)
		return
	}
	defer resp.Body.Close()

	// Log response status
	log.Printf("GitHub response status: %d %s", resp.StatusCode, resp.Status)

	// Handle non-200 responses
	if resp.StatusCode != http.StatusOK {
		log.Printf("GitHub returned status %d", resp.StatusCode)
		w.WriteHeader(resp.StatusCode)
		fmt.Fprintf(w, `{"error":"Update server returned %s"}`, resp.Status)
		return
	}

	// Read body with size limit (prevent abuse)
	body, err := io.ReadAll(io.LimitReader(resp.Body, 1024*1024))
	if err != nil {
		log.Printf("Error reading response body: %v", err)
		http.Error(w, "Error reading version data", http.StatusInternalServerError)
		return
	}

	// Log successful response
	log.Printf("Successfully retrieved version data (%d bytes)", len(body))

	// Set content type header
	w.Header().Set("Content-Type", "application/json")

	// Write the response body to our client
	w.Write(body)
}

func proxyOllamaLibrary(w http.ResponseWriter, r *http.Request) {
	// Get the full path including model name if present
	path := r.URL.Path
	// Remove /api prefix when forwarding to ollama.com
	targetURL := "https://ollama.com" + strings.TrimPrefix(path, "/api")

	log.Printf("Proxying request from %s to: %s", path, targetURL)

	resp, err := http.Get(targetURL)
	if err != nil {
		log.Printf("Error fetching from Ollama: %v", err)
		http.Error(w, "Failed to fetch from Ollama", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// Copy response headers
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	io.Copy(w, resp.Body)
}

func normalizeOllamaAPIKey(raw string) string {
	key := strings.TrimSpace(raw)
	for {
		lower := strings.ToLower(key)
		if strings.HasPrefix(lower, "bearer ") {
			key = strings.TrimSpace(key[len("Bearer "):])
			continue
		}
		break
	}
	key = strings.Trim(key, "\"'")
	return strings.TrimSpace(key)
}

var cloudAPIHTTPClient = &http.Client{
	Timeout: 0,
	Transport: &http.Transport{
		Proxy:                 http.ProxyFromEnvironment,
		MaxIdleConns:          100,
		MaxIdleConnsPerHost:   20,
		IdleConnTimeout:       90 * time.Second,
		TLSHandshakeTimeout:   15 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
		// Prefer HTTP/1.1 stability for long-lived streaming proxies.
		ForceAttemptHTTP2: false,
	},
}

// Admin configuration loaded at startup.
var (
	adminAPIKey   string
	allowedOrigin string
	// gateway supervision
	gatewayCmd *exec.Cmd
	gatewayMu  sync.Mutex
)

// loadOrCreateAdminKey loads the admin key from environment or a config file
// next to the executable. If none exists, it generates a new 32-byte key,
// writes it to config.env with restricted permissions, and prints it once.
func loadOrCreateAdminKey(execDir string) string {
	// 1) prefer env var
	if k := strings.TrimSpace(os.Getenv("PAIPERWORK_ADMIN_KEY")); k != "" {
		return k
	}

	cfgPath := filepath.Join(execDir, "config.env")

	// Check rotate-on-start flag
	rotate := strings.ToLower(strings.TrimSpace(os.Getenv("PAIPERWORK_ROTATE_ADMIN_KEY_ON_START"))) == "true"

	// 2) if not rotating, try to read existing file
	if !rotate {
		if data, err := os.ReadFile(cfgPath); err == nil {
			lines := strings.Split(string(data), "\n")
			for _, line := range lines {
				line = strings.TrimSpace(line)
				if strings.HasPrefix(line, "PAIPERWORK_ADMIN_KEY=") {
					val := strings.TrimPrefix(line, "PAIPERWORK_ADMIN_KEY=")
					val = strings.Trim(val, "\"' ")
					if val != "" {
						return val
					}
				}
			}
		}
	}

	// 3) generate a new key and persist it (either rotate=true or no existing key)
	b := make([]byte, 32)
	if _, err := crand.Read(b); err != nil {
		// fallback to math/rand if crypto fails (very unlikely)
		for i := range b {
			b[i] = byte(rand.Intn(256))
		}
	}
	key := hex.EncodeToString(b)

	content := fmt.Sprintf("PAIPERWORK_ADMIN_KEY=%s\n", key)
	// attempt atomic write
	tmp := cfgPath + ".tmp"
	if err := os.WriteFile(tmp, []byte(content), 0600); err == nil {
		_ = os.Rename(tmp, cfgPath)
		// best-effort chmod (Windows may ignore)
		_ = os.Chmod(cfgPath, 0600)
		// By default do NOT print the key to stdout to minimize exposure.
		// Printing can be enabled for debug/dev via PAIPERWORK_SHOW_ADMIN_KEY_ON_FIRST_RUN=true
		if strings.ToLower(strings.TrimSpace(os.Getenv("PAIPERWORK_SHOW_ADMIN_KEY_ON_FIRST_RUN"))) == "true" {
			fmt.Println("====================================================================")
			fmt.Println("Paiperwork admin key generated (store this securely).")
			fmt.Printf("PAIPERWORK_ADMIN_KEY=%s\n", key)
			fmt.Println("This key was saved to:", cfgPath)
			fmt.Println("Save it to a password manager; keep it secret. Rotate by replacing the file and restarting the app.")
			fmt.Println("====================================================================")
		}
	} else {
		// If write failed, we still return the generated key but avoid printing by default.
		if strings.ToLower(strings.TrimSpace(os.Getenv("PAIPERWORK_SHOW_ADMIN_KEY_ON_FIRST_RUN"))) == "true" {
			fmt.Println("WARNING: failed to write admin key to", cfgPath, ":", err)
			fmt.Println("Generated admin key (please save it):", key)
		}
	}

	return key
}

// isAuthorized checks for the admin API key header.
func isAuthorized(r *http.Request) bool {
	// Allow loopback requests (local installs) without presenting the header.
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		host = r.RemoteAddr
	}
	ip := net.ParseIP(host)
	if ip != nil && ip.IsLoopback() {
		return true
	}

	// header check
	key := strings.TrimSpace(r.Header.Get("X-Paiperwork-Admin-Key"))
	if key != "" && adminAPIKey != "" {
		if subtle.ConstantTimeCompare([]byte(key), []byte(adminAPIKey)) == 1 {
			return true
		}
	}

	return false
}

// requireAdmin is a middleware wrapper for admin-only handlers.
func requireAdmin(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			// Allow preflight to be handled by the caller after CORS headers are applied
			w.WriteHeader(http.StatusOK)
			return
		}
		if !isAuthorized(r) {
			// log unauthorized attempt
			auditAdminEvent(r, "admin-auth", "unauthorized", "missing or invalid admin key")
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		// log successful auth attempt (will also log the action result in handler)
		auditAdminEvent(r, "admin-auth", "authorized", "")
		next(w, r)
	}
}

// applyRestrictedCORS applies conservative CORS headers for admin endpoints.
func applyRestrictedCORS(w http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")
	if allowedOrigin != "" {
		if origin != "" && origin == allowedOrigin {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Paiperwork-Admin-Key")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		}
	}
}

// auditAdminEvent appends an audit line to admin_actions.log next to the executable.
func auditAdminEvent(r *http.Request, action, status, details string) {
	execDir := filepath.Dir(os.Args[0])

	entryTime := time.Now().Format(time.RFC3339)
	remote := r.RemoteAddr
	ua := r.Header.Get("User-Agent")
	// Keep details single-line
	details = strings.ReplaceAll(details, "\n", " ")

	line := fmt.Sprintf("%s\tremote=%s\tmethod=%s\tpath=%s\taction=%s\tstatus=%s\tua=%s\tdetails=%s\n",
		entryTime, remote, r.Method, r.URL.Path, action, status, ua, details)

	// Decide whether this is a local install: if PAIPERWORK_BIND_HOST is set to 0.0.0.0 or ::,
	// treat it as cloud (do not write local files). Otherwise allow local file logging.
	bindHost := strings.TrimSpace(os.Getenv("PAIPERWORK_BIND_HOST"))
	isCloud := bindHost == "0.0.0.0" || bindHost == "::"
	if cloudFlag := strings.ToLower(strings.TrimSpace(os.Getenv("PAIPERWORK_CLOUD_DEPLOYMENT"))); cloudFlag == "true" {
		isCloud = true
	}

	adminAuditMutex.Lock()
	defer adminAuditMutex.Unlock()

	if isCloud {
		// Cloud deployment: avoid writing to local filesystem; log to stdout only
		log.Printf("[admin-audit] %s", strings.TrimSpace(line))
		return
	}

	// Local install: write under app/logs/admin_actions.log (create dir if needed)
	logsDir := filepath.Join(execDir, "app", "logs")
	if err := os.MkdirAll(logsDir, 0700); err != nil {
		log.Printf("Failed to create logs dir %s: %v; falling back to stdout", logsDir, err)
		log.Printf("[admin-audit] %s", strings.TrimSpace(line))
		return
	}

	logPath := filepath.Join(logsDir, "admin_actions.log")
	f, err := os.OpenFile(logPath, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0600)
	if err != nil {
		log.Printf("Failed to open admin audit log %s: %v; falling back to stdout", logPath, err)
		log.Printf("[admin-audit] %s", strings.TrimSpace(line))
		return
	}
	defer f.Close()

	if _, err := f.WriteString(line); err != nil {
		log.Printf("Failed to write admin audit log: %v", err)
	}
}

func cloudRequestWantsStream(body []byte) bool {
	if len(body) == 0 {
		return false
	}

	var payload map[string]interface{}
	if err := json.Unmarshal(body, &payload); err != nil {
		return false
	}

	if streamVal, ok := payload["stream"]; ok {
		if b, ok := streamVal.(bool); ok {
			return b
		}
	}

	return false
}

func isTransientCloudNetworkError(err error) bool {
	if err == nil {
		return false
	}

	if errors.Is(err, io.EOF) {
		return true
	}

	var netErr net.Error
	if errors.As(err, &netErr) {
		if netErr.Timeout() || netErr.Temporary() {
			return true
		}
	}

	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "unexpected eof") ||
		strings.Contains(msg, "connection reset") ||
		strings.Contains(msg, "broken pipe") ||
		strings.Contains(msg, "timeout")
}

func proxyOllamaCloudTags(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	req, err := http.NewRequest(http.MethodGet, "https://ollama.com/api/tags", nil)
	if err != nil {
		http.Error(w, "Failed to create request", http.StatusInternalServerError)
		return
	}

	// Prefer explicit request headers first (X-Ollama-Api-Key or Authorization), then env var.
	apiKey := strings.TrimSpace(r.Header.Get("X-Ollama-Api-Key"))
	if apiKey == "" {
		authHeader := strings.TrimSpace(r.Header.Get("Authorization"))
		if strings.HasPrefix(strings.ToLower(authHeader), "bearer ") {
			apiKey = strings.TrimSpace(authHeader[len("Bearer "):])
		} else {
			apiKey = authHeader
		}
	}
	if apiKey == "" {
		apiKey = strings.TrimSpace(os.Getenv("OLLAMA_API_KEY"))
	}
	apiKey = normalizeOllamaAPIKey(apiKey)
	if apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+apiKey)
	}
	req.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: 20 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error fetching Ollama cloud tags: %v", err)
		http.Error(w, "Failed to fetch cloud models", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 2*1024*1024))
	if err != nil {
		http.Error(w, "Failed to read cloud models response", http.StatusBadGateway)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	_, _ = w.Write(body)
}

func proxyOllamaCloudAPIPath(path string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method != http.MethodPost && r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var bodyBytes []byte
		var err error
		if r.Body != nil {
			bodyBytes, err = io.ReadAll(io.LimitReader(r.Body, 10*1024*1024))
			if err != nil {
				http.Error(w, "Failed to read request body", http.StatusBadRequest)
				return
			}
		}

		// Defensive normalization: cloud API expects base model names (without "-cloud").
		bodyBytes = sanitizeCloudModelFields(bodyBytes)

		targetURL := "https://ollama.com/api/" + path
		req, err := http.NewRequest(r.Method, targetURL, strings.NewReader(string(bodyBytes)))
		if err != nil {
			http.Error(w, "Failed to create cloud request", http.StatusInternalServerError)
			return
		}

		apiKey := strings.TrimSpace(r.Header.Get("X-Ollama-Api-Key"))
		if apiKey == "" {
			authHeader := strings.TrimSpace(r.Header.Get("Authorization"))
			if strings.HasPrefix(strings.ToLower(authHeader), "bearer ") {
				apiKey = strings.TrimSpace(authHeader[len("Bearer "):])
			} else {
				apiKey = authHeader
			}
		}
		if apiKey == "" {
			apiKey = strings.TrimSpace(os.Getenv("OLLAMA_API_KEY"))
		}
		apiKey = normalizeOllamaAPIKey(apiKey)
		if apiKey != "" {
			req.Header.Set("Authorization", "Bearer "+apiKey)
		}

		if contentType := r.Header.Get("Content-Type"); contentType != "" {
			req.Header.Set("Content-Type", contentType)
		} else {
			req.Header.Set("Content-Type", "application/json")
		}
		req.Header.Set("Accept", "application/json")

		wantsStream := cloudRequestWantsStream(bodyBytes)
		maxAttempts := 2
		resp, err := cloudAPIHTTPClient.Do(req)
		if err != nil {
			shouldRetry := maxAttempts > 1 && isTransientCloudNetworkError(err) && !(r.Method == http.MethodPost && wantsStream)
			if shouldRetry {
				log.Printf("[CloudProxyRetry] path=%s method=%s modelHint=%s err=%v (attempt 1/%d)", path, r.Method, extractCloudModelHint(bodyBytes), err, maxAttempts)
				time.Sleep(200 * time.Millisecond)

				retryReq, reqErr := http.NewRequest(r.Method, targetURL, strings.NewReader(string(bodyBytes)))
				if reqErr != nil {
					http.Error(w, "Failed to create cloud retry request", http.StatusInternalServerError)
					return
				}
				retryReq.Header = req.Header.Clone()
				resp, err = cloudAPIHTTPClient.Do(retryReq)
			}
		}
		if err != nil {
			log.Printf("Error proxying Ollama cloud %s: %v (stream=%v modelHint=%s)", path, err, wantsStream, extractCloudModelHint(bodyBytes))
			http.Error(w, "Failed to reach Ollama cloud", http.StatusBadGateway)
			return
		}
		defer resp.Body.Close()

		if ct := resp.Header.Get("Content-Type"); ct != "" {
			w.Header().Set("Content-Type", ct)
		}

		if resp.StatusCode == http.StatusUnauthorized {
			unauthBody, _ := io.ReadAll(io.LimitReader(resp.Body, 8192))
			preview := strings.TrimSpace(string(unauthBody))
			if len(preview) > 300 {
				preview = preview[:300] + "...[truncated]"
			}
			preview = strings.ReplaceAll(preview, "\n", " ")
			preview = strings.ReplaceAll(preview, "\r", " ")
			log.Printf("[CloudProxy401] path=%s keyLen=%d modelHint=%s body=%s", path, len(apiKey), extractCloudModelHint(bodyBytes), preview)
			w.WriteHeader(resp.StatusCode)
			_, _ = w.Write(unauthBody)
			return
		}

		w.WriteHeader(resp.StatusCode)
		if _, copyErr := io.Copy(w, resp.Body); copyErr != nil {
			log.Printf("[CloudProxyStream] path=%s status=%d stream=%v modelHint=%s copyErr=%v", path, resp.StatusCode, wantsStream, extractCloudModelHint(bodyBytes), copyErr)
		}
	}
}

func extractCloudModelHint(body []byte) string {
	if len(body) == 0 {
		return "<empty>"
	}

	var payload map[string]interface{}
	if err := json.Unmarshal(body, &payload); err != nil {
		return "<non-json>"
	}

	if model, ok := payload["model"].(string); ok && strings.TrimSpace(model) != "" {
		return strings.TrimSpace(model)
	}
	if name, ok := payload["name"].(string); ok && strings.TrimSpace(name) != "" {
		return strings.TrimSpace(name)
	}
	return "<missing-model>"
}

func sanitizeCloudModelFields(body []byte) []byte {
	if len(body) == 0 {
		return body
	}

	trimmed := strings.TrimSpace(string(body))
	if trimmed == "" || (!strings.HasPrefix(trimmed, "{") && !strings.HasPrefix(trimmed, "[")) {
		return body
	}

	stripCloudSuffix := func(s string) string {
		clean := strings.TrimSpace(s)
		for strings.HasSuffix(strings.ToLower(clean), "-cloud") {
			clean = strings.TrimSpace(clean[:len(clean)-len("-cloud")])
		}
		return clean
	}

	var payload interface{}
	if err := json.Unmarshal(body, &payload); err != nil {
		return body
	}

	updated := false
	var walk func(v interface{})
	walk = func(v interface{}) {
		switch t := v.(type) {
		case map[string]interface{}:
			for k, raw := range t {
				lowerKey := strings.ToLower(k)
				if lowerKey == "model" || lowerKey == "name" {
					if str, ok := raw.(string); ok {
						sanitized := stripCloudSuffix(str)
						if sanitized != str {
							t[k] = sanitized
							updated = true
						}
					}
				}
				walk(raw)
			}
		case []interface{}:
			for _, item := range t {
				walk(item)
			}
		}
	}

	walk(payload)
	if !updated {
		return body
	}

	normalized, err := json.Marshal(payload)
	if err != nil {
		return body
	}
	return normalized
}

func proxyBingSearch(w http.ResponseWriter, r *http.Request) {
	// Extract query parameter from request
	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "Missing query parameter", http.StatusBadRequest)
		return
	}

	// Get the mode (document+websearch or regular)
	mode := r.URL.Query().Get("mode")
	isDocumentSearch := mode == "doc"

	// Log the incoming request details
	log.Printf("Search request received - Query: %q, Mode: %s", query, mode)

	// Detect user's preferred language from the incoming request's Accept-Language header
	acceptLang := r.Header.Get("Accept-Language")
	if acceptLang == "" {
		acceptLang = "en-US"
	}

	// Extract primary language tag (e.g. "en-US" or "fr")
	primary := strings.SplitN(acceptLang, ",", 2)[0]
	primary = strings.TrimSpace(strings.SplitN(primary, ";", 2)[0])

	// Derive setlang (language) and setmkt (market/locale)
	setlang := "en"
	setmkt := "en-US"
	if primary != "" {
		parts := strings.SplitN(primary, "-", 2)
		setlang = parts[0]
		if len(parts) == 2 {
			setmkt = primary
		} else {
			// Map common language codes to reasonable default markets
			switch setlang {
			case "en":
				setmkt = "en-US"
			case "fr":
				setmkt = "fr-FR"
			case "de":
				setmkt = "de-DE"
			case "es":
				setmkt = "es-ES"
			case "pt":
				setmkt = "pt-BR"
			case "zh":
				setmkt = "zh-CN"
			case "ja":
				setmkt = "ja-JP"
			default:
				// Fallback: append US as region
				setmkt = setlang + "-US"
			}
		}
	}

	// Sanitize the query: trim, remove surrounding quotes/parentheses/brackets, collapse whitespace
	cleanQ := strings.TrimSpace(query)
	// Remove surrounding matching quotes
	if (strings.HasPrefix(cleanQ, "\"") && strings.HasSuffix(cleanQ, "\"")) || (strings.HasPrefix(cleanQ, "'") && strings.HasSuffix(cleanQ, "'")) {
		cleanQ = cleanQ[1 : len(cleanQ)-1]
	}
	// Remove surrounding parentheses/brackets
	if (strings.HasPrefix(cleanQ, "(") && strings.HasSuffix(cleanQ, ")")) || (strings.HasPrefix(cleanQ, "[") && strings.HasSuffix(cleanQ, "]")) {
		cleanQ = cleanQ[1 : len(cleanQ)-1]
	}
	// Collapse multiple whitespace into single spaces
	cleanQ = regexp.MustCompile(`\s+`).ReplaceAllString(cleanQ, " ")

	// Build a minimal Bing URL: only q plus detected market/language
	bingURL := "https://www.bing.com/search?q=" + url.QueryEscape(cleanQ) + "&setmkt=" + url.QueryEscape(setmkt) + "&setlang=" + url.QueryEscape(setlang)

	// Log detected language and chosen parameters for debugging
	log.Printf("Accept-Language: %q -> setmkt=%s setlang=%s", acceptLang, setmkt, setlang)

	// Log what URL we're building
	log.Printf("Built Bing URL: %s", bingURL)

	// Create a client with redirect handling
	client := &http.Client{
		Timeout: 15 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			// Copy headers on redirect
			for key, values := range via[0].Header {
				for _, value := range values {
					req.Header.Add(key, value)
				}
			}
			return nil
		},
	}

	// Create a new request for Bing
	req, err := http.NewRequest("GET", bingURL, nil)
	if err != nil {
		log.Printf("Error creating request: %v", err)
		http.Error(w, "Failed to create request", http.StatusInternalServerError)
		return
	}

	// Use a more diverse set of headers to appear like a regular browser
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	req.Header.Set("Referer", "https://www.bing.com/")
	req.Header.Set("sec-ch-ua", `"Chromium";v="122", "Google Chrome";v="122", "Not:A-Brand";v="99"`)
	req.Header.Set("sec-ch-ua-mobile", "?0")
	req.Header.Set("sec-ch-ua-platform", "\"Windows\"")
	req.Header.Set("Sec-Fetch-Dest", "document")
	req.Header.Set("Sec-Fetch-Mode", "navigate")
	req.Header.Set("Sec-Fetch-Site", "same-origin")
	req.Header.Set("Sec-Fetch-User", "?1")
	req.Header.Set("Upgrade-Insecure-Requests", "1")

	// IMPORTANT: Don't send the hardcoded cookie that might be causing the issue
	// Instead, use only what's necessary for getting English results
	req.Header.Set("Cookie", "MUID="+fmt.Sprintf("%x", time.Now().UnixNano()))

	// Log the full request for debugging
	if isDocumentSearch {
		log.Printf("Document+WebSearch request headers: %v", req.Header)
	}

	// Fetch the response
	log.Printf("Sending request to Bing...")
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error fetching from Bing: %v", err)
		http.Error(w, "Failed to fetch from Bing", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	log.Printf("Received response from Bing: status=%d, content-type=%s",
		resp.StatusCode, resp.Header.Get("Content-Type"))

	// Read the body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading response body: %v", err)
		http.Error(w, "Failed to read response body", http.StatusInternalServerError)
		return
	}

	// Convert to string for processing
	htmlBody := string(body)

	// Add basic diagnostic info to help debug search issues
	hasSearchResults := strings.Contains(htmlBody, "b_algo")
	log.Printf("Response contains search results (b_algo): %v", hasSearchResults)

	// Add useful headers
	log.Printf("Response size: %d bytes", len(htmlBody))

	// Do some basic analysis of the HTML to help with debugging
	if !hasSearchResults {
		log.Printf("WARNING: Response doesn't contain expected search results markers")
		// Try to detect common blocking patterns
		if strings.Contains(htmlBody, "captcha") {
			log.Printf("BLOCKED: Response appears to contain a CAPTCHA challenge")
		}
		if strings.Contains(htmlBody, "unusual traffic") {
			log.Printf("BLOCKED: Bing reports unusual traffic from this computer")
		}
	} else {
		// Count how many search results we found
		resultCount := strings.Count(htmlBody, `class="b_algo"`)
		log.Printf("Found approximately %d search results in the response", resultCount)
	}

	// Fix relative URLs in the HTML to prevent them from resolving to localhost
	htmlBody = strings.ReplaceAll(htmlBody, "href=\"/", "href=\"https://www.bing.com/")
	htmlBody = strings.ReplaceAll(htmlBody, "src=\"/", "src=\"https://www.bing.com/")

	// Set response headers
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(resp.StatusCode)

	// Return the modified HTML
	w.Write([]byte(htmlBody))
}

// Add this new function
func fetchRawHtmlForLinks(w http.ResponseWriter, r *http.Request) {
	// Get URL parameter
	targetURL := r.URL.Query().Get("url")
	if targetURL == "" {
		http.Error(w, "Missing url parameter", http.StatusBadRequest)
		return
	}

	validatedTargetURL, err := validateOutboundURL(targetURL)
	if err != nil {
		log.Printf("Raw HTML extraction rejected URL %q: %v", targetURL, err)
		http.Error(w, "Invalid or disallowed URL", http.StatusBadRequest)
		return
	}

	targetURLString := validatedTargetURL.String()

	log.Printf("Raw HTML extraction request for URL: %s", targetURLString)

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: 10 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if _, err := validateOutboundURL(req.URL.String()); err != nil {
				return fmt.Errorf("redirect blocked: %w", err)
			}

			if len(via) >= 5 {
				return errors.New("too many redirects")
			}
			return nil
		},
	}

	req, err := http.NewRequest("GET", targetURLString, nil)
	if err != nil {
		log.Printf("Error creating request: %v", err)
		http.Error(w, "Failed to create request", http.StatusInternalServerError)
		return
	}

	// Add browser-like headers
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")

	// Fetch the page
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error fetching URL: %v", err)
		http.Error(w, fmt.Sprintf("Failed to fetch URL: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// Read body with size limit (5MB)
	limitedReader := io.LimitReader(resp.Body, 5*1024*1024)
	body, err := io.ReadAll(limitedReader)
	if err != nil {
		log.Printf("Error reading response body: %v", err)
		http.Error(w, "Failed to read page content", http.StatusInternalServerError)
		return
	}

	// Return the raw HTML with minimal processing (just fix relative URLs)
	htmlContent := string(body)

	// Fix relative URLs
	baseURL, err := url.Parse(targetURLString)
	if err == nil {
		// Fix relative links to absolute
		htmlContent = regexp.MustCompile(`href="/(.*?)"`).ReplaceAllStringFunc(htmlContent, func(m string) string {
			link := regexp.MustCompile(`href="/(.*?)"`).FindStringSubmatch(m)[1]
			return fmt.Sprintf(`href="%s/%s"`, baseURL.Scheme+"://"+baseURL.Host, link)
		})
	}

	// Return the content as JSON
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	response := map[string]interface{}{
		"url":         targetURLString,
		"rawHtml":     htmlContent,
		"extractedAt": time.Now().Format(time.RFC3339),
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error encoding JSON response: %v", err)
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}

// Proxy the local WhatsApp gateway QR/status endpoint to avoid cross-origin issues
func whatsappQrProxyHandler(w http.ResponseWriter, r *http.Request) {
	forceWhatsappInMemoryRuntime()

	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Paiperwork-User")
		w.WriteHeader(http.StatusOK)
		return
	}

	whatsappQrProxyHandlerMu.Lock()
	defer whatsappQrProxyHandlerMu.Unlock()

	w.Header().Set("Access-Control-Allow-Origin", "*")
	startRequested := strings.TrimSpace(strings.ToLower(r.URL.Query().Get("start"))) == "true"
	stopRequested := strings.TrimSpace(strings.ToLower(r.URL.Query().Get("stop"))) == "true"
	checkRequested := strings.TrimSpace(strings.ToLower(r.URL.Query().Get("check"))) == "true"
	freshPairRequested := isWhatsappFreshPairRequested(r)
	userKey, allowed := enforceWhatsappActiveUserAccess(w, r, true)
	if !allowed {
		log.Printf("whatsappQrProxy: rejected access due to user mismatch requested=%s", userKey)
		return
	}

	if stopRequested {
		clearWhatsappRemoteLogoutNotice()
		markWhatsappManualStopWindow(30 * time.Second)
		_ = stopGateway()
		pairRequested = false
		os.Unsetenv(whatsappFreshPairStartupEnv)
		setWhatsappSessionRestoreExpected(false)
		os.Unsetenv("PAIPERWORK_WHATSAPP_DEVICE_ID")
		os.Unsetenv("WHATSAPP_DEVICE_ID")
		config.WhatsappPreferredDeviceID = ""
		setActiveWhatsappUserScope("")
		welcomeMu.Lock()
		welcomeSentForDevice = map[string]bool{}
		welcomePendingForDevice = map[string]bool{}
		welcomeLastSentAtForDevice = map[string]time.Time{}
		welcomeMu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{"status": "stopped"})
		return
	}

	if notice := getWhatsappRemoteLogoutNotice(); notice != nil {
		if checkRequested && !startRequested {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]any{"status": "stopped", "reason": "remote_logout", "connected": false, "loggedIn": false, "qrWithheld": false, "gatewayRunning": false, "message": notice.Message, "deviceId": notice.DeviceID})
			return
		}
		if startRequested && !freshPairRequested {
			markWhatsappManualStopWindow(30 * time.Second)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusConflict)
			_ = json.NewEncoder(w).Encode(map[string]any{"status": "stopped", "reason": "remote_logout", "connected": false, "loggedIn": false, "qrWithheld": false, "gatewayRunning": false, "message": notice.Message, "deviceId": notice.DeviceID})
			return
		}
	}

	requestedDeviceID := getRequestedWhatsappDeviceIDFromRequest(r)
	if requestedDeviceID != "" && userKey != "" && !freshPairRequested {
		setSelectedWhatsappDeviceForUser(userKey, requestedDeviceID, "")
	}
	expectSessionRestore := strings.TrimSpace(strings.ToLower(r.URL.Query().Get("restore_session"))) == "true"

	if userKey != "" {
		syncEmbeddedGowaRuntimeDBEnv(userKey)
		userDBURI := os.Getenv("PAIPERWORK_DB_URI")
		whatsappQrProxyLogMu.Lock()
		if lastWhatsappQrProxyUserKey != userKey || lastWhatsappQrProxyDBURI != userDBURI {
			lastWhatsappQrProxyUserKey = userKey
			lastWhatsappQrProxyDBURI = userDBURI
		}
		whatsappQrProxyLogMu.Unlock()
	}

	// Pass any explicit device ID from the request through as the current
	// startup candidate; do not persist it via env/config shorthand.
	if freshPairRequested {
		clearWhatsappRemoteLogoutNotice()
		setWhatsappSessionRestoreExpected(false)
	} else if requestedDeviceID != "" {
		clearWhatsappRemoteLogoutNotice()
		setWhatsappSessionRestoreExpected(expectSessionRestore)
	} else {
		if startRequested {
			clearWhatsappRemoteLogoutNotice()
		}
		setWhatsappSessionRestoreExpected(false)
	}

	// Keep check-only requests from triggering gateway start.
	if checkRequested && !startRequested {
		gatewayRunning := isGatewayRunning()
		if !gatewayRunning {
			if notice := getWhatsappRemoteLogoutNotice(); notice != nil {
				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(map[string]any{"status": "stopped", "reason": "remote_logout", "connected": false, "loggedIn": false, "qrWithheld": false, "gatewayRunning": false, "message": notice.Message, "deviceId": notice.DeviceID})
				return
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]any{"connected": false, "loggedIn": false, "qrWithheld": false, "gatewayRunning": false})
			return
		}
		if !isGatewayReady() {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]any{"status": "starting", "connected": false, "loggedIn": false, "qrWithheld": false, "gatewayRunning": true})
			return
		}

		status, err := fetchWhatsappGatewayStatus(&http.Client{Timeout: 5 * time.Second}, false, userKey, requestedDeviceID, freshPairRequested)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]any{"connected": false, "loggedIn": false, "qrWithheld": false, "gatewayRunning": gatewayRunning})
			return
		}
		response := map[string]any{"connected": status.Connected, "loggedIn": status.LoggedIn, "qrWithheld": status.QRWithheld, "gatewayRunning": gatewayRunning, "deviceId": status.DeviceID}
		if status.QRDuration > 0 {
			response["qrDuration"] = status.QRDuration
		}
		if status.QRDataUrl != "" {
			response["qrDataUrl"] = status.QRDataUrl
			if status.QRTimestamp > 0 {
				response["qrTimestamp"] = status.QRTimestamp
			}
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}

	if startRequested {
		wechatEngineMu.Lock()
		wechatRunning := wechatEngineStarted
		wechatEngineMu.Unlock()
		if wechatRunning {
			log.Printf("whatsappQrProxy: stopping running WeChat gateway before WhatsApp startup")
			if err := stopEmbeddedWcfLink(); err != nil {
				log.Printf("whatsappQrProxy: failed to stop running WeChat gateway: %v", err)
				http.Error(w, fmt.Sprintf("failed to stop existing WeChat gateway: %v", err), http.StatusInternalServerError)
				return
			}
		}

		if isWhatsappManualStopActive() {
			log.Printf("whatsappQrProxy: explicit start request clearing manual stop window")
			markWhatsappManualStopWindow(0)
		}

		if isWhatsappManualStopActive() {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusAccepted)
			_ = json.NewEncoder(w).Encode(map[string]any{"status": "stopped", "gatewayRunning": false, "connected": false, "loggedIn": false, "qrWithheld": false, "message": "Manual stop in progress"})
			return
		}

		markWhatsappManualStopWindow(0)
		pairRequested = true
		if userKey != "" {
			setActiveWhatsappUserScope(userKey)
			// noisy in normal flow; keep assignment without per-request log
		}

		// If already launching/started, early respond; otherwise start in background.
		if isGatewayRunning() {
			if !isGatewayReady() {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusAccepted)
				_ = json.NewEncoder(w).Encode(map[string]any{"status": "starting", "gatewayRunning": true, "connected": false, "loggedIn": false, "qrWithheld": false})
				return
			}
			client := &http.Client{Timeout: 25 * time.Second}
			status, err := fetchWhatsappGatewayStatus(client, true, userKey, requestedDeviceID, freshPairRequested)
			if err != nil {
				errText := strings.ToLower(strings.TrimSpace(err.Error()))
				if errText == "" || !strings.Contains(errText, "no paired device available") || shouldEmitWhatsappRateLimitedLog("already-running-no-paired-device", whatsappGatewayPollNoiseCooldown) {
					log.Printf("whatsappQrProxy: already-running status fetch failed: %v", err)
				}
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusOK)
				_ = json.NewEncoder(w).Encode(map[string]any{"status": "already_running", "gatewayRunning": true, "connected": false, "loggedIn": false, "qrWithheld": false})
				return
			}

			response := map[string]any{"status": "already_running", "gatewayRunning": true, "connected": status.Connected, "loggedIn": status.LoggedIn, "qrWithheld": status.QRWithheld, "deviceId": status.DeviceID}
			if status.QRDuration > 0 {
				response["qrDuration"] = status.QRDuration
			}
			if status.QRDataUrl != "" {
				response["qrDataUrl"] = status.QRDataUrl
				if status.QRTimestamp > 0 {
					response["qrTimestamp"] = status.QRTimestamp
				}
			}
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			_ = json.NewEncoder(w).Encode(response)
			return
		}

		gatewayStartMutex.Lock()
		if gatewayStarting {
			gatewayStartMutex.Unlock()
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusAccepted)
			_ = json.NewEncoder(w).Encode(map[string]any{"status": "starting", "message": "Gateway startup in progress"})
			return
		}
		gatewayStarting = true
		// Mark startup attempt before releasing lock so concurrent poll requests
		// immediately enter warm-up suppression and do not leak QR early.
		gatewayLastStartAttempt = time.Now()
		gatewayStartMutex.Unlock()

		go func() {
			defer func() {
				gatewayStartMutex.Lock()
				gatewayStarting = false
				gatewayStartMutex.Unlock()
			}()
			if isWhatsappManualStopActive() {
				log.Printf("whatsappQrProxy: skipping background gateway start because manual stop is active")
				return
			}
			log.Printf("whatsappQrProxy: background gateway start requested")
			if startErr := tryStartBundledGateway(filepath.Dir(os.Args[0]), freshPairRequested); startErr != nil {
				log.Printf("whatsappQrProxy: background start failed: %v", startErr)
				return
			}
			log.Printf("whatsappQrProxy: background gateway start complete")
		}()

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusAccepted)
		_ = json.NewEncoder(w).Encode(map[string]any{"status": "starting", "message": "Gateway startup requested"})
		return
	}

	clientTimeout := 5 * time.Second
	if startRequested {
		clientTimeout = 25 * time.Second
	}
	client := &http.Client{Timeout: clientTimeout}
	status, err := fetchWhatsappGatewayStatus(client, startRequested, userKey, requestedDeviceID, freshPairRequested)
	if err != nil {
		if startRequested && isWhatsappManualStopActive() {
			http.Error(w, "gateway-stopped", http.StatusServiceUnavailable)
			return
		}
		if startRequested {
			log.Printf("whatsappQrProxy: gateway unreachable on poll (start requested, launching): %v", err)
			pairRequested = true
		} else {
			log.Printf("whatsappQrProxy: gateway unreachable on poll: %v", err)
		}

		gatewayRunning := isGatewayRunning()
		if gatewayRunning {
			// Gateway process is alive but /devices/status is not responsive yet.
			http.Error(w, "gateway-unavailable", http.StatusServiceUnavailable)
			return
		}

		if !startRequested {
			// if not requesting start but gateway is running, and status says disconnected: stop it.
			if isGatewayRunning() {
				_ = stopGateway()
			}
			http.Error(w, "gateway-unavailable", http.StatusServiceUnavailable)
			return
		}

		_, lastAttempt := snapshotGatewayStartState()
		if !lastAttempt.IsZero() && time.Since(lastAttempt) < gatewayStartCooldown {
			log.Printf("whatsappQrProxy: gateway restart backoff active (%.0fs left)", gatewayStartCooldown.Seconds()-time.Since(lastAttempt).Seconds())
			http.Error(w, "gateway-unavailable", http.StatusServiceUnavailable)
			return
		}

		gatewayStartMutex.Lock()
		if gatewayStarting {
			gatewayStartMutex.Unlock()
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusAccepted)
			_, _ = w.Write([]byte(`{"status":"starting","message":"Gateway startup in progress"}`))
			return
		}
		gatewayStarting = true
		gatewayStartMutex.Unlock()
		defer func() {
			gatewayStartMutex.Lock()
			gatewayStarting = false
			gatewayStartMutex.Unlock()
		}()

		gatewayStartMutex.Lock()
		gatewayLastStartAttempt = time.Now()
		gatewayStartMutex.Unlock()
		log.Printf("whatsappQrProxy: gateway unreachable; starting bundled gateway by request: %v", err)
		if isWhatsappManualStopActive() {
			http.Error(w, "gateway-stopped", http.StatusServiceUnavailable)
			return
		}
		execDir := filepath.Dir(os.Args[0])
		if startErr := tryStartBundledGateway(execDir, freshPairRequested); startErr != nil {
			log.Printf("whatsappQrProxy: failed to start gateway: %v", startErr)
			http.Error(w, "gateway-unavailable", http.StatusServiceUnavailable)
			return
		}

		// Start request accepted; gateway in background startup.
		log.Printf("whatsappQrProxy: start gateway launched; responding 202 and waiting for health target")
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusAccepted)
		_ = json.NewEncoder(w).Encode(map[string]any{"status": "starting", "message": "Gateway starting; please retry in a few seconds."})
		return
	}

	// If the client explicitly requested a start but the local gateway process
	// is not running, attempt to start the bundled gateway even if the
	// remote gateway API reported a connected state. This covers cases where
	// the gateway API is reachable but the local bundled binary is not
	// running (gatewayRunning == false). We follow the same backoff and
	// starting guards as the error path above.
	if startRequested && !isGatewayRunning() {
		_, lastAttempt := snapshotGatewayStartState()
		if !lastAttempt.IsZero() && time.Since(lastAttempt) < gatewayStartCooldown {
			log.Printf("whatsappQrProxy: gateway restart backoff active (%.0fs left)", gatewayStartCooldown.Seconds()-time.Since(lastAttempt).Seconds())
			// fall through and return current status (gatewayRunning will be false)
		} else {
			gatewayStartMutex.Lock()
			if gatewayStarting {
				gatewayStartMutex.Unlock()
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusAccepted)
				_, _ = w.Write([]byte(`{"status":"starting","message":"Gateway startup in progress"}`))
				return
			}
			gatewayStarting = true
			gatewayStartMutex.Unlock()

			defer func() {
				gatewayStartMutex.Lock()
				gatewayStarting = false
				gatewayStartMutex.Unlock()
			}()

			gatewayStartMutex.Lock()
			gatewayLastStartAttempt = time.Now()
			gatewayStartMutex.Unlock()
			log.Printf("whatsappQrProxy: start requested but local gateway not running; starting bundled gateway")
			if isWhatsappManualStopActive() {
				http.Error(w, "gateway-stopped", http.StatusServiceUnavailable)
				return
			}
			execDir := filepath.Dir(os.Args[0])
			if startErr := tryStartBundledGateway(execDir, freshPairRequested); startErr != nil {
				log.Printf("whatsappQrProxy: failed to start gateway: %v", startErr)
				http.Error(w, "gateway-unavailable", http.StatusServiceUnavailable)
				return
			}

			// Start request accepted; gateway in background startup.
			log.Printf("whatsappQrProxy: start gateway launched; responding 202 and waiting for health target")
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusAccepted)
			_ = json.NewEncoder(w).Encode(map[string]any{"status": "starting", "message": "Gateway startup in progress; please retry in a few seconds."})
			return
		}
	}

	if isGatewayRunning() && !isGatewayReady() {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusAccepted)
		_ = json.NewEncoder(w).Encode(map[string]any{"status": "starting", "gatewayRunning": true, "connected": false, "loggedIn": false, "qrWithheld": false})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"connected":      status.Connected,
		"loggedIn":       status.LoggedIn,
		"qrWithheld":     status.QRWithheld,
		"gatewayRunning": isGatewayRunning(),
		"qrDataUrl":      status.QRDataUrl,
		"qrTimestamp":    status.QRTimestamp,
		"qrDuration":     status.QRDuration,
	})
}

// Serve the cached QR image by proxying the gateway statics URL through
// the Paiperwork server. This avoids mixed-content and CORS issues when the
// frontend is served over HTTPS but the gateway provides an HTTP resource.
func whatsappQrImageHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Paiperwork-User")
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if _, allowed := enforceWhatsappActiveUserAccess(w, r, true); !allowed {
		return
	}

	requestedDeviceID := getRequestedWhatsappDeviceIDFromRequest(r)
	if requestedDeviceID != "" || strings.TrimSpace(whatsappGatewayCachedQR) != "" {
		userKey := resolveWhatsappUserKeyFromRequest(r)
		status, err := fetchWhatsappGatewayStatus(&http.Client{Timeout: 5 * time.Second}, false, userKey, requestedDeviceID, false)
		if err == nil && status != nil && status.QRWithheld {
			http.Error(w, "qr-withheld", http.StatusNotFound)
			return
		}
	}

	// Prefer an explicit URL parameter if provided (used by the frontend
	// to tell the proxy which QR image to fetch). Fall back to the
	// server-cached QR if absent.
	urlParam := strings.TrimSpace(r.URL.Query().Get("url"))
	qr := ""
	if urlParam != "" {
		qr = urlParam
	} else {
		qr = strings.TrimSpace(whatsappGatewayCachedQR)
	}

	if qr == "" {
		http.Error(w, "no-qr", http.StatusNotFound)
		return
	}

	// If the QR is provided as a data URL (inlined base64 PNG), decode and
	// serve it directly without proxying. This preserves our no-disk policy
	// when the gateway emits in-memory QR data.
	if strings.HasPrefix(qr, "data:") {
		comma := strings.Index(qr, ",")
		if comma <= 0 {
			http.Error(w, "invalid-data-url", http.StatusBadRequest)
			return
		}
		meta := qr[5:comma]
		dataPart := qr[comma+1:]

		var decoded []byte
		if strings.Contains(meta, "base64") {
			d, derr := base64.StdEncoding.DecodeString(dataPart)
			if derr != nil {
				log.Printf("whatsappQrImageHandler: failed to decode data URL: %v", derr)
				http.Error(w, "invalid-data-url", http.StatusBadRequest)
				return
			}
			decoded = d
		} else {
			// Non-base64 data URLs are URL-encoded
			if un, uerr := url.QueryUnescape(dataPart); uerr == nil {
				decoded = []byte(un)
			} else {
				decoded = []byte(dataPart)
			}
		}

		ct := "image/png"
		if strings.HasPrefix(meta, "image/") {
			parts := strings.Split(meta, ";")
			if len(parts) > 0 {
				ct = parts[0]
			}
		}

		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		w.Header().Set("Content-Type", ct)
		w.WriteHeader(http.StatusOK)
		if _, err := w.Write(decoded); err != nil {
			log.Printf("whatsappQrImageHandler: write data URL bytes failed: %v", err)
		}
		return
	}

	// If we have cached binary image bytes for the current cached QR, serve
	// those directly (fast-path) instead of hitting the gateway statics URL.
	whatsappGatewayCachedBytesMu.Lock()
	haveCache := len(whatsappGatewayCachedQRBytes) > 0 && time.Since(whatsappGatewayCachedQRTimestamp) < whatsappGatewayQRTTL
	cachedBytes := make([]byte, 0)
	cachedCT := whatsappGatewayCachedQRContentType
	if haveCache {
		cachedBytes = make([]byte, len(whatsappGatewayCachedQRBytes))
		copy(cachedBytes, whatsappGatewayCachedQRBytes)
	}
	whatsappGatewayCachedBytesMu.Unlock()

	if urlParam == "" && haveCache {
		// Serve cached bytes
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		if cachedCT != "" {
			w.Header().Set("Content-Type", cachedCT)
		} else {
			w.Header().Set("Content-Type", "image/png")
		}
		w.WriteHeader(http.StatusOK)
		if _, err := w.Write(cachedBytes); err != nil {
			log.Printf("whatsappQrImageHandler: write cached bytes failed: %v", err)
		}
		return
	}

	// Ensure the requested QR points to the local gateway (127.0.0.1 or localhost) for safety.
	if !(strings.HasPrefix(qr, "http://127.0.0.1:") || strings.HasPrefix(qr, "http://localhost:")) {
		http.Error(w, "qr-not-local", http.StatusForbidden)
		return
	}

	client := &http.Client{Timeout: 8 * time.Second}
	// Log proxied URL for debugging
	log.Printf("whatsappQrImageHandler: proxying QR url=%s", qr)
	// If the caller explicitly asked for the same URL we already cached, and
	// we have cached bytes, serve them (avoid duplicate fetch).
	whatsappGatewayCachedBytesMu.Lock()
	usingCachedMatch := (qr == whatsappGatewayCachedQR) && len(whatsappGatewayCachedQRBytes) > 0 && time.Since(whatsappGatewayCachedQRTimestamp) < whatsappGatewayQRTTL
	if usingCachedMatch {
		cachedCT := whatsappGatewayCachedQRContentType
		cachedBytes := make([]byte, len(whatsappGatewayCachedQRBytes))
		copy(cachedBytes, whatsappGatewayCachedQRBytes)
		whatsappGatewayCachedBytesMu.Unlock()
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		if cachedCT != "" {
			w.Header().Set("Content-Type", cachedCT)
		} else {
			w.Header().Set("Content-Type", "image/png")
		}
		w.WriteHeader(http.StatusOK)
		if _, err := w.Write(cachedBytes); err != nil {
			log.Printf("whatsappQrImageHandler: write cached bytes failed: %v", err)
		}
		return
	}
	whatsappGatewayCachedBytesMu.Unlock()

	resp, err := client.Get(qr)
	if err != nil {
		log.Printf("whatsappQrImageHandler: failed to fetch QR image: %v", err)
		http.Error(w, "failed-to-proxy", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	// Forward content-type and body. Allow CORS.
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	if ct := resp.Header.Get("Content-Type"); ct != "" {
		w.Header().Set("Content-Type", ct)
	} else {
		w.Header().Set("Content-Type", "image/png")
	}
	w.WriteHeader(resp.StatusCode)
	if _, copyErr := io.Copy(w, resp.Body); copyErr != nil {
		log.Printf("whatsappQrImageHandler: copy failed: %v", copyErr)
	}
}

func whatsappDevicesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Paiperwork-User")
		w.WriteHeader(http.StatusOK)
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	userKey, allowed := enforceWhatsappActiveUserAccess(w, r, false)
	if !allowed {
		return
	}

	if r.Method == http.MethodDelete {
		deviceID := strings.TrimSpace(r.URL.Query().Get("device_id"))
		if deviceID == "" {
			http.Error(w, "device id required", http.StatusBadRequest)
			return
		}
		if err := purgePersistedWhatsappDeviceForUser(userKey, deviceID); err != nil {
			log.Printf("whatsappDevicesHandler: failed to purge persisted device %s for user=%s: %v", maskPhoneForLog(deviceID), safeUserKeyForFilename(userKey), err)
			http.Error(w, "failed to delete device", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"status":    "ok",
			"device_id": deviceID,
		})
		return
	}

	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get("http://127.0.0.1:3000/devices")
	if err == nil && resp != nil {
		defer resp.Body.Close()
		if resp.StatusCode == http.StatusOK {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			if _, copyErr := io.Copy(w, resp.Body); copyErr != nil {
				log.Printf("whatsappDevicesHandler: copy failed: %v", copyErr)
			}
			return
		}
		log.Printf("whatsappDevicesHandler: gateway returned status %d, falling back to persisted Paiperwork devices", resp.StatusCode)
	} else if err != nil {
		// gateway unavailable; fall back to persisted Paiperwork devices
	}

	persistedDevices, persistedErr := loadPersistedWhatsappDevicesFromDB(userKey)
	if persistedErr != nil {
		log.Printf("whatsappDevicesHandler: failed to load persisted Paiperwork devices for user=%s: %v", safeUserKeyForFilename(userKey), persistedErr)
		http.Error(w, "gateway-unavailable", http.StatusServiceUnavailable)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(map[string]any{
		"status":  200,
		"code":    "SUCCESS",
		"message": "Fetch persisted device success",
		"results": persistedDevices,
	}); err != nil {
		log.Printf("whatsappDevicesHandler: failed to encode persisted device response: %v", err)
	}
}

type whatsappGatewayStatus struct {
	DeviceID    string `json:"deviceId,omitempty"`
	Connected   bool   `json:"connected"`
	LoggedIn    bool   `json:"loggedIn"`
	QRWithheld  bool   `json:"qrWithheld,omitempty"`
	QRDataUrl   string `json:"qrDataUrl,omitempty"`
	QRTimestamp int64  `json:"qrTimestamp,omitempty"`
	QRDuration  int64  `json:"qrDuration,omitempty"`
}

func fetchWhatsappGatewayStatus(client *http.Client, startRequested bool, userKey string, requestedDeviceID string, freshPairRequested bool) (*whatsappGatewayStatus, error) {
	runtimeInMemory := useInMemoryPaiperworkWhatsappRuntime()
	// Ensure there is at least one device for the gowa gateway API
	// Intentionally quiet: this function is polled frequently.
	deviceID, err := ensureWhatsappGatewayDevice(client, userKey, requestedDeviceID, freshPairRequested)
	if err != nil {
		if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
			// Noisy cancellation from context shutdown path; return safe unpaired status.
			return &whatsappGatewayStatus{DeviceID: strings.TrimSpace(requestedDeviceID), Connected: false, LoggedIn: false}, nil
		}
		return nil, fmt.Errorf("gateway status unavailable: %w", err)
	}

	// Check connection status first (avoid unnecessary repeated login calls).
	status, err := fetchWhatsappGatewayConnectionStatus(client, deviceID)
	if err != nil {
		if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
			return &whatsappGatewayStatus{DeviceID: deviceID, Connected: false, LoggedIn: false}, nil
		}

		// In no-disk mode a selected device can exist in Paiperwork-managed state while the
		// in-memory gowa manager has not created that device instance yet.
		// Treat "device not found" status errors as unpaired and continue to
		// /app/login so a QR can be produced.
		errText := strings.ToLower(err.Error())
		if (config.NoDisk || runtimeInMemory) && (strings.Contains(errText, "device") && strings.Contains(errText, "not found")) {
			log.Printf("fetchWhatsappGatewayStatus: status check returned device-not-found for %q, continuing to login flow", maskPhoneForLog(deviceID))
			status = &whatsappGatewayStatus{DeviceID: deviceID, Connected: false, LoggedIn: false}
		} else {
			return nil, fmt.Errorf("gateway status unavailable: %w", err)
		}
	}
	if status != nil && strings.TrimSpace(status.DeviceID) == "" {
		status.DeviceID = deviceID
	}

	if status.Connected && status.LoggedIn {
		activeDeviceID := strings.TrimSpace(status.DeviceID)
		if activeDeviceID == "" {
			activeDeviceID = deviceID
		}
		if userKey != "" && activeDeviceID != "" {
			setSelectedWhatsappDeviceForUser(userKey, activeDeviceID, "")
			if !strings.EqualFold(strings.TrimSpace(activeDeviceID), strings.TrimSpace(deviceID)) {
				setCachedWhatsappGatewayDeviceResolution(deviceID, activeDeviceID)
				//log.Printf("fetchWhatsappGatewayStatus: promoted logged-in device %s to active gateway device %s", maskPhoneForLog(deviceID), maskPhoneForLog(activeDeviceID))
			}
		}

		// Clear warmup suppressor after successful login to stop noisy warmup logs.
		clearWhatsappGatewayWarmup(deviceID)

		// Mark QR as used when login succeeds.
		whatsappGatewayCachedQR = ""
		clearWhatsappPairingProbeState(deviceID)
		whatsappGatewayCachedBytesMu.Lock()
		whatsappGatewayCachedQRBytes = nil
		whatsappGatewayCachedQRContentType = ""
		whatsappGatewayCachedBytesMu.Unlock()

		if whatsappServerStarted {
			currentTargetPhone := ""
			if inferred, err := inferWhatsappGatewayDevicePhoneByID(client, activeDeviceID); err == nil && inferred != "" {
				currentTargetPhone = inferred
				whatsappStartupTargetPhone = inferred
			} else if err != nil {
				log.Printf("fetchWhatsappGatewayStatus: cannot infer target phone for device %s: %v", maskPhoneForLog(activeDeviceID), err)
			}
			if currentTargetPhone == "" {
				currentTargetPhone = whatsappStartupTargetPhone
			}

			if shouldQueueWhatsappWelcome(activeDeviceID, currentTargetPhone) {
				runtimeUserKey := activeWhatsappRuntimeScope()
				//log.Printf("fetchWhatsappGatewayStatus: queueing welcome message dispatch for device %s", maskPhoneForLog(activeDeviceID))
				go dispatchWhatsappWelcomeMessage(runtimeUserKey, activeDeviceID, currentTargetPhone)
			}
			pairRequested = false
		}
		status.DeviceID = activeDeviceID
		return status, nil
	}

	holdQrDuringWarmup := !freshPairRequested && shouldHoldQrDuringStartupWarmup(deviceID, requestedDeviceID)
	if !holdQrDuringWarmup {
		clearWhatsappGatewayWarmup(deviceID)
	}
	allowQrForPersistentDevice, _ := shouldAllowQrForPersistentDevice(client, requestedDeviceID, freshPairRequested)
	if !freshPairRequested && strings.TrimSpace(requestedDeviceID) != "" && isWhatsappSessionRestoreExpected() {
		return &whatsappGatewayStatus{DeviceID: deviceID, Connected: false, LoggedIn: false, QRWithheld: true}, nil
	}

	// Keep the current QR alive until TTL expiration unless user explicitly requested refresh.
	if whatsappGatewayCachedQR != "" && time.Since(whatsappGatewayCachedQRTimestamp) < whatsappGatewayQRTTL {
		if holdQrDuringWarmup {
			if shouldLogWhatsappGatewayWarmup(deviceID) {
				//log.Printf("fetchWhatsappGatewayStatus: startup warm-up active; withholding cached QR for device %s", maskPhoneForLog(deviceID))
			}
			return &whatsappGatewayStatus{DeviceID: deviceID, Connected: false, LoggedIn: false, QRWithheld: true}, nil
		}
		if !allowQrForPersistentDevice {
			//log.Printf("fetchWhatsappGatewayStatus: withholding cached QR for device %s (reason=%s)", maskPhoneForLog(deviceID), qrGateReason)
			return &whatsappGatewayStatus{DeviceID: deviceID, Connected: false, LoggedIn: false, QRWithheld: true}, nil
		}
		if !startRequested {
			markWhatsappPairingProbeState(deviceID, "cached-qr")
			//log.Printf("fetchWhatsappGatewayStatus: using cached QR for device %s", maskPhoneForLog(deviceID))
			return &whatsappGatewayStatus{DeviceID: deviceID, Connected: false, QRDataUrl: whatsappGatewayCachedQR, QRTimestamp: whatsappGatewayCachedQRTimestamp.UnixMilli(), QRDuration: int64(whatsappGatewayQRTTL / time.Second)}, nil
		}

		// If startRequested but too soon, keep same QR and avoid throttled login storm.
		if time.Since(whatsappGatewayLastLoginAttempt) < whatsappGatewayLoginCooldown {
			//log.Printf("fetchWhatsappGatewayStatus: refresh requested but login cooldown active (%.0fs left)", whatsappGatewayLoginCooldown.Seconds()-time.Since(whatsappGatewayLastLoginAttempt).Seconds())
			markWhatsappPairingProbeState(deviceID, "cached-qr-cooldown")
			return &whatsappGatewayStatus{DeviceID: deviceID, Connected: false, QRDataUrl: whatsappGatewayCachedQR, QRTimestamp: whatsappGatewayCachedQRTimestamp.UnixMilli(), QRDuration: int64(whatsappGatewayQRTTL / time.Second)}, nil
		}
	}

	// Force refresh flow when explicitly requested or no valid cached QR.
	loginURL := fmt.Sprintf("http://127.0.0.1:3000/app/login?device_id=%s", url.QueryEscape(deviceID))
	if time.Since(whatsappGatewayLastLoginAttempt) < whatsappGatewayLoginCooldown && !startRequested {
		// Avoid frequent /app/login calls (WhatsApp limits and reuse must be stable)
		q := whatsappGatewayCachedQR
		if len(q) > 80 {
			q = q[:80] + "..." + fmt.Sprintf(" [total %d chars]", len(whatsappGatewayCachedQR))
		}
		//log.Printf("fetchWhatsappGatewayStatus: skipping app/login due cooldown, cached QR=%q", q)
	} else {
		whatsappGatewayLastLoginAttempt = time.Now()
		// noisy during reconnect loops
		if resp, err := client.Get(loginURL); err == nil {
			defer resp.Body.Close()
			if resp.StatusCode >= 400 {
				//log.Printf("fetchWhatsappGatewayStatus: app/login HTTP status=%d", resp.StatusCode)
			}
			if resp.StatusCode == http.StatusOK {
				var appLogin struct {
					Status  int    `json:"status"`
					Code    string `json:"code"`
					Message string `json:"message"`
					Results struct {
						DeviceID    string `json:"device_id"`
						QRLink      string `json:"qr_link"`
						QRData      string `json:"qr_data"`
						QRDuration  int    `json:"qr_duration"`
						QRTimestamp int64  `json:"qr_timestamp"`
					} `json:"results"`
				}
				if err := json.NewDecoder(resp.Body).Decode(&appLogin); err == nil {
					if isWhatsappGatewayAlreadyLoggedInResponse(appLogin.Code, appLogin.Message) {
						//log.Printf("fetchWhatsappGatewayStatus: app/login reports already logged in for device %s; waiting for settled status", maskPhoneForLog(deviceID))
						settledStatus, settledErr := waitForWhatsappGatewayLoggedInStatus(client, deviceID, 4*time.Second)
						if settledErr == nil && settledStatus != nil && settledStatus.LoggedIn {
							clearWhatsappGatewayWarmup(deviceID)
							whatsappGatewayCachedQR = ""
							clearWhatsappPairingProbeState(deviceID)
							whatsappGatewayCachedBytesMu.Lock()
							whatsappGatewayCachedQRBytes = nil
							whatsappGatewayCachedQRContentType = ""
							whatsappGatewayCachedBytesMu.Unlock()
							//log.Printf("fetchWhatsappGatewayStatus: settled already-logged-in status connected=%v loggedIn=%v", settledStatus.Connected, settledStatus.LoggedIn)
							return settledStatus, nil
						}
						if settledErr != nil {
							log.Printf("fetchWhatsappGatewayStatus: already-logged-in settle check failed: %v", settledErr)
						} else if settledStatus != nil {
							log.Printf("fetchWhatsappGatewayStatus: already-logged-in settle check still pending connected=%v loggedIn=%v", settledStatus.Connected, settledStatus.LoggedIn)
						}
					}
					// Prefer inlined data URL QR (qr_data) when provided by the gateway
					if appLogin.Results.QRData != "" {
						qr := appLogin.Results.QRData
						qrIssuedAt := appLogin.Results.QRTimestamp
						if qrIssuedAt <= 0 {
							qrIssuedAt = time.Now().UnixMilli()
						}
						whatsappGatewayCachedQR = qr
						whatsappGatewayCachedQRTimestamp = time.UnixMilli(qrIssuedAt)

						// If the gateway provided a base64 data URL, decode and cache bytes for fast proxying
						if strings.HasPrefix(qr, "data:") {
							comma := strings.Index(qr, ",")
							if comma > 0 {
								meta := qr[5:comma]
								dataPart := qr[comma+1:]
								if strings.Contains(meta, "base64") {
									if decoded, derr := base64.StdEncoding.DecodeString(dataPart); derr == nil {
										ct := "image/png"
										if strings.HasPrefix(meta, "image/") {
											parts := strings.Split(meta, ";")
											if len(parts) > 0 {
												ct = parts[0]
											}
										}
										whatsappGatewayCachedBytesMu.Lock()
										whatsappGatewayCachedQRBytes = decoded
										whatsappGatewayCachedQRContentType = ct
										whatsappGatewayCachedBytesMu.Unlock()
										//log.Printf("fetchWhatsappGatewayStatus: decoded and cached QR data URL bytes size=%d", len(decoded))
									} else {
										log.Printf("fetchWhatsappGatewayStatus: failed to decode QR data URL: %v", derr)
									}
								}
							}
						}

						if appLogin.Results.QRDuration > 0 {
							whatsappGatewayQRTTL = time.Second * time.Duration(appLogin.Results.QRDuration)
						}
						markWhatsappPairingProbeState(deviceID, "login-qr-data")
						if holdQrDuringWarmup {
							if shouldLogWhatsappGatewayWarmup(deviceID) {
								//log.Printf("fetchWhatsappGatewayStatus: startup warm-up active; QR generated but withheld for device %s", maskPhoneForLog(deviceID))
							}
							return &whatsappGatewayStatus{DeviceID: deviceID, Connected: false, LoggedIn: false, QRWithheld: true}, nil
						}
						if !allowQrForPersistentDevice {
							//log.Printf("fetchWhatsappGatewayStatus: QR generated but withheld for device %s (reason=%s)", maskPhoneForLog(deviceID), qrGateReason)
							return &whatsappGatewayStatus{DeviceID: deviceID, Connected: false, LoggedIn: false, QRWithheld: true}, nil
						}
						//log.Printf("fetchWhatsappGatewayStatus: got QR data from app/login (inlined data URL) issued_at=%d ttl=%ds", qrIssuedAt, int64(whatsappGatewayQRTTL/time.Second))
						return &whatsappGatewayStatus{DeviceID: deviceID, Connected: false, QRDataUrl: qr, QRTimestamp: whatsappGatewayCachedQRTimestamp.UnixMilli(), QRDuration: int64(whatsappGatewayQRTTL / time.Second)}, nil
					}

					if appLogin.Results.QRLink != "" {
						qr := appLogin.Results.QRLink
						if strings.HasPrefix(qr, "/") {
							qr = "http://127.0.0.1:3000" + qr
						}
						qrIssuedAt := appLogin.Results.QRTimestamp
						if qrIssuedAt <= 0 {
							qrIssuedAt = time.Now().UnixMilli()
						}
						whatsappGatewayCachedQR = qr
						whatsappGatewayCachedQRTimestamp = time.UnixMilli(qrIssuedAt)

						// Try to fetch and cache the QR image bytes immediately so the
						// main server can proxy the binary even if the gateway later
						// removes the transient file. This is best-effort and will
						// not block the status response on failure.
						go func(q string) {
							c := &http.Client{Timeout: 4 * time.Second}
							resp, err := c.Get(q)
							if err != nil {
								log.Printf("fetchWhatsappGatewayStatus: failed to fetch QR image for caching: %v", err)
								return
							}
							defer resp.Body.Close()
							if resp.StatusCode != http.StatusOK {
								log.Printf("fetchWhatsappGatewayStatus: QR image fetch non-200: %d", resp.StatusCode)
								return
							}
							ct := resp.Header.Get("Content-Type")
							if !strings.HasPrefix(ct, "image") {
								log.Printf("fetchWhatsappGatewayStatus: QR image has non-image Content-Type: %s", ct)
								return
							}
							body, rerr := io.ReadAll(io.LimitReader(resp.Body, 1024*1024))
							if rerr != nil {
								log.Printf("fetchWhatsappGatewayStatus: failed to read QR image body: %v", rerr)
								return
							}
							whatsappGatewayCachedBytesMu.Lock()
							whatsappGatewayCachedQRBytes = body
							whatsappGatewayCachedQRContentType = ct
							whatsappGatewayCachedBytesMu.Unlock()
							//log.Printf("fetchWhatsappGatewayStatus: cached QR image bytes size=%d", len(body))
						}(qr)
						if appLogin.Results.QRDuration > 0 {
							whatsappGatewayQRTTL = time.Second * time.Duration(appLogin.Results.QRDuration)
						}
						markWhatsappPairingProbeState(deviceID, "login-qr-link")
						if holdQrDuringWarmup {
							//log.Printf("fetchWhatsappGatewayStatus: startup warm-up active; QR link generated but withheld for device %s", maskPhoneForLog(deviceID))
							return &whatsappGatewayStatus{DeviceID: deviceID, Connected: false, LoggedIn: false, QRWithheld: true}, nil
						}
						if !allowQrForPersistentDevice {
							//log.Printf("fetchWhatsappGatewayStatus: QR link generated but withheld for device %s (reason=%s)", maskPhoneForLog(deviceID), qrGateReason)
							return &whatsappGatewayStatus{DeviceID: deviceID, Connected: false, LoggedIn: false, QRWithheld: true}, nil
						}
						//log.Printf("fetchWhatsappGatewayStatus: got QR link from app/login: %s issued_at=%d ttl=%ds", qrRefForLog(qr), qrIssuedAt, int64(whatsappGatewayQRTTL/time.Second))
						return &whatsappGatewayStatus{DeviceID: deviceID, Connected: false, QRDataUrl: qr, QRTimestamp: whatsappGatewayCachedQRTimestamp.UnixMilli(), QRDuration: int64(whatsappGatewayQRTTL / time.Second)}, nil
					}
				}
			} else {
				body, _ := io.ReadAll(resp.Body)
				bodyText := strings.TrimSpace(string(body))
				if resp.StatusCode == http.StatusInternalServerError && strings.Contains(bodyText, "SESSION_SAVED_ERROR") {
					return &whatsappGatewayStatus{DeviceID: deviceID, Connected: false, LoggedIn: false}, nil
				}
				if resp.StatusCode >= 400 {
					log.Printf("fetchWhatsappGatewayStatus: app/login status=%d body=%s", resp.StatusCode, compactLogValue(bodyText, 700))
				}
				if startRequested && resp.StatusCode == http.StatusGatewayTimeout {
					log.Printf("fetchWhatsappGatewayStatus: gateway login timeout; preserving device %s and clearing transient state", maskPhoneForLog(deviceID))
					clearWhatsappGatewayTransientState(deviceID)
					return &whatsappGatewayStatus{DeviceID: deviceID, Connected: false, LoggedIn: false}, nil
				}
				if startRequested && resp.StatusCode == http.StatusUnauthorized {
					log.Printf("fetchWhatsappGatewayStatus: gateway returned 401 during login; preserving device %s pending remote logout or explicit unpair", maskPhoneForLog(deviceID))
					welcomeMu.Lock()
					clearWhatsappWelcomeState(deviceID, "")
					welcomeMu.Unlock()
					clearWhatsappGatewayTransientState(deviceID)
					return &whatsappGatewayStatus{DeviceID: deviceID, Connected: false, LoggedIn: false}, nil
				}
			}
		}
	}

	// Re-check connection to ensure we can report the final state properly.
	status, err = fetchWhatsappGatewayConnectionStatus(client, deviceID)
	if err != nil {
		return nil, fmt.Errorf("gateway status unavailable: %w", err)
	}
	if status.Connected {
		whatsappGatewayCachedQR = ""
		whatsappGatewayCachedBytesMu.Lock()
		whatsappGatewayCachedQRBytes = nil
		whatsappGatewayCachedQRContentType = ""
		whatsappGatewayCachedBytesMu.Unlock()
		return status, nil
	}
	if whatsappGatewayCachedQR != "" && time.Since(whatsappGatewayCachedQRTimestamp) < whatsappGatewayQRTTL {
		markWhatsappPairingProbeState(deviceID, "cached-qr-final")
		//log.Printf("fetchWhatsappGatewayStatus: using cached QR for device %s", deviceID)
		return &whatsappGatewayStatus{DeviceID: deviceID, Connected: false, QRDataUrl: whatsappGatewayCachedQR, QRTimestamp: whatsappGatewayCachedQRTimestamp.UnixMilli(), QRDuration: int64(whatsappGatewayQRTTL / time.Second)}, nil
	}

	log.Printf("fetchWhatsappGatewayStatus: no QR available, status connected=%v", status.Connected)
	return status, nil
}

func fetchWhatsappGatewayConnectionStatusExact(client *http.Client, deviceID string) (*whatsappGatewayStatus, error) {
	statusURL := fmt.Sprintf("http://127.0.0.1:3000/app/status?device_id=%s", url.QueryEscape(deviceID))
	resp, err := client.Get(statusURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("/app/status %d", resp.StatusCode)
	}
	var statusResp struct {
		Status  int    `json:"status"`
		Code    string `json:"code"`
		Message string `json:"message"`
		Results struct {
			IsConnected bool `json:"is_connected"`
			IsLoggedIn  bool `json:"is_logged_in"`
		} `json:"results"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&statusResp); err != nil {
		return nil, err
	}
	return &whatsappGatewayStatus{
		DeviceID:  deviceID,
		Connected: statusResp.Results.IsConnected,
		LoggedIn:  statusResp.Results.IsLoggedIn,
	}, nil
}

func fetchWhatsappGatewayConnectionStatus(client *http.Client, deviceID string) (*whatsappGatewayStatus, error) {
	status, err := fetchWhatsappGatewayConnectionStatusExact(client, deviceID)
	if err != nil {
		return nil, err
	}
	if status != nil && (status.Connected || status.LoggedIn) {
		return status, nil
	}

	candidateIDs, candidatesErr := resolveWhatsappGatewayDeviceCandidatesByIdentity(client, deviceID)
	if candidatesErr != nil {
		return status, nil
	}

	trimmedDeviceID := strings.TrimSpace(deviceID)
	for _, candidateID := range candidateIDs {
		if strings.TrimSpace(candidateID) == "" || strings.TrimSpace(candidateID) == trimmedDeviceID {
			continue
		}
		candidateStatus, candidateErr := fetchWhatsappGatewayConnectionStatusExact(client, candidateID)
		if candidateErr != nil || candidateStatus == nil {
			continue
		}
		if candidateStatus.Connected || candidateStatus.LoggedIn {
			candidateStatus.DeviceID = candidateID
			return candidateStatus, nil
		}
	}

	return status, nil
}

type whatsappGatewayDeviceDetails struct {
	ID    string
	JID   string
	State string
}

func fetchWhatsappGatewayDeviceDetails(client *http.Client, deviceID string) (*whatsappGatewayDeviceDetails, error) {
	trimmedID := strings.TrimSpace(deviceID)
	if trimmedID == "" {
		return nil, fmt.Errorf("device id is required")
	}

	deviceURL := fmt.Sprintf("http://127.0.0.1:3000/devices/%s", url.PathEscape(trimmedID))
	resp, err := client.Get(deviceURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return nil, fmt.Errorf("device details %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	var payload struct {
		Results struct {
			ID    string `json:"id"`
			JID   string `json:"jid"`
			State string `json:"state"`
		} `json:"results"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, err
	}

	resolvedID := strings.TrimSpace(payload.Results.ID)
	if resolvedID == "" {
		resolvedID = trimmedID
	}

	return &whatsappGatewayDeviceDetails{
		ID:    resolvedID,
		JID:   strings.TrimSpace(payload.Results.JID),
		State: strings.TrimSpace(payload.Results.State),
	}, nil
}

func shouldSelectNoDiskGatewayDevice(details *whatsappGatewayDeviceDetails, status *whatsappGatewayStatus) bool {
	if status != nil && (status.Connected || status.LoggedIn) {
		return true
	}
	if details == nil {
		return false
	}
	if hasActiveWhatsappPairingProbe(details.ID) {
		return true
	}
	return strings.TrimSpace(details.JID) != ""
}

func shouldPruneNoDiskGatewayPlaceholder(deviceID, preferredDeviceID string, details *whatsappGatewayDeviceDetails, status *whatsappGatewayStatus) bool {
	if strings.TrimSpace(deviceID) == "" {
		return false
	}
	if strings.TrimSpace(preferredDeviceID) != "" && strings.TrimSpace(deviceID) == strings.TrimSpace(preferredDeviceID) {
		return false
	}
	if status != nil && (status.Connected || status.LoggedIn) {
		return false
	}
	if hasActiveWhatsappPairingProbe(deviceID) {
		return false
	}
	if details == nil {
		return false
	}
	return strings.TrimSpace(details.JID) == ""
}

func resolveExistingNoDiskGatewayDevice(ids []string, selectedDeviceID string, candidateStatus map[string]*whatsappGatewayStatus) string {
	trimmedSelected := strings.TrimSpace(selectedDeviceID)
	if trimmedSelected != "" {
		for _, id := range ids {
			if strings.TrimSpace(id) == trimmedSelected {
				return trimmedSelected
			}
		}
	}

	for _, id := range ids {
		if hasActiveWhatsappPairingProbe(id) {
			return id
		}
	}

	for _, id := range ids {
		status := candidateStatus[id]
		if status != nil && status.Connected && status.LoggedIn {
			return id
		}
	}

	for _, id := range ids {
		if strings.TrimSpace(id) != "" {
			return strings.TrimSpace(id)
		}
	}

	return ""
}

func clearWhatsappGatewayTransientState(deviceID string) {
	whatsappGatewayCachedQR = ""
	whatsappGatewayCachedBytesMu.Lock()
	whatsappGatewayCachedQRBytes = nil
	whatsappGatewayCachedQRContentType = ""
	whatsappGatewayCachedBytesMu.Unlock()
	clearWhatsappPairingProbeState(deviceID)
	clearWhatsappGatewayDeviceResolutionCache()
	welcomeMu.Lock()
	clearWhatsappWelcomeState(deviceID, "")
	welcomeMu.Unlock()
}

func ensureWhatsappGatewayDevice(client *http.Client, userKey, requestedDeviceID string, freshPairRequested bool) (string, error) {
	runtimeInMemory := useInMemoryPaiperworkWhatsappRuntime()
	effectiveFreshPairRequested := freshPairRequested || strings.EqualFold(strings.TrimSpace(os.Getenv(whatsappFreshPairStartupEnv)), "true")
	trimmedRequested := strings.TrimSpace(requestedDeviceID)
	if trimmedRequested == "" && userKey != "" {
		trimmedRequested = strings.TrimSpace(getSelectedWhatsappDeviceIDForUser(userKey))
	}
	if effectiveFreshPairRequested && strings.TrimSpace(userKey) != "" {
		setSyncedPersistedWhatsappDevicesForUser(userKey, nil)
		syncPersistedWhatsappBootstrapEnv(userKey)
	}
	if trimmedRequested != "" && !effectiveFreshPairRequested {
		if resolvedRequested, resolvedFromCache, resolveErr := resolveWhatsappGatewayRegisteredDeviceID(client, trimmedRequested); resolveErr == nil && strings.TrimSpace(resolvedRequested) != "" {
			if !strings.EqualFold(strings.TrimSpace(resolvedRequested), trimmedRequested) && !resolvedFromCache {
				//log.Printf("ensureWhatsappGatewayDevice: remapped requested runtime device %s to registered gateway id %s", maskPhoneForLog(trimmedRequested), maskPhoneForLog(resolvedRequested))
			}
			trimmedRequested = strings.TrimSpace(resolvedRequested)
		} else if !isPersistableWhatsappDeviceID(trimmedRequested) {
			if userKey != "" {
				if resolvedPersistedID, ok, persistErr := resolvePersistedWhatsappDeviceID(userKey, trimmedRequested); persistErr != nil {
					//log.Printf("ensureWhatsappGatewayDevice: failed to resolve persisted requested device candidate=%s user=%s: %v", maskPhoneForLog(trimmedRequested), safeUserKeyForFilename(userKey), persistErr)
				} else if ok && strings.TrimSpace(resolvedPersistedID) != "" {
					trimmedRequested = strings.TrimSpace(resolvedPersistedID)
					requestedDeviceID = trimmedRequested
					//log.Printf("ensureWhatsappGatewayDevice: keeping persisted non-paired requested device candidate=%s user=%s", maskPhoneForLog(trimmedRequested), safeUserKeyForFilename(userKey))
				}
			}
			if !isPersistableWhatsappDeviceID(trimmedRequested) && !strings.HasPrefix(strings.ToLower(trimmedRequested), "pw-") {
				//log.Printf("ensureWhatsappGatewayDevice: rejected non-paired requested device candidate=%s user=%s freshPair=%v", maskPhoneForLog(trimmedRequested), safeUserKeyForFilename(userKey), effectiveFreshPairRequested)
				trimmedRequested = ""
				requestedDeviceID = ""
			}
		}
	}
	if isGatewayRunning() && !isGatewayReady() {
		if err := waitForLocalGateway(5 * time.Second); err != nil {
			if trimmedRequested != "" {
				return trimmedRequested, nil
			}
			return "", fmt.Errorf("gateway not ready: %v", err)
		}
	}

	if config.NoDisk || runtimeInMemory {
		if effectiveFreshPairRequested {
			if trimmedRequested != "" {
				markWhatsappPairingProbeState(trimmedRequested, "fresh-pair-active-device")
				return trimmedRequested, nil
			}

			// Fresh-pair polling can hit this path before the frontend has pinned the
			// newly created placeholder device id into subsequent requests. Reuse any
			// existing active probe/logged-in device instead of creating another
			// placeholder on every check-only poll.
			if resp, err := client.Get("http://127.0.0.1:3000/devices"); err == nil && resp != nil {
				var existing struct {
					Results []struct {
						ID     string `json:"id"`
						Device string `json:"device"`
					} `json:"results"`
				}
				if resp.StatusCode == http.StatusOK && json.NewDecoder(resp.Body).Decode(&existing) == nil {
					candidateIDs := make([]string, 0, len(existing.Results))
					candidateStatus := make(map[string]*whatsappGatewayStatus, len(existing.Results))
					candidateDetails := make(map[string]*whatsappGatewayDeviceDetails, len(existing.Results))
					for _, d := range existing.Results {
						id := strings.TrimSpace(d.ID)
						if id == "" {
							id = strings.TrimSpace(d.Device)
						}
						if id == "" {
							continue
						}
						candidateIDs = append(candidateIDs, id)
						if status, serr := fetchWhatsappGatewayConnectionStatus(client, id); serr == nil && status != nil {
							candidateStatus[id] = status
						}
						if details, derr := fetchWhatsappGatewayDeviceDetails(client, id); derr == nil && details != nil {
							candidateDetails[id] = details
						}
					}

					for _, id := range candidateIDs {
						if shouldSelectNoDiskGatewayDevice(candidateDetails[id], candidateStatus[id]) {
							markWhatsappPairingProbeState(id, "fresh-pair-existing-probe")
							return id, nil
						}
					}
				}
				resp.Body.Close()
			}

			// Purge all existing devices from gowa so fresh-pair starts with no
			// auto-reconnection to any previously saved device.
			if purgeResp, purgeErr := client.Get("http://127.0.0.1:3000/devices"); purgeErr == nil {
				var purgeList struct {
					Results []struct {
						ID     string `json:"id"`
						Device string `json:"device"`
					} `json:"results"`
				}
				if json.NewDecoder(purgeResp.Body).Decode(&purgeList) == nil {
					for _, d := range purgeList.Results {
						did := strings.TrimSpace(d.ID)
						if did == "" {
							did = strings.TrimSpace(d.Device)
						}
						if did != "" {
							if derr := deleteWhatsappGatewayDevice(client, did); derr == nil {
								//log.Printf("ensureWhatsappGatewayDevice: fresh-pair purged stale gowa device: %s", maskPhoneForLog(did))
							}
						}
					}
				}
				purgeResp.Body.Close()
			}

			createdID, createErr := ensureSingleWhatsappGatewayPlaceholder(client, "", "fresh-pair-request")
			if createErr != nil {
				//log.Printf("ensureWhatsappGatewayDevice: NoDisk mode fresh-pair create request failed: %v", createErr)
			} else if strings.TrimSpace(createdID) != "" {
				//log.Printf("ensureWhatsappGatewayDevice: NoDisk mode created fresh-pair device placeholder: %s", maskPhoneForLog(createdID))
				return createdID, nil
			}

			return "", nil
		}

		listNoDiskDevices := func() ([]string, error) {
			resp, err := client.Get("http://127.0.0.1:3000/devices")
			if err != nil {
				return nil, err
			}
			defer resp.Body.Close()
			if resp.StatusCode != http.StatusOK {
				return nil, fmt.Errorf("/devices %d", resp.StatusCode)
			}

			var payload struct {
				Results []struct {
					ID     string `json:"id"`
					Device string `json:"device"`
				} `json:"results"`
			}
			if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
				return nil, err
			}

			ids := make([]string, 0, len(payload.Results))
			for _, d := range payload.Results {
				id := strings.TrimSpace(d.ID)
				if id == "" {
					id = strings.TrimSpace(d.Device)
				}
				if id != "" {
					ids = append(ids, id)
				}
			}
			return ids, nil
		}

		noDiskDeviceIDs, idsErr := listNoDiskDevices()
		candidateDetails := make(map[string]*whatsappGatewayDeviceDetails, len(noDiskDeviceIDs))
		candidateStatus := make(map[string]*whatsappGatewayStatus, len(noDiskDeviceIDs))
		for _, id := range noDiskDeviceIDs {
			if status, serr := fetchWhatsappGatewayConnectionStatus(client, id); serr == nil && status != nil {
				candidateStatus[id] = status
			}
			if details, derr := fetchWhatsappGatewayDeviceDetails(client, id); derr == nil && details != nil {
				candidateDetails[id] = details
			}
		}
		if idsErr == nil && len(noDiskDeviceIDs) > 0 {
			if resolvedID := resolveExistingNoDiskGatewayDevice(noDiskDeviceIDs, trimmedRequested, candidateStatus); resolvedID != "" {
				if trimmedRequested != "" && !strings.EqualFold(strings.TrimSpace(trimmedRequested), strings.TrimSpace(resolvedID)) {
					//log.Printf("ensureWhatsappGatewayDevice: NoDisk mode using already logged-in device %s over requested candidate %s", maskPhoneForLog(resolvedID), maskPhoneForLog(trimmedRequested))
				}
				if trimmedRequested == "" && userKey != "" {
					details := candidateDetails[resolvedID]
					status := candidateStatus[resolvedID]
					if status != nil && (status.Connected || status.LoggedIn) {
						setSelectedWhatsappDeviceForUser(userKey, resolvedID, "")
					} else if details != nil && strings.TrimSpace(details.JID) != "" {
						setSelectedWhatsappDeviceForUser(userKey, resolvedID, "")
					}
				}
				return resolvedID, nil
			}
		}

		if requestedDeviceID != "" {
			if candidateIDs, resolveErr := resolveWhatsappGatewayDeviceCandidatesByIdentity(client, trimmedRequested); resolveErr == nil {
				for _, candidateID := range candidateIDs {
					status := candidateStatus[candidateID]
					if status == nil {
						if fetchedStatus, statusErr := fetchWhatsappGatewayConnectionStatus(client, candidateID); statusErr == nil && fetchedStatus != nil {
							status = fetchedStatus
							candidateStatus[candidateID] = fetchedStatus
						}
					}
					if status != nil && status.Connected && status.LoggedIn {
						if !strings.EqualFold(strings.TrimSpace(candidateID), strings.TrimSpace(trimmedRequested)) {
							//log.Printf("ensureWhatsappGatewayDevice: NoDisk mode using identity-matched active device %s over requested candidate %s", maskPhoneForLog(candidateID), maskPhoneForLog(trimmedRequested))
						}
						return candidateID, nil
					}
				}
			}

			// Best-effort: make sure requested device exists in gateway registry,
			// so /app/status and /app/login do not fail with DEVICE_NOT_FOUND.
			// NOTE: avoid /devices/:id here because that route panics on not-found.
			exists := false
			if idsErr == nil {
				for _, id := range noDiskDeviceIDs {
					if id == trimmedRequested {
						exists = true
						break
					}
				}
			}

			if exists {
				return trimmedRequested, nil
			}

			createBody := strings.NewReader(fmt.Sprintf(`{"device_id":"%s"}`, trimmedRequested))
			if createResp, createErr := client.Post("http://127.0.0.1:3000/devices", "application/json", createBody); createErr == nil {
				createResp.Body.Close()
				if createResp.StatusCode == http.StatusOK {
					markWhatsappPairingProbeState(trimmedRequested, "selected-device-placeholder")
					//log.Printf("ensureWhatsappGatewayDevice: NoDisk mode created requested device placeholder: %s", maskPhoneForLog(trimmedRequested))
				} else {
					//log.Printf("ensureWhatsappGatewayDevice: NoDisk mode could not create requested device placeholder status=%d id=%s", createResp.StatusCode, maskPhoneForLog(trimmedRequested))
				}
			} else {
				//log.Printf("ensureWhatsappGatewayDevice: NoDisk mode create requested device request failed: %v", createErr)
			}

			//log.Printf("ensureWhatsappGatewayDevice: NoDisk mode using requested device directly: %s", maskPhoneForLog(trimmedRequested))
			return trimmedRequested, nil
		}

		if idsErr == nil && len(noDiskDeviceIDs) > 0 {
			for _, id := range noDiskDeviceIDs {
				if hasActiveWhatsappPairingProbe(id) {
					markWhatsappPairingProbeState(id, "reuse-active-probe")
					//log.Printf("ensureWhatsappGatewayDevice: NoDisk mode reusing active probe device: %s", maskPhoneForLog(id))
					return id, nil
				}
				if shouldSelectNoDiskGatewayDevice(candidateDetails[id], candidateStatus[id]) {
					//log.Printf("ensureWhatsappGatewayDevice: NoDisk mode selected existing device from registry: %s", maskPhoneForLog(id))
					return id, nil
				}
				if shouldPruneNoDiskGatewayPlaceholder(id, "", candidateDetails[id], candidateStatus[id]) {
					if derr := deleteWhatsappGatewayDevice(client, id); derr != nil {
						//log.Printf("ensureWhatsappGatewayDevice: NoDisk mode failed to prune orphan placeholder %s: %v", id, derr)
					} else {
						//log.Printf("ensureWhatsappGatewayDevice: NoDisk mode pruned orphan placeholder device: %s", maskPhoneForLog(id))
					}
				}
			}
		}

		// Zero-device path for runtime in-memory/no-disk mode.
		// Only auto-create a placeholder when an explicit start/pair flow is active.
		if !pairRequested {
			//log.Printf("ensureWhatsappGatewayDevice: NoDisk mode skipping placeholder creation because pairing has not been requested")
			return "", fmt.Errorf("no paired device available")
		}

		createdID, createErr := ensureSingleWhatsappGatewayPlaceholder(client, "", "fresh-device-placeholder")
		if createErr != nil {
			//log.Printf("ensureWhatsappGatewayDevice: NoDisk mode create fresh device request failed: %v", createErr)
		} else if strings.TrimSpace(createdID) != "" {
			//log.Printf("ensureWhatsappGatewayDevice: NoDisk mode created fresh device placeholder: %s", maskPhoneForLog(createdID))
			return createdID, nil
		}

		//log.Printf("ensureWhatsappGatewayDevice: NoDisk mode no requested device served and no devices discovered")
		return "", nil
	}

	listURL := "http://127.0.0.1:3000/devices"
	if effectiveFreshPairRequested {
		trimmedPreferred := strings.TrimSpace(requestedDeviceID)
		if trimmedPreferred != "" {
			markWhatsappPairingProbeState(trimmedPreferred, "fresh-pair-active-device")
			return trimmedPreferred, nil
		}

		if probeID := findActiveWhatsappPairingProbeID(); probeID != "" {
			if probeResp, probeErr := client.Get(listURL); probeErr == nil {
				var probeList struct {
					Results []struct {
						ID string `json:"id"`
					} `json:"results"`
				}
				if json.NewDecoder(probeResp.Body).Decode(&probeList) == nil {
					for _, d := range probeList.Results {
						if strings.EqualFold(strings.TrimSpace(d.ID), probeID) {
							markWhatsappPairingProbeState(probeID, "fresh-pair-reuse-active-probe")
							probeResp.Body.Close()
							return probeID, nil
						}
					}
				}
				probeResp.Body.Close()
			}
		}

		// Purge all existing gowa devices so fresh-pair starts with no auto-reconnection.
		if purgeResp, purgeErr := client.Get(listURL); purgeErr == nil {
			var purgeList struct {
				Results []struct {
					ID string `json:"id"`
				} `json:"results"`
			}
			if json.NewDecoder(purgeResp.Body).Decode(&purgeList) == nil {
				for _, d := range purgeList.Results {
					did := strings.TrimSpace(d.ID)
					if did != "" {
						if derr := deleteWhatsappGatewayDevice(client, did); derr == nil {
							//log.Printf("ensureWhatsappGatewayDevice: fresh-pair purged stale gowa device: %s", maskPhoneForLog(did))
						}
					}
				}
			}
			purgeResp.Body.Close()
		}

		createdID, createErr := ensureSingleWhatsappGatewayPlaceholder(client, "", "fresh-pair-request")
		if createErr != nil {
			return "", createErr
		}
		if strings.TrimSpace(createdID) == "" {
			return "", fmt.Errorf("created device response missing id")
		}
		//log.Printf("ensureWhatsappGatewayDevice: created fresh-pair device id=%s", maskPhoneForLog(createdID))
		return createdID, nil
	}

	// Use Paiperwork WhatsApp DB as the source-of-truth for device discovery and selection.
	if strings.TrimSpace(userKey) != "" {
		persistedDevices, dbErr := loadPersistedWhatsappDevicesFromDB(userKey)
		if dbErr != nil {
			return "", dbErr
		}
		if len(persistedDevices) == 1 {
			persistedEntry := persistedDevices[0]
			selectedID := strings.TrimSpace(persistedEntry.ID)
			if selectedID != "" {
				if trimmedRequested != "" && !strings.EqualFold(strings.TrimSpace(trimmedRequested), strings.TrimSpace(selectedID)) {
					if candidateIDs, resolveErr := resolveWhatsappGatewayDeviceCandidatesByIdentity(client, trimmedRequested); resolveErr == nil && len(candidateIDs) > 0 {
						selectedCandidateID := strings.TrimSpace(candidateIDs[0])
						for _, candidateID := range candidateIDs {
							trimmedCandidateID := strings.TrimSpace(candidateID)
							if trimmedCandidateID == "" {
								continue
							}
							if status, statusErr := fetchWhatsappGatewayConnectionStatus(client, trimmedCandidateID); statusErr == nil && status != nil && (status.Connected || status.LoggedIn) {
								selectedCandidateID = trimmedCandidateID
								break
							}
						}
						//log.Printf("ensureWhatsappGatewayDevice: using explicit runtime device %s as registered gateway id %s", maskPhoneForLog(trimmedRequested), maskPhoneForLog(selectedCandidateID))
						return selectedCandidateID, nil
					}
				}

				identityCandidates := []string{selectedID, strings.TrimSpace(persistedEntry.JID), strings.TrimSpace(persistedEntry.PhoneNumber)}
				resolvedCandidateIDs := make([]string, 0, 4)
				seenCandidateIDs := make(map[string]struct{}, 4)
				for _, identity := range identityCandidates {
					if strings.TrimSpace(identity) == "" {
						continue
					}
					candidateIDs, resolveErr := resolveWhatsappGatewayDeviceCandidatesByIdentity(client, identity)
					if resolveErr != nil {
						continue
					}
					for _, candidateID := range candidateIDs {
						trimmedCandidateID := strings.TrimSpace(candidateID)
						if trimmedCandidateID == "" {
							continue
						}
						if _, seen := seenCandidateIDs[trimmedCandidateID]; seen {
							continue
						}
						seenCandidateIDs[trimmedCandidateID] = struct{}{}
						resolvedCandidateIDs = append(resolvedCandidateIDs, trimmedCandidateID)
					}
				}

				for _, candidateID := range resolvedCandidateIDs {
					if status, statusErr := fetchWhatsappGatewayConnectionStatus(client, candidateID); statusErr == nil && status != nil && (status.Connected || status.LoggedIn) {
						if !strings.EqualFold(candidateID, selectedID) {
							setSelectedWhatsappDeviceForUser(userKey, candidateID, "")
							//log.Printf("ensureWhatsappGatewayDevice: promoting single persisted device %s to active gateway device %s", maskPhoneForLog(selectedID), maskPhoneForLog(candidateID))
						}
						return candidateID, nil
					}
				}

				if len(resolvedCandidateIDs) > 0 {
					resolvedID := resolvedCandidateIDs[0]
					if !strings.EqualFold(resolvedID, selectedID) {
						setSelectedWhatsappDeviceForUser(userKey, resolvedID, "")
						//log.Printf("ensureWhatsappGatewayDevice: using single persisted device identity-matched gateway id %s over stored device id %s", maskPhoneForLog(resolvedID), maskPhoneForLog(selectedID))
					} else {
						//log.Printf("ensureWhatsappGatewayDevice: using single persisted device already present in gateway registry: %s", maskPhoneForLog(resolvedID))
					}
					return resolvedID, nil
				}

				if status, statusErr := fetchWhatsappGatewayConnectionStatus(client, selectedID); statusErr == nil && status != nil && status.Connected && status.LoggedIn {
					return selectedID, nil
				}
				//log.Printf("ensureWhatsappGatewayDevice: persisted device %s is not verified as active gateway device; falling back to gateway discovery", maskPhoneForLog(selectedID))
			}
		}
		if len(persistedDevices) > 1 {
			if trimmedRequested != "" {
				if resolvedID, ok, resolveErr := resolvePersistedWhatsappDeviceID(userKey, trimmedRequested); resolveErr != nil {
					return "", resolveErr
				} else if ok {
					return resolvedID, nil
				}
			}

			for _, entry := range persistedDevices {
				candidateID := strings.TrimSpace(entry.ID)
				if candidateID == "" {
					continue
				}
				if status, serr := fetchWhatsappGatewayConnectionStatus(client, candidateID); serr == nil && status != nil && status.Connected && status.LoggedIn {
					setSelectedWhatsappDeviceForUser(userKey, candidateID, "")
					return candidateID, nil
				}
			}

			fallbackID := strings.TrimSpace(persistedDevices[0].ID)
			if fallbackID != "" {
				setSelectedWhatsappDeviceForUser(userKey, fallbackID, "")
				return fallbackID, nil
			}
		}
	}

	resp, err := client.Get(listURL)
	if err != nil {
		if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
			// Graceful shutdown/timeout cancellation - treat as no device yet.
			return "", context.Canceled
		}
		return "", err
	}
	defer resp.Body.Close()

	var listResp struct {
		Code    string `json:"code"`
		Message string `json:"message"`
		Results []struct {
			ID string `json:"id"`
		} `json:"results"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&listResp); err != nil {
		return "", err
	}

	if requestedDeviceID != "" {
		trimmedPreferred := strings.TrimSpace(requestedDeviceID)
		for _, d := range listResp.Results {
			if strings.TrimSpace(d.ID) == trimmedPreferred {
				//log.Printf("ensureWhatsappGatewayDevice: using requested device already present: %s", maskPhoneForLog(trimmedPreferred))
				return trimmedPreferred, nil
			}
		}

		// Try to fetch requested device explicitly in case it exists but is not in the list.
		prefURL := fmt.Sprintf("http://127.0.0.1:3000/devices/%s", url.PathEscape(trimmedPreferred))
		if prefResp, err := client.Get(prefURL); err == nil {
			defer prefResp.Body.Close()
			if prefResp.StatusCode == http.StatusOK {
				//log.Printf("ensureWhatsappGatewayDevice: requested device %s exists in gateway, using it", maskPhoneForLog(trimmedPreferred))
				return trimmedPreferred, nil
			}
		}

		// As a last resort, use the requested device ID directly (login endpoint may create it) before creating random fallback.
		//log.Printf("ensureWhatsappGatewayDevice: requested device %s not found in device list, using it directly as candidate", maskPhoneForLog(trimmedPreferred))
		return trimmedPreferred, nil
	}

	if len(listResp.Results) > 0 {
		// Prefer already connected and logged-in device (avoids stale device IDs).
		for _, d := range listResp.Results {
			id := strings.TrimSpace(d.ID)
			if id == "" {
				continue
			}
			status, err := fetchWhatsappGatewayConnectionStatus(client, id)
			if err != nil {
				continue
			}
			if status != nil && status.Connected && status.LoggedIn {
				if userKey != "" {
					setSelectedWhatsappDeviceForUser(userKey, id, "")
				}
				return id, nil
			}
		}

		// No active connected device found, use first id as fallback.
		fallbackID := strings.TrimSpace(listResp.Results[0].ID)
		if fallbackID != "" && userKey != "" {
			setSelectedWhatsappDeviceForUser(userKey, fallbackID, "")
		}
		return fallbackID, nil
	}

	if shouldEmitWhatsappRateLimitedLog("no-devices-discovered", whatsappGatewayPollNoiseCooldown) {
		//log.Printf("ensureWhatsappGatewayDevice: no devices discovered and no requested/paired candidate available")
	}
	return "", fmt.Errorf("no paired device available")
}

func resetWhatsappGatewayDevice(client *http.Client, deviceID string) error {
	logoutURL := fmt.Sprintf("http://127.0.0.1:3000/app/logout?device_id=%s", url.QueryEscape(deviceID))
	resp, err := client.Get(logoutURL)
	if err != nil {
		log.Printf("resetWhatsappGatewayDevice: logout call failed: %v", err)
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("resetWhatsappGatewayDevice: unexpected logout status=%d body=%s", resp.StatusCode, strings.TrimSpace(string(body)))
		return fmt.Errorf("logout failed %d", resp.StatusCode)
	}
	log.Printf("resetWhatsappGatewayDevice: logged out device %s", deviceID)
	// After logout, attempt to remove the device record from the gateway so
	// future starts get a clean session placeholder.
	if derr := deleteWhatsappGatewayDevice(client, deviceID); derr != nil {
		log.Printf("resetWhatsappGatewayDevice: failed to delete device %s: %v", deviceID, derr)
	}

	// Clear any cached QR bytes/state for this device on the main server
	whatsappGatewayCachedQR = ""
	whatsappGatewayCachedBytesMu.Lock()
	whatsappGatewayCachedQRBytes = nil
	whatsappGatewayCachedQRContentType = ""
	whatsappGatewayCachedBytesMu.Unlock()

	welcomeMu.Lock()
	clearWhatsappWelcomeState(deviceID, "")
	welcomeMu.Unlock()

	return nil
}

// deleteWhatsappGatewayDevice removes a device record from the local gateway
// REST API. This is best-effort and will not block calling flows on failure.
func deleteWhatsappGatewayDevice(client *http.Client, deviceID string) error {
	if strings.TrimSpace(deviceID) == "" {
		return fmt.Errorf("device id required")
	}
	delURL := fmt.Sprintf("http://127.0.0.1:3000/devices/%s", url.PathEscape(deviceID))
	req, err := http.NewRequest(http.MethodDelete, delURL, nil)
	if err != nil {
		return err
	}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return fmt.Errorf("delete failed status=%d body=%s", resp.StatusCode, strings.TrimSpace(string(body)))
	}
	log.Printf("deleteWhatsappGatewayDevice: removed device %s from gateway", deviceID)
	return nil
}

// Proxy send requests to the local WhatsApp gateway
func getWhatsappMode(userKey string) string {
	scope := normalizeWhatsappRuntimeScope(userKey)
	whatsappModeMu.RLock()
	mode := strings.ToLower(strings.TrimSpace(whatsappModeByUser[scope]))
	whatsappModeMu.RUnlock()
	if mode != "personal" && mode != "bot" {
		return "personal"
	}
	return mode
}

func setWhatsappMode(userKey, mode string) string {
	scope := normalizeWhatsappRuntimeScope(userKey)
	normalized := strings.ToLower(strings.TrimSpace(mode))
	if normalized != "personal" && normalized != "bot" {
		normalized = "personal"
	}
	whatsappModeMu.Lock()
	whatsappModeByUser[scope] = normalized
	whatsappModeMu.Unlock()
	return normalized
}

func whatsappModeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Paiperwork-User")
		w.WriteHeader(http.StatusOK)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	userKey, allowed := enforceWhatsappActiveUserAccess(w, r, false)
	if !allowed {
		return
	}

	if r.Method == http.MethodGet {
		json.NewEncoder(w).Encode(map[string]any{"mode": getWhatsappMode(userKey)})
		return
	}

	if r.Method == http.MethodPost {
		var payload struct {
			Mode string `json:"mode"`
		}
		if err := json.NewDecoder(io.LimitReader(r.Body, 4096)).Decode(&payload); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]any{"error": "invalid JSON"})
			return
		}
		mode := setWhatsappMode(userKey, payload.Mode)
		json.NewEncoder(w).Encode(map[string]any{"mode": mode})
		return
	}

	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}

func verifyWhatsappWebhookSignature(r *http.Request, payload []byte) bool {
	secret := strings.TrimSpace(os.Getenv("WHATSAPP_WEBHOOK_SECRET"))
	if secret == "" {
		secret = "secret"
	}
	sig := r.Header.Get("X-Hub-Signature-256")
	if sig == "" {
		return true // allow if no signature is provided (for local/dev)
	}
	sig = strings.TrimPrefix(sig, "sha256=")
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	expected := hex.EncodeToString(mac.Sum(nil))
	return subtle.ConstantTimeCompare([]byte(expected), []byte(sig)) == 1
}

func recordWhatsappOutgoingMessage(userKey, chatID, body string) {
	scope := normalizeWhatsappRuntimeScope(userKey)
	chatID = strings.TrimSpace(chatID)
	body = strings.TrimSpace(body)
	if chatID == "" || body == "" {
		return
	}
	whatsappOutgoingMu.Lock()
	defer whatsappOutgoingMu.Unlock()
	queue := append(whatsappOutgoingMessagesByUser[scope], whatsappOutgoingMessage{ChatID: chatID, Body: body, Timestamp: time.Now()})
	if len(queue) > 50 {
		queue = queue[len(queue)-50:]
	}
	whatsappOutgoingMessagesByUser[scope] = queue
}

func shouldFilterWhatsappOutgoingEcho(mode, chatID, from string) bool {
	chatID = strings.TrimSpace(chatID)
	from = strings.TrimSpace(from)
	if mode == "personal" && chatID != "" && chatID == from {
		return false
	}
	return true
}

func isWhatsappOutgoingEcho(userKey, chatID, body string) bool {
	scope := normalizeWhatsappRuntimeScope(userKey)
	chatID = strings.TrimSpace(chatID)
	body = strings.TrimSpace(body)
	if chatID == "" || body == "" {
		return false
	}
	whatsappOutgoingMu.Lock()
	defer whatsappOutgoingMu.Unlock()
	threshold := 12 * time.Second
	now := time.Now()
	for _, m := range whatsappOutgoingMessagesByUser[scope] {
		if now.Sub(m.Timestamp) > threshold {
			continue
		}
		if m.ChatID == chatID && m.Body == body {
			return true
		}
	}
	return false
}

func whatsappIncomingWebhookHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Hub-Signature-256")
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	body, err := io.ReadAll(io.LimitReader(r.Body, 4*1024*1024))
	if err != nil {
		log.Printf("whatsappIncomingWebhook: read body error: %v", err)
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	if !verifyWhatsappWebhookSignature(r, body) {
		log.Printf("whatsappIncomingWebhook: invalid webhook signature")
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	if !whatsappServerStarted {
		log.Printf("whatsappIncomingWebhook: rejected because whatsapp server is stopped")
		http.Error(w, "whatsapp-server-stopped", http.StatusServiceUnavailable)
		return
	}

	var wrapper struct {
		Event    string `json:"event"`
		DeviceID string `json:"device_id"`
		Payload  struct {
			ID          string   `json:"id"`
			ChatID      string   `json:"chat_id"`
			From        string   `json:"from"`
			FromName    string   `json:"from_name"`
			Timestamp   string   `json:"timestamp"`
			Body        string   `json:"body"`
			RepliedToID string   `json:"replied_to_id"`
			QuotedBody  string   `json:"quoted_body"`
			IsFromMe    bool     `json:"is_from_me"`
			Mentions    []string `json:"mentions"`
			IsReplay    bool     `json:"is_replay_or_historical"`
		} `json:"payload"`
	}

	if err := json.Unmarshal(body, &wrapper); err != nil {
		log.Printf("whatsappIncomingWebhook: invalid JSON: %v", err)
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	if wrapper.Event != "message" || strings.TrimSpace(wrapper.Payload.Body) == "" {
		log.Printf("whatsappIncomingWebhook: ignored non-text or non-message event=%s body_present=%v", wrapper.Event, strings.TrimSpace(wrapper.Payload.Body) != "")
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if wrapper.Payload.IsReplay {
		incoming := whatsappIncomingMessage{
			DeviceID:    wrapper.DeviceID,
			ID:          wrapper.Payload.ID,
			ChatID:      wrapper.Payload.ChatID,
			From:        wrapper.Payload.From,
			FromName:    wrapper.Payload.FromName,
			Timestamp:   wrapper.Payload.Timestamp,
			Body:        wrapper.Payload.Body,
			RepliedToID: wrapper.Payload.RepliedToID,
			QuotedBody:  wrapper.Payload.QuotedBody,
		}
		if err := saveWhatsappReplayEvent(activeWhatsappRuntimeScope(), incoming); err != nil {
			log.Printf("whatsappIncomingWebhook: failed to save replay/history message state: %v", err)
		}
		//log.Printf("whatsappIncomingWebhook: recorded replay/history message and skipped delivery device=%s chat=%s from=%s", maskPhoneForLog(wrapper.DeviceID), maskPhoneForLog(wrapper.Payload.ChatID), maskPhoneForLog(wrapper.Payload.From))
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]any{"status": "replay_recorded"})
		return
	}

	runtimeScope := activeWhatsappRuntimeScope()
	mode := getWhatsappMode(runtimeScope)
	switch mode {
	case "personal":
		if !wrapper.Payload.IsFromMe {
			//log.Printf("whatsappIncomingWebhook: skipped because personal mode and message not from owner")
			w.WriteHeader(http.StatusNoContent)
			return
		}

		if strings.TrimSpace(wrapper.Payload.ChatID) != strings.TrimSpace(wrapper.Payload.From) {
			w.WriteHeader(http.StatusNoContent)
			return
		}

	case "bot":
		// Bot mode accepts inbound messages from other users (is_from_me=false)
	default:
		log.Printf("whatsappIncomingWebhook: unknown mode %q, treating as personal", mode)
		if !wrapper.Payload.IsFromMe {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		if strings.TrimSpace(wrapper.Payload.ChatID) != strings.TrimSpace(wrapper.Payload.From) {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		if wrapper.Payload.IsFromMe {
			// still ignore outgoing messages from self in bot mode
			w.WriteHeader(http.StatusNoContent)
			return
		}
	}

	if shouldFilterWhatsappOutgoingEcho(mode, wrapper.Payload.ChatID, wrapper.Payload.From) && isWhatsappOutgoingEcho(runtimeScope, wrapper.Payload.ChatID, wrapper.Payload.Body) {
		//log.Printf("whatsappIncomingWebhook: filtered outgoing echo from_me message chat=%s body=%q", wrapper.Payload.ChatID, wrapper.Payload.Body)
		w.WriteHeader(http.StatusNoContent)
		return
	}

	// Bot mode: allow group mention messages. Otherwise, only owner self-chat is processed.
	if strings.TrimSpace(wrapper.Payload.ChatID) != strings.TrimSpace(wrapper.Payload.From) {
		isGroup := strings.HasSuffix(strings.TrimSpace(wrapper.Payload.ChatID), "@g.us")
		if mode == "bot" && isGroup {
			// Require an actual WhatsApp mention of the connected device, not just any '@' in the text.
			if !whatsappMentionsDevice(wrapper.Payload.Mentions, wrapper.DeviceID) {
				//log.Printf("whatsappIncomingWebhook: skipped group message without direct bot mention chat=%s device=%s mentions=%d", wrapper.Payload.ChatID, maskPhoneForLog(wrapper.DeviceID), len(wrapper.Payload.Mentions))
				w.WriteHeader(http.StatusNoContent)
				return
			}
			// Keep group message in queue and allow processing as bot request.
		} else {
			// Ignore owner messages that are not sent to the owner's self-chat.
			// Suppress logging here to avoid recording other parties' message content.
			w.WriteHeader(http.StatusNoContent)
			return
		}
	}

	/* logModeLabel := "personal"
	logSourceLabel := "from_me"
	logMessageLabel := "self-message"
	if mode == "bot" {
		logModeLabel = "bot"
		logSourceLabel = "from_bot"
		logMessageLabel = "message"
		if strings.HasSuffix(strings.TrimSpace(wrapper.Payload.ChatID), "@g.us") {
			logMessageLabel = "group-message"
		}
	}  */

	//log.Printf("whatsappIncomingWebhook: received %s %s %s chat=%s body=%q", logModeLabel, logSourceLabel, logMessageLabel, wrapper.Payload.ChatID, wrapper.Payload.Body)

	runtimeUserKey := activeWhatsappRuntimeScope()
	if runtimeUserKey != "" {
		client := &http.Client{Timeout: 5 * time.Second}
		resolvedIncomingDeviceID := resolveLoggedInWhatsappActiveDeviceID(
			client,
			wrapper.DeviceID,
			firstNonEmptyString(strings.TrimSpace(wrapper.Payload.ChatID), strings.TrimSpace(wrapper.Payload.From)),
		)
		if strings.TrimSpace(resolvedIncomingDeviceID) != "" {
			wrapper.DeviceID = strings.TrimSpace(resolvedIncomingDeviceID)
		}
	}
	if runtimeUserKey != "" && !shouldAllowRuntimeWhatsappDevice(runtimeUserKey, wrapper.DeviceID) {
		log.Printf("whatsappIncomingWebhook: ignoring message for non-selected runtime device=%s while selected device remains active", maskPhoneForLog(wrapper.DeviceID))
		w.WriteHeader(http.StatusNoContent)
		return
	}

	incoming := whatsappIncomingMessage{
		DeviceID:    wrapper.DeviceID,
		ID:          wrapper.Payload.ID,
		ChatID:      wrapper.Payload.ChatID,
		From:        wrapper.Payload.From,
		FromName:    wrapper.Payload.FromName,
		Timestamp:   wrapper.Payload.Timestamp,
		Body:        wrapper.Payload.Body,
		RepliedToID: wrapper.Payload.RepliedToID,
		QuotedBody:  wrapper.Payload.QuotedBody,
	}
	//maskedDevice := maskPhoneForLog(incoming.DeviceID)
	//maskedChat := maskPhoneForLog(incoming.ChatID)
	//maskedFrom := maskPhoneForLog(incoming.From)
	//log.Printf("whatsappIncomingWebhook: received message device=%s chat=%s from=%s from_name=%s ts=%s body=%q", maskedDevice, maskedChat, maskedFrom, incoming.FromName, incoming.Timestamp, incoming.Body)

	rememberWhatsappChatDeviceRoute(runtimeUserKey, incoming.DeviceID, incoming.ChatID, incoming.From)
	enqueueWhatsappIncomingMessage(activeWhatsappIncomingQueueScope(), incoming)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok"}`))
}

func whatsappIncomingPollHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Paiperwork-User")
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userKey, allowed := enforceWhatsappActiveUserAccess(w, r, false)
	if !allowed {
		return
	}

	if notice := getWhatsappRemoteLogoutNotice(); notice != nil {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.WriteHeader(http.StatusConflict)
		_ = json.NewEncoder(w).Encode(map[string]any{"error": "remote_logout", "message": notice.Message, "device_id": notice.DeviceID})
		return
	}

	msgs := drainWhatsappIncomingMessages(userKey)

	if len(msgs) > 0 {
		//log.Printf("whatsappIncomingPoll: delivering %d message(s) for user=%s", len(msgs), safeUserKeyForFilename(userKey))
		/* for i, m := range msgs {
			maskedDevice := maskPhoneForLog(m.DeviceID)
			maskedChat := maskPhoneForLog(m.ChatID)
			maskedFrom := maskPhoneForLog(m.From)
			log.Printf("whatsappIncomingPoll: %d device=%s chat=%s from=%s body=%q", i+1, maskedDevice, maskedChat, maskedFrom, m.Body)
		} */
	} else {
		// Dry poll, no need to log at info level to reduce noise.
		// log.Printf("whatsappIncomingPoll: no new messages")
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(msgs)
}

// Debug endpoint: used by the bundled gateway to verify webhook reachability
// Accepts GET/POST and returns a simple JSON confirmation. Useful for startup checks.
func maskPhoneForLog(raw string) string {
	r := strings.TrimSpace(raw)
	if r == "" {
		return ""
	}
	prefix := ""
	if strings.HasPrefix(r, "+") {
		prefix = "+"
		r = strings.TrimPrefix(r, "+")
	}
	suffix := ""
	if at := strings.Index(r, "@"); at >= 0 {
		suffix = r[at:]
		r = r[:at]
	}
	if colon := strings.Index(r, ":"); colon >= 0 {
		suffix = r[colon:] + suffix
		r = r[:colon]
	}
	if len(r) <= 4 {
		return prefix + r + suffix
	}
	return prefix + strings.Repeat("*", len(r)-4) + r[len(r)-4:] + suffix
}

func normalizeWhatsappWelcomeDeviceKey(deviceID string) string {
	trimmed := strings.ToLower(strings.TrimSpace(deviceID))
	if trimmed == "" {
		return ""
	}
	if strings.Contains(trimmed, "@") {
		trimmed = strings.SplitN(trimmed, "@", 2)[0]
	}
	if colon := strings.Index(trimmed, ":"); colon >= 0 {
		trimmed = trimmed[:colon]
	}
	return trimmed
}

func normalizeWhatsappWelcomeTrackingKey(deviceID, phoneNumber string) string {
	if normalizedPhone := normalizeWhatsappIdentity(phoneNumber); normalizedPhone != "" {
		return normalizedPhone
	}
	return normalizeWhatsappWelcomeDeviceKey(deviceID)
}

func clearWhatsappWelcomeState(deviceID, phoneNumber string) {
	for _, key := range whatsappWelcomeTrackingKeys(deviceID, phoneNumber) {
		delete(welcomeSentForDevice, key)
		delete(welcomePendingForDevice, key)
		delete(welcomeLastSentAtForDevice, key)
	}
}

func whatsappWelcomeTrackingKeys(deviceID, phoneNumber string) []string {
	keys := make([]string, 0, 4)
	seen := make(map[string]struct{}, 4)
	appendKey := func(raw string) {
		trimmed := strings.TrimSpace(raw)
		if trimmed == "" {
			return
		}
		if _, exists := seen[trimmed]; exists {
			return
		}
		seen[trimmed] = struct{}{}
		keys = append(keys, trimmed)
	}
	appendKey(normalizeWhatsappWelcomeTrackingKey(deviceID, phoneNumber))
	appendKey(normalizeWhatsappWelcomeDeviceKey(deviceID))
	appendKey(normalizeWhatsappIdentity(deviceID))
	appendKey(normalizeWhatsappIdentity(phoneNumber))
	return keys
}

func markPurgedWhatsappWelcomeTargets(deviceIDs, jids, phones map[string]struct{}) {
	until := time.Now().Add(whatsappPurgedWelcomeBlockTTL)
	welcomeMu.Lock()
	defer welcomeMu.Unlock()
	for candidateDeviceID := range deviceIDs {
		for _, key := range whatsappWelcomeTrackingKeys(candidateDeviceID, "") {
			clearWhatsappWelcomeState(candidateDeviceID, key)
			purgedWhatsappWelcomeBlockedUntil[key] = until
		}
		if normalizedPhone := normalizeWhatsappIdentity(candidateDeviceID); normalizedPhone != "" {
			purgedWhatsappWelcomeBlockedUntil[normalizedPhone] = until
		}
	}
	for candidateJID := range jids {
		for _, key := range whatsappWelcomeTrackingKeys(candidateJID, candidateJID) {
			clearWhatsappWelcomeState(candidateJID, key)
			purgedWhatsappWelcomeBlockedUntil[key] = until
		}
	}
	for candidatePhone := range phones {
		for _, key := range whatsappWelcomeTrackingKeys(candidatePhone, candidatePhone) {
			clearWhatsappWelcomeState(candidatePhone, key)
			purgedWhatsappWelcomeBlockedUntil[key] = until
		}
	}
}

func isWhatsappWelcomeBlocked(deviceID, phoneNumber string) bool {
	now := time.Now()
	for _, key := range whatsappWelcomeTrackingKeys(deviceID, phoneNumber) {
		until := purgedWhatsappWelcomeBlockedUntil[key]
		if !until.IsZero() {
			if now.Before(until) {
				return true
			}
			delete(purgedWhatsappWelcomeBlockedUntil, key)
		}
	}
	return false
}

func shouldQueueWhatsappWelcome(deviceID, phoneNumber string) bool {
	key := normalizeWhatsappWelcomeTrackingKey(deviceID, phoneNumber)
	if key == "" {
		return false
	}

	welcomeMu.Lock()
	defer welcomeMu.Unlock()
	if isWhatsappWelcomeBlocked(deviceID, phoneNumber) {
		return false
	}

	lastSentAt := welcomeLastSentAtForDevice[key]
	welcomeCooldownElapsed := lastSentAt.IsZero() || time.Since(lastSentAt) > 30*time.Second
	if welcomePendingForDevice[key] || welcomeSentForDevice[key] || !welcomeCooldownElapsed {
		return false
	}

	welcomePendingForDevice[key] = true
	return true
}

func resolveLoggedInWhatsappWelcomeDeviceID(client *http.Client, deviceID, targetPhone string) string {
	identityCandidates := []string{strings.TrimSpace(deviceID), strings.TrimSpace(targetPhone)}
	seen := make(map[string]bool)
	bestPersistableCandidate := ""
	for _, identity := range identityCandidates {
		if identity == "" || seen[identity] {
			continue
		}
		seen[identity] = true
		candidateIDs, err := resolveWhatsappGatewayDeviceCandidatesByIdentity(client, identity)
		if err != nil {
			continue
		}
		for _, candidateID := range candidateIDs {
			trimmedCandidateID := strings.TrimSpace(candidateID)
			if bestPersistableCandidate == "" && isPersistableWhatsappDeviceID(trimmedCandidateID) {
				bestPersistableCandidate = trimmedCandidateID
			}
			status, statusErr := fetchWhatsappGatewayConnectionStatus(client, candidateID)
			if statusErr == nil && status != nil && status.Connected && status.LoggedIn {
				return trimmedCandidateID
			}
		}
	}
	if bestPersistableCandidate != "" {
		return bestPersistableCandidate
	}
	return ""
}

func resolveLoggedInWhatsappActiveDeviceID(client *http.Client, deviceID, targetPhone string) string {
	trimmedDeviceID := strings.TrimSpace(deviceID)
	if trimmedDeviceID == "" {
		return ""
	}

	if reboundDeviceID := resolveLoggedInWhatsappWelcomeDeviceID(client, trimmedDeviceID, targetPhone); reboundDeviceID != "" {
		return strings.TrimSpace(reboundDeviceID)
	}

	status, err := fetchWhatsappGatewayConnectionStatus(client, trimmedDeviceID)
	if err == nil && status != nil && strings.TrimSpace(status.DeviceID) != "" && status.Connected && status.LoggedIn {
		return strings.TrimSpace(status.DeviceID)
	}

	return trimmedDeviceID
}

func resolveWhatsappWelcomeCandidateFromBroadcast(message uiWebsocket.BroadcastMessage) (string, string, bool) {
	if !strings.EqualFold(strings.TrimSpace(message.Code), "LOGGED_IN") {
		return "", "", false
	}

	resultMap, ok := message.Result.(map[string]any)
	if !ok || resultMap == nil {
		return "", "", false
	}

	deviceID := strings.TrimSpace(fmt.Sprint(resultMap["device_id"]))
	phoneNumber := strings.TrimSpace(fmt.Sprint(resultMap["phone_number"]))
	if deviceID == "" || phoneNumber == "<nil>" || deviceID == "<nil>" {
		if deviceID == "<nil>" {
			deviceID = ""
		}
		if phoneNumber == "<nil>" {
			phoneNumber = ""
		}
	}
	if deviceID == "" {
		return "", "", false
	}

	return deviceID, phoneNumber, true
}

func shouldPromoteLoggedInBroadcastSelection(userKey, selectedDeviceID, deviceID, phoneNumber string) bool {
	trimmedUserKey := strings.TrimSpace(userKey)
	trimmedSelectedDeviceID := strings.TrimSpace(selectedDeviceID)
	trimmedDeviceID := strings.TrimSpace(deviceID)
	if trimmedUserKey == "" || trimmedDeviceID == "" {
		return false
	}

	if trimmedSelectedDeviceID == "" {
		return true
	}

	selectedIdentity := normalizeWhatsappIdentity(trimmedSelectedDeviceID)
	broadcastIdentity := firstNonEmptyString(
		normalizeWhatsappIdentity(phoneNumber),
		normalizeWhatsappIdentity(trimmedDeviceID),
	)
	if broadcastIdentity != "" && broadcastIdentity == selectedIdentity {
		return true
	}

	persistedDevices, err := loadPersistedWhatsappDevicesFromDB(trimmedUserKey)
	if err != nil {
		return false
	}
	if len(persistedDevices) == 0 {
		return strings.HasPrefix(strings.ToLower(trimmedSelectedDeviceID), "pw-") || isPersistableWhatsappDeviceID(trimmedDeviceID)
	}

	var selectedEntry *persistedWhatsappDeviceEntry
	var broadcastEntry *persistedWhatsappDeviceEntry
	for i := range persistedDevices {
		entry := &persistedDevices[i]
		entryDeviceID := strings.TrimSpace(entry.ID)
		entryJID := strings.TrimSpace(entry.JID)
		entryPhone := normalizeWhatsappIdentity(entry.PhoneNumber)
		if selectedEntry == nil {
			if strings.EqualFold(entryDeviceID, trimmedSelectedDeviceID) || strings.EqualFold(entryJID, trimmedSelectedDeviceID) {
				selectedEntry = entry
			} else if selectedIdentity != "" && (normalizeWhatsappIdentity(entryDeviceID) == selectedIdentity || normalizeWhatsappIdentity(entryJID) == selectedIdentity || entryPhone == selectedIdentity) {
				selectedEntry = entry
			}
		}
		if broadcastEntry == nil {
			if strings.EqualFold(entryDeviceID, trimmedDeviceID) || strings.EqualFold(entryJID, trimmedDeviceID) {
				broadcastEntry = entry
			} else if broadcastIdentity != "" && (normalizeWhatsappIdentity(entryDeviceID) == broadcastIdentity || normalizeWhatsappIdentity(entryJID) == broadcastIdentity || entryPhone == broadcastIdentity) {
				broadcastEntry = entry
			}
		}
	}

	if broadcastEntry != nil {
		if selectedEntry == nil {
			return strings.HasPrefix(strings.ToLower(trimmedSelectedDeviceID), "pw-") || isPersistableWhatsappDeviceID(trimmedDeviceID)
		}
		return persistedWhatsappDeviceKey(selectedEntry.ID, selectedEntry.JID) == persistedWhatsappDeviceKey(broadcastEntry.ID, broadcastEntry.JID)
	}

	return strings.HasPrefix(strings.ToLower(trimmedSelectedDeviceID), "pw-") && isPersistableWhatsappDeviceID(trimmedDeviceID)
}

func handleWhatsappGatewayBroadcastMessage(message uiWebsocket.BroadcastMessage) {
	if strings.EqualFold(strings.TrimSpace(message.Code), "REMOTE_LOGOUT") {
		deviceID := ""
		switch result := message.Result.(type) {
		case map[string]string:
			deviceID = strings.TrimSpace(result["device_id"])
		case map[string]any:
			deviceID = strings.TrimSpace(fmt.Sprint(result["device_id"]))
			if deviceID == "<nil>" {
				deviceID = ""
			}
		}

		setWhatsappRemoteLogoutNotice(deviceID, "Received LoggedOut event for device")

		go func() {
			runtimeUserKey := activeWhatsappRuntimeScope()
			if runtimeUserKey != "" {
				replacementDeviceID := selectReplacementWhatsappDeviceID(runtimeUserKey, deviceID)
				selectedWhatsappDeviceMu.Lock()
				selectedWhatsappDevice[runtimeUserKey] = map[string]string{"device_id": replacementDeviceID, "meta": ""}
				selectedWhatsappDeviceMu.Unlock()
				if err := saveSelectedWhatsappDeviceToDB(runtimeUserKey, replacementDeviceID, ""); err != nil {
					log.Printf("handleWhatsappGatewayBroadcastMessage: failed to persist replacement selected device after remote logout for user=%s replacement=%s: %v", safeUserKeyForFilename(runtimeUserKey), maskPhoneForLog(replacementDeviceID), err)
				} else if replacementDeviceID != "" {
					//log.Printf("handleWhatsappGatewayBroadcastMessage: promoted replacement selected device after remote logout for user=%s replacement=%s", safeUserKeyForFilename(runtimeUserKey), maskPhoneForLog(replacementDeviceID))
				}
			}

			pairRequested = false
			markWhatsappManualStopWindow(30 * time.Second)
			os.Unsetenv(whatsappFreshPairStartupEnv)
			setWhatsappSessionRestoreExpected(false)
			os.Unsetenv("PAIPERWORK_WHATSAPP_DEVICE_ID")
			os.Unsetenv("WHATSAPP_DEVICE_ID")
			config.WhatsappPreferredDeviceID = ""

			if err := stopGateway(); err != nil {
				log.Printf("handleWhatsappGatewayBroadcastMessage: failed to stop gateway after remote logout: %v", err)
			}

			if runtimeUserKey != "" {
				clearWhatsappPersistedStateForUser(runtimeUserKey, "REMOTE_LOGOUT_POSTSTOP")
			}
		}()
		return
	}

	deviceID, phoneNumber, ok := resolveWhatsappWelcomeCandidateFromBroadcast(message)
	if !ok || !whatsappServerStarted {
		return
	}

	runtimeUserKey := activeWhatsappRuntimeScope()
	if runtimeUserKey == "" {
		return
	}
	client := &http.Client{Timeout: 5 * time.Second}
	resolvedDeviceID := resolveLoggedInWhatsappActiveDeviceID(client, deviceID, phoneNumber)
	if resolvedDeviceID == "" {
		resolvedDeviceID = deviceID
	}
	if !strings.EqualFold(strings.TrimSpace(resolvedDeviceID), strings.TrimSpace(deviceID)) {
		setCachedWhatsappGatewayDeviceResolution(deviceID, resolvedDeviceID)
		// promoted logged-in device %s to active gateway device %s", maskPhoneForLog(deviceID), maskPhoneForLog(resolvedDeviceID))
	}
	deviceID = resolvedDeviceID
	selectedDeviceID := strings.TrimSpace(getSelectedWhatsappDeviceIDForUser(runtimeUserKey))
	if !shouldAllowRuntimeWhatsappDevice(runtimeUserKey, deviceID) {
		freshPairStartup := strings.EqualFold(strings.TrimSpace(os.Getenv(whatsappFreshPairStartupEnv)), "true")
		shouldPromoteSelection := selectedDeviceID == ""
		if !shouldPromoteSelection && freshPairStartup {
			shouldPromoteSelection = true
		}
		if !shouldPromoteSelection && shouldPromoteLoggedInBroadcastSelection(runtimeUserKey, selectedDeviceID, deviceID, phoneNumber) {
			shouldPromoteSelection = true
		}
		if !shouldPromoteSelection && strings.HasPrefix(strings.ToLower(selectedDeviceID), "pw-") {
			persistedDevices, err := loadPersistedWhatsappDevicesFromDB(runtimeUserKey)
			if err == nil && len(persistedDevices) <= 1 {
				shouldPromoteSelection = true
			}
		}
		if shouldPromoteSelection {
			setSelectedWhatsappDeviceForUser(runtimeUserKey, deviceID, "")
			os.Unsetenv(whatsappFreshPairStartupEnv)
		} else {
			//log.Printf("handleWhatsappGatewayBroadcastMessage: ignoring logged-in broadcast for non-selected device %s while selected device remains active", maskPhoneForLog(deviceID))
			return
		}
	}

	if !shouldQueueWhatsappWelcome(deviceID, phoneNumber) {
		return
	}

	//log.Printf("handleWhatsappGatewayBroadcastMessage: queueing welcome dispatch for logged-in device %s", maskPhoneForLog(deviceID))
	go dispatchWhatsappWelcomeMessage(runtimeUserKey, deviceID, phoneNumber)
}

func registerWhatsappGatewayBroadcastObserver() {
	whatsappGatewayBroadcastObserverOnce.Do(func() {
		uiWebsocket.RegisterBroadcastObserver(handleWhatsappGatewayBroadcastMessage)
	})
}

func whatsappGatewayInfoHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Paiperwork-User")
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userKey, allowed := enforceWhatsappActiveUserAccess(w, r, false)
	if !allowed {
		return
	}

	gatewayRunning := isGatewayRunning()
	websocketReady := false
	connected := false
	loggedIn := false
	if gatewayRunning {
		websocketReady = isWhatsappGatewayWebsocketReady()
		client := &http.Client{Timeout: 4 * time.Second}
		requestedDeviceID := getRequestedWhatsappDeviceIDFromRequest(r)
		if deviceID, err := ensureWhatsappGatewayDevice(client, userKey, requestedDeviceID, false); err == nil && strings.TrimSpace(deviceID) != "" {
			if status, serr := fetchWhatsappGatewayConnectionStatus(client, deviceID); serr == nil && status != nil {
				connected = status.Connected
				loggedIn = status.LoggedIn
			}
		}
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]any{
		"gatewayMode":    "embedded",
		"gatewayRunning": gatewayRunning,
		"websocketReady": websocketReady,
		"connected":      connected,
		"loggedIn":       loggedIn,
		"serverStarted":  whatsappServerStarted,
		"timestamp":      time.Now().Format(time.RFC3339),
	})
}

func whatsappDbSyncHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Paiperwork-User")
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if _, allowed := enforceWhatsappActiveUserAccess(w, r, true); !allowed {
		return
	}

	type whatsappDbSyncRequest struct {
		DeviceID                    string   `json:"device_id"`
		PhoneNumber                 string   `json:"phone_number"`
		SelectedDeviceID            string   `json:"selected_device_id"`
		DebugTotalDevices           int      `json:"debug_total_devices"`
		DebugLoadedFromInfo         bool     `json:"debug_loaded_from_info"`
		DebugFilteredNonPersistable int      `json:"debug_filtered_non_persistable"`
		DebugRawDeviceIDs           []string `json:"debug_raw_device_ids"`
		Devices                     []struct {
			DeviceID    string `json:"deviceId"`
			JID         string `json:"jid"`
			PhoneNumber string `json:"phone_number"`
			DisplayName string `json:"display_name"`
			State       string `json:"state"`
			CreatedAt   string `json:"created_at"`
		} `json:"devices"`
	}

	request := whatsappDbSyncRequest{}
	_ = json.NewDecoder(io.LimitReader(r.Body, 16*1024)).Decode(&request)
	deviceID := strings.TrimSpace(request.DeviceID)
	phoneNumber := strings.TrimSpace(request.PhoneNumber)
	selectedDeviceID := strings.TrimSpace(request.SelectedDeviceID)
	if phoneNumber != "" {
		whatsappStartupTargetPhone = phoneNumber
	}

	userKey := activeWhatsappRuntimeScope()
	if userKey == "" {
		userKey = resolveWhatsappUserKeyFromRequest(r)
	}
	//log.Printf("whatsappDbSyncHandler: user=%s request_device=%s selected=%s devices=%d raw_devices=%d filtered_non_persistable=%d loaded_from_info=%v phone=%t gatewayRunning=%v raw_ids=%v", safeUserKeyForFilename(userKey), maskPhoneForLog(deviceID), maskPhoneForLog(selectedDeviceID), len(request.Devices), request.DebugTotalDevices, request.DebugFilteredNonPersistable, request.DebugLoadedFromInfo, phoneNumber != "", isGatewayRunning(), request.DebugRawDeviceIDs)
	if userKey != "" {
		catalogEntries := make([]persistedWhatsappDeviceEntry, 0, 1)
		authoritativeDeviceID := strings.TrimSpace(selectedDeviceID)
		if authoritativeDeviceID == "" {
			authoritativeDeviceID = strings.TrimSpace(deviceID)
		}
		if authoritativeDeviceID == "" {
			for _, entry := range request.Devices {
				candidateID := strings.TrimSpace(entry.DeviceID)
				if candidateID == "" {
					continue
				}
				authoritativeDeviceID = candidateID
				break
			}
		}

		if authoritativeDeviceID != "" {
			selectedEntry := persistedWhatsappDeviceEntry{ID: authoritativeDeviceID, PhoneNumber: phoneNumber, State: "disconnected"}
			for _, entry := range request.Devices {
				if strings.TrimSpace(entry.DeviceID) != authoritativeDeviceID {
					continue
				}
				selectedEntry.PhoneNumber = firstNonEmptyString(strings.TrimSpace(entry.PhoneNumber), selectedEntry.PhoneNumber)
				selectedEntry.DisplayName = strings.TrimSpace(entry.DisplayName)
				selectedEntry.State = firstNonEmptyString(strings.TrimSpace(entry.State), selectedEntry.State)
				selectedEntry.JID = strings.TrimSpace(entry.JID)
				selectedEntry.CreatedAt = strings.TrimSpace(entry.CreatedAt)
				break
			}
			catalogEntries = append(catalogEntries, selectedEntry)
		}
		//log.Printf("whatsappDbSyncHandler: user=%s prepared_catalog_entries=%d", safeUserKeyForFilename(userKey), len(catalogEntries))
		setSyncedPersistedWhatsappDevicesForUser(userKey, catalogEntries)
	}

	queuedWelcome := false
	if deviceID != "" {
		queuedWelcome = shouldQueueWhatsappWelcome(deviceID, phoneNumber)

		if queuedWelcome {
			runtimeUserKey := activeWhatsappRuntimeScope()
			//log.Printf("whatsappDbSyncHandler: queueing welcome dispatch for device %s", maskPhoneForLog(deviceID))
			go dispatchWhatsappWelcomeMessage(runtimeUserKey, deviceID, phoneNumber)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{"synced": true, "queuedWelcome": queuedWelcome, "message": "whatsapp db sync hook executed"})
}

func whatsappSessionExportHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Paiperwork-User")
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userKey, allowed := enforceWhatsappActiveUserAccess(w, r, true)
	if !allowed {
		return
	}

	writeDeferredExportResponse := func(message string, deviceID string) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusAccepted)
		_ = json.NewEncoder(w).Encode(map[string]any{
			"status":  http.StatusAccepted,
			"code":    "SESSION_EXPORT_DEFERRED",
			"message": message,
			"results": map[string]any{
				"device_id": deviceID,
			},
		})
	}

	if !isGatewayRunning() {
		writeDeferredExportResponse("gateway not running", "")
		return
	}

	client := &http.Client{Timeout: 12 * time.Second}
	requestedDeviceID := strings.TrimSpace(r.URL.Query().Get("device_id"))
	if requestedDeviceID == "" {
		requestedDeviceID = getRequestedWhatsappDeviceIDFromRequest(r)
	}
	deviceID, err := ensureWhatsappGatewayDevice(client, userKey, requestedDeviceID, false)
	if err != nil {
		log.Printf("whatsappSessionExportHandler: cannot resolve device id: %v", err)
		writeDeferredExportResponse("cannot resolve device", requestedDeviceID)
		return
	}

	exportURL := fmt.Sprintf("http://127.0.0.1:3000/app/session/export?device_id=%s", url.QueryEscape(deviceID))
	resp, err := client.Get(exportURL)
	if err != nil {
		log.Printf("whatsappSessionExportHandler: gateway call failed: %v", err)
		writeDeferredExportResponse("gateway call failed", deviceID)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	bodyText := strings.ToLower(strings.TrimSpace(string(body)))
	if resp.StatusCode == http.StatusNotFound {
		writeDeferredExportResponse("device session is not export-ready yet", deviceID)
		return
	}
	if resp.StatusCode >= http.StatusInternalServerError {
		if strings.Contains(bodyText, "invalid_wa_cli") || strings.Contains(bodyText, "your whatsapp cli is invalid or empty") || strings.Contains(bodyText, "has no store") {
			writeDeferredExportResponse("device session is not export-ready yet", deviceID)
			return
		}
	}
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	_, _ = w.Write(body)
}

func whatsappSessionImportHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Paiperwork-User")
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userKey, allowed := enforceWhatsappActiveUserAccess(w, r, true)
	if !allowed {
		return
	}

	if !isGatewayRunning() {
		http.Error(w, "gateway not running", http.StatusServiceUnavailable)
		return
	}

	type sessionImportRequest struct {
		DeviceID string      `json:"device_id"`
		Session  interface{} `json:"session"`
	}

	request := sessionImportRequest{}
	if err := json.NewDecoder(io.LimitReader(r.Body, 64*1024*1024)).Decode(&request); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	client := &http.Client{Timeout: 12 * time.Second}
	requestedDeviceID := strings.TrimSpace(request.DeviceID)
	if requestedDeviceID == "" {
		requestedDeviceID = strings.TrimSpace(r.URL.Query().Get("device_id"))
	}
	if requestedDeviceID == "" {
		requestedDeviceID = getRequestedWhatsappDeviceIDFromRequest(r)
	}
	deviceID, err := ensureWhatsappGatewayDevice(client, userKey, requestedDeviceID, false)
	if err != nil {
		log.Printf("whatsappSessionImportHandler: cannot resolve device id: %v", err)
		http.Error(w, "cannot resolve device", http.StatusServiceUnavailable)
		return
	}

	payload, err := json.Marshal(map[string]any{"session": request.Session})
	if err != nil {
		http.Error(w, "invalid session payload", http.StatusBadRequest)
		return
	}

	importURL := fmt.Sprintf("http://127.0.0.1:3000/app/session/import?device_id=%s", url.QueryEscape(deviceID))
	resp, err := client.Post(importURL, "application/json", bytes.NewReader(payload))
	if err != nil {
		log.Printf("whatsappSessionImportHandler: gateway call failed: %v", err)
		http.Error(w, "gateway call failed", http.StatusServiceUnavailable)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	_, _ = w.Write(body)
}

func whatsappSessionReconnectHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Paiperwork-User")
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userKey, allowed := enforceWhatsappActiveUserAccess(w, r, true)
	if !allowed {
		return
	}

	if !isGatewayRunning() {
		http.Error(w, "gateway not running", http.StatusServiceUnavailable)
		return
	}

	type sessionReconnectRequest struct {
		DeviceID string `json:"device_id"`
	}

	request := sessionReconnectRequest{}
	if err := json.NewDecoder(io.LimitReader(r.Body, 16*1024)).Decode(&request); err != nil && !errors.Is(err, io.EOF) {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	client := &http.Client{Timeout: 12 * time.Second}
	requestedDeviceID := strings.TrimSpace(request.DeviceID)
	if requestedDeviceID == "" {
		requestedDeviceID = strings.TrimSpace(r.URL.Query().Get("device_id"))
	}
	if requestedDeviceID == "" {
		requestedDeviceID = getRequestedWhatsappDeviceIDFromRequest(r)
	}
	deviceID, err := ensureWhatsappGatewayDevice(client, userKey, requestedDeviceID, false)
	if err != nil {
		log.Printf("whatsappSessionReconnectHandler: cannot resolve device id: %v", err)
		http.Error(w, "cannot resolve device", http.StatusServiceUnavailable)
		return
	}

	reconnectURL := fmt.Sprintf("http://127.0.0.1:3000/app/reconnect?device_id=%s", url.QueryEscape(deviceID))
	resp, err := client.Get(reconnectURL)
	if err != nil {
		log.Printf("whatsappSessionReconnectHandler: gateway call failed: %v", err)
		http.Error(w, "gateway call failed", http.StatusServiceUnavailable)
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusOK {
		setWhatsappSessionRestoreExpected(false)
	}

	body, _ := io.ReadAll(resp.Body)
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	_, _ = w.Write(body)
}

func whatsappSessionClearHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Paiperwork-User")
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userKey, allowed := enforceWhatsappActiveUserAccess(w, r, true)
	if !allowed {
		return
	}

	client := &http.Client{Timeout: 12 * time.Second}
	requestedDeviceID := strings.TrimSpace(r.URL.Query().Get("device_id"))
	if requestedDeviceID == "" {
		requestedDeviceID = getRequestedWhatsappDeviceIDFromRequest(r)
	}
	deviceID, err := ensureWhatsappGatewayDevice(client, userKey, requestedDeviceID, false)
	if err != nil {
		log.Printf("whatsappSessionClearHandler: cannot resolve device id: %v", err)
		http.Error(w, "cannot resolve device", http.StatusServiceUnavailable)
		return
	}

	clearURL := fmt.Sprintf("http://127.0.0.1:3000/app/session?device_id=%s", url.QueryEscape(deviceID))
	req, _ := http.NewRequest(http.MethodDelete, clearURL, nil)
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("whatsappSessionClearHandler: gateway call failed: %v", err)
		http.Error(w, "gateway call failed", http.StatusServiceUnavailable)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	_, _ = w.Write(body)
}

func whatsappWebhookDebugHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.WriteHeader(http.StatusOK)
		return
	}

	// Read a small payload for debugging visibility (1MB max)
	body, _ := io.ReadAll(io.LimitReader(r.Body, 1024*1024))
	remote := r.RemoteAddr
	if remote == "" {
		remote = "unknown"
	}
	log.Printf("whatsappWebhookDebug: probe from=%s method=%s body=%q", remote, r.Method, strings.TrimSpace(string(body)))

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{"ok": true, "received": true})
}

func whatsappUnpairHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Paiperwork-User")
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userKey, allowed := enforceWhatsappActiveUserAccess(w, r, false)
	if !allowed {
		return
	}

	client := &http.Client{Timeout: 10 * time.Second}
	requestedDeviceID := getRequestedWhatsappDeviceIDFromRequest(r)
	deviceID, err := ensureWhatsappGatewayDevice(client, userKey, requestedDeviceID, false)
	if err != nil {
		log.Printf("whatsappUnpairHandler: cannot get device id: %v", err)
		http.Error(w, "cannot get device", http.StatusServiceUnavailable)
		return
	}

	if err := resetWhatsappGatewayDevice(client, deviceID); err != nil {
		log.Printf("whatsappUnpairHandler: logout failed: %v", err)
		http.Error(w, "logout failed", http.StatusServiceUnavailable)
		return
	}

	welcomeMu.Lock()
	clearWhatsappWelcomeState(deviceID, "")
	welcomeMu.Unlock()
	pairRequested = false

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(map[string]any{"status": "ok", "message": "unpaired"})
}

func whatsappDeleteAllPairingDataHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Paiperwork-User")
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userKey, allowed := enforceWhatsappActiveUserAccess(w, r, false)
	if !allowed {
		return
	}

	trimmedUserKey := strings.TrimSpace(userKey)
	if trimmedUserKey == "" {
		http.Error(w, "missing user key", http.StatusBadRequest)
		return
	}

	if err := whatsappInfra.ClearPersistedPairingData("DELETE_ALL_PAIRING_PRESTOP"); err != nil {
		log.Printf("whatsappDeleteAllPairingDataHandler: failed to clear live pairing data before stop for user=%s: %v", safeUserKeyForFilename(trimmedUserKey), err)
	}

	if err := stopGateway(); err != nil {
		log.Printf("whatsappDeleteAllPairingDataHandler: failed to stop gateway: %v", err)
	}

	if err := clearPersistedWhatsappDataForUser(trimmedUserKey); err != nil {
		log.Printf("whatsappDeleteAllPairingDataHandler: failed to clear persisted data for user=%s: %v", safeUserKeyForFilename(trimmedUserKey), err)
		http.Error(w, "failed to clear WhatsApp pairing data", http.StatusInternalServerError)
		return
	}

	if err := deletePersistedWhatsappDBFilesForUser(trimmedUserKey); err != nil {
		log.Printf("whatsappDeleteAllPairingDataHandler: failed to remove persisted DB files for user=%s: %v", safeUserKeyForFilename(trimmedUserKey), err)
		http.Error(w, "failed to clear WhatsApp pairing data", http.StatusInternalServerError)
		return
	}

	if err := whatsappInfra.ClearPersistedPairingData("DELETE_ALL_PAIRING_POSTSTOP"); err != nil {
		log.Printf("whatsappDeleteAllPairingDataHandler: failed to clear persisted pairing registry for user=%s: %v", safeUserKeyForFilename(trimmedUserKey), err)
		http.Error(w, "failed to clear WhatsApp pairing data", http.StatusInternalServerError)
		return
	}

	clearWhatsappPersistedStateForUser(trimmedUserKey, "DELETE_ALL_PAIRING_POSTSTOP")

	clearWhatsappRemoteLogoutNotice()
	setWhatsappSessionRestoreExpected(false)
	os.Unsetenv(whatsappFreshPairStartupEnv)
	os.Unsetenv("PAIPERWORK_WHATSAPP_DEVICE_ID")
	os.Unsetenv("WHATSAPP_DEVICE_ID")
	config.WhatsappPreferredDeviceID = ""

	welcomeMu.Lock()
	welcomeSentForDevice = map[string]bool{}
	welcomePendingForDevice = map[string]bool{}
	welcomeLastSentAtForDevice = map[string]time.Time{}
	welcomeMu.Unlock()

	whatsappPairingProbeMu.Lock()
	whatsappPairingProbeByDevice = make(map[string]whatsappPairingProbeState)
	whatsappPairingProbeMu.Unlock()

	whatsappGatewayCachedQR = ""
	whatsappGatewayCachedQRTimestamp = time.Time{}
	whatsappGatewayCachedBytesMu.Lock()
	whatsappGatewayCachedQRBytes = nil
	whatsappGatewayCachedQRContentType = ""
	whatsappGatewayCachedBytesMu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	_ = json.NewEncoder(w).Encode(map[string]any{"status": "ok", "message": "deleted", "user": safeUserKeyForFilename(trimmedUserKey)})
}

func whatsappSendProxyHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Paiperwork-User")
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if !whatsappServerStarted {
		log.Printf("whatsappSendProxy: rejected because whatsapp server is stopped")
		http.Error(w, "whatsapp-server-stopped", http.StatusServiceUnavailable)
		return
	}

	userKey, allowed := enforceWhatsappActiveUserAccess(w, r, false)
	if !allowed {
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	client := &http.Client{Timeout: 10 * time.Second}

	explicitDeviceID := strings.TrimSpace(r.URL.Query().Get("device_id"))
	requestedDeviceID := getRequestedWhatsappDeviceIDFromRequest(r)
	if explicitDeviceID != "" {
		if isWhatsappFreshPairRequested(r) {
			if shouldAcceptFreshPairDeviceCandidate(explicitDeviceID) {
				requestedDeviceID = explicitDeviceID
			}
		} else if isPersistableWhatsappDeviceID(explicitDeviceID) {
			requestedDeviceID = canonicalizeRequestedWhatsappDeviceID(userKey, explicitDeviceID)
		}
	}

	// Read incoming body (small requests expected)
	body, err := io.ReadAll(io.LimitReader(r.Body, 2*1024*1024))
	if err != nil {
		log.Printf("whatsappSendProxy: failed to read body: %v", err)
		http.Error(w, "bad-request", http.StatusBadRequest)
		return
	}

	// record outgoing message for echo suppression (for IsFromMe webhook payload)
	var outgoing struct {
		Phone   string `json:"phone"`
		To      string `json:"to"`
		Message string `json:"message"`
		Text    string `json:"text"`
	}
	if err := json.Unmarshal(body, &outgoing); err == nil {
		text := strings.TrimSpace(outgoing.Message)
		if text == "" {
			text = strings.TrimSpace(outgoing.Text)
		}
		chat := strings.TrimSpace(outgoing.Phone)
		if chat == "" {
			chat = strings.TrimSpace(outgoing.To)
		}
		if chat != "" && text != "" {
			recordWhatsappOutgoingMessage(userKey, chat, text)
			// Avoid logging phone number directly for privacy reasons.
			//log.Printf("whatsappSendProxy: recorded outgoing message body length=%d", len(text))
		}
		if explicitDeviceID == "" {
			if routedDeviceID := resolveWhatsappChatDeviceRouteWithGateway(client, userKey, chat, outgoing.Phone, outgoing.To); routedDeviceID != "" {
				requestedDeviceID = routedDeviceID
				//log.Printf("whatsappSendProxy: using chat-routed device %s for target %s", maskPhoneForLog(routedDeviceID), maskPhoneForLog(chat))
			}
		}
	}

	resolvedDeviceID, derr := ensureWhatsappGatewayDevice(client, userKey, requestedDeviceID, false)
	if derr != nil || strings.TrimSpace(resolvedDeviceID) == "" {
		if derr != nil {
			log.Printf("whatsappSendProxy: cannot resolve device id: %v", derr)
		} else {
			log.Printf("whatsappSendProxy: cannot resolve device id: empty")
		}
		http.Error(w, "gateway-unavailable", http.StatusServiceUnavailable)
		return
	}
	deviceQuery := "?device_id=" + url.QueryEscape(strings.TrimSpace(resolvedDeviceID))

	// Prefer the device-scoped go-whatsapp-web-multidevice endpoint first.
	primarySendURL := "http://127.0.0.1:3000/send/message" + deviceQuery
	fallbackSendURL := "http://127.0.0.1:3000/send" + deviceQuery
	//log.Printf("whatsappSendProxy: attempting primary send route device=%s url=%s", maskPhoneForLog(resolvedDeviceID), maskURLForLog(primarySendURL))
	if resp, err := forwardWhatsAppSendRequest(client, primarySendURL, body); err == nil {
		defer resp.Body.Close()
		//log.Printf("whatsappSendProxy: primary send route succeeded status=%d device=%s", resp.StatusCode, maskPhoneForLog(resolvedDeviceID))
		w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
		w.WriteHeader(resp.StatusCode)
		io.Copy(w, resp.Body)
		return
	} else {
		log.Printf("whatsappSendProxy: primary send route failed device=%s err=%v", maskPhoneForLog(resolvedDeviceID), err)
	}
	log.Printf("whatsappSendProxy: attempting fallback send route device=%s url=%s", maskPhoneForLog(resolvedDeviceID), maskURLForLog(fallbackSendURL))
	if resp, err := forwardWhatsAppSendRequest(client, fallbackSendURL, body); err == nil {
		defer resp.Body.Close()
		log.Printf("whatsappSendProxy: fallback send route succeeded status=%d device=%s", resp.StatusCode, maskPhoneForLog(resolvedDeviceID))
		w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
		w.WriteHeader(resp.StatusCode)
		io.Copy(w, resp.Body)
		return
	} else {
		log.Printf("whatsappSendProxy: fallback send route failed device=%s err=%v", maskPhoneForLog(resolvedDeviceID), err)
	}

	//log.Printf("whatsappSendProxy: forward failed to both endpoints")
	http.Error(w, "gateway-unavailable", http.StatusServiceUnavailable)
}

func whatsappSendLinkProxyHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Paiperwork-User")
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if !whatsappServerStarted {
		log.Printf("whatsappSendLinkProxy: rejected because whatsapp server is stopped")
		http.Error(w, "whatsapp-server-stopped", http.StatusServiceUnavailable)
		return
	}

	userKey, allowed := enforceWhatsappActiveUserAccess(w, r, false)
	if !allowed {
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	client := &http.Client{Timeout: 10 * time.Second}

	explicitDeviceID := strings.TrimSpace(r.URL.Query().Get("device_id"))
	requestedDeviceID := getRequestedWhatsappDeviceIDFromRequest(r)
	if explicitDeviceID != "" {
		if isWhatsappFreshPairRequested(r) {
			if shouldAcceptFreshPairDeviceCandidate(explicitDeviceID) {
				requestedDeviceID = explicitDeviceID
			}
		} else if isPersistableWhatsappDeviceID(explicitDeviceID) {
			requestedDeviceID = canonicalizeRequestedWhatsappDeviceID(userKey, explicitDeviceID)
		}
	}

	body, err := io.ReadAll(io.LimitReader(r.Body, 2*1024*1024))
	if err != nil {
		log.Printf("whatsappSendLinkProxy: failed to read body: %v", err)
		http.Error(w, "bad-request", http.StatusBadRequest)
		return
	}

	var outgoing struct {
		Phone   string `json:"phone"`
		To      string `json:"to"`
		Link    string `json:"link"`
		Caption string `json:"caption"`
	}
	if err := json.Unmarshal(body, &outgoing); err == nil {
		chat := strings.TrimSpace(outgoing.Phone)
		if chat == "" {
			chat = strings.TrimSpace(outgoing.To)
		}
		content := strings.TrimSpace(outgoing.Caption)
		if content == "" {
			content = strings.TrimSpace(outgoing.Link)
		}
		if chat != "" && content != "" {
			recordWhatsappOutgoingMessage(userKey, chat, content)
			log.Printf("whatsappSendLinkProxy: recorded outgoing link body length=%d", len(content))
		}
		if explicitDeviceID == "" {
			if routedDeviceID := resolveWhatsappChatDeviceRouteWithGateway(client, userKey, chat, outgoing.Phone, outgoing.To); routedDeviceID != "" {
				requestedDeviceID = routedDeviceID
				log.Printf("whatsappSendLinkProxy: using chat-routed device %s for target %s", maskPhoneForLog(routedDeviceID), maskPhoneForLog(chat))
			}
		}
	}

	resolvedDeviceID, derr := ensureWhatsappGatewayDevice(client, userKey, requestedDeviceID, false)
	if derr != nil || strings.TrimSpace(resolvedDeviceID) == "" {
		if derr != nil {
			log.Printf("whatsappSendLinkProxy: cannot resolve device id: %v", derr)
		} else {
			log.Printf("whatsappSendLinkProxy: cannot resolve device id: empty")
		}
		http.Error(w, "gateway-unavailable", http.StatusServiceUnavailable)
		return
	}

	forwardURL := "http://127.0.0.1:3000/send/link?device_id=" + url.QueryEscape(strings.TrimSpace(resolvedDeviceID))
	log.Printf("whatsappSendLinkProxy: attempting send-link route device=%s url=%s", maskPhoneForLog(resolvedDeviceID), maskURLForLog(forwardURL))
	if resp, err := forwardWhatsAppSendRequest(client, forwardURL, body); err == nil {
		defer resp.Body.Close()
		w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
		w.WriteHeader(resp.StatusCode)
		io.Copy(w, resp.Body)
		return
	} else {
		log.Printf("whatsappSendLinkProxy: send-link route failed device=%s err=%v", maskPhoneForLog(resolvedDeviceID), err)
	}

	http.Error(w, "gateway-unavailable", http.StatusServiceUnavailable)
}

// Proxy chat presence (typing indicator) to the bundled gateway
func whatsappPresenceProxyHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Paiperwork-User")
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if !whatsappServerStarted {
		log.Printf("whatsappPresenceProxy: rejected because whatsapp server is stopped")
		http.Error(w, "whatsapp-server-stopped", http.StatusServiceUnavailable)
		return
	}

	userKey, allowed := enforceWhatsappActiveUserAccess(w, r, false)
	if !allowed {
		return
	}

	explicitDeviceID := strings.TrimSpace(r.URL.Query().Get("device_id"))
	requestedDeviceID := getRequestedWhatsappDeviceIDFromRequest(r)

	w.Header().Set("Access-Control-Allow-Origin", "*")

	body, err := io.ReadAll(io.LimitReader(r.Body, 1024*1024))
	if err != nil {
		log.Printf("whatsappPresenceProxy: failed to read body: %v", err)
		http.Error(w, "bad-request", http.StatusBadRequest)
		return
	}

	var incoming struct {
		Phone  string `json:"phone"`
		Action string `json:"action"`
	}
	if err := json.Unmarshal(body, &incoming); err != nil {
		log.Printf("whatsappPresenceProxy: invalid json: %v", err)
		http.Error(w, "bad-request", http.StatusBadRequest)
		return
	}

	// Normalize and build payload
	payload := map[string]string{
		"phone":  strings.TrimSpace(incoming.Phone),
		"action": strings.TrimSpace(incoming.Action),
	}
	client := &http.Client{Timeout: 10 * time.Second}
	if explicitDeviceID == "" {
		if routedDeviceID := resolveWhatsappChatDeviceRouteWithGateway(client, userKey, incoming.Phone); routedDeviceID != "" {
			requestedDeviceID = routedDeviceID
		}
	}
	payloadBytes, _ := json.Marshal(payload)

	resolvedDeviceID, derr := ensureWhatsappGatewayDevice(client, userKey, requestedDeviceID, false)
	if derr != nil || strings.TrimSpace(resolvedDeviceID) == "" {
		if derr != nil {
			log.Printf("whatsappPresenceProxy: cannot resolve device id: %v", derr)
		} else {
			log.Printf("whatsappPresenceProxy: cannot resolve device id: empty")
		}
		http.Error(w, "gateway-unavailable", http.StatusServiceUnavailable)
		return
	}
	deviceQuery := "?device_id=" + url.QueryEscape(strings.TrimSpace(resolvedDeviceID))

	if resp, err := forwardWhatsAppSendRequest(client, "http://127.0.0.1:3000/send/chat-presence"+deviceQuery, payloadBytes); err == nil {
		defer resp.Body.Close()
		w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
		w.WriteHeader(resp.StatusCode)
		io.Copy(w, resp.Body)
		return
	}

	log.Printf("whatsappPresenceProxy: forward failed to /send/chat-presence")
	http.Error(w, "gateway-unavailable", http.StatusServiceUnavailable)
}

// Proxy multipart file uploads to the bundled gateway's /send/file endpoint
func whatsappSendFileProxyHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Paiperwork-User")
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if !whatsappServerStarted {
		log.Printf("whatsappSendFileProxy: rejected because whatsapp server is stopped")
		http.Error(w, "whatsapp-server-stopped", http.StatusServiceUnavailable)
		return
	}

	userKey, allowed := enforceWhatsappActiveUserAccess(w, r, false)
	if !allowed {
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")

	requestedDeviceID := getRequestedWhatsappDeviceIDFromRequest(r)
	client := &http.Client{Timeout: 0}
	resolvedDeviceID, derr := ensureWhatsappGatewayDevice(client, userKey, requestedDeviceID, false)
	if derr != nil || strings.TrimSpace(resolvedDeviceID) == "" {
		if derr != nil {
			log.Printf("whatsappSendFileProxy: cannot resolve device id: %v", derr)
		} else {
			log.Printf("whatsappSendFileProxy: cannot resolve device id: empty")
		}
		http.Error(w, "gateway-unavailable", http.StatusServiceUnavailable)
		return
	}

	// Forward the multipart request body directly to the gateway
	forwardURL := "http://127.0.0.1:3000/send/file?device_id=" + url.QueryEscape(strings.TrimSpace(resolvedDeviceID))
	req, err := http.NewRequest("POST", forwardURL, r.Body)
	if err != nil {
		log.Printf("whatsappSendFileProxy: failed to create request: %v", err)
		http.Error(w, "internal-error", http.StatusInternalServerError)
		return
	}
	// Preserve Content-Type (includes boundary)
	if ct := r.Header.Get("Content-Type"); ct != "" {
		req.Header.Set("Content-Type", ct)
	}

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("whatsappSendFileProxy: forward failed: %v", err)
		http.Error(w, "gateway-unavailable", http.StatusServiceUnavailable)
		return
	}
	defer resp.Body.Close()

	// Mirror response
	w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}

// Proxy multipart image uploads to the bundled gateway's /send/image endpoint
func whatsappSendImageProxyHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Paiperwork-User")
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if !whatsappServerStarted {
		log.Printf("whatsappSendImageProxy: rejected because whatsapp server is stopped")
		http.Error(w, "whatsapp-server-stopped", http.StatusServiceUnavailable)
		return
	}

	userKey, allowed := enforceWhatsappActiveUserAccess(w, r, false)
	if !allowed {
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")

	requestedDeviceID := getRequestedWhatsappDeviceIDFromRequest(r)
	client := &http.Client{Timeout: 0}
	resolvedDeviceID, derr := ensureWhatsappGatewayDevice(client, userKey, requestedDeviceID, false)
	if derr != nil || strings.TrimSpace(resolvedDeviceID) == "" {
		if derr != nil {
			log.Printf("whatsappSendImageProxy: cannot resolve device id: %v", derr)
		} else {
			log.Printf("whatsappSendImageProxy: cannot resolve device id: empty")
		}
		http.Error(w, "gateway-unavailable", http.StatusServiceUnavailable)
		return
	}

	// Forward the multipart request body directly to the gateway
	forwardURL := "http://127.0.0.1:3000/send/image?device_id=" + url.QueryEscape(strings.TrimSpace(resolvedDeviceID))
	req, err := http.NewRequest("POST", forwardURL, r.Body)
	if err != nil {
		log.Printf("whatsappSendImageProxy: failed to create request: %v", err)
		http.Error(w, "internal-error", http.StatusInternalServerError)
		return
	}
	if ct := r.Header.Get("Content-Type"); ct != "" {
		req.Header.Set("Content-Type", ct)
	}

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("whatsappSendImageProxy: forward failed: %v", err)
		http.Error(w, "gateway-unavailable", http.StatusServiceUnavailable)
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}

func wechatSendFileProxyHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Paiperwork-User")
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	wechatEngineMu.Lock()
	started := wechatEngineStarted
	stateDir := wechatEngineStateDir
	wechatEngineMu.Unlock()
	if !started {
		http.Error(w, "WeChat gateway not started", http.StatusServiceUnavailable)
		return
	}
	if strings.TrimSpace(stateDir) == "" {
		http.Error(w, "wechat gateway state unavailable", http.StatusServiceUnavailable)
		return
	}

	if err := r.ParseMultipartForm(64 << 20); err != nil {
		http.Error(w, "invalid multipart body", http.StatusBadRequest)
		return
	}

	account := strings.TrimSpace(r.FormValue("account"))
	if account == "" {
		account = strings.TrimSpace(r.FormValue("account_id"))
	}
	toUserID := strings.TrimSpace(r.FormValue("to_user_id"))
	caption := strings.TrimSpace(r.FormValue("caption"))
	contextToken := strings.TrimSpace(r.FormValue("context_token"))
	replyToMessageID := strings.TrimSpace(r.FormValue("reply_to_message_id"))
	quotedBody := strings.TrimSpace(r.FormValue("quoted_body"))

	if account == "" || toUserID == "" {
		http.Error(w, "account and to_user_id are required", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "file upload is required", http.StatusBadRequest)
		return
	}
	defer file.Close()

	safeName := filepath.Base(header.Filename)
	tempFile, err := os.CreateTemp("", fmt.Sprintf("paiperwork-wechat-%d-%s", time.Now().UnixNano(), safeName))
	if err != nil {
		http.Error(w, "failed to save file", http.StatusInternalServerError)
		return
	}
	tempPath := tempFile.Name()
	if _, err := io.Copy(tempFile, file); err != nil {
		tempFile.Close()
		os.Remove(tempPath)
		http.Error(w, "failed to save file", http.StatusInternalServerError)
		return
	}
	tempFile.Close()
	defer os.Remove(tempPath)

	payload := map[string]any{
		"account_id": account,
		"to_user_id": toUserID,
		"type":       "file",
		"file_path":  tempPath,
		"text":       caption,
	}
	if contextToken != "" {
		payload["context_token"] = contextToken
	}
	if replyToMessageID != "" {
		payload["reply_to_message_id"] = replyToMessageID
	}
	if quotedBody != "" {
		payload["quoted_body"] = quotedBody
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		http.Error(w, "failed to prepare request", http.StatusInternalServerError)
		return
	}

	client := &http.Client{Timeout: 120 * time.Second}
	req, err := http.NewRequest(http.MethodPost, "http://127.0.0.1:17890/api/messages/send-media", bytes.NewReader(bodyBytes))
	if err != nil {
		http.Error(w, "failed to create forward request", http.StatusInternalServerError)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "wechat gateway unavailable", http.StatusServiceUnavailable)
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}

func wechatSendImageProxyHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Paiperwork-User")
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	wechatEngineMu.Lock()
	started := wechatEngineStarted
	stateDir := wechatEngineStateDir
	wechatEngineMu.Unlock()
	if !started {
		http.Error(w, "WeChat gateway not started", http.StatusServiceUnavailable)
		return
	}
	if strings.TrimSpace(stateDir) == "" {
		http.Error(w, "wechat gateway state unavailable", http.StatusServiceUnavailable)
		return
	}

	if err := r.ParseMultipartForm(64 << 20); err != nil {
		http.Error(w, "invalid multipart body", http.StatusBadRequest)
		return
	}

	account := strings.TrimSpace(r.FormValue("account"))
	if account == "" {
		account = strings.TrimSpace(r.FormValue("account_id"))
	}
	toUserID := strings.TrimSpace(r.FormValue("to_user_id"))
	caption := strings.TrimSpace(r.FormValue("caption"))
	contextToken := strings.TrimSpace(r.FormValue("context_token"))
	replyToMessageID := strings.TrimSpace(r.FormValue("reply_to_message_id"))
	quotedBody := strings.TrimSpace(r.FormValue("quoted_body"))

	if account == "" || toUserID == "" {
		http.Error(w, "account and to_user_id are required", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		file, header, err = r.FormFile("file")
		if err != nil {
			http.Error(w, "image upload is required", http.StatusBadRequest)
			return
		}
	}
	defer file.Close()

	safeName := filepath.Base(header.Filename)
	tempFile, err := os.CreateTemp("", fmt.Sprintf("paiperwork-wechat-%d-%s", time.Now().UnixNano(), safeName))
	if err != nil {
		http.Error(w, "failed to save image", http.StatusInternalServerError)
		return
	}
	tempPath := tempFile.Name()
	if _, err := io.Copy(tempFile, file); err != nil {
		tempFile.Close()
		os.Remove(tempPath)
		http.Error(w, "failed to save image", http.StatusInternalServerError)
		return
	}
	tempFile.Close()
	defer os.Remove(tempPath)

	payload := map[string]any{
		"account_id": account,
		"to_user_id": toUserID,
		"type":       "image",
		"file_path":  tempPath,
		"text":       caption,
	}
	if contextToken != "" {
		payload["context_token"] = contextToken
	}
	if replyToMessageID != "" {
		payload["reply_to_message_id"] = replyToMessageID
	}
	if quotedBody != "" {
		payload["quoted_body"] = quotedBody
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		http.Error(w, "failed to prepare request", http.StatusInternalServerError)
		return
	}

	client := &http.Client{Timeout: 120 * time.Second}
	req, err := http.NewRequest(http.MethodPost, "http://127.0.0.1:17890/api/messages/send-media", bytes.NewReader(bodyBytes))
	if err != nil {
		http.Error(w, "failed to create forward request", http.StatusInternalServerError)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "wechat gateway unavailable", http.StatusServiceUnavailable)
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}

func forwardWhatsAppSendRequest(client *http.Client, url string, body []byte) (*http.Response, error) {
	req, err := http.NewRequest("POST", url, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("forwardWhatsAppSendRequest: transport error url=%s err=%v", url, err)
		return nil, err
	}
	if resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusBadRequest {
		bodyBytes, _ := io.ReadAll(io.LimitReader(resp.Body, 8192))
		resp.Body.Close()
		log.Printf("forwardWhatsAppSendRequest: route invalid url=%s status=%d body=%s", url, resp.StatusCode, compactLogValue(strings.TrimSpace(string(bodyBytes)), 400))
		return nil, fmt.Errorf("gateway endpoint missing or invalid")
	}
	if resp.StatusCode >= http.StatusInternalServerError {
		bodyBytes, _ := io.ReadAll(io.LimitReader(resp.Body, 8192))
		bodyText := strings.TrimSpace(string(bodyBytes))
		resp.Body.Close()
		log.Printf("forwardWhatsAppSendRequest: server error url=%s status=%d body=%s", url, resp.StatusCode, compactLogValue(bodyText, 400))
		if strings.Contains(bodyText, "INVALID_WA_CLI") || strings.Contains(strings.ToLower(bodyText), "whatsapp cli is invalid or empty") {
			return nil, fmt.Errorf("gateway route returned invalid wa cli")
		}
		resp.Body = io.NopCloser(bytes.NewReader(bodyBytes))
	}
	return resp, nil
}

func inferWhatsappGatewayDevicePhone(client *http.Client) (string, error) {
	return inferWhatsappGatewayDevicePhoneByID(client, "")
}

func listWhatsappGatewayDevices(client *http.Client) ([]struct {
	DeviceID    string `json:"device_id"`
	ID          string `json:"id"`
	PhoneNumber string `json:"phone_number"`
	JID         string `json:"jid"`
}, error) {
	resp, err := client.Get("http://127.0.0.1:3000/devices")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("/devices status %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	var listResp struct {
		Code    string `json:"code"`
		Message string `json:"message"`
		Results []struct {
			DeviceID    string `json:"device_id"`
			ID          string `json:"id"`
			PhoneNumber string `json:"phone_number"`
			JID         string `json:"jid"`
		} `json:"results"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&listResp); err != nil {
		return nil, err
	}
	return listResp.Results, nil
}

func resolveWhatsappGatewayRegisteredDeviceID(client *http.Client, requestedDeviceID string) (string, bool, error) {
	trimmedRequestedID := strings.TrimSpace(requestedDeviceID)
	if trimmedRequestedID == "" {
		return "", false, nil
	}

	cachedResolvedID := getCachedWhatsappGatewayDeviceResolution(trimmedRequestedID)
	if cachedResolvedID != "" {
		return cachedResolvedID, true, nil
	}

	devices, err := listWhatsappGatewayDevices(client)
	if err != nil {
		return "", false, err
	}

	for _, device := range devices {
		resolvedID := strings.TrimSpace(device.DeviceID)
		if resolvedID == "" {
			resolvedID = strings.TrimSpace(device.ID)
		}
		if resolvedID == "" {
			continue
		}

		aliases := []string{
			strings.TrimSpace(device.DeviceID),
			strings.TrimSpace(device.ID),
			strings.TrimSpace(device.JID),
			strings.TrimSpace(device.PhoneNumber),
		}
		for _, alias := range aliases {
			if alias == "" {
				continue
			}
			if strings.EqualFold(strings.TrimSpace(alias), trimmedRequestedID) {
				setCachedWhatsappGatewayDeviceResolution(trimmedRequestedID, resolvedID)
				return resolvedID, false, nil
			}
		}
	}

	return "", false, nil
}

func resolveWhatsappGatewayDeviceCandidatesByIdentity(client *http.Client, deviceID string) ([]string, error) {
	devices, err := listWhatsappGatewayDevices(client)
	if err != nil {
		return nil, err
	}
	trimmedRequestedID := strings.TrimSpace(deviceID)
	if trimmedRequestedID == "" {
		ids := make([]string, 0, len(devices))
		seen := make(map[string]bool)
		for _, device := range devices {
			resolvedID := strings.TrimSpace(device.DeviceID)
			if resolvedID == "" {
				resolvedID = strings.TrimSpace(device.ID)
			}
			if resolvedID != "" && !seen[resolvedID] {
				seen[resolvedID] = true
				ids = append(ids, resolvedID)
			}
		}
		return ids, nil
	}

	ids := make([]string, 0, len(devices))
	seen := make(map[string]bool)
	for _, device := range devices {
		resolvedID := strings.TrimSpace(device.DeviceID)
		if resolvedID == "" {
			resolvedID = strings.TrimSpace(device.ID)
		}
		if resolvedID == "" {
			continue
		}

		aliases := []string{
			strings.TrimSpace(device.DeviceID),
			strings.TrimSpace(device.ID),
			strings.TrimSpace(device.JID),
			strings.TrimSpace(device.PhoneNumber),
		}
		matched := false
		for _, alias := range aliases {
			if alias == "" {
				continue
			}
			if strings.EqualFold(strings.TrimSpace(alias), trimmedRequestedID) {
				matched = true
				break
			}
		}
		if !matched {
			continue
		}

		if !seen[resolvedID] {
			seen[resolvedID] = true
			ids = append(ids, resolvedID)
		}
	}
	return ids, nil
}

func inferWhatsappGatewayDevicePhoneByID(client *http.Client, deviceID string) (string, error) {
	devices, err := listWhatsappGatewayDevices(client)
	if err != nil {
		return "", err
	}
	if len(devices) == 0 {
		return "", nil
	}

	pickDevice := func(d struct {
		DeviceID    string `json:"device_id"`
		ID          string `json:"id"`
		PhoneNumber string `json:"phone_number"`
		JID         string `json:"jid"`
	}) string {
		if d.PhoneNumber != "" {
			return strings.TrimSpace(d.PhoneNumber)
		}
		if d.JID != "" {
			parts := strings.Split(d.JID, "@")
			return strings.TrimSpace(parts[0])
		}
		return ""
	}

	trimmedDeviceID := strings.TrimSpace(deviceID)
	if trimmedDeviceID != "" {
		for _, device := range devices {
			aliases := []string{
				strings.TrimSpace(device.DeviceID),
				strings.TrimSpace(device.ID),
				strings.TrimSpace(device.JID),
				strings.TrimSpace(device.PhoneNumber),
			}
			for _, alias := range aliases {
				if alias == "" {
					continue
				}
				if strings.EqualFold(strings.TrimSpace(alias), trimmedDeviceID) {
					return pickDevice(device), nil
				}
			}
		}
	}

	device := devices[0]
	phone := pickDevice(device)
	if phone != "" {
		return phone, nil
	}

	for _, device := range devices[1:] {
		phone = pickDevice(device)
		if phone != "" {
			return phone, nil
		}
	}
	return "", nil
}

func dispatchWhatsappWelcomeMessage(userKey, deviceID, initialTargetPhone string) {
	deviceKey := normalizeWhatsappWelcomeTrackingKey(deviceID, initialTargetPhone)
	defer func() {
		welcomeMu.Lock()
		if deviceKey != "" {
			delete(welcomePendingForDevice, deviceKey)
		}
		welcomeMu.Unlock()
	}()

	targetPhone := strings.TrimSpace(initialTargetPhone)
	explicitStartupTargetPhone := strings.TrimSpace(os.Getenv("PAIPERWORK_WHATSAPP_STARTUP_PHONE"))
	if explicitStartupTargetPhone == "" {
		explicitStartupTargetPhone = strings.TrimSpace(os.Getenv("WHATSAPP_STARTUP_PHONE"))
	}
	for attempt := 1; attempt <= 12; attempt++ {
		if !whatsappServerStarted {
			//log.Printf("dispatchWhatsappWelcomeMessage: gateway stopped while waiting for target phone (device=%s)", maskPhoneForLog(deviceID))
			return
		}

		welcomeMu.Lock()
		blocked := isWhatsappWelcomeBlocked(deviceID, targetPhone)
		welcomeMu.Unlock()
		if blocked {
			log.Printf("dispatchWhatsappWelcomeMessage: skipping welcome for purged device %s target=%s", maskPhoneForLog(deviceID), maskPhoneForLog(targetPhone))
			return
		}

		client := &http.Client{Timeout: 5 * time.Second}
		if reboundDeviceID := resolveLoggedInWhatsappWelcomeDeviceID(client, deviceID, targetPhone); reboundDeviceID != "" && !strings.EqualFold(strings.TrimSpace(reboundDeviceID), strings.TrimSpace(deviceID)) {
			//log.Printf("dispatchWhatsappWelcomeMessage: rebinding welcome dispatch from device %s to logged-in device %s", maskPhoneForLog(deviceID), maskPhoneForLog(reboundDeviceID))
			deviceID = reboundDeviceID
			deviceKey = normalizeWhatsappWelcomeTrackingKey(deviceID, targetPhone)
		}

		if !waitForWhatsappSendReady(deviceID, 8*time.Second) {
			//log.Printf("dispatchWhatsappWelcomeMessage: gateway not ready for welcome send yet (device=%s, attempt=%d)", maskPhoneForLog(deviceID), attempt)
			time.Sleep(1500 * time.Millisecond)
			continue
		}

		if targetPhone == "" {
			if inferred, err := inferWhatsappGatewayDevicePhoneByID(client, deviceID); err == nil && inferred != "" {
				if explicitStartupTargetPhone == "" && normalizeWhatsappIdentity(inferred) == normalizeWhatsappIdentity(deviceID) {
					welcomeMu.Lock()
					if deviceKey != "" {
						welcomeSentForDevice[deviceKey] = true
						welcomeLastSentAtForDevice[deviceKey] = time.Now()
					}
					welcomeMu.Unlock()
					log.Printf("dispatchWhatsappWelcomeMessage: skipping inferred self-target welcome for device %s because no explicit startup phone is configured", maskPhoneForLog(deviceID))
					return
				}
				targetPhone = inferred
				deviceKey = normalizeWhatsappWelcomeTrackingKey(deviceID, targetPhone)
				whatsappStartupTargetPhone = inferred
			} else if err != nil {
				log.Printf("dispatchWhatsappWelcomeMessage: cannot infer target phone yet for device %s (attempt %d): %v", maskPhoneForLog(deviceID), attempt, err)
			}
		}

		if targetPhone != "" {
			welcomeMu.Lock()
			blocked := isWhatsappWelcomeBlocked(deviceID, targetPhone)
			welcomeMu.Unlock()
			if blocked {
				log.Printf("dispatchWhatsappWelcomeMessage: skipping welcome send for purged device %s target=%s", maskPhoneForLog(deviceID), maskPhoneForLog(targetPhone))
				return
			}
			if !waitForWhatsappSendReady(deviceID, 10*time.Second) {
				log.Printf("dispatchWhatsappWelcomeMessage: device %s not send-ready yet for target %s (attempt %d)", maskPhoneForLog(deviceID), maskPhoneForLog(targetPhone), attempt)
				time.Sleep(2 * time.Second)
				continue
			}
			if err := sendWhatsappText(userKey, deviceID, targetPhone, "👋 Paiperwork is now connected and ready to chat."); err != nil {
				log.Printf("dispatchWhatsappWelcomeMessage: send failed to %s for device %s (attempt %d): %v", maskPhoneForLog(targetPhone), maskPhoneForLog(deviceID), attempt, err)
			} else {
				welcomeMu.Lock()
				if deviceKey != "" {
					welcomeSentForDevice[deviceKey] = true
					welcomeLastSentAtForDevice[deviceKey] = time.Now()
				}
				welcomeMu.Unlock()
				//log.Printf("dispatchWhatsappWelcomeMessage: welcome message sent to %s for device %s", maskPhoneForLog(targetPhone), maskPhoneForLog(deviceID))
				return
			}
		}

		time.Sleep(2 * time.Second)
	}

	log.Printf("dispatchWhatsappWelcomeMessage: unable to resolve/send welcome for device %s after retries; will retry on next connected poll", maskPhoneForLog(deviceID))
}

func waitForWhatsappSendReady(deviceID string, timeout time.Duration) bool {
	deadline := time.Now().Add(timeout)
	client := &http.Client{Timeout: 3 * time.Second}
	for {
		if !whatsappServerStarted {
			return false
		}
		if isGatewayReady() {
			candidateIDs, err := resolveWhatsappGatewayDeviceCandidatesByIdentity(client, deviceID)
			if err == nil {
				for _, candidateID := range candidateIDs {
					status, statusErr := fetchWhatsappGatewayConnectionStatus(client, candidateID)
					if statusErr == nil && status != nil && status.Connected && status.LoggedIn {
						return true
					}
				}
			} else {
				status, statusErr := fetchWhatsappGatewayConnectionStatus(client, deviceID)
				if statusErr == nil && status != nil && status.Connected && status.LoggedIn {
					return true
				}
			}
		}
		if time.Now().After(deadline) {
			return false
		}
		time.Sleep(250 * time.Millisecond)
	}
}

func sendWhatsappText(userKey, deviceID, chatID, text string) error {
	if chatID == "" {
		return fmt.Errorf("no target phone configured")
	}

	if !whatsappServerStarted {
		log.Printf("sendWhatsappText: gateway stopped, skipping send to %s", chatID)
		return nil
	}

	payload := map[string]any{
		"phone":   chatID,
		"message": text,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	client := &http.Client{Timeout: 10 * time.Second}
	for attempt := 1; attempt <= 4; attempt++ {
		resolvedDeviceID := strings.TrimSpace(deviceID)
		if reboundDeviceID := resolveLoggedInWhatsappWelcomeDeviceID(client, resolvedDeviceID, chatID); reboundDeviceID != "" {
			resolvedDeviceID = reboundDeviceID
		}
		if resolvedDeviceID == "" {
			return fmt.Errorf("no device available for send")
		}

		sendURL := "http://127.0.0.1:3000/send/message?device_id=" + url.QueryEscape(resolvedDeviceID)
		if attempt == 1 {
			log.Printf("sendWhatsappText: using direct gateway send route device=%s target=%s", maskPhoneForLog(resolvedDeviceID), maskPhoneForLog(chatID))
		}
		req, err := http.NewRequest(http.MethodPost, sendURL, bytes.NewReader(body))
		if err != nil {
			return err
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Device-Id", resolvedDeviceID)
		if trimmedUserKey := strings.TrimSpace(userKey); trimmedUserKey != "" {
			req.Header.Set("X-Paiperwork-User", trimmedUserKey)
		}

		resp, err := client.Do(req)
		if err != nil {
			return err
		}
		b, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		if resp.StatusCode == http.StatusOK {
			return nil
		}
		if resp.StatusCode == http.StatusServiceUnavailable {
			log.Printf("sendWhatsappText: gateway unavailable (503) while sending to %s", chatID)
			return fmt.Errorf("send API unavailable: %d %s", resp.StatusCode, strings.TrimSpace(string(b)))
		}
		if resp.StatusCode == http.StatusUnauthorized && attempt < 4 {
			log.Printf("sendWhatsappText auth denied, retrying %d/4", attempt)
			time.Sleep(time.Duration(attempt) * time.Second)
			continue
		}
		return fmt.Errorf("send API failed: %d %s", resp.StatusCode, string(b))
	}
	return fmt.Errorf("send API failed after retries")
}

// tryStartBundledGateway attempts to locate and start a bundled gateway binary.
// It is best-effort and returns an error if no candidate binary exists or start fails.
func isGatewayRunning() bool {
	embeddedGowaMutex.Lock()
	embeddedStarted := embeddedGowaStarted
	embeddedGowaMutex.Unlock()
	if embeddedStarted {
		starting, lastAttempt := snapshotGatewayStartState()
		if isGatewayReady() || starting {
			return true
		}
		if !lastAttempt.IsZero() && time.Since(lastAttempt) < 10*time.Second {
			return true
		}
		if isLocalGatewayResponsive(350 * time.Millisecond) {
			return true
		}

		embeddedGowaMutex.Lock()
		staleEmbedded := embeddedGowaStarted
		if staleEmbedded {
			embeddedGowaStarted = false
			whatsappServerStarted = false
		}
		embeddedGowaMutex.Unlock()
		if staleEmbedded {
			log.Printf("isGatewayRunning: cleared stale embedded gowa state after local gateway became unreachable")
		}
		return false
	}

	gatewayMu.Lock()
	defer gatewayMu.Unlock()
	if gatewayCmd == nil {
		return false
	}
	if gatewayCmd.ProcessState != nil && gatewayCmd.ProcessState.Exited() {
		return false
	}
	return true
}

func isLocalGatewayResponsive(timeout time.Duration) bool {
	client := &http.Client{Timeout: timeout}
	resp, err := client.Get("http://127.0.0.1:3000/health")
	if err == nil {
		defer resp.Body.Close()
		if resp.StatusCode == http.StatusOK {
			return true
		}
	}

	return isWhatsappGatewayWebsocketReady()
}

func isWhatsappGatewayWebsocketReady() bool {
	return isWhatsappGatewayWebsocketReadyAt("http://127.0.0.1:3000/ws")
}

func isWhatsappGatewayWebsocketReadyAt(endpoint string) bool {
	client := &http.Client{Timeout: 500 * time.Millisecond}
	resp, err := client.Get(endpoint)
	if err != nil {
		return false
	}
	defer resp.Body.Close()

	return resp.StatusCode == http.StatusUpgradeRequired || resp.StatusCode == http.StatusSwitchingProtocols
}

func resetGatewayRuntimeState(preserveStartupWindow bool) {
	// Keep per-device user preferences but remove transient runtime flags and caches.
	if !preserveStartupWindow {
		gatewayStartMutex.Lock()
		gatewayStarting = false
		gatewayLastStartAttempt = time.Time{}
		gatewayReady = false
		gatewayStartMutex.Unlock()
	} else {
		setGatewayReady(false)
	}

	embeddedGowaMutex.Lock()
	embeddedGowaStarted = false
	whatsappServerStarted = false
	embeddedGowaMutex.Unlock()

	pairRequested = false

	welcomeMu.Lock()
	welcomeSentForDevice = map[string]bool{}
	welcomeLastSentAtForDevice = map[string]time.Time{}
	welcomeMu.Unlock()

	whatsappGatewayCachedQR = ""
	whatsappGatewayCachedQRTimestamp = time.Time{}
	whatsappGatewayLastLoginAttempt = time.Time{}
	whatsappGatewayCachedBytesMu.Lock()
	whatsappGatewayCachedQRBytes = nil
	whatsappGatewayCachedQRContentType = ""
	whatsappGatewayCachedBytesMu.Unlock()

	whatsappOutgoingMu.Lock()
	whatsappOutgoingMessagesByUser = make(map[string][]whatsappOutgoingMessage)
	whatsappOutgoingMu.Unlock()

	whatsappIncomingMu.Lock()
	whatsappIncomingQueueByUser = make(map[string][]whatsappIncomingMessage)
	whatsappIncomingMu.Unlock()

	whatsappChatDeviceRoutesMu.Lock()
	whatsappChatDeviceRoutesByUser = make(map[string]map[string]string)
	whatsappChatDeviceRoutesMu.Unlock()
}

func waitForGatewayStopped(timeout time.Duration) {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		if !isGatewayRunning() {
			return
		}
		time.Sleep(100 * time.Millisecond)
	}
}

func waitForLocalGatewayShutdown(timeout time.Duration) bool {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		if !isLocalGatewayResponsive(250 * time.Millisecond) {
			return true
		}
		time.Sleep(100 * time.Millisecond)
	}
	return !isLocalGatewayResponsive(250 * time.Millisecond)
}

func stopGateway() error {
	// if we are running embedded gowa, attempt a graceful shutdown.
	embeddedGowaMutex.Lock()
	if embeddedGowaStarted {
		embeddedGowaMutex.Unlock()
		log.Printf("stopGateway: stopping embedded gowa")
		restHelpers.StopAutoConnectAfterBooting()
		if err := gowaCmd.ShutdownRestServer(context.Background()); err != nil {
			log.Printf("stopGateway: error shutting down embedded gowa: %v", err)
			return err
		}
		if !waitForLocalGatewayShutdown(5 * time.Second) {
			log.Printf("stopGateway: embedded gowa listener did not shut down cleanly before timeout; forcing runtime state reset")
		}
		// Wait for the embedded gowa goroutine to fully exit before resetting runtime state.
		waitForGatewayStopped(2 * time.Second)
		resetGatewayRuntimeState(false)
		whatsappInfra.ResetStateOnShutdown()
		sqliteutil.ClosePinnedRuntimeAnchors()
		setActiveGateway("")
		stopKeepAwake()
		return nil
	}
	embeddedGowaMutex.Unlock()

	wechatEngineMu.Lock()
	if wechatEngineStarted {
		wechatEngineMu.Unlock()
		log.Printf("stopGateway: stopping embedded wcfLink")
		if err := stopEmbeddedWcfLink(); err != nil {
			return err
		}
		resetGatewayRuntimeState(false)
		whatsappInfra.ResetStateOnShutdown()
		sqliteutil.ClosePinnedRuntimeAnchors()
		setActiveGateway("")
		stopKeepAwake()
		return nil
	}
	wechatEngineMu.Unlock()

	// Non-embedded gateway path also clears state consistently.
	restHelpers.StopAutoConnectAfterBooting()
	stopBundledGateway()

	gatewayMu.Lock()
	if gatewayCmd != nil && gatewayCmd.Process != nil {
		if err := gatewayCmd.Process.Kill(); err != nil {
			gatewayMu.Unlock()
			return err
		}
	}
	gatewayCmd = nil
	gatewayMu.Unlock()

	whatsappServerStarted = false
	resetGatewayRuntimeState(false)
	whatsappInfra.ResetStateOnShutdown()
	sqliteutil.ClosePinnedRuntimeAnchors()
	setActiveGateway("")
	stopKeepAwake()
	return nil
}

func waitForLocalGateway(timeout time.Duration) error {
	client := &http.Client{Timeout: 1 * time.Second}
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		resp, err := client.Get("http://127.0.0.1:3000/health")
		if err == nil {
			resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				return nil
			}
		}
		time.Sleep(250 * time.Millisecond)
	}
	return fmt.Errorf("gateway not ready after %s", timeout)
}

func startEmbeddedGowa(freshPairStartup bool) error {
	forceWhatsappInMemoryRuntime()
	syncEmbeddedGowaRuntimeDBEnv("")

	// Ensure any previous gateway state is fully cleaned before restarting.
	whatsappInfra.ResetStateOnShutdown()
	// Preserve startup markers so QR warm-up suppression remains active.
	resetGatewayRuntimeState(true)
	registerWhatsappGatewayBroadcastObserver()

	embeddedGowaMutex.Lock()
	if embeddedGowaStarted {
		embeddedGowaMutex.Unlock()
		return nil
	}
	// Mark startup in progress. Will remain true only on success.
	embeddedGowaStarted = true
	whatsappServerStarted = true
	embeddedGowaMutex.Unlock()
	setGatewayReady(false)

	// Make sure webhook config is set for gowa usecases
	if whatsappWebhookURL != "" {
		os.Setenv("WHATSAPP_WEBHOOK", whatsappWebhookURL)
		os.Setenv("PAIPERWORK_WHATSAPP_WEBHOOK", whatsappWebhookURL)
	}
	if whatsappWebhookSecret != "" {
		os.Setenv("WHATSAPP_WEBHOOK_SECRET", whatsappWebhookSecret)
		os.Setenv("PAIPERWORK_WHATSAPP_WEBHOOK_SECRET", whatsappWebhookSecret)
	}
	os.Setenv("WHATSAPP_WEBHOOK_EVENTS", "message")
	os.Setenv("WHATSAPP_WEBHOOK_INCLUDE_OUTGOING", "true")
	os.Setenv("WHATSAPP_WEBHOOK_INSECURE_SKIP_VERIFY", "true")
	os.Setenv("CHATWOOT_ENABLED", "false")
	os.Setenv("CHATWOOT_IMPORT_MESSAGES", "false")
	os.Setenv("HISTORY_SYNC_ENABLED", "false")
	if freshPairStartup {
		os.Setenv(whatsappFreshPairStartupEnv, "true")
		os.Unsetenv("PAIPERWORK_WHATSAPP_DEVICE_ID")
		os.Unsetenv("WHATSAPP_DEVICE_ID")
		config.WhatsappPreferredDeviceID = ""
	} else {
		os.Unsetenv(whatsappFreshPairStartupEnv)
	}

	os.Setenv("PAIPERWORK_NO_DISK", "true")
	os.Setenv("PAIPERWORK_EMBEDDED_GOWA", "true")
	setActiveGateway(activeGatewayWhatsApp)
	startKeepAwake()

	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("startEmbeddedGowa: recovered panic in gowa goroutine: %v", r)
				log.Printf("startEmbeddedGowa: stack trace:\n%s", debug.Stack())
			}
			embeddedGowaMutex.Lock()
			embeddedGowaStarted = false
			whatsappServerStarted = false
			embeddedGowaMutex.Unlock()
			setGatewayReady(false)
			setActiveGateway("")
			stopKeepAwake()
		}()

		// If a fresh-pair is in progress, ensure gowa starts with no residual
		// selected device. Do this inside the goroutine so we win any race
		// against concurrent poll requests that may have re-set the env vars
		// between the handler clearing them and this goroutine running.
		if freshPairStartup {
			os.Setenv(whatsappFreshPairStartupEnv, "true")
			os.Unsetenv("PAIPERWORK_WHATSAPP_DEVICE_ID")
			os.Unsetenv("WHATSAPP_DEVICE_ID")
			config.WhatsappPreferredDeviceID = ""
		} else {
			os.Unsetenv(whatsappFreshPairStartupEnv)
		}

		log.Print("startEmbeddedGowa: launching gowa in-process")
		gowaCmd.StartRestServer()
		log.Print("startEmbeddedGowa: gowa process exited")

		embeddedGowaMutex.Lock()
		embeddedGowaStarted = false
		whatsappServerStarted = false
		embeddedGowaMutex.Unlock()
	}()

	go func() {
		if err := waitForLocalGateway(20 * time.Second); err != nil {
			log.Printf("startEmbeddedGowa: gateway not ready after expected delay: %v", err)
			setGatewayReady(false)
			return
		}
		setGatewayReady(true)
		log.Printf("startEmbeddedGowa: gateway is healthy")
	}()

	return nil
}

func newWechatEngineConfig(stateDir string) wcfLinkEngine.Config {
	cfg := wcfLinkEngine.LoadConfig()
	cfg.ListenAddr = wechatListenAddr
	cfg.StateDir = stateDir
	cfg.MediaDir = os.TempDir()
	cfg.SettingsPath = filepath.Join(cfg.StateDir, "settings.json")
	cfg.OpenBrowser = false
	cfg.WebhookURL = ""
	return cfg
}

func startEmbeddedWcfLink(stateDir string) error {
	disablePolling := strings.ToLower(strings.TrimSpace(os.Getenv("PAIPERWORK_DISABLE_WCFLINK_EVENT_POLLING"))) == "true"
	log.Printf("Paiperworkdb: startEmbeddedWcfLink: beginning embedded wcfLink startup, disable polling=%v", disablePolling)
	wechatEngineMu.Lock()
	if wechatEngineStarted {
		wechatEngineMu.Unlock()
		return nil
	}
	wechatEngineMu.Unlock()

	cfg := newWechatEngineConfig(stateDir)
	log.Printf("Paiperworkdb: using WeChat state directory %s", cfg.StateDir)

	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	engineInstance, err := wcfLinkEngine.New(context.Background(), cfg, logger)
	if err != nil {
		return err
	}

	if err := engineInstance.StartBackground(context.Background()); err != nil {
		_ = engineInstance.Shutdown()
		return err
	}
	log.Printf("startEmbeddedWcfLink: embedded wcfLink background startup completed")

	wechatEngineMu.Lock()
	wechatEngine = engineInstance
	wechatEngineStarted = true
	wechatEngineReady = false
	wechatEngineStateDir = stateDir
	setActiveGateway(activeGatewayWechat)
	wechatEngineMu.Unlock()
	startKeepAwake()

	go func() {
		if err := waitForWcfLinkLocalGateway(15 * time.Second); err != nil {
			log.Printf("startEmbeddedWcfLink: gateway not ready after expected delay: %v", err)
			return
		}
		wechatEngineMu.Lock()
		wechatEngineReady = true
		wechatEngineMu.Unlock()
		log.Printf("startEmbeddedWcfLink: wechat gateway is healthy")
	}()

	return nil
}

func stopEmbeddedWcfLink() error {
	wechatEngineMu.Lock()
	engineInstance := wechatEngine
	if !wechatEngineStarted || engineInstance == nil {
		wechatEngineMu.Unlock()
		return nil
	}
	wechatEngineMu.Unlock()

	shutdownErrCh := make(chan error, 1)
	go func() {
		shutdownErrCh <- engineInstance.Shutdown()
	}()

	select {
	case err := <-shutdownErrCh:
		if err != nil {
			return err
		}
	case <-time.After(8 * time.Second):
		return fmt.Errorf("timed out waiting for WeChat gateway shutdown")
	}

	log.Printf("stopEmbeddedWcfLink: WeChat gateway stopped successfully")

	wechatEngineMu.Lock()
	wechatEngineStarted = false
	wechatEngineReady = false
	wechatEngine = nil
	wechatEngineStateDir = ""
	wechatEngineMu.Unlock()
	setActiveGateway("")
	stopKeepAwake()
	return nil
}

func isWcfLinkResponsive(timeout time.Duration) bool {
	client := &http.Client{Timeout: timeout}
	resp, err := client.Get(fmt.Sprintf("http://%s/health/ready", wechatListenAddr))
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode == http.StatusOK
}

func waitForWcfLinkLocalGateway(timeout time.Duration) error {
	client := &http.Client{Timeout: 1 * time.Second}
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		resp, err := client.Get(fmt.Sprintf("http://%s/health/ready", wechatListenAddr))
		if err == nil {
			resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				return nil
			}
		}
		time.Sleep(250 * time.Millisecond)
	}
	return fmt.Errorf("wechat gateway not ready after %s", timeout)
}

type wechatAccountRestore struct {
	AccountID     string `json:"account_id"`
	BaseURL       string `json:"base_url"`
	Token         string `json:"token"`
	ILinkUserID   string `json:"ilink_user_id,omitempty"`
	Enabled       bool   `json:"enabled,omitempty"`
	LoginStatus   string `json:"login_status,omitempty"`
	LastError     string `json:"last_error,omitempty"`
	GetUpdatesBuf string `json:"get_updates_buf,omitempty"`
	CreatedAt     string `json:"created_at,omitempty"`
	UpdatedAt     string `json:"updated_at,omitempty"`
}

func wechatStartHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var body struct {
		HashedMasterKey string                 `json:"hashedMasterKey"`
		Accounts        []wechatAccountRestore `json:"accounts,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, fmt.Sprintf("invalid request body: %v", err), http.StatusBadRequest)
		return
	}
	hashedMasterKey := strings.TrimSpace(body.HashedMasterKey)
	if hashedMasterKey == "" {
		http.Error(w, "missing hashedMasterKey", http.StatusBadRequest)
		return
	}

	if isGatewayRunning() {
		log.Printf("wechatStartHandler: stopping running WhatsApp gateway before WeChat startup")
		if err := stopGateway(); err != nil {
			http.Error(w, fmt.Sprintf("failed to stop existing WhatsApp gateway: %v", err), http.StatusInternalServerError)
			return
		}
	}
	if !regexp.MustCompile(`^[a-fA-F0-9]+$`).MatchString(hashedMasterKey) {
		http.Error(w, "invalid hashedMasterKey", http.StatusBadRequest)
		return
	}

	execDir := filepath.Dir(os.Args[0])
	stateDir := filepath.Join(execDir, "data", "wcfLink", hashedMasterKey)

	wechatEngineMu.Lock()
	currentStateDir := wechatEngineStateDir
	started := wechatEngineStarted
	wechatEngineMu.Unlock()

	if started && currentStateDir != stateDir {
		if err := stopEmbeddedWcfLink(); err != nil {
			http.Error(w, fmt.Sprintf("failed to stop existing WeChat gateway: %v", err), http.StatusInternalServerError)
			return
		}
	}

	if err := startEmbeddedWcfLink(stateDir); err != nil {
		http.Error(w, fmt.Sprintf("failed to start WeChat gateway: %v", err), http.StatusInternalServerError)
		return
	}

	wechatEngineMu.Lock()
	engineInstance := wechatEngine
	ready := wechatEngineReady
	wechatEngineMu.Unlock()

	if len(body.Accounts) > 0 && engineInstance != nil {
		var restored []wcfLinkEngine.Account
		for _, item := range body.Accounts {
			if strings.TrimSpace(item.AccountID) == "" || strings.TrimSpace(item.BaseURL) == "" || strings.TrimSpace(item.Token) == "" {
				continue
			}

			createdAt := time.Now().UTC()
			if item.CreatedAt != "" {
				if parsed, err := time.Parse(time.RFC3339, item.CreatedAt); err == nil {
					createdAt = parsed.UTC()
				}
			}
			updatedAt := time.Now().UTC()
			if item.UpdatedAt != "" {
				if parsed, err := time.Parse(time.RFC3339, item.UpdatedAt); err == nil {
					updatedAt = parsed.UTC()
				}
			}

			loginStatus := item.LoginStatus
			if loginStatus == "" {
				loginStatus = "connected"
			}

			restored = append(restored, wcfLinkEngine.Account{
				AccountID:     item.AccountID,
				BaseURL:       item.BaseURL,
				Token:         item.Token,
				ILinkUserID:   item.ILinkUserID,
				Enabled:       item.Enabled,
				LoginStatus:   loginStatus,
				LastError:     item.LastError,
				GetUpdatesBuf: item.GetUpdatesBuf,
				CreatedAt:     createdAt,
				UpdatedAt:     updatedAt,
			})
		}
		if len(restored) > 0 {
			if err := engineInstance.RestoreAccounts(r.Context(), restored); err != nil {
				http.Error(w, fmt.Sprintf("failed to restore WeChat accounts: %v", err), http.StatusInternalServerError)
				return
			}
		}
	}

	paired := isWechatEnginePaired(r.Context(), engineInstance)
	_ = json.NewEncoder(w).Encode(map[string]any{"serverStarted": true, "ready": ready, "paired": paired})
}

func wechatStopHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if err := stopEmbeddedWcfLink(); err != nil {
		http.Error(w, fmt.Sprintf("failed to stop WeChat gateway: %v", err), http.StatusInternalServerError)
		return
	}
	_ = json.NewEncoder(w).Encode(map[string]any{"serverStarted": false})
}

func wechatStatusHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	wechatEngineMu.Lock()
	started := wechatEngineStarted
	ready := wechatEngineReady
	engineInstance := wechatEngine
	wechatEngineMu.Unlock()

	paired := isWechatEnginePaired(r.Context(), engineInstance)
	_ = json.NewEncoder(w).Encode(map[string]any{"serverStarted": started, "ready": ready, "paired": paired})
}

func wechatMigrationStateHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	wechatEngineMu.Lock()
	started := wechatEngineStarted
	engineInstance := wechatEngine
	wechatEngineMu.Unlock()
	if !started || engineInstance == nil {
		http.Error(w, "WeChat gateway not started", http.StatusServiceUnavailable)
		return
	}

	ctx := r.Context()
	accounts, err := engineInstance.ListAccounts(ctx)
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to list WeChat accounts: %v", err), http.StatusInternalServerError)
		return
	}

	accountsOnly := strings.EqualFold(strings.TrimSpace(r.URL.Query().Get("accounts_only")), "true") || strings.TrimSpace(r.URL.Query().Get("accounts_only")) == "1"
	if accountsOnly {
		migrationAccounts := make([]map[string]any, 0, len(accounts))
		for _, account := range accounts {
			migrationAccounts = append(migrationAccounts, map[string]any{
				"account_id":      account.AccountID,
				"base_url":        account.BaseURL,
				"token":           account.Token,
				"ilink_user_id":   account.ILinkUserID,
				"enabled":         account.Enabled,
				"login_status":    account.LoginStatus,
				"last_error":      account.LastError,
				"get_updates_buf": account.GetUpdatesBuf,
				"last_poll_at":    account.LastPollAt,
				"last_inbound_at": account.LastInboundAt,
				"created_at":      account.CreatedAt,
				"updated_at":      account.UpdatedAt,
			})
		}
		_ = json.NewEncoder(w).Encode(map[string]any{"accounts": migrationAccounts})
		return
	}

	loginSessions, err := engineInstance.ListLoginSessions(ctx, 500)
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to list WeChat login sessions: %v", err), http.StatusInternalServerError)
		return
	}

	peerContexts, err := engineInstance.ListPeerContexts(ctx, 500)
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to list WeChat peer contexts: %v", err), http.StatusInternalServerError)
		return
	}

	events := make([]wcfLinkEngine.Event, 0)
	var eventAfterID int64
	for {
		batch, err := engineInstance.ListEvents(ctx, eventAfterID, 500)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to list WeChat events: %v", err), http.StatusInternalServerError)
			return
		}
		if len(batch) == 0 {
			break
		}
		events = append(events, batch...)
		eventAfterID = batch[len(batch)-1].ID
		if len(batch) < 500 {
			break
		}
	}

	logs := make([]wcfLinkEngine.LogEntry, 0)
	var logAfterID int64
	for {
		batch, err := engineInstance.ListLogs(ctx, logAfterID, 500)
		if err != nil {
			http.Error(w, fmt.Sprintf("failed to list WeChat logs: %v", err), http.StatusInternalServerError)
			return
		}
		if len(batch) == 0 {
			break
		}
		logs = append(logs, batch...)
		logAfterID = batch[len(batch)-1].ID
		if len(batch) < 500 {
			break
		}
	}

	migrationAccounts := make([]map[string]any, 0, len(accounts))
	for _, account := range accounts {
		migrationAccounts = append(migrationAccounts, map[string]any{
			"account_id":      account.AccountID,
			"base_url":        account.BaseURL,
			"token":           account.Token,
			"ilink_user_id":   account.ILinkUserID,
			"enabled":         account.Enabled,
			"login_status":    account.LoginStatus,
			"last_error":      account.LastError,
			"get_updates_buf": account.GetUpdatesBuf,
			"last_poll_at":    account.LastPollAt,
			"last_inbound_at": account.LastInboundAt,
			"created_at":      account.CreatedAt,
			"updated_at":      account.UpdatedAt,
		})
	}

	_ = json.NewEncoder(w).Encode(map[string]any{
		"accounts":       migrationAccounts,
		"login_sessions": loginSessions,
		"peer_contexts":  peerContexts,
		"events":         events,
		"logs":           logs,
	})
}

func isWechatEnginePaired(ctx context.Context, engineInstance *wcfLinkEngine.Engine) bool {
	if engineInstance == nil {
		return false
	}

	accounts, err := engineInstance.ListAccounts(ctx)
	if err != nil {
		//log.Printf("isWechatEnginePaired: failed to list accounts: %v", err)
		return false
	}
	//log.Printf("isWechatEnginePaired: found %d stored account(s)", len(accounts))

	for _, account := range accounts {
		//log.Printf("isWechatEnginePaired: account=%s enabled=%t login_status=%q", account.AccountID, account.Enabled, account.LoginStatus)
		loginStatus := strings.ToLower(strings.TrimSpace(account.LoginStatus))
		if account.Enabled && (loginStatus == "connected" || loginStatus == "confirmed") {
			//log.Printf("isWechatEnginePaired: account %s is connected", account.AccountID)
			return true
		}
	}

	//log.Printf("isWechatEnginePaired: no connected stored account found; QR/connect flow required")
	return false
}

func wechatEventsSSEHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	wechatEngineMu.Lock()
	started := wechatEngineStarted
	engineInstance := wechatEngine
	wechatEngineMu.Unlock()
	if !started || engineInstance == nil {
		http.Error(w, "WeChat gateway not started", http.StatusServiceUnavailable)
		return
	}

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	afterID, _ := strconv.ParseInt(strings.TrimSpace(r.URL.Query().Get("after_id")), 10, 64)
	if afterID < 0 {
		afterID = 0
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "retry: 2000\n\n")
	flusher.Flush()

	keepAliveTicker := time.NewTicker(15 * time.Second)
	defer keepAliveTicker.Stop()

	for {
		select {
		case <-r.Context().Done():
			return
		case <-keepAliveTicker.C:
			fmt.Fprintf(w, ": keepalive\n\n")
			flusher.Flush()
		default:
		}

		events, err := engineInstance.ListEvents(r.Context(), afterID, 100)
		if err != nil {
			//log.Printf("wechatEventsSSEHandler: failed to list events: %v", err)
			return
		}
		if len(events) > 0 {
			for _, event := range events {
				encoded, err := json.Marshal(event)
				if err != nil {
					continue
				}
				fmt.Fprintf(w, "event: wechatIncoming\n")
				fmt.Fprintf(w, "data: %s\n\n", encoded)
			}
			afterID = events[len(events)-1].ID
			flusher.Flush()
		}
		select {
		case <-r.Context().Done():
			return
		case <-time.After(500 * time.Millisecond):
		}
	}
}

func wechatProxyHandler(w http.ResponseWriter, r *http.Request) {
	if !strings.HasPrefix(r.URL.Path, "/api/wechat/") {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}
	wechatEngineMu.Lock()
	started := wechatEngineStarted
	wechatEngineMu.Unlock()
	if !started {
		http.Error(w, "WeChat gateway not started", http.StatusServiceUnavailable)
		return
	}
	proxy := getWechatReverseProxy()
	proxy.ServeHTTP(w, r)
}

func tryStartBundledGateway(execDir string, freshPairStartup bool) error {
	_ = execDir // preserved for compatibility with existing callsites
	gatewayMu.Lock()
	defer gatewayMu.Unlock()

	if gatewayCmd != nil {
		// already started or starting
		if gatewayCmd.ProcessState == nil || !gatewayCmd.ProcessState.Exited() {
			whatsappServerStarted = true
			return nil
		}
		// process exited, clear so we can restart
		gatewayCmd = nil
	}

	// Attempt in-process embedded gowa (default and only supported mode)
	err := startEmbeddedGowa(freshPairStartup)
	if err == nil {
		log.Printf("tryStartBundledGateway: embedded gowa started successfully")
		return nil
	}

	log.Printf("tryStartBundledGateway: embedded gowa startup failed and external fallback disabled")
	return fmt.Errorf("embedded gowa startup failed: %w", err)
}

// spawnGateway used to launch an external gowa process, but current behavior is always embedded gowa.
// The wrapper is removed to avoid dead code while preserving the former path in history.

// stopBundledGateway attempts to gracefully stop the spawned gateway process.
// It will send an Interrupt and wait briefly for the process to exit, then
// escalate to Kill if it does not terminate.
func stopBundledGateway() {
	gatewayMu.Lock()
	cmd := gatewayCmd
	gatewayMu.Unlock()

	if cmd == nil || cmd.Process == nil {
		return
	}

	pid := cmd.Process.Pid
	log.Printf("stopBundledGateway: sending interrupt to pid=%d", pid)

	// Try graceful shutdown
	if err := cmd.Process.Signal(os.Interrupt); err != nil {
		log.Printf("stopBundledGateway: interrupt failed: %v", err)
	}

	// Wait up to 3s for the supervised goroutine to observe exit and clear gatewayCmd
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		time.Sleep(200 * time.Millisecond)
		gatewayMu.Lock()
		running := gatewayCmd != nil
		gatewayMu.Unlock()
		if !running {
			log.Printf("stopBundledGateway: gateway exited after interrupt")
			return
		}
	}

	// Force kill if still running
	log.Printf("stopBundledGateway: gateway did not exit; killing pid=%d", pid)
	if err := cmd.Process.Kill(); err != nil {
		log.Printf("stopBundledGateway: kill failed: %v", err)
	} else {
		log.Printf("stopBundledGateway: killed pid=%d", pid)
	}
}

// Add after the proxyBingSearch function

// GET returns the raw contents of dev/app/core/js/utils/settings/thinkingmodels.js
// POST accepts JSON { "content": "...js file contents..." } and safely writes the file
func thinkingModelsGetHandler(w http.ResponseWriter, r *http.Request) {
	// Restrict to GET only
	if r.Method != "GET" && r.Method != "OPTIONS" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if r.Method == "OPTIONS" {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.WriteHeader(http.StatusOK)
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	path := filepath.Join("app", "core", "js", "utils", "settings", "thinkingmodels.js")
	// Determine executable directory to build absolute path
	execDir := filepath.Dir(os.Args[0])
	fullPath := filepath.Join(execDir, path)

	data, err := os.ReadFile(fullPath)
	if err != nil {
		log.Printf("Error reading thinkingmodels.js: %v", err)
		http.Error(w, "Failed to read file", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}

func thinkingModelsPostHandler(w http.ResponseWriter, r *http.Request) {
	// Accept POST with JSON body
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Basic CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")

	type reqBody struct {
		Content string `json:"content"`
	}

	var body reqBody
	dec := json.NewDecoder(io.LimitReader(r.Body, 5*1024*1024))
	if err := dec.Decode(&body); err != nil {
		log.Printf("Invalid request body for thinkingmodels POST: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Minimal validation: ensure content contains 'window.THINKING_MODELS' assignment
	if !strings.Contains(body.Content, "window.THINKING_MODELS") {
		http.Error(w, "Content validation failed", http.StatusBadRequest)
		return
	}

	// Build paths
	relPath := filepath.Join("app", "core", "js", "utils", "settings", "thinkingmodels.js")
	execDir := filepath.Dir(os.Args[0])
	fullPath := filepath.Join(execDir, relPath)

	// Make a backup of the existing file
	backupPath := fullPath + ".bak"
	if _, err := os.Stat(fullPath); err == nil {
		// Copy file to backup (overwrite existing backup)
		input, err := os.ReadFile(fullPath)
		if err == nil {
			_ = os.WriteFile(backupPath, input, 0644)
		}
	}

	// Write new content atomically: write to temp file then rename
	dir := filepath.Dir(fullPath)
	tmpFile, err := os.CreateTemp(dir, "thinkingmodels-*.js")
	if err != nil {
		log.Printf("Failed to create temp file for thinkingmodels write: %v", err)
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	tmpPath := tmpFile.Name()
	if _, err := tmpFile.WriteString(body.Content); err != nil {
		log.Printf("Failed to write temp thinkingmodels file: %v", err)
		tmpFile.Close()
		os.Remove(tmpPath)
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	tmpFile.Close()

	// Rename temp file into place
	if err := os.Rename(tmpPath, fullPath); err != nil {
		log.Printf("Failed to replace thinkingmodels.js: %v", err)
		os.Remove(tmpPath)
		auditAdminEvent(r, "update-thinkingmodels", "failure", err.Error())
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}

	auditAdminEvent(r, "update-thinkingmodels", "success", fullPath)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, `{"ok":true}`)
}

// GET/POST handlers for visualmodels.js
func visualModelsGetHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" && r.Method != "OPTIONS" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if r.Method == "OPTIONS" {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.WriteHeader(http.StatusOK)
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	rel := filepath.Join("app", "core", "js", "utils", "settings", "visualmodels.js")
	execDir := filepath.Dir(os.Args[0])
	fullPath := filepath.Join(execDir, rel)

	data, err := os.ReadFile(fullPath)
	if err != nil {
		log.Printf("Error reading visualmodels.js: %v", err)
		http.Error(w, "Failed to read file", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}

func visualModelsPostHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")

	type reqBody struct {
		Content string `json:"content"`
	}
	var body reqBody
	dec := json.NewDecoder(io.LimitReader(r.Body, 5*1024*1024))
	if err := dec.Decode(&body); err != nil {
		log.Printf("Invalid request body for visualmodels POST: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Basic validation: ensure content mentions 'window.' to reduce accidental deletion
	if !strings.Contains(body.Content, "window.") {
		http.Error(w, "Content validation failed", http.StatusBadRequest)
		return
	}

	rel := filepath.Join("app", "core", "js", "utils", "settings", "visualmodels.js")
	execDir := filepath.Dir(os.Args[0])
	fullPath := filepath.Join(execDir, rel)

	// Backup
	backupPath := fullPath + ".bak"
	if _, err := os.Stat(fullPath); err == nil {
		input, err := os.ReadFile(fullPath)
		if err == nil {
			_ = os.WriteFile(backupPath, input, 0644)
		}
	}

	// Atomic write
	dir := filepath.Dir(fullPath)
	tmpFile, err := os.CreateTemp(dir, "visualmodels-*.js")
	if err != nil {
		log.Printf("Failed to create temp file for visualmodels write: %v", err)
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	tmpPath := tmpFile.Name()
	if _, err := tmpFile.WriteString(body.Content); err != nil {
		log.Printf("Failed to write temp visualmodels file: %v", err)
		tmpFile.Close()
		os.Remove(tmpPath)
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	tmpFile.Close()

	if err := os.Rename(tmpPath, fullPath); err != nil {
		log.Printf("Failed to replace visualmodels.js: %v", err)
		os.Remove(tmpPath)
		auditAdminEvent(r, "update-visualmodels", "failure", err.Error())
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}

	auditAdminEvent(r, "update-visualmodels", "success", fullPath)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, `{"ok":true}`)
}

// GET/POST handlers for modelparameters.js
func modelParametersGetHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" && r.Method != "OPTIONS" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if r.Method == "OPTIONS" {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.WriteHeader(http.StatusOK)
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	rel := filepath.Join("app", "core", "js", "utils", "settings", "modelparameters.js")
	execDir := filepath.Dir(os.Args[0])
	fullPath := filepath.Join(execDir, rel)

	data, err := os.ReadFile(fullPath)
	if err != nil {
		log.Printf("Error reading modelparameters.js: %v", err)
		http.Error(w, "Failed to read file", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}

func modelParametersPostHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")

	type reqBody struct {
		Content string `json:"content"`
	}
	var body reqBody
	dec := json.NewDecoder(io.LimitReader(r.Body, 5*1024*1024))
	if err := dec.Decode(&body); err != nil {
		log.Printf("Invalid request body for modelparameters POST: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if !strings.Contains(body.Content, "MODEL_PARAMETERS") {
		http.Error(w, "Content validation failed", http.StatusBadRequest)
		return
	}

	rel := filepath.Join("app", "core", "js", "utils", "settings", "modelparameters.js")
	execDir := filepath.Dir(os.Args[0])
	fullPath := filepath.Join(execDir, rel)

	backupPath := fullPath + ".bak"
	if _, err := os.Stat(fullPath); err == nil {
		input, err := os.ReadFile(fullPath)
		if err == nil {
			_ = os.WriteFile(backupPath, input, 0644)
		}
	}

	dir := filepath.Dir(fullPath)
	tmpFile, err := os.CreateTemp(dir, "modelparameters-*.js")
	if err != nil {
		log.Printf("Failed to create temp file for modelparameters write: %v", err)
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	tmpPath := tmpFile.Name()
	if _, err := tmpFile.WriteString(body.Content); err != nil {
		log.Printf("Failed to write temp modelparameters file: %v", err)
		tmpFile.Close()
		os.Remove(tmpPath)
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	tmpFile.Close()

	if err := os.Rename(tmpPath, fullPath); err != nil {
		log.Printf("Failed to replace modelparameters.js: %v", err)
		os.Remove(tmpPath)
		auditAdminEvent(r, "update-modelparameters", "failure", err.Error())
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}

	auditAdminEvent(r, "update-modelparameters", "success", fullPath)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, `{"ok":true}`)
}

func fetchAndExtractContent(w http.ResponseWriter, r *http.Request) {
	// Get URL parameter
	targetURL := r.URL.Query().Get("url")
	if targetURL == "" {
		http.Error(w, "Missing url parameter", http.StatusBadRequest)
		return
	}

	validatedTargetURL, err := validateOutboundURL(targetURL)
	if err != nil {
		log.Printf("Content extraction rejected URL %q: %v", targetURL, err)
		http.Error(w, "Invalid or disallowed URL", http.StatusBadRequest)
		return
	}

	targetURLString := validatedTargetURL.String()

	log.Printf("Content extraction request for URL: %s", targetURLString)

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: 10 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if _, err := validateOutboundURL(req.URL.String()); err != nil {
				return fmt.Errorf("redirect blocked: %w", err)
			}

			// Allow redirects but limit to 5
			if len(via) >= 5 {
				return errors.New("too many redirects")
			}
			return nil
		},
	}

	// Build request with browser-like headers
	req, err := http.NewRequest("GET", targetURLString, nil)
	if err != nil {
		log.Printf("Error creating request: %v", err)
		http.Error(w, "Failed to create request", http.StatusInternalServerError)
		return
	}

	// Add browser-like headers
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")

	// Fetch the page
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error fetching URL: %v", err)
		http.Error(w, fmt.Sprintf("Failed to fetch URL: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// Check content type
	contentType := resp.Header.Get("Content-Type")
	if !strings.Contains(contentType, "text/html") && !strings.Contains(contentType, "application/xhtml+xml") {
		log.Printf("Unsupported content type: %s", contentType)
		http.Error(w, "URL does not point to HTML content", http.StatusBadRequest)
		return
	}

	// Read body with size limit (5MB)
	limitedReader := io.LimitReader(resp.Body, 5*1024*1024)
	body, err := io.ReadAll(limitedReader)
	if err != nil {
		log.Printf("Error reading response body: %v", err)
		http.Error(w, "Failed to read page content", http.StatusInternalServerError)
		return
	}

	// Simple content extraction - in reality, you'd want to use a more robust algorithm
	extractedContent, contentType := extractMainContent(body, targetURLString)

	// Return the extracted content as JSON
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Format the response
	response := map[string]interface{}{
		"url":         targetURLString,
		"content":     extractedContent,
		"contentType": contentType,
		"extractedAt": time.Now().Format(time.RFC3339),
	}

	// Encode as JSON
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error encoding JSON response: %v", err)
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

type websiteStyleAnalysisResponse struct {
	URL             string   `json:"url"`
	Fonts           []string `json:"fonts"`
	Colors          []string `json:"colors"`
	RawFontFamilies []string `json:"rawFontFamilies,omitempty"`
	RawColors       []string `json:"rawColors,omitempty"`
	ExtractedAt     string   `json:"extractedAt"`
}

func fetchWebsiteStyleAnalysis(w http.ResponseWriter, r *http.Request) {
	targetURL := r.URL.Query().Get("url")
	if targetURL == "" {
		http.Error(w, "Missing url parameter", http.StatusBadRequest)
		return
	}

	validatedTargetURL, err := validateOutboundURL(targetURL)
	if err != nil {
		log.Printf("Website style extraction rejected URL %q: %v", targetURL, err)
		http.Error(w, "Invalid or disallowed URL", http.StatusBadRequest)
		return
	}

	client := newStyleCloneHTTPClient(10 * time.Second)
	body, finalURL, err := fetchStyleCloneHTMLDocument(client, validatedTargetURL.String())
	if err != nil {
		log.Printf("Website style extraction failed for %q: %v", validatedTargetURL.String(), err)
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}

	analysis, err := extractWebsiteStyleAnalysis(client, body, finalURL)
	if err != nil {
		log.Printf("Website style extraction parse failed for %q: %v", finalURL.String(), err)
		http.Error(w, "Failed to extract website style", http.StatusInternalServerError)
		return
	}

	analysis.URL = finalURL.String()
	analysis.ExtractedAt = time.Now().Format(time.RFC3339)

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	if err := json.NewEncoder(w).Encode(analysis); err != nil {
		log.Printf("Website style extraction encode failed: %v", err)
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}

func newStyleCloneHTTPClient(timeout time.Duration) *http.Client {
	return &http.Client{
		Timeout: timeout,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if _, err := validateOutboundURL(req.URL.String()); err != nil {
				return fmt.Errorf("redirect blocked: %w", err)
			}
			if len(via) >= 5 {
				return errors.New("too many redirects")
			}
			return nil
		},
	}
}

func newStyleCloneRequest(targetURL string) (*http.Request, error) {
	req, err := http.NewRequest(http.MethodGet, targetURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,text/css,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	return req, nil
}

func fetchStyleCloneHTMLDocument(client *http.Client, targetURL string) ([]byte, *url.URL, error) {
	req, err := newStyleCloneRequest(targetURL)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to fetch URL: %w", err)
	}
	defer resp.Body.Close()

	contentType := resp.Header.Get("Content-Type")
	if !strings.Contains(contentType, "text/html") && !strings.Contains(contentType, "application/xhtml+xml") {
		return nil, nil, fmt.Errorf("URL does not point to HTML content")
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 5*1024*1024))
	if err != nil {
		return nil, nil, fmt.Errorf("failed to read page content: %w", err)
	}

	if resp.Request == nil || resp.Request.URL == nil {
		parsedURL, parseErr := url.Parse(targetURL)
		if parseErr != nil {
			return body, nil, parseErr
		}
		return body, parsedURL, nil
	}

	return body, resp.Request.URL, nil
}

func fetchStyleCloneTextResource(client *http.Client, targetURL string) (string, error) {
	validatedTargetURL, err := validateOutboundURL(targetURL)
	if err != nil {
		return "", err
	}

	req, err := newStyleCloneRequest(validatedTargetURL.String())
	if err != nil {
		return "", err
	}

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 2*1024*1024))
	if err != nil {
		return "", err
	}

	return string(body), nil
}

func extractWebsiteStyleAnalysis(client *http.Client, body []byte, baseURL *url.URL) (websiteStyleAnalysisResponse, error) {
	analysis := websiteStyleAnalysisResponse{}
	doc, err := goquery.NewDocumentFromReader(bytes.NewReader(body))
	if err != nil {
		return analysis, err
	}

	fontScores := map[string]int{}
	colorScores := map[string]int{}
	rawFontFamilies := map[string]struct{}{}
	rawColors := map[string]struct{}{}
	cssSources := make([]string, 0, 16)
	stylesheetSeen := map[string]struct{}{}
	metaThemeColors := make([]string, 0, 2)

	doc.Find("style").Each(func(_ int, selection *goquery.Selection) {
		cssText := strings.TrimSpace(selection.Text())
		if cssText != "" {
			cssSources = append(cssSources, cssText)
		}
	})

	doc.Find("[style]").Each(func(_ int, selection *goquery.Selection) {
		if inlineStyle, ok := selection.Attr("style"); ok {
			inlineStyle = strings.TrimSpace(inlineStyle)
			if inlineStyle != "" {
				cssSources = append(cssSources, inlineStyle)
			}
		}
	})

	doc.Find("meta[name='theme-color'][content], meta[name='msapplication-TileColor'][content]").Each(func(_ int, selection *goquery.Selection) {
		if content, ok := selection.Attr("content"); ok {
			metaThemeColors = append(metaThemeColors, content)
		}
	})

	stylesheetCount := 0
	doc.Find("link[rel][href]").Each(func(_ int, selection *goquery.Selection) {
		if stylesheetCount >= 6 {
			return
		}

		relValue, _ := selection.Attr("rel")
		if !strings.Contains(strings.ToLower(relValue), "stylesheet") {
			return
		}

		href, ok := selection.Attr("href")
		if !ok || strings.TrimSpace(href) == "" {
			return
		}

		resolvedURL, err := baseURL.Parse(strings.TrimSpace(href))
		if err != nil || resolvedURL == nil {
			return
		}

		if _, exists := stylesheetSeen[resolvedURL.String()]; exists {
			return
		}
		stylesheetSeen[resolvedURL.String()] = struct{}{}

		cssText, err := fetchStyleCloneTextResource(client, resolvedURL.String())
		if err != nil || strings.TrimSpace(cssText) == "" {
			if err != nil {
				log.Printf("[WebsiteStyleClone] stylesheet-fetch-failed url=%q err=%v", resolvedURL.String(), err)
			}
			return
		}

		stylesheetCount += 1
		cssSources = append(cssSources, cssText)
	})

	for _, cssText := range cssSources {
		collectStyleCloneHintsFromCSS(cssText, fontScores, colorScores, rawFontFamilies, rawColors)
	}

	for _, metaColor := range metaThemeColors {
		collectColorsFromValue(metaColor, colorScores, rawColors, 4)
	}

	analysis.Fonts = topRankedMapKeys(fontScores, 4)
	analysis.Colors = topRankedMapKeys(colorScores, 6)
	analysis.RawFontFamilies = sortedStringSet(rawFontFamilies)
	analysis.RawColors = sortedStringSet(rawColors)
	return analysis, nil
}

func collectStyleCloneHintsFromCSS(cssText string, fontScores, colorScores map[string]int, rawFontFamilies, rawColors map[string]struct{}) {
	if strings.TrimSpace(cssText) == "" {
		return
	}

	googleFontURLRegex := regexp.MustCompile(`https?://fonts\.googleapis\.com/css[^'"\s)]+`)
	for _, match := range googleFontURLRegex.FindAllString(cssText, -1) {
		for _, family := range extractFontNamesFromGoogleFontsURL(match) {
			rawFontFamilies[family] = struct{}{}
			fontScores[family] += 5
		}
	}

	fontFamilyRegex := regexp.MustCompile(`(?i)font-family\s*:\s*([^;}{]+)`)
	for _, match := range fontFamilyRegex.FindAllStringSubmatch(cssText, -1) {
		if len(match) < 2 {
			continue
		}
		families := parseFontFamilyList(match[1])
		for index, family := range families {
			rawFontFamilies[family] = struct{}{}
			if isGenericFontFamily(family) {
				continue
			}
			weight := 1
			if index == 0 {
				weight = 3
			}
			fontScores[family] += weight
		}
	}

	collectColorsFromValue(cssText, colorScores, rawColors, 1)
}

func collectColorsFromValue(value string, colorScores map[string]int, rawColors map[string]struct{}, weight int) {
	hexColorRegex := regexp.MustCompile(`(?i)#[0-9a-f]{3,8}\b`)
	for _, match := range hexColorRegex.FindAllString(value, -1) {
		rawColors[match] = struct{}{}
		if normalized, ok := normalizeStyleCloneColor(match); ok {
			colorScores[normalized] += weight
		}
	}

	rgbColorRegex := regexp.MustCompile(`(?i)rgba?\(([^\)]+)\)`)
	for _, match := range rgbColorRegex.FindAllString(value, -1) {
		rawColors[match] = struct{}{}
		if normalized, ok := normalizeStyleCloneColor(match); ok {
			colorScores[normalized] += weight
		}
	}
}

func parseFontFamilyList(value string) []string {
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	seen := map[string]struct{}{}
	for _, part := range parts {
		family := strings.TrimSpace(part)
		family = strings.Trim(family, `"'`)
		if family == "" {
			continue
		}
		normalizedKey := strings.ToLower(family)
		if _, exists := seen[normalizedKey]; exists {
			continue
		}
		seen[normalizedKey] = struct{}{}
		result = append(result, family)
	}
	return result
}

func isGenericFontFamily(value string) bool {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "serif", "sans-serif", "monospace", "system-ui", "cursive", "fantasy", "emoji", "math", "fangsong", "inherit", "initial", "unset", "ui-sans-serif", "ui-serif", "ui-monospace":
		return true
	default:
		return false
	}
}

func extractFontNamesFromGoogleFontsURL(rawURL string) []string {
	parsed, err := url.Parse(rawURL)
	if err != nil {
		return nil
	}
	values := parsed.Query()["family"]
	result := make([]string, 0, len(values))
	seen := map[string]struct{}{}
	for _, familyValue := range values {
		baseName := strings.Split(familyValue, ":")[0]
		baseName = strings.ReplaceAll(baseName, "+", " ")
		baseName = strings.TrimSpace(baseName)
		if baseName == "" {
			continue
		}
		key := strings.ToLower(baseName)
		if _, exists := seen[key]; exists {
			continue
		}
		seen[key] = struct{}{}
		result = append(result, baseName)
	}
	return result
}

func normalizeStyleCloneColor(value string) (string, bool) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return "", false
	}

	if strings.HasPrefix(trimmed, "#") {
		hexValue := strings.TrimPrefix(trimmed, "#")
		switch len(hexValue) {
		case 3:
			return strings.ToUpper(fmt.Sprintf("#%c%c%c%c%c%c", hexValue[0], hexValue[0], hexValue[1], hexValue[1], hexValue[2], hexValue[2])), true
		case 4:
			if strings.EqualFold(hexValue[3:], "f") {
				return strings.ToUpper(fmt.Sprintf("#%c%c%c%c%c%c", hexValue[0], hexValue[0], hexValue[1], hexValue[1], hexValue[2], hexValue[2])), true
			}
			return "", false
		case 6:
			return "#" + strings.ToUpper(hexValue), true
		case 8:
			if strings.EqualFold(hexValue[6:], "FF") {
				return "#" + strings.ToUpper(hexValue[:6]), true
			}
			return "", false
		default:
			return "", false
		}
	}

	rgbMatch := regexp.MustCompile(`(?i)^rgba?\(([^\)]+)\)$`).FindStringSubmatch(trimmed)
	if len(rgbMatch) != 2 {
		return "", false
	}

	components := strings.Split(rgbMatch[1], ",")
	if len(components) < 3 {
		return "", false
	}

	r, errR := strconv.Atoi(strings.TrimSpace(components[0]))
	g, errG := strconv.Atoi(strings.TrimSpace(components[1]))
	b, errB := strconv.Atoi(strings.TrimSpace(components[2]))
	if errR != nil || errG != nil || errB != nil {
		return "", false
	}

	if len(components) >= 4 {
		alphaValue := strings.TrimSpace(components[3])
		alpha, err := strconv.ParseFloat(alphaValue, 64)
		if err != nil || alpha < 0.99 {
			return "", false
		}
	}

	if r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255 {
		return "", false
	}

	return fmt.Sprintf("#%02X%02X%02X", r, g, b), true
}

func topRankedMapKeys(scores map[string]int, limit int) []string {
	if len(scores) == 0 || limit <= 0 {
		return nil
	}

	keys := make([]string, 0, len(scores))
	for key := range scores {
		keys = append(keys, key)
	}

	sort.Slice(keys, func(i, j int) bool {
		leftScore := scores[keys[i]]
		rightScore := scores[keys[j]]
		if leftScore == rightScore {
			return strings.ToLower(keys[i]) < strings.ToLower(keys[j])
		}
		return leftScore > rightScore
	})

	if len(keys) > limit {
		keys = keys[:limit]
	}
	return keys
}

func sortedStringSet(values map[string]struct{}) []string {
	if len(values) == 0 {
		return nil
	}

	result := make([]string, 0, len(values))
	for value := range values {
		result = append(result, value)
	}
	slices.SortFunc(result, func(left, right string) int {
		return strings.Compare(strings.ToLower(left), strings.ToLower(right))
	})
	return result
}

// Content extraction helper function
func extractMainContent(body []byte, url string) (string, string) {
	// Convert body to string
	htmlContent := string(body)

	// Check for specific content patterns based on URL
	if strings.Contains(url, "weather") || strings.Contains(url, "forecast") {
		return extractWeatherContent(htmlContent, url), "weather"
	}

	// Default extraction for general content
	return extractGeneralContent(htmlContent), "general"
}

func extractWeatherContent(htmlContent, url string) string {
	// This would be specialized for weather sites
	var extracted strings.Builder

	// Use the URL to determine which extraction strategy to use
	siteSpecific := false

	// Check for specific weather domains to apply custom extraction
	if strings.Contains(url, "weather.com") {
		// Weather.com specific patterns
		tempPattern := regexp.MustCompile(`<span[^>]*class="CurrentConditions[^"]*">([^<]+)</span>`)
		tempMatches := tempPattern.FindAllStringSubmatch(htmlContent, 2)
		if len(tempMatches) > 0 && len(tempMatches[0]) > 1 {
			extracted.WriteString("🌡️ Current conditions: " + tempMatches[0][1] + "\n\n")
			siteSpecific = true
		}
	} else if strings.Contains(url, "accuweather") {
		// AccuWeather specific patterns
		tempPattern := regexp.MustCompile(`<div[^>]*class="temperature">([^<]+)</div>`)
		tempMatches := tempPattern.FindAllStringSubmatch(htmlContent, 1)
		if len(tempMatches) > 0 && len(tempMatches[0]) > 1 {
			extracted.WriteString("🌡️ Temperature: " + tempMatches[0][1] + "\n\n")
			siteSpecific = true
		}
	}

	// If no site-specific extraction worked, fall back to generic patterns
	if !siteSpecific {
		// Look for temperature patterns
		tempPattern := regexp.MustCompile(`(\d+)°(C|F)`)
		tempMatches := tempPattern.FindAllString(htmlContent, 10)

		if len(tempMatches) > 0 {
			extracted.WriteString("🌡️ Temperature: " + strings.Join(tempMatches[:1], ", ") + "\n\n")
		}
	}

	// General forecast data extraction (for all weather sites)
	forecastPattern := regexp.MustCompile(`(?i)forecast|precipitation|chance of rain|humidity|wind|feels like`)

	// Split HTML by paragraphs and look for relevant sections
	paragraphs := strings.Split(htmlContent, "</p>")
	for _, p := range paragraphs {
		if forecastPattern.MatchString(p) {
			// Clean up HTML tags
			cleaned := regexp.MustCompile(`<[^>]*>`).ReplaceAllString(p, " ")
			cleaned = strings.TrimSpace(cleaned)
			cleaned = regexp.MustCompile(`\s+`).ReplaceAllString(cleaned, " ")

			if len(cleaned) > 10 && len(cleaned) < 300 {
				extracted.WriteString(cleaned + "\n\n")
			}
		}
	}

	result := extracted.String()
	if len(result) < 50 {
		// Fall back to general content extraction if we didn't get enough weather-specific info
		return extractGeneralContent(htmlContent)
	}

	return result
}

func extractGeneralContent(htmlContent string) string {
	// Remove scripts, styles, and comments first
	noScripts := regexp.MustCompile(`(?s)<script.*?</script>`).ReplaceAllString(htmlContent, " ")
	noStyles := regexp.MustCompile(`(?s)<style.*?</style>`).ReplaceAllString(noScripts, " ")
	noComments := regexp.MustCompile(`(?s)<!--.*?-->`).ReplaceAllString(noStyles, " ")

	// Extract content from paragraphs
	paragraphPattern := regexp.MustCompile(`<p[^>]*>(.*?)</p>`)
	matches := paragraphPattern.FindAllStringSubmatch(noComments, -1)

	var content strings.Builder
	for _, match := range matches {
		if len(match) > 1 {
			// Clean up HTML tags and whitespace
			cleaned := regexp.MustCompile(`<[^>]*>`).ReplaceAllString(match[1], " ")
			cleaned = strings.TrimSpace(cleaned)
			cleaned = regexp.MustCompile(`\s+`).ReplaceAllString(cleaned, " ")

			// Only include paragraphs with substantial content
			if len(cleaned) > 40 {
				content.WriteString(cleaned + "\n\n")
			}
		}
	}

	// Limit the result length
	result := content.String()
	if len(result) > 2000 {
		return result[:2000] + "..."
	}

	return result
}
func proxyPdfContent(w http.ResponseWriter, r *http.Request) {
	// Get URL parameter
	pdfUrl := r.URL.Query().Get("url")
	if pdfUrl == "" {
		http.Error(w, "Missing url parameter", http.StatusBadRequest)
		return
	}

	validatedPDFURL, err := validateOutboundURL(pdfUrl)
	if err != nil {
		log.Printf("PDF Proxy: Rejected URL %q: %v", pdfUrl, err)
		http.Error(w, "Invalid or disallowed PDF URL", http.StatusBadRequest)
		return
	}

	pdfURLString := validatedPDFURL.String()

	log.Printf("PDF Proxy: Attempting to fetch PDF from: %s", pdfURLString)

	// Create HTTP client with timeout and redirect handling
	client := &http.Client{
		Timeout: 30 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if _, err := validateOutboundURL(req.URL.String()); err != nil {
				return fmt.Errorf("redirect blocked: %w", err)
			}

			// Copy headers on redirect
			for key, values := range via[0].Header {
				for _, value := range values {
					req.Header.Add(key, value)
				}
			}
			// Allow up to 10 redirects (academic sites often have many redirects)
			if len(via) >= 10 {
				return errors.New("too many redirects")
			}
			return nil
		},
	}

	// Build request with advanced browser-like headers
	req, err := http.NewRequest("GET", pdfURLString, nil)
	if err != nil {
		log.Printf("PDF Proxy: Error creating request: %v", err)
		http.Error(w, "Failed to create PDF request", http.StatusInternalServerError)
		return
	}

	// Add more sophisticated headers to better mimic a browser
	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,application/pdf,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	req.Header.Set("Accept-Encoding", "gzip, deflate, br")
	req.Header.Set("Connection", "keep-alive")
	req.Header.Set("Upgrade-Insecure-Requests", "1")
	req.Header.Set("Sec-Fetch-Dest", "document")
	req.Header.Set("Sec-Fetch-Mode", "navigate")
	req.Header.Set("Sec-Fetch-Site", "cross-site")
	req.Header.Set("Sec-Fetch-User", "?1")
	req.Header.Set("DNT", "1")
	req.Header.Set("Referer", "https://scholar.google.com/")

	// Fetch the PDF
	log.Printf("PDF Proxy: Sending request to %s", pdfURLString)
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("PDF Proxy: Error fetching PDF: %v", err)
		http.Error(w, fmt.Sprintf("Failed to fetch PDF: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// Log response status and content type
	log.Printf("PDF Proxy: Response status: %d, Content-Type: %s",
		resp.StatusCode, resp.Header.Get("Content-Type"))

	// Check response status
	if resp.StatusCode != http.StatusOK {
		log.Printf("PDF Proxy: Target server returned status %d for %s", resp.StatusCode, pdfURLString)
		http.Error(w, fmt.Sprintf("PDF source returned status %d", resp.StatusCode), resp.StatusCode)
		return
	}

	// Read response with size limit (20MB for PDFs)
	limitedReader := io.LimitReader(resp.Body, 20*1024*1024)
	pdfData, err := io.ReadAll(limitedReader)
	if err != nil {
		log.Printf("PDF Proxy: Error reading PDF data: %v", err)
		http.Error(w, "Failed to read PDF content", http.StatusInternalServerError)
		return
	}

	log.Printf("PDF Proxy: Successfully retrieved %d bytes", len(pdfData))

	// Set response headers
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "inline; filename=document.pdf")
	w.Header().Set("Content-Length", fmt.Sprintf("%d", len(pdfData)))
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Cache-Control", "public, max-age=86400") // Cache PDFs for a day

	// Write PDF data to response
	w.Write(pdfData)
}
func openBrowser(url string) {
	var err error

	switch runtime.GOOS {
	case "linux":
		err = exec.Command("xdg-open", url).Start()
	case "windows":
		err = exec.Command("cmd", "/c", "start", url).Start()
	case "darwin":
		err = exec.Command("open", url).Start()
	}

	if err != nil {
		log.Printf("Error opening browser: %v", err)
	}
}

// Image search handler for SlideForge image inclusion
func proxyImageSearch(w http.ResponseWriter, r *http.Request) {
	// Set CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")

	// Handle preflight requests
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Only allow GET requests
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get query parameter
	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "Missing query parameter 'q'", http.StatusBadRequest)
		return
	}

	log.Printf("[%s] Image search request for: %s", time.Now().Format(time.RFC3339), query)

	// Try Pixabay first (more reliable for demo)
	imageURL, err := searchPixabayImage(query)
	if err != nil {
		log.Printf("Pixabay search failed: %v", err)
		// Try Pexels as backup
		imageURL, err = searchPexelsImage(query)
		if err != nil {
			log.Printf("Pexels search also failed: %v", err)
			// Return error response
			response := map[string]interface{}{
				"success": false,
				"error":   "No images found from available sources",
				"query":   query,
			}
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(response)
			return
		}
	}

	// Return successful response
	response := map[string]interface{}{
		"success":  true,
		"imageUrl": imageURL,
		"query":    query,
	}
	json.NewEncoder(w).Encode(response)
}

// proxyFetchImage fetches an external image server-side and returns it with CORS headers.
// Query param: url=ENCODED_URL
func proxyFetchImage(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	raw := strings.TrimSpace(r.URL.Query().Get("url"))
	if raw == "" {
		http.Error(w, "Missing url parameter", http.StatusBadRequest)
		return
	}

	parsed, err := validateOutboundURL(raw)
	if err != nil {
		log.Printf("proxyFetchImage: rejected url %q: %v", raw, err)
		http.Error(w, "Invalid or disallowed url", http.StatusBadRequest)
		return
	}

	client := &http.Client{Timeout: 20 * time.Second}
	req, err := http.NewRequest("GET", parsed.String(), nil)
	if err != nil {
		http.Error(w, "Failed to create request", http.StatusInternalServerError)
		return
	}
	// set a common browser-like user-agent
	req.Header.Set("User-Agent", "Paiperwork-ImageProxy/1.0")
	req.Header.Set("Accept", "image/*,*/*;q=0.8")

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("proxyFetchImage: fetch error for %s: %v", parsed.String(), err)
		http.Error(w, "Failed to fetch image", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	// Propagate status codes (e.g., 429) but include CORS headers so client sees message
	w.Header().Set("Access-Control-Allow-Origin", "*")
	if resp.StatusCode != http.StatusOK {
		w.WriteHeader(resp.StatusCode)
		io.Copy(io.Discard, resp.Body)
		return
	}

	// Limit image size to 8MB
	const maxBytes = 8 * 1024 * 1024
	limited := io.LimitReader(resp.Body, maxBytes+1)
	data, err := io.ReadAll(limited)
	if err != nil {
		log.Printf("proxyFetchImage: read error for %s: %v", parsed.String(), err)
		http.Error(w, "Failed to read image", http.StatusBadGateway)
		return
	}
	if int64(len(data)) > maxBytes {
		log.Printf("proxyFetchImage: image too large %s size=%d", parsed.String(), len(data))
		http.Error(w, "Image too large", http.StatusRequestEntityTooLarge)
		return
	}

	contentType := resp.Header.Get("Content-Type")
	if contentType == "" {
		contentType = http.DetectContentType(data)
	}

	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Cache-Control", "public, max-age=86400")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(http.StatusOK)
	if _, err := w.Write(data); err != nil {
		log.Printf("proxyFetchImage: write response error: %v", err)
	}
}

// Search for images using Pexels API (primary source)
func searchPexelsImage(query string) (string, error) {
	// Pexels API endpoint
	apiURL := fmt.Sprintf("https://api.pexels.com/v1/search?query=%s&per_page=1&orientation=landscape",
		url.QueryEscape(query))

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return "", err
	}

	// Add Pexels API key (you would need to set this as an environment variable or config)
	// For now, we'll use the public demo endpoint approach
	req.Header.Set("Authorization", "563492ad6f91700001000001f68e3c65de984e8199c0a6bc3f0a04a7")

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("pexels API returned status: %d", resp.StatusCode)
	}

	var result struct {
		Photos []struct {
			Src struct {
				Medium string `json:"medium"`
			} `json:"src"`
		} `json:"photos"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	if len(result.Photos) == 0 {
		return "", errors.New("no images found")
	}

	return result.Photos[0].Src.Medium, nil
}

// Search for images using Pixabay API (backup source)
func searchPixabayImage(query string) (string, error) {
	// Pixabay API endpoint
	apiURL := fmt.Sprintf("https://pixabay.com/api/?key=9656065-a4094594c34f9ac14c7fc4c39&q=%s&image_type=photo&per_page=3&min_width=640&orientation=horizontal",
		url.QueryEscape(query))

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Get(apiURL)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("pixabay API returned status: %d", resp.StatusCode)
	}

	var result struct {
		Hits []struct {
			WebformatURL string `json:"webformatURL"`
		} `json:"hits"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	if len(result.Hits) == 0 {
		return "", errors.New("no images found")
	}

	return result.Hits[0].WebformatURL, nil
}

// Multi-image search handler for SlideForge sidebar UI
func proxyImageSearchMulti(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "Missing query parameter 'q'", http.StatusBadRequest)
		return
	}
	log.Printf("[%s] Multi-image search request for: %s", time.Now().Format(time.RFC3339), query)

	var images []string
	// Try Pixabay first (up to 5 results)
	pixabayImages, err := searchPixabayImagesMulti(query, 12)
	if err == nil && len(pixabayImages) > 0 {
		images = append(images, pixabayImages...)
	}
	// Try Pexels (up to 5 results)
	pexelsImages, err := searchPexelsImagesMulti(query, 12)
	if err == nil && len(pexelsImages) > 0 {
		images = append(images, pexelsImages...)
	}
	if len(images) == 0 {
		response := map[string]interface{}{
			"success": false,
			"images":  []string{},
			"error":   "No images found from available sources",
			"query":   query,
		}
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(response)
		return
	}
	response := map[string]interface{}{
		"success": true,
		"images":  images,
		"query":   query,
	}
	json.NewEncoder(w).Encode(response)
}

// Multi-image search for Pixabay (returns up to n images)
func searchPixabayImagesMulti(query string, n int) ([]string, error) {
	apiURL := fmt.Sprintf("https://pixabay.com/api/?key=9656065-a4094594c34f9ac14c7fc4c39&q=%s&image_type=photo&per_page=%d&min_width=640&orientation=horizontal", url.QueryEscape(query), n)
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(apiURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("pixabay API returned status: %d", resp.StatusCode)
	}
	var result struct {
		Hits []struct {
			WebformatURL string `json:"webformatURL"`
		} `json:"hits"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	if len(result.Hits) == 0 {
		return nil, errors.New("no images found")
	}
	var urls []string
	for i, hit := range result.Hits {
		if i >= n {
			break
		}
		urls = append(urls, hit.WebformatURL)
	}
	return urls, nil
}

// Multi-image search for Pexels (returns up to n images)
func searchPexelsImagesMulti(query string, n int) ([]string, error) {
	apiURL := fmt.Sprintf("https://api.pexels.com/v1/search?query=%s&per_page=%d&orientation=landscape", url.QueryEscape(query), n)
	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "563492ad6f91700001000001f68e3c65de984e8199c0a6bc3f0a04a7")
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("pexels API returned status: %d", resp.StatusCode)
	}
	var result struct {
		Photos []struct {
			Src struct {
				Medium string `json:"medium"`
			} `json:"src"`
		} `json:"photos"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	if len(result.Photos) == 0 {
		return nil, errors.New("no images found")
	}
	var urls []string
	for i, photo := range result.Photos {
		if i >= n {
			break
		}
		urls = append(urls, photo.Src.Medium)
	}
	return urls, nil
}

func serverInfoHandler(w http.ResponseWriter, r *http.Request) {
	port := "8182"
	if len(os.Args) > 1 {
		port = os.Args[1]
	}

	host := strings.TrimSpace(os.Getenv("PAIPERWORK_BIND_HOST"))
	if host == "" {
		host = "localhost"
	}

	securityMode := "localhost-only"
	networkURL := interface{}(nil)
	if host != "localhost" && host != "127.0.0.1" {
		securityMode = "network-enabled"
		networkURL = "http://" + host + ":" + port
	}

	info := map[string]interface{}{
		"serverIP":   host,
		"serverPort": port,
		"networkURL": networkURL,
		"localURL":   "http://localhost:" + port,
		"timestamp":  time.Now().Format(time.RFC3339),
		"security":   securityMode,
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(info)
}
func main() {
	// Get port from command line argument or use default
	port := "8182"
	if len(os.Args) > 1 {
		port = os.Args[1]
	}

	bindHost := strings.TrimSpace(os.Getenv("PAIPERWORK_BIND_HOST"))
	if bindHost == "" {
		bindHost = "localhost"
	}

	launchBrowser := strings.TrimSpace(strings.ToLower(os.Getenv("PAIPERWORK_OPEN_BROWSER")))
	if launchBrowser == "" {
		launchBrowser = "true"
	}

	whatsappWebhookSecret = strings.TrimSpace(os.Getenv("PAIPERWORK_WHATSAPP_WEBHOOK_SECRET"))
	if whatsappWebhookSecret == "" {
		whatsappWebhookSecret = "secret"
	}

	whatsappWebhookURL = strings.TrimSpace(os.Getenv("PAIPERWORK_WHATSAPP_WEBHOOK"))
	if whatsappWebhookURL == "" {
		// default to local server incoming endpoint
		whatsappWebhookURL = fmt.Sprintf("http://127.0.0.1:%s/api/whatsapp/incoming", port)
	}

	// Setup file server
	execDir := filepath.Dir(os.Args[0])
	log.Printf("Executable directory: %s", execDir)

	// Load or create admin key (first-run). This prefers the environment
	// variable PAIPERWORK_ADMIN_KEY, then a local config.env next to the
	// executable. If none exists, generate a strong random key, write it to
	// config.env with restricted permissions, and display it once to stdout.
	adminAPIKey = loadOrCreateAdminKey(execDir)
	allowedOrigin = strings.TrimSpace(os.Getenv("PAIPERWORK_ALLOWED_ORIGIN"))

	appDir := filepath.Join(execDir, "app")
	log.Printf("Serving files from: %s", appDir)

	// Create HTTP multiplexer
	mux := http.NewServeMux()

	// File server for static content
	fs := http.FileServer(http.Dir(appDir))
	mux.Handle("/", noCacheHandler(fs))

	// API endpoints
	mux.HandleFunc("/api/library/", proxyOllamaLibrary)
	mux.HandleFunc("/api/library", proxyOllamaLibrary)
	mux.HandleFunc("/api/cloud/tags", proxyOllamaCloudTags)
	mux.HandleFunc("/api/cloud/generate", proxyOllamaCloudAPIPath("generate"))
	mux.HandleFunc("/api/cloud/show", proxyOllamaCloudAPIPath("show"))
	mux.HandleFunc("/api/cloud/pull", proxyOllamaCloudAPIPath("pull"))
	mux.HandleFunc("/api/cloud/embed", proxyOllamaCloudAPIPath("embed"))
	mux.HandleFunc("/api/cloud/embeddings", proxyOllamaCloudAPIPath("embeddings"))
	mux.HandleFunc("/api/extract/content", fetchAndExtractContent)
	mux.HandleFunc("/api/extract/style", fetchWebsiteStyleAnalysis)
	mux.HandleFunc("/api/search/bing", proxyBingSearch)
	mux.HandleFunc("/api/extract/raw-html", fetchRawHtmlForLinks)
	mux.HandleFunc("/api/proxy/pdf", proxyPdfContent)
	mux.HandleFunc("/api/proxy/image-search", proxyImageSearch)
	mux.HandleFunc("/api/proxy/fetch-image", proxyFetchImage)
	mux.HandleFunc("/api/version-check", proxyVersionCheck)
	mux.HandleFunc("/api/server-info", serverInfoHandler)
	mux.HandleFunc("/api/proxy/image-search-multi", proxyImageSearchMulti) // New endpoint
	// WhatsApp gateway proxy endpoints (local Baileys gateway)
	mux.HandleFunc("/api/whatsapp/qr", whatsappQrProxyHandler)
	mux.HandleFunc("/api/whatsapp/devices", whatsappDevicesHandler)
	mux.HandleFunc("/api/whatsapp/qr-image", whatsappQrImageHandler)
	mux.HandleFunc("/api/whatsapp/send", whatsappSendProxyHandler)
	mux.HandleFunc("/api/whatsapp/send-link", whatsappSendLinkProxyHandler)
	mux.HandleFunc("/api/whatsapp/mode", whatsappModeHandler)
	mux.HandleFunc("/api/whatsapp/presence", whatsappPresenceProxyHandler)
	mux.HandleFunc("/api/whatsapp/send-file", whatsappSendFileProxyHandler)
	mux.HandleFunc("/api/whatsapp/send-image", whatsappSendImageProxyHandler)
	mux.HandleFunc("/api/whatsapp/incoming", whatsappIncomingWebhookHandler)
	mux.HandleFunc("/api/whatsapp/webhook-check", whatsappWebhookDebugHandler)
	mux.HandleFunc("/api/whatsapp/gateway-info", whatsappGatewayInfoHandler)
	mux.HandleFunc("/api/whatsapp/incoming/poll", whatsappIncomingPollHandler)
	mux.HandleFunc("/api/whatsapp/db-sync", whatsappDbSyncHandler)
	mux.HandleFunc("/api/whatsapp/session/export", whatsappSessionExportHandler)
	mux.HandleFunc("/api/whatsapp/session/import", whatsappSessionImportHandler)
	mux.HandleFunc("/api/whatsapp/session/reconnect", whatsappSessionReconnectHandler)
	mux.HandleFunc("/api/whatsapp/session", whatsappSessionClearHandler)
	mux.HandleFunc("/api/whatsapp/pairing-data/delete-all", whatsappDeleteAllPairingDataHandler)
	mux.HandleFunc("/api/wechat/start", wechatStartHandler)
	mux.HandleFunc("/api/wechat/stop", wechatStopHandler)
	mux.HandleFunc("/api/wechat/status", wechatStatusHandler)
	mux.HandleFunc("/api/wechat/migration/legacy-state", wechatMigrationStateHandler)
	mux.HandleFunc("/api/wechat/send-file", wechatSendFileProxyHandler)
	mux.HandleFunc("/api/wechat/send-image", wechatSendImageProxyHandler)
	mux.HandleFunc("/api/wechat/events/stream", wechatEventsSSEHandler)
	mux.HandleFunc("/api/wechat/", wechatProxyHandler)
	// Note: admin key retrieval endpoint removed to minimize exposure. Local
	// installs rely on loopback requests being treated as admin; cloud
	// deployments must supply the admin key in `X-Paiperwork-Admin-Key` (or
	// store it in sessionStorage via the admin UI when deployed).
	// Thinking models management (read/write thinkingmodels.js)
	mux.HandleFunc("/api/thinkingmodels", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" {
			thinkingModelsGetHandler(w, r)
			return
		}
		if r.Method == "OPTIONS" {
			applyRestrictedCORS(w, r)
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "POST" {
			applyRestrictedCORS(w, r)
			requireAdmin(thinkingModelsPostHandler)(w, r)
			return
		}
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	})
	// Visual models management
	mux.HandleFunc("/api/visualmodels", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" {
			visualModelsGetHandler(w, r)
			return
		}
		if r.Method == "OPTIONS" {
			applyRestrictedCORS(w, r)
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "POST" {
			applyRestrictedCORS(w, r)
			requireAdmin(visualModelsPostHandler)(w, r)
			return
		}
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	})
	// Model parameters management
	mux.HandleFunc("/api/modelparameters", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" {
			modelParametersGetHandler(w, r)
			return
		}
		if r.Method == "OPTIONS" {
			applyRestrictedCORS(w, r)
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "POST" {
			applyRestrictedCORS(w, r)
			requireAdmin(modelParametersPostHandler)(w, r)
			return
		}
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	})

	// load optional WhatsApp startup target phone (for welcome messaging)
	whatsappStartupTargetPhone = strings.TrimSpace(os.Getenv("PAIPERWORK_WHATSAPP_STARTUP_PHONE"))
	if whatsappStartupTargetPhone == "" {
		whatsappStartupTargetPhone = strings.TrimSpace(os.Getenv("WHATSAPP_STARTUP_PHONE"))
	}

	// SECURITY: Default bind host is localhost. Set PAIPERWORK_BIND_HOST=0.0.0.0 for cloud/server deployment.
	server := &http.Server{
		Addr:              fmt.Sprintf("%s:%s", bindHost, port),
		Handler:           mux,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		// Streaming generate responses can run longer than fixed write deadlines.
		// Leave WriteTimeout disabled to avoid cutting active cloud streams.
		WriteTimeout: 0,
		IdleTimeout:  120 * time.Second,
	}

	defer stopKeepAwake()

	serverAddr := fmt.Sprintf("%s:%s", bindHost, port)
	isLocalOnlyBind := bindHost == "localhost" || bindHost == "127.0.0.1"

	// Security-focused startup messages
	log.Printf("🔒 Secure Paiperwork server starting on: %s", serverAddr)
	if isLocalOnlyBind {
		log.Printf("🛡️ SECURITY: Server restricted to localhost access only")
		log.Printf("💡 This ensures your data remains encrypted and secure")
		log.Printf("🚫 Network access disabled for enterprise security")
	} else {
		log.Printf("🌐 DEPLOYMENT: Network/cloud mode enabled")
		log.Printf("🛡️ SECURITY: Server is reachable on configured network interface %s", bindHost)
	}

	// Open browser locally by default. Disable in headless/cloud via PAIPERWORK_OPEN_BROWSER=false.
	localURL := fmt.Sprintf("http://localhost:%s", port)
	if launchBrowser != "false" {
		go func() {
			// Small delay to ensure server is ready
			time.Sleep(1 * time.Second)
			openBrowser(localURL)
		}()
	}

	// Start the secure server in background so we can handle signals and
	// ensure the bundled gateway is stopped when the main process exits.
	serverErrors := make(chan error, 1)
	go func() {
		err := server.ListenAndServe()
		if err != nil && err != http.ErrServerClosed {
			serverErrors <- err
		} else {
			serverErrors <- nil
		}
	}()

	// Note: do not attempt gateway device cleanup at server startup. Cleanup
	// will be run once the bundled gateway is started (so the gateway API
	// is reachable) and immediately before login attempts. This avoids
	// logging errors when the gateway is not yet running.

	shutdownGateway := func(reason string) {
		if err := stopGateway(); err != nil {
			log.Printf("Gateway shutdown failed during %s: %v", reason, err)
		}
	}

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM, syscall.SIGHUP, syscall.SIGQUIT)
	defer signal.Stop(sigCh)

	select {
	case err := <-serverErrors:
		if err != nil && err != http.ErrServerClosed {
			log.Printf("Server error: %v", err)
			shutdownGateway("server error")
			// Do not force OS exit on local server errors; allow the process to cleanly stop
			return
		}
		log.Printf("Server closed cleanly")
		shutdownGateway("server closed cleanly")
		return
	case sig := <-sigCh:
		log.Printf("Received signal %v, shutting down...", sig)
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := server.Shutdown(ctx); err != nil {
			log.Printf("Server shutdown failed: %v; forcing close", err)
			_ = server.Close()
		}
		shutdownGateway("signal shutdown")
	}
}
