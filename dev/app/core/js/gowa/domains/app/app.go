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

	Platform              string `json:"platform,omitempty"`
	BusinessName          string `json:"business_name,omitempty"`
	PushName              string `json:"push_name,omitempty"`
	LIDMigrationTimestamp int64  `json:"lid_migration_timestamp,omitempty"`
	FacebookUUID          string `json:"facebook_uuid,omitempty"`
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
}
