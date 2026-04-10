package main

import "testing"

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
