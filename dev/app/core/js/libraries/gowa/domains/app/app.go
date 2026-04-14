package app

import (
	"context"
	"time"
)

type IAppUsecase interface {
	Login(ctx context.Context, deviceID string) (response LoginResponse, err error)
	LoginWithCode(ctx context.Context, deviceID string, phoneNumber string) (loginCode string, err error)
	Logout(ctx context.Context, deviceID string) (err error)
	Reconnect(ctx context.Context, deviceID string) (err error)
	Status(ctx context.Context, deviceID string) (isConnected bool, isLoggedIn bool, err error)
	FirstDevice(ctx context.Context) (response DevicesResponse, err error)
	FetchDevices(ctx context.Context) (response []DevicesResponse, err error)
	ExportSession(ctx context.Context, deviceID string) (response SessionSnapshot, err error)
	ImportSession(ctx context.Context, deviceID string, snapshot SessionSnapshot) (err error)
	ClearSession(ctx context.Context, deviceID string) (err error)
}

type SessionSignedPreKeySnapshot struct {
	KeyID      uint32 `json:"key_id"`
	PublicKey  string `json:"public_key"`
	PrivateKey string `json:"private_key"`
	Signature  string `json:"signature"`
}

type SessionIdentityKeySnapshot struct {
	Address  string `json:"address"`
	Identity string `json:"identity"`
}

type SessionPeerSessionSnapshot struct {
	Address string `json:"address"`
	Data    string `json:"data"`
}

type SessionSenderKeySnapshot struct {
	ChatID   string `json:"chat_id"`
	SenderID string `json:"sender_id"`
	Data     string `json:"data"`
}

type SessionPreKeySnapshot struct {
	KeyID    uint32 `json:"key_id"`
	Data     string `json:"data"`
	Uploaded bool   `json:"uploaded"`
}

type SessionAppStateSyncKeySnapshot struct {
	KeyID       string `json:"key_id"`
	Data        string `json:"data"`
	Fingerprint string `json:"fingerprint"`
	Timestamp   int64  `json:"timestamp"`
}

type SessionAppStateVersionSnapshot struct {
	Name    string `json:"name"`
	Version uint64 `json:"version"`
	Hash    string `json:"hash"`
}

type SessionAppStateMutationMACSnapshot struct {
	Name     string `json:"name"`
	Version  uint64 `json:"version"`
	IndexMAC string `json:"index_mac"`
	ValueMAC string `json:"value_mac"`
}

type SessionMessageSecretSnapshot struct {
	ChatJID   string `json:"chat_jid"`
	SenderJID string `json:"sender_jid"`
	MessageID string `json:"message_id"`
	Secret    string `json:"secret"`
}

type SessionPrivacyTokenSnapshot struct {
	TheirJID  string `json:"their_jid"`
	Token     string `json:"token"`
	Timestamp int64  `json:"timestamp"`
}

type SessionLIDMappingSnapshot struct {
	LID string `json:"lid"`
	PN  string `json:"pn"`
}

type SessionChatStorageChatSnapshot struct {
	JID                 string `json:"jid"`
	Name                string `json:"name"`
	LastMessageTime     int64  `json:"last_message_time"`
	EphemeralExpiration uint32 `json:"ephemeral_expiration"`
	CreatedAt           int64  `json:"created_at"`
	UpdatedAt           int64  `json:"updated_at"`
	Archived            bool   `json:"archived"`
}

type SessionChatStorageMessageSnapshot struct {
	ID            string `json:"id"`
	ChatJID       string `json:"chat_jid"`
	Sender        string `json:"sender"`
	Content       string `json:"content"`
	Timestamp     int64  `json:"timestamp"`
	IsFromMe      bool   `json:"is_from_me"`
	MediaType     string `json:"media_type"`
	CallMetadata  string `json:"call_metadata"`
	Filename      string `json:"filename"`
	URL           string `json:"url"`
	MediaKey      string `json:"media_key"`
	FileSHA256    string `json:"file_sha256"`
	FileEncSHA256 string `json:"file_enc_sha256"`
	FileLength    uint64 `json:"file_length"`
	CreatedAt     int64  `json:"created_at"`
	UpdatedAt     int64  `json:"updated_at"`
}

type SessionChatStorageDeviceSnapshot struct {
	DeviceID    string `json:"device_id"`
	DisplayName string `json:"display_name"`
	JID         string `json:"jid"`
	CreatedAt   int64  `json:"created_at"`
	UpdatedAt   int64  `json:"updated_at"`
}

type SessionChatStorageSnapshot struct {
	StorageDeviceID string                              `json:"storage_device_id"`
	Compression     string                              `json:"compression,omitempty"`
	CompressedData  string                              `json:"compressed_data,omitempty"`
	Chats           []SessionChatStorageChatSnapshot    `json:"chats,omitempty"`
	Messages        []SessionChatStorageMessageSnapshot `json:"messages,omitempty"`
	DeviceRecord    *SessionChatStorageDeviceSnapshot   `json:"device_record,omitempty"`
}

type SessionStoreSnapshot struct {
	IdentityKeys     []SessionIdentityKeySnapshot         `json:"identity_keys,omitempty"`
	Sessions         []SessionPeerSessionSnapshot         `json:"sessions,omitempty"`
	SenderKeys       []SessionSenderKeySnapshot           `json:"sender_keys,omitempty"`
	PreKeys          []SessionPreKeySnapshot              `json:"pre_keys,omitempty"`
	AppStateSyncKeys []SessionAppStateSyncKeySnapshot     `json:"app_state_sync_keys,omitempty"`
	AppStateVersions []SessionAppStateVersionSnapshot     `json:"app_state_versions,omitempty"`
	AppStateMACs     []SessionAppStateMutationMACSnapshot `json:"app_state_macs,omitempty"`
	MessageSecrets   []SessionMessageSecretSnapshot       `json:"message_secrets,omitempty"`
	PrivacyTokens    []SessionPrivacyTokenSnapshot        `json:"privacy_tokens,omitempty"`
	LIDMappings      []SessionLIDMappingSnapshot          `json:"lid_mappings,omitempty"`
	ChatStorage      SessionChatStorageSnapshot           `json:"chat_storage,omitempty"`
}

type SessionSnapshot struct {
	DeviceID string `json:"device_id"`
	LID      string `json:"lid,omitempty"`

	NoisePublicKey  string `json:"noise_public_key,omitempty"`
	NoisePrivateKey string `json:"noise_private_key,omitempty"`

	IdentityPublicKey  string `json:"identity_public_key,omitempty"`
	IdentityPrivateKey string `json:"identity_private_key,omitempty"`

	SignedPreKey SessionSignedPreKeySnapshot `json:"signed_pre_key,omitempty"`

	RegistrationID uint32 `json:"registration_id,omitempty"`
	AdvSecretKey   string `json:"adv_secret_key,omitempty"`
	AccountProto   string `json:"account_proto,omitempty"`

	Platform              string               `json:"platform,omitempty"`
	BusinessName          string               `json:"business_name,omitempty"`
	PushName              string               `json:"push_name,omitempty"`
	LIDMigrationTimestamp int64                `json:"lid_migration_timestamp,omitempty"`
	FacebookUUID          string               `json:"facebook_uuid,omitempty"`
	StoreState            SessionStoreSnapshot `json:"store_state,omitempty"`
}

type DevicesResponse struct {
	Name   string `json:"name"`
	Device string `json:"device"`
}

type LoginResponse struct {
	ImagePath string        `json:"image_path"`
	Duration  time.Duration `json:"duration"`
	Code      string        `json:"code"`
	ImageData string        `json:"image_data,omitempty"`
	IssuedAt  int64         `json:"issued_at,omitempty"`
}
