package whatsapp

import (
	"context"
	"fmt"
	"strings"

	"github.com/aldinokemal/go-whatsapp-web-multidevice/config"
	"github.com/aldinokemal/go-whatsapp-web-multidevice/pkg/embeddedsafe"
	"github.com/aldinokemal/go-whatsapp-web-multidevice/pkg/sqliteutil"
	"go.mau.fi/whatsmeow/store/sqlstore"
	waLog "go.mau.fi/whatsmeow/util/log"
)

func isRecoverableUpgradeConflict(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	if !strings.Contains(msg, "already exists") {
		return false
	}
	return strings.Contains(msg, "whatsmeow_") || strings.Contains(msg, "v0->v")
}

func upgradeConflictReason(err error) string {
	if err == nil {
		return ""
	}
	msg := strings.ToLower(err.Error())
	if strings.Contains(msg, "already exists") && strings.Contains(msg, "whatsmeow_") {
		return "duplicate-whatsmeow-table"
	}
	if strings.Contains(msg, "already exists") && strings.Contains(msg, "v0->v") {
		return "duplicate-schema-migration-step"
	}
	return "unknown"
}

func isForbiddenNoDiskURI(uri string) bool {
	trimmed := strings.TrimSpace(strings.Trim(uri, `"'`))
	if trimmed == "" {
		return false
	}
	lower := strings.ToLower(trimmed)
	return strings.Contains(lower, "storages/whatsapp.db") || strings.Contains(lower, "storages/chatstorage.db")
}

func isInMemoryNoDiskURI(uri string) bool {
	trimmed := strings.TrimSpace(strings.Trim(uri, `"'`))
	if trimmed == "" {
		return false
	}
	lower := strings.ToLower(trimmed)
	return strings.HasPrefix(lower, "file::memory") || strings.Contains(lower, "mode=memory")
}

func patchMemorySQLiteURI(dbURI string) string {
	if !strings.HasPrefix(dbURI, "file::memory:") {
		return dbURI
	}

	if !strings.Contains(dbURI, "_foreign_keys=on") {
		log.Warnf("InitWaStoreContainer: memory DBURI missing _foreign_keys=on; patching it; old URI=%s", dbURI)
		if strings.Contains(dbURI, "?") {
			dbURI = dbURI + "&_foreign_keys=on"
		} else {
			dbURI = dbURI + "?_foreign_keys=on"
		}
	}
	if !strings.Contains(dbURI, "_journal_mode=WAL") {
		log.Warnf("InitWaStoreContainer: memory DBURI missing _journal_mode=WAL; patching it; old URI=%s", dbURI)
		if strings.Contains(dbURI, "?") {
			dbURI = dbURI + "&_journal_mode=WAL"
		} else {
			dbURI = dbURI + "?_journal_mode=WAL"
		}
	}
	if !strings.Contains(dbURI, "_busy_timeout=") {
		log.Warnf("InitWaStoreContainer: memory DBURI missing _busy_timeout; patching it; old URI=%s", dbURI)
		if strings.Contains(dbURI, "?") {
			dbURI = dbURI + "&_busy_timeout=5000"
		} else {
			dbURI = dbURI + "?_busy_timeout=5000"
		}
	}

	return dbURI
}

func openWaStoreContainer(ctx context.Context, dbLog waLog.Logger, dbURI string) (*sqlstore.Container, error) {
	dbURI = strings.Trim(dbURI, `"'`)

	if strings.HasPrefix(dbURI, "file:") {
		sqlDB, err := sqliteutil.Open(dbURI)
		if err != nil {
			return nil, fmt.Errorf("failed to open sqlite database: %w", err)
		}

		container := sqlstore.NewWithDB(sqlDB, "sqlite3", dbLog)
		if err := container.Upgrade(ctx); err != nil {
			if isRecoverableUpgradeConflict(err) {
				reason := upgradeConflictReason(err)
				log.Warnf("[WA_DB_UPGRADE_RECOVERED] reason=%s uri=%s detail=%v", reason, dbURI, err)
				log.Warnf("InitWaStoreContainer: continuing after recoverable sqlite upgrade conflict for URI=%s", dbURI)
				return container, nil
			}
			_ = sqlDB.Close()
			return nil, fmt.Errorf("failed to upgrade sqlite database: %w", err)
		}
		return container, nil
	}

	if strings.HasPrefix(dbURI, "postgres:") {
		return sqlstore.New(ctx, "postgres", dbURI, dbLog)
	}

	return nil, fmt.Errorf("unknown database type: %s. Currently only sqlite3(file:) and postgres are supported", dbURI)
}

// InitWaStoreContainer initializes the WhatsApp store container from a DB URI.
func InitWaStoreContainer(ctx context.Context, dbURI string) *sqlstore.Container {
	if config.RuntimeNoDisk() {
		trimmed := strings.TrimSpace(strings.Trim(dbURI, `"'`))
		if trimmed == "" {
			embeddedsafe.Fatal("InitWaStoreContainer: no-disk mode requires an in-memory gowa DB URI")
		}
		if isForbiddenNoDiskURI(trimmed) {
			embeddedsafe.Fatalf("InitWaStoreContainer: no-disk mode forbids local file-backed gowa database URIs: %s", trimmed)
		}
		if !isInMemoryNoDiskURI(trimmed) {
			embeddedsafe.Fatalf("InitWaStoreContainer: no-disk mode requires an in-memory gowa database URI: %s", trimmed)
		}
	}

	log = waLog.Stdout("Main", config.WhatsappLogLevel, true)
	dbLog := waLog.Stdout("Database", config.WhatsappLogLevel, true)
	dbURI = patchMemorySQLiteURI(dbURI)

	storeContainer, err := openWaStoreContainer(ctx, dbLog, dbURI)
	if err != nil {
		log.Errorf("Database initialization error: %v", err)
		return nil
	}

	log.Infof("InitWaStoreContainer: initialized WhatsApp database container for URI=%s (db=%p)", dbURI, storeContainer)
	return storeContainer
}
