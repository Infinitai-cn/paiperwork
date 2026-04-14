package helpers

import "testing"

func TestLooksLikePersistentSessionDeviceID(t *testing.T) {
	tests := []struct {
		name     string
		deviceID string
		want     bool
	}{
		{
			name:     "uuid placeholder is not persistent",
			deviceID: "e43a257b-f119-48f0-8a79-1459cebe300b",
			want:     false,
		},
		{
			name:     "bare jid is persistent",
			deviceID: "8618520165968@s.whatsapp.net",
			want:     true,
		},
		{
			name:     "paired jid is persistent",
			deviceID: "8618520165968:72@s.whatsapp.net",
			want:     true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := looksLikePersistentSessionDeviceID(tt.deviceID); got != tt.want {
				t.Fatalf("looksLikePersistentSessionDeviceID(%q) = %v, want %v", tt.deviceID, got, tt.want)
			}
		})
	}
}
