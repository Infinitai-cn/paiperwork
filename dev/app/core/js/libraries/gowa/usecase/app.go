package usecase

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"
	"time"

	domainApp "github.com/aldinokemal/go-whatsapp-web-multidevice/domains/app"
	domainChatStorage "github.com/aldinokemal/go-whatsapp-web-multidevice/domains/chatstorage"
	"github.com/aldinokemal/go-whatsapp-web-multidevice/infrastructure/whatsapp"
	pkgError "github.com/aldinokemal/go-whatsapp-web-multidevice/pkg/error"
	"github.com/aldinokemal/go-whatsapp-web-multidevice/pkg/logmask"
	"github.com/aldinokemal/go-whatsapp-web-multidevice/ui/websocket"
	"github.com/aldinokemal/go-whatsapp-web-multidevice/validations"
	_ "github.com/mattn/go-sqlite3"
	"github.com/sirupsen/logrus"
	"github.com/skip2/go-qrcode"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/proto/waAdv"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/util/keys"
	"google.golang.org/protobuf/proto"
)

type serviceApp struct {
	chatStorageRepo domainChatStorage.IChatStorageRepository
	deviceManager   *whatsapp.DeviceManager
}

func NewAppService(chatStorageRepo domainChatStorage.IChatStorageRepository, deviceManager *whatsapp.DeviceManager) domainApp.IAppUsecase {
	return &serviceApp{
		chatStorageRepo: chatStorageRepo,
		deviceManager:   deviceManager,
	}
}

func (service *serviceApp) Login(ctx context.Context, deviceID string) (response domainApp.LoginResponse, err error) {
	maskedDeviceID := logmask.MaskPhoneNumber(deviceID)
	logrus.Infof("[LOGIN][%s] start", maskedDeviceID)
	instance, client, err := service.ensureClient(ctx, deviceID)
	if err != nil {
		logrus.Errorf("[LOGIN][%s] ensureClient failed: %v", maskedDeviceID, err)
		return response, err
	}

	if client.IsLoggedIn() {
		logrus.Infof("[LOGIN][%s] already logged in", maskedDeviceID)
		instance.UpdateStateFromClient()
		return response, pkgError.ErrAlreadyLoggedIn
	}

	// Disconnect first to ensure QR flow starts cleanly.
	logrus.Debugf("[LOGIN][%s] disconnecting client before QR flow", maskedDeviceID)
	client.Disconnect()

	// Use a detached context for the QR channel so the pairing session
	// survives after the HTTP response is sent. The HTTP request context
	// has a short timeout (e.g. 45s) which would cancel the QR emitter
	// and disconnect the client before the user can scan the code.
	// Total QR window: ~160s (first code 60s + five codes at 20s each).
	qrCtx, qrCancel := context.WithTimeout(context.Background(), 3*time.Minute)

	chImage := make(chan string, 1) // Buffered to prevent goroutine leak
	qrEventCount := 0
	logrus.Debugf("[LOGIN][%s] requesting QR channel", maskedDeviceID)
	ch, err := client.GetQRChannel(qrCtx)
	if err != nil {
		qrCancel()
		if errors.Is(err, whatsmeow.ErrQRStoreContainsID) {
			logrus.Infof("[LOGIN][%s] GetQRChannel skipped, session exists", maskedDeviceID)
			_ = client.Connect()
			instance.UpdateStateFromClient()
			if client.IsLoggedIn() {
				return response, pkgError.ErrAlreadyLoggedIn
			}
			return response, pkgError.ErrSessionSaved
		}
		logrus.Errorf("[LOGIN][%s] GetQRChannel failed: %v", maskedDeviceID, err)
		return response, pkgError.ErrQrChannel
	}

	go func() {
		defer qrCancel()
		defer close(chImage) // Ensure channel is closed when done
		for evt := range ch {
			response.Code = evt.Code
			response.Duration = 20 * time.Second
			if evt.Event == "code" {
				response.IssuedAt = time.Now().UnixMilli()
				qrEventCount++
				logrus.Infof("[LOGIN][%s] QR event issued seq=%d issued_at=%d valid_for=%ds", maskedDeviceID, qrEventCount, response.IssuedAt, int64(response.Duration/time.Second))
				// Generate PNG in-memory and return as base64 data URL so
				// the gateway does not write QR images to disk.
				png, perr := qrcode.Encode(evt.Code, qrcode.Medium, 512)
				if perr != nil {
					logrus.Errorf("[LOGIN][%s] Error when encode qr to PNG: %v", maskedDeviceID, perr)
					continue
				}
				b64 := base64.StdEncoding.EncodeToString(png)
				dataURL := "data:image/png;base64," + b64
				select {
				case chImage <- dataURL:
				case <-qrCtx.Done():
					logrus.Debugf("[LOGIN][%s] QR context canceled while sending QR data", maskedDeviceID)
					return
				}
			} else if evt.Event == "success" {
				logrus.Infof("[LOGIN][%s] QR event success received", maskedDeviceID)
				return
			} else if evt.Error != nil {
				logrus.Errorf("[LOGIN][%s] error when get qrCode %s %v", maskedDeviceID, evt.Event, evt.Error)
			} else {
				logrus.Warnf("[LOGIN][%s] non-error QR event %s with nil error", maskedDeviceID, evt.Event)
			}
		}
	}()

	logrus.Debugf("[LOGIN][%s] connecting client", maskedDeviceID)
	if err = client.Connect(); err != nil {
		qrCancel()
		logrus.Errorf("[LOGIN][%s] client.Connect failed: %v", maskedDeviceID, err)
		return response, pkgError.ErrReconnect
	}

	logrus.Debugf("[LOGIN][%s] client connected", maskedDeviceID)
	instance.UpdateStateFromClient()

	logrus.Infof("[LOGIN][%s] login returned connected=%v loggedIn=%v", maskedDeviceID, client.IsConnected(), client.IsLoggedIn())

	// Wait for QR image with timeout to prevent hanging
	select {
	case imagePath, ok := <-chImage:
		if !ok {
			return response, fmt.Errorf("QR channel closed without receiving image")
		}
		// imagePath contains an inlined data URL (base64 PNG)
		response.ImageData = imagePath
	case <-ctx.Done():
		return response, ctx.Err()
	case <-time.After(120 * time.Second):
		return response, fmt.Errorf("timeout waiting for QR code")
	}

	return response, nil
}

func (service *serviceApp) LoginWithCode(ctx context.Context, deviceID string, phoneNumber string) (loginCode string, err error) {
	if err = validations.ValidateLoginWithCode(ctx, phoneNumber); err != nil {
		logrus.Errorf("Error when validate login with code: %s", err.Error())
		return loginCode, err
	}

	instance, client, err := service.ensureClient(ctx, deviceID)
	if err != nil {
		return loginCode, err
	}

	if client.IsLoggedIn() {
		instance.UpdateStateFromClient()
		return loginCode, pkgError.ErrAlreadyLoggedIn
	}

	// Connect before requesting pairing code.
	if !client.IsConnected() {
		if err = client.Connect(); err != nil {
			return loginCode, err
		}
	}

	logrus.Infof("[LOGIN_CODE][%s] Starting phone pairing for number: %s", logmask.MaskPhoneNumber(deviceID), logmask.MaskPhoneNumber(phoneNumber))
	loginCode, err = client.PairPhone(ctx, phoneNumber, true, whatsmeow.PairClientChrome, "Chrome (Linux)")
	if err != nil {
		logrus.Errorf("Error when pairing phone: %s", err.Error())
		return loginCode, err
	}

	instance.UpdateStateFromClient()
	logrus.Infof("Successfully paired phone with code: %s", loginCode)
	return loginCode, nil
}

func (service *serviceApp) Logout(ctx context.Context, deviceID string) error {
	if service.deviceManager == nil {
		return fmt.Errorf("device manager not initialized")
	}

	if err := service.deviceManager.PurgeDevice(ctx, deviceID); err != nil {
		logrus.WithError(err).Warnf("[LOGOUT][%s] purge completed with warnings", logmask.MaskPhoneNumber(deviceID))
		return err
	}

	// Broadcast device removal so UI can refresh without manual polling
	var devices []domainApp.DevicesResponse
	if list, err := service.FetchDevices(ctx); err == nil {
		devices = list
	} else {
		logrus.WithError(err).Warn("[LOGOUT] failed to fetch devices after purge")
	}

	websocket.Broadcast <- websocket.BroadcastMessage{
		Code:    "DEVICE_REMOVED",
		Message: fmt.Sprintf("Device %s logged out and removed", deviceID),
		Result: map[string]any{
			"device_id": deviceID,
			"devices":   devices,
		},
	}

	return nil
}

func (service *serviceApp) Reconnect(ctx context.Context, deviceID string) (err error) {
	maskedDeviceID := logmask.MaskPhoneNumber(deviceID)
	logrus.Infof("[RECONNECT][%s] begin", maskedDeviceID)
	if ctx == nil {
		ctx = context.Background()
	}
	if err := ctx.Err(); err != nil {
		return err
	}
	instance, client, err := service.ensureClient(ctx, deviceID)
	if err != nil {
		logrus.Errorf("[RECONNECT][%s] ensureClient failed: %v", maskedDeviceID, err)
		return err
	}

	if client.Store == nil || client.Store.ID == nil {
		logrus.Warnf("[RECONNECT][%s] device %s is not logged in (session deleted)", maskedDeviceID, maskedDeviceID)
		return fmt.Errorf("device %s is not logged in (session deleted)", deviceID)
	}

	logrus.Debugf("[RECONNECT][%s] disconnecting client", maskedDeviceID)
	client.Disconnect()
	if err := ctx.Err(); err != nil {
		return err
	}

	logrus.Debugf("[RECONNECT][%s] connecting client", maskedDeviceID)
	err = client.Connect()
	if err != nil {
		logrus.Errorf("[RECONNECT][%s] Connect failed: %v", maskedDeviceID, err)
		return err
	}

	logrus.Debugf("[RECONNECT][%s] updating state from client", maskedDeviceID)
	instance.UpdateStateFromClient()

	logrus.Infof("[RECONNECT][%s] completed connected=%v loggedIn=%v", maskedDeviceID, client.IsConnected(), client.IsLoggedIn())
	return nil
}

func (service *serviceApp) Status(_ context.Context, deviceID string) (bool, bool, error) {
	if service.deviceManager == nil {
		return false, false, fmt.Errorf("device manager not initialized")
	}

	instance, ok := service.deviceManager.GetDevice(deviceID)
	if !ok || instance == nil {
		return false, false, fmt.Errorf("device %s not found", deviceID)
	}

	instance.UpdateStateFromClient()
	client := instance.GetClient()
	if client == nil {
		return false, false, nil
	}

	if client.Store == nil || client.Store.ID == nil {
		return false, false, nil
	}

	return client.IsConnected(), client.IsLoggedIn(), nil
}

func (service *serviceApp) FirstDevice(ctx context.Context) (response domainApp.DevicesResponse, err error) {
	devices, err := service.FetchDevices(ctx)
	if err != nil {
		return response, err
	}
	if len(devices) == 0 {
		return response, fmt.Errorf("no devices available")
	}
	return devices[0], nil
}

func (service *serviceApp) FetchDevices(_ context.Context) (response []domainApp.DevicesResponse, err error) {
	if service.deviceManager == nil {
		return response, fmt.Errorf("device manager not initialized")
	}

	for _, inst := range service.deviceManager.ListDevices() {
		inst.UpdateStateFromClient()
		name := inst.DisplayName()
		if name == "" {
			name = inst.PhoneNumber()
		}

		response = append(response, domainApp.DevicesResponse{
			Name:   name,
			Device: inst.ID(),
		})
	}

	return response, nil
}

func (service *serviceApp) ensureClient(ctx context.Context, deviceID string) (*whatsapp.DeviceInstance, *whatsmeow.Client, error) {
	if deviceID == "" {
		return nil, nil, fmt.Errorf("device id is required")
	}

	if service.deviceManager == nil {
		return nil, nil, fmt.Errorf("device manager not initialized")
	}

	instance, err := service.deviceManager.EnsureClient(ctx, deviceID)
	if err != nil {
		return nil, nil, err
	}

	client := instance.GetClient()
	if client == nil {
		return instance, nil, pkgError.ErrWaCLI
	}

	return instance, client, nil
}

func (service *serviceApp) ExportSession(ctx context.Context, deviceID string) (domainApp.SessionSnapshot, error) {
	_, client, err := service.ensureClient(ctx, deviceID)
	if err != nil {
		return domainApp.SessionSnapshot{}, err
	}

	if client.Store == nil {
		return domainApp.SessionSnapshot{}, fmt.Errorf("device %s has no store", deviceID)
	}

	store := client.Store
	resp := domainApp.SessionSnapshot{
		DeviceID:              deviceID,
		RegistrationID:        store.RegistrationID,
		Platform:              store.Platform,
		BusinessName:          store.BusinessName,
		PushName:              store.PushName,
		LIDMigrationTimestamp: store.LIDMigrationTimestamp,
	}

	if store.ID != nil {
		resp.DeviceID = store.ID.String()
	}
	if !store.LID.IsEmpty() {
		resp.LID = store.LID.String()
	}
	if store.FacebookUUID.String() != "00000000-0000-0000-0000-000000000000" {
		resp.FacebookUUID = store.FacebookUUID.String()
	}

	if store.NoiseKey != nil {
		resp.NoisePublicKey = encodeKey32(store.NoiseKey.Pub)
		resp.NoisePrivateKey = encodeKey32(store.NoiseKey.Priv)
	}
	if store.IdentityKey != nil {
		resp.IdentityPublicKey = encodeKey32(store.IdentityKey.Pub)
		resp.IdentityPrivateKey = encodeKey32(store.IdentityKey.Priv)
	}
	if store.SignedPreKey != nil {
		resp.SignedPreKey = domainApp.SessionSignedPreKeySnapshot{
			KeyID:      store.SignedPreKey.KeyID,
			PublicKey:  encodeKey32(store.SignedPreKey.Pub),
			PrivateKey: encodeKey32(store.SignedPreKey.Priv),
			Signature:  encodeKey64(store.SignedPreKey.Signature),
		}
	}

	if len(store.AdvSecretKey) > 0 {
		resp.AdvSecretKey = base64.StdEncoding.EncodeToString(store.AdvSecretKey)
	}
	if store.Account != nil {
		accBytes, merr := proto.Marshal(store.Account)
		if merr != nil {
			return domainApp.SessionSnapshot{}, fmt.Errorf("marshal account: %w", merr)
		}
		resp.AccountProto = base64.StdEncoding.EncodeToString(accBytes)
	}

	return resp, nil
}

func (service *serviceApp) ImportSession(ctx context.Context, deviceID string, snapshot domainApp.SessionSnapshot) error {
	if strings.TrimSpace(deviceID) == "" {
		return fmt.Errorf("device id is required")
	}

	_, client, err := service.ensureClient(ctx, deviceID)
	if err != nil {
		return err
	}
	if client.Store == nil {
		return fmt.Errorf("device %s has no store", deviceID)
	}

	store := client.Store

	if id := strings.TrimSpace(snapshot.DeviceID); id != "" {
		jid, jerr := types.ParseJID(id)
		if jerr != nil {
			return fmt.Errorf("invalid device JID %q: %w", id, jerr)
		}
		store.ID = &jid
	}
	if lid := strings.TrimSpace(snapshot.LID); lid != "" {
		parsedLID, lerr := types.ParseJID(lid)
		if lerr != nil {
			return fmt.Errorf("invalid LID %q: %w", lid, lerr)
		}
		store.LID = parsedLID
	}

	noiseKey, nerr := decodeKeyPair(snapshot.NoisePublicKey, snapshot.NoisePrivateKey)
	if nerr != nil {
		return fmt.Errorf("invalid noise key pair: %w", nerr)
	}
	if noiseKey != nil {
		store.NoiseKey = noiseKey
	}

	identityKey, ierr := decodeKeyPair(snapshot.IdentityPublicKey, snapshot.IdentityPrivateKey)
	if ierr != nil {
		return fmt.Errorf("invalid identity key pair: %w", ierr)
	}
	if identityKey != nil {
		store.IdentityKey = identityKey
	}

	if snapshot.SignedPreKey.KeyID != 0 || snapshot.SignedPreKey.PublicKey != "" || snapshot.SignedPreKey.PrivateKey != "" {
		signedPreKeyPair, sperr := decodeKeyPair(snapshot.SignedPreKey.PublicKey, snapshot.SignedPreKey.PrivateKey)
		if sperr != nil {
			return fmt.Errorf("invalid signed pre-key pair: %w", sperr)
		}
		if signedPreKeyPair != nil {
			signedPreKey := &keys.PreKey{KeyPair: *signedPreKeyPair, KeyID: snapshot.SignedPreKey.KeyID}
			if sig := strings.TrimSpace(snapshot.SignedPreKey.Signature); sig != "" {
				signature, sigErr := decodeKey64(sig)
				if sigErr != nil {
					return fmt.Errorf("invalid signed pre-key signature: %w", sigErr)
				}
				signedPreKey.Signature = signature
			}
			store.SignedPreKey = signedPreKey
		}
	}

	store.RegistrationID = snapshot.RegistrationID
	store.Platform = snapshot.Platform
	store.BusinessName = snapshot.BusinessName
	store.PushName = snapshot.PushName
	store.LIDMigrationTimestamp = snapshot.LIDMigrationTimestamp

	if secret := strings.TrimSpace(snapshot.AdvSecretKey); secret != "" {
		secretBytes, derr := base64.StdEncoding.DecodeString(secret)
		if derr != nil {
			return fmt.Errorf("invalid adv secret key: %w", derr)
		}
		store.AdvSecretKey = secretBytes
	}

	if account := strings.TrimSpace(snapshot.AccountProto); account != "" {
		accBytes, derr := base64.StdEncoding.DecodeString(account)
		if derr != nil {
			return fmt.Errorf("invalid account proto: %w", derr)
		}
		acc := &waAdv.ADVSignedDeviceIdentity{}
		if uerr := proto.Unmarshal(accBytes, acc); uerr != nil {
			return fmt.Errorf("unmarshal account proto: %w", uerr)
		}
		store.Account = acc
	}

	if err := store.Save(ctx); err != nil {
		return fmt.Errorf("save imported session: %w", err)
	}

	if instance, ok := service.deviceManager.GetDevice(deviceID); ok && instance != nil {
		instance.UpdateStateFromClient()
	}

	return nil
}

func (service *serviceApp) ClearSession(ctx context.Context, deviceID string) error {
	if strings.TrimSpace(deviceID) == "" {
		return fmt.Errorf("device id is required")
	}

	if service.deviceManager == nil {
		return fmt.Errorf("device manager not initialized")
	}

	if err := service.deviceManager.PurgeDevice(ctx, deviceID); err != nil {
		return err
	}

	_, err := service.deviceManager.CreateDevice(ctx, deviceID)
	return err
}

func encodeKey32(value *[32]byte) string {
	if value == nil {
		return ""
	}
	return base64.StdEncoding.EncodeToString(value[:])
}

func encodeKey64(value *[64]byte) string {
	if value == nil {
		return ""
	}
	return base64.StdEncoding.EncodeToString(value[:])
}

func decodeKey32(value string) (*[32]byte, error) {
	raw, err := base64.StdEncoding.DecodeString(strings.TrimSpace(value))
	if err != nil {
		return nil, err
	}
	if len(raw) != 32 {
		return nil, fmt.Errorf("expected 32-byte value, got %d", len(raw))
	}
	decoded := [32]byte{}
	copy(decoded[:], raw)
	return &decoded, nil
}

func decodeKey64(value string) (*[64]byte, error) {
	raw, err := base64.StdEncoding.DecodeString(strings.TrimSpace(value))
	if err != nil {
		return nil, err
	}
	if len(raw) != 64 {
		return nil, fmt.Errorf("expected 64-byte value, got %d", len(raw))
	}
	decoded := [64]byte{}
	copy(decoded[:], raw)
	return &decoded, nil
}

func decodeKeyPair(pub, priv string) (*keys.KeyPair, error) {
	trimmedPub := strings.TrimSpace(pub)
	trimmedPriv := strings.TrimSpace(priv)
	if trimmedPub == "" && trimmedPriv == "" {
		return nil, nil
	}
	if trimmedPub == "" || trimmedPriv == "" {
		return nil, fmt.Errorf("both public and private key are required")
	}

	pubValue, err := decodeKey32(trimmedPub)
	if err != nil {
		return nil, err
	}
	privValue, err := decodeKey32(trimmedPriv)
	if err != nil {
		return nil, err
	}

	return &keys.KeyPair{Pub: pubValue, Priv: privValue}, nil
}
