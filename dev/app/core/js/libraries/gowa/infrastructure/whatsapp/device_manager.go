package whatsapp

import (
	"context"
	"errors"
	"fmt"
	"slices"
	"strings"
	"sync"
	"time"

	"github.com/aldinokemal/go-whatsapp-web-multidevice/config"
	domainChatStorage "github.com/aldinokemal/go-whatsapp-web-multidevice/domains/chatstorage"
	domainDevice "github.com/aldinokemal/go-whatsapp-web-multidevice/domains/device"
	"github.com/aldinokemal/go-whatsapp-web-multidevice/pkg/logmask"
	"github.com/sirupsen/logrus"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types"
	waLog "go.mau.fi/whatsmeow/util/log"
)

// DeviceManager keeps a registry of active device instances.
type DeviceManager struct {
	mu       sync.RWMutex
	devices  map[string]*DeviceInstance
	store    *sqlstore.Container
	keys     *sqlstore.Container
	storage  domainChatStorage.IChatStorageRepository
	initted  bool
	initOnce sync.Once
}

func NewDeviceManager(store *sqlstore.Container, keys *sqlstore.Container, chatStorageRepo domainChatStorage.IChatStorageRepository) *DeviceManager {
	return &DeviceManager{
		devices: make(map[string]*DeviceInstance),
		store:   store,
		keys:    keys,
		storage: chatStorageRepo,
	}
}

func (m *DeviceManager) AddDevice(instance *DeviceInstance) {
	if instance == nil || instance.ID() == "" {
		return
	}

	m.mu.Lock()
	defer m.mu.Unlock()
	m.devices[instance.ID()] = instance

	// Persist registry entry if available
	if m.storage != nil {
		_ = m.storage.SaveDeviceRecord(&domainChatStorage.DeviceRecord{
			DeviceID:    instance.ID(),
			DisplayName: instance.DisplayName(),
			JID:         instance.JID(),
			CreatedAt:   instance.CreatedAt(),
			UpdatedAt:   time.Now(),
		})
	}
}

func (m *DeviceManager) GetDevice(id string) (*DeviceInstance, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	instance, ok := m.devices[id]
	return instance, ok
}

// IsHealthy returns true if the device manager is initialized and has a valid store connection.
// Note: This is a service initialization check, not a live connectivity check.
// Returning true indicates the internal store is ready, but does not guarantee
// that any WhatsApp device connections are currently active or authenticated.
func (m *DeviceManager) IsHealthy() bool {
	if m == nil {
		return false
	}
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.store != nil
}

// DefaultDevice returns the only registered device when running in single-device mode.
func (m *DeviceManager) DefaultDevice() *DeviceInstance {
	if m == nil {
		return nil
	}

	m.mu.RLock()
	defer m.mu.RUnlock()

	if len(m.devices) != 1 {
		return nil
	}

	for _, inst := range m.devices {
		return inst
	}

	return nil
}

// ResolveDevice attempts to locate a device by ID or falls back to the default/only device.
// It returns the resolved instance, the ID used, or an error when no suitable device is found.
func (m *DeviceManager) ResolveDevice(deviceID string) (*DeviceInstance, string, error) {
	if m == nil {
		return nil, "", fmt.Errorf("device manager not initialized")
	}

	trimmedID := strings.TrimSpace(deviceID)
	if trimmedID != "" {
		if inst, ok := m.GetDevice(trimmedID); ok && inst != nil {
			return inst, trimmedID, nil
		}
		return nil, trimmedID, fmt.Errorf("device %s not found", trimmedID)
	}

	if inst := m.DefaultDevice(); inst != nil {
		return inst, inst.ID(), nil
	}

	return nil, "", fmt.Errorf("device id is required")
}

func (m *DeviceManager) RemoveDevice(id string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.devices, id)

	if m.storage != nil && strings.TrimSpace(id) != "" {
		_ = m.storage.DeleteDeviceRecord(id)
	}
}

func (m *DeviceManager) pruneStaleRecordsForLoggedInInstance(_ *DeviceInstance) {
	// Automatic stale-device pruning is disabled to preserve user-managed WhatsApp devices.
	// Device removal should only happen through explicit user actions.
}

// PurgeDevice cleanly logs out a device, removes its persisted records (store/keys),
// deletes its chatstorage data, and removes it from the in-memory registry.
func (m *DeviceManager) PurgeDevice(ctx context.Context, deviceID string) error {
	if deviceID == "" {
		return fmt.Errorf("device id is required")
	}

	var firstErr error
	recordErr := func(err error) {
		if err != nil {
			firstErr = errors.Join(firstErr, err)
		}
	}

	// Attempt logout/disconnect if a client exists
	if inst, ok := m.GetDevice(deviceID); ok && inst != nil {
		if cli := inst.GetClient(); cli != nil {
			if err := cli.Logout(ctx); err != nil {
				logrus.WithError(err).Warnf("[DEVICE_MANAGER] logout failed for device %s", logmask.MaskPhoneNumber(deviceID))
				recordErr(err)
			}
			cli.Disconnect()
		}
	}

	// Delete chatstorage data and registry record for this device (PaiperworkDB only)
	if m.storage != nil {
		if err := m.storage.DeleteDeviceData(deviceID); err != nil {
			logrus.WithError(err).Warnf("[DEVICE_MANAGER] failed to delete chatstorage for device %s", logmask.MaskPhoneNumber(deviceID))
			recordErr(err)
		}
		if err := m.storage.DeleteDeviceRecord(deviceID); err != nil {
			logrus.WithError(err).Warnf("[DEVICE_MANAGER] failed to delete device record for device %s", logmask.MaskPhoneNumber(deviceID))
			recordErr(err)
		}
	}

	// Remove from in-memory registry last
	m.RemoveDevice(deviceID)
	return firstErr
}

// PurgeLoggedOutDevice removes persisted state for a device that was already
// logged out remotely from the phone, without attempting another logout call.
func (m *DeviceManager) PurgeLoggedOutDevice(ctx context.Context, deviceID string) error {
	if deviceID == "" {
		return fmt.Errorf("device id is required")
	}

	logrus.Infof("[DEVICE_MANAGER] PurgeLoggedOutDevice begin device=%s", logmask.MaskPhoneNumber(deviceID))

	var firstErr error
	recordErr := func(err error) {
		if err != nil {
			firstErr = errors.Join(firstErr, err)
		}
	}

	registryFound := false
	chatStorageDeleted := false

	if inst, ok := m.GetDevice(deviceID); ok && inst != nil {
		registryFound = true
		if cli := inst.GetClient(); cli != nil {
			cli.EnableAutoReconnect = false
			cli.Disconnect()
		}
	}

	if m.storage != nil {
		if err := m.storage.DeleteDeviceData(deviceID); err != nil {
			logrus.WithError(err).Warnf("[DEVICE_MANAGER] failed to delete chatstorage for remotely logged-out device %s", logmask.MaskPhoneNumber(deviceID))
			recordErr(err)
		} else {
			chatStorageDeleted = true
		}
		if err := m.storage.DeleteDeviceRecord(deviceID); err != nil {
			logrus.WithError(err).Warnf("[DEVICE_MANAGER] failed to delete device record for remotely logged-out device %s", logmask.MaskPhoneNumber(deviceID))
			recordErr(err)
		}
	}

	m.RemoveDevice(deviceID)
	logrus.Infof("[DEVICE_MANAGER] PurgeLoggedOutDevice complete device=%s registry_found=%v chatstorage_deleted=%v err=%v", logmask.MaskPhoneNumber(deviceID), registryFound, chatStorageDeleted, firstErr)
	return firstErr
}

// CreateDevice registers a new device using the provided device ID.
func (m *DeviceManager) CreateDevice(ctx context.Context, requestedID string) (*DeviceInstance, error) {
	if m == nil {
		return nil, fmt.Errorf("device manager not initialized")
	}

	id := strings.TrimSpace(requestedID)
	if id == "" {
		return nil, fmt.Errorf("device id is required")
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	if existing, exists := m.devices[id]; exists {
		return existing, nil
	}

	instance := NewDeviceInstance(id, nil, newDeviceChatStorage(id, m.storage))
	m.devices[id] = instance

	if m.storage != nil {
		if err := m.storage.SaveDeviceRecord(&domainChatStorage.DeviceRecord{
			DeviceID:    id,
			DisplayName: instance.DisplayName(),
			JID:         instance.JID(),
			CreatedAt:   instance.CreatedAt(),
			UpdatedAt:   instance.CreatedAt(),
		}); err != nil {
			logrus.WithError(err).Warnf("[DEVICE_MANAGER] failed to persist device %s", logmask.MaskPhoneNumber(id))
		}
	}

	logrus.WithContext(ctx).Infof("[DEVICE_MANAGER] created device %s", logmask.MaskPhoneNumber(id))
	return instance, nil
}

func (m *DeviceManager) ListDevices() []*DeviceInstance {
	m.mu.RLock()
	defer m.mu.RUnlock()

	result := make([]*DeviceInstance, 0, len(m.devices))
	for _, instance := range m.devices {
		result = append(result, instance)
	}

	// Sort by CreatedAt ascending (oldest first) for stable UI ordering.
	// Use ID as tie-breaker when CreatedAt is equal.
	slices.SortFunc(result, func(a, b *DeviceInstance) int {
		if cmp := a.CreatedAt().Compare(b.CreatedAt()); cmp != 0 {
			return cmp
		}
		return strings.Compare(a.ID(), b.ID())
	})

	return result
}

// LoadExistingDevices registers existing device records in the store container without connecting them.
// This keeps the registry aware of all device IDs even before their clients are initialized.
func (m *DeviceManager) LoadExistingDevices(ctx context.Context) error {
	if m == nil || m.storage == nil {
		return fmt.Errorf("device manager not initialized or storage missing")
	}

	m.initOnce.Do(func() {
		m.initted = true
	})

	if IsFreshPairStartupRequested() {
		m.mu.Lock()
		m.devices = make(map[string]*DeviceInstance)
		m.mu.Unlock()
		logrus.Info("[DEVICE_MANAGER] fresh-pair startup requested; skipping persisted device recovery from Paiperwork DB")
		return nil
	}

	records, err := m.storage.ListDeviceRecords()
	if err != nil {
		logrus.WithError(err).Warn("[DEVICE_MANAGER] failed to enumerate persisted WhatsApp device registry records from Paiperwork DB")
		if hasTable, tableErr := m.storage.HasTable("devices"); tableErr != nil {
			logrus.WithError(tableErr).Warn("[DEVICE_MANAGER] failed to verify chat storage devices table in Paiperwork WhatsApp DB")
		} else {
			logrus.Infof("[DEVICE_MANAGER] chat storage devices table exists=%t path=%s", hasTable, config.ChatStorageURI)
		}
		return err
	}

	if len(records) > 0 {
		logrus.Infof("[DEVICE_MANAGER] discovered %d persisted device registry records in Paiperwork WhatsApp DB", len(records))
		for _, rec := range records {
			if rec == nil || strings.TrimSpace(rec.DeviceID) == "" {
				continue
			}

			jid := strings.TrimSpace(rec.JID)
			if jid == "" {
				jid = strings.TrimSpace(rec.DeviceID)
			}

			m.mu.RLock()
			_, existsByID := m.devices[rec.DeviceID]
			m.mu.RUnlock()
			if existsByID {
				continue
			}

			instance := NewDeviceInstance(rec.DeviceID, nil, newDeviceChatStorage(rec.DeviceID, m.storage))
			instance.SetIdentityMetadata(rec.DisplayName, normalizePhoneFromJID(jid), jid)
			instance.SetState(domainDevice.DeviceStateDisconnected)

			m.mu.Lock()
			m.devices[rec.DeviceID] = instance
			m.mu.Unlock()
		}
	} else {
		if hasTable, tableErr := m.storage.HasTable("devices"); tableErr != nil {
			logrus.WithError(tableErr).Warn("[DEVICE_MANAGER] failed to verify chat storage devices table in Paiperwork WhatsApp DB")
		} else {
			logrus.Infof("[DEVICE_MANAGER] discovered 0 persisted device records in Paiperwork WhatsApp DB path=%s devices_table_exists=%t", config.ChatStorageURI, hasTable)
		}
	}

	return nil
}

// EnsureDefault registers the current global client as the default device if present.
// It checks both by device ID and by JID to avoid creating duplicates.
func (m *DeviceManager) EnsureDefault(client *DeviceInstance) {
	if client == nil || client.ID() == "" {
		return
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	// Check if device exists by ID
	if _, ok := m.devices[client.ID()]; ok {
		return
	}

	// Check if any existing device has matching JID
	clientJID := client.JID()
	if clientJID != "" {
		for _, inst := range m.devices {
			if inst.JID() == clientJID {
				// Update existing device with the new client
				inst.SetClient(client.GetClient())
				return
			}
		}
	}

	m.devices[client.ID()] = client
}

// EnsureClient returns a device instance with an initialized WhatsApp client.
// It lazily creates the underlying store device and registers event handlers.
func (m *DeviceManager) EnsureClient(ctx context.Context, deviceID string) (*DeviceInstance, error) {
	if m == nil {
		return nil, fmt.Errorf("device manager not initialized")
	}

	inst := m.ensureInstance(deviceID)
	if existing := inst.GetClient(); existing != nil {
		inst.UpdateStateFromClient()
		return inst, nil
	}

	storeDevice, err := m.getOrCreateStoreDevice(ctx, deviceID)
	if err != nil {
		return nil, err
	}

	configureDeviceProps()

	if err := m.configureKeysStore(ctx, storeDevice); err != nil {
		return nil, fmt.Errorf("failed to configure keys store: %w", err)
	}

	baseLogger := waLog.Stdout(fmt.Sprintf("Client-%s", deviceID), config.WhatsappLogLevel, true)
	client := whatsmeow.NewClient(storeDevice, newFilteredLogger(baseLogger))
	client.EnableAutoReconnect = true
	client.AutoTrustIdentity = true

	repo := inst.GetChatStorage()
	if repo == nil {
		repo = newDeviceChatStorage(deviceID, m.storage)
		inst.SetChatStorage(repo)
	}

	client.AddEventHandler(func(rawEvt interface{}) {
		handler(ctx, inst, rawEvt)
	})

	inst.SetOnLoggedOut(func(deviceID string) {
		if err := m.PurgeLoggedOutDevice(context.Background(), deviceID); err != nil {
			logrus.WithError(err).Warnf("[DEVICE_MANAGER] remote logout purge completed with warnings for %s", logmask.MaskPhoneNumber(deviceID))
		}
	})

	inst.SetClient(client)
	inst.UpdateStateFromClient()

	return inst, nil
}

func (m *DeviceManager) ensureInstance(deviceID string) *DeviceInstance {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Check by device ID first
	if inst, ok := m.devices[deviceID]; ok {
		if inst.GetChatStorage() == nil {
			storageDeviceID := inst.JID()
			if storageDeviceID == "" {
				storageDeviceID = deviceID
			}
			inst.SetChatStorage(newDeviceChatStorage(storageDeviceID, m.storage))
		}
		return inst
	}

	// Check if any existing device has this as its JID (deviceID might be a JID)
	for _, inst := range m.devices {
		if inst.JID() == deviceID {
			if inst.GetChatStorage() == nil {
				storageDeviceID := inst.JID()
				if storageDeviceID == "" {
					storageDeviceID = inst.ID()
				}
				inst.SetChatStorage(newDeviceChatStorage(storageDeviceID, m.storage))
			}
			return inst
		}
	}

	inst := NewDeviceInstance(deviceID, nil, newDeviceChatStorage(deviceID, m.storage))
	m.devices[deviceID] = inst
	return inst
}

func (m *DeviceManager) getOrCreateStoreDevice(ctx context.Context, deviceID string) (*store.Device, error) {
	if m.store == nil {
		return nil, fmt.Errorf("store container is nil")
	}

	// Try to reuse an existing device record if the ID maps to a JID.
	if deviceID != "" {
		if jid, err := types.ParseJID(deviceID); err == nil {
			if dev, err := m.store.GetDevice(ctx, jid); err == nil && dev != nil {
				return dev, nil
			}
		}

		// If deviceID is not a valid JID, look up the device instance and use its JID
		m.mu.RLock()
		var instJID string
		if inst, ok := m.devices[deviceID]; ok && inst.JID() != "" {
			instJID = inst.JID()
		}
		m.mu.RUnlock()

		if instJID != "" {
			if jid, err := types.ParseJID(instJID); err == nil {
				if dev, err := m.store.GetDevice(ctx, jid); err == nil && dev != nil {
					return dev, nil
				}
				// Fallback: iterate all devices to find one with matching User (ignoring AD-ID)
				// This handles cases where registry has Non-AD JID but store has full JID
				if allDevices, err := m.store.GetAllDevices(ctx); err == nil {
					targetUser := jid.User
					for _, d := range allDevices {
						if d != nil && d.ID != nil && d.ID.User == targetUser {
							return d, nil
						}
					}
				}
			}
		}
	}

	return m.store.NewDevice(), nil
}

func (m *DeviceManager) configureKeysStore(ctx context.Context, device *store.Device) error {
	if m.keys == nil || device == nil || device.ID == nil {
		log.Warnf("configureKeysStore: missing store or device info; cannot configure keys/prekeys")
		return nil
	}

	// Prefer the dedicated key storage for identities, sessions, sender keys, etc.
	// But keep PreKeys on the main WhatsApp store to avoid cross-container close/sync issues.
	// This also ensures compatibility with PaiperworkDB (single-DB setups) and prevents
	// "database is closed" prekey failures when incremental key store is reused.
	innerStore := sqlstore.NewSQLStore(m.keys, *device.ID)
	syncKeysDevice(ctx, m.store, m.keys)

	device.Identities = innerStore
	device.Sessions = innerStore
	// PreKeys are sensitive to container lifecycle; keep them on primary store for reliability.
	if m.store != nil {
		device.PreKeys = sqlstore.NewSQLStore(m.store, *device.ID)
		log.Infof("configureKeysStore: prekeys are now on primary DB %p for device %s", m.store, logmask.MaskPhoneNumber(device.ID.String()))
	} else {
		// If we don't have m.store for whatever reason, fallback to a noop prekey store to avoid panic.
		device.PreKeys = store.NoopDevice.PreKeys
		log.Warnf("configureKeysStore: primary store missing; using Noop prekeys for device %s", logmask.MaskPhoneNumber(device.ID.String()))
	}
	device.SenderKeys = innerStore
	device.MsgSecrets = innerStore
	device.PrivacyTokens = innerStore
	return nil
}

func configureDeviceProps() {
	osName := fmt.Sprintf("%s %s", config.AppOs, config.AppVersion)
	store.DeviceProps.PlatformType = &config.AppPlatform
	store.DeviceProps.Os = &osName
}

// StoreInfo returns configured store URIs for observability.
func (m *DeviceManager) StoreInfo() (dbURI, keysURI string) {
	if m == nil {
		return "", ""
	}
	return config.DBURI, config.DBKeysURI
}
