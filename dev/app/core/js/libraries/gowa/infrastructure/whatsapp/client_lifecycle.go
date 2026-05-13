package whatsapp

import (
	"context"
	"strings"
	"sync"
	"time"

	domainChatStorage "github.com/aldinokemal/go-whatsapp-web-multidevice/domains/chatstorage"
	"github.com/aldinokemal/go-whatsapp-web-multidevice/pkg/logmask"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store/sqlstore"
)

var (
	autoReconnectMu     sync.Mutex
	autoReconnectCancel context.CancelFunc
	autoRecoverMu       sync.Mutex
	autoRecoverLastTry  = make(map[string]time.Time)
)

const (
	autoReconnectCheckInterval = 30 * time.Second
	autoReconnectRetryCooldown = 20 * time.Second
)

// UpdateGlobalClient updates the global cli variable with a new client instance
// This is needed when reinitializing the client after logout to ensure all
// infrastructure code uses the new client instance
func UpdateGlobalClient(newCli *whatsmeow.Client, newDB *sqlstore.Container) {
	globalStateMu.Lock()
	cli = newCli
	db = newDB
	globalStateMu.Unlock()
	log.Infof("Global WhatsApp client updated successfully")
}

// GetClient returns the current global client instance (alias for GetGlobalClient)
func GetClient() *whatsmeow.Client {
	globalStateMu.RLock()
	defer globalStateMu.RUnlock()
	return cli
}

// Get DB instance
func GetDB() *sqlstore.Container {
	globalStateMu.RLock()
	defer globalStateMu.RUnlock()
	return db
}

func ResetStateOnShutdown() {
	StopAutoReconnectChecker()
	globalStateMu.Lock()
	defer globalStateMu.Unlock()

	if cli != nil {
		log.Infof("ResetStateOnShutdown: disconnecting existing WhatsApp client")
		cli.EnableAutoReconnect = false
		cli.Disconnect()
		cli = nil
	}

	if deviceManager != nil {
		log.Infof("ResetStateOnShutdown: clearing device manager and disconnecting devices")
		for _, inst := range deviceManager.ListDevices() {
			if inst != nil && inst.GetClient() != nil {
				inst.GetClient().EnableAutoReconnect = false
				inst.GetClient().Disconnect()
			}
		}
		deviceManager = nil
	}

	if db != nil {
		log.Infof("ResetStateOnShutdown: closing primary WhatsApp DB")
		_ = db.Close()
		db = nil
	}

	if keysDB != nil && keysDB != db {
		log.Infof("ResetStateOnShutdown: closing secondary WhatsApp keys DB")
		_ = keysDB.Close()
		keysDB = nil
	}
}

func triggerReconnectForClient(cli *whatsmeow.Client, deviceID string, reason string) bool {
	if cli == nil {
		return false
	}

	trimmedDeviceID := strings.TrimSpace(deviceID)
	if trimmedDeviceID == "" {
		if clientStore := cli.Store; clientStore != nil && clientStore.ID != nil {
			trimmedDeviceID = clientStore.ID.String()
		}
	}
	if strings.TrimSpace(trimmedDeviceID) == "" {
		return false
	}

	autoRecoverMu.Lock()
	if lastAttempt, ok := autoRecoverLastTry[trimmedDeviceID]; ok && time.Since(lastAttempt) < autoReconnectRetryCooldown {
		autoRecoverMu.Unlock()
		return false
	}
	autoRecoverLastTry[trimmedDeviceID] = time.Now()
	autoRecoverMu.Unlock()

	go func() {
		maskedDeviceID := logmask.MaskPhoneNumber(trimmedDeviceID)
		log.Infof("[AUTO-RECOVER][%s] attempting reconnect (%s)", maskedDeviceID, strings.TrimSpace(reason))

		cli.EnableAutoReconnect = true
		if cli.IsConnected() && !cli.IsLoggedIn() {
			cli.Disconnect()
			time.Sleep(500 * time.Millisecond)
		}

		if err := cli.Connect(); err != nil {
			log.Warnf("[AUTO-RECOVER][%s] reconnect attempt failed: %v", maskedDeviceID, err)
			return
		}

		connected := cli.IsConnected()
		loggedIn := cli.IsLoggedIn()
		log.Infof("[AUTO-RECOVER][%s] reconnect attempt completed connected=%v loggedIn=%v", maskedDeviceID, connected, loggedIn)
	}()

	return true
}

func TriggerReconnectForDeviceID(deviceID string, reason string) bool {
	trimmedDeviceID := strings.TrimSpace(deviceID)
	if trimmedDeviceID == "" {
		return false
	}

	if manager := GetDeviceManager(); manager != nil {
		if instance, ok := manager.GetDevice(trimmedDeviceID); ok && instance != nil {
			return triggerReconnectForClient(instance.GetClient(), instance.ID(), reason)
		}
	}

	if current := GetClient(); current != nil {
		return triggerReconnectForClient(current, trimmedDeviceID, reason)
	}

	return false
}

// StartAutoReconnectChecker starts a looping reconnect monitor for unhealthy WhatsApp client state.
func StartAutoReconnectChecker(cli *whatsmeow.Client) {
	if cli == nil {
		return
	}
	autoReconnectMu.Lock()
	defer autoReconnectMu.Unlock()

	if autoReconnectCancel != nil {
		autoReconnectCancel()
	}

	ctx, cancel := context.WithCancel(context.Background())
	autoReconnectCancel = cancel

	// Enable built in whatsmeow auto reconnect as a baseline.
	cli.EnableAutoReconnect = true

	go func() {
		ticker := time.NewTicker(autoReconnectCheckInterval)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				log.Infof("StopAutoReconnectChecker: stopped auto-reconnect loop")
				return
			case <-ticker.C:
				if cli == nil {
					continue
				}
				if !cli.IsConnected() || !cli.IsLoggedIn() {
					reason := "periodic health check"
					if cli.IsConnected() && !cli.IsLoggedIn() {
						reason = "connected without login state"
					}
					_ = triggerReconnectForClient(cli, "", reason)
				}
			}
		}
	}()
}

func StopAutoReconnectChecker() {
	autoReconnectMu.Lock()
	defer autoReconnectMu.Unlock()

	if autoReconnectCancel != nil {
		autoReconnectCancel()
		autoReconnectCancel = nil
	}
}

// InitializeDeviceManager creates the global DeviceManager if it doesn't exist.
func InitializeDeviceManager(storeContainer, keysStoreContainer *sqlstore.Container, chatStorageRepo domainChatStorage.IChatStorageRepository) *DeviceManager {
	globalStateMu.Lock()
	defer globalStateMu.Unlock()
	persistedChatStorageRepo = chatStorageRepo
	if deviceManager == nil {
		deviceManager = NewDeviceManager(storeContainer, keysStoreContainer, chatStorageRepo)
	} else {
		deviceManager.store = storeContainer
		deviceManager.keys = keysStoreContainer
		deviceManager.storage = chatStorageRepo
	}
	return deviceManager
}

// GetDeviceManager returns the global DeviceManager.
func GetDeviceManager() *DeviceManager {
	globalStateMu.RLock()
	defer globalStateMu.RUnlock()
	return deviceManager
}
