package whatsapp

import (
	"context"
	"fmt"
	"strings"

	"github.com/aldinokemal/go-whatsapp-web-multidevice/config"
	"go.mau.fi/whatsmeow/store/sqlstore"
	waLog "go.mau.fi/whatsmeow/util/log"
)

// InitWaDB initializes the WhatsApp database connection
func InitWaDB(ctx context.Context, DBURI string) *sqlstore.Container {
	log = waLog.Stdout("Main", config.WhatsappLogLevel, true)
	dbLog := waLog.Stdout("Database", config.WhatsappLogLevel, true)

	// Guard: ensure memory mode includes required flags for SQLite initialization.
	if strings.HasPrefix(DBURI, "file::memory:") {
		if !strings.Contains(DBURI, "_foreign_keys=on") {
			log.Warnf("InitWaDB: memory DBURI missing _foreign_keys=on; patching it; old URI=%s", DBURI)
			if strings.Contains(DBURI, "?") {
				DBURI = DBURI + "&_foreign_keys=on"
			} else {
				DBURI = DBURI + "?_foreign_keys=on"
			}
		}
		if !strings.Contains(DBURI, "_journal_mode=WAL") {
			log.Warnf("InitWaDB: memory DBURI missing _journal_mode=WAL; patching it; old URI=%s", DBURI)
			if strings.Contains(DBURI, "?") {
				DBURI = DBURI + "&_journal_mode=WAL"
			} else {
				DBURI = DBURI + "?_journal_mode=WAL"
			}
		}
		if !strings.Contains(DBURI, "_busy_timeout=") {
			log.Warnf("InitWaDB: memory DBURI missing _busy_timeout; patching it; old URI=%s", DBURI)
			if strings.Contains(DBURI, "?") {
				DBURI = DBURI + "&_busy_timeout=5000"
			} else {
				DBURI = DBURI + "?_busy_timeout=5000"
			}
		}
	}

	storeContainer, err := initDatabase(ctx, dbLog, DBURI)
	if err != nil {
		log.Errorf("Database initialization error: %v", err)
		return nil
	}

	log.Infof("InitWaDB: initialized WhatsApp database container for URI=%s (db=%p)", DBURI, storeContainer)
	return storeContainer
}

// initDatabase creates and returns a database store container based on the configured URI
func initDatabase(ctx context.Context, dbLog waLog.Logger, DBURI string) (*sqlstore.Container, error) {
	// Strip surrounding quotes that may come from .env file parsing
	DBURI = strings.Trim(DBURI, `"'`)

	if strings.HasPrefix(DBURI, "file:") {
		return sqlstore.New(ctx, "sqlite3", DBURI, dbLog)
	} else if strings.HasPrefix(DBURI, "postgres:") {
		return sqlstore.New(ctx, "postgres", DBURI, dbLog)
	}

	return nil, fmt.Errorf("unknown database type: %s. Currently only sqlite3(file:) and postgres are supported", DBURI)
}

// GetConnectionStatus returns the current connection status of the global client
func GetConnectionStatus() (isConnected bool, isLoggedIn bool, deviceID string) {
	globalStateMu.RLock()
	currentClient := cli
	globalStateMu.RUnlock()
	if currentClient == nil {
		return false, false, ""
	}

	isConnected = currentClient.IsConnected()
	isLoggedIn = currentClient.IsLoggedIn()

	if currentClient.Store != nil && currentClient.Store.ID != nil {
		deviceID = currentClient.Store.ID.String()
	}

	return isConnected, isLoggedIn, deviceID
}
