package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	uiWebsocket "github.com/aldinokemal/go-whatsapp-web-multidevice/ui/websocket"
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

func TestMaskPhoneForLog(t *testing.T) {
	tests := []struct {
		name string
		raw  string
		want string
	}{
		{
			name: "masks paired device placeholder and keeps suffixes",
			raw:  "8619802087305:45@s.whatsapp.net",
			want: "*********7305:45@s.whatsapp.net",
		},
		{
			name: "masks plain digits",
			raw:  "15551234567",
			want: "*******4567",
		},
		{
			name: "preserves plus prefix",
			raw:  "+15551234567@s.whatsapp.net",
			want: "+*******4567@s.whatsapp.net",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := maskPhoneForLog(tt.raw); got != tt.want {
				t.Fatalf("maskPhoneForLog(%q) = %q, want %q", tt.raw, got, tt.want)
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

func TestIsWhatsappOutgoingEcho(t *testing.T) {
	recordWhatsappOutgoingMessage("user-1", "15551234567@s.whatsapp.net", "hello")

	if !isWhatsappOutgoingEcho("user-1", "15551234567@s.whatsapp.net", "hello") {
		t.Fatal("expected outgoing echo to be detected")
	}

	if isWhatsappOutgoingEcho("user-1", "15551234567@s.whatsapp.net", "goodbye") {
		t.Fatal("expected different body not to be treated as outgoing echo")
	}
}

func TestShouldFilterWhatsappOutgoingEcho(t *testing.T) {
	tests := []struct {
		name   string
		mode   string
		chatID string
		from   string
		want   bool
	}{
		{
			name:   "personal mode self chat should not filter outgoing echo",
			mode:   "personal",
			chatID: "15551234567@s.whatsapp.net",
			from:   "15551234567@s.whatsapp.net",
			want:   false,
		},
		{
			name:   "personal mode non-self chat should filter outgoing echo",
			mode:   "personal",
			chatID: "15551234567@s.whatsapp.net",
			from:   "15557654321@s.whatsapp.net",
			want:   true,
		},
		{
			name:   "bot mode self chat should filter outgoing echo",
			mode:   "bot",
			chatID: "15551234567@s.whatsapp.net",
			from:   "15551234567@s.whatsapp.net",
			want:   true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := shouldFilterWhatsappOutgoingEcho(tt.mode, tt.chatID, tt.from); got != tt.want {
				t.Fatalf("shouldFilterWhatsappOutgoingEcho() = %v, want %v", got, tt.want)
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
			name:              "does not fall back to another logged in device when preferred device is absent",
			ids:               []string{"device-a", "device-b"},
			preferredDeviceID: "missing-device",
			statusByID: map[string]*whatsappGatewayStatus{
				"device-b": {Connected: true, LoggedIn: true},
			},
			want: "",
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

func TestResolveWhatsappWelcomeCandidateFromBroadcast(t *testing.T) {
	tests := []struct {
		name        string
		message     uiWebsocket.BroadcastMessage
		wantDevice  string
		wantPhone   string
		wantMatched bool
	}{
		{
			name: "matches logged in broadcast",
			message: uiWebsocket.BroadcastMessage{
				Code: "LOGGED_IN",
				Result: map[string]any{
					"device_id":    "15551234567:23@s.whatsapp.net",
					"phone_number": "15551234567",
				},
			},
			wantDevice:  "15551234567:23@s.whatsapp.net",
			wantPhone:   "15551234567",
			wantMatched: true,
		},
		{
			name: "ignores login success broadcast",
			message: uiWebsocket.BroadcastMessage{
				Code: "LOGIN_SUCCESS",
				Result: map[string]any{
					"device_id": "placeholder-id",
				},
			},
			wantMatched: false,
		},
		{
			name: "ignores missing device id",
			message: uiWebsocket.BroadcastMessage{
				Code:   "LOGGED_IN",
				Result: map[string]any{"phone_number": "15551234567"},
			},
			wantMatched: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			deviceID, phoneNumber, ok := resolveWhatsappWelcomeCandidateFromBroadcast(tt.message)
			if ok != tt.wantMatched {
				t.Fatalf("resolveWhatsappWelcomeCandidateFromBroadcast() matched=%v, want %v", ok, tt.wantMatched)
			}
			if deviceID != tt.wantDevice {
				t.Fatalf("resolveWhatsappWelcomeCandidateFromBroadcast() deviceID=%q, want %q", deviceID, tt.wantDevice)
			}
			if phoneNumber != tt.wantPhone {
				t.Fatalf("resolveWhatsappWelcomeCandidateFromBroadcast() phoneNumber=%q, want %q", phoneNumber, tt.wantPhone)
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
		if got := getRequestedWhatsappDeviceIDFromRequest(req); got != "fresh-123" {
			t.Fatalf("getPreferredWhatsappDeviceIDFromRequest() = %q, want %q", got, "fresh-123")
		}
	})

	t.Run("fresh pair ignores stale explicit device id without active probe", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/whatsapp/qr?fresh_pair=true&device_id=stale-456", nil)
		if got := getRequestedWhatsappDeviceIDFromRequest(req); got != "" {
			t.Fatalf("getPreferredWhatsappDeviceIDFromRequest() = %q, want empty", got)
		}
	})

	t.Run("fresh pair without explicit device id clears remembered preferred device", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/whatsapp/qr?fresh_pair=true", nil)
		if got := getRequestedWhatsappDeviceIDFromRequest(req); got != "" {
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

func TestCanonicalizePreferredWhatsappDeviceIDRejectsMalformedValue(t *testing.T) {
	got := canonicalizeRequestedWhatsappDeviceID("test-user", "8618520165968@s.whatsapp.netnet")
	if got != "" {
		t.Fatalf("canonicalizePreferredWhatsappDeviceID() = %q, want empty", got)
	}
}

func TestPreferredWhatsappDeviceDoesNotPersistInAlwaysInMemoryRuntime(t *testing.T) {
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

	selectedWhatsappDeviceMu.Lock()
	selectedWhatsappDevice = make(map[string]map[string]string)
	selectedWhatsappDeviceMu.Unlock()

	if err := saveSelectedWhatsappDeviceToDB("db-user", "15551234567:9@s.whatsapp.net", "db-meta"); err != nil {
		t.Fatalf("savePreferredWhatsappDeviceToDB() failed: %v", err)
	}

	gotID, gotMeta, err := loadSelectedWhatsappDeviceFromDB("db-user")
	if err != nil {
		t.Fatalf("loadPreferredWhatsappDeviceFromDB() failed: %v", err)
	}
	if gotID != "" || gotMeta != "" {
		t.Fatalf("loadPreferredWhatsappDeviceFromDB() = (%q, %q), want empty values in always-in-memory runtime", gotID, gotMeta)
	}

	if err := saveSelectedWhatsappDeviceToDB("db-user", "", ""); err != nil {
		t.Fatalf("savePreferredWhatsappDeviceToDB(clear) failed: %v", err)
	}

	clearedID, clearedMeta, err := loadSelectedWhatsappDeviceFromDB("db-user")
	if err != nil {
		t.Fatalf("loadPreferredWhatsappDeviceFromDB(clear) failed: %v", err)
	}
	if clearedID != "" || clearedMeta != "" {
		t.Fatalf("loadPreferredWhatsappDeviceFromDB(clear) = (%q, %q), want empty values", clearedID, clearedMeta)
	}
}
