package whatsapp

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/aldinokemal/go-whatsapp-web-multidevice/config"
	domainChatStorage "github.com/aldinokemal/go-whatsapp-web-multidevice/domains/chatstorage"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store"
	"go.mau.fi/whatsmeow/store/sqlstore"
	waLog "go.mau.fi/whatsmeow/util/log"
)

// Type definitions
type ExtractedMedia struct {
	MediaPath string `json:"media_path"`
	MimeType  string `json:"mime_type"`
	Caption   string `json:"caption"`
}

// Global variables
var (
	globalStateMu sync.RWMutex
	cli           *whatsmeow.Client
	db            *sqlstore.Container // Add global database reference for cleanup
	keysDB        *sqlstore.Container
	deviceManager *DeviceManager
	log           waLog.Logger
	startupTime   = time.Now().Unix()
)

func syncKeysDevice(ctx context.Context, db, keysDB *sqlstore.Container) {
	if keysDB == nil {
		return
	}

	dev, err := db.GetFirstDevice(ctx)
	if err != nil {
		if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
			log.Warnf("Failed to get all devices (canceled): %v", err)
		} else {
			log.Errorf("Failed to get all devices: %v", err)
		}
	} else {
		found := false
		if devs, err := keysDB.GetAllDevices(ctx); err != nil {
			log.Errorf("Failed to get all devices: %v", err)
		} else {
			for _, d := range devs {
				if d.ID == dev.ID {
					found = true
					break
				} else {
					keysDB.DeleteDevice(ctx, d)
				}
			}

			if !found {
				keysDB.PutDevice(ctx, dev)
			}
		}
	}
}

// InitWaCLI initializes the WhatsApp client
func InitWaCLI(ctx context.Context, storeContainer, keysStoreContainer *sqlstore.Container, chatStorageRepo domainChatStorage.IChatStorageRepository) *whatsmeow.Client {
	if storeContainer == nil {
		log.Infof("InitWaCLI: storeContainer is nil, skipping WhatsApp client init")
		return nil
	}

	log.Infof("InitWaCLI: attempting WhatsApp client init using DB container %p", storeContainer)

	var device *store.Device
	var err error
	for attempt := 1; attempt <= 5; attempt++ {
		if storeContainer == nil {
			log.Warnf("InitWaCLI: storeContainer is nil on attempt %d - reinitializing", attempt)
			storeContainer = InitWaDB(ctx, config.DBURI)
			if storeContainer == nil {
				log.Errorf("InitWaCLI: failed to reinitialize WhatsApp DB container")
				return nil
			}
		}

		device, err = storeContainer.GetFirstDevice(ctx)
		if err == nil {
			break
		}

		if strings.Contains(strings.ToLower(err.Error()), "database is closed") {
			log.Warnf("InitWaCLI: database is closed on attempt %d/5, reopening DB container and retrying: %v", attempt, err)
			_ = storeContainer.Close()
			storeContainer = InitWaDB(ctx, config.DBURI)
			if storeContainer == nil {
				log.Errorf("InitWaCLI: failed to reopen DB container after closed error")
				return nil
			}
			log.Infof("InitWaCLI: reopened database container %p after closed error", storeContainer)
			time.Sleep(time.Duration(attempt*200) * time.Millisecond)
			continue
		}

		log.Errorf("Failed to get device: %v", err)
		return nil
	}

	if err != nil {
		log.Errorf("InitWaCLI: failed to get device after retries: %v", err)
		return nil
	}

	if device == nil {
		log.Warnf("No device found in WhatsApp DB")
		if config.WhatsappPreferredDeviceID != "" {
			log.Infof("Trying preferred device ID from config: %s", config.WhatsappPreferredDeviceID)
			// Here we cannot directly create a nina device; we continue with nil and allow /devices endpoints to handle.
		}
		return nil
	}

	// Configure device properties
	osName := fmt.Sprintf("%s %s", config.AppOs, config.AppVersion)
	store.DeviceProps.PlatformType = &config.AppPlatform
	store.DeviceProps.Os = &osName

	// Keep references for global state update after client creation
	primaryDB := storeContainer
	keysContainer := keysStoreContainer

	// Configure a separated database for accelerating encryption caching.
	// For PreKeys we stay on primary DB to avoid cases where the separate key DB closes
	// earlier (e.g., during restart/cleanup) and causes "database is closed" errors.
	if keysContainer != nil && device.ID != nil {
		innerStore := sqlstore.NewSQLStore(keysStoreContainer, *device.ID)

		syncKeysDevice(ctx, primaryDB, keysContainer)
		device.Identities = innerStore
		device.Sessions = innerStore
		if primaryDB != nil {
			device.PreKeys = sqlstore.NewSQLStore(primaryDB, *device.ID)
			log.Infof("InitWaCLI: prekeys store is configured on primary DB %p for device %s", primaryDB, device.ID.String())
		} else {
			device.PreKeys = store.NoopDevice.PreKeys
			log.Warnf("InitWaCLI: primary DB is nil; using Noop prekeys store for device %s", device.ID.String())
		}
		device.SenderKeys = innerStore
		device.MsgSecrets = innerStore
		device.PrivacyTokens = innerStore
	}

	instanceID := ""
	if device.ID != nil {
		instanceID = device.ID.String()
	}

	// Create and configure the client with filtered logging to avoid noisy reconnection EOF errors
	baseLogger := waLog.Stdout("Client", config.WhatsappLogLevel, true)
	client := whatsmeow.NewClient(device, newFilteredLogger(baseLogger))
	client.EnableAutoReconnect = true
	client.AutoTrustIdentity = true

	// Start periodic auto reconnect watchdog so server stop/start controls reconnect attempts.
	StartAutoReconnectChecker(client)

	deviceRepo := newDeviceChatStorage(instanceID, chatStorageRepo)
	instance := NewDeviceInstance(instanceID, client, deviceRepo)

	client.AddEventHandler(func(rawEvt interface{}) {
		handler(ctx, instance, rawEvt)
	})

	// Register device instance in the manager for multi-device awareness
	// Use EnsureDefault to avoid creating duplicates when a device with matching JID already exists
	if device.ID != nil {
		instanceID = device.ID.String()
	}
	dm := InitializeDeviceManager(storeContainer, keysStoreContainer, deviceRepo)
	if dm != nil && instanceID != "" {
		dm.EnsureDefault(instance)
		instance.SetOnLoggedOut(func(deviceID string) {
			dm.RemoveDevice(deviceID)
		})
	}

	globalStateMu.Lock()
	cli = client
	db = primaryDB
	keysDB = keysContainer
	globalStateMu.Unlock()

	return client
}
