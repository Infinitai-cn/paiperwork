package whatsapp

import (
	"context"
	"sync"
	"time"

	domainChatStorage "github.com/aldinokemal/go-whatsapp-web-multidevice/domains/chatstorage"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store/sqlstore"
)

var (
	autoReconnectMu     sync.Mutex
	autoReconnectCancel context.CancelFunc
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

func getStoreContainers() (*sqlstore.Container, *sqlstore.Container) {
	globalStateMu.RLock()
	defer globalStateMu.RUnlock()
	return db, keysDB
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

// StartAutoReconnectChecker starts a looping reconnect monitor for disconnected WhatsApp client.
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
		ticker := time.NewTicker(5 * time.Minute)
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
				if !cli.IsConnected() {
					log.Infof("StartAutoReconnectChecker: client disconnected; attempting reconnect")
					if err := cli.Connect(); err != nil {
						log.Warnf("StartAutoReconnectChecker: reconnect attempt failed: %v", err)
					}
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
	if deviceManager == nil {
		deviceManager = NewDeviceManager(storeContainer, keysStoreContainer, chatStorageRepo)
	}
	return deviceManager
}

// GetDeviceManager returns the global DeviceManager.
func GetDeviceManager() *DeviceManager {
	globalStateMu.RLock()
	defer globalStateMu.RUnlock()
	return deviceManager
}
