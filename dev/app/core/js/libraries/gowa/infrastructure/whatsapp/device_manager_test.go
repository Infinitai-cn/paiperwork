package whatsapp

import (
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/aldinokemal/go-whatsapp-web-multidevice/config"
	domainChatStorage "github.com/aldinokemal/go-whatsapp-web-multidevice/domains/chatstorage"
	_ "github.com/mattn/go-sqlite3"
	"go.mau.fi/whatsmeow/proto/waAdv"
	"go.mau.fi/whatsmeow/store"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types"
	waLog "go.mau.fi/whatsmeow/util/log"
)

func TestListDevices_SortsByCreatedAtAscending(t *testing.T) {
	manager := &DeviceManager{
		devices: make(map[string]*DeviceInstance),
	}

	// Create devices with different creation times (in random order)
	now := time.Now()
	devices := []*DeviceInstance{
		{id: "device-c", createdAt: now.Add(2 * time.Hour)},
		{id: "device-a", createdAt: now},
		{id: "device-b", createdAt: now.Add(1 * time.Hour)},
	}

	// Add in the given order (which is not sorted by createdAt)
	for _, d := range devices {
		manager.devices[d.id] = d
	}

	// Get list multiple times to verify consistent sorting
	for i := 0; i < 10; i++ {
		result := manager.ListDevices()

		// Verify order: device-a, device-b, device-c (oldest to newest)
		if len(result) != 3 {
			t.Fatalf("iteration %d: expected 3 devices, got %d", i, len(result))
		}
		if result[0].ID() != "device-a" {
			t.Errorf("iteration %d: expected first device to be device-a, got %s", i, result[0].ID())
		}
		if result[1].ID() != "device-b" {
			t.Errorf("iteration %d: expected second device to be device-b, got %s", i, result[1].ID())
		}
		if result[2].ID() != "device-c" {
			t.Errorf("iteration %d: expected third device to be device-c, got %s", i, result[2].ID())
		}
	}
}

func TestListDevices_PrefersSelectedDeviceFirst(t *testing.T) {
	t.Setenv("PAIPERWORK_WHATSAPP_PREFERRED_DEVICE_ID", "8619802087305:13@s.whatsapp.net")
	originalPreferred := config.WhatsappPreferredDeviceID
	config.WhatsappPreferredDeviceID = ""
	t.Cleanup(func() {
		config.WhatsappPreferredDeviceID = originalPreferred
	})

	manager := &DeviceManager{
		devices: make(map[string]*DeviceInstance),
	}

	now := time.Now()
	manager.devices["8618520165968:57@s.whatsapp.net"] = &DeviceInstance{id: "8618520165968:57@s.whatsapp.net", createdAt: now}
	manager.devices["8619802087305:13@s.whatsapp.net"] = &DeviceInstance{id: "8619802087305:13@s.whatsapp.net", createdAt: now.Add(1 * time.Hour)}

	result := manager.ListDevices()
	if len(result) != 2 {
		t.Fatalf("expected 2 devices, got %d", len(result))
	}
	if got := result[0].ID(); got != "8619802087305:13@s.whatsapp.net" {
		t.Fatalf("expected preferred device first, got %s", got)
	}
}

func TestListDevices_EmptyList(t *testing.T) {
	manager := &DeviceManager{
		devices: make(map[string]*DeviceInstance),
	}

	result := manager.ListDevices()

	if len(result) != 0 {
		t.Errorf("expected empty slice, got %d devices", len(result))
	}
}

func TestListDevices_SingleDevice(t *testing.T) {
	manager := &DeviceManager{
		devices: make(map[string]*DeviceInstance),
	}

	device := &DeviceInstance{id: "only-device", createdAt: time.Now()}
	manager.devices[device.id] = device

	result := manager.ListDevices()

	if len(result) != 1 {
		t.Fatalf("expected 1 device, got %d", len(result))
	}
	if result[0].ID() != "only-device" {
		t.Errorf("expected device id to be only-device, got %s", result[0].ID())
	}
}

func TestListDevices_SameCreatedAt(t *testing.T) {
	manager := &DeviceManager{
		devices: make(map[string]*DeviceInstance),
	}

	// Devices with same creation time should be sorted by ID as tie-breaker
	sameTime := time.Now()
	devices := []*DeviceInstance{
		{id: "device-3", createdAt: sameTime},
		{id: "device-1", createdAt: sameTime},
		{id: "device-2", createdAt: sameTime},
	}

	for _, d := range devices {
		manager.devices[d.id] = d
	}

	expectedOrder := []string{"device-1", "device-2", "device-3"}

	// Call ListDevices multiple times to verify consistent ordering
	for i := 0; i < 10; i++ {
		result := manager.ListDevices()

		if len(result) != 3 {
			t.Fatalf("iteration %d: expected 3 devices, got %d", i, len(result))
		}

		// Verify order: devices should be sorted by ID when createdAt is equal
		for j, expected := range expectedOrder {
			if result[j].ID() != expected {
				t.Errorf("iteration %d: expected device at index %d to be %s, got %s",
					i, j, expected, result[j].ID())
			}
		}
	}
}

func TestMergePersistedDeviceRecords_BackfillsStoreDevicesIntoEmptyRegistry(t *testing.T) {
	deviceJID := types.JID{User: "8618520165968", Device: 55, Server: types.DefaultUserServer}
	storeDevices := []*store.Device{{ID: &deviceJID}}

	merged, backfilled := mergePersistedDeviceRecords(nil, storeDevices)

	if len(merged) != 1 {
		t.Fatalf("expected 1 merged device record, got %d", len(merged))
	}
	if len(backfilled) != 1 {
		t.Fatalf("expected 1 backfilled device record, got %d", len(backfilled))
	}
	if merged[0].DeviceID != "8618520165968:55@s.whatsapp.net" {
		t.Fatalf("unexpected merged device id: %s", merged[0].DeviceID)
	}
	if merged[0].JID != "8618520165968@s.whatsapp.net" {
		t.Fatalf("unexpected merged device jid: %s", merged[0].JID)
	}
}

func TestMergePersistedDeviceRecords_DedupesRegistryAndStoreByAccount(t *testing.T) {
	registry := []*domainChatStorage.DeviceRecord{{
		DeviceID: "8618520165968@s.whatsapp.net",
		JID:      "8618520165968@s.whatsapp.net",
	}}
	deviceJID := types.JID{User: "8618520165968", Device: 55, Server: types.DefaultUserServer}
	storeDevices := []*store.Device{{ID: &deviceJID}}

	merged, backfilled := mergePersistedDeviceRecords(registry, storeDevices)

	if len(merged) != 1 {
		t.Fatalf("expected 1 merged device record after dedupe, got %d", len(merged))
	}
	if len(backfilled) != 0 {
		t.Fatalf("expected 0 backfilled records after dedupe, got %d", len(backfilled))
	}
}

func TestInitWaCLI_FreshPairInitializesDeviceManager(t *testing.T) {
	t.Setenv("PAIPERWORK_WHATSAPP_FRESH_PAIR_STARTUP", "true")

	globalStateMu.Lock()
	deviceManager = nil
	log = waLog.Stdout("Test", "ERROR", false)
	globalStateMu.Unlock()
	t.Cleanup(func() {
		globalStateMu.Lock()
		deviceManager = nil
		globalStateMu.Unlock()
		_ = os.Unsetenv("PAIPERWORK_WHATSAPP_FRESH_PAIR_STARTUP")
	})

	client := InitWaCLI(context.Background(), &sqlstore.Container{}, nil, nil)
	if client != nil {
		t.Fatalf("expected nil client during fresh-pair startup, got non-nil")
	}

	dm := GetDeviceManager()
	if dm == nil {
		t.Fatalf("expected device manager to be initialized during fresh-pair startup")
	}
	if !dm.IsHealthy() {
		t.Fatalf("expected fresh-pair device manager to report healthy store state")
	}
	if err := dm.LoadExistingDevices(context.Background()); err != nil {
		t.Fatalf("expected fresh-pair device manager to allow empty device recovery path, got %v", err)
	}
	if inst, err := dm.CreateDevice(context.Background(), "fresh-device"); err != nil {
		t.Fatalf("expected fresh-pair device placeholder creation to succeed, got %v", err)
	} else if inst == nil || inst.ID() != "fresh-device" {
		t.Fatalf("expected created placeholder id fresh-device, got %#v", inst)
	}
}

func TestInitWaCLI_FreshPairPurgesPersistedStoreDevices(t *testing.T) {
	ctx := context.Background()
	dbPath := filepath.Join(t.TempDir(), "fresh-pair-whatsapp.db")
	storeContainer := InitWaDB(ctx, "file:"+dbPath+"?_foreign_keys=on&_journal_mode=WAL&_busy_timeout=5000")
	if storeContainer == nil {
		t.Fatalf("expected InitWaDB to return a store container")
	}
	t.Cleanup(func() {
		_ = storeContainer.Close()
	})

	seedDevice := storeContainer.NewDevice()
	seedJID := types.JID{User: "15551234567", Device: 55, Server: types.DefaultUserServer}
	seedDevice.ID = &seedJID
	seedDevice.Account = &waAdv.ADVSignedDeviceIdentity{
		Details:             []byte{1},
		AccountSignature:    make([]byte, 64),
		AccountSignatureKey: make([]byte, 32),
		DeviceSignature:     make([]byte, 64),
	}
	if err := storeContainer.PutDevice(ctx, seedDevice); err != nil {
		t.Fatalf("expected seed device to persist, got %v", err)
	}

	seededDevices, err := storeContainer.GetAllDevices(ctx)
	if err != nil {
		t.Fatalf("expected seeded device lookup to succeed, got %v", err)
	}
	if len(seededDevices) != 1 {
		t.Fatalf("expected 1 persisted store device before fresh-pair init, got %d", len(seededDevices))
	}

	t.Setenv("PAIPERWORK_WHATSAPP_FRESH_PAIR_STARTUP", "true")
	globalStateMu.Lock()
	deviceManager = nil
	log = waLog.Stdout("Test", "ERROR", false)
	globalStateMu.Unlock()
	t.Cleanup(func() {
		globalStateMu.Lock()
		deviceManager = nil
		globalStateMu.Unlock()
	})

	client := InitWaCLI(ctx, storeContainer, nil, nil)
	if client != nil {
		t.Fatalf("expected nil client during fresh-pair startup, got non-nil")
	}

	remainingDevices, err := storeContainer.GetAllDevices(ctx)
	if err != nil {
		t.Fatalf("expected post-purge device lookup to succeed, got %v", err)
	}
	if len(remainingDevices) != 0 {
		t.Fatalf("expected persisted store devices to be purged during fresh-pair init, got %d", len(remainingDevices))
	}
	if GetDeviceManager() == nil {
		t.Fatalf("expected fresh-pair startup to still initialize the device manager")
	}
}

func TestPromoteDeviceIdentity_RekeysPlaceholderToPairedDevice(t *testing.T) {
	dm := &DeviceManager{
		devices: make(map[string]*DeviceInstance),
	}
	placeholder := NewDeviceInstance("placeholder-id", nil, nil)
	dm.devices[placeholder.ID()] = placeholder

	promoted := dm.PromoteDeviceIdentity("placeholder-id", "15551234567:11@s.whatsapp.net", "15551234567@s.whatsapp.net")
	if promoted == nil {
		t.Fatalf("expected PromoteDeviceIdentity to return the promoted instance")
	}
	if promoted.ID() != "15551234567:11@s.whatsapp.net" {
		t.Fatalf("expected promoted device id to be updated, got %q", promoted.ID())
	}
	if promoted.JID() != "15551234567@s.whatsapp.net" {
		t.Fatalf("expected promoted JID to be updated, got %q", promoted.JID())
	}
	if _, ok := dm.GetDevice("placeholder-id"); ok {
		t.Fatalf("expected placeholder device key to be removed after promotion")
	}
	if resolved, ok := dm.GetDevice("15551234567:11@s.whatsapp.net"); !ok || resolved != promoted {
		t.Fatalf("expected promoted device to be available under its paired device id")
	}
}

func TestPromoteDeviceIdentity_RefusesCrossAccountPromotion(t *testing.T) {
	dm := &DeviceManager{
		devices: make(map[string]*DeviceInstance),
	}

	existing := NewDeviceInstance("8618520165968:66@s.whatsapp.net", nil, nil)
	existing.SetIdentityMetadata("", "8618520165968", "8618520165968@s.whatsapp.net")
	dm.devices[existing.ID()] = existing

	placeholder := NewDeviceInstance("8619802087305:27@s.whatsapp.net", nil, nil)
	dm.devices[placeholder.ID()] = placeholder

	promoted := dm.PromoteDeviceIdentity("8618520165968:66@s.whatsapp.net", "8619802087305:27@s.whatsapp.net", "8619802087305@s.whatsapp.net")
	if promoted != placeholder {
		t.Fatalf("expected cross-account promotion to keep the existing target placeholder")
	}
	if resolved, ok := dm.GetDevice("8618520165968:66@s.whatsapp.net"); !ok || resolved != existing {
		t.Fatalf("expected original device identity to remain intact")
	}
	if resolved, ok := dm.GetDevice("8619802087305:27@s.whatsapp.net"); !ok || resolved != placeholder {
		t.Fatalf("expected placeholder device to remain intact")
	}
	if existing.JID() != "8618520165968@s.whatsapp.net" {
		t.Fatalf("expected original device JID to remain unchanged, got %q", existing.JID())
	}
}
