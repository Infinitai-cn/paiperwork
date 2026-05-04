package usecase

import (
	"bytes"
	"compress/gzip"
	"context"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strings"
	"sync"
	"time"

	"github.com/aldinokemal/go-whatsapp-web-multidevice/config"
	domainApp "github.com/aldinokemal/go-whatsapp-web-multidevice/domains/app"
	domainChatStorage "github.com/aldinokemal/go-whatsapp-web-multidevice/domains/chatstorage"
	"github.com/aldinokemal/go-whatsapp-web-multidevice/infrastructure/whatsapp"
	pkgError "github.com/aldinokemal/go-whatsapp-web-multidevice/pkg/error"
	"github.com/aldinokemal/go-whatsapp-web-multidevice/pkg/logmask"
	"github.com/aldinokemal/go-whatsapp-web-multidevice/pkg/sqliteutil"
	"github.com/aldinokemal/go-whatsapp-web-multidevice/ui/websocket"
	"github.com/aldinokemal/go-whatsapp-web-multidevice/validations"
	"github.com/sirupsen/logrus"
	"github.com/skip2/go-qrcode"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/proto/waAdv"
	waStore "go.mau.fi/whatsmeow/store"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/util/keys"
	"google.golang.org/protobuf/proto"
)

type serviceApp struct {
	chatStorageRepo domainChatStorage.IChatStorageRepository
	deviceManager   *whatsapp.DeviceManager
	loginMu         sync.Mutex
	loginInFlight   map[string]*loginCall
}

type loginCall struct {
	done     chan struct{}
	response domainApp.LoginResponse
	err      error
}

const chatSnapshotCompressionGzipBase64 = "gzip-base64-json"

type compressedChatStoragePayload struct {
	Chats        []domainApp.SessionChatStorageChatSnapshot    `json:"chats,omitempty"`
	Messages     []domainApp.SessionChatStorageMessageSnapshot `json:"messages,omitempty"`
	DeviceRecord *domainApp.SessionChatStorageDeviceSnapshot   `json:"device_record,omitempty"`
}

func NewAppService(chatStorageRepo domainChatStorage.IChatStorageRepository, deviceManager *whatsapp.DeviceManager) domainApp.IAppUsecase {
	return &serviceApp{
		chatStorageRepo: chatStorageRepo,
		deviceManager:   deviceManager,
		loginInFlight:   make(map[string]*loginCall),
	}
}

func (service *serviceApp) Login(ctx context.Context, deviceID string) (response domainApp.LoginResponse, err error) {
	trimmedDeviceID := strings.TrimSpace(deviceID)
	call, owner := service.beginLoginCall(trimmedDeviceID)
	if !owner {
		select {
		case <-call.done:
			return call.response, call.err
		case <-ctx.Done():
			return response, ctx.Err()
		}
	}
	defer func() {
		service.finishLoginCall(trimmedDeviceID, call, response, err)
	}()

	return service.login(ctx, trimmedDeviceID)
}

func (service *serviceApp) beginLoginCall(deviceID string) (*loginCall, bool) {
	service.loginMu.Lock()
	defer service.loginMu.Unlock()

	if existing := service.loginInFlight[deviceID]; existing != nil {
		return existing, false
	}

	call := &loginCall{done: make(chan struct{})}
	service.loginInFlight[deviceID] = call
	return call, true
}

func (service *serviceApp) finishLoginCall(deviceID string, call *loginCall, response domainApp.LoginResponse, err error) {
	service.loginMu.Lock()
	defer service.loginMu.Unlock()

	if current := service.loginInFlight[deviceID]; current == call {
		current.response = response
		current.err = err
		delete(service.loginInFlight, deviceID)
		close(current.done)
	}
}

func (service *serviceApp) login(ctx context.Context, deviceID string) (response domainApp.LoginResponse, err error) {
	maskedDeviceID := logmask.MaskPhoneNumber(deviceID)
	//logrus.Infof("[LOGIN][%s] start", maskedDeviceID)
	instance, client, err := service.ensureClient(ctx, deviceID)
	if err != nil {
		logrus.Errorf("[LOGIN][%s] ensureClient failed: %v", maskedDeviceID, err)
		return response, err
	}

	if client.IsLoggedIn() {
		//logrus.Infof("[LOGIN][%s] already logged in", maskedDeviceID)
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
			//logrus.Infof("[LOGIN][%s] GetQRChannel skipped, session exists", maskedDeviceID)
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
				//logrus.Infof("[LOGIN][%s] QR event issued seq=%d issued_at=%d valid_for=%ds", maskedDeviceID, qrEventCount, response.IssuedAt, int64(response.Duration/time.Second))
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
				//logrus.Infof("[LOGIN][%s] QR event success received", maskedDeviceID)
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

	//logrus.Infof("[LOGIN][%s] login returned connected=%v loggedIn=%v", maskedDeviceID, client.IsConnected(), client.IsLoggedIn())

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
	instance, client, err := service.ensureClient(ctx, deviceID)
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

	storeState, serr := exportSQLiteSessionStoreSnapshot(ctx, store)
	if serr != nil {
		return domainApp.SessionSnapshot{}, serr
	}
	chatState, cerr := exportChatStorageSnapshot(ctx, instance, store, deviceID)
	if cerr != nil {
		return domainApp.SessionSnapshot{}, cerr
	}
	storeState.ChatStorage = chatState
	resp.StoreState = storeState

	return resp, nil
}

func (service *serviceApp) ImportSession(ctx context.Context, deviceID string, snapshot domainApp.SessionSnapshot) error {
	if strings.TrimSpace(deviceID) == "" {
		return fmt.Errorf("device id is required")
	}

	instance, client, err := service.ensureClient(ctx, deviceID)
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

	if err := importSQLiteSessionStoreSnapshot(ctx, store, snapshot.StoreState); err != nil {
		return err
	}
	if err := importChatStorageSnapshot(ctx, instance, store, deviceID, snapshot.StoreState.ChatStorage); err != nil {
		return err
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

func exportSQLiteSessionStoreSnapshot(ctx context.Context, device *waStore.Device) (domainApp.SessionStoreSnapshot, error) {
	jid := sessionStoreJID(device)
	if jid == "" {
		return domainApp.SessionStoreSnapshot{}, nil
	}

	primaryDB, err := openRuntimeSQLiteDB(config.DBURI)
	if err != nil {
		return domainApp.SessionStoreSnapshot{}, fmt.Errorf("open primary whatsapp runtime db: %w", err)
	}
	if primaryDB != nil {
		defer primaryDB.Close()
	}

	keysURI := strings.TrimSpace(config.DBKeysURI)
	if keysURI == "" {
		keysURI = config.DBURI
	}
	keysDB, err := openRuntimeSQLiteDB(keysURI)
	if err != nil {
		return domainApp.SessionStoreSnapshot{}, fmt.Errorf("open keys whatsapp runtime db: %w", err)
	}
	if keysDB != nil && keysDB != primaryDB {
		defer keysDB.Close()
	}

	var snapshot domainApp.SessionStoreSnapshot

	if keysDB != nil {
		snapshot.IdentityKeys, err = queryIdentityKeySnapshots(ctx, keysDB, jid)
		if err != nil {
			return domainApp.SessionStoreSnapshot{}, err
		}
		snapshot.Sessions, err = queryPeerSessionSnapshots(ctx, keysDB, jid)
		if err != nil {
			return domainApp.SessionStoreSnapshot{}, err
		}
		snapshot.SenderKeys, err = querySenderKeySnapshots(ctx, keysDB, jid)
		if err != nil {
			return domainApp.SessionStoreSnapshot{}, err
		}
		snapshot.MessageSecrets, err = queryMessageSecretSnapshots(ctx, keysDB, jid)
		if err != nil {
			return domainApp.SessionStoreSnapshot{}, err
		}
		snapshot.PrivacyTokens, err = queryPrivacyTokenSnapshots(ctx, keysDB, jid)
		if err != nil {
			return domainApp.SessionStoreSnapshot{}, err
		}
	}

	if primaryDB != nil {
		snapshot.PreKeys, err = queryPreKeySnapshots(ctx, primaryDB, jid)
		if err != nil {
			return domainApp.SessionStoreSnapshot{}, err
		}
		snapshot.AppStateSyncKeys, err = queryAppStateSyncKeySnapshots(ctx, primaryDB, jid)
		if err != nil {
			return domainApp.SessionStoreSnapshot{}, err
		}
		snapshot.AppStateVersions, err = queryAppStateVersionSnapshots(ctx, primaryDB, jid)
		if err != nil {
			return domainApp.SessionStoreSnapshot{}, err
		}
		snapshot.AppStateMACs, err = queryAppStateMACSnapshots(ctx, primaryDB, jid)
		if err != nil {
			return domainApp.SessionStoreSnapshot{}, err
		}
		snapshot.LIDMappings, err = queryLIDMappingSnapshots(ctx, primaryDB)
		if err != nil {
			return domainApp.SessionStoreSnapshot{}, err
		}
	}

	return snapshot, nil
}

func importSQLiteSessionStoreSnapshot(ctx context.Context, device *waStore.Device, snapshot domainApp.SessionStoreSnapshot) error {
	jid := sessionStoreJID(device)
	if jid == "" {
		return nil
	}

	primaryDB, err := openRuntimeSQLiteDB(config.DBURI)
	if err != nil {
		return fmt.Errorf("open primary whatsapp runtime db: %w", err)
	}
	if primaryDB != nil {
		defer primaryDB.Close()
	}

	keysURI := strings.TrimSpace(config.DBKeysURI)
	if keysURI == "" {
		keysURI = config.DBURI
	}
	keysDB, err := openRuntimeSQLiteDB(keysURI)
	if err != nil {
		return fmt.Errorf("open keys whatsapp runtime db: %w", err)
	}
	if keysDB != nil && keysDB != primaryDB {
		defer keysDB.Close()
	}

	if keysDB != nil {
		if err := replaceIdentityKeySnapshots(ctx, keysDB, jid, snapshot.IdentityKeys); err != nil {
			return err
		}
		if err := replacePeerSessionSnapshots(ctx, keysDB, jid, snapshot.Sessions); err != nil {
			return err
		}
		if err := replaceSenderKeySnapshots(ctx, keysDB, jid, snapshot.SenderKeys); err != nil {
			return err
		}
		if err := replaceMessageSecretSnapshots(ctx, keysDB, jid, snapshot.MessageSecrets); err != nil {
			return err
		}
		if err := replacePrivacyTokenSnapshots(ctx, keysDB, jid, snapshot.PrivacyTokens); err != nil {
			return err
		}
	}

	if primaryDB != nil {
		if err := replacePreKeySnapshots(ctx, primaryDB, jid, snapshot.PreKeys); err != nil {
			return err
		}
		if err := replaceAppStateSyncKeySnapshots(ctx, primaryDB, jid, snapshot.AppStateSyncKeys); err != nil {
			return err
		}
		if err := replaceAppStateVersionSnapshots(ctx, primaryDB, jid, snapshot.AppStateVersions); err != nil {
			return err
		}
		if err := replaceAppStateMACSnapshots(ctx, primaryDB, jid, snapshot.AppStateMACs); err != nil {
			return err
		}
		if err := replaceLIDMappingSnapshots(ctx, primaryDB, snapshot.LIDMappings); err != nil {
			return err
		}
	}

	return nil
}

func exportChatStorageSnapshot(ctx context.Context, instance *whatsapp.DeviceInstance, device *waStore.Device, requestedDeviceID string) (domainApp.SessionChatStorageSnapshot, error) {
	storageDeviceID := resolveChatStorageDeviceID(instance, device, requestedDeviceID)
	if storageDeviceID == "" {
		return domainApp.SessionChatStorageSnapshot{}, nil
	}

	chatDB, err := openRuntimeSQLiteDB(config.ChatStorageURI)
	if err != nil {
		return domainApp.SessionChatStorageSnapshot{}, fmt.Errorf("open chat storage runtime db: %w", err)
	}
	if chatDB != nil {
		defer chatDB.Close()
	}
	if chatDB == nil {
		return domainApp.SessionChatStorageSnapshot{}, nil
	}

	chatState := domainApp.SessionChatStorageSnapshot{StorageDeviceID: storageDeviceID}
	chatState.Chats, err = queryChatStorageChats(ctx, chatDB, storageDeviceID)
	if err != nil {
		return domainApp.SessionChatStorageSnapshot{}, err
	}
	chatState.Messages, err = queryChatStorageMessages(ctx, chatDB, storageDeviceID)
	if err != nil {
		return domainApp.SessionChatStorageSnapshot{}, err
	}
	chatState.DeviceRecord, err = queryChatStorageDeviceRecord(ctx, chatDB, storageDeviceID)
	if err != nil {
		return domainApp.SessionChatStorageSnapshot{}, err
	}

	compressedState, err := compressChatStorageSnapshot(chatState)
	if err != nil {
		return domainApp.SessionChatStorageSnapshot{}, err
	}

	return compressedState, nil
}

func importChatStorageSnapshot(ctx context.Context, instance *whatsapp.DeviceInstance, device *waStore.Device, requestedDeviceID string, snapshot domainApp.SessionChatStorageSnapshot) error {
	expandedSnapshot, err := expandChatStorageSnapshot(snapshot)
	if err != nil {
		return err
	}

	storageDeviceID := strings.TrimSpace(expandedSnapshot.StorageDeviceID)
	if storageDeviceID == "" {
		storageDeviceID = resolveChatStorageDeviceID(instance, device, requestedDeviceID)
	}
	if storageDeviceID == "" {
		return nil
	}

	chatDB, err := openRuntimeSQLiteDB(config.ChatStorageURI)
	if err != nil {
		return fmt.Errorf("open chat storage runtime db: %w", err)
	}
	if chatDB != nil {
		defer chatDB.Close()
	}
	if chatDB == nil {
		return nil
	}

	if err := replaceChatStorageSnapshot(ctx, chatDB, storageDeviceID, expandedSnapshot); err != nil {
		return err
	}
	return nil
}

func compressChatStorageSnapshot(snapshot domainApp.SessionChatStorageSnapshot) (domainApp.SessionChatStorageSnapshot, error) {
	if len(snapshot.Chats) == 0 && len(snapshot.Messages) == 0 && snapshot.DeviceRecord == nil {
		return snapshot, nil
	}

	payloadBytes, err := json.Marshal(compressedChatStoragePayload{
		Chats:        snapshot.Chats,
		Messages:     snapshot.Messages,
		DeviceRecord: snapshot.DeviceRecord,
	})
	if err != nil {
		return domainApp.SessionChatStorageSnapshot{}, fmt.Errorf("marshal compressed chat snapshot: %w", err)
	}

	var compressed bytes.Buffer
	gzipWriter := gzip.NewWriter(&compressed)
	if _, err := gzipWriter.Write(payloadBytes); err != nil {
		_ = gzipWriter.Close()
		return domainApp.SessionChatStorageSnapshot{}, fmt.Errorf("gzip chat snapshot: %w", err)
	}
	if err := gzipWriter.Close(); err != nil {
		return domainApp.SessionChatStorageSnapshot{}, fmt.Errorf("finalize gzip chat snapshot: %w", err)
	}

	snapshot.Compression = chatSnapshotCompressionGzipBase64
	snapshot.CompressedData = base64.StdEncoding.EncodeToString(compressed.Bytes())
	snapshot.Chats = nil
	snapshot.Messages = nil
	snapshot.DeviceRecord = nil
	return snapshot, nil
}

func expandChatStorageSnapshot(snapshot domainApp.SessionChatStorageSnapshot) (domainApp.SessionChatStorageSnapshot, error) {
	compressedData := strings.TrimSpace(snapshot.CompressedData)
	if compressedData == "" {
		return snapshot, nil
	}

	compression := strings.TrimSpace(snapshot.Compression)
	if compression == "" {
		compression = chatSnapshotCompressionGzipBase64
	}
	if compression != chatSnapshotCompressionGzipBase64 {
		return domainApp.SessionChatStorageSnapshot{}, fmt.Errorf("unsupported chat snapshot compression: %s", compression)
	}

	compressedBytes, err := base64.StdEncoding.DecodeString(compressedData)
	if err != nil {
		return domainApp.SessionChatStorageSnapshot{}, fmt.Errorf("decode compressed chat snapshot: %w", err)
	}

	gzipReader, err := gzip.NewReader(bytes.NewReader(compressedBytes))
	if err != nil {
		return domainApp.SessionChatStorageSnapshot{}, fmt.Errorf("open compressed chat snapshot: %w", err)
	}
	defer gzipReader.Close()

	payloadBytes, err := io.ReadAll(gzipReader)
	if err != nil {
		return domainApp.SessionChatStorageSnapshot{}, fmt.Errorf("read compressed chat snapshot: %w", err)
	}

	var payload compressedChatStoragePayload
	if err := json.Unmarshal(payloadBytes, &payload); err != nil {
		return domainApp.SessionChatStorageSnapshot{}, fmt.Errorf("unmarshal compressed chat snapshot: %w", err)
	}

	snapshot.Chats = payload.Chats
	snapshot.Messages = payload.Messages
	snapshot.DeviceRecord = payload.DeviceRecord
	return snapshot, nil
}

func sessionStoreJID(device *waStore.Device) string {
	if device == nil || device.ID == nil {
		return ""
	}
	return strings.TrimSpace(device.ID.String())
}

func resolveChatStorageDeviceID(instance *whatsapp.DeviceInstance, device *waStore.Device, requestedDeviceID string) string {
	if instance != nil {
		if jid := strings.TrimSpace(instance.JID()); jid != "" {
			return jid
		}
		if id := strings.TrimSpace(instance.ID()); id != "" {
			return id
		}
	}
	if device != nil && device.ID != nil {
		if nonAD := strings.TrimSpace(device.ID.ToNonAD().String()); nonAD != "" {
			return nonAD
		}
		if full := strings.TrimSpace(device.ID.String()); full != "" {
			return full
		}
	}
	return strings.TrimSpace(requestedDeviceID)
}

func openRuntimeSQLiteDB(uri string) (*sql.DB, error) {
	trimmed := strings.TrimSpace(strings.Trim(uri, `"'`))
	if trimmed == "" || !strings.HasPrefix(trimmed, "file:") {
		return nil, nil
	}
	db, err := sqliteutil.Open(trimmed)
	if err != nil {
		return nil, err
	}
	return db, nil
}

func isMissingSQLiteTable(err error) bool {
	if err == nil {
		return false
	}
	return strings.Contains(strings.ToLower(err.Error()), "no such table")
}

func queryIdentityKeySnapshots(ctx context.Context, db *sql.DB, jid string) ([]domainApp.SessionIdentityKeySnapshot, error) {
	rows, err := db.QueryContext(ctx, `SELECT their_id, identity FROM whatsmeow_identity_keys WHERE our_jid = ? ORDER BY their_id ASC`, jid)
	if err != nil {
		if isMissingSQLiteTable(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("export identity keys: %w", err)
	}
	defer rows.Close()

	out := make([]domainApp.SessionIdentityKeySnapshot, 0)
	for rows.Next() {
		var address string
		var identity []byte
		if err := rows.Scan(&address, &identity); err != nil {
			return nil, fmt.Errorf("scan identity key row: %w", err)
		}
		out = append(out, domainApp.SessionIdentityKeySnapshot{Address: address, Identity: base64.StdEncoding.EncodeToString(identity)})
	}
	return out, rows.Err()
}

func queryPeerSessionSnapshots(ctx context.Context, db *sql.DB, jid string) ([]domainApp.SessionPeerSessionSnapshot, error) {
	rows, err := db.QueryContext(ctx, `SELECT their_id, session FROM whatsmeow_sessions WHERE our_jid = ? ORDER BY their_id ASC`, jid)
	if err != nil {
		if isMissingSQLiteTable(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("export peer sessions: %w", err)
	}
	defer rows.Close()

	out := make([]domainApp.SessionPeerSessionSnapshot, 0)
	for rows.Next() {
		var address string
		var data []byte
		if err := rows.Scan(&address, &data); err != nil {
			return nil, fmt.Errorf("scan peer session row: %w", err)
		}
		out = append(out, domainApp.SessionPeerSessionSnapshot{Address: address, Data: base64.StdEncoding.EncodeToString(data)})
	}
	return out, rows.Err()
}

func querySenderKeySnapshots(ctx context.Context, db *sql.DB, jid string) ([]domainApp.SessionSenderKeySnapshot, error) {
	rows, err := db.QueryContext(ctx, `SELECT chat_id, sender_id, sender_key FROM whatsmeow_sender_keys WHERE our_jid = ? ORDER BY chat_id ASC, sender_id ASC`, jid)
	if err != nil {
		if isMissingSQLiteTable(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("export sender keys: %w", err)
	}
	defer rows.Close()

	out := make([]domainApp.SessionSenderKeySnapshot, 0)
	for rows.Next() {
		var chatID, senderID string
		var data []byte
		if err := rows.Scan(&chatID, &senderID, &data); err != nil {
			return nil, fmt.Errorf("scan sender key row: %w", err)
		}
		out = append(out, domainApp.SessionSenderKeySnapshot{ChatID: chatID, SenderID: senderID, Data: base64.StdEncoding.EncodeToString(data)})
	}
	return out, rows.Err()
}

func queryPreKeySnapshots(ctx context.Context, db *sql.DB, jid string) ([]domainApp.SessionPreKeySnapshot, error) {
	rows, err := db.QueryContext(ctx, `SELECT key_id, key, uploaded FROM whatsmeow_pre_keys WHERE jid = ? ORDER BY key_id ASC`, jid)
	if err != nil {
		if isMissingSQLiteTable(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("export prekeys: %w", err)
	}
	defer rows.Close()

	out := make([]domainApp.SessionPreKeySnapshot, 0)
	for rows.Next() {
		var keyID uint32
		var data []byte
		var uploaded bool
		if err := rows.Scan(&keyID, &data, &uploaded); err != nil {
			return nil, fmt.Errorf("scan prekey row: %w", err)
		}
		out = append(out, domainApp.SessionPreKeySnapshot{KeyID: keyID, Data: base64.StdEncoding.EncodeToString(data), Uploaded: uploaded})
	}
	return out, rows.Err()
}

func queryAppStateSyncKeySnapshots(ctx context.Context, db *sql.DB, jid string) ([]domainApp.SessionAppStateSyncKeySnapshot, error) {
	rows, err := db.QueryContext(ctx, `SELECT key_id, key_data, timestamp, fingerprint FROM whatsmeow_app_state_sync_keys WHERE jid = ? ORDER BY timestamp DESC, key_id ASC`, jid)
	if err != nil {
		if isMissingSQLiteTable(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("export app state sync keys: %w", err)
	}
	defer rows.Close()

	out := make([]domainApp.SessionAppStateSyncKeySnapshot, 0)
	for rows.Next() {
		var keyID, keyData, fingerprint []byte
		var timestamp int64
		if err := rows.Scan(&keyID, &keyData, &timestamp, &fingerprint); err != nil {
			return nil, fmt.Errorf("scan app state sync key row: %w", err)
		}
		out = append(out, domainApp.SessionAppStateSyncKeySnapshot{
			KeyID:       base64.StdEncoding.EncodeToString(keyID),
			Data:        base64.StdEncoding.EncodeToString(keyData),
			Fingerprint: base64.StdEncoding.EncodeToString(fingerprint),
			Timestamp:   timestamp,
		})
	}
	return out, rows.Err()
}

func queryAppStateVersionSnapshots(ctx context.Context, db *sql.DB, jid string) ([]domainApp.SessionAppStateVersionSnapshot, error) {
	rows, err := db.QueryContext(ctx, `SELECT name, version, hash FROM whatsmeow_app_state_version WHERE jid = ? ORDER BY name ASC`, jid)
	if err != nil {
		if isMissingSQLiteTable(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("export app state versions: %w", err)
	}
	defer rows.Close()

	out := make([]domainApp.SessionAppStateVersionSnapshot, 0)
	for rows.Next() {
		var name string
		var version uint64
		var hash []byte
		if err := rows.Scan(&name, &version, &hash); err != nil {
			return nil, fmt.Errorf("scan app state version row: %w", err)
		}
		out = append(out, domainApp.SessionAppStateVersionSnapshot{Name: name, Version: version, Hash: base64.StdEncoding.EncodeToString(hash)})
	}
	return out, rows.Err()
}

func queryAppStateMACSnapshots(ctx context.Context, db *sql.DB, jid string) ([]domainApp.SessionAppStateMutationMACSnapshot, error) {
	rows, err := db.QueryContext(ctx, `SELECT name, version, index_mac, value_mac FROM whatsmeow_app_state_mutation_macs WHERE jid = ? ORDER BY name ASC, version ASC, index_mac ASC`, jid)
	if err != nil {
		if isMissingSQLiteTable(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("export app state mutation macs: %w", err)
	}
	defer rows.Close()

	out := make([]domainApp.SessionAppStateMutationMACSnapshot, 0)
	for rows.Next() {
		var name string
		var version uint64
		var indexMAC, valueMAC []byte
		if err := rows.Scan(&name, &version, &indexMAC, &valueMAC); err != nil {
			return nil, fmt.Errorf("scan app state mutation mac row: %w", err)
		}
		out = append(out, domainApp.SessionAppStateMutationMACSnapshot{
			Name:     name,
			Version:  version,
			IndexMAC: base64.StdEncoding.EncodeToString(indexMAC),
			ValueMAC: base64.StdEncoding.EncodeToString(valueMAC),
		})
	}
	return out, rows.Err()
}

func queryMessageSecretSnapshots(ctx context.Context, db *sql.DB, jid string) ([]domainApp.SessionMessageSecretSnapshot, error) {
	rows, err := db.QueryContext(ctx, `SELECT chat_jid, sender_jid, message_id, key FROM whatsmeow_message_secrets WHERE our_jid = ? ORDER BY chat_jid ASC, sender_jid ASC, message_id ASC`, jid)
	if err != nil {
		if isMissingSQLiteTable(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("export message secrets: %w", err)
	}
	defer rows.Close()

	out := make([]domainApp.SessionMessageSecretSnapshot, 0)
	for rows.Next() {
		var chatJID, senderJID, messageID string
		var secret []byte
		if err := rows.Scan(&chatJID, &senderJID, &messageID, &secret); err != nil {
			return nil, fmt.Errorf("scan message secret row: %w", err)
		}
		out = append(out, domainApp.SessionMessageSecretSnapshot{
			ChatJID:   chatJID,
			SenderJID: senderJID,
			MessageID: messageID,
			Secret:    base64.StdEncoding.EncodeToString(secret),
		})
	}
	return out, rows.Err()
}

func queryPrivacyTokenSnapshots(ctx context.Context, db *sql.DB, jid string) ([]domainApp.SessionPrivacyTokenSnapshot, error) {
	rows, err := db.QueryContext(ctx, `SELECT their_jid, token, timestamp FROM whatsmeow_privacy_tokens WHERE our_jid = ? ORDER BY their_jid ASC`, jid)
	if err != nil {
		if isMissingSQLiteTable(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("export privacy tokens: %w", err)
	}
	defer rows.Close()

	out := make([]domainApp.SessionPrivacyTokenSnapshot, 0)
	for rows.Next() {
		var theirJID string
		var token []byte
		var timestamp int64
		if err := rows.Scan(&theirJID, &token, &timestamp); err != nil {
			return nil, fmt.Errorf("scan privacy token row: %w", err)
		}
		out = append(out, domainApp.SessionPrivacyTokenSnapshot{
			TheirJID:  theirJID,
			Token:     base64.StdEncoding.EncodeToString(token),
			Timestamp: timestamp,
		})
	}
	return out, rows.Err()
}

func queryLIDMappingSnapshots(ctx context.Context, db *sql.DB) ([]domainApp.SessionLIDMappingSnapshot, error) {
	rows, err := db.QueryContext(ctx, `SELECT lid, pn FROM whatsmeow_lid_map ORDER BY lid ASC`)
	if err != nil {
		if isMissingSQLiteTable(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("export lid mappings: %w", err)
	}
	defer rows.Close()

	out := make([]domainApp.SessionLIDMappingSnapshot, 0)
	for rows.Next() {
		var lid, pn string
		if err := rows.Scan(&lid, &pn); err != nil {
			return nil, fmt.Errorf("scan lid mapping row: %w", err)
		}
		out = append(out, domainApp.SessionLIDMappingSnapshot{LID: lid, PN: pn})
	}
	return out, rows.Err()
}

func queryChatStorageChats(ctx context.Context, db *sql.DB, storageDeviceID string) ([]domainApp.SessionChatStorageChatSnapshot, error) {
	rows, err := db.QueryContext(ctx, `SELECT jid, name, last_message_time, ephemeral_expiration, created_at, updated_at, archived FROM chats WHERE device_id = ? ORDER BY last_message_time DESC, jid ASC`, storageDeviceID)
	if err != nil {
		if isMissingSQLiteTable(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("export chat storage chats: %w", err)
	}
	defer rows.Close()

	out := make([]domainApp.SessionChatStorageChatSnapshot, 0)
	for rows.Next() {
		var jid, name string
		var lastMessageTime, createdAt, updatedAt time.Time
		var ephemeralExpiration uint32
		var archived bool
		if err := rows.Scan(&jid, &name, &lastMessageTime, &ephemeralExpiration, &createdAt, &updatedAt, &archived); err != nil {
			return nil, fmt.Errorf("scan chat storage chat row: %w", err)
		}
		out = append(out, domainApp.SessionChatStorageChatSnapshot{
			JID:                 jid,
			Name:                name,
			LastMessageTime:     lastMessageTime.UnixMilli(),
			EphemeralExpiration: ephemeralExpiration,
			CreatedAt:           createdAt.UnixMilli(),
			UpdatedAt:           updatedAt.UnixMilli(),
			Archived:            archived,
		})
	}
	return out, rows.Err()
}

func queryChatStorageMessages(ctx context.Context, db *sql.DB, storageDeviceID string) ([]domainApp.SessionChatStorageMessageSnapshot, error) {
	rows, err := db.QueryContext(ctx, `SELECT id, chat_jid, sender, content, timestamp, is_from_me, media_type, call_metadata, filename, url, media_key, file_sha256, file_enc_sha256, file_length, created_at, updated_at FROM messages WHERE device_id = ? ORDER BY timestamp ASC, id ASC`, storageDeviceID)
	if err != nil {
		if isMissingSQLiteTable(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("export chat storage messages: %w", err)
	}
	defer rows.Close()

	out := make([]domainApp.SessionChatStorageMessageSnapshot, 0)
	for rows.Next() {
		var msg domainApp.SessionChatStorageMessageSnapshot
		var timestamp, createdAt, updatedAt time.Time
		var mediaKey, fileSHA256, fileEncSHA256 []byte
		if err := rows.Scan(&msg.ID, &msg.ChatJID, &msg.Sender, &msg.Content, &timestamp, &msg.IsFromMe, &msg.MediaType, &msg.CallMetadata, &msg.Filename, &msg.URL, &mediaKey, &fileSHA256, &fileEncSHA256, &msg.FileLength, &createdAt, &updatedAt); err != nil {
			return nil, fmt.Errorf("scan chat storage message row: %w", err)
		}
		msg.Timestamp = timestamp.UnixMilli()
		msg.CreatedAt = createdAt.UnixMilli()
		msg.UpdatedAt = updatedAt.UnixMilli()
		msg.MediaKey = base64.StdEncoding.EncodeToString(mediaKey)
		msg.FileSHA256 = base64.StdEncoding.EncodeToString(fileSHA256)
		msg.FileEncSHA256 = base64.StdEncoding.EncodeToString(fileEncSHA256)
		out = append(out, msg)
	}
	return out, rows.Err()
}

func queryChatStorageDeviceRecord(ctx context.Context, db *sql.DB, storageDeviceID string) (*domainApp.SessionChatStorageDeviceSnapshot, error) {
	row := db.QueryRowContext(ctx, `SELECT device_id, display_name, jid, created_at, updated_at FROM devices WHERE device_id = ? LIMIT 1`, storageDeviceID)
	var deviceID, displayName, jid string
	var createdAt, updatedAt time.Time
	if err := row.Scan(&deviceID, &displayName, &jid, &createdAt, &updatedAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) || isMissingSQLiteTable(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("export chat storage device record: %w", err)
	}
	return &domainApp.SessionChatStorageDeviceSnapshot{
		DeviceID:    deviceID,
		DisplayName: displayName,
		JID:         jid,
		CreatedAt:   createdAt.UnixMilli(),
		UpdatedAt:   updatedAt.UnixMilli(),
	}, nil
}

func replaceIdentityKeySnapshots(ctx context.Context, db *sql.DB, jid string, entries []domainApp.SessionIdentityKeySnapshot) error {
	if _, err := db.ExecContext(ctx, `DELETE FROM whatsmeow_identity_keys WHERE our_jid = ?`, jid); err != nil && !isMissingSQLiteTable(err) {
		return fmt.Errorf("clear identity keys: %w", err)
	}
	for _, entry := range entries {
		identity, err := base64.StdEncoding.DecodeString(strings.TrimSpace(entry.Identity))
		if err != nil {
			return fmt.Errorf("decode identity key for %s: %w", entry.Address, err)
		}
		if _, err := db.ExecContext(ctx, `INSERT OR REPLACE INTO whatsmeow_identity_keys (our_jid, their_id, identity) VALUES (?, ?, ?)`, jid, entry.Address, identity); err != nil {
			return fmt.Errorf("insert identity key for %s: %w", entry.Address, err)
		}
	}
	return nil
}

func replacePeerSessionSnapshots(ctx context.Context, db *sql.DB, jid string, entries []domainApp.SessionPeerSessionSnapshot) error {
	if _, err := db.ExecContext(ctx, `DELETE FROM whatsmeow_sessions WHERE our_jid = ?`, jid); err != nil && !isMissingSQLiteTable(err) {
		return fmt.Errorf("clear peer sessions: %w", err)
	}
	for _, entry := range entries {
		data, err := base64.StdEncoding.DecodeString(strings.TrimSpace(entry.Data))
		if err != nil {
			return fmt.Errorf("decode peer session for %s: %w", entry.Address, err)
		}
		if _, err := db.ExecContext(ctx, `INSERT OR REPLACE INTO whatsmeow_sessions (our_jid, their_id, session) VALUES (?, ?, ?)`, jid, entry.Address, data); err != nil {
			return fmt.Errorf("insert peer session for %s: %w", entry.Address, err)
		}
	}
	return nil
}

func replaceSenderKeySnapshots(ctx context.Context, db *sql.DB, jid string, entries []domainApp.SessionSenderKeySnapshot) error {
	if _, err := db.ExecContext(ctx, `DELETE FROM whatsmeow_sender_keys WHERE our_jid = ?`, jid); err != nil && !isMissingSQLiteTable(err) {
		return fmt.Errorf("clear sender keys: %w", err)
	}
	for _, entry := range entries {
		data, err := base64.StdEncoding.DecodeString(strings.TrimSpace(entry.Data))
		if err != nil {
			return fmt.Errorf("decode sender key for %s/%s: %w", entry.ChatID, entry.SenderID, err)
		}
		if _, err := db.ExecContext(ctx, `INSERT OR REPLACE INTO whatsmeow_sender_keys (our_jid, chat_id, sender_id, sender_key) VALUES (?, ?, ?, ?)`, jid, entry.ChatID, entry.SenderID, data); err != nil {
			return fmt.Errorf("insert sender key for %s/%s: %w", entry.ChatID, entry.SenderID, err)
		}
	}
	return nil
}

func replacePreKeySnapshots(ctx context.Context, db *sql.DB, jid string, entries []domainApp.SessionPreKeySnapshot) error {
	if _, err := db.ExecContext(ctx, `DELETE FROM whatsmeow_pre_keys WHERE jid = ?`, jid); err != nil && !isMissingSQLiteTable(err) {
		return fmt.Errorf("clear prekeys: %w", err)
	}
	for _, entry := range entries {
		data, err := base64.StdEncoding.DecodeString(strings.TrimSpace(entry.Data))
		if err != nil {
			return fmt.Errorf("decode prekey %d: %w", entry.KeyID, err)
		}
		if _, err := db.ExecContext(ctx, `INSERT OR REPLACE INTO whatsmeow_pre_keys (jid, key_id, key, uploaded) VALUES (?, ?, ?, ?)`, jid, entry.KeyID, data, entry.Uploaded); err != nil {
			return fmt.Errorf("insert prekey %d: %w", entry.KeyID, err)
		}
	}
	return nil
}

func replaceAppStateSyncKeySnapshots(ctx context.Context, db *sql.DB, jid string, entries []domainApp.SessionAppStateSyncKeySnapshot) error {
	if _, err := db.ExecContext(ctx, `DELETE FROM whatsmeow_app_state_sync_keys WHERE jid = ?`, jid); err != nil && !isMissingSQLiteTable(err) {
		return fmt.Errorf("clear app state sync keys: %w", err)
	}
	for _, entry := range entries {
		keyID, err := base64.StdEncoding.DecodeString(strings.TrimSpace(entry.KeyID))
		if err != nil {
			return fmt.Errorf("decode app state sync key id: %w", err)
		}
		data, err := base64.StdEncoding.DecodeString(strings.TrimSpace(entry.Data))
		if err != nil {
			return fmt.Errorf("decode app state sync key data: %w", err)
		}
		fingerprint, err := base64.StdEncoding.DecodeString(strings.TrimSpace(entry.Fingerprint))
		if err != nil {
			return fmt.Errorf("decode app state sync key fingerprint: %w", err)
		}
		if _, err := db.ExecContext(ctx, `INSERT OR REPLACE INTO whatsmeow_app_state_sync_keys (jid, key_id, key_data, timestamp, fingerprint) VALUES (?, ?, ?, ?, ?)`, jid, keyID, data, entry.Timestamp, fingerprint); err != nil {
			return fmt.Errorf("insert app state sync key: %w", err)
		}
	}
	return nil
}

func replaceAppStateVersionSnapshots(ctx context.Context, db *sql.DB, jid string, entries []domainApp.SessionAppStateVersionSnapshot) error {
	if _, err := db.ExecContext(ctx, `DELETE FROM whatsmeow_app_state_version WHERE jid = ?`, jid); err != nil && !isMissingSQLiteTable(err) {
		return fmt.Errorf("clear app state versions: %w", err)
	}
	for _, entry := range entries {
		hash, err := base64.StdEncoding.DecodeString(strings.TrimSpace(entry.Hash))
		if err != nil {
			return fmt.Errorf("decode app state version hash for %s: %w", entry.Name, err)
		}
		if _, err := db.ExecContext(ctx, `INSERT OR REPLACE INTO whatsmeow_app_state_version (jid, name, version, hash) VALUES (?, ?, ?, ?)`, jid, entry.Name, entry.Version, hash); err != nil {
			return fmt.Errorf("insert app state version for %s: %w", entry.Name, err)
		}
	}
	return nil
}

func replaceAppStateMACSnapshots(ctx context.Context, db *sql.DB, jid string, entries []domainApp.SessionAppStateMutationMACSnapshot) error {
	if _, err := db.ExecContext(ctx, `DELETE FROM whatsmeow_app_state_mutation_macs WHERE jid = ?`, jid); err != nil && !isMissingSQLiteTable(err) {
		return fmt.Errorf("clear app state macs: %w", err)
	}
	for _, entry := range entries {
		indexMAC, err := base64.StdEncoding.DecodeString(strings.TrimSpace(entry.IndexMAC))
		if err != nil {
			return fmt.Errorf("decode app state index mac for %s: %w", entry.Name, err)
		}
		valueMAC, err := base64.StdEncoding.DecodeString(strings.TrimSpace(entry.ValueMAC))
		if err != nil {
			return fmt.Errorf("decode app state value mac for %s: %w", entry.Name, err)
		}
		if _, err := db.ExecContext(ctx, `INSERT INTO whatsmeow_app_state_mutation_macs (jid, name, version, index_mac, value_mac) VALUES (?, ?, ?, ?, ?)`, jid, entry.Name, entry.Version, indexMAC, valueMAC); err != nil {
			return fmt.Errorf("insert app state mac for %s: %w", entry.Name, err)
		}
	}
	return nil
}

func replaceMessageSecretSnapshots(ctx context.Context, db *sql.DB, jid string, entries []domainApp.SessionMessageSecretSnapshot) error {
	if _, err := db.ExecContext(ctx, `DELETE FROM whatsmeow_message_secrets WHERE our_jid = ?`, jid); err != nil && !isMissingSQLiteTable(err) {
		return fmt.Errorf("clear message secrets: %w", err)
	}
	for _, entry := range entries {
		secret, err := base64.StdEncoding.DecodeString(strings.TrimSpace(entry.Secret))
		if err != nil {
			return fmt.Errorf("decode message secret for %s: %w", entry.MessageID, err)
		}
		if _, err := db.ExecContext(ctx, `INSERT INTO whatsmeow_message_secrets (our_jid, chat_jid, sender_jid, message_id, key) VALUES (?, ?, ?, ?, ?)`, jid, entry.ChatJID, entry.SenderJID, entry.MessageID, secret); err != nil {
			return fmt.Errorf("insert message secret for %s: %w", entry.MessageID, err)
		}
	}
	return nil
}

func replacePrivacyTokenSnapshots(ctx context.Context, db *sql.DB, jid string, entries []domainApp.SessionPrivacyTokenSnapshot) error {
	if _, err := db.ExecContext(ctx, `DELETE FROM whatsmeow_privacy_tokens WHERE our_jid = ?`, jid); err != nil && !isMissingSQLiteTable(err) {
		return fmt.Errorf("clear privacy tokens: %w", err)
	}
	for _, entry := range entries {
		token, err := base64.StdEncoding.DecodeString(strings.TrimSpace(entry.Token))
		if err != nil {
			return fmt.Errorf("decode privacy token for %s: %w", entry.TheirJID, err)
		}
		if _, err := db.ExecContext(ctx, `INSERT INTO whatsmeow_privacy_tokens (our_jid, their_jid, token, timestamp) VALUES (?, ?, ?, ?)`, jid, entry.TheirJID, token, entry.Timestamp); err != nil {
			return fmt.Errorf("insert privacy token for %s: %w", entry.TheirJID, err)
		}
	}
	return nil
}

func replaceLIDMappingSnapshots(ctx context.Context, db *sql.DB, entries []domainApp.SessionLIDMappingSnapshot) error {
	if _, err := db.ExecContext(ctx, `DELETE FROM whatsmeow_lid_map`); err != nil && !isMissingSQLiteTable(err) {
		return fmt.Errorf("clear lid mappings: %w", err)
	}
	for _, entry := range entries {
		if _, err := db.ExecContext(ctx, `INSERT OR REPLACE INTO whatsmeow_lid_map (lid, pn) VALUES (?, ?)`, entry.LID, entry.PN); err != nil {
			return fmt.Errorf("insert lid mapping for %s: %w", entry.LID, err)
		}
	}
	return nil
}

func replaceChatStorageSnapshot(ctx context.Context, db *sql.DB, storageDeviceID string, snapshot domainApp.SessionChatStorageSnapshot) error {
	if _, err := db.ExecContext(ctx, `DELETE FROM messages WHERE device_id = ?`, storageDeviceID); err != nil && !isMissingSQLiteTable(err) {
		return fmt.Errorf("clear chat storage messages: %w", err)
	}
	if _, err := db.ExecContext(ctx, `DELETE FROM chats WHERE device_id = ?`, storageDeviceID); err != nil && !isMissingSQLiteTable(err) {
		return fmt.Errorf("clear chat storage chats: %w", err)
	}
	if _, err := db.ExecContext(ctx, `DELETE FROM devices WHERE device_id = ?`, storageDeviceID); err != nil && !isMissingSQLiteTable(err) {
		return fmt.Errorf("clear chat storage device record: %w", err)
	}

	for _, chat := range snapshot.Chats {
		if _, err := db.ExecContext(ctx, `INSERT OR REPLACE INTO chats (jid, device_id, name, last_message_time, ephemeral_expiration, created_at, updated_at, archived) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, chat.JID, storageDeviceID, chat.Name, time.UnixMilli(chat.LastMessageTime), chat.EphemeralExpiration, time.UnixMilli(chat.CreatedAt), time.UnixMilli(chat.UpdatedAt), chat.Archived); err != nil {
			return fmt.Errorf("insert chat storage chat %s: %w", chat.JID, err)
		}
	}

	for _, msg := range snapshot.Messages {
		mediaKey, err := base64.StdEncoding.DecodeString(strings.TrimSpace(msg.MediaKey))
		if err != nil {
			return fmt.Errorf("decode media key for message %s: %w", msg.ID, err)
		}
		fileSHA256, err := base64.StdEncoding.DecodeString(strings.TrimSpace(msg.FileSHA256))
		if err != nil {
			return fmt.Errorf("decode file sha for message %s: %w", msg.ID, err)
		}
		fileEncSHA256, err := base64.StdEncoding.DecodeString(strings.TrimSpace(msg.FileEncSHA256))
		if err != nil {
			return fmt.Errorf("decode file enc sha for message %s: %w", msg.ID, err)
		}
		if _, err := db.ExecContext(ctx, `INSERT OR REPLACE INTO messages (id, chat_jid, device_id, sender, content, timestamp, is_from_me, media_type, call_metadata, filename, url, media_key, file_sha256, file_enc_sha256, file_length, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, msg.ID, msg.ChatJID, storageDeviceID, msg.Sender, msg.Content, time.UnixMilli(msg.Timestamp), msg.IsFromMe, msg.MediaType, msg.CallMetadata, msg.Filename, msg.URL, mediaKey, fileSHA256, fileEncSHA256, msg.FileLength, time.UnixMilli(msg.CreatedAt), time.UnixMilli(msg.UpdatedAt)); err != nil {
			return fmt.Errorf("insert chat storage message %s: %w", msg.ID, err)
		}
	}

	if snapshot.DeviceRecord != nil {
		record := snapshot.DeviceRecord
		deviceID := strings.TrimSpace(record.DeviceID)
		if deviceID == "" {
			deviceID = storageDeviceID
		}
		if _, err := db.ExecContext(ctx, `INSERT OR REPLACE INTO devices (device_id, display_name, jid, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`, deviceID, record.DisplayName, record.JID, time.UnixMilli(record.CreatedAt), time.UnixMilli(record.UpdatedAt)); err != nil {
			return fmt.Errorf("insert chat storage device record %s: %w", deviceID, err)
		}
	}

	return nil
}
