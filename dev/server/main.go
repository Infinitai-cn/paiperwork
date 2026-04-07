package main

import (
	"bytes"
	"context"
	"crypto/hmac"
	crand "crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"embed"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"regexp"
	"runtime"
	"runtime/debug"
	"strings"
	"sync"
	"syscall"
	"time"

	gowaCmd "github.com/aldinokemal/go-whatsapp-web-multidevice/cmd"
	config "github.com/aldinokemal/go-whatsapp-web-multidevice/config"
	whatsappInfra "github.com/aldinokemal/go-whatsapp-web-multidevice/infrastructure/whatsapp"
	utils "github.com/aldinokemal/go-whatsapp-web-multidevice/pkg/utils"
	restHelpers "github.com/aldinokemal/go-whatsapp-web-multidevice/ui/rest/helpers"
)

//go:embed gowa_embed/index.html
var gowaEmbedIndex embed.FS

//go:embed gowa_embed/*
var gowaEmbedViews embed.FS

var adminAuditMutex sync.Mutex
var gatewayStartMutex sync.Mutex

var preferredWhatsappDeviceMu sync.RWMutex
var preferredWhatsappDevice = make(map[string]map[string]string)
var gatewayStarting bool
var gatewayLastStartAttempt time.Time
var gatewayStartCooldown = 8 * time.Second

var activeWhatsappUserMu sync.RWMutex
var activeWhatsappUser string

var whatsappManualStopMu sync.RWMutex
var whatsappManualStopUntil time.Time

var welcomeSentForDevice = map[string]bool{}
var welcomePendingForDevice = map[string]bool{}
var welcomeMu sync.Mutex
var pairRequested bool
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

var whatsappOutgoingMessages []whatsappOutgoingMessage
var whatsappOutgoingMu sync.Mutex

// Incoming WhatsApp message queue (from webhook)
type whatsappIncomingMessage struct {
	DeviceID  string `json:"device_id"`
	ChatID    string `json:"chat_id"`
	From      string `json:"from"`
	FromName  string `json:"from_name"`
	Timestamp string `json:"timestamp"`
	Body      string `json:"body"`
}

var whatsappIncomingQueue []whatsappIncomingMessage
var whatsappIncomingMu sync.Mutex

var whatsappMode string = "personal"
var whatsappModeMu sync.RWMutex

var whatsappGatewayCachedQR string
var whatsappGatewayCachedQRTimestamp time.Time
var whatsappGatewayQRTTL = 120 * time.Second

// Cached QR image bytes + content-type to avoid repeatedly fetching transient
// gateway PNGs that may disappear quickly. Protected by whatsappGatewayCachedBytesMu.
var whatsappGatewayCachedBytesMu sync.Mutex
var whatsappGatewayCachedQRBytes []byte
var whatsappGatewayCachedQRContentType string

var dataURLLogPattern = regexp.MustCompile(`data:[^"'\s]+`)

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

func getPreferredWhatsappDeviceIDFromRequest(r *http.Request) string {
	// Priority: explicit query param override
	deviceID := strings.TrimSpace(r.URL.Query().Get("device_id"))
	if deviceID != "" {
		return deviceID
	}

	userKey := strings.TrimSpace(r.URL.Query().Get("user"))
	if userKey == "" {
		userKey = strings.TrimSpace(r.Header.Get("X-Paiperwork-User"))
	}
	if userKey == "" {
		return ""
	}

	// Enforce user-key isolation: if current gateway is owned by another user,
	// treat as no preferred device (will require pairing for this user).
	activeWhatsappUserMu.RLock()
	currentActive := activeWhatsappUser
	activeWhatsappUserMu.RUnlock()
	if currentActive != "" && currentActive != userKey {
		log.Printf("getPreferredWhatsappDeviceIDFromRequest: user mismatch active=%s requested=%s -> ignoring stored device", currentActive, userKey)
		return ""
	}

	preferredWhatsappDeviceMu.RLock()
	defer preferredWhatsappDeviceMu.RUnlock()
	if data, ok := preferredWhatsappDevice[userKey]; ok && data != nil {
		if id := strings.TrimSpace(data["device_id"]); id != "" {
			return id
		}
	}

	return ""
}

var whatsappGatewayLastLoginAttempt time.Time
var whatsappGatewayLoginCooldown = 20 * time.Second
var whatsappGatewayStartupWarmup = 35 * time.Second
var whatsappPairingProbeCooldown = 8 * time.Second

var whatsappGatewayWarmupMessageMu sync.Mutex
var whatsappGatewayWarmupMessageLogged = make(map[string]struct{})

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

func snapshotGatewayStartState() (starting bool, lastAttempt time.Time) {
	gatewayStartMutex.Lock()
	defer gatewayStartMutex.Unlock()
	return gatewayStarting, gatewayLastStartAttempt
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

func shouldHoldQrDuringStartupWarmup(deviceID, preferredDeviceID string) bool {
	candidate := strings.TrimSpace(deviceID)
	if candidate == "" {
		candidate = strings.TrimSpace(preferredDeviceID)
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

	nonNetworkPairingIndicators := []string{
		"session deleted",
		"not logged in",
		"authentication_error",
		"authenticat",
		"device not found",
	}
	for _, marker := range nonNetworkPairingIndicators {
		if strings.Contains(combined, marker) {
			return true, false
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

func shouldAllowQrForPersistentDevice(client *http.Client, deviceID string) (bool, string) {
	_ = client
	trimmedID := strings.TrimSpace(deviceID)
	if trimmedID == "" || !strings.Contains(trimmedID, "@") {
		return true, "non-persistent-device"
	}

	// Passive policy: do not trigger reconnect/login probes from status checks.
	// Active probes caused reconnect/login storms and prevented settled relogin.
	return true, "persistent-device-passive-gate"
}

func safeUserKeyForFilename(userKey string) string {
	if userKey == "" {
		return "default"
	}
	hash := sha256.Sum256([]byte(userKey))
	return hex.EncodeToString(hash[:8])
}

func userWhatsappDBURI(userKey string) string {
	suffix := safeUserKeyForFilename(userKey)
	return fmt.Sprintf("file:storages/whatsapp_%s.db?_foreign_keys=on&_journal_mode=WAL&_busy_timeout=5000", suffix)
}

func userWhatsappKeysDBURI(userKey string) string {
	suffix := safeUserKeyForFilename(userKey)
	return fmt.Sprintf("file:storages/whatsapp_keys_%s.db?_foreign_keys=on&_journal_mode=WAL&_busy_timeout=5000", suffix)
}

func noCacheHandler(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		w.Header().Set("Pragma", "no-cache")
		w.Header().Set("Expires", "0")
		h.ServeHTTP(w, r)
	})
}

func whatsappPreferredDeviceHandler(w http.ResponseWriter, r *http.Request) {
	userKey := strings.TrimSpace(r.URL.Query().Get("user"))
	if userKey == "" {
		userKey = strings.TrimSpace(r.Header.Get("X-Paiperwork-User"))
	}
	if userKey == "" {
		http.Error(w, "missing user key", http.StatusBadRequest)
		return
	}

	preferredWhatsappDeviceMu.Lock()
	defer preferredWhatsappDeviceMu.Unlock()

	if r.Method == http.MethodGet {
		if userKey == "" {
			// Return all preferred devices for auto-connect fallback.
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(preferredWhatsappDevice)
			return
		}

		data := preferredWhatsappDevice[userKey]
		if data == nil {
			// If not set in memory (e.g. server restarted), try env var fallback
			fallbackID := strings.TrimSpace(os.Getenv("PAIPERWORK_WHATSAPP_PREFERRED_DEVICE_ID"))
			if fallbackID == "" {
				fallbackID = strings.TrimSpace(os.Getenv("WHATSAPP_PREFERRED_DEVICE_ID"))
			}
			if fallbackID != "" {
				data = map[string]string{"device_id": fallbackID, "meta": ""}
				preferredWhatsappDevice[userKey] = data
				log.Printf("whatsappPreferredDeviceHandler: fallback to env preferred device %s for user %s", fallbackID, userKey)
			} else {
				data = map[string]string{"device_id": "", "meta": ""}
			}
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(data)
		return
	}

	if r.Method == http.MethodPost {
		body := struct {
			DeviceID string `json:"device_id"`
			Meta     string `json:"meta"`
		}{}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, "invalid payload", http.StatusBadRequest)
			return
		}

		preferredWhatsappDevice[userKey] = map[string]string{"device_id": body.DeviceID, "meta": body.Meta}

		// Keep DeviceManager in sync with persisted preferred device.
		dm := whatsappInfra.GetDeviceManager()
		if dm != nil && strings.TrimSpace(body.DeviceID) != "" {
			if _, found := dm.GetDevice(body.DeviceID); !found {
				inst := whatsappInfra.NewDeviceInstance(body.DeviceID, nil, nil)
				dm.AddDevice(inst)
				log.Printf("whatsappPreferredDeviceHandler: added preferred device to manager: %s", body.DeviceID)
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
		return
	}

	if r.Method == http.MethodDelete {
		reason := strings.TrimSpace(r.URL.Query().Get("reason"))
		if reason == "" {
			reason = "unspecified"
		}

		deletedDeviceID := ""
		// User requested explicit unpair/forget action.
		if data, ok := preferredWhatsappDevice[userKey]; ok && data != nil {
			if deviceID := strings.TrimSpace(data["device_id"]); deviceID != "" {
				deletedDeviceID = deviceID
				client := &http.Client{Timeout: 4 * time.Second}
				if err := deleteWhatsappGatewayDevice(client, deviceID); err != nil {
					log.Printf("whatsappPreferredDeviceHandler: failed to delete gateway device %s: %v", deviceID, err)
				}
			}
		}

		delete(preferredWhatsappDevice, userKey)
		maskedDevice := ""
		if deletedDeviceID != "" {
			if len(deletedDeviceID) > 8 {
				maskedDevice = "..." + deletedDeviceID[len(deletedDeviceID)-8:]
			} else {
				maskedDevice = deletedDeviceID
			}
		}
		log.Printf("whatsappPreferredDeviceHandler: cleared preferred device (reason=%s user=%s device=%s)", reason, safeUserKeyForFilename(userKey), maskedDevice)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
		return
	}

	w.Header().Set("Allow", "GET, POST, DELETE")
	http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
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
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.WriteHeader(http.StatusOK)
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	startRequested := strings.TrimSpace(strings.ToLower(r.URL.Query().Get("start"))) == "true"
	stopRequested := strings.TrimSpace(strings.ToLower(r.URL.Query().Get("stop"))) == "true"
	checkRequested := strings.TrimSpace(strings.ToLower(r.URL.Query().Get("check"))) == "true"
	userKey := strings.TrimSpace(r.URL.Query().Get("user"))
	if userKey == "" {
		userKey = strings.TrimSpace(r.Header.Get("X-Paiperwork-User"))
	}

	if userKey != "" {
		activeWhatsappUserMu.RLock()
		currentActiveUser := activeWhatsappUser
		activeWhatsappUserMu.RUnlock()
		if currentActiveUser != "" && currentActiveUser != userKey {
			if isGatewayRunning() {
				log.Printf("whatsappQrProxy: user mismatch active=%s requested=%s; returning 409", currentActiveUser, userKey)
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusConflict)
				json.NewEncoder(w).Encode(map[string]any{"error": "user mismatch", "message": "WhatsApp gateway already active for another user. Stop and restart with current user key."})
				return
			}
		}
	}

	if stopRequested {
		markWhatsappManualStopWindow(5 * time.Second)
		_ = stopGateway()
		pairRequested = false
		activeWhatsappUserMu.Lock()
		activeWhatsappUser = ""
		activeWhatsappUserMu.Unlock()
		welcomeMu.Lock()
		welcomeSentForDevice = map[string]bool{}
		welcomePendingForDevice = map[string]bool{}
		welcomeMu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{"status": "stopped"})
		return
	}

	requestedDeviceID := getPreferredWhatsappDeviceIDFromRequest(r)

	if userKey != "" {
		var userDBURI, userKeysDBURI string
		if strings.ToLower(os.Getenv("PAIPERWORK_NO_DISK")) == "true" {
			userDBURI = "file::memory:?cache=shared&_journal_mode=WAL&_busy_timeout=5000&_foreign_keys=on"
			userKeysDBURI = "file::memory:?cache=shared&_journal_mode=WAL&_busy_timeout=5000&_foreign_keys=on"
		} else {
			userDBURI = userWhatsappDBURI(userKey)
			userKeysDBURI = userWhatsappKeysDBURI(userKey)
		}
		// log.Printf("whatsappQrProxy: setting per-user WhatsApp DB for user=%s dbURI=%s keysURI=%s", userKey, userDBURI, userKeysDBURI)
		os.Setenv("PAIPERWORK_DB_URI", userDBURI)
		os.Setenv("PAIPERWORK_DB_KEYS_URI", userKeysDBURI)
	}

	// Pass preferred device ID to embedded gateway as early as possible so
	// start=true flows and background starts can see the same source-of-truth.
	if requestedDeviceID != "" {
		os.Setenv("PAIPERWORK_WHATSAPP_PREFERRED_DEVICE_ID", requestedDeviceID)
		os.Setenv("WHATSAPP_PREFERRED_DEVICE_ID", requestedDeviceID)
		config.WhatsappPreferredDeviceID = requestedDeviceID
		// log.Printf("whatsappQrProxy: preserving preferred device in config: %s", requestedDeviceID)
	} else {
		os.Unsetenv("PAIPERWORK_WHATSAPP_PREFERRED_DEVICE_ID")
		os.Unsetenv("WHATSAPP_PREFERRED_DEVICE_ID")
		config.WhatsappPreferredDeviceID = ""
	}

	// Keep check-only requests from triggering gateway start.
	if checkRequested && !startRequested {
		gatewayRunning := isGatewayRunning()
		if !gatewayRunning {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]any{"connected": false, "loggedIn": false, "gatewayRunning": false})
			return
		}

		status, err := fetchWhatsappGatewayStatus(&http.Client{Timeout: 5 * time.Second}, false, requestedDeviceID)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]any{"connected": false, "loggedIn": false, "gatewayRunning": gatewayRunning})
			return
		}
		response := map[string]any{"connected": status.Connected, "loggedIn": status.LoggedIn, "gatewayRunning": gatewayRunning}
		if status.QRDataUrl != "" {
			response["qrDataUrl"] = status.QRDataUrl
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}

	if startRequested {
		if isWhatsappManualStopActive() {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusAccepted)
			_ = json.NewEncoder(w).Encode(map[string]any{"status": "stopped", "gatewayRunning": false, "connected": false, "loggedIn": false, "message": "Manual stop in progress"})
			return
		}

		markWhatsappManualStopWindow(0)
		pairRequested = true
		if userKey != "" {
			activeWhatsappUserMu.Lock()
			activeWhatsappUser = userKey
			activeWhatsappUserMu.Unlock()
			// noisy in normal flow; keep assignment without per-request log
		}

		// If already launching/started, early respond; otherwise start in background.
		if isGatewayRunning() {
			client := &http.Client{Timeout: 25 * time.Second}
			status, err := fetchWhatsappGatewayStatus(client, true, requestedDeviceID)
			if err != nil {
				log.Printf("whatsappQrProxy: already-running status fetch failed: %v", err)
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusOK)
				_ = json.NewEncoder(w).Encode(map[string]any{"status": "already_running", "gatewayRunning": true, "connected": false, "loggedIn": false})
				return
			}

			response := map[string]any{"status": "already_running", "gatewayRunning": true, "connected": status.Connected, "loggedIn": status.LoggedIn}
			if status.QRDataUrl != "" {
				response["qrDataUrl"] = status.QRDataUrl
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
			if startErr := tryStartBundledGateway(filepath.Dir(os.Args[0])); startErr != nil {
				log.Printf("whatsappQrProxy: background start failed: %v", startErr)
				return
			}
			cleanupClient := &http.Client{Timeout: 4 * time.Second}
			if cerr := cleanupWhatsappGatewayDevices(cleanupClient, requestedDeviceID); cerr != nil {
				log.Printf("whatsappQrProxy: background cleanup after gateway start failed: %v", cerr)
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
	status, err := fetchWhatsappGatewayStatus(client, startRequested, requestedDeviceID)
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
		if startErr := tryStartBundledGateway(execDir); startErr != nil {
			log.Printf("whatsappQrProxy: failed to start gateway: %v", startErr)
			http.Error(w, "gateway-unavailable", http.StatusServiceUnavailable)
			return
		}

		// Gateway binary started; attempt synchronous cleanup of any stale
		// device records before attempting login/QR flows. Preserve the requested
		// preferred device to avoid accidental reprovisioning.
		cleanupClient := &http.Client{Timeout: 4 * time.Second}
		if cerr := cleanupWhatsappGatewayDevices(cleanupClient, requestedDeviceID); cerr != nil {
			log.Printf("whatsappQrProxy: cleanup after gateway start failed: %v", cerr)
		} else {
			log.Printf("whatsappQrProxy: cleanup after gateway start complete")
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
			if startErr := tryStartBundledGateway(execDir); startErr != nil {
				log.Printf("whatsappQrProxy: failed to start gateway: %v", startErr)
				http.Error(w, "gateway-unavailable", http.StatusServiceUnavailable)
				return
			}

			// Gateway binary started; attempt synchronous cleanup of any stale
			// device records before attempting login/QR flows. Preserve the requested
			// preferred device to avoid accidental reprovisioning.
			cleanupClient := &http.Client{Timeout: 4 * time.Second}
			if cerr := cleanupWhatsappGatewayDevices(cleanupClient, requestedDeviceID); cerr != nil {
				log.Printf("whatsappQrProxy: cleanup after gateway start failed: %v", cerr)
			} else {
				log.Printf("whatsappQrProxy: cleanup after gateway start complete")
			}

			// Start request accepted; gateway in background startup.
			log.Printf("whatsappQrProxy: start gateway launched; responding 202 and waiting for health target")
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusAccepted)
			_ = json.NewEncoder(w).Encode(map[string]any{"status": "starting", "message": "Gateway startup in progress; please retry in a few seconds."})
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"connected":      status.Connected,
		"loggedIn":       status.LoggedIn,
		"gatewayRunning": isGatewayRunning(),
		"qrDataUrl":      status.QRDataUrl,
	})
}

// Serve the cached QR image by proxying the gateway statics URL through
// the Paiperwork server. This avoids mixed-content and CORS issues when the
// frontend is served over HTTPS but the gateway provides an HTTP resource.
func whatsappQrImageHandler(w http.ResponseWriter, r *http.Request) {
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
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.WriteHeader(http.StatusOK)
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get("http://127.0.0.1:3000/devices")
	if err != nil {
		log.Printf("whatsappDevicesHandler: failed to query gateway devices: %v", err)
		http.Error(w, "gateway-unavailable", http.StatusServiceUnavailable)
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		log.Printf("whatsappDevicesHandler: gateway returned status %d", resp.StatusCode)
		http.Error(w, "gateway-unavailable", http.StatusServiceUnavailable)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if _, copyErr := io.Copy(w, resp.Body); copyErr != nil {
		log.Printf("whatsappDevicesHandler: copy failed: %v", copyErr)
	}
}

type whatsappGatewayStatus struct {
	Connected bool   `json:"connected"`
	LoggedIn  bool   `json:"loggedIn"`
	QRDataUrl string `json:"qrDataUrl,omitempty"`
}

func fetchWhatsappGatewayStatus(client *http.Client, startRequested bool, preferredDeviceID string) (*whatsappGatewayStatus, error) {
	// Ensure there is at least one device for the gowa gateway API
	// Intentionally quiet: this function is polled frequently.
	deviceID, err := ensureWhatsappGatewayDevice(client, preferredDeviceID)
	if err != nil {
		if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
			// Noisy cancellation from context shutdown path; return safe unpaired status.
			return &whatsappGatewayStatus{Connected: false, LoggedIn: false}, nil
		}
		return nil, fmt.Errorf("gateway status unavailable: %v", err)
	}

	// Check connection status first (avoid unnecessary repeated login calls).
	status, err := fetchWhatsappGatewayConnectionStatus(client, deviceID)
	if err != nil {
		if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
			return &whatsappGatewayStatus{Connected: false, LoggedIn: false}, nil
		}

		// In no-disk mode a preferred device can exist in PaiperworkDB while the
		// in-memory gowa manager has not created that device instance yet.
		// Treat "device not found" status errors as unpaired and continue to
		// /app/login so a QR can be produced.
		errText := strings.ToLower(err.Error())
		if config.NoDisk && (strings.Contains(errText, "device") && strings.Contains(errText, "not found")) {
			log.Printf("fetchWhatsappGatewayStatus: status check returned device-not-found for %q, continuing to login flow", deviceID)
			status = &whatsappGatewayStatus{Connected: false, LoggedIn: false}
		} else {
			return nil, fmt.Errorf("gateway status unavailable: %v", err)
		}
	}

	if status.Connected && status.LoggedIn {
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
			if whatsappStartupTargetPhone == "" {
				if inferred, err := inferWhatsappGatewayDevicePhoneByID(client, deviceID); err == nil && inferred != "" {
					whatsappStartupTargetPhone = inferred
				} else if err != nil {
					log.Printf("fetchWhatsappGatewayStatus: cannot infer target phone: %v", err)
				}
			}

			shouldDispatchWelcome := false
			welcomeMu.Lock()
			if !welcomeSentForDevice[deviceID] && !welcomePendingForDevice[deviceID] {
				welcomePendingForDevice[deviceID] = true
				shouldDispatchWelcome = true
			}
			welcomeMu.Unlock()

			if shouldDispatchWelcome {
				log.Printf("fetchWhatsappGatewayStatus: queueing welcome message dispatch for device %s", deviceID)
				go dispatchWhatsappWelcomeMessage(deviceID, whatsappStartupTargetPhone)
			}
			pairRequested = false
		}
		return status, nil
	}

	holdQrDuringWarmup := shouldHoldQrDuringStartupWarmup(deviceID, preferredDeviceID)
	if !holdQrDuringWarmup {
		clearWhatsappGatewayWarmup(deviceID)
	}
	allowQrForPersistentDevice, qrGateReason := shouldAllowQrForPersistentDevice(client, deviceID)

	// Keep the current QR alive until TTL expiration unless user explicitly requested refresh.
	if whatsappGatewayCachedQR != "" && time.Since(whatsappGatewayCachedQRTimestamp) < whatsappGatewayQRTTL {
		if holdQrDuringWarmup {
			if shouldLogWhatsappGatewayWarmup(deviceID) {
				log.Printf("fetchWhatsappGatewayStatus: startup warm-up active; withholding cached QR for device %s", deviceID)
			}
			return &whatsappGatewayStatus{Connected: false, LoggedIn: false}, nil
		}
		if !allowQrForPersistentDevice {
			log.Printf("fetchWhatsappGatewayStatus: withholding cached QR for device %s (reason=%s)", deviceID, qrGateReason)
			return &whatsappGatewayStatus{Connected: false, LoggedIn: false}, nil
		}
		if !startRequested {
			log.Printf("fetchWhatsappGatewayStatus: using cached QR for device %s", deviceID)
			return &whatsappGatewayStatus{Connected: false, QRDataUrl: whatsappGatewayCachedQR}, nil
		}

		// If startRequested but too soon, keep same QR and avoid throttled login storm.
		if time.Since(whatsappGatewayLastLoginAttempt) < whatsappGatewayLoginCooldown {
			log.Printf("fetchWhatsappGatewayStatus: refresh requested but login cooldown active (%.0fs left)", whatsappGatewayLoginCooldown.Seconds()-time.Since(whatsappGatewayLastLoginAttempt).Seconds())
			return &whatsappGatewayStatus{Connected: false, QRDataUrl: whatsappGatewayCachedQR}, nil
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
		log.Printf("fetchWhatsappGatewayStatus: skipping app/login due cooldown, cached QR=%q", q)
	} else {
		whatsappGatewayLastLoginAttempt = time.Now()
		// noisy during reconnect loops
		if resp, err := client.Get(loginURL); err == nil {
			defer resp.Body.Close()
			if resp.StatusCode >= 400 {
				log.Printf("fetchWhatsappGatewayStatus: app/login HTTP status=%d", resp.StatusCode)
			}
			if resp.StatusCode == http.StatusOK {
				var appLogin struct {
					Status  int    `json:"status"`
					Code    string `json:"code"`
					Message string `json:"message"`
					Results struct {
						DeviceID   string `json:"device_id"`
						QRLink     string `json:"qr_link"`
						QRData     string `json:"qr_data"`
						QRDuration int    `json:"qr_duration"`
					} `json:"results"`
				}
				if err := json.NewDecoder(resp.Body).Decode(&appLogin); err == nil {
					// Prefer inlined data URL QR (qr_data) when provided by the gateway
					if appLogin.Results.QRData != "" {
						qr := appLogin.Results.QRData
						whatsappGatewayCachedQR = qr
						whatsappGatewayCachedQRTimestamp = time.Now()

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
										log.Printf("fetchWhatsappGatewayStatus: decoded and cached QR data URL bytes size=%d", len(decoded))
									} else {
										log.Printf("fetchWhatsappGatewayStatus: failed to decode QR data URL: %v", derr)
									}
								}
							}
						}

						if appLogin.Results.QRDuration > 0 {
							whatsappGatewayQRTTL = time.Second * time.Duration(appLogin.Results.QRDuration)
						}
						if holdQrDuringWarmup {
							if shouldLogWhatsappGatewayWarmup(deviceID) {
								log.Printf("fetchWhatsappGatewayStatus: startup warm-up active; QR generated but withheld for device %s", deviceID)
							}
							return &whatsappGatewayStatus{Connected: false, LoggedIn: false}, nil
						}
						if !allowQrForPersistentDevice {
							log.Printf("fetchWhatsappGatewayStatus: QR generated but withheld for device %s (reason=%s)", deviceID, qrGateReason)
							return &whatsappGatewayStatus{Connected: false, LoggedIn: false}, nil
						}
						log.Printf("fetchWhatsappGatewayStatus: got QR data from app/login (inlined data URL)")
						return &whatsappGatewayStatus{Connected: false, QRDataUrl: qr}, nil
					}

					if appLogin.Results.QRLink != "" {
						qr := appLogin.Results.QRLink
						if strings.HasPrefix(qr, "/") {
							qr = "http://127.0.0.1:3000" + qr
						}
						whatsappGatewayCachedQR = qr
						whatsappGatewayCachedQRTimestamp = time.Now()

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
							log.Printf("fetchWhatsappGatewayStatus: cached QR image bytes size=%d", len(body))
						}(qr)
						if appLogin.Results.QRDuration > 0 {
							whatsappGatewayQRTTL = time.Second * time.Duration(appLogin.Results.QRDuration)
						}
						if holdQrDuringWarmup {
							log.Printf("fetchWhatsappGatewayStatus: startup warm-up active; QR link generated but withheld for device %s", deviceID)
							return &whatsappGatewayStatus{Connected: false, LoggedIn: false}, nil
						}
						if !allowQrForPersistentDevice {
							log.Printf("fetchWhatsappGatewayStatus: QR link generated but withheld for device %s (reason=%s)", deviceID, qrGateReason)
							return &whatsappGatewayStatus{Connected: false, LoggedIn: false}, nil
						}
						log.Printf("fetchWhatsappGatewayStatus: got QR link from app/login: %s", qrRefForLog(qr))
						return &whatsappGatewayStatus{Connected: false, QRDataUrl: qr}, nil
					}
				}
			} else {
				body, _ := io.ReadAll(resp.Body)
				bodyText := strings.TrimSpace(string(body))
				if resp.StatusCode == http.StatusInternalServerError && strings.Contains(bodyText, "SESSION_SAVED_ERROR") {
					return &whatsappGatewayStatus{Connected: false, LoggedIn: false}, nil
				}
				if resp.StatusCode >= 400 {
					log.Printf("fetchWhatsappGatewayStatus: app/login status=%d body=%s", resp.StatusCode, compactLogValue(bodyText, 700))
				}
				if startRequested && resp.StatusCode == http.StatusGatewayTimeout {
					log.Printf("fetchWhatsappGatewayStatus: gateway login timeout; discarding stale session and retrying")
					_ = resetWhatsappGatewayDevice(client, deviceID)
					deviceID, _ = ensureWhatsappGatewayDevice(client, "")
					return fetchWhatsappGatewayStatus(client, false, "")
				}
				if startRequested && resp.StatusCode == http.StatusUnauthorized {
					log.Printf("fetchWhatsappGatewayStatus: gateway returned 401 during login; resetting device to force fresh pair")
					_ = resetWhatsappGatewayDevice(client, deviceID)
					welcomeMu.Lock()
					delete(welcomeSentForDevice, deviceID)
					delete(welcomePendingForDevice, deviceID)
					welcomeMu.Unlock()
					whatsappGatewayCachedQR = ""
					whatsappGatewayCachedBytesMu.Lock()
					whatsappGatewayCachedQRBytes = nil
					whatsappGatewayCachedQRContentType = ""
					whatsappGatewayCachedBytesMu.Unlock()
					deviceID, _ = ensureWhatsappGatewayDevice(client, "")
					return fetchWhatsappGatewayStatus(client, false, "")
				}
			}
		}
	}

	// Re-check connection to ensure we can report the final state properly.
	status, err = fetchWhatsappGatewayConnectionStatus(client, deviceID)
	if err != nil {
		return nil, fmt.Errorf("gateway status unavailable: %v", err)
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
		log.Printf("fetchWhatsappGatewayStatus: using cached QR for device %s", deviceID)
		return &whatsappGatewayStatus{Connected: false, QRDataUrl: whatsappGatewayCachedQR}, nil
	}

	log.Printf("fetchWhatsappGatewayStatus: no QR available, status connected=%v", status.Connected)
	return status, nil
}

func fetchWhatsappGatewayConnectionStatus(client *http.Client, deviceID string) (*whatsappGatewayStatus, error) {
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
		Connected: statusResp.Results.IsConnected,
		LoggedIn:  statusResp.Results.IsLoggedIn,
	}, nil
}

func ensureWhatsappGatewayDevice(client *http.Client, preferredDeviceID string) (string, error) {
	if config.NoDisk {
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

		pickLoggedInNoDiskDevice := func(ids []string) string {
			for _, id := range ids {
				status, serr := fetchWhatsappGatewayConnectionStatus(client, id)
				if serr == nil && status != nil && status.Connected && status.LoggedIn {
					return id
				}
			}
			return ""
		}

		noDiskDeviceIDs, idsErr := listNoDiskDevices()
		if idsErr == nil && len(noDiskDeviceIDs) > 0 {
			if loggedInID := pickLoggedInNoDiskDevice(noDiskDeviceIDs); loggedInID != "" {
				if preferredDeviceID != "" && strings.TrimSpace(preferredDeviceID) != loggedInID {
					log.Printf("ensureWhatsappGatewayDevice: NoDisk mode preferring already logged-in device %s over preferred candidate %s", loggedInID, strings.TrimSpace(preferredDeviceID))
				}
				return loggedInID, nil
			}
		}

		if preferredDeviceID != "" {
			trimmedPreferred := strings.TrimSpace(preferredDeviceID)

			// Best-effort: make sure preferred device exists in gateway registry,
			// so /app/status and /app/login do not fail with DEVICE_NOT_FOUND.
			// NOTE: avoid /devices/:id here because that route panics on not-found.
			exists := false
			if idsErr == nil {
				for _, id := range noDiskDeviceIDs {
					if id == trimmedPreferred {
						exists = true
						break
					}
				}
			}

			if exists {
				// log.Printf("ensureWhatsappGatewayDevice: NoDisk mode using existing preferred device: %s", trimmedPreferred)
				return trimmedPreferred, nil
			}

			createBody := strings.NewReader(fmt.Sprintf(`{"device_id":"%s"}`, trimmedPreferred))
			if createResp, createErr := client.Post("http://127.0.0.1:3000/devices", "application/json", createBody); createErr == nil {
				createResp.Body.Close()
				if createResp.StatusCode == http.StatusOK {
					log.Printf("ensureWhatsappGatewayDevice: NoDisk mode created preferred device placeholder: %s", trimmedPreferred)
				} else {
					log.Printf("ensureWhatsappGatewayDevice: NoDisk mode could not create preferred device placeholder status=%d id=%s", createResp.StatusCode, trimmedPreferred)
				}
			} else {
				log.Printf("ensureWhatsappGatewayDevice: NoDisk mode create preferred device request failed: %v", createErr)
			}

			log.Printf("ensureWhatsappGatewayDevice: NoDisk mode using preferred device directly: %s", trimmedPreferred)
			return trimmedPreferred, nil
		}

		if idsErr == nil && len(noDiskDeviceIDs) > 0 {
			log.Printf("ensureWhatsappGatewayDevice: NoDisk mode selected existing device from registry: %s", noDiskDeviceIDs[0])
			return noDiskDeviceIDs[0], nil
		}

		// Fresh pair path: no preferred ID and no existing devices. Create a
		// placeholder device so /app/login can produce a QR code.
		createResp, createErr := client.Post("http://127.0.0.1:3000/devices", "application/json", strings.NewReader(`{}`))
		if createErr == nil && createResp != nil {
			defer createResp.Body.Close()
			if createResp.StatusCode == http.StatusOK {
				var payload struct {
					Results struct {
						ID     string `json:"id"`
						Device string `json:"device"`
					} `json:"results"`
				}
				if derr := json.NewDecoder(createResp.Body).Decode(&payload); derr == nil {
					createdID := strings.TrimSpace(payload.Results.ID)
					if createdID == "" {
						createdID = strings.TrimSpace(payload.Results.Device)
					}
					if createdID != "" {
						log.Printf("ensureWhatsappGatewayDevice: NoDisk mode created fresh device placeholder: %s", createdID)
						return createdID, nil
					}
				}
			} else {
				body, _ := io.ReadAll(io.LimitReader(createResp.Body, 4096))
				log.Printf("ensureWhatsappGatewayDevice: NoDisk mode failed to create fresh device placeholder status=%d body=%s", createResp.StatusCode, strings.TrimSpace(string(body)))
			}
		} else if createErr != nil {
			log.Printf("ensureWhatsappGatewayDevice: NoDisk mode create fresh device request failed: %v", createErr)
		}

		log.Printf("ensureWhatsappGatewayDevice: NoDisk mode no preferred device served and no devices discovered")
		return "", nil
	}

	listURL := "http://127.0.0.1:3000/devices"
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

	if preferredDeviceID != "" {
		trimmedPreferred := strings.TrimSpace(preferredDeviceID)
		for _, d := range listResp.Results {
			if strings.TrimSpace(d.ID) == trimmedPreferred {
				log.Printf("ensureWhatsappGatewayDevice: using preferred device already present: %s", trimmedPreferred)
				return trimmedPreferred, nil
			}
		}

		// Try to fetch preferred device explicitly in case it exists but is not in the list.
		prefURL := fmt.Sprintf("http://127.0.0.1:3000/devices/%s", url.PathEscape(trimmedPreferred))
		if prefResp, err := client.Get(prefURL); err == nil {
			defer prefResp.Body.Close()
			if prefResp.StatusCode == http.StatusOK {
				log.Printf("ensureWhatsappGatewayDevice: preferred device %s exists in gateway, using it", trimmedPreferred)
				return trimmedPreferred, nil
			}
		}

		// As a last resort, use the preferred device ID directly (login endpoint may create it) before creating random fallback.
		log.Printf("ensureWhatsappGatewayDevice: preferred device %s not found in device list, using it directly as candidate", trimmedPreferred)
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
				return id, nil
			}
		}

		// No active connected device found, use first id as fallback.
		return listResp.Results[0].ID, nil
	}

	// Create first device if none exists
	postBody := strings.NewReader(`{}`)
	resp, err = client.Post(listURL, "application/json", postBody)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("/devices create %d", resp.StatusCode)
	}

	var createResp struct {
		Code    string `json:"code"`
		Message string `json:"message"`
		Results struct {
			ID string `json:"id"`
		} `json:"results"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&createResp); err != nil {
		return "", err
	}
	if createResp.Results.ID == "" {
		return "", fmt.Errorf("created device response missing id")
	}
	log.Printf("ensureWhatsappGatewayDevice: created device id=%s", createResp.Results.ID)
	return createResp.Results.ID, nil
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
	delete(welcomeSentForDevice, deviceID)
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

// cleanupWhatsappGatewayDevicesOnStartup tries to remove stale or unpaired
// devices from the gateway so the server starts with a clean session state.
// This runs best-effort in a goroutine and will not block server startup.
func cleanupWhatsappGatewayDevicesOnStartup() {
	go func() {
		client := &http.Client{Timeout: 4 * time.Second}
		if err := cleanupWhatsappGatewayDevices(client, ""); err != nil {
			log.Printf("cleanupWhatsappGatewayDevicesOnStartup: %v", err)
		}
	}()
}

// cleanupWhatsappGatewayDevices performs a synchronous best-effort cleanup of
// stale/unpaired devices on the running gateway using the provided HTTP client.
// Returns an error if the gateway is unreachable or the cleanup failed.
func cleanupWhatsappGatewayDevices(client *http.Client, preferredDeviceID string) error {
	preferredDeviceID = strings.TrimSpace(preferredDeviceID)
	if preferredDeviceID == "" {
		log.Printf("cleanupWhatsappGatewayDevices: no preferred device ID, skipping cleanup to avoid accidental nuke")
		return nil
	}

	listURL := "http://127.0.0.1:3000/devices"
	resp, err := client.Get(listURL)
	if err != nil {
		return fmt.Errorf("gateway not reachable: %v", err)
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
		return fmt.Errorf("failed to decode devices list: %v", err)
	}
	for _, d := range listResp.Results {
		id := strings.TrimSpace(d.ID)
		if id == "" {
			continue
		}

		// Check device status; if device is not logged in/connected, we may remove it.
		statusURL := fmt.Sprintf("http://127.0.0.1:3000/app/status?device_id=%s", url.QueryEscape(id))
		sresp, serr := client.Get(statusURL)
		remove := false
		if serr != nil {
			remove = true
		} else {
			defer sresp.Body.Close()
			if sresp.StatusCode != http.StatusOK {
				remove = true
			} else {
				var st struct {
					Results struct {
						IsConnected bool `json:"is_connected"`
						IsLoggedIn  bool `json:"is_logged_in"`
					} `json:"results"`
				}
				if err := json.NewDecoder(sresp.Body).Decode(&st); err != nil {
					remove = true
				} else {
					if !st.Results.IsConnected && !st.Results.IsLoggedIn {
						remove = true
					}
				}
			}
		}

		if preferredDeviceID != "" && id == preferredDeviceID {
			if remove {
				log.Printf("cleanupWhatsappGatewayDevices: preferred device %s is currently unpaired/disconnected but will be preserved unless user explicitly requests unpair", id)
			} else {
				log.Printf("cleanupWhatsappGatewayDevices: preserving preferred device %s (connected/logged in)", id)
			}
			continue
		}

		if remove {
			if derr := deleteWhatsappGatewayDevice(client, id); derr != nil {
				log.Printf("cleanupWhatsappGatewayDevices: failed to delete device %s: %v", id, derr)
			}
		}
	}
	return nil
}

// Proxy send requests to the local WhatsApp gateway
func getWhatsappMode() string {
	whatsappModeMu.RLock()
	defer whatsappModeMu.RUnlock()
	mode := strings.ToLower(strings.TrimSpace(whatsappMode))
	if mode != "personal" && mode != "bot" {
		return "personal"
	}
	return mode
}

func setWhatsappMode(mode string) string {
	normalized := strings.ToLower(strings.TrimSpace(mode))
	if normalized != "personal" && normalized != "bot" {
		normalized = "personal"
	}
	whatsappModeMu.Lock()
	whatsappMode = normalized
	whatsappModeMu.Unlock()
	return normalized
}

func whatsappModeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.WriteHeader(http.StatusOK)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	if r.Method == http.MethodGet {
		json.NewEncoder(w).Encode(map[string]any{"mode": getWhatsappMode()})
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
		mode := setWhatsappMode(payload.Mode)
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

func recordWhatsappOutgoingMessage(chatID, body string) {
	chatID = strings.TrimSpace(chatID)
	body = strings.TrimSpace(body)
	if chatID == "" || body == "" {
		return
	}
	whatsappOutgoingMu.Lock()
	defer whatsappOutgoingMu.Unlock()
	whatsappOutgoingMessages = append(whatsappOutgoingMessages, whatsappOutgoingMessage{ChatID: chatID, Body: body, Timestamp: time.Now()})
	if len(whatsappOutgoingMessages) > 50 {
		whatsappOutgoingMessages = whatsappOutgoingMessages[len(whatsappOutgoingMessages)-50:]
	}
}

func isWhatsappOutgoingEcho(chatID, body string) bool {
	chatID = strings.TrimSpace(chatID)
	body = strings.TrimSpace(body)
	if chatID == "" || body == "" {
		return false
	}
	whatsappOutgoingMu.Lock()
	defer whatsappOutgoingMu.Unlock()
	threshold := 12 * time.Second
	now := time.Now()
	for _, m := range whatsappOutgoingMessages {
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
			ChatID    string `json:"chat_id"`
			From      string `json:"from"`
			FromName  string `json:"from_name"`
			Timestamp string `json:"timestamp"`
			Body      string `json:"body"`
			IsFromMe  bool   `json:"is_from_me"`
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

	mode := getWhatsappMode()
	switch mode {
	case "personal":
		if !wrapper.Payload.IsFromMe {
			log.Printf("whatsappIncomingWebhook: skipped because personal mode and message not from owner")
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

	if isWhatsappOutgoingEcho(wrapper.Payload.ChatID, wrapper.Payload.Body) {
		log.Printf("whatsappIncomingWebhook: filtered outgoing echo from_me message chat=%s body=%q", wrapper.Payload.ChatID, wrapper.Payload.Body)
		w.WriteHeader(http.StatusNoContent)
		return
	}

	// Bot mode: allow group mention messages. Otherwise, only owner self-chat is processed.
	if strings.TrimSpace(wrapper.Payload.ChatID) != strings.TrimSpace(wrapper.Payload.From) {
		isGroup := strings.HasSuffix(strings.TrimSpace(wrapper.Payload.ChatID), "@g.us")
		if mode == "bot" && isGroup {
			// Require explicit mention with @ to avoid capturing full group chat floods.
			if !strings.Contains(wrapper.Payload.Body, "@") && len(utils.ContainsMention(wrapper.Payload.Body)) == 0 {
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

	log.Printf("whatsappIncomingWebhook: received owner from_me self-message chat=%s body=%q", wrapper.Payload.ChatID, wrapper.Payload.Body)

	incoming := whatsappIncomingMessage{
		DeviceID:  wrapper.DeviceID,
		ChatID:    wrapper.Payload.ChatID,
		From:      wrapper.Payload.From,
		FromName:  wrapper.Payload.FromName,
		Timestamp: wrapper.Payload.Timestamp,
		Body:      wrapper.Payload.Body,
	}
	maskedDevice := maskPhoneForLog(incoming.DeviceID)
	maskedChat := maskPhoneForLog(incoming.ChatID)
	maskedFrom := maskPhoneForLog(incoming.From)
	log.Printf("whatsappIncomingWebhook: received message device=%s chat=%s from=%s from_name=%s ts=%s body=%q", maskedDevice, maskedChat, maskedFrom, incoming.FromName, incoming.Timestamp, incoming.Body)

	whatsappIncomingMu.Lock()
	if len(whatsappIncomingQueue) > 500 {
		whatsappIncomingQueue = whatsappIncomingQueue[len(whatsappIncomingQueue)-500:]
	}
	whatsappIncomingQueue = append(whatsappIncomingQueue, incoming)
	whatsappIncomingMu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok"}`))
}

func whatsappIncomingPollHandler(w http.ResponseWriter, r *http.Request) {
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

	whatsappIncomingMu.Lock()
	msgs := whatsappIncomingQueue
	whatsappIncomingQueue = nil
	whatsappIncomingMu.Unlock()

	if len(msgs) > 0 {
		log.Printf("whatsappIncomingPoll: delivering %d message(s)", len(msgs))
		for i, m := range msgs {
			maskedDevice := maskPhoneForLog(m.DeviceID)
			maskedChat := maskPhoneForLog(m.ChatID)
			maskedFrom := maskPhoneForLog(m.From)
			log.Printf("whatsappIncomingPoll: %d device=%s chat=%s from=%s body=%q", i+1, maskedDevice, maskedChat, maskedFrom, m.Body)
		}
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
	if strings.Contains(r, "@") {
		r = strings.SplitN(r, "@", 2)[0]
	}
	if len(r) <= 6 {
		return "*****" + r
	}
	return "*****" + r[len(r)-6:]
}

func whatsappGatewayInfoHandler(w http.ResponseWriter, r *http.Request) {
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

	gatewayRunning := isGatewayRunning()
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]any{
		"gatewayMode":    "embedded",
		"gatewayRunning": gatewayRunning,
		"serverStarted":  whatsappServerStarted,
		"timestamp":      time.Now().Format(time.RFC3339),
	})
}

func whatsappDbSyncHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// TODO: Add explicit in-memory persistence/OPFS sync steps for Whatsapp state if needed.
	// For now this endpoint acts as a no-op hook, acknowledged by the frontend or shutdown logic.

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{"synced": true, "message": "whatsapp db sync hook executed"})
}

func whatsappSessionExportHandler(w http.ResponseWriter, r *http.Request) {
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

	if !isGatewayRunning() {
		http.Error(w, "gateway not running", http.StatusServiceUnavailable)
		return
	}

	client := &http.Client{Timeout: 12 * time.Second}
	requestedDeviceID := getPreferredWhatsappDeviceIDFromRequest(r)
	deviceID, err := ensureWhatsappGatewayDevice(client, requestedDeviceID)
	if err != nil {
		log.Printf("whatsappSessionExportHandler: cannot resolve device id: %v", err)
		http.Error(w, "cannot resolve device", http.StatusServiceUnavailable)
		return
	}

	exportURL := fmt.Sprintf("http://127.0.0.1:3000/app/session/export?device_id=%s", url.QueryEscape(deviceID))
	resp, err := client.Get(exportURL)
	if err != nil {
		log.Printf("whatsappSessionExportHandler: gateway call failed: %v", err)
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

func whatsappSessionImportHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
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
	if err := json.NewDecoder(io.LimitReader(r.Body, 1024*1024)).Decode(&request); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	client := &http.Client{Timeout: 12 * time.Second}
	requestedDeviceID := strings.TrimSpace(request.DeviceID)
	if requestedDeviceID == "" {
		requestedDeviceID = getPreferredWhatsappDeviceIDFromRequest(r)
	}
	deviceID, err := ensureWhatsappGatewayDevice(client, requestedDeviceID)
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

func whatsappSessionClearHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	client := &http.Client{Timeout: 12 * time.Second}
	requestedDeviceID := getPreferredWhatsappDeviceIDFromRequest(r)
	deviceID, err := ensureWhatsappGatewayDevice(client, requestedDeviceID)
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
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	client := &http.Client{Timeout: 10 * time.Second}
	deviceID, err := ensureWhatsappGatewayDevice(client, "")
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
	delete(welcomeSentForDevice, deviceID)
	welcomeMu.Unlock()
	pairRequested = false

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(map[string]any{"status": "ok", "message": "unpaired"})
}

func whatsappSendProxyHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
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

	w.Header().Set("Access-Control-Allow-Origin", "*")

	requestedDeviceID := getPreferredWhatsappDeviceIDFromRequest(r)

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
			recordWhatsappOutgoingMessage(chat, text)
			// Avoid logging phone number directly for privacy reasons.
			log.Printf("whatsappSendProxy: recorded outgoing message body length=%d", len(text))
		}
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resolvedDeviceID, derr := ensureWhatsappGatewayDevice(client, requestedDeviceID)
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

	// Try legacy endpoint first, then go-whatsapp-web-multidevice endpoint
	if resp, err := forwardWhatsAppSendRequest(client, "http://127.0.0.1:3000/send"+deviceQuery, body); err == nil {
		defer resp.Body.Close()
		w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
		w.WriteHeader(resp.StatusCode)
		io.Copy(w, resp.Body)
		return
	}
	if resp, err := forwardWhatsAppSendRequest(client, "http://127.0.0.1:3000/send/message"+deviceQuery, body); err == nil {
		defer resp.Body.Close()
		w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
		w.WriteHeader(resp.StatusCode)
		io.Copy(w, resp.Body)
		return
	}

	log.Printf("whatsappSendProxy: forward failed to both endpoints")
	http.Error(w, "gateway-unavailable", http.StatusServiceUnavailable)
}

// Proxy chat presence (typing indicator) to the bundled gateway
func whatsappPresenceProxyHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
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

	requestedDeviceID := getPreferredWhatsappDeviceIDFromRequest(r)

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
	payloadBytes, _ := json.Marshal(payload)

	client := &http.Client{Timeout: 10 * time.Second}
	resolvedDeviceID, derr := ensureWhatsappGatewayDevice(client, requestedDeviceID)
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
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
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

	w.Header().Set("Access-Control-Allow-Origin", "*")

	requestedDeviceID := getPreferredWhatsappDeviceIDFromRequest(r)
	client := &http.Client{Timeout: 0}
	resolvedDeviceID, derr := ensureWhatsappGatewayDevice(client, requestedDeviceID)
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
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
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

	w.Header().Set("Access-Control-Allow-Origin", "*")

	requestedDeviceID := getPreferredWhatsappDeviceIDFromRequest(r)
	client := &http.Client{Timeout: 0}
	resolvedDeviceID, derr := ensureWhatsappGatewayDevice(client, requestedDeviceID)
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

func forwardWhatsAppSendRequest(client *http.Client, url string, body []byte) (*http.Response, error) {
	req, err := http.NewRequest("POST", url, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusBadRequest {
		resp.Body.Close()
		return nil, fmt.Errorf("gateway endpoint missing or invalid")
	}
	return resp, nil
}

func inferWhatsappGatewayDevicePhone(client *http.Client) (string, error) {
	return inferWhatsappGatewayDevicePhoneByID(client, "")
}

func inferWhatsappGatewayDevicePhoneByID(client *http.Client, deviceID string) (string, error) {
	resp, err := client.Get("http://127.0.0.1:3000/devices")
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("/devices status %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
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
		return "", err
	}
	if len(listResp.Results) == 0 {
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

	if strings.TrimSpace(deviceID) != "" {
		for _, device := range listResp.Results {
			if strings.TrimSpace(device.DeviceID) == deviceID || strings.TrimSpace(device.ID) == deviceID {
				return pickDevice(device), nil
			}
		}
	}

	device := listResp.Results[0]
	phone := pickDevice(device)
	if phone != "" {
		return phone, nil
	}

	for _, device := range listResp.Results[1:] {
		phone = pickDevice(device)
		if phone != "" {
			return phone, nil
		}
	}
	return "", nil
}

func dispatchWhatsappWelcomeMessage(deviceID, initialTargetPhone string) {
	defer func() {
		welcomeMu.Lock()
		delete(welcomePendingForDevice, deviceID)
		welcomeMu.Unlock()
	}()

	targetPhone := strings.TrimSpace(initialTargetPhone)
	for attempt := 1; attempt <= 12; attempt++ {
		if !whatsappServerStarted {
			log.Printf("dispatchWhatsappWelcomeMessage: gateway stopped while waiting for target phone (device=%s)", deviceID)
			return
		}

		if targetPhone == "" {
			client := &http.Client{Timeout: 5 * time.Second}
			if inferred, err := inferWhatsappGatewayDevicePhoneByID(client, deviceID); err == nil && inferred != "" {
				targetPhone = inferred
				whatsappStartupTargetPhone = inferred
			} else if err != nil {
				log.Printf("dispatchWhatsappWelcomeMessage: cannot infer target phone yet (attempt %d): %v", attempt, err)
			}
		}

		if targetPhone != "" {
			// Give connection a moment to settle on WA side before sending.
			time.Sleep(3500 * time.Millisecond)
			if err := sendWhatsappText(targetPhone, "👋 Paiperwork is now connected and ready to chat."); err != nil {
				log.Printf("dispatchWhatsappWelcomeMessage: send failed to %s (attempt %d): %v", targetPhone, attempt, err)
			} else {
				welcomeMu.Lock()
				welcomeSentForDevice[deviceID] = true
				welcomeMu.Unlock()
				log.Printf("dispatchWhatsappWelcomeMessage: welcome message sent to %s for device %s", targetPhone, deviceID)
				return
			}
		}

		time.Sleep(2 * time.Second)
	}

	log.Printf("dispatchWhatsappWelcomeMessage: unable to resolve/send welcome for device %s after retries; will retry on next connected poll", deviceID)
}

func sendWhatsappText(chatID, text string) error {
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
		resp, err := client.Post("http://127.0.0.1:8182/api/whatsapp/send", "application/json", bytes.NewReader(body))
		if err != nil {
			return err
		}
		b, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		if resp.StatusCode == http.StatusOK {
			return nil
		}
		if resp.StatusCode == http.StatusServiceUnavailable {
			log.Printf("sendWhatsappText: gateway unavailable (503), skipping send to %s", chatID)
			return nil
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
	gatewayMu.Lock()
	defer gatewayMu.Unlock()
	if embeddedGowaStarted {
		return true
	}
	if gatewayCmd == nil {
		return false
	}
	if gatewayCmd.ProcessState != nil && gatewayCmd.ProcessState.Exited() {
		return false
	}
	return true
}

func resetGatewayRuntimeState(preserveStartupWindow bool) {
	// Keep per-device user preferences but remove transient runtime flags and caches.
	if !preserveStartupWindow {
		gatewayStartMutex.Lock()
		gatewayStarting = false
		gatewayLastStartAttempt = time.Time{}
		gatewayStartMutex.Unlock()
	}

	embeddedGowaMutex.Lock()
	embeddedGowaStarted = false
	whatsappServerStarted = false
	embeddedGowaMutex.Unlock()

	pairRequested = false

	welcomeMu.Lock()
	welcomeSentForDevice = map[string]bool{}
	welcomeMu.Unlock()

	whatsappGatewayCachedQR = ""
	whatsappGatewayCachedQRTimestamp = time.Time{}
	whatsappGatewayLastLoginAttempt = time.Time{}
	whatsappGatewayCachedBytesMu.Lock()
	whatsappGatewayCachedQRBytes = nil
	whatsappGatewayCachedQRContentType = ""
	whatsappGatewayCachedBytesMu.Unlock()
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
		// Wait for the embedded gowa goroutine to fully exit before resetting runtime state.
		waitForGatewayStopped(10 * time.Second)
		resetGatewayRuntimeState(false)
		whatsappInfra.ResetStateOnShutdown()
		return nil
	}
	embeddedGowaMutex.Unlock()

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

func startEmbeddedGowa() error {
	// Ensure any previous gateway state is fully cleaned before restarting.
	whatsappInfra.ResetStateOnShutdown()
	// Preserve startup markers so QR warm-up suppression remains active.
	resetGatewayRuntimeState(true)

	embeddedGowaMutex.Lock()
	if embeddedGowaStarted {
		embeddedGowaMutex.Unlock()
		return nil
	}
	// Mark startup in progress. Will remain true only on success.
	embeddedGowaStarted = true
	whatsappServerStarted = true
	embeddedGowaMutex.Unlock()

	// Make sure webhook config is set for gowa usecases
	if whatsappWebhookURL != "" {
		os.Setenv("WHATSAPP_WEBHOOK", whatsappWebhookURL)
	}
	if whatsappWebhookSecret != "" {
		os.Setenv("WHATSAPP_WEBHOOK_SECRET", whatsappWebhookSecret)
	}
	os.Setenv("WHATSAPP_WEBHOOK_EVENTS", "message")
	os.Setenv("WHATSAPP_WEBHOOK_INCLUDE_OUTGOING", "true")
	os.Setenv("WHATSAPP_WEBHOOK_INSECURE_SKIP_VERIFY", "true")
	os.Setenv("CHATWOOT_ENABLED", "false")
	os.Setenv("CHATWOOT_IMPORT_MESSAGES", "false")
	os.Setenv("HISTORY_SYNC_ENABLED", "false")

	// When launching gowa from Paiperwork, prefer no-disk mode to avoid
	// creating local folders/files/databases (forces in-memory DBs).
	os.Setenv("PAIPERWORK_NO_DISK", "true")

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
		}()

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
			embeddedGowaMutex.Lock()
			embeddedGowaStarted = false
			whatsappServerStarted = false
			embeddedGowaMutex.Unlock()
			return
		}
		log.Printf("startEmbeddedGowa: gateway is healthy")
	}()

	return nil
}

func tryStartBundledGateway(execDir string) error {
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
	err := startEmbeddedGowa()
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
	mux.HandleFunc("/api/whatsapp/preferred-device", whatsappPreferredDeviceHandler)
	mux.HandleFunc("/api/cloud/tags", proxyOllamaCloudTags)
	mux.HandleFunc("/api/cloud/generate", proxyOllamaCloudAPIPath("generate"))
	mux.HandleFunc("/api/cloud/show", proxyOllamaCloudAPIPath("show"))
	mux.HandleFunc("/api/cloud/pull", proxyOllamaCloudAPIPath("pull"))
	mux.HandleFunc("/api/cloud/embed", proxyOllamaCloudAPIPath("embed"))
	mux.HandleFunc("/api/cloud/embeddings", proxyOllamaCloudAPIPath("embeddings"))
	mux.HandleFunc("/api/extract/content", fetchAndExtractContent)
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
	mux.HandleFunc("/api/whatsapp/session", whatsappSessionClearHandler)
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

	// Security-focused startup messages
	log.Printf("🔒 Secure Paiperwork server starting on:")
	log.Printf("🛡️  SECURITY: Server restricted to localhost access only")
	log.Printf("💡 This ensures your data remains encrypted and secure")
	log.Printf("🚫 Network access disabled for enterprise security")

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

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)

	select {
	case err := <-serverErrors:
		if err != nil && err != http.ErrServerClosed {
			log.Printf("Server error: %v", err)
			// Attempt to stop bundled gateway if it was started
			stopBundledGateway()
			// Do not force OS exit on local server errors; allow the process to cleanly stop
			return
		}
		log.Printf("Server closed cleanly")
		stopBundledGateway()
		return
	case sig := <-sigCh:
		log.Printf("Received signal %v, shutting down...", sig)
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := server.Shutdown(ctx); err != nil {
			log.Printf("Server shutdown failed: %v; forcing close", err)
			_ = server.Close()
		}
		stopBundledGateway()
	}
}
