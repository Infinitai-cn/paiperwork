package chatstorage

import (
	"database/sql"
	"testing"

	domainChatStorage "github.com/aldinokemal/go-whatsapp-web-multidevice/domains/chatstorage"
	_ "github.com/mattn/go-sqlite3"
)

func TestSaveDeviceRecordPreservesExistingJIDOnEmptyUpdate(t *testing.T) {
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("sql.Open() error = %v", err)
	}
	defer db.Close()

	repo := &SQLiteRepository{db: db}
	if err := repo.InitializeSchema(); err != nil {
		t.Fatalf("InitializeSchema() error = %v", err)
	}

	if err := repo.SaveDeviceRecord(&domainChatStorage.DeviceRecord{
		DeviceID:    "8619802087305:39@s.whatsapp.net",
		DisplayName: "Phone 7305",
		JID:         "8619802087305@s.whatsapp.net",
	}); err != nil {
		t.Fatalf("initial SaveDeviceRecord() error = %v", err)
	}

	if err := repo.SaveDeviceRecord(&domainChatStorage.DeviceRecord{
		DeviceID:    "8619802087305:39@s.whatsapp.net",
		DisplayName: "Phone 7305 Placeholder",
		JID:         "",
	}); err != nil {
		t.Fatalf("placeholder SaveDeviceRecord() error = %v", err)
	}

	record, err := repo.GetDeviceRecord("8619802087305:39@s.whatsapp.net")
	if err != nil {
		t.Fatalf("GetDeviceRecord() error = %v", err)
	}
	if record == nil {
		t.Fatalf("GetDeviceRecord() returned nil record")
	}
	if record.JID != "8619802087305@s.whatsapp.net" {
		t.Fatalf("record.JID = %q, want preserved paired jid", record.JID)
	}
	if record.DisplayName != "Phone 7305 Placeholder" {
		t.Fatalf("record.DisplayName = %q, want updated display name", record.DisplayName)
	}
}