package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	config "github.com/aldinokemal/go-whatsapp-web-multidevice/config"
)

func resetWhatsappPairingProbeStateForTests() {
	whatsappPairingProbeMu.Lock()
	whatsappPairingProbeByDevice = make(map[string]whatsappPairingProbeState)
	whatsappPairingProbeMu.Unlock()
}

func TestWhatsappMentionsDevice(t *testing.T) {
	tests := []struct {
		name     string
		mentions []string
		deviceID string
		want     bool
	}{
		{
			name:     "matches direct s whatsapp jid",
			mentions: []string{"15551234567@s.whatsapp.net"},
			deviceID: "15551234567@s.whatsapp.net",
			want:     true,
		},
		{
			name:     "matches ad device jid",
			mentions: []string{"15551234567@s.whatsapp.net"},
			deviceID: "15551234567:42@s.whatsapp.net",
			want:     true,
		},
		{
			name:     "matches lid normalized number",
			mentions: []string{"15551234567@lid"},
			deviceID: "15551234567@s.whatsapp.net",
			want:     true,
		},
		{
			name:     "does not match unrelated mention",
			mentions: []string{"15557654321@s.whatsapp.net"},
			deviceID: "15551234567@s.whatsapp.net",
			want:     false,
		},
		{
			name:     "does not match when mentions empty",
			mentions: nil,
			deviceID: "15551234567@s.whatsapp.net",
			want:     false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := whatsappMentionsDevice(tt.mentions, tt.deviceID)
			if got != tt.want {
				t.Fatalf("whatsappMentionsDevice() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestShouldSelectNoDiskGatewayDevice(t *testing.T) {
	resetWhatsappPairingProbeStateForTests()
	tests := []struct {
		name    string
		details *whatsappGatewayDeviceDetails
		status  *whatsappGatewayStatus
		setup   func()
		want    bool
	}{
		{
			name:   "selects logged in device even without jid",
			status: &whatsappGatewayStatus{Connected: true, LoggedIn: true},
			want:   true,
		},
		{
			name:    "selects disconnected paired device with jid",
			details: &whatsappGatewayDeviceDetails{ID: "dev-1", JID: "15551234567@s.whatsapp.net", State: "disconnected"},
			status:  &whatsappGatewayStatus{},
			want:    true,
		},
		{
			name:    "selects active pairing probe without jid",
			details: &whatsappGatewayDeviceDetails{ID: "dev-probe", JID: "", State: "disconnected"},
			status:  &whatsappGatewayStatus{},
			setup: func() {
				markWhatsappPairingProbeState("dev-probe", "test")
			},
			want: true,
		},
		{
			name:    "rejects placeholder with empty jid",
			details: &whatsappGatewayDeviceDetails{ID: "dev-2", JID: "", State: "disconnected"},
			status:  &whatsappGatewayStatus{},
			want:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resetWhatsappPairingProbeStateForTests()
			if tt.setup != nil {
				tt.setup()
			}
			got := shouldSelectNoDiskGatewayDevice(tt.details, tt.status)
			if got != tt.want {
				t.Fatalf("shouldSelectNoDiskGatewayDevice() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestShouldPruneNoDiskGatewayPlaceholder(t *testing.T) {
	resetWhatsappPairingProbeStateForTests()
	tests := []struct {
		name              string
		deviceID          string
		preferredDeviceID string
		details           *whatsappGatewayDeviceDetails
		status            *whatsappGatewayStatus
		setup             func()
		want              bool
	}{
		{
			name:     "prunes disconnected placeholder",
			deviceID: "placeholder-1",
			details:  &whatsappGatewayDeviceDetails{ID: "placeholder-1", JID: "", State: "disconnected"},
			status:   &whatsappGatewayStatus{},
			want:     true,
		},
		{
			name:              "keeps preferred placeholder",
			deviceID:          "placeholder-2",
			preferredDeviceID: "placeholder-2",
			details:           &whatsappGatewayDeviceDetails{ID: "placeholder-2", JID: "", State: "disconnected"},
			status:            &whatsappGatewayStatus{},
			want:              false,
		},
		{
			name:     "keeps active pairing placeholder",
			deviceID: "probing-1",
			details:  &whatsappGatewayDeviceDetails{ID: "probing-1", JID: "", State: "disconnected"},
			status:   &whatsappGatewayStatus{},
			setup: func() {
				markWhatsappPairingProbeState("probing-1", "test")
			},
			want: false,
		},
		{
			name:     "keeps paired device with jid",
			deviceID: "paired-1",
			details:  &whatsappGatewayDeviceDetails{ID: "paired-1", JID: "15551234567@s.whatsapp.net", State: "disconnected"},
			status:   &whatsappGatewayStatus{},
			want:     false,
		},
		{
			name:     "keeps connected placeholder",
			deviceID: "connected-1",
			details:  &whatsappGatewayDeviceDetails{ID: "connected-1", JID: "", State: "logged_in"},
			status:   &whatsappGatewayStatus{Connected: true, LoggedIn: true},
			want:     false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resetWhatsappPairingProbeStateForTests()
			if tt.setup != nil {
				tt.setup()
			}
			got := shouldPruneNoDiskGatewayPlaceholder(tt.deviceID, tt.preferredDeviceID, tt.details, tt.status)
			if got != tt.want {
				t.Fatalf("shouldPruneNoDiskGatewayPlaceholder() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestResolveExistingNoDiskGatewayDevice(t *testing.T) {
	tests := []struct {
		name              string
		ids               []string
		preferredDeviceID string
		statusByID        map[string]*whatsappGatewayStatus
		want              string
	}{
		{
			name:              "prefers explicit selected device over another logged in device",
			ids:               []string{"8618520165968:55@s.whatsapp.net", "8619802087305:13@s.whatsapp.net"},
			preferredDeviceID: "8618520165968:55@s.whatsapp.net",
			statusByID: map[string]*whatsappGatewayStatus{
				"8618520165968:55@s.whatsapp.net": {Connected: false, LoggedIn: false},
				"8619802087305:13@s.whatsapp.net": {Connected: true, LoggedIn: true},
			},
			want: "8618520165968:55@s.whatsapp.net",
		},
		{
			name: "falls back to logged in device when no preferred device selected",
			ids:  []string{"device-a", "device-b"},
			statusByID: map[string]*whatsappGatewayStatus{
				"device-b": {Connected: true, LoggedIn: true},
			},
			want: "device-b",
		},
		{
			name:              "falls back to logged in device when preferred device is absent",
			ids:               []string{"device-a", "device-b"},
			preferredDeviceID: "missing-device",
			statusByID: map[string]*whatsappGatewayStatus{
				"device-b": {Connected: true, LoggedIn: true},
			},
			want: "device-b",
		},
		{
			name:              "returns empty when no devices qualify",
			ids:               []string{"device-a"},
			preferredDeviceID: "",
			statusByID:        map[string]*whatsappGatewayStatus{},
			want:              "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := resolveExistingNoDiskGatewayDevice(tt.ids, tt.preferredDeviceID, tt.statusByID)
			if got != tt.want {
				t.Fatalf("resolveExistingNoDiskGatewayDevice() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestClassifyQrEligibilityByLoginFailure(t *testing.T) {
	tests := []struct {
		name           string
		statusCode     int
		code           string
		message        string
		bodyText       string
		wantAllowQR    bool
		wantNetworkErr bool
	}{
		{
			name:        "generic session deleted does not allow qr",
			message:     "device abc is not logged in (session deleted)",
			wantAllowQR: false,
		},
		{
			name:        "explicit remote logout allows qr",
			message:     "user logged out from phone whatsapp",
			wantAllowQR: true,
		},
		{
			name:           "gateway timeout is treated as network",
			statusCode:     504,
			bodyText:       "gateway timeout",
			wantAllowQR:    false,
			wantNetworkErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotAllowQR, gotNetworkErr := classifyQrEligibilityByLoginFailure(tt.statusCode, tt.code, tt.message, tt.bodyText)
			if gotAllowQR != tt.wantAllowQR || gotNetworkErr != tt.wantNetworkErr {
				t.Fatalf("classifyQrEligibilityByLoginFailure() = (%v, %v), want (%v, %v)", gotAllowQR, gotNetworkErr, tt.wantAllowQR, tt.wantNetworkErr)
			}
		})
	}
}

func TestShouldAllowQrForPersistentDevice(t *testing.T) {
	tests := []struct {
		name     string
		deviceID string
		fresh    bool
		want     bool
		reason   string
	}{
		{
			name:     "no preferred device allows qr",
			deviceID: "",
			fresh:    false,
			want:     true,
			reason:   "no-device",
		},
		{
			name:     "saved preferred device withholds qr",
			deviceID: "3961bc1d-0830-49fb-b507-1b6fe97616c4",
			fresh:    false,
			want:     false,
			reason:   "saved-device-awaiting-explicit-unpair",
		},
		{
			name:     "fresh pair bypasses saved-device qr gate",
			deviceID: "3961bc1d-0830-49fb-b507-1b6fe97616c4",
			fresh:    true,
			want:     true,
			reason:   "fresh-pair-request",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, gotReason := shouldAllowQrForPersistentDevice(nil, tt.deviceID, tt.fresh)
			if got != tt.want || gotReason != tt.reason {
				t.Fatalf("shouldAllowQrForPersistentDevice() = (%v, %q), want (%v, %q)", got, gotReason, tt.want, tt.reason)
			}
		})
	}
}

func TestGetPreferredWhatsappDeviceIDFromRequest(t *testing.T) {
	t.Run("fresh pair keeps explicit active device id", func(t *testing.T) {
		markWhatsappPairingProbeState("fresh-123", "test")
		defer clearWhatsappPairingProbeState("fresh-123")
		req := httptest.NewRequest(http.MethodGet, "/api/whatsapp/qr?fresh_pair=true&device_id=fresh-123", nil)
		if got := getPreferredWhatsappDeviceIDFromRequest(req); got != "fresh-123" {
			t.Fatalf("getPreferredWhatsappDeviceIDFromRequest() = %q, want %q", got, "fresh-123")
		}
	})

	t.Run("fresh pair ignores stale explicit device id without active probe", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/whatsapp/qr?fresh_pair=true&device_id=stale-456", nil)
		if got := getPreferredWhatsappDeviceIDFromRequest(req); got != "" {
			t.Fatalf("getPreferredWhatsappDeviceIDFromRequest() = %q, want empty", got)
		}
	})

	t.Run("fresh pair without explicit device id clears remembered preferred device", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/whatsapp/qr?fresh_pair=true", nil)
		if got := getPreferredWhatsappDeviceIDFromRequest(req); got != "" {
			t.Fatalf("getPreferredWhatsappDeviceIDFromRequest() = %q, want empty", got)
		}
	})
}

func TestIsWhatsappGatewayWebsocketReadyAt(t *testing.T) {
	tests := []struct {
		name       string
		statusCode int
		want       bool
	}{
		{
			name:       "upgrade required means websocket route ready",
			statusCode: http.StatusUpgradeRequired,
			want:       true,
		},
		{
			name:       "ok response is not websocket ready",
			statusCode: http.StatusOK,
			want:       false,
		},
		{
			name:       "not found is not websocket ready",
			statusCode: http.StatusNotFound,
			want:       false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(tt.statusCode)
			}))
			defer server.Close()

			got := isWhatsappGatewayWebsocketReadyAt(server.URL)
			if got != tt.want {
				t.Fatalf("isWhatsappGatewayWebsocketReadyAt() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestWhatsappPreferredDeviceHandlerClearsEnvOnEmptyPost(t *testing.T) {
	preferredWhatsappDeviceMu.Lock()
	preferredWhatsappDevice = make(map[string]map[string]string)
	preferredWhatsappDeviceMu.Unlock()

	oldConfig := config.WhatsappPreferredDeviceID
	oldPrimary, hadPrimary := os.LookupEnv("PAIPERWORK_WHATSAPP_PREFERRED_DEVICE_ID")
	oldLegacy, hadLegacy := os.LookupEnv("WHATSAPP_PREFERRED_DEVICE_ID")
	t.Cleanup(func() {
		config.WhatsappPreferredDeviceID = oldConfig
		if hadPrimary {
			_ = os.Setenv("PAIPERWORK_WHATSAPP_PREFERRED_DEVICE_ID", oldPrimary)
		} else {
			os.Unsetenv("PAIPERWORK_WHATSAPP_PREFERRED_DEVICE_ID")
		}
		if hadLegacy {
			_ = os.Setenv("WHATSAPP_PREFERRED_DEVICE_ID", oldLegacy)
		} else {
			os.Unsetenv("WHATSAPP_PREFERRED_DEVICE_ID")
		}
	})

	config.WhatsappPreferredDeviceID = "stale-device"
	_ = os.Setenv("PAIPERWORK_WHATSAPP_PREFERRED_DEVICE_ID", "stale-device")
	_ = os.Setenv("WHATSAPP_PREFERRED_DEVICE_ID", "stale-device")

	body := strings.NewReader(`{"device_id":"","meta":""}`)
	req := httptest.NewRequest(http.MethodPost, "/api/whatsapp/preferred-device?user=test-user", body)
	res := httptest.NewRecorder()

	whatsappPreferredDeviceHandler(res, req)

	if res.Code != http.StatusOK {
		t.Fatalf("whatsappPreferredDeviceHandler() status = %d, want %d", res.Code, http.StatusOK)
	}

	var payload map[string]string
	if err := json.Unmarshal(res.Body.Bytes(), &payload); err != nil {
		t.Fatalf("response json decode failed: %v", err)
	}
	if payload["status"] != "ok" {
		t.Fatalf("response status = %q, want ok", payload["status"])
	}

	if got := os.Getenv("PAIPERWORK_WHATSAPP_PREFERRED_DEVICE_ID"); got != "" {
		t.Fatalf("PAIPERWORK_WHATSAPP_PREFERRED_DEVICE_ID = %q, want empty", got)
	}
	if got := os.Getenv("WHATSAPP_PREFERRED_DEVICE_ID"); got != "" {
		t.Fatalf("WHATSAPP_PREFERRED_DEVICE_ID = %q, want empty", got)
	}
	if config.WhatsappPreferredDeviceID != "" {
		t.Fatalf("config.WhatsappPreferredDeviceID = %q, want empty", config.WhatsappPreferredDeviceID)
	}

	preferredWhatsappDeviceMu.RLock()
	stored := preferredWhatsappDevice["test-user"]
	preferredWhatsappDeviceMu.RUnlock()
	if stored == nil {
		t.Fatalf("preferredWhatsappDevice entry missing for test-user")
	}
	if stored["device_id"] != "" {
		t.Fatalf("stored device_id = %q, want empty", stored["device_id"])
	}
}

func TestPreferredWhatsappDevicePersistsToDB(t *testing.T) {
	oldWD, err := os.Getwd()
	if err != nil {
		t.Fatalf("os.Getwd() failed: %v", err)
	}

	tmpDir := t.TempDir()
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatalf("os.Chdir(%q) failed: %v", tmpDir, err)
	}
	t.Cleanup(func() {
		_ = os.Chdir(oldWD)
	})

	preferredWhatsappDeviceMu.Lock()
	preferredWhatsappDevice = make(map[string]map[string]string)
	preferredWhatsappDeviceMu.Unlock()

	if err := savePreferredWhatsappDeviceToDB("db-user", "15551234567:9@s.whatsapp.net", "db-meta"); err != nil {
		t.Fatalf("savePreferredWhatsappDeviceToDB() failed: %v", err)
	}

	gotID, gotMeta, err := loadPreferredWhatsappDeviceFromDB("db-user")
	if err != nil {
		t.Fatalf("loadPreferredWhatsappDeviceFromDB() failed: %v", err)
	}
	if gotID != "15551234567:9@s.whatsapp.net" || gotMeta != "db-meta" {
		t.Fatalf("loadPreferredWhatsappDeviceFromDB() = (%q, %q), want (%q, %q)", gotID, gotMeta, "15551234567:9@s.whatsapp.net", "db-meta")
	}

	req := httptest.NewRequest(http.MethodGet, "/api/whatsapp/qr?user=db-user", nil)
	preferredWhatsappDeviceMu.Lock()
	preferredWhatsappDevice = make(map[string]map[string]string)
	preferredWhatsappDeviceMu.Unlock()

	resolvedID := getPreferredWhatsappDeviceIDFromRequest(req)
	if resolvedID != "15551234567:9@s.whatsapp.net" {
		t.Fatalf("getPreferredWhatsappDeviceIDFromRequest() = %q, want %q", resolvedID, "15551234567:9@s.whatsapp.net")
	}

	if err := savePreferredWhatsappDeviceToDB("db-user", "", ""); err != nil {
		t.Fatalf("savePreferredWhatsappDeviceToDB(clear) failed: %v", err)
	}

	clearedID, clearedMeta, err := loadPreferredWhatsappDeviceFromDB("db-user")
	if err != nil {
		t.Fatalf("loadPreferredWhatsappDeviceFromDB(clear) failed: %v", err)
	}
	if clearedID != "" || clearedMeta != "" {
		t.Fatalf("loadPreferredWhatsappDeviceFromDB(clear) = (%q, %q), want empty values", clearedID, clearedMeta)
	}
}
